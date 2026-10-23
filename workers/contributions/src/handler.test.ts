import { describe, expect, it } from 'vitest';
import { handle, type CacheLike, type Env } from './handler';

const TOKEN = 'ghp_SUPERSECRET123';
const env: Env = { GITHUB_TOKEN: TOKEN, ALLOWED_ORIGINS: 'https://app.example, http://localhost:5173' };
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

function calendar(counts: number[]) {
  const first = Date.parse('2026-01-01T00:00:00Z');
  return {
    data: {
      user: {
        contributionsCollection: {
          contributionCalendar: {
            totalContributions: counts.reduce((a, b) => a + b, 0),
            weeks: [
              {
                contributionDays: counts.map((count, i) => ({
                  date: new Date(first + i * 86_400_000).toISOString().slice(0, 10),
                  contributionCount: count,
                  contributionLevel: count > 0 ? 'FIRST_QUARTILE' : 'NONE',
                })),
              },
            ],
          },
        },
      },
    },
  };
}

/** A fake GitHub that counts how often it is asked. */
function upstream(reply: () => Response) {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fetcher = (async (url: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    return reply();
  }) as typeof fetch;
  return { fetcher, calls };
}

const ok = () => new Response(JSON.stringify(calendar([1, 2, 0, 3])));
const get = (path: string, headers: Record<string, string> = {}) =>
  new Request(`https://worker.example${path}`, { headers });

/** Everything a caller could see: status, headers and body. */
async function everything(response: Response): Promise<string> {
  return `${response.status} ${[...response.headers].join(';')} ${await response.clone().text()}`;
}

