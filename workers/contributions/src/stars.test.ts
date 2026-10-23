import { describe, expect, it } from 'vitest';
import { handle, type CacheLike, type Env } from './handler';

const TOKEN = 'ghp_SUPERSECRET123';
const ORIGIN = 'https://app.example';
const env: Env = { GITHUB_TOKEN: TOKEN, ALLOWED_ORIGINS: ORIGIN };

class MemoryCache implements CacheLike {
  readonly store = new Map<string, Response>();
  async match(request: Request) {
    return this.store.get(request.url)?.clone();
  }
  async put(request: Request, response: Response) {
    this.store.set(request.url, response);
  }
}

function upstream(reply: () => Response) {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fetcher = (async (url: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    return reply();
  }) as typeof fetch;
  return { fetcher, calls };
}

const repoReply = (body: unknown = { stargazers_count: 42, full_name: 'illusive7ai/livebio', owner: { login: 'illusive7ai' } }) => () => new Response(JSON.stringify(body));
const get = (headers: Record<string, string> = {}) => new Request('https://worker.example/stars', { headers });

describe('GET /stars', () => {
  it('returns the star count and nothing else', async () => {
    const { fetcher } = upstream(repoReply());
    const response = await handle(get(), env, { fetch: fetcher });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ stars: 42 });
  });

  it('reports zero stars as zero, not as missing', async () => {
    const { fetcher } = upstream(repoReply({ stargazers_count: 0 }));
    expect(await (await handle(get(), env, { fetch: fetcher })).json()).toEqual({ stars: 0 });
  });

  it('asks GitHub for the livebio repository by default, with the token only in the Authorization header', async () => {
    const { fetcher, calls } = upstream(repoReply());
    await handle(get(), env, { fetch: fetcher });
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe('https://api.github.com/repos/illusive7ai/livebio');
    expect(calls[0]!.url).not.toContain(TOKEN);
    const headers = new Headers(calls[0]!.init?.headers);
    expect(headers.get('authorization')).toBe(`Bearer ${TOKEN}`);
    expect(headers.get('user-agent')).toBeTruthy();
  });

  it('asks about another repository when one is configured', async () => {
    const { fetcher, calls } = upstream(repoReply());
    await handle(get(), { ...env, REVIEWS_REPO: 'someone/else' }, { fetch: fetcher });
    expect(calls[0]!.url).toBe('https://api.github.com/repos/someone/else');
  });

  it('keeps the answer for ten minutes and asks GitHub only once', async () => {
    const { fetcher, calls } = upstream(repoReply());
    const cache = new MemoryCache();
    const first = await handle(get(), env, { fetch: fetcher, cache });
    expect(first.headers.get('cache-control')).toBe('public, max-age=600');
    const second = await handle(get(), env, { fetch: fetcher, cache });
    expect(await second.json()).toEqual({ stars: 42 });
    expect(calls).toHaveLength(1);
  });

  it('lets the website read it, and nobody else', async () => {
    const { fetcher } = upstream(repoReply());
    expect((await handle(get({ Origin: ORIGIN }), env, { fetch: fetcher })).headers.get('access-control-allow-origin')).toBe(ORIGIN);
    expect((await handle(get({ Origin: 'https://evil.example' }), env, { fetch: fetcher })).headers.get('access-control-allow-origin')).toBeNull();
  });

  it.each([
    ['a missing count', {}],
    ['a text count', { stargazers_count: '42' }],
    ['a negative count', { stargazers_count: -1 }],
    ['a fractional count', { stargazers_count: 1.5 }],
    ['nothing at all', null],
  ])('refuses %s rather than guessing', async (_name, body) => {
    const { fetcher } = upstream(repoReply(body));
    const response = await handle(get(), env, { fetch: fetcher });
    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain('stars');
  });

  it.each([
    [401, 500],
    [404, 502],
    [500, 502],
  ])('answers %i from GitHub with %i, and never caches it', async (status, expected) => {
    const { fetcher } = upstream(() => new Response('{}', { status }));
    const cache = new MemoryCache();
    const response = await handle(get(), env, { fetch: fetcher, cache });
    expect(response.status).toBe(expected);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(cache.store.size).toBe(0);
  });

  it('says it is busy when GitHub rate-limits, without leaking the token', async () => {
    const { fetcher } = upstream(() => new Response('{}', { status: 403, headers: { 'x-ratelimit-remaining': '0' } }));
    const response = await handle(get(), env, { fetch: fetcher });
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain(TOKEN);
  });

  it('needs a token to be set up', async () => {
    const { fetcher, calls } = upstream(repoReply());
    expect((await handle(get(), { ALLOWED_ORIGINS: ORIGIN }, { fetch: fetcher })).status).toBe(500);
    expect(calls).toHaveLength(0);
  });

  it('refuses a repository name that is not a name', async () => {
    const { fetcher, calls } = upstream(repoReply());
    const response = await handle(get(), { ...env, REVIEWS_REPO: 'a/b/../c' }, { fetch: fetcher });
    expect(response.status).toBe(500);
    expect(calls).toHaveLength(0);
  });
});
