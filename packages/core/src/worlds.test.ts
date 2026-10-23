import { describe, expect, it } from 'vitest';
import { buildContributions } from './contributions';
import { blobPath, branchAngles, chipWidth, fishLength, quadPoint, repositories, ringValues, starScale } from './templates/worlds';
import { bare, hostile, profile, repo, svgOf, wellFormed, year } from './testkit';
import type { Profile } from './types';

const c = profile.contributions!;
const withCounts = (counts: number[]): Profile => ({ ...profile, contributions: buildContributions(year(counts)) });
const noActivity: Profile = { ...profile, contributions: undefined };

describe('starScale', () => {
  it('is zero for nothing and one at ten thousand stars and above, rising in between', () => {
    expect(starScale(0)).toBe(0);
    expect(starScale(-5)).toBe(0);
    expect(starScale(NaN)).toBe(0);
    expect(starScale(9_999)).toBeCloseTo(1, 3);
    expect(starScale(10_000_000)).toBe(1);
    expect(starScale(10)).toBeLessThan(starScale(100));
    expect(starScale(100)).toBeLessThan(starScale(1000));
  });
  it('hits fixed points: half way at 99 stars, three quarters at 999', () => {
    expect(starScale(99)).toBeCloseTo(0.5, 10);
    expect(starScale(999)).toBeCloseTo(0.75, 10);
  });
  it('is a log scale: each tenfold step adds the same amount', () => {
    expect(starScale(99) - starScale(9)).toBeCloseTo(starScale(999) - starScale(99), 10);
  });
});

describe('repositories', () => {
  it('says one repository and many repositories', () => {
    expect(repositories(1)).toBe('1 repository');
    expect(repositories(0)).toBe('0 repositories');
    expect(repositories(1234)).toBe('1,234 repositories');
  });
});

describe('ringValues', () => {
  it('has three rings with the real shares, each between 0 and 1', () => {
    const rings = ringValues(c);
    expect(rings.map((r) => r.label)).toEqual(['STREAK', 'ACTIVE DAYS', 'LAST 30 DAYS']);
    expect(rings[0]!.fraction).toBeCloseTo(c.currentStreak / c.longestStreak, 10);
    expect(rings[1]!.fraction).toBeCloseTo(c.activeDays / c.days.length, 10);
    const last30 = c.days.slice(-30).filter((d) => d.count > 0).length;
    expect(rings[2]!.fraction).toBeCloseTo(last30 / 30, 10);
    for (const ring of rings) {
      expect(ring.fraction).toBeGreaterThanOrEqual(0);
      expect(ring.fraction).toBeLessThanOrEqual(1);
    }
  });
  it('divides the current streak by the best one, the right way round', () => {
    // The best streak is 3 days and the current one is 1 day.
    const third = ringValues(withCounts([1, 1, 1, 0, 1]).contributions)[0]!;
    expect(third.fraction).toBeCloseTo(1 / 3, 10);
  });
  it('never goes past a full ring, even for impossible numbers', () => {
    expect(ringValues({ ...c, currentStreak: 10, longestStreak: 5 })[0]!.fraction).toBe(1);
    expect(ringValues({ ...c, activeDays: 999 })[1]!.fraction).toBe(1);
  });
  it('quotes the same numbers in words', () => {
    expect(ringValues(c)[0]!.caption).toBe(`${c.currentStreak} of ${c.longestStreak} days, the best streak`);
    expect(ringValues(c)[1]!.caption).toBe(`${c.activeDays} of ${c.days.length} days`);
  });
  it('has none without a calendar, and a zero streak is an empty ring, not a broken one', () => {
    expect(ringValues(undefined)).toEqual([]);
    expect(ringValues({ ...c, days: [] })).toEqual([]);
    expect(ringValues({ ...c, currentStreak: 0, longestStreak: 0 })[0]!.fraction).toBe(0);
    expect(ringValues(withCounts(Array(365).fill(0)).contributions).every((r) => r.fraction === 0)).toBe(true);
  });
});

