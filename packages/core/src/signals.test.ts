import { describe, expect, it } from 'vitest';
import { buildContributions, weeklyTotals } from './contributions';
import { PULSE_DAYS, monthlySeries, padGrid, pulsePath, skyFor, stemHeight, typicalDay, weekStarts } from './templates/signals';
import { bare, hostile, profile, svgOf, wellFormed, year } from './testkit';
import type { ContributionDay, Profile } from './types';

const days: ContributionDay[] = profile.contributions!.days;
const withCounts = (counts: number[]): Profile => ({ ...profile, contributions: buildContributions(year(counts)) });
const noActivity: Profile = { ...profile, contributions: undefined };
const c = profile.contributions!;
const last7 = days.slice(-7).reduce((sum, d) => sum + d.count, 0);

describe('weekStarts and stemHeight', () => {
  it('lists the Sunday each week begins on, in step with the weekly totals', () => {
    const starts = weekStarts(days);
    expect(starts).toHaveLength(weeklyTotals(days).length);
    expect(starts[0]).toBe(days[0]!.date);
    for (const date of starts.slice(1)) expect(new Date(`${date}T00:00:00Z`).getUTCDay()).toBe(0);
  });
  it('gives no stem to a quiet week, and keeps the others between 14 and the maximum', () => {
    expect(stemHeight(0, 10, 200)).toBe(0);
    expect(stemHeight(-3, 10, 200)).toBe(0);
    expect(stemHeight(5, 0, 200)).toBe(0);
    expect(stemHeight(10, 10, 200)).toBe(200);
    expect(stemHeight(99, 10, 200)).toBe(200);
    expect(stemHeight(1, 10_000, 200)).toBeGreaterThanOrEqual(14);
    expect(stemHeight(2, 10, 200)).toBeLessThan(stemHeight(8, 10, 200));
  });
});

