import { describe, expect, it } from 'vitest';
import { buildContributions } from './contributions';
import { GitHubError } from './github';
import { fetchProfileViaService, parseServiceProfile } from './service';
import type { ContributionDay, Profile } from './types';

const days: ContributionDay[] = Array.from({ length: 30 }, (_v, i) => ({
  date: new Date(Date.UTC(2026, 3, 1 + i)).toISOString().slice(0, 10),
  count: i % 3,
  level: (i % 3 === 0 ? 0 : 2) as 0 | 2,
}));

const profile: Profile = {
  login: 'octo',
  name: 'Octo Cat',
  avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4',
  bio: null,
  company: null,
  location: 'Lagos',
  website: null,
  url: 'https://github.com/octo',
  followers: 12,
  following: 3,
  publicRepos: 9,
  totalStars: 40,
  totalForks: 5,
  activeRepos: 2,
  fetchedAt: '2026-06-10T08:00:00Z',
  createdAt: '2020-01-01T00:00:00Z',
  languages: [{ name: 'Go', percent: 100 }],
  topRepos: [{ name: 'tool', description: 'A tool', stars: 3, forks: 1, language: 'Go', url: 'https://github.com/octo/tool', pushedAt: '2026-05-01T00:00:00Z', license: 'MIT' }],
  recentRepos: [{ name: 'tool', description: null, stars: 3, forks: 1, language: null, url: 'https://github.com/octo/tool', pushedAt: null, license: null }],
};

const reply = (status: number, body: unknown = {}, headers: Record<string, string> = {}) =>
  (async () => new Response(typeof body === 'string' ? body : JSON.stringify(body), { status, headers })) as unknown as typeof fetch;
const ok = (over: Record<string, unknown> = {}) => reply(200, { profile, contributions: buildContributions(days), ...over });
const ask = (fetcher: typeof fetch, name = 'octo') => fetchProfileViaService('https://cards.example.dev', name, { fetch: fetcher });
const failure = (promise: Promise<unknown>) => promise.then(() => null, (e: unknown) => e as GitHubError);

