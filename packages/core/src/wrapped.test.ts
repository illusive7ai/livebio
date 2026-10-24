import { describe, expect, it } from 'vitest';
import { buildContributions } from './contributions';
import { bare, profile, wellFormed } from './testkit';
import type { ContributionDay, Profile } from './types';
import { computeWrapped, longestRun, traitsOf } from './wrapped';
import { longDate, renderWrappedCard, renderWrappedCity, wrappedAlt } from './wrappedCard';

/** Builds a calendar from date and count pairs, filling the days between with nothing. */
function calendar(start: string, counts: number[]): ContributionDay[] {
  const first = Date.parse(`${start}T00:00:00Z`);
  return counts.map((count, i) => ({
    date: new Date(first + i * 86_400_000).toISOString().slice(0, 10),
    count,
    level: (count === 0 ? 0 : Math.min(4, Math.ceil(count / 3))) as 0 | 1 | 2 | 3 | 4,
  }));
}
const withDays = (days: ContributionDay[], over: Partial<Profile> = {}): Profile => ({ ...profile, ...over, contributions: buildContributions(days) });

describe('longestRun', () => {
  const days = calendar('2026-01-01', [1, 1, 0, 2, 2, 2, 0, 0, 1]);
  it('finds the longest run of active days with its dates', () => {
    expect(longestRun(days, true)).toEqual({ length: 3, from: '2026-01-04', to: '2026-01-06' });
  });
  it('finds the longest run of empty days', () => {
    expect(longestRun(days, false)).toEqual({ length: 2, from: '2026-01-07', to: '2026-01-08' });
  });
  it('returns null when no day matches', () => {
    expect(longestRun(calendar('2026-01-01', [0, 0]), true)).toBeNull();
    expect(longestRun(calendar('2026-01-01', [1, 1]), false)).toBeNull();
    expect(longestRun([], true)).toBeNull();
  });
  it('does not join days that are not neighbours on the calendar', () => {
    const gap = [{ date: '2026-01-01', count: 1, level: 1 as const }, { date: '2026-01-05', count: 1, level: 1 as const }];
    expect(longestRun(gap, true)?.length).toBe(1);
  });
  it('counts a run that reaches the end', () => {
    expect(longestRun(calendar('2026-02-01', [0, 3, 3, 3, 3]), true)).toEqual({ length: 4, from: '2026-02-02', to: '2026-02-05' });
  });
});

