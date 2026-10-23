import { describe, expect, it } from 'vitest';
import { MemoryCache, github } from './fake-github';
import { handle, type Env } from './handler';

const TOKEN = 'ghp_SUPERSECRET123';
const env: Env = { GITHUB_TOKEN: TOKEN, ALLOWED_ORIGINS: 'https://app.example' };
const ORIGIN = 'https://app.example';
const MIN = 60_000;
const HOUR = 60 * MIN;

/** A clock the test moves by hand, so "an hour later" does not mean waiting an hour. */
function clock(start = Date.UTC(2026, 5, 10, 8, 0, 0)) {
  let t = start;
  return { now: () => t, advance: (ms: number) => (t += ms) };
}

const get = (path: string, headers: Record<string, string> = {}) => new Request(`https://worker.example${path}`, { headers });
const ask = (path: string, gh = github(), cache = new MemoryCache(), c = clock(), e: Env = env, headers: Record<string, string> = {}) =>
  handle(get(path, headers), e, { fetch: gh.fetcher, cache, now: c.now });
const githubCalls = (calls: string[]) => calls.filter((c) => c.startsWith('https://api.github.com/'));

describe('GET /profile', () => {
  it('returns a profile and a contribution calendar, and nothing else', async () => {
    const response = await ask('/profile?user=octo');
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('application/json');
    const body = (await response.json()) as { profile: Record<string, unknown>; contributions: { total: number; days: unknown[] } | null };
    expect(Object.keys(body).sort()).toEqual(['contributions', 'profile']);
    expect(body.profile.login).toBe('octo');
    expect(body.profile.followers).toBe(1234);
    expect(Array.isArray(body.profile.topRepos)).toBe(true);
    expect(body.contributions!.days.length).toBe(60);
    // The picture is not part of it. The browser loads that from GitHub's picture host, which has no such limit.
    expect(body.profile.avatar).toBeUndefined();
  });

  it('does not claim whether it came from the cache, because it cannot tell', async () => {
    expect((await ask('/profile?user=octo')).headers.get('X-Livebio-Cache')).toBeNull();
  });

  it('never exposes the token', async () => {
    const response = await ask('/profile?user=octo');
    expect(`${[...response.headers].join(';')} ${await response.text()}`).not.toContain(TOKEN);
  });

  it('lets the website read it and no other site', async () => {
    expect((await ask('/profile?user=octo', undefined, undefined, undefined, env, { Origin: ORIGIN })).headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
    expect((await ask('/profile?user=octo', undefined, undefined, undefined, env, { Origin: 'https://evil.example' })).headers.get('Access-Control-Allow-Origin')).toBeNull();
  });

  it('lets the browser keep it for five minutes, so a reload does not ask again', async () => {
    expect((await ask('/profile?user=octo')).headers.get('Cache-Control')).toBe('public, max-age=300');
  });

  it('refuses a username that is not valid, without calling GitHub', async () => {
    const gh = github();
    for (const path of ['/profile', '/profile?user=', '/profile?user=bad%20name', '/profile?user=-bad', '/profile?user=' + 'a'.repeat(40)]) {
      expect((await ask(path, gh)).status, path).toBe(400);
    }
    expect(gh.calls).toEqual([]);
  });

  it('says it is not set up when it has no token', async () => {
    const gh = github();
    const response = await ask('/profile?user=octo', gh, undefined, undefined, { ALLOWED_ORIGINS: '' });
    expect(response.status).toBe(500);
    expect(gh.calls).toEqual([]);
  });
});

describe('saving GitHub calls', () => {
  it('asks GitHub once however many times a person is looked up within the hour', async () => {
    const gh = github();
    const cache = new MemoryCache();
    const c = clock();
    await ask('/profile?user=octo', gh, cache, c);
    const first = githubCalls(gh.calls).length;
    expect(first).toBeGreaterThan(0);
    for (let i = 0; i < 5; i++) {
      c.advance(10 * MIN);
      await ask('/profile?user=octo', gh, cache, c);
    }
    expect(githubCalls(gh.calls).length).toBe(first);
  });

  it('treats upper and lower case as the same person', async () => {
    const gh = github();
    const cache = new MemoryCache();
    await ask('/profile?user=octo', gh, cache);
    const first = githubCalls(gh.calls).length;
    await ask('/profile?user=OCTO', gh, cache);
    await ask('/profile?user=Octo', gh, cache);
    expect(githubCalls(gh.calls).length).toBe(first);
  });

  it('asks again once the hour is up', async () => {
    const gh = github();
    const cache = new MemoryCache();
    const c = clock();
    await ask('/profile?user=octo', gh, cache, c);
    const first = githubCalls(gh.calls).length;
    c.advance(HOUR - MIN);
    await ask('/profile?user=octo', gh, cache, c);
    expect(githubCalls(gh.calls).length).toBe(first);
    c.advance(2 * MIN);
    await ask('/profile?user=octo', gh, cache, c);
    expect(githubCalls(gh.calls).length).toBeGreaterThan(first);
  });

  it('shares one lookup between the website and every picture of the same person', async () => {
    const gh = github();
    const cache = new MemoryCache();
    await ask('/profile?user=octo', gh, cache);
    const first = githubCalls(gh.calls).length;
    await ask('/u/octo/showcase-dark.svg?t=showcase', gh, cache);
    await ask('/u/octo/showcase-city-dark.svg?t=showcase', gh, cache);
    await ask('/u/octo/terminal-light.svg?t=terminal', gh, cache);
    expect(githubCalls(gh.calls).length).toBe(first);
  });

  it('keeps different people apart', async () => {
    const gh = github();
    const cache = new MemoryCache();
    await ask('/profile?user=octo', gh, cache);
    const first = githubCalls(gh.calls).length;
    await ask('/profile?user=someone', gh, cache);
    expect(githubCalls(gh.calls).length).toBeGreaterThan(first);
  });
});

describe('when GitHub cannot be asked', () => {
  it('serves the last copy when it is rate limited, instead of an error', async () => {
    let status = 200;
    const gh = github({ userStatus: () => status });
    const cache = new MemoryCache();
    const c = clock();
    const first = await (await ask('/profile?user=octo', gh, cache, c)).json();
    c.advance(3 * HOUR); // stale, but still kept
    status = 403;
    const response = await ask('/profile?user=octo', gh, cache, c);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(first);
  });

  it('serves the last copy when GitHub is down', async () => {
    let status = 200;
    const gh = github({ userStatus: () => status });
    const cache = new MemoryCache();
    const c = clock();
    await ask('/profile?user=octo', gh, cache, c);
    c.advance(2 * HOUR);
    status = 500;
    expect((await ask('/profile?user=octo', gh, cache, c)).status).toBe(200);
  });

  it('says it is busy, with when to retry, when there is no copy to serve', async () => {
    const response = await ask('/profile?user=octo', github({ userStatus: 403 }));
    expect(response.status).toBe(503);
    expect(Number(response.headers.get('Retry-After'))).toBeGreaterThan(0);
  });

  it('treats a rate limit on the calendar alone as a rate limit, and not as a missing calendar', async () => {
    const limited = () => new Response('{}', { status: 403, headers: { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 120) } });
    // Nothing to fall back on: it says it is busy, and keeps nothing that would hide the calendar for an hour.
    const cache = new MemoryCache();
    const response = await ask('/profile?user=octo', github({ graphql: limited }), cache);
    expect(response.status).toBe(503);
    expect(cache.store.size).toBe(0);
  });

  it('serves the last full copy when only the calendar is rate limited', async () => {
    let limitedNow = false;
    const gh = github({ graphql: () => (limitedNow ? new Response('{}', { status: 403, headers: { 'x-ratelimit-remaining': '0' } }) : undefined as never) });
    const open = github();
    const fetcher = (async (input: RequestInfo | URL, init?: RequestInit) => (limitedNow && String(input) === 'https://api.github.com/graphql' ? gh.fetcher(input, init) : open.fetcher(input, init))) as typeof fetch;
    const cache = new MemoryCache();
    const c = clock();
    const first = (await (await handle(get('/profile?user=octo'), env, { fetch: fetcher, cache, now: c.now })).json()) as { contributions: unknown };
    expect(first.contributions).not.toBeNull();
    c.advance(2 * HOUR);
    limitedNow = true;
    const later = (await (await handle(get('/profile?user=octo'), env, { fetch: fetcher, cache, now: c.now })).json()) as { contributions: unknown };
    expect(later.contributions).toEqual(first.contributions);
  });

  it('says it could not reach GitHub, without details, when there is no copy', async () => {
    const response = await ask('/profile?user=octo', github({ userStatus: 500 }));
    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain(TOKEN);
  });

  it('keeps a copy for a day, and a missing username for ten minutes, by how it is stored', async () => {
    const cache = new MemoryCache();
    await ask('/profile?user=octo', github(), cache);
    await ask('/profile?user=nobody', github({ userStatus: 404 }), cache);
    expect(cache.store.get('https://livebio.invalid/data/octo')!.headers.get('Cache-Control')).toBe('public, max-age=86400');
    expect(cache.store.get('https://livebio.invalid/data/nobody')!.headers.get('Cache-Control')).toBe('public, max-age=600');
  });
});