describe('fetchProfileViaService', () => {
  it('reads a profile and a calendar', async () => {
    const result = await ask(ok());
    expect(result.profile).toEqual(profile);
    expect(result.contributions!.total).toBe(buildContributions(days).total);
    expect(result.contributions!.days).toHaveLength(30);
  });

  it('asks the /profile address of the server, with the username', async () => {
    let seen = '';
    const fetcher = (async (input: RequestInfo | URL) => {
      seen = String(input);
      return new Response(JSON.stringify({ profile, contributions: null }));
    }) as typeof fetch;
    await ask(fetcher);
    expect(seen).toBe('https://cards.example.dev/profile?user=octo');
  });

  it('works when the server address has a path or a trailing slash', async () => {
    for (const base of ['https://cards.example.dev/', 'https://cards.example.dev/some/path']) {
      let seen = '';
      const fetcher = (async (input: RequestInfo | URL) => {
        seen = String(input);
        return new Response(JSON.stringify({ profile, contributions: null }));
      }) as typeof fetch;
      await fetchProfileViaService(base, 'octo', { fetch: fetcher });
      expect(seen).toBe('https://cards.example.dev/profile?user=octo');
    }
  });

  it('accepts a profile with no calendar', async () => {
    expect((await ask(ok({ contributions: null }))).contributions).toBeNull();
    expect((await ask(reply(200, { profile }))).contributions).toBeNull();
  });

  it('drops a calendar it cannot read, and keeps the profile', async () => {
    const result = await ask(ok({ contributions: { total: 'lots', days: 'many' } }));
    expect(result.contributions).toBeNull();
    expect(result.profile.login).toBe('octo');
  });

  it('refuses a username that is not valid, without calling the server', async () => {
    let called = false;
    const fetcher = (async () => {
      called = true;
      return new Response('{}');
    }) as unknown as typeof fetch;
    const error = await failure(ask(fetcher, 'not a name!'));
    expect(error).toBeInstanceOf(GitHubError);
    expect(error!.kind).toBe('invalid-username');
    expect(called).toBe(false);
  });

  describe('turns the server’s answers into the same errors a direct read gives', () => {
    it('404 is "not found", a final answer', async () => {
      expect((await failure(ask(reply(404))))!.kind).toBe('not-found');
    });

    it('400 is "invalid username"', async () => {
      expect((await failure(ask(reply(400))))!.kind).toBe('invalid-username');
    });

    it('503 and 429 are a rate limit, with the time to try again when it says', async () => {
      for (const status of [503, 429]) {
        const error = (await failure(ask(reply(status, {}, { 'Retry-After': '90' }))))!;
        expect(error.kind).toBe('rate-limit');
        const wait = error.resetAt!.getTime() - Date.now();
        expect(wait).toBeGreaterThan(80_000);
        expect(wait).toBeLessThan(100_000);
      }
      expect((await failure(ask(reply(503))))!.resetAt).toBeUndefined();
      expect((await failure(ask(reply(503, {}, { 'Retry-After': 'soon' }))))!.resetAt).toBeUndefined();
    });

    it('anything else is "unknown", so a caller knows the server could not help', async () => {
      for (const status of [500, 502, 403, 401]) expect((await failure(ask(reply(status))))!.kind, String(status)).toBe('unknown');
    });

    it('a server that cannot be reached is "network"', async () => {
      const down = (async () => {
        throw new TypeError('fetch failed');
      }) as unknown as typeof fetch;
      expect((await failure(ask(down)))!.kind).toBe('network');
    });
  });

  describe('does not trust what comes back', () => {
    it('refuses a reply that is not JSON, or not an object', async () => {
      for (const body of ['<html>oops</html>', '[]', 'null', '"text"', '5']) {
        const error = await failure(ask(reply(200, body)));
        expect(error, body).toBeInstanceOf(GitHubError);
        expect(error!.kind).toBe('unknown');
      }
    });

    it('refuses a profile that has the wrong shape', async () => {
      const broken: Array<Record<string, unknown>> = [
        { ...profile, login: 5 },
        { ...profile, login: 'not a name!' },
        { ...profile, followers: 'many' },
        { ...profile, followers: -3 },
        { ...profile, followers: Number.NaN },
        { ...profile, languages: 'Go' },
        { ...profile, languages: [{ name: 'Go' }] },
        { ...profile, topRepos: [{ name: 'x' }] },
        { ...profile, topRepos: null },
        { ...profile, topRepos: [null] },
        { ...profile, topRepos: ['a string'] },
        { ...profile, recentRepos: [null] },
        { ...profile, languages: [null] },
        { ...profile, avatarUrl: null },
        { ...profile, createdAt: 42 },
      ];
      for (const bad of broken) {
        const error = await failure(ask(reply(200, { profile: bad, contributions: null })));
        expect(error, JSON.stringify(bad).slice(0, 60)).toBeInstanceOf(GitHubError);
        expect(error!.kind).toBe('unknown');
      }
      for (const nonsense of [null, 'x', 5, [], undefined]) {
        expect((await failure(ask(reply(200, { profile: nonsense, contributions: null })))), String(nonsense)).toBeInstanceOf(GitHubError);
      }
    });
  });
});

describe('parseServiceProfile', () => {
  it('keeps what a profile has and leaves out what the server added that is not part of one', () => {
    const parsed = parseServiceProfile({ ...profile, evil: '<script>', avatar: { dataUri: 'x' }, contributions: 'x' });
    expect(parsed).toEqual(profile);
    expect('evil' in parsed).toBe(false);
    expect('avatar' in parsed).toBe(false);
  });

  it('keeps optional fields only when they are the right kind', () => {
    const { totalForks: _f, activeRepos: _a, fetchedAt: _t, recentRepos: _r, ...base } = profile;
    expect(parseServiceProfile(base)).toEqual(base);
    expect(parseServiceProfile({ ...base, totalForks: 'x', activeRepos: -1, fetchedAt: 5 })).toEqual(base);
  });

  it('keeps empty fields empty, never filling them in', () => {
    const parsed = parseServiceProfile({ ...profile, name: null, bio: null, company: null, location: null, website: null });
    expect([parsed.name, parsed.bio, parsed.company, parsed.location, parsed.website]).toEqual([null, null, null, null, null]);
  });
});
