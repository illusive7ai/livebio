import { describe, expect, it } from 'vitest';
import {
  CONTRIBUTIONS_QUERY,
  buildContributions,
  computeStreaks,
  fetchContributions,
  fetchContributionsViaProxy,
  parseCalendarResponse,
  parseContributions,
} from './contributions';
import type { ContributionDay } from './types';

/** Consecutive days starting at `start`, one per count. */
function daysFrom(start: string, counts: number[]): ContributionDay[] {
  const first = Date.parse(`${start}T00:00:00Z`);
  return counts.map((count, i) => ({
    date: new Date(first + i * 86_400_000).toISOString().slice(0, 10),
    count,
    level: count === 0 ? 0 : count > 8 ? 4 : count > 4 ? 3 : count > 2 ? 2 : 1,
  }));
}

describe('computeStreaks', () => {
  it('handles no days and a year of nothing', () => {
    expect(computeStreaks([])).toEqual({ current: 0, longest: 0, activeDays: 0 });
    expect(computeStreaks(daysFrom('2026-01-01', [0, 0, 0]))).toEqual({ current: 0, longest: 0, activeDays: 0 });
  });

  it('counts a run that reaches the last day', () => {
    expect(computeStreaks(daysFrom('2026-01-01', [0, 1, 2, 3]))).toEqual({ current: 3, longest: 3, activeDays: 3 });
  });

  it('keeps the streak alive when today has nothing yet but yesterday did', () => {
    expect(computeStreaks(daysFrom('2026-01-01', [1, 1, 1, 0])).current).toBe(3);
  });

  it('ends the streak when a whole day was missed', () => {
    expect(computeStreaks(daysFrom('2026-01-01', [1, 1, 0, 0])).current).toBe(0);
  });

  it('separates the current streak from the longest', () => {
    expect(computeStreaks(daysFrom('2026-01-01', [1, 1, 1, 1, 1, 0, 1, 1]))).toEqual({
      current: 2,
      longest: 5,
      activeDays: 7,
    });
  });

  it('does not join days that are not consecutive dates', () => {
    const gap = [
      { date: '2026-01-01', count: 1 },
      { date: '2026-01-03', count: 1 },
    ];
    expect(computeStreaks(gap)).toEqual({ current: 1, longest: 1, activeDays: 2 });
  });

  it('copes with month, year and leap-day boundaries', () => {
    expect(computeStreaks(daysFrom('2027-12-30', [1, 1, 1, 1])).longest).toBe(4);
    expect(computeStreaks(daysFrom('2028-02-27', [1, 1, 1, 1])).longest).toBe(4); // 2028 is a leap year
  });
});

describe('buildContributions', () => {
  it('sorts, totals and summarises', () => {
    const shuffled = daysFrom('2026-01-01', [2, 0, 3]).reverse();
    const result = buildContributions(shuffled);
    expect(result.days.map((d) => d.date)).toEqual(['2026-01-01', '2026-01-02', '2026-01-03']);
    expect(result).toMatchObject({ from: '2026-01-01', to: '2026-01-03', total: 5, activeDays: 2, currentStreak: 1 });
  });

  it('rejects nothing, duplicates and absurd sizes', () => {
    expect(() => buildContributions([])).toThrow(/no days/);
    const dup = daysFrom('2026-01-01', [1, 1]);
    dup[1]!.date = dup[0]!.date;
    expect(() => buildContributions(dup)).toThrow(/twice/);
    expect(() => buildContributions(daysFrom('2025-01-01', Array(401).fill(1)))).toThrow(/too many/);
  });
});

function calendarBody(weeks: Array<Array<{ date: string; contributionCount: number; contributionLevel: string }>>) {
  return {
    data: {
      user: {
        contributionsCollection: {
          contributionCalendar: {
            totalContributions: 0,
            weeks: weeks.map((contributionDays) => ({ contributionDays })),
          },
        },
      },
    },
  };
}