describe('a username that does not exist', () => {
  it('answers 404 and says so', async () => {
    const response = await ask('/profile?user=nobody', github({ userStatus: 404 }));
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'That GitHub user was not found.' });
  });

  it('is remembered for ten minutes, so repeated typos do not spend calls', async () => {
    const gh = github({ userStatus: 404 });
    const cache = new MemoryCache();
    const c = clock();
    await ask('/profile?user=nobody', gh, cache, c);
    const first = githubCalls(gh.calls).length;
    c.advance(5 * MIN);
    expect((await ask('/profile?user=nobody', gh, cache, c)).status).toBe(404);
    expect(githubCalls(gh.calls).length).toBe(first);
  });

  it('is asked about again after ten minutes, so a new account is found soon', async () => {
    let status = 404;
    const gh = github({ userStatus: () => status });
    const cache = new MemoryCache();
    const c = clock();
    await ask('/profile?user=newbie', gh, cache, c);
    c.advance(11 * MIN);
    status = 200;
    expect((await ask('/profile?user=newbie', gh, cache, c)).status).toBe(200);
  });
});

describe('when the contribution calendar could not be read', () => {
  it('still returns the profile, with no calendar', async () => {
    const gh = github({ graphql: () => new Response('boom', { status: 500 }) });
    const body = (await (await ask('/profile?user=octo', gh)).json()) as { profile: { login: string }; contributions: unknown };
    expect(body.profile.login).toBe('octo');
    expect(body.contributions).toBeNull();
  });

  it('is retried after five minutes, not an hour, so a brief failure heals quickly', async () => {
    let fail = true;
    const gh = github({ graphql: () => (fail ? new Response('boom', { status: 500 }) : undefined as never) });
    const realGraphql = github().fetcher;
    const fetcher = (async (input: RequestInfo | URL, init?: RequestInit) => (fail || String(input) !== 'https://api.github.com/graphql' ? gh.fetcher(input, init) : realGraphql(input, init))) as typeof fetch;
    const cache = new MemoryCache();
    const c = clock();
    const first = (await (await handle(get('/profile?user=octo'), env, { fetch: fetcher, cache, now: c.now })).json()) as { contributions: unknown };
    expect(first.contributions).toBeNull();
    fail = false;
    c.advance(2 * MIN);
    const early = (await (await handle(get('/profile?user=octo'), env, { fetch: fetcher, cache, now: c.now })).json()) as { contributions: unknown };
    expect(early.contributions).toBeNull(); // still inside the five minutes
    c.advance(4 * MIN);
    const later = (await (await handle(get('/profile?user=octo'), env, { fetch: fetcher, cache, now: c.now })).json()) as { contributions: unknown };
    expect(later.contributions).not.toBeNull();
  });
});