describe('computeWrapped', () => {
  const data = computeWrapped(profile)!;
  const c = profile.contributions!;

  it('has nothing to say without a calendar', () => {
    expect(computeWrapped(bare)).toBeNull();
    expect(computeWrapped({ ...profile, contributions: undefined })).toBeNull();
  });

  it('takes its totals straight from the calendar', () => {
    expect(data.total).toBe(c.total);
    expect(data.activeDays).toBe(c.activeDays);
    expect(data.days).toBe(c.days.length);
    expect(data.currentStreak).toBe(c.currentStreak);
    expect(data.longestStreak?.length).toBe(c.longestStreak);
    expect(data.from).toBe(c.from);
    expect(data.to).toBe(c.to);
    expect(data.activePercent).toBe(Math.round((c.activeDays / c.days.length) * 100));
  });

  it('adds up months, weekdays and weeks to the same total', () => {
    expect(data.months.reduce((s, m) => s + m.total, 0)).toBe(data.total);
    expect(data.weekdays.reduce((s, w) => s + w.total, 0)).toBe(data.total);
    expect(data.weekdays.map((w) => w.name)).toEqual(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);
  });

  it('puts every day in the right month and weekday', () => {
    const d = computeWrapped(withDays(calendar('2026-01-30', [1, 2, 4, 8, 16])))!;
    // 2026-01-30 is a Friday.
    expect(d.months.map((m) => [m.key, m.total])).toEqual([['2026-01', 3], ['2026-02', 28]]);
    expect(d.weekdays.map((w) => w.total)).toEqual([8, 16, 0, 0, 1, 2, 4]);
  });

  it('names the busiest day, month and weekday from the counts', () => {
    const d = computeWrapped(withDays(calendar('2026-03-01', [1, 1, 9, 1, 1, 1, 1, ...Array(40).fill(0)])))!;
    expect(d.busiestDay).toEqual({ date: '2026-03-03', count: 9 });
    expect(d.busiestMonth).toMatchObject({ key: '2026-03', label: 'March', total: 15 });
    expect(d.busiestWeekday).toEqual({ name: 'Tuesday', total: 9 });
  });

  it('works out the weekend share and the best week', () => {
    // 2026-03-02 is a Monday. Mon 2, Sat 3, Sun 5, then Mon 1: 8 of 11 landed on the weekend.
    const d = computeWrapped(withDays(calendar('2026-03-02', [2, 0, 0, 0, 0, 3, 5, 1, 0, 0, 0, 0, 0, 0])))!;
    expect(d.weekendShare).toBe(73);
    expect(d.bestWeek).toEqual({ from: '2026-03-02', total: 10 });
  });

  it('has no busiest anything, and no weekend share, for a year with nothing', () => {
    const d = computeWrapped(withDays(calendar('2026-03-01', Array(30).fill(0))))!;
    expect(d.total).toBe(0);
    expect(d.busiestDay).toBeNull();
    expect(d.busiestMonth).toBeNull();
    expect(d.busiestWeekday).toBeNull();
    expect(d.weekendShare).toBeNull();
    expect(d.bestWeek).toBeNull();
    expect(d.longestStreak).toBeNull();
    expect(d.traits.map((t) => t.id)).toEqual(['quiet']);
  });

  it('takes the top repositories by stars and the top three languages', () => {
    expect(data.topRepos.map((r) => r.name)).toEqual(['alpha', 'beta', 'gamma']);
    expect(data.languages.map((l) => l.name)).toEqual(['Go', 'Rust', 'Zig']);
    expect(data.stars).toBe(profile.totalStars);
  });

  it('measures the age of the account up to the end of the calendar, not today', () => {
    expect(data.yearsOnGitHub).toBe(7);
    expect(computeWrapped({ ...profile, createdAt: 'nonsense' })!.yearsOnGitHub).toBeNull();
    expect(computeWrapped({ ...profile, createdAt: '2030-01-01T00:00:00Z' })!.yearsOnGitHub).toBeNull();
  });
});

describe('the labels', () => {
  const base = computeWrapped(profile)!;
  const { traits: _t, ...plain } = base;
  const ids = (over: Partial<typeof plain>) => traitsOf({ ...plain, ...over }).map((t) => t.id);

  it('only appear when the numbers earn them, each with its reason', () => {
    expect(ids({ longestStreak: { length: 13, from: 'a', to: 'b' } })).not.toContain('streak-keeper');
    expect(ids({ longestStreak: { length: 14, from: 'a', to: 'b' } })).toContain('streak-keeper');
    expect(ids({ activePercent: 49 })).not.toContain('steady');
    expect(ids({ activePercent: 50 })).toContain('steady');
    expect(ids({ weekendShare: 35 })).toContain('weekend-warrior');
    expect(ids({ weekendShare: 34 })).not.toContain('weekend-warrior');
    expect(ids({ weekendShare: 10 })).toContain('weekday-regular');
    expect(ids({ weekendShare: 11 })).not.toContain('weekday-regular');
    for (const t of traitsOf({ ...plain, longestStreak: { length: 30, from: 'a', to: 'b' }, activePercent: 80 })) {
      expect(t.reason.length).toBeGreaterThan(10);
    }
  });

  it('states the real figure in the reason', () => {
    const t = traitsOf({ ...plain, weekendShare: 41 }).find((x) => x.id === 'weekend-warrior')!;
    expect(t.reason).toContain('41%');
    const s = traitsOf({ ...plain, longestStreak: { length: 21, from: 'a', to: 'b' } }).find((x) => x.id === 'streak-keeper')!;
    expect(s.reason).toContain('21 days');
  });

  it('do not claim a rhythm from a handful of contributions', () => {
    const tiny = ids({ total: 30, weekendShare: 60, busiestMonth: { key: '2026-01', label: 'January', total: 30 }, busiestDay: { date: '2026-01-01', count: 20 } });
    expect(tiny).not.toContain('weekend-warrior');
    expect(tiny).not.toContain('sprinter');
    expect(tiny).not.toContain('big-day');
  });

  it('never invent a time of day or a comparison with another year', () => {
    const everything = traitsOf({ ...plain, longestStreak: { length: 99, from: 'a', to: 'b' }, activePercent: 90, weekendShare: 50, stars: 5000, yearsOnGitHub: 12 });
    expect(everything.length).toBeLessThanOrEqual(4);
    for (const t of everything) expect(`${t.title} ${t.reason}`).not.toMatch(/night|morning|owl|last year|compared|more than/i);
  });
});

