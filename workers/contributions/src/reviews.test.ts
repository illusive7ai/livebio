import { describe, expect, it } from 'vitest';
import { handle, type CacheLike, type Env } from './handler';

const TOKEN = 'ghp_SUPERSECRET123';
const env: Env = { GITHUB_TOKEN: TOKEN, ALLOWED_ORIGINS: 'https://app.example' };
const ORIGIN = 'https://app.example';

class MemoryCache implements CacheLike {
  readonly store = new Map<string, Response>();
  async match(request: Request) {
    return this.store.get(request.url)?.clone();
  }
  async put(request: Request, response: Response) {
    this.store.set(request.url, response);
  }
}

const form = (rating: string, text: string) =>
  `### How would you rate it?\n\n${rating}\n\n### What was it like?\n\n${text}\n\n### Showing it on the website\n\n- [x] You may show this review.`;

const issues = [
  { number: 4, user: { login: 'spammer' }, author_association: 'NONE', labels: [{ name: 'hidden' }], body: form('5 - Loved it', 'Buy my thing') },
  { number: 5, user: { login: 'robot', type: 'Bot' }, author_association: 'NONE', labels: [], body: form('5 - Loved it', 'Beep') },
  { number: 3, user: { login: 'zed' }, author_association: 'NONE', labels: [{ name: 'approved' }], body: form('4 - Good', 'Worked well') },
  { number: 2, user: { login: 'stranger' }, author_association: 'NONE', labels: [], body: form('5 - Loved it', 'Works for me') },
  { number: 1, user: { login: 'octocat' }, author_association: 'OWNER', labels: [], body: form('5 - Loved it', 'My own review') },
];

function upstream(reply: () => Response) {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fetcher = (async (url: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    return reply();
  }) as typeof fetch;
  return { fetcher, calls };
}

const ok = () => new Response(JSON.stringify(issues));
const get = (headers: Record<string, string> = {}) => new Request('https://worker.example/reviews', { headers });
const everything = async (r: Response) => `${r.status} ${[...r.headers].join(';')} ${await r.clone().text()}`;

