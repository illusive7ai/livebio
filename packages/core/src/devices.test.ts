import { describe, expect, it } from 'vitest';
import { buildContributions } from './contributions';
import { STICKER_SLOTS, boardStatus, cells, daysSinceActive, petMood } from './templates/devices';
import { bare, hostile, profile, svgOf, wellFormed, year } from './testkit';
import type { Profile } from './types';

const withCounts = (counts: number[]): Profile => ({ ...profile, contributions: buildContributions(year(counts)) });
const fresh = (a: string | undefined, b: string | undefined) => Boolean(a && b && Date.parse(b) - Date.parse(a) <= 90 * 86_400_000 && Date.parse(a) <= Date.parse(b));

describe('departures board helpers', () => {
  it('fills a fixed number of cells, cut or padded, and right-aligns numbers', () => {
    expect(cells('abc', 5)).toEqual(['A', 'B', 'C', ' ', ' ']);
    expect(cells('abcdefgh', 5)).toEqual(['A', 'B', 'C', 'D', 'E']);
    expect(cells('42', 5, 'right')).toEqual([' ', ' ', ' ', '4', '2']);
    expect(cells('', 3)).toEqual([' ', ' ', ' ']);
    for (const text of ['x', 'a-long-repository-name', '']) expect(cells(text, 16)).toHaveLength(16);
  });
  it('says ACTIVE or IDLE from a real push date, and nothing without one', () => {
    expect(boardStatus('2026-06-01T00:00:00Z', '2026-06-10T00:00:00Z', fresh)).toBe('ACTIVE');
    expect(boardStatus('2024-01-01T00:00:00Z', '2026-06-10T00:00:00Z', fresh)).toBe('IDLE');
    expect(boardStatus(undefined, '2026-06-10T00:00:00Z', fresh)).toBe('');
    expect(boardStatus(null, '2026-06-10T00:00:00Z', fresh)).toBe('');
    expect(boardStatus('nonsense', '2026-06-10T00:00:00Z', fresh)).toBe('');
  });
});

describe('departures board', () => {
  it('has a row for each repository with its real language and stars', () => {
    const svg = svgOf('departures');
    expect(svg.match(/class="flap"/g)!.length).toBeGreaterThan(100);
    for (const word of ['ALPHA', 'BETA']) for (const ch of word) expect(svg).toContain(`>${ch}</text>`);
    // 500 stars is three tiles, 5, 0 and 0, on the first row.
    expect(svg).toMatch(/>5<\/text>[^]*?>0<\/text>[^]*?>0<\/text>/);
  });
  it('marks repositories active and idle from their real push dates', () => {
    const svg = svgOf('departures');
    expect(svg).toContain('MADE WITH  GO 60%');
    expect(svg.match(/fill="#6ee79a"/g)?.length).toBeGreaterThan(0);
  });
  it('shows the time the data was read, and no clock without it', () => {
    expect(svgOf('departures')).toContain('08:00 UTC');
    expect(svgOf('departures', { ...profile, fetchedAt: undefined })).not.toContain('UTC');
  });
  it('has at most six rows, however many repositories there are', () => {
    const many = { ...profile, topRepos: Array.from({ length: 9 }, (_v, i) => ({ ...profile.topRepos[0]!, name: `repo${i}` })) };
    // Each row is 16 + 10 + 6 + 6 tiles.
    expect(svgOf('departures', many).match(/class="flap"/g)).toHaveLength(6 * 38);
  });
  it('says so when there are no repositories or the section is off', () => {
    expect(svgOf('departures', { ...profile, topRepos: [] })).toContain('NO DEPARTURES TODAY');
    expect(svgOf('departures', profile, ['stats'])).toContain('SWITCHED OFF');
  });
});

describe('handheld console', () => {
  it('shows the real numbers and the best repositories as moves', () => {
    const svg = svgOf('handheld');
    for (const part of ['REPOS 23', 'STARS 777', 'FANS 1,234', 'YRS 7', 'TYPE: GO/RUST/ZIG', 'ALPHA', 'GAMMA']) expect(svg).toContain(part);
    // Three moves only: the fourth repository never appears.
    expect(svg).not.toContain('DELTA');
    expect(svg).not.toContain('EPSILON');
  });
  it('shows years only when the dates can be read, and stats only when on', () => {
    expect(svgOf('handheld', { ...profile, createdAt: 'nonsense' })).not.toContain('YRS');
    expect(svgOf('handheld', profile, ['projects'])).not.toContain('REPOS 23');
  });
});

