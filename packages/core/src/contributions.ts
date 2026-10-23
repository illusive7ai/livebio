import { GitHubError, type FetchOptions } from './github';
import type { ContributionDay, Contributions } from './types';
import { isValidUsername } from './util';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DAYS = 400;
const MAX_COUNT = 100_000;
const MS_PER_DAY = 86_400_000;
const GRAPHQL = 'https://api.github.com/graphql';

export const CONTRIBUTIONS_QUERY = `query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount contributionLevel } }
      }
    }
  }
}`;

const LEVELS: Record<string, ContributionDay['level']> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

/** True only for dates that exist, so 2026-02-30 and 2026-13-45 are refused. */
function isRealDate(date: string): boolean {
  if (!DATE.test(date)) return false;
  const time = Date.parse(`${date}T00:00:00Z`);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === date;
}

function dayNumber(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1) / MS_PER_DAY;
}

/**
 * Streaks over consecutive calendar days. A streak is "current" if it reaches today, or
 * yesterday when today has no activity yet, which is how GitHub itself counts it.
 */
export function computeStreaks(days: ReadonlyArray<{ date: string; count: number }>): {
  current: number;
  longest: number;
  activeDays: number;
} {
  let longest = 0;
  let run = 0;
  let activeDays = 0;
  days.forEach((day, index) => {
    if (day.count <= 0) {
      run = 0;
      return;
    }
    activeDays++;
    const previous = days[index - 1];
    const continues = previous !== undefined && previous.count > 0 && dayNumber(day.date) - dayNumber(previous.date) === 1;
    run = continues ? run + 1 : 1;
    longest = Math.max(longest, run);
  });

  let end = days.length - 1;
  if (end >= 0 && (days[end]?.count ?? 0) === 0) end--;
  let current = 0;
  for (let i = end; i >= 0; i--) {
    const day = days[i];
    if (!day || day.count <= 0) break;
    const next = days[i + 1];
    if (next && next.count > 0 && dayNumber(next.date) - dayNumber(day.date) !== 1) break;
    current++;
  }
  return { current, longest, activeDays };
}

/** Contributions added up for each calendar week (weeks start on Sunday), oldest first. */
export function weeklyTotals(days: ReadonlyArray<{ date: string; count: number }>): number[] {
  const weeks: number[] = [];
  days.forEach((day, index) => {
    const weekday = new Date(`${day.date}T00:00:00Z`).getUTCDay();
    if (index === 0 || weekday === 0) weeks.push(0);
    weeks[weeks.length - 1] = (weeks[weeks.length - 1] ?? 0) + day.count;
  });
  return weeks;
}

