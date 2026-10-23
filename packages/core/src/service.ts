import { parseContributions } from './contributions';
import { GitHubError, type FetchOptions } from './github';
import type { Contributions, LanguageShare, Profile, RepoSummary } from './types';
import { isValidUsername } from './util';

/**
 * Reading a profile from a livebio server instead of from GitHub. A browser may only make 60 anonymous GitHub
 * requests an hour, which a few lookups use up. The server has a token, keeps each person's data for an hour and
 * shares it, so the website asks here first.
 */

const bad = (reason: string): GitHubError => new GitHubError(`The livebio server sent something unexpected (${reason}).`, 'unknown');

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const text = (value: unknown): string | null => (typeof value === 'string' ? value : null);
const count = (value: unknown): number | null => (typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null);

function required<T>(value: T | null, field: string): T {
  if (value === null) throw bad(`${field} is missing or not the right kind`);
  return value;
}

function repo(value: unknown): RepoSummary {
  if (!isRecord(value)) throw bad('a repository is not an object');
  const summary: RepoSummary = {
    name: required(text(value.name), 'repository name'),
    description: text(value.description),
    stars: required(count(value.stars), 'repository stars'),
    forks: required(count(value.forks), 'repository forks'),
    language: text(value.language),
    url: required(text(value.url), 'repository address'),
  };
  if (typeof value.pushedAt === 'string' || value.pushedAt === null) summary.pushedAt = value.pushedAt as string | null;
  if (typeof value.license === 'string' || value.license === null) summary.license = value.license as string | null;
  return summary;
}

function repos(value: unknown, field: string): RepoSummary[] {
  if (!Array.isArray(value)) throw bad(`${field} is not a list`);
  return value.map(repo);
}

/** Checks that a profile from the server has the shape the rest of livebio relies on, and returns a clean copy. */
export function parseServiceProfile(value: unknown): Profile {
  if (!isRecord(value)) throw bad('the profile is not an object');
  const login = required(text(value.login), 'login');
  if (!isValidUsername(login)) throw bad('login is not a username');
  if (!Array.isArray(value.languages)) throw bad('languages is not a list');

  const languages: LanguageShare[] = value.languages.map((entry) => {
    if (!isRecord(entry)) throw bad('a language is not an object');
    return { name: required(text(entry.name), 'language name'), percent: required(count(entry.percent), 'language share') };
  });

  const profile: Profile = {
    login,
    name: text(value.name),
    avatarUrl: required(text(value.avatarUrl), 'avatarUrl'),
    bio: text(value.bio),
    company: text(value.company),
    location: text(value.location),
    website: text(value.website),
    url: required(text(value.url), 'url'),
    followers: required(count(value.followers), 'followers'),
    following: required(count(value.following), 'following'),
    publicRepos: required(count(value.publicRepos), 'publicRepos'),
    totalStars: required(count(value.totalStars), 'totalStars'),
    createdAt: required(text(value.createdAt), 'createdAt'),
    languages,
    topRepos: repos(value.topRepos, 'topRepos'),
  };
  if (value.recentRepos !== undefined) profile.recentRepos = repos(value.recentRepos, 'recentRepos');
  const forks = count(value.totalForks);
  if (forks !== null) profile.totalForks = forks;
  const active = count(value.activeRepos);
  if (active !== null) profile.activeRepos = active;
  const fetchedAt = text(value.fetchedAt);
  if (fetchedAt !== null) profile.fetchedAt = fetchedAt;
  return profile;
}

export interface ServiceProfile {
  profile: Profile;
  /** Null when the server could not read the person's calendar. The rest of the profile is still good. */
  contributions: Contributions | null;
}

/** How long to wait, in seconds, from a Retry-After header, or null when it says nothing usable. */
function retryAfter(headers: Headers): number | null {
  const seconds = Number(headers.get('retry-after'));
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
}

/**
 * Reads a person's profile and contribution calendar from a livebio server. Throws a GitHubError, so callers can
 * treat it like a direct read: not-found and invalid-username are final answers, while anything else means the
 * server could not help and the caller may fall back to asking GitHub directly.
 */
export async function fetchProfileViaService(baseUrl: string, username: string, opts: Pick<FetchOptions, 'fetch'> = {}): Promise<ServiceProfile> {
  if (!isValidUsername(username)) throw new GitHubError('That is not a valid GitHub username.', 'invalid-username');
  const url = new URL('/profile', baseUrl);
  url.searchParams.set('user', username);

  let response: Response;
  try {
    response = await (opts.fetch ?? fetch)(url, { headers: { Accept: 'application/json' } });
  } catch {
    throw new GitHubError('Could not reach the livebio server.', 'network');
  }

  if (response.status === 404) throw new GitHubError('That GitHub user was not found.', 'not-found');
  if (response.status === 400) throw new GitHubError('That is not a valid GitHub username.', 'invalid-username');
  if (response.status === 503 || response.status === 429) {
    const wait = retryAfter(response.headers);
    throw new GitHubError('The livebio server is busy.', 'rate-limit', wait ? new Date(Date.now() + wait * 1000) : undefined);
  }
  if (!response.ok) throw new GitHubError(`The livebio server answered ${response.status}.`, 'unknown');

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw bad('it was not JSON');
  }
  if (!isRecord(json)) throw bad('the reply is not an object');

  const profile = parseServiceProfile(json.profile);
  let contributions: Contributions | null = null;
  if (json.contributions !== null && json.contributions !== undefined) {
    try {
      contributions = parseContributions(json.contributions);
    } catch {
      // A calendar that cannot be read leaves the profile as it is, without one.
      contributions = null;
    }
  }
  return { profile, contributions };
}