describe('GET /reviews', () => {
  it('returns every real user’s review, and leaves out hidden ones and bots', async () => {
    const { fetcher } = upstream(ok);
    const response = await handle(get(), env, { fetch: fetcher });
    expect(response.status).toBe(200);
    const body = (await response.json()) as { reviews: Array<{ login: string; rating: number; quote: string }> };
    expect(body.reviews).toEqual([
      { login: 'zed', rating: 4, quote: 'Worked well' },
      { login: 'stranger', rating: 5, quote: 'Works for me' },
      { login: 'octocat', rating: 5, quote: 'My own review' },
    ]);
  });

  it('exposes nothing but the name, rating and text of each review', async () => {
    const { fetcher } = upstream(ok);
    const text = await (await handle(get(), env, { fetch: fetcher })).text();
    for (const secret of ['author_association', 'labels', 'number', 'Buy my thing', 'spammer', 'Beep']) expect(text).not.toContain(secret);
  });

  it('asks GitHub for the configured repository, with the token only in the Authorization header', async () => {
    const { fetcher, calls } = upstream(ok);
    await handle(get(), { ...env, REVIEWS_REPO: 'someone/else' }, { fetch: fetcher });
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toContain('/repos/someone/else/issues');
    expect(calls[0]!.url).not.toContain(TOKEN);
    const headers = new Headers(calls[0]!.init?.headers);
    expect(headers.get('authorization')).toBe(`Bearer ${TOKEN}`);
    expect(headers.get('user-agent')).toBeTruthy();
  });

  it('defaults to the livebio repository', async () => {
    const { fetcher, calls } = upstream(ok);
    await handle(get(), env, { fetch: fetcher });
    expect(calls[0]!.url).toContain('/repos/illusive7ai/livebio/issues');
  });

  it('refuses a malformed repository name instead of sending it to GitHub', async () => {
    const { fetcher, calls } = upstream(ok);
    const response = await handle(get(), { ...env, REVIEWS_REPO: '../../orgs/x?evil=1' }, { fetch: fetcher });
    expect(response.status).toBe(500);
    expect(calls).toHaveLength(0);
  });

  it('is cached for ten minutes, so the token is spent once however many people look', async () => {
    const cache = new MemoryCache();
    const { fetcher, calls } = upstream(ok);
    const first = await handle(get(), env, { fetch: fetcher, cache });
    expect(first.headers.get('X-Livebio-Cache')).toBe('MISS');
    expect(first.headers.get('Cache-Control')).toBe('public, max-age=600');
    const second = await handle(get(), env, { fetch: fetcher, cache });
    expect(second.headers.get('X-Livebio-Cache')).toBe('HIT');
    expect(calls).toHaveLength(1);
  });

  it('does not cache a failure, so a hiccup does not hide reviews for ten minutes', async () => {
    const cache = new MemoryCache();
    const { fetcher } = upstream(() => new Response('boom', { status: 500 }));
    const response = await handle(get(), env, { fetch: fetcher, cache });
    expect(response.status).toBe(502);
    expect(cache.store.size).toBe(0);
  });

  it('answers a rate limit with 503 and when to retry', async () => {
    const reset = String(Math.floor(Date.now() / 1000) + 90);
    const { fetcher } = upstream(() => new Response('{}', { status: 403, headers: { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': reset } }));
    const response = await handle(get(), env, { fetch: fetcher });
    expect(response.status).toBe(503);
    expect(Number(response.headers.get('Retry-After'))).toBeGreaterThan(0);
  });

  it('says only that it is misconfigured when GitHub rejects the token, and never leaks the token', async () => {
    const { fetcher } = upstream(() => new Response(`bad ${TOKEN}`, { status: 401 }));
    const response = await handle(get(), env, { fetch: fetcher });
    expect(response.status).toBe(500);
    expect(await everything(response)).not.toContain(TOKEN);
  });

  it('answers 502 when GitHub is unreachable or sends nonsense, without details', async () => {
    const down = (async () => {
      throw new Error(`connect failed with ${TOKEN}`);
    }) as unknown as typeof fetch;
    const unreachable = await handle(get(), env, { fetch: down });
    expect(unreachable.status).toBe(502);
    expect(await everything(unreachable)).not.toContain(TOKEN);
    const { fetcher } = upstream(() => new Response('{"message":"Not Found"}'));
    expect((await handle(get(), env, { fetch: fetcher })).status).toBe(502);
    const { fetcher: html } = upstream(() => new Response('<html>'));
    expect((await handle(get(), env, { fetch: html })).status).toBe(502);
  });

  it('is empty, not an error, when there are no reviews yet', async () => {
    const { fetcher } = upstream(() => new Response('[]'));
    const response = await handle(get(), env, { fetch: fetcher });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ reviews: [] });
  });

  it('needs the service to be configured', async () => {
    const { fetcher, calls } = upstream(ok);
    const response = await handle(get(), { ALLOWED_ORIGINS: ORIGIN }, { fetch: fetcher });
    expect(response.status).toBe(500);
    expect(calls).toHaveLength(0);
  });

  it('lets only the allowed sites read it from a browser', async () => {
    const { fetcher } = upstream(ok);
    expect((await handle(get({ Origin: ORIGIN }), env, { fetch: fetcher })).headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
    expect((await handle(get({ Origin: 'https://evil.example' }), env, { fetch: fetcher })).headers.get('Access-Control-Allow-Origin')).toBeNull();
  });

  it('only answers GET', async () => {
    const { fetcher } = upstream(ok);
    const response = await handle(new Request('https://worker.example/reviews', { method: 'POST' }), env, { fetch: fetcher });
    expect(response.status).toBe(405);
  });

  it('leaves the contribution route alone', async () => {
    const { fetcher } = upstream(ok);
    const response = await handle(new Request('https://worker.example/?user=not%20valid'), env, { fetch: fetcher });
    expect(response.status).toBe(400);
  });
});