describe('activity rings', () => {
  it('draws a filled ring for each ring with something in it, with the real percentage', () => {
    const svg = svgOf('rings');
    const rings = ringValues(c);
    expect(svg.match(/class="ring"/g)).toHaveLength(rings.filter((r) => r.fraction > 0).length);
    for (const ring of rings) expect(svg).toContain(`${Math.round(ring.fraction * 100)}%`);
  });
  it('draws no fill at all for a ring whose share is zero', () => {
    const none = { ...profile, contributions: { ...c, currentStreak: 0 } };
    expect(svgOf('rings', none).match(/class="ring"/g)).toHaveLength(2);
  });
  it('fills a ring by its share of the full circle', () => {
    expect(svgOf('rings')).toContain(`stroke-dasharray="${Math.round(ringValues(c)[1]!.fraction * 100) / 100} 1"`);
  });
  it('draws only the tracks, and says why, without a calendar or with the section off', () => {
    expect(svgOf('rings', noActivity)).toContain('fill after the first automatic update');
    expect(svgOf('rings', noActivity).match(/class="ring"/g)).toBeNull();
    expect(svgOf('rings', profile, ['stats'])).toContain('switched off');
  });
});

describe('branchAngles and quadPoint', () => {
  it('spreads branches evenly either side of straight up', () => {
    expect(branchAngles(0)).toEqual([]);
    expect(branchAngles(1)).toEqual([0]);
    expect(branchAngles(3, 60)).toEqual([-60, 0, 60]);
    expect(branchAngles(5, 60)).toEqual([-60, -30, 0, 30, 60]);
  });
  it('finds points along a curve, from its start to its end', () => {
    expect(quadPoint([0, 0], [5, 10], [10, 0], 0)).toEqual([0, 0]);
    expect(quadPoint([0, 0], [5, 10], [10, 0], 1)).toEqual([10, 0]);
    expect(quadPoint([0, 0], [5, 10], [10, 0], 0.5)).toEqual([5, 5]);
    // An off-centre control point pulls the middle of the curve towards it: 0.25 * 0 + 0.5 * 2 + 0.25 * 10.
    expect(quadPoint([0, 0], [2, 8], [10, 0], 0.5)).toEqual([3.5, 4]);
  });
});

describe('language tree', () => {
  it('has a branch for each language and a leaf for each repository written in it', () => {
    const svg = svgOf('tree');
    for (const part of ['Go 60%', 'Rust 30%', 'Zig 10%', '>alpha<', '>beta<', '>gamma<', '>epsilon<']) expect(svg).toContain(part);
    expect(svg.match(/class="leaf"/g)).toHaveLength(4);
  });
  it('leaves out a repository with no language and says how many are not shown', () => {
    const svg = svgOf('tree');
    expect(svg).not.toContain('>delta<');
    expect(svg).toContain('1 repository in other languages not shown');
  });
  it('hangs at most three leaves on a branch', () => {
    const many = { ...profile, topRepos: Array.from({ length: 8 }, (_v, i) => repo(`go${i}`, 10 + i, 'Go')) };
    expect(svgOf('tree', many).match(/class="leaf"/g)).toHaveLength(3);
    expect(svgOf('tree', many)).toContain('5 repositories in other languages not shown');
  });
  it('draws no branches, and says why, when the languages section is off', () => {
    expect(svgOf('tree', profile, ['projects'])).toContain('switched off');
  });
});

describe('fishLength', () => {
  it('runs from 54 for an unstarred repository to 150 for a very popular one, growing with stars', () => {
    expect(fishLength(0)).toBe(54);
    expect(fishLength(1_000_000)).toBe(150);
    expect(fishLength(10)).toBeLessThan(fishLength(1000));
  });
});

describe('aquarium', () => {
  it('has a fish for each repository, up to six, with its real stars', () => {
    const svg = svgOf('aquarium');
    for (const name of ['alpha', 'beta', 'gamma', 'delta', 'epsilon']) expect(svg).toContain(`${name}  ★`);
    expect(svg).toContain('alpha  ★ 500');
  });
  it('draws seaweed for each language with its share', () => {
    const svg = svgOf('aquarium');
    for (const part of ['Go 60%', 'Rust 30%', 'Zig 10%']) expect(svg).toContain(part);
  });
  it('never has more than six fish, and puts them in two rows so none sits on another', () => {
    const many = { ...profile, topRepos: Array.from({ length: 9 }, (_v, i) => repo(`r${i}`, i)) };
    expect(svgOf('aquarium', many).match(/ ★ /g)!.length).toBe(6);
  });
  it('is the same every time', () => {
    expect(svgOf('aquarium')).toBe(svgOf('aquarium'));
  });
});