/** The last `count` calendar weeks of activity, oldest first. The newest may be a partial week. */
export function recentWeeks(days: ReadonlyArray<{ date: string; count: number }>, count: number): number[] {
  // slice(-0) would return everything, so a count of zero or less is handled on its own.
  return count > 0 ? weeklyTotals(days).slice(-count) : [];
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** The calendar month with the most contributions, or null if there were none. */
export function busiestMonth(days: ReadonlyArray<{ date: string; count: number }>): { name: string; total: number } | null {
  const totals = new Map<string, number>();
  for (const day of days) {
    const key = day.date.slice(0, 7);
    totals.set(key, (totals.get(key) ?? 0) + day.count);
  }
  let best: { key: string; total: number } | null = null;
  for (const [key, total] of totals) {
    if (total > 0 && (!best || total > best.total)) best = { key, total };
  }
  if (!best) return null;
  return { name: MONTH_NAMES[Number(best.key.slice(5, 7)) - 1] ?? best.key, total: best.total };
}

function invalid(reason: string): GitHubError {
  return new GitHubError(`The contribution data was not valid: ${reason}.`, 'unknown');
}

/** Sorts and checks the days, then works out every derived figure itself. */
export function buildContributions(input: ContributionDay[]): Contributions {
  if (input.length === 0) throw invalid('it had no days');
  if (input.length > MAX_DAYS) throw invalid('it had too many days');
  const days = [...input].sort((a, b) => a.date.localeCompare(b.date));
  for (let i = 1; i < days.length; i++) {
    if (days[i]?.date === days[i - 1]?.date) throw invalid('a date appeared twice');
  }
  const { current, longest, activeDays } = computeStreaks(days);
  return {
    from: days[0]!.date,
    to: days[days.length - 1]!.date,
    total: days.reduce((sum, day) => sum + day.count, 0),
    activeDays,
    currentStreak: current,
    longestStreak: longest,
    days,
  };
}

/** Reads GitHub's GraphQL reply for the contribution calendar. */
export function parseCalendarResponse(body: unknown): Contributions {
  const root = asRecord(body);
  const errors = Array.isArray(root?.errors) ? (root.errors as unknown[]) : [];
  const type = asRecord(errors[0])?.type;
  if (type === 'NOT_FOUND') throw new GitHubError('That GitHub user was not found.', 'not-found');
  if (type === 'RATE_LIMITED') throw new GitHubError('GitHub rate limit reached.', 'rate-limit');

  const user = asRecord(asRecord(root?.data)?.user);
  if (!user) {
    if (errors.length > 0) throw new GitHubError('GitHub returned an error.', 'unknown');
    throw new GitHubError('That GitHub user was not found.', 'not-found');
  }

  const weeks = asRecord(asRecord(user.contributionsCollection)?.contributionCalendar)?.weeks;
  if (!Array.isArray(weeks)) throw invalid('the calendar was missing');

  const days: ContributionDay[] = [];
  for (const week of weeks) {
    const list = asRecord(week)?.contributionDays;
    if (!Array.isArray(list)) throw invalid('a week was missing its days');
    for (const raw of list) {
      const day = asRecord(raw);
      const date = day?.date;
      const count = day?.contributionCount;
      if (typeof date !== 'string' || !isRealDate(date) || typeof count !== 'number') throw invalid('a day was malformed');
      days.push({ date, count, level: LEVELS[String(day?.contributionLevel)] ?? 0 });
    }
  }
  return buildContributions(days);
}

/**
 * Strictly validates contribution JSON from another service, such as the livebio edge function.
 * Only `days` is read: totals and streaks are recomputed, so they cannot be made inconsistent.
 */
export function parseContributions(json: unknown): Contributions {
  const list = asRecord(json)?.days;
  if (!Array.isArray(list)) throw invalid('"days" was missing');
  const days: ContributionDay[] = list.map((raw) => {
    const day = asRecord(raw);
    const date = day?.date;
    const count = day?.count;
    const level = day?.level;
    const countOk = typeof count === 'number' && Number.isInteger(count) && count >= 0 && count <= MAX_COUNT;
    const levelOk = typeof level === 'number' && Number.isInteger(level) && level >= 0 && level <= 4;
    if (typeof date !== 'string' || !isRealDate(date) || !countOk || !levelOk) throw invalid('a day was malformed');
    return { date, count, level: level as ContributionDay['level'] };
  });
  return buildContributions(days);
}

function statusError(status: number, headers: Headers): GitHubError {
  if (status === 401) return new GitHubError('GitHub did not accept the token.', 'unauthorized');
  const exhausted = headers.get('x-ratelimit-remaining') === '0';
  if (status === 429 || (status === 403 && exhausted)) {
    const reset = Number(headers.get('x-ratelimit-reset'));
    return new GitHubError(
      'GitHub rate limit reached.',
      'rate-limit',
      Number.isFinite(reset) && reset > 0 ? new Date(reset * 1000) : undefined,
    );
  }
  if (status === 404) return new GitHubError('That GitHub user was not found.', 'not-found');
  return new GitHubError(`GitHub returned an unexpected error (${status}).`, 'unknown');
}

/**
 * Reads a user's contribution calendar from GitHub's GraphQL API. GraphQL always needs a token,
 * so this is for the Action (which has one) and the edge function, never for a browser.
 */
export async function fetchContributions(username: string, opts: FetchOptions = {}): Promise<Contributions> {
  if (!isValidUsername(username)) throw new GitHubError('That is not a valid GitHub username.', 'invalid-username');
  if (!opts.token) throw new GitHubError('A token is needed to read contributions.', 'unauthorized');

  let response: Response;
  try {
    response = await (opts.fetch ?? fetch)(GRAPHQL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${opts.token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'livebio',
      },
      body: JSON.stringify({ query: CONTRIBUTIONS_QUERY, variables: { login: username } }),
    });
  } catch {
    throw new GitHubError('Could not reach GitHub. Check your connection and try again.', 'network');
  }
  if (!response.ok) {
    const error = statusError(response.status, response.headers);
    if (error.kind === 'unknown') {
      // GitHub's own explanation of an unexpected status, kept short. It never contains the token.
      const detail = (await response.text().catch(() => '')).replace(/\s+/g, ' ').slice(0, 200);
      if (detail) error.message = `${error.message} ${detail}`;
    }
    throw error;
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw invalid('GitHub sent something that was not JSON');
  }
  return parseCalendarResponse(body);
}

/** Reads contributions from a livebio edge function, for use in the browser. */
export async function fetchContributionsViaProxy(
  baseUrl: string,
  username: string,
  opts: Pick<FetchOptions, 'fetch'> = {},
): Promise<Contributions> {
  if (!isValidUsername(username)) throw new GitHubError('That is not a valid GitHub username.', 'invalid-username');
  const url = new URL(baseUrl);
  url.searchParams.set('user', username);

  let response: Response;
  try {
    response = await (opts.fetch ?? fetch)(url, { headers: { Accept: 'application/json' } });
  } catch {
    throw new GitHubError('Could not reach the contribution service.', 'network');
  }
  if (!response.ok) throw statusError(response.status === 503 ? 429 : response.status, response.headers);

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw invalid('the service sent something that was not JSON');
  }
  return parseContributions(json);
}