describe('garden', () => {
  it('has a flower for each active week and a sprout for each quiet one', () => {
    const weeks = weeklyTotals(days);
    const flowers = weeks.filter((w) => w > 0).length;
    const svg = svgOf('garden');
    // Each flower has a yellow centre. The sun is pale in the dark theme, so it is not counted here.
    expect(svg.match(/fill="#ffd23f"/g)).toHaveLength(flowers);
    expect(svg.match(/v-7"/g)?.length ?? 0).toBe(weeks.length - flowers);
  });
  it('says how many days were active and what a flower means', () => {
    const svg = svgOf('garden');
    expect(svg).toContain(`${c.activeDays} active days`);
    expect(svg).toContain('one flower for each week');
  });
  it('waits for data rather than planting anything', () => {
    expect(svgOf('garden', noActivity)).toContain('appears after the first automatic update');
    expect(svgOf('garden', profile, ['stats'])).toContain('switched off');
    expect(svgOf('garden', noActivity).match(/fill="#ffd23f"/g)).toBeNull();
  });
});

describe('monthlySeries', () => {
  it('groups days by month, oldest first, keeping only the last twelve', () => {
    const rows = monthlySeries(days, 12);
    expect(rows).toHaveLength(12);
    expect(rows[rows.length - 1]!.key).toBe('2026-06');
    expect(rows.map((r) => r.key)).toEqual([...rows.map((r) => r.key)].sort());
  });
  it('adds up each month from its own days only', () => {
    const rows = monthlySeries(days, 100);
    expect(rows.reduce((sum, r) => sum + r.total, 0)).toBe(days.reduce((sum, d) => sum + d.count, 0));
    for (const row of rows) expect(row.total).toBe(row.days.reduce((s, d) => s + d.count, 0));
  });
  it('holds only the days the data has in an end month, and labels it', () => {
    const june = monthlySeries(days, 1)[0]!;
    expect(june.days).toHaveLength(10);
    expect(june.label).toBe('JUN 2026');
    expect(monthlySeries([], 12)).toEqual([]);
  });
});

describe('ridgeline', () => {
  it('draws one line for each of the last twelve months, with its real total', () => {
    const svg = svgOf('ridgeline');
    expect(svg.match(/class="ridge"/g)).toHaveLength(12);
    const june = monthlySeries(days, 1)[0]!;
    expect(svg).toContain(`>${june.total}<`);
    expect(svg).toContain('JUN 2026');
  });
  it('says so when there is no calendar, and when the year was entirely quiet', () => {
    expect(svgOf('ridgeline', noActivity)).toContain('appears after the first automatic update');
    expect(svgOf('ridgeline', withCounts(Array(365).fill(0)))).toContain('No contributions in this period');
  });
});

describe('pulsePath', () => {
  it('is empty for nothing, flat for quiet days and spiked for active ones', () => {
    expect(pulsePath([], 0, 100, 50, 40)).toBe('');
    // A quiet day is one straight step; an active day is a four-point spike.
    expect(pulsePath([0, 0, 0], 0, 90, 100, 60).match(/L/g)).toHaveLength(3);
    expect(pulsePath([0, 5, 0], 0, 90, 100, 60).match(/L/g)).toHaveLength(1 + 4 + 1);
    // A quiet day never leaves the baseline.
    expect([...pulsePath([0, 0, 7, 0], 0, 120, 100, 60).matchAll(/L[\d.]+ (-?[\d.]+)/g)].filter((m) => m[1] === '100')).not.toHaveLength(0);
    expect(pulsePath([0, 0], 0, 20, 100, 60)).toBe('M0 100L10 100L20 100');
  });
  it('makes a busier day a taller spike, never above the maximum', () => {
    const top = (counts: number[]) => Math.min(...[...pulsePath(counts, 0, 100, 100, 60).matchAll(/ (-?[\d.]+)/g)].map((m) => Number(m[1])));
    expect(top([10, 1])).toBeLessThan(top([1, 10]) + 1e6);
    expect(top([5, 0, 0])).toBeGreaterThanOrEqual(100 - 60);
    // The same day is a shorter spike beside a much busier one: 14 + sqrt(5 / 50) * 46 high.
    expect(pulsePath([5, 50], 0, 100, 100, 60)).toContain(' 71.45');
    expect(pulsePath([5], 0, 100, 100, 60)).toContain(' 40');
  });
  it('stays inside the width it is given', () => {
    const xs = [...pulsePath([1, 0, 3, 0, 2], 48, 560, 220, 120).matchAll(/[ML]([\d.]+) /g)].map((m) => Number(m[1]));
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(48);
    expect(Math.max(...xs)).toBeLessThanOrEqual(608.001);
  });
});

describe('pulse monitor', () => {
  it('shows the real totals, streaks and the last seven days', () => {
    const svg = svgOf('pulse');
    for (const part of [`>${c.total.toLocaleString('en-US')}<`, `>${last7}<`, `${c.activeDays} / ${days.length}`, `${c.currentStreak} d`, `${c.longestStreak} d`]) expect(svg).toContain(part);
  });
  it('traces the most recent days only, and says how many', () => {
    expect(PULSE_DAYS).toBe(90);
    expect(svgOf('pulse')).toContain('LAST 90 DAYS');
    const month = { ...profile, contributions: buildContributions(days.slice(-30)) };
    expect(svgOf('pulse', month)).toContain('LAST 30 DAYS');
  });
  it('waits for data, and is off when the section is', () => {
    expect(svgOf('pulse', noActivity)).toContain('appears after the first automatic update');
    expect(svgOf('pulse', profile, ['stats'])).toContain('switched off');
  });
});

describe('padGrid', () => {
  it('is seven rows by the number of weeks asked for, Monday first', () => {
    const grid = padGrid(days, 26);
    expect(grid).toHaveLength(7);
    for (const row of grid) expect(row).toHaveLength(26);
    // 2026-06-10 was a Wednesday, so Monday the 8th and Tuesday the 9th sit in the last column before it.
    expect(grid[0]![25]!.date).toBe('2026-06-08');
    expect(grid[2]![25]!.date).toBe('2026-06-10');
    expect(grid[3]![25]).toBeNull();
  });
  it('puts every day in the right row for its weekday', () => {
    const grid = padGrid(days, 26);
    grid.forEach((row, r) => {
      for (const cell of row) if (cell) expect((new Date(`${cell.date}T00:00:00Z`).getUTCDay() + 6) % 7).toBe(r);
    });
  });
  it('leaves a day the data does not have empty rather than inventing one', () => {
    const short = padGrid(days.slice(-10), 26);
    expect(short[0]![0]).toBeNull();
    expect(padGrid([], 26).every((row) => row.length === 0)).toBe(true);
  });
});

describe('drum machine', () => {
  it('has a pad for every weekday of every one of the last 26 weeks', () => {
    expect(svgOf('drums').match(/width="22" height="24"/g)).toHaveLength(7 * 26);
  });
  it('shows the real ratios on its knobs', () => {
    const svg = svgOf('drums');
    for (const part of [`${c.activeDays}/${days.length}`, `${c.currentStreak}/${c.longestStreak}`, `>${last7}<`, `${c.total.toLocaleString('en-US')} CONTRIBUTIONS`]) expect(svg).toContain(part);
  });
  it('turns the active-days knob by the real ratio of active days', () => {
    const angle = (-135 + (c.activeDays / days.length) * 270) * (Math.PI / 180);
    const round = (n: number) => Math.round(n * 100) / 100;
    expect(svgOf('drums')).toContain(`L${round(640 + Math.sin(angle) * 17)} ${round(70 - Math.cos(angle) * 17)}`);
  });
  it('waits for data, and is off when the section is', () => {
    expect(svgOf('drums', noActivity)).toContain('appears after the first automatic update');
    expect(svgOf('drums', profile, ['stats'])).toContain('switched off');
  });
});

describe('typicalDay and skyFor', () => {
  it('is the middle active day, and zero without any', () => {
    expect(typicalDay([{ count: 1 }, { count: 5 }, { count: 3 }])).toBe(3);
    expect(typicalDay([{ count: 2 }, { count: 4 }])).toBe(3);
    expect(typicalDay([{ count: 0 }, { count: 9 }])).toBe(9);
    expect(typicalDay([{ count: 0 }])).toBe(0);
    expect(typicalDay([])).toBe(0);
  });
  it('is quiet with nothing, busy above a typical day and some otherwise', () => {
    expect(skyFor(0, 3)).toBe('quiet');
    expect(skyFor(-1, 3)).toBe('quiet');
    expect(skyFor(1, 3)).toBe('some');
    expect(skyFor(3, 3)).toBe('some');
    expect(skyFor(4, 3)).toBe('busy');
    expect(skyFor(1, 0)).toBe('busy');
  });
});

describe('weather forecast', () => {
  it('shows the last seven days with their real counts and the latest day large', () => {
    const svg = svgOf('weather');
    for (const count of ['>0<', '>1<', '>3<', '>5<', '>2<']) expect(svg).toContain(count);
    expect(svg.match(/class="day"/g)).toHaveLength(7);
    expect(svg).toContain('LATEST DAY');
    expect(svg).toContain('2026-06-10');
  });
  it('says what busy means, with the real typical day', () => {
    expect(svgOf('weather')).toContain('more than a typical active day (2)');
  });
  it('waits for data, and is off when the section is', () => {
    expect(svgOf('weather', noActivity)).toContain('appears after the first automatic update');
    expect(svgOf('weather', profile, ['stats'])).toContain('switched off');
  });
});

describe.each(['garden', 'ridgeline', 'pulse', 'drums', 'weather'])('%s', (id) => {
  it('escapes everything it is given', () => {
    const svg = svgOf(id, hostile);
    expect(svg).not.toContain('<script');
    expect(wellFormed(svg)).toEqual([]);
  });
  it('draws for an account with almost nothing in it', () => {
    const svg = svgOf(id, bare);
    expect(wellFormed(svg)).toEqual([]);
    expect(svg).not.toMatch(/NaN|undefined|Infinity/);
  });
  it('draws for a year with a single active day and for one with none', () => {
    for (const counts of [[3], Array(365).fill(0)]) {
      const svg = svgOf(id, withCounts(counts as number[]));
      expect(wellFormed(svg)).toEqual([]);
      expect(svg).not.toMatch(/NaN|undefined|Infinity/);
    }
  });
});