describe('blobPath', () => {
  it('is the same for the same island, and differs between islands', () => {
    expect(blobPath('a', 100, 100, 50)).toBe(blobPath('a', 100, 100, 50));
    expect(blobPath('a', 100, 100, 50)).not.toBe(blobPath('b', 100, 100, 50));
  });
  it('is a closed outline that stays near its centre and grows with its radius', () => {
    const path = blobPath('x', 200, 300, 40);
    expect(path.startsWith('M')).toBe(true);
    expect(path.endsWith('Z')).toBe(true);
    const numbers = [...path.matchAll(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g)].map((m) => [Number(m[1]), Number(m[2])]);
    for (const [x, y] of numbers) {
      expect(Math.abs(x! - 200)).toBeLessThanOrEqual(40 * 1.25);
      expect(Math.abs(y! - 300)).toBeLessThanOrEqual(40 * 1.25);
    }
    const spread = (r: number) => Math.max(...[...blobPath('x', 0, 0, r).matchAll(/(-?\d+(?:\.\d+)?) /g)].map((m) => Math.abs(Number(m[1]))));
    expect(spread(80)).toBeGreaterThan(spread(40));
  });
});

describe('island map', () => {
  it('has an island for each repository, with an X on the most starred only', () => {
    const svg = svgOf('island');
    expect(svg.match(/class="isle"/g)).toHaveLength(5);
    expect(svg.match(/stroke="#b3261e"/g)).toHaveLength(1);
    expect(svg).toContain('>alpha<');
  });
  it('orders the route by stars, most starred first', () => {
    const svg = svgOf('island');
    const names = [...svg.matchAll(/class="serif" text-anchor="middle" font-style="italic" font-weight="700">([^<]+)</g)].map((m) => m[1]).filter((n) => n !== 'Octo Cat');
    expect(names).toEqual(['alpha', 'beta', 'gamma', 'delta', 'epsilon']);
  });
  it('sorts the route by stars even when the repositories arrive in another order', () => {
    const shuffled = { ...profile, topRepos: [...profile.topRepos].reverse() };
    const names = [...svgOf('island', shuffled).matchAll(/class="serif" text-anchor="middle" font-style="italic" font-weight="700">([^<]+)</g)].map((m) => m[1]).filter((n) => n !== 'Octo Cat');
    expect(names).toEqual(['alpha', 'beta', 'gamma', 'delta', 'epsilon']);
  });
  it('says what the islands mean', () => {
    expect(svgOf('island')).toContain('island size = stars (log scale)');
  });
  it('charts nothing, and says why, when the section is off', () => {
    expect(svgOf('island', profile, ['stats'])).toContain('switched off');
  });
});

describe('chipWidth', () => {
  it('runs from 100 to 150 pixels with the stars', () => {
    expect(chipWidth(0)).toBe(100);
    expect(chipWidth(1_000_000)).toBe(150);
    expect(chipWidth(5)).toBeLessThan(chipWidth(500));
  });
});

describe('circuit board', () => {
  it('has a chip for each repository, up to six, and the person in the middle', () => {
    const svg = svgOf('circuit');
    expect(svg.match(/class="chip"/g)).toHaveLength(5);
    expect(svg).toContain('777 stars · 1,234 followers');
  });
  it('lights the LED only for a repository pushed to in the last 90 days', () => {
    const svg = svgOf('circuit');
    // alpha, gamma and epsilon were pushed lately; beta was not, and delta has no push date.
    expect(svg.match(/fill="#4dff88"/g)).toHaveLength(3);
    expect(svg.match(/fill="#3a4a40"/g)).toHaveLength(2);
  });
  it('says what the LED means, and what the chip width means', () => {
    expect(svgOf('circuit')).toContain('a lit LED means pushed to in the last 90 days');
    expect(svgOf('circuit')).toContain('chip width = stars');
  });
  it('fits no chips, and says why, when the section is off', () => {
    expect(svgOf('circuit', profile, ['stats'])).toContain('switched off');
  });
});

describe.each(['rings', 'tree', 'aquarium', 'island', 'circuit'])('%s', (id) => {
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
