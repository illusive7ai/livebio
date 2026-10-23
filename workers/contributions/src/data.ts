import { fetchContributions } from '@livebio/core/src/contributions';
import { fetchProfile, GitHubError } from '@livebio/core/src/github';
import type { Avatar, Contributions, Profile } from '@livebio/core/src/types';
import { loadAvatar } from './avatar';
import type { Deps, Env } from './handler';
import { withUserAgent } from './http';

/**
 * One person's public data, looked after so that GitHub is asked as rarely as possible. The token's budget is
 * what limits how many people livebio can serve, so every call saved here is room for more people.
 *
 * - Data counts as fresh for an hour, and is shared by every picture and by the website.
 * - A copy is kept for a day. When GitHub cannot be asked (a rate limit, an outage), the last copy is served
 *   instead of an error, so a busy hour shows slightly old numbers and not a broken page.
 * - A username that does not exist is remembered for ten minutes, so repeated typos do not spend calls.
 * - Data that is missing its calendar is only trusted for five minutes, so a brief failure heals quickly.
 */

/** Seconds a copy counts as fresh. */
export const DATA_TTL = 3600;
const KEEP = 86_400;
const MISSING_TTL = 600;
const INCOMPLETE_TTL = 300;
const AVATAR_TTL = 86_400;
const AVATAR_RETRY = 300;

export interface Data {
  profile: Profile;
  contributions: Contributions | null;
  /** When it was read, in milliseconds. */
  at: number;
}

interface Missing {
  missing: true;
  at: number;
}

const now = (deps: Deps): number => (deps.now ? deps.now() : Date.now());

async function read<T>(deps: Deps, name: string): Promise<T | null> {
  const cached = await deps.cache?.match(new Request(`https://livebio.invalid/${name}`));
  if (!cached) return null;
  try {
    return (await cached.json()) as T;
  } catch {
    return null; // a damaged copy is simply ignored
  }
}

function write(deps: Deps, name: string, value: unknown, maxAge: number): void {
  if (!deps.cache) return;
  const response = new Response(JSON.stringify(value), { headers: { 'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${maxAge}` } });
  const job = deps.cache.put(new Request(`https://livebio.invalid/${name}`), response);
  if (deps.waitUntil) deps.waitUntil(job);
  else void job;
}

const dataKey = (login: string): string => `data/${login.toLowerCase()}`;

function isFresh(saved: Data, at: number): boolean {
  const ttl = saved.contributions ? DATA_TTL : INCOMPLETE_TTL;
  return at - saved.at < ttl * 1000;
}

/** Asks GitHub for everything about one person. */
async function fetchData(login: string, env: Env, deps: Deps, at: number): Promise<Data> {
  const token = env.GITHUB_TOKEN!;
  const fetcher = withUserAgent(deps.fetch);
  const profile = await fetchProfile(login, { token, fetch: fetcher });
  const contributions = await fetchContributions(login, { token, fetch: fetcher }).catch((error) => {
    // A person whose calendar cannot be read still gets everything else. A rate limit is different: it ends the lot.
    if (error instanceof GitHubError && error.kind === 'rate-limit') throw error;
    return null;
  });
  return { profile, contributions, at };
}

/** A person's profile and contribution calendar, from the copy if it is fresh and from GitHub if not. */
export async function loadData(login: string, env: Env, deps: Deps): Promise<Data> {
  const at = now(deps);
  const saved = await read<Data | Missing>(deps, dataKey(login));

  if (saved && 'missing' in saved) {
    if (at - saved.at < MISSING_TTL * 1000) throw new GitHubError('That GitHub user was not found.', 'not-found');
  } else if (saved && isFresh(saved, at)) {
    return saved;
  }

  try {
    const fresh = await fetchData(login, env, deps, at);
    write(deps, dataKey(login), fresh, KEEP);
    return fresh;
  } catch (error) {
    if (error instanceof GitHubError && error.kind === 'not-found') {
      write(deps, dataKey(login), { missing: true, at } satisfies Missing, MISSING_TTL);
      throw error;
    }
    // GitHub cannot be asked right now, so an older copy is better than nothing.
    if (saved && !('missing' in saved)) return saved;
    throw error;
  }
}

interface SavedAvatar {
  url: string;
  avatar: Avatar | null;
  at: number;
}

/**
 * A person's decoded profile picture. Decoding is the costliest step, so it is done once a day and not on every
 * request. A picture that could not be read is tried again after five minutes.
 */
export async function loadAvatarCached(login: string, url: string, deps: Deps): Promise<Avatar | null> {
  const at = now(deps);
  const name = `avatar/${login.toLowerCase()}`;
  const saved = await read<SavedAvatar>(deps, name);
  if (saved && saved.url === url) {
    const ttl = saved.avatar ? AVATAR_TTL : AVATAR_RETRY;
    if (at - saved.at < ttl * 1000) return saved.avatar;
  }
  const avatar = await loadAvatar(url, withUserAgent(deps.fetch));
  write(deps, name, { url, avatar, at } satisfies SavedAvatar, AVATAR_TTL);
  return avatar;
}
