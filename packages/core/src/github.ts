import type { LanguageShare, Profile, RepoSummary } from './types';
import { isValidUsername } from './util';

export type GitHubErrorKind =
  | 'invalid-username'
  | 'not-found'
  | 'rate-limit'
  | 'unauthorized'
  | 'network'
  | 'unknown';

export class GitHubError extends Error {
  constructor(
    message: string,
    readonly kind: GitHubErrorKind,
    /** When the rate limit resets, if GitHub told us. */
    readonly resetAt?: Date,
  ) {
    super(message);
    this.name = 'GitHubError';
  }
}

export interface FetchOptions {
  /** Optional token. Without one, GitHub allows 60 requests per hour per IP. */
  token?: string;
  fetch?: typeof fetch;
  /** Pages of 100 repositories to read. Defaults to 3. */
  maxRepoPages?: number;
  /** The current time. Tests pass a fixed one so "recently active" is repeatable. */
  now?: () => Date;
}

/** How many of a user's most-starred repositories are kept. Templates show as many as suit them. */
export const TOP_REPOS = 6;

/** A repository counts as recently active if it was pushed to within this many days. */
export const ACTIVE_WINDOW_DAYS = 90;

interface ApiUser {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  company: string | null;
  location: string | null;
  blog: string | null;
  html_url: string;
  followers: number;
  following: number;
  public_repos: number;
  created_at: string;
}

interface ApiRepo {
  name: string;
  description: string | null;
  fork: boolean;
  archived: boolean;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  html_url: string;
  pushed_at?: string | null;
  license?: { spdx_id?: string | null } | null;
}

const API = 'https://api.github.com';
const PAGE_SIZE = 100;

function blankToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

async function request<T>(path: string, opts: FetchOptions): Promise<T> {
  const doFetch = opts.fetch ?? fetch;
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;

  let response: Response;
  try {
    response = await doFetch(`${API}${path}`, { headers });
  } catch {
    throw new GitHubError('Could not reach GitHub. Check your connection and try again.', 'network');
  }

  if (response.ok) return (await response.json()) as T;

  if (response.status === 404) {
    throw new GitHubError('That GitHub user was not found.', 'not-found');
  }
  const exhausted = response.headers.get('x-ratelimit-remaining') === '0';
  if (response.status === 429 || (response.status === 403 && exhausted)) {
    const reset = Number(response.headers.get('x-ratelimit-reset'));
    throw new GitHubError(
      'GitHub rate limit reached.',
      'rate-limit',
      Number.isFinite(reset) && reset > 0 ? new Date(reset * 1000) : undefined,
    );
  }
  throw new GitHubError(`GitHub returned an unexpected error (${response.status}).`, 'unknown');
}

function languageShares(repos: ApiRepo[]): LanguageShare[] {
  const counts = new Map<string, number>();
  for (const repo of repos) {
    if (repo.language) counts.set(repo.language, (counts.get(repo.language) ?? 0) + 1);
  }
  const total = [...counts.values()].reduce((sum, n) => sum + n, 0);
  if (total === 0) return [];
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name, count]) => ({ name, percent: Math.round((count / total) * 100) }));
}

/** GitHub reports "NOASSERTION" when it cannot recognise a licence, which says nothing useful. */
function licenseOf(repo: ApiRepo): string | null {
  const id = repo.license?.spdx_id?.trim();
  return id && id !== 'NOASSERTION' ? id : null;
}

function summarise(repo: ApiRepo): RepoSummary {
  return {
    name: repo.name,
    description: blankToNull(repo.description),
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    language: repo.language,
    url: repo.html_url,
    pushedAt: repo.pushed_at ?? null,
    license: licenseOf(repo),
  };
}

/**
 * Reads a user's public profile and repositories. Forks are ignored for stars,
 * languages and top projects, so the numbers describe the user's own work.
 */
export async function fetchProfile(username: string, opts: FetchOptions = {}): Promise<Profile> {
  if (!isValidUsername(username)) {
    throw new GitHubError('That is not a valid GitHub username.', 'invalid-username');
  }

  const user = await request<ApiUser>(`/users/${username}`, opts);

  const repos: ApiRepo[] = [];
  const maxPages = opts.maxRepoPages ?? 3;
  for (let page = 1; page <= maxPages; page++) {
    const batch = await request<ApiRepo[]>(
      `/users/${username}/repos?per_page=${PAGE_SIZE}&type=owner&sort=pushed&page=${page}`,
      opts,
    );
    repos.push(...batch);
    if (batch.length < PAGE_SIZE) break;
  }

  const now = (opts.now ?? (() => new Date()))();
  const cutoff = now.getTime() - ACTIVE_WINDOW_DAYS * 86_400_000;

  const own = repos.filter((repo) => !repo.fork);
  const activeRepos = own.filter((repo) => {
    const pushed = repo.pushed_at ? Date.parse(repo.pushed_at) : NaN;
    return !repo.archived && Number.isFinite(pushed) && pushed >= cutoff;
  }).length;
  const topRepos = own
    .filter((repo) => !repo.archived)
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, TOP_REPOS)
    .map(summarise);
  const recentRepos = own
    .filter((repo) => !repo.archived && Number.isFinite(Date.parse(repo.pushed_at ?? '')))
    .sort((a, b) => Date.parse(b.pushed_at!) - Date.parse(a.pushed_at!) || a.name.localeCompare(b.name))
    .slice(0, TOP_REPOS)
    .map(summarise);

  return {
    login: user.login,
    name: blankToNull(user.name),
    avatarUrl: user.avatar_url,
    bio: blankToNull(user.bio),
    company: blankToNull(user.company),
    location: blankToNull(user.location),
    website: blankToNull(user.blog),
    url: user.html_url,
    followers: user.followers,
    following: user.following,
    publicRepos: user.public_repos,
    totalStars: own.reduce((sum, repo) => sum + repo.stargazers_count, 0),
    totalForks: own.reduce((sum, repo) => sum + repo.forks_count, 0),
    activeRepos,
    fetchedAt: now.toISOString(),
    createdAt: user.created_at,
    languages: languageShares(own).slice(0, 5),
    topRepos,
    recentRepos,
  };
}
