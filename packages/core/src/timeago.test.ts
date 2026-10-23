import { describe, expect, it } from 'vitest';
import { busiestMonth, recentWeeks, weeklyTotals } from './contributions';
import { timeAgo } from './util';

const NOW = '2026-06-15T12:00:00Z';
const ago = (days: number) => new Date(Date.parse(NOW) - days * 86_400_000).toISOString();

describe('timeAgo', () => {
  it.each([
    [0, 'today'],
    [0.5, 'today'],
    [1, 'yesterday'],
    [2, '2 days ago'],
    [6, '6 days ago'],
    [7, '1 week ago'],
    [13, '1 week ago'],
    [14, '2 weeks ago'],
    [29, '4 weeks ago'],
    [30, '1 month ago'],
    [75, '2 months ago'],
    [364, '12 months ago'],
    [365, '1 year ago'],
    [800, '2 years ago'],
  ])('%s days is "%s"', (days, words) => {
    expect(timeAgo(ago(days), NOW)).toBe(words);
  });

  it('refuses dates it cannot read rather than guessing', () => {
    expect(timeAgo('not a date', NOW)).toBeNull();
    expect(timeAgo(ago(3), 'also not')).toBeNull();
  });

  it('says "today" for a time slightly in the future, such as clock drift', () => {
    expect(timeAgo('2026-06-15T13:00:00Z', NOW)).toBe('today');
  });
});

describe('weeklyTotals', () => {
  // 2026-06-07 is a Sunday.
  const days = [
    { date: '2026-06-05', count: 1 }, // Friday, part of the first partial week
    { date: '2026-06-06', count: 2 }, // Saturday
    { date: '2026-06-07', count: 4 }, // Sunday starts a new week
    { date: '2026-06-08', count: 0 },
    { date: '2026-06-09', count: 3 },
  ];

  it('adds up each week, starting a new one on Sunday', () => {
    expect(weeklyTotals(days)).toEqual([3, 7]);
  });

  it('copes with no days and with a single day', () => {
    expect(weeklyTotals([])).toEqual([]);
    expect(weeklyTotals([{ date: '2026-06-09', count: 5 }])).toEqual([5]);
  });

  it('keeps the grand total intact', () => {
    expect(weeklyTotals(days).reduce((a, b) => a + b, 0)).toBe(10);
  });
});

describe('recentWeeks', () => {
  const days = [
    { date: '2026-05-24', count: 1 }, // Sunday
    { date: '2026-05-31', count: 2 }, // Sunday
    { date: '2026-06-07', count: 4 }, // Sunday
    { date: '2026-06-09', count: 3 },
  ];

  it('returns the newest weeks, oldest first', () => {
    expect(recentWeeks(days, 2)).toEqual([2, 7]);
    expect(recentWeeks(days, 1)).toEqual([7]);
  });

  it('returns everything when fewer weeks exist than asked for', () => {
    expect(recentWeeks(days, 12)).toEqual([1, 2, 7]);
  });

  it('returns nothing for a count of zero or less, and for no data', () => {
    expect(recentWeeks(days, 0)).toEqual([]);
    expect(recentWeeks(days, -3)).toEqual([]);
    expect(recentWeeks([], 12)).toEqual([]);
  });
});

describe('busiestMonth', () => {
  it('finds the month with the most contributions', () => {
    const days = [
      { date: '2026-03-01', count: 5 },
      { date: '2026-03-02', count: 6 },
      { date: '2026-04-01', count: 9 },
      { date: '2026-05-01', count: 3 },
    ];
    expect(busiestMonth(days)).toEqual({ name: 'March', total: 11 });
  });

  it('returns null when nothing happened', () => {
    expect(busiestMonth([{ date: '2026-03-01', count: 0 }])).toBeNull();
    expect(busiestMonth([])).toBeNull();
  });

  it('keeps months of different years apart', () => {
    const days = [
      { date: '2025-12-31', count: 4 },
      { date: '2026-12-01', count: 4 },
    ];
    expect(busiestMonth(days)?.total).toBe(4);
  });
});