describe('neon sign', () => {
  it('lights the real name, handle and numbers', () => {
    const svg = svgOf('neon');
    for (const part of ['OCTO CAT', '@octo', '777 STARS', '1,234 FOLLOWERS', '>GO<']) expect(svg).toContain(part);
    expect(svg).toContain('filter="url(#glow)"');
  });
  it('glows in the dark theme and is unlit in the light theme', () => {
    expect(svgOf('neon', profile, undefined, 'dark')).toContain('stdDeviation="7"');
    const unlit = svgOf('neon', profile, undefined, 'light');
    expect(unlit).toContain('stdDeviation="0.01"');
    expect(unlit).not.toContain('stroke="#ffffff" stroke-opacity="0.8"');
    expect(svgOf('neon', profile, undefined, 'dark')).toContain('stroke="#ffffff" stroke-opacity="0.8"');
  });
  it('sizes a long name to fit', () => {
    const size = (s: string) => Number(/font-size="(\d+)" fill="none" stroke="#[0-9a-f]+" stroke-width="[\d.]+" stroke-linejoin/.exec(s)?.[1]);
    expect(size(svgOf('neon', { ...profile, name: 'A'.repeat(24) }))).toBeLessThan(size(svgOf('neon')));
  });
});

describe('laptop stickers', () => {
  it('has a sticker for the photo, each language, each repository, the followers and the handle', () => {
    const svg = svgOf('laptop');
    expect(svg.match(/class="stk"/g)).toHaveLength(1 + 3 + 5 + 1 + 1);
    for (const part of ['>Go<', '>60%<', '>alpha<', '>1,234<', '@octo']) expect(svg).toContain(part);
  });
  it('never has more stickers than places for them', () => {
    expect(STICKER_SLOTS.length).toBeGreaterThanOrEqual(11);
    const many = { ...profile, languages: Array.from({ length: 9 }, (_v, i) => ({ name: `L${i}`, percent: 5 })), topRepos: Array.from({ length: 9 }, (_v, i) => ({ ...profile.topRepos[0]!, name: `r${i}` })) };
    expect(svgOf('laptop', many).match(/class="stk"/g)!.length).toBeLessThanOrEqual(STICKER_SLOTS.length);
  });
  it('drops the followers heart with stats off, and is the same every time', () => {
    expect(svgOf('laptop', profile, ['languages', 'projects'])).not.toContain('followers');
    expect(svgOf('laptop')).toBe(svgOf('laptop'));
  });
});

describe('pixel pet', () => {
  it('knows how long ago the last activity was', () => {
    expect(daysSinceActive(withCounts([1]).contributions)).toBe(0);
    expect(daysSinceActive(withCounts([1, 0, 0, 0]).contributions)).toBe(3);
    // Measured from the most recent active day, not the first one.
    expect(daysSinceActive(withCounts([1, 0, 1, 0, 0]).contributions)).toBe(2);
    expect(daysSinceActive(withCounts([]).contributions)).toBeNull();
    expect(daysSinceActive(undefined)).toBeNull();
  });
  it.each([
    [[1], 'happy'],
    [[1, 0], 'happy'],
    [[1, 0, 0, 0], 'content'],
    [[1, ...Array(7).fill(0)], 'content'],
    [[1, ...Array(8).fill(0)], 'sleepy'],
    [[1, ...Array(30).fill(0)], 'sleepy'],
    [[1, ...Array(31).fill(0)], 'hungry'],
  ])('is in the mood for activity %j: %s', (counts, mood) => {
    expect(petMood(withCounts(counts as number[]).contributions)).toBe(mood);
  });
  it('is hungry after a whole year with no activity, and does not pretend to know without data', () => {
    expect(petMood(withCounts(Array(365).fill(0)).contributions)).toBe('hungry');
    expect(petMood(undefined)).toBe('unknown');
    expect(svgOf('pet', { ...profile, contributions: undefined })).toContain('Waiting for activity data.');
  });
  it('quotes the real streak and the real ratios', () => {
    const svg = svgOf('pet', withCounts([1, 1, 1]));
    expect(svg).toContain('I am on a 3-day streak!');
    expect(svg).toContain('3 of 3 days (best)');
    expect(svg).toContain('3 of 365 days');
  });
  it('fills the streak bar by the current streak out of the best one', () => {
    // The best streak is 3 days and the current one is 1 day: a third of the bar, 356 / 3 wide.
    const svg = svgOf('pet', withCounts([1, 1, 1, 0, 1]));
    expect(svg).toContain('1 of 3 days (best)');
    expect(svg).toContain('width="118.67"');
  });
  it('draws no bars when activity is switched off, and says so', () => {
    expect(svgOf('pet', profile, ['stats'])).toContain('switched off');
  });
});

describe.each(['departures', 'handheld', 'neon', 'laptop', 'pet'])('%s', (id) => {
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
});