describe('parseCalendarResponse', () => {
  it('flattens weeks into days and maps levels', () => {
    const result = parseCalendarResponse(
      calendarBody([
        [
          { date: '2026-01-01', contributionCount: 0, contributionLevel: 'NONE' },
          { date: '2026-01-02', contributionCount: 4, contributionLevel: 'SECOND_QUARTILE' },
        ],
        [{ date: '2026-01-03', contributionCount: 9, contributionLevel: 'FOURTH_QUARTILE' }],
      ]),
    );
    expect(result.days.map((d) => d.level)).toEqual([0, 2, 4]);
    expect(result.total).toBe(13);
    expect(result.currentStreak).toBe(2);
  });

  it('treats an unknown level as none rather than failing', () => {
    const result = parseCalendarResponse(
      calendarBody([[{ date: '2026-01-01', contributionCount: 1, contributionLevel: 'SOMETHING_NEW' }]]),
    );
    expect(result.days[0]?.level).toBe(0);
  });

  it('reports a missing user', () => {
    expect(() => parseCalendarResponse({ data: { user: null } })).toThrow(/not found/);
    expect(() => parseCalendarResponse({ errors: [{ type: 'NOT_FOUND' }] })).toThrowError(
      expect.objectContaining({ kind: 'not-found' }),
    );
  });

  it('reports GitHub’s own rate-limit error', () => {
    expect(() => parseCalendarResponse({ errors: [{ type: 'RATE_LIMITED' }] })).toThrowError(
      expect.objectContaining({ kind: 'rate-limit' }),
    );
  });

  it.each([
    ['not an object', 'text'],
    ['an empty object', {}],
    ['no calendar', { data: { user: { contributionsCollection: {} } } }],
    ['a malformed day', calendarBody([[{ date: 'yesterday', contributionCount: 1, contributionLevel: 'NONE' }]])],
    ['a non-numeric count', calendarBody([[{ date: '2026-01-01', contributionCount: '5' as never, contributionLevel: 'NONE' }]])],
  ])('rejects %s', (_label, body) => {
    expect(() => parseCalendarResponse(body)).toThrow();
  });
});

describe('parseContributions', () => {
  const good = { days: daysFrom('2026-01-01', [1, 0, 2]) };

  it('accepts 29 February in a leap year', () => {
    expect(() => parseContributions({ days: [{ date: '2028-02-29', count: 1, level: 1 }] })).not.toThrow();
  });

  it('accepts valid data and recomputes every derived figure', () => {
    const forged = { ...good, total: 99999, currentStreak: 999, longestStreak: 999, activeDays: 999 };
    const result = parseContributions(forged);
    expect(result).toMatchObject({ total: 3, currentStreak: 1, longestStreak: 1, activeDays: 2 });
  });

  it.each([
    ['no days', {}],
    ['days that are not a list', { days: 'x' }],
    ['a bad date', { days: [{ date: '2026-13-45x', count: 1, level: 1 }] }],
    ['a month that does not exist', { days: [{ date: '2026-13-01', count: 1, level: 1 }] }],
    ['a day that does not exist', { days: [{ date: '2026-02-30', count: 1, level: 1 }] }],
    ['29 February in a non-leap year', { days: [{ date: '2027-02-29', count: 1, level: 1 }] }],
    ['a negative count', { days: [{ date: '2026-01-01', count: -1, level: 0 }] }],
    ['a fractional count', { days: [{ date: '2026-01-01', count: 1.5, level: 1 }] }],
    ['an absurd count', { days: [{ date: '2026-01-01', count: 1e9, level: 4 }] }],
    ['a level out of range', { days: [{ date: '2026-01-01', count: 1, level: 7 }] }],
    ['a level that is text', { days: [{ date: '2026-01-01', count: 1, level: 'high' }] }],
  ])('rejects %s', (_label, input) => {
    expect(() => parseContributions(input)).toThrow();
  });
});