describe('the profile picture', () => {
  const pictureCalls = (calls: string[]) => calls.filter((c) => c.startsWith('https://avatars.githubusercontent.com/'));

  it('is decoded once, not on every picture of the same person', async () => {
    const gh = github();
    const cache = new MemoryCache();
    await ask('/u/octo/showcase-dark.svg?t=showcase', gh, cache);
    await ask('/u/octo/showcase-light.svg?t=showcase', gh, cache);
    await ask('/u/octo/terminal-dark.svg?t=terminal', gh, cache);
    expect(pictureCalls(gh.calls)).toHaveLength(1);
  });

  it('is fetched again after a day, and not before', async () => {
    const gh = github();
    const cache = new MemoryCache();
    const c = clock();
    await ask('/u/octo/showcase-dark.svg?t=showcase', gh, cache, c);
    c.advance(23 * HOUR);
    await ask('/u/octo/terminal-dark.svg?t=terminal', gh, cache, c);
    expect(pictureCalls(gh.calls)).toHaveLength(1);
    c.advance(2 * HOUR);
    await ask('/u/octo/neofetch-dark.svg?t=neofetch', gh, cache, c);
    expect(pictureCalls(gh.calls)).toHaveLength(2);
  });

  it('is fetched again at once if the person changed it', async () => {
    const cache = new MemoryCache();
    const c = clock();
    const first = github({ avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4' });
    await ask('/u/octo/showcase-dark.svg?t=showcase', first, cache, c);
    const second = github({ avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=5' });
    c.advance(HOUR + MIN); // data is stale, so the new address is seen
    await ask('/u/octo/terminal-dark.svg?t=terminal', second, cache, c);
    expect(pictureCalls(second.calls)).toHaveLength(1);
  });

  it('is retried after five minutes when it could not be read', async () => {
    let broken = true;
    const gh = github({ avatar: () => (broken ? new Response('nope', { status: 500 }) : undefined as never) });
    const working = github();
    const fetcher = (async (input: RequestInfo | URL, init?: RequestInit) => (String(input).startsWith('https://avatars.') && !broken ? working.fetcher(input, init) : gh.fetcher(input, init))) as typeof fetch;
    const cache = new MemoryCache();
    const c = clock();
    const run = (path: string) => handle(get(path), env, { fetch: fetcher, cache, now: c.now });
    expect(await (await run('/u/octo/showcase-dark.svg?t=showcase&a=1')).text()).not.toContain('data:image/png');
    broken = false;
    c.advance(2 * MIN);
    expect(await (await run('/u/octo/showcase-dark.svg?t=showcase&a=2')).text()).not.toContain('data:image/png');
    c.advance(4 * MIN);
    expect(await (await run('/u/octo/showcase-dark.svg?t=showcase&a=3')).text()).toContain('data:image/png');
  });
});
