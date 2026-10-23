import { describe, expect, it } from 'vitest';
import { GitHubError, fetchProfile } from './github';

interface Route {
  status?: number;
  body?: unknown;
  headers?: Record<string, string>;
}

function mockFetch(routes: Record<string, Route>): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    const url = String(input);
    const key = Object.keys(routes).find((prefix) => url.includes(prefix));
    if (!key) throw new Error(`unexpected request: ${url}`);
    const route = routes[key]!;
    return new Response(JSON.stringify(route.body ?? {}), { status: route.status ?? 200, headers: route.headers });
  }) as typeof fetch;
}

const user = {
  login: 'octo',
  name: 'Octo Cat',
  avatar_url: 'https://avatars.example/octo',
  bio: '   ',
  company: null,
  location: '',
  blog: '',
  html_url: 'https://github.com/octo',
  followers: 5,
  following: 2,
  public_repos: 3,
  created_at: '2020-01-01T00:00:00Z',
};

const repo = (over: Record<string, unknown>) => ({
  name: 'r',
  description: null,
  fork: false,
  archived: false,
  stargazers_count: 0,
  forks_count: 0,
  language: null,
  html_url: 'https://github.com/octo/r',
  ...over,
});

describe('fetchProfile', () => {
  it('summarises only the user’s own work and never invents empty fields', async () => {
    const profile = await fetchProfile('octo', {
      fetch: mockFetch({
        '/repos': {
          body: [
            repo({ name: 'a', stargazers_count: 10, language: 'Go', description: 'first' }),
            repo({ name: 'forked', fork: true, stargazers_count: 99, language: 'Rust' }),
            repo({ name: 'c', stargazers_count: 2, language: 'Go' }),
            repo({ name: 'old', archived: true, stargazers_count: 50, language: 'Python' }),
          ],
        },
        '/users/octo': { body: user },
      }),
    });

    expect(profile.totalStars).toBe(62); // fork excluded, archived repo still counts as the user's work
    expect(profile.languages).toEqual([
      { name: 'Go', percent: 67 },
      { name: 'Python', percent: 33 },
    ]);
    expect(profile.topRepos.map((r) => r.name)).toEqual(['a', 'c']); // archived and forked are not featured
    expect(profile.bio).toBeNull();
    expect(profile.location).toBeNull();
    expect(profile.website).toBeNull();
    expect(profile.company).toBeNull();
  });

  it('rejects invalid usernames before making any request', async () => {
    const never = (() => {
      throw new Error('should not be called');
    }) as unknown as typeof fetch;
    for (const name of ['', '../etc', 'a b', '-bad', 'bad-', 'x'.repeat(40)]) {
      await expect(fetchProfile(name, { fetch: never })).rejects.toMatchObject({ kind: 'invalid-username' });
    }
  });

  it('reports an unknown user', async () => {
    const fetcher = mockFetch({ '/users/ghost': { status: 404 } });
    await expect(fetchProfile('ghost', { fetch: fetcher })).rejects.toMatchObject({ kind: 'not-found' });
  });

  it('reports a rate limit with the reset time', async () => {
    const fetcher = mockFetch({
      '/users/octo': { status: 403, headers: { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '1800000000' } },
    });
    const error = await fetchProfile('octo', { fetch: fetcher }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(GitHubError);
    expect((error as GitHubError).kind).toBe('rate-limit');
    expect((error as GitHubError).resetAt?.getTime()).toBe(1800000000 * 1000);
  });

  it('reports network failures', async () => {
    const offline = (async () => {
      throw new TypeError('failed to fetch');
    }) as unknown as typeof fetch;
    await expect(fetchProfile('octo', { fetch: offline })).rejects.toMatchObject({ kind: 'network' });
  });

  it('sends the token only when one is given', async () => {
    const seen: Array<string | undefined> = [];
    const spy = (async (_url: RequestInfo | URL, init?: RequestInit) => {
      seen.push((init?.headers as Record<string, string>).Authorization);
      return new Response(JSON.stringify(String(_url).includes('/repos') ? [] : user));
    }) as typeof fetch;
    await fetchProfile('octo', { fetch: spy });
    await fetchProfile('octo', { fetch: spy, token: 'abc' });
    expect(seen[0]).toBeUndefined();
    expect(seen[2]).toBe('Bearer abc');
  });
});