describe('fetchContributions', () => {
  const okBody = calendarBody([[{ date: '2026-01-01', contributionCount: 3, contributionLevel: 'SECOND_QUARTILE' }]]);

  it('asks GraphQL for the right user with the token, and parses the reply', async () => {
    let seen: { url: string; init: RequestInit } | undefined;
    const fetcher = (async (url: RequestInfo | URL, init?: RequestInit) => {
      seen = { url: String(url), init: init! };
      return new Response(JSON.stringify(okBody));
    }) as typeof fetch;

    const result = await fetchContributions('octo', { token: 'secret', fetch: fetcher });
    expect(result.total).toBe(3);
    expect(seen?.url).toBe('https://api.github.com/graphql');
    expect((seen?.init.headers as Record<string, string>).Authorization).toBe('Bearer secret');
    const sent = JSON.parse(String(seen?.init.body));
    expect(sent.variables).toEqual({ login: 'octo' });
    expect(sent.query).toBe(CONTRIBUTIONS_QUERY);
  });

  it('refuses without a token and for bad usernames, before any request', async () => {
    const never = (() => {
      throw new Error('should not be called');
    }) as unknown as typeof fetch;
    await expect(fetchContributions('octo', { fetch: never })).rejects.toMatchObject({ kind: 'unauthorized' });
    await expect(fetchContributions('../x', { token: 't', fetch: never })).rejects.toMatchObject({ kind: 'invalid-username' });
  });

  it.each([
    [401, {}, 'unauthorized'],
    [403, { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '1800000000' }, 'rate-limit'],
    [429, {}, 'rate-limit'],
    [500, {}, 'unknown'],
  ])('maps HTTP %i to %s', async (status, headers, kind) => {
    const fetcher = (async () => new Response('{}', { status, headers })) as unknown as typeof fetch;
    await expect(fetchContributions('octo', { token: 't', fetch: fetcher })).rejects.toMatchObject({ kind });
  });

  it('reports network failures and non-JSON replies', async () => {
    const offline = (async () => {
      throw new TypeError('failed');
    }) as unknown as typeof fetch;
    await expect(fetchContributions('octo', { token: 't', fetch: offline })).rejects.toMatchObject({ kind: 'network' });
    const html = (async () => new Response('<html>')) as unknown as typeof fetch;
    await expect(fetchContributions('octo', { token: 't', fetch: html })).rejects.toThrow(/not valid/);
  });

  it('never puts the token in an error message', async () => {
    const fetcher = (async () => new Response('{}', { status: 401 })) as unknown as typeof fetch;
    const error = await fetchContributions('octo', { token: 'ghp_SECRET', fetch: fetcher }).catch((e: Error) => e);
    expect((error as Error).message).not.toContain('ghp_SECRET');
  });
});

describe('fetchContributionsViaProxy', () => {
  const payload = { days: daysFrom('2026-01-01', [1, 2, 3]) };

  it('adds the username to the service URL and validates the reply', async () => {
    let requested = '';
    const fetcher = (async (url: RequestInfo | URL) => {
      requested = String(url);
      return new Response(JSON.stringify(payload));
    }) as typeof fetch;
    const result = await fetchContributionsViaProxy('https://svc.example/api', 'octo', { fetch: fetcher });
    expect(requested).toBe('https://svc.example/api?user=octo');
    expect(result.total).toBe(6);
  });

  it.each([
    [503, 'rate-limit'],
    [404, 'not-found'],
    [500, 'unknown'],
  ])('maps the service’s %i reply to %s', async (status, kind) => {
    const fetcher = (async () => new Response('{}', { status })) as unknown as typeof fetch;
    await expect(fetchContributionsViaProxy('https://svc.example', 'octo', { fetch: fetcher })).rejects.toMatchObject({ kind });
  });

  it('does not trust a service that sends malformed data', async () => {
    const bad = (async () => new Response(JSON.stringify({ days: [{ date: 'x', count: 1, level: 1 }] }))) as unknown as typeof fetch;
    await expect(fetchContributionsViaProxy('https://svc.example', 'octo', { fetch: bad })).rejects.toThrow(/not valid/);
  });

  it('reports an unreachable service', async () => {
    const offline = (async () => {
      throw new TypeError('failed');
    }) as unknown as typeof fetch;
    await expect(fetchContributionsViaProxy('https://svc.example', 'octo', { fetch: offline })).rejects.toMatchObject({
      kind: 'network',
    });
  });
});