describe('contribution service', () => {
  it('returns the user’s contribution data as JSON', async () => {
    const { fetcher, calls } = upstream(ok);
    const response = await handle(get('/?user=octo'), env, { fetch: fetcher });
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('application/json');
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600');
    const body = await response.json();
    expect(body).toMatchObject({ total: 6, activeDays: 3, from: '2026-01-01', to: '2026-01-04' });
    expect(body.days).toHaveLength(4);
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe('https://api.github.com/graphql');
    expect((calls[0]!.init!.headers as Record<string, string>).Authorization).toBe(`Bearer ${TOKEN}`);
  });

  it('also answers on /contributions', async () => {
    const { fetcher } = upstream(ok);
    expect((await handle(get('/contributions?user=octo'), env, { fetch: fetcher })).status).toBe(200);
  });

  describe('caching', () => {
    it('serves a repeat request from the cache without asking GitHub again', async () => {
      const { fetcher, calls } = upstream(ok);
      const cache = new MemoryCache();
      const first = await handle(get('/?user=octo'), env, { fetch: fetcher, cache });
      const second = await handle(get('/?user=octo'), env, { fetch: fetcher, cache });
      expect(first.headers.get('X-Livebio-Cache')).toBe('MISS');
      expect(second.headers.get('X-Livebio-Cache')).toBe('HIT');
      expect(calls).toHaveLength(1);
      expect(await second.json()).toEqual(await first.json());
    });

    it('treats usernames case-insensitively, as GitHub does', async () => {
      const { fetcher, calls } = upstream(ok);
      const cache = new MemoryCache();
      await handle(get('/?user=Octo'), env, { fetch: fetcher, cache });
      const second = await handle(get('/?user=oCTo'), env, { fetch: fetcher, cache });
      expect(second.headers.get('X-Livebio-Cache')).toBe('HIT');
      expect(calls).toHaveLength(1);
    });

    it('never leaks one visitor’s CORS permission into another’s response', async () => {
      const { fetcher } = upstream(ok);
      const cache = new MemoryCache();
      await handle(get('/?user=octo', { Origin: ORIGIN }), env, { fetch: fetcher, cache });
      const stored = [...cache.store.values()][0]!;
      expect(stored.headers.get('Access-Control-Allow-Origin')).toBeNull();

      const stranger = await handle(get('/?user=octo', { Origin: 'https://evil.example' }), env, { fetch: fetcher, cache });
      expect(stranger.headers.get('X-Livebio-Cache')).toBe('HIT');
      expect(stranger.headers.get('Access-Control-Allow-Origin')).toBeNull();

      const friend = await handle(get('/?user=octo', { Origin: 'http://localhost:5173' }), env, { fetch: fetcher, cache });
      expect(friend.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:5173');
    });

    it('remembers that a user does not exist, so lookups do not spend the quota', async () => {
      const { fetcher, calls } = upstream(() => new Response(JSON.stringify({ data: { user: null }, errors: [{ type: 'NOT_FOUND' }] })));
      const cache = new MemoryCache();
      const first = await handle(get('/?user=ghost'), env, { fetch: fetcher, cache });
      const second = await handle(get('/?user=ghost'), env, { fetch: fetcher, cache });
      expect(first.status).toBe(404);
      expect(first.headers.get('Cache-Control')).toBe('public, max-age=600');
      expect(second.status).toBe(404);
      expect(second.headers.get('X-Livebio-Cache')).toBe('HIT');
      expect(calls).toHaveLength(1);
    });

    it('never caches failures', async () => {
      const { fetcher, calls } = upstream(() => new Response('{}', { status: 429 }));
      const cache = new MemoryCache();
      await handle(get('/?user=octo'), env, { fetch: fetcher, cache });
      await handle(get('/?user=octo'), env, { fetch: fetcher, cache });
      expect(calls).toHaveLength(2);
      expect(cache.store.size).toBe(0);
    });

    it('writes to the cache through waitUntil so the reply is not delayed', async () => {
      const { fetcher } = upstream(ok);
      const pending: Array<Promise<unknown>> = [];
      const cache = new MemoryCache();
      await handle(get('/?user=octo'), env, { fetch: fetcher, cache, waitUntil: (p) => void pending.push(p) });
      expect(pending).toHaveLength(1);
      await Promise.all(pending);
      expect(cache.store.size).toBe(1);
    });

    it('works with no cache at all', async () => {
      const { fetcher } = upstream(ok);
      expect((await handle(get('/?user=octo'), env, { fetch: fetcher })).status).toBe(200);
    });
  });

  describe('CORS', () => {
    it('lets a listed origin read the data', async () => {
      const { fetcher } = upstream(ok);
      const response = await handle(get('/?user=octo', { Origin: ORIGIN }), env, { fetch: fetcher });
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
      expect(response.headers.get('Vary')).toBe('Origin');
    });

    it('gives other origins no permission, so their browsers refuse the data', async () => {
      const { fetcher } = upstream(ok);
      const response = await handle(get('/?user=octo', { Origin: 'https://evil.example' }), env, { fetch: fetcher });
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
    });

    it('never answers with a wildcard', async () => {
      const { fetcher } = upstream(ok);
      const response = await handle(get('/?user=octo', { Origin: ORIGIN }), env, { fetch: fetcher });
      expect(response.headers.get('Access-Control-Allow-Origin')).not.toBe('*');
    });

    it('answers preflight requests', async () => {
      const preflight = new Request('https://worker.example/?user=octo', { method: 'OPTIONS', headers: { Origin: ORIGIN } });
      const response = await handle(preflight, env);
      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, OPTIONS');
    });
  });

  describe('bad requests', () => {
    it.each(['', '?user=', '?user=../etc', '?user=a b', '?user=-bad', `?user=${'x'.repeat(40)}`])(
      'rejects the username in "%s" without calling GitHub',
      async (query) => {
        const { fetcher, calls } = upstream(ok);
        const response = await handle(get(`/${query}`), env, { fetch: fetcher });
        expect(response.status).toBe(400);
        expect(response.headers.get('Cache-Control')).toBe('no-store');
        expect(calls).toHaveLength(0);
      },
    );

    it('only allows GET and OPTIONS', async () => {
      const response = await handle(new Request('https://worker.example/?user=octo', { method: 'POST' }), env);
      expect(response.status).toBe(405);
      expect(response.headers.get('Allow')).toBe('GET, OPTIONS');
    });

    it('returns 404 for other paths', async () => {
      expect((await handle(get('/admin?user=octo'), env)).status).toBe(404);
    });

    it('reports a missing token as a configuration problem', async () => {
      const response = await handle(get('/?user=octo'), { ALLOWED_ORIGINS: ORIGIN });
      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ error: 'The service is not configured.' });
    });
  });

  describe('when GitHub misbehaves', () => {
    it('answers 503 with Retry-After when rate limited', async () => {
      const { fetcher } = upstream(() => new Response('{}', { status: 403, headers: { 'x-ratelimit-remaining': '0' } }));
      const response = await handle(get('/?user=octo'), env, { fetch: fetcher });
      expect(response.status).toBe(503);
      expect(Number(response.headers.get('Retry-After'))).toBeGreaterThan(0);
      expect(Number(response.headers.get('Retry-After'))).toBeLessThanOrEqual(3600);
      expect(response.headers.get('Cache-Control')).toBe('no-store');
    });

    it('answers 502 when GitHub is unreachable or sends nonsense', async () => {
      const offline = (async () => {
        throw new TypeError('failed');
      }) as unknown as typeof fetch;
      expect((await handle(get('/?user=octo'), env, { fetch: offline })).status).toBe(502);
      const junk = upstream(() => new Response('<html>not json</html>'));
      expect((await handle(get('/?user=octo'), env, { fetch: junk.fetcher })).status).toBe(502);
    });

    it('treats a rejected token as our fault and says so vaguely', async () => {
      const { fetcher } = upstream(() => new Response('{"message":"Bad credentials"}', { status: 401 }));
      const response = await handle(get('/?user=octo'), env, { fetch: fetcher });
      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ error: 'The service is not configured correctly.' });
    });
  });

  describe('secrecy', () => {
    it('never reveals the token in any response, success or failure', async () => {
      const scenarios: Array<() => Promise<Response>> = [
        () => handle(get('/?user=octo', { Origin: ORIGIN }), env, { fetch: upstream(ok).fetcher }),
        () => handle(get('/?user=octo'), env, { fetch: upstream(() => new Response('{}', { status: 401 })).fetcher }),
        () => handle(get('/?user=octo'), env, { fetch: upstream(() => new Response('{}', { status: 429 })).fetcher }),
        () =>
          handle(get('/?user=octo'), env, {
            fetch: (async () => {
              throw new Error(`boom ${TOKEN}`);
            }) as unknown as typeof fetch,
          }),
        () => handle(get('/?user=../x'), env),
        () => handle(get('/nope'), env),
        () => handle(new Request('https://worker.example/', { method: 'DELETE' }), env),
      ];
      for (const run of scenarios) expect(await everything(await run())).not.toContain('SUPERSECRET');
    });
  });
});