describe('the Wrapped card', () => {
  const data = computeWrapped(profile)!;

  it.each(['dark', 'light'] as const)('is well formed in %s mode and says only what the data says', (variant) => {
    const svg = renderWrappedCard(data, variant);
    expect(wellFormed(svg)).toEqual([]);
    expect(svg).toContain(data.total.toLocaleString('en-US'));
    expect(svg).toContain(`@${data.login}`);
    expect(svg).toContain('Made with livebio by illusivehacks');
    expect(svg).not.toMatch(/NaN|undefined|Infinity|null/);
  });

  it('leaves the credit out when asked', () => {
    expect(renderWrappedCard(data, 'dark', false)).not.toContain('illusivehacks');
  });

  it('has one bar for each month, and marks the busiest', () => {
    const svg = renderWrappedCard(data, 'dark');
    for (const m of data.months) expect(svg).toContain(`>${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][Number(m.key.slice(5, 7)) - 1]}<`);
    expect(svg).toContain('first and last months are partial');
  });

  it('describes itself with the real numbers', () => {
    const alt = wrappedAlt(data);
    expect(alt).toContain(`${data.total.toLocaleString('en-US')} contributions`);
    expect(alt).toContain(`${data.activeDays} active days`);
    expect(longDate('2026-03-04')).toBe('Mar 4, 2026');
  });

  it('escapes hostile names and copes with an empty year', () => {
    const evil = computeWrapped({ ...profile, name: '</text><script>alert(1)</script>"&' })!;
    const svg = renderWrappedCard(evil, 'dark');
    expect(svg).not.toContain('<script>');
    expect(wellFormed(svg)).toEqual([]);
    const empty = computeWrapped(withDays(calendar('2026-03-01', Array(40).fill(0))))!;
    const quiet = renderWrappedCard(empty, 'light');
    expect(wellFormed(quiet)).toEqual([]);
    expect(quiet).not.toMatch(/NaN|undefined|Infinity/);
  });

  it('does not say the year is partial when it covers whole months', () => {
    const whole = computeWrapped(withDays(calendar('2026-01-01', Array(59).fill(1))))!;
    expect(renderWrappedCard(whole, 'dark')).not.toContain('partial');
  });
});

describe('the Wrapped time-lapse city', () => {
  it('is a well formed time-lapse of the same year, in both modes', () => {
    for (const variant of ['dark', 'light'] as const) {
      const svg = renderWrappedCity(profile, variant);
      expect(wellFormed(svg)).toEqual([]);
      expect(svg).toContain('tl-fade');
      expect(svg).toContain('Time-lapse of the contribution city');
    }
  });

  it('shows the finished city when motion is off', () => {
    expect(renderWrappedCity(profile, 'dark', false)).not.toContain('tl-fade');
  });
});
