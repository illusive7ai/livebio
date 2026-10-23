import UPNG from 'upng-js';
import type { CacheLike } from './handler';

/** A fake GitHub, and a fake cache, shared by the tests. The fake refuses what the real one refuses. */

export class MemoryCache implements CacheLike {
  readonly store = new Map<string, Response>();
  async match(request: Request) {
    return this.store.get(request.url)?.clone();
  }
  async put(request: Request, response: Response) {
    this.store.set(request.url, response);
  }
}

/** A small red square, as a real PNG. */
export function avatarPng(): Uint8Array {
  const rgba = new Uint8Array(8 * 8 * 4);
  for (let i = 0; i < 64; i++) rgba.set([220, 50, 50, 255], i * 4);
  return new Uint8Array(UPNG.encode([rgba.buffer], 8, 8, 0));
}

export function calendar(total: number) {
  const first = Date.parse('2026-01-01T00:00:00Z');
  const counts = Array.from({ length: 60 }, (_v, i) => (i % 3 === 0 ? 0 : Math.max(1, Math.round(total / 40))));
  return {
    data: {
      user: {
        contributionsCollection: {
          contributionCalendar: {
            totalContributions: counts.reduce((a, b) => a + b, 0),
            weeks: [{ contributionDays: counts.map((count, i) => ({ date: new Date(first + i * 86_400_000).toISOString().slice(0, 10), contributionCount: count, contributionLevel: count > 0 ? 'SECOND_QUARTILE' : 'NONE' })) }],
          },
        },
      },
    },
  };
}

export interface Options {
  avatarUrl?: string;
  /** A status to answer the user request with: a number, or a function asked on every call. */
  userStatus?: number | (() => number);
  graphql?: () => Response;
  avatar?: () => Response;
  repos?: unknown[];
}

/** A fake GitHub that records every address it is asked for. */
export function github(options: Options = {}) {
  const calls: string[] = [];
  const fetcher = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push(url);
    // Like the real GitHub: a request with no User-Agent is refused. This is what broke the first deployment.
    if (url.startsWith('https://api.github.com/') && !new Headers(init?.headers).get('user-agent')) return new Response('Request forbidden by administrative rules.', { status: 403 });
    if (url === 'https://api.github.com/graphql') return options.graphql?.() ?? new Response(JSON.stringify(calendar(120)));
    if (url.startsWith('https://avatars.githubusercontent.com/')) return options.avatar?.() ?? new Response(avatarPng() as unknown as BodyInit, { headers: { 'content-type': 'image/png' } });
    if (/\/users\/[^/]+\/repos/.test(url)) {
      return new Response(
        JSON.stringify(
          options.repos ?? [
            { name: 'alpha', description: 'The first one', fork: false, archived: false, stargazers_count: 40, forks_count: 3, language: 'Go', html_url: 'https://github.com/octo/alpha', pushed_at: '2026-05-01T00:00:00Z', license: { spdx_id: 'MIT' } },
            { name: 'beta', description: null, fork: false, archived: false, stargazers_count: 9, forks_count: 0, language: 'TypeScript', html_url: 'https://github.com/octo/beta', pushed_at: '2026-04-01T00:00:00Z', license: null },
          ],
        ),
      );
    }
    if (/\/users\/[^/]+$/.test(url)) {
      const status = typeof options.userStatus === 'function' ? options.userStatus() : options.userStatus;
      if (status && status !== 200) return new Response('{}', { status, headers: status === 403 ? { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 120) } : {} });
      return new Response(
        JSON.stringify({ login: 'octo', name: 'Octo Cat', avatar_url: options.avatarUrl ?? 'https://avatars.githubusercontent.com/u/1?v=4', bio: 'Makes things', company: null, location: null, blog: '', html_url: 'https://github.com/octo', followers: 1234, following: 5, public_repos: 21, created_at: '2020-01-01T00:00:00Z' }),
      );
    }
    return new Response('not found', { status: 404 });
  }) as typeof fetch;
  return { fetcher, calls };
}
