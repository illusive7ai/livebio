import { describe, expect, it } from 'vitest';
import { buildContributions, weeklyTotals } from './contributions';
import { ORBIT_FIRST, ORBIT_STEP, activityGrid, bits, bounces, contourSegments, monthSlot, planets, plinkoBins, readBits, smoothField, stitchText } from './templates/plots';
import { bare, profile, svgOf, wellFormed, year } from './testkit';
import type { ContributionDay, Profile } from './types';

const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
const withPicture: Profile = { ...profile, avatar: { dataUri: PNG, grid: { width: 1, height: 1, luma: [128], alpha: [255] } } };
const day = (date: string, count: number): ContributionDay => ({ date, count, level: (count === 0 ? 0 : Math.min(4, Math.ceil(count / 3))) as 0 | 1 | 2 | 3 | 4 });
const withDays = (days: ContributionDay[], over: Partial<Profile> = {}): Profile => ({ ...withPicture, ...over, contributions: buildContributions(days) });

describe('activity grid', () => {
  it('puts each day in its week and weekday, weeks starting on Sunday', () => {
    // 2026-01-01 is a Thursday, which is weekday 4.
    const grid = activityGrid([day('2026-01-01', 5), day('2026-01-02', 6), day('2026-01-03', 7), day('2026-01-04', 8), day('2026-01-05', 9)]);
    expect(grid.cols).toBe(2);
    expect(grid.rows).toBe(7);
    expect(grid.cells[0]![4]).toBe(5);
    expect(grid.cells[0]![6]).toBe(7);
    expect(grid.cells[1]![0]).toBe(8);
    expect(grid.cells[1]![1]).toBe(9);
    expect(grid.cells[0]![0]).toBe(0);
  });
  it('has nothing for no days', () => {
    expect(activityGrid([])).toEqual({ cols: 0, rows: 7, cells: [] });
  });
});

describe('smooth field', () => {
  const grid = activityGrid([day('2026-01-04', 0), ...Array.from({ length: 20 }, (_v, i) => day(`2026-01-${String(5 + i).padStart(2, '0')}`, i === 10 ? 12 : 0))]);
  it('is scale times bigger each way', () => {
    const field = smoothField(grid, 3);
    expect(field).toHaveLength(grid.rows * 3);
    expect(field[0]).toHaveLength(grid.cols * 3);
    expect(smoothField({ cols: 0, rows: 7, cells: [] })).toEqual([]);
  });
  it('never goes above the busiest day or below the quietest, and peaks where the busiest day is', () => {
    const field = smoothField(grid, 3);
    const all = field.flat();
    expect(Math.max(...all)).toBeLessThanOrEqual(12 + 1e-9);
    expect(Math.min(...all)).toBeGreaterThanOrEqual(0);
    const peak = Math.max(...all);
    expect(peak).toBeGreaterThan(2);
    const at = (c: number, r: number) => field[r * 3 + 1]![c * 3 + 1]!;
    const col = Math.floor((0 + 11) / 7);
    const row = 11 % 7;
    expect(at(col, row)).toBeGreaterThan(at(col, (row + 3) % 7));
  });
  it('softens each cell with its neighbours by fixed weights, nearer ones counting for more', () => {
    // One column, one busy cell at the top. At scale 1 the only change is the soft blur.
    const one = smoothField({ cols: 1, rows: 7, cells: [[16, 0, 0, 0, 0, 0, 0]] }, 1);
    expect(one[0]![0]).toBeCloseTo(64 / 6, 6);
    expect(one[1]![0]).toBeCloseTo(4, 6);
    expect(one[1]![0]).toBeGreaterThan(one[2]![0]!);
  });
  it('is centred on the cell it came from, not shifted half a cell', () => {
    const days = Array.from({ length: 21 }, (_v, i) => day(new Date(Date.UTC(2026, 0, 4 + i)).toISOString().slice(0, 10), i === 10 ? 9 : 0));
    const field = smoothField(activityGrid(days), 3);
    let best = { v: -1, i: -1, j: -1 };
    field.forEach((row, j) => row.forEach((v, i) => v > best.v && (best = { v, i, j })));
    // Day 10 is the middle weekday of the middle week, so the middle of the middle block of points.
    expect([best.i, best.j]).toEqual([4, 10]);
  });
  it('is flat when every day is the same', () => {
    const flat = smoothField(activityGrid(Array.from({ length: 14 }, (_v, i) => day(`2026-01-${String(4 + i).padStart(2, '0')}`, 4))), 2);
    for (const v of flat.flat()) expect(v).toBeCloseTo(4, 9);
  });
});

describe('contour segments', () => {
  const cone = Array.from({ length: 31 }, (_v, y) => Array.from({ length: 31 }, (_w, x) => Math.max(0, 10 - Math.hypot(x - 15, y - 15))));
  it('trace a ring at the height asked for, around the peak', () => {
    const segs = contourSegments(cone, 5);
    expect(segs.length).toBeGreaterThan(30);
    for (const [x1, y1, x2, y2] of segs) {
      expect(Math.hypot(x1 - 15, y1 - 15)).toBeGreaterThan(4.6);
      expect(Math.hypot(x1 - 15, y1 - 15)).toBeLessThan(5.4);
      expect(Math.hypot(x2 - 15, y2 - 15)).toBeGreaterThan(4.6);
      expect(Math.hypot(x2 - 15, y2 - 15)).toBeLessThan(5.4);
    }
  });
  it('have no line above the highest point or at a height the whole surface exceeds', () => {
    expect(contourSegments(cone, 10.5)).toEqual([]);
    expect(contourSegments(cone, -1)).toEqual([]);
    expect(contourSegments([], 1)).toEqual([]);
    expect(contourSegments([[1, 2, 3]], 2)).toEqual([]);
  });
  it('grow smaller rings at greater heights', () => {
    const length = (level: number) => contourSegments(cone, level).reduce((s, [a, b, c, d]) => s + Math.hypot(c - a, d - b), 0);
    expect(length(2)).toBeGreaterThan(length(5));
    expect(length(5)).toBeGreaterThan(length(8));
    expect(length(5)).toBeCloseTo(2 * Math.PI * 5, 0);
  });
  it('draws two lines through a saddle', () => {
    expect(contourSegments([[1, 0], [0, 1]], 0.5)).toHaveLength(2);
    expect(contourSegments([[0, 1], [1, 0]], 0.5)).toHaveLength(2);
  });
  it('puts a crossing exactly half way between a high and a low point at the half way height', () => {
    const [seg] = contourSegments([[0, 0], [10, 10]].map((r) => [...r].reverse()).reverse(), 5);
    expect(seg).toBeDefined();
    const [a, b, c, d] = seg!;
    expect([a, b, c, d].every((v) => Math.abs(v - 0.5) < 1e-9 || Math.abs(v) < 1e-9 || Math.abs(v - 1) < 1e-9)).toBe(true);
  });
});

describe('topographic map', () => {
  const busy = withDays(year([...Array(60).fill(0), 3, 4, 9, 2, 0, 0, 5, 12, 6, 3, ...Array(40).fill(2)]));
  it('marks the real busiest day as the summit', () => {
    const svg = svgOf('topo', busy);
    const peak = busy.contributions!.days.reduce((b, d) => (d.count > b.count ? d : b));
    expect(svg).toContain(`12 · ${peak.date}`);
    expect(svg).toContain('528 contributions'.replace('528', String(busy.contributions!.total)));
  });
  it('draws seven contour heights, every second one bolder', () => {
    const svg = svgOf('topo', busy);
    expect([...svg.matchAll(/stroke-linecap="round"\/>/g)]).toHaveLength(7);
    expect([...svg.matchAll(/stroke-width="1\.6"/g)]).toHaveLength(3);
    expect([...svg.matchAll(/stroke-width="0\.8"/g)]).toHaveLength(4);
  });

  it('writes the summit label on the side that has room', () => {
    const late = withDays(year([...Array(80).fill(1), 20]));
    const lateLabel = svgOf('topo', late).match(/<text[^>]*>20 · [\d-]+<\/text>/)![0];
    expect(lateLabel).toContain('text-anchor="end"');
    const early = withDays(year([20, ...Array(80).fill(1)]).slice(-81));
    const earlyLabel = svgOf('topo', early).match(/<text[^>]*>20 · [\d-]+<\/text>/)![0];
    expect(earlyLabel).toContain('text-anchor="start"');
  });

  it('says so when there is nothing to draw contours around', () => {
    const svg = svgOf('topo', withDays(year([]).slice(-60)));
    expect(svg).toContain('A flat map');
    expect(svg).not.toContain('<path d="M0');
  });
  it('waits, saying why, with no calendar or the section off', () => {
    expect(svgOf('topo', { ...withPicture, contributions: undefined })).toContain('after the first automatic update');
    expect(svgOf('topo', busy, ['stats'])).toContain('switched off');
    expect(svgOf('topo', busy, ['activity'])).not.toContain('contributions on');
  });
  it('names a month where it starts, and does not crowd the first label', () => {
    const days: ContributionDay[] = [day('2026-03-25', 1), ...Array.from({ length: 40 }, (_v, i) => day(new Date(Date.UTC(2026, 2, 26 + i)).toISOString().slice(0, 10), i % 4))];
    const svg = svgOf('topo', withDays(days));
    expect(svg).not.toContain('>Mar<');
    expect(svg).toContain('>Apr<');
    expect(svg).toContain('>May<');
  });
});

describe('birth chart months', () => {
  const now = '2026-06-10T08:00:00Z';
  it('puts a push in the right one of the last twelve months, oldest first', () => {
    expect(monthSlot('2026-06-01T00:00:00Z', now)).toEqual({ slot: 11, fraction: 0 });
    expect(monthSlot('2026-05-20T00:00:00Z', now)!.slot).toBe(10);
    expect(monthSlot('2025-07-15T00:00:00Z', now)!.slot).toBe(0);
    expect(monthSlot('2026-06-16T00:00:00Z', '2026-06-20T08:00:00Z')!.fraction).toBeCloseTo(0.5, 6);
  });
  it('refuses a date outside that window or one it cannot read', () => {
    expect(monthSlot('2025-06-30T00:00:00Z', now)).toBeNull();
    expect(monthSlot('2026-06-11T00:00:00Z', now)).toBeNull();
    expect(monthSlot('2026-07-01T00:00:00Z', now)).toBeNull();
    expect(monthSlot('nonsense', now)).toBeNull();
    expect(monthSlot(null, now)).toBeNull();
    expect(monthSlot('2026-06-01T00:00:00Z', undefined)).toBeNull();
  });
  it('places planets at the angle of their date, putting those of one month on different orbits', () => {
    const placed = planets(profile.topRepos, now);
    expect(placed.map((p) => p.repo.name)).toEqual(['alpha', 'gamma', 'epsilon']);
    expect(placed.map((p) => p.slot)).toEqual([11, 10, 11]);
    expect(placed.map((p) => p.orbit)).toEqual([0, 0, 1]);
    expect(placed[0]!.angle).toBeCloseTo(-90 + 11 * 30, 6);
    expect(placed[2]!.angle).toBeGreaterThan(placed[0]!.angle);
    expect(ORBIT_FIRST + 3 * ORBIT_STEP).toBeLessThan(192);
  });
  it('draws only the repositories it can place, and says how many it could not', () => {
    const svg = svgOf('natal', withPicture);
    expect([...svg.matchAll(/font-weight="800" fill="#12101f">(\d)</g)].map((m) => m[1])).toEqual(['1', '2', '3']);
    // The note wraps over several lines, so read the words and not the lines.
    expect(svg.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ')).toContain('2 older projects are not placed.');
    expect(svg).toContain('>alpha<');
    expect(svg).not.toContain('>beta<');
    expect(svgOf('natal', withPicture, ['stats'])).toContain('Switch on Top projects');
    expect(svgOf('natal', { ...withPicture, topRepos: [profile.topRepos[1]!] }).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ')).toContain('none is placed');
  });
  it('keeps planets inside the ring however many were pushed to in one month', () => {
    const many: Profile = { ...withPicture, topRepos: Array.from({ length: 9 }, (_v, i) => ({ ...profile.topRepos[0]!, name: `r${i}`, pushedAt: `2026-06-0${(i % 9) + 1}T00:00:00Z` })) };
    const centres = [...svgOf('natal', many).matchAll(/<circle cx="([\d.]+)" cy="([\d.]+)" r="[\d.]+" fill="#[0-9a-f]{6}" stroke="#[0-9a-f]{6}" stroke-opacity="0.5"/g)];
    expect(centres).toHaveLength(9);
    for (const m of centres) expect(Math.hypot(Number(m[1]) - 300, Number(m[2]) - 270)).toBeLessThanOrEqual(ORBIT_FIRST + 3 * ORBIT_STEP + 0.05);
    const first = [...svgOf('natal', many).matchAll(/<circle cx="([\d.]+)" cy="([\d.]+)" r="[\d.]+" fill="#[0-9a-f]{6}" stroke="#[0-9a-f]{6}" stroke-opacity="0.5"/g)][0]!;
    expect(Math.hypot(Number(first[1]) - 300, Number(first[2]) - 270)).toBeCloseTo(ORBIT_FIRST, 0);
  });

  it('names the month ring from the date of the data, and not at all without one', () => {
    expect(svgOf('natal', withPicture)).toContain('>JUN<');
    expect(svgOf('natal', { ...withPicture, fetchedAt: undefined })).not.toContain('>JUN<');
  });
});

describe('cross-stitch letters', () => {
  it('stitch a letter in five by seven cells', () => {
    const { cells, width } = stitchText('A');
    expect(width).toBe(5);
    expect(cells).toHaveLength(18);
    expect(cells.every(([c, r]) => c >= 0 && c < 5 && r >= 0 && r < 7)).toBe(true);
    expect(cells).toContainEqual([2, 0]);
    expect(cells).not.toContainEqual([0, 0]);
  });
  it('leave six columns for each letter, upper-casing as they go', () => {
    const { cells, width } = stitchText('ab');
    expect(width).toBe(11);
    expect(Math.max(...cells.map(([c]) => c))).toBeGreaterThanOrEqual(6);
    expect(stitchText('ab')).toEqual(stitchText('AB'));
    expect(new Set(cells.map(([c, r]) => `${c},${r}`)).size).toBe(cells.length);
  });
  it('leave a gap for what it has no letter for, and none for an empty line', () => {
    expect(stitchText('é€').cells).toEqual([]);
    expect(stitchText('é€').width).toBe(11);
    expect(stitchText('')).toEqual({ cells: [], width: 0 });
    expect(stitchText('7').cells.length).toBeGreaterThan(5);
  });
  it('have a glyph for every letter and digit', () => {
    for (const ch of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_.,') expect(stitchText(ch).cells.length, ch).toBeGreaterThan(0);
  });
});

describe('cross-stitch sampler', () => {
  it('stitches the handle and one stitch for each day, in the colour of how busy it was', () => {
    const days = [day('2026-01-04', 0), day('2026-01-05', 2), day('2026-01-06', 9), day('2026-01-07', 20)];
    const svg = svgOf('stitch', withDays(days));
    expect(svg).toContain('stroke="#');
    const colours = new Set([...svg.matchAll(/<path d="M[^"]*" stroke="(#[0-9a-f]{6})" stroke-width/g)].map((m) => m[1]));
    expect(colours.size).toBeGreaterThanOrEqual(4);
    expect(svg).toContain('one stitch for each day');
  });
  it('writes the real total, and only when statistics are on', () => {
    const p = withDays(year([5, 5]));
    const full = svgOf('stitch', p);
    const without = svgOf('stitch', p, ['activity']);
    expect(full.length).toBeGreaterThan(without.length);
  });
  it('waits, saying why, with no calendar', () => {
    expect(svgOf('stitch', { ...withPicture, contributions: undefined })).toContain('after the first automatic update');
    expect(svgOf('stitch', withPicture, ['stats'])).toContain('switched off');
  });
  it('keeps even a very long handle inside the cloth', () => {
    const long = { ...withPicture, login: 'a-very-long-github-username-of-39-chars-x' };
    expect(wellFormed(svgOf('stitch', long))).toEqual([]);
  });
});

describe('punch card bits', () => {
  it('writes a number as holes, the smallest first', () => {
    expect(bits(0)).toEqual(Array(12).fill(false));
    expect(bits(1)[0]).toBe(true);
    expect(bits(2).slice(0, 3)).toEqual([false, true, false]);
    expect(bits(5).slice(0, 4)).toEqual([true, false, true, false]);
    expect(bits(7)).toHaveLength(12);
  });
  it('reads back as the same number', () => {
    for (const n of [0, 1, 2, 3, 7, 64, 100, 255, 1000, 2048, 4095]) expect(readBits(bits(n))).toBe(n);
  });
  it('shows too big a number as all holes, and a negative or fractional one sensibly', () => {
    expect(readBits(bits(5000))).toBe(4095);
    expect(readBits(bits(-3))).toBe(0);
    expect(readBits(bits(6.9))).toBe(6);
    expect(readBits(bits(9, 3))).toBe(7);
  });
});

describe('punch card', () => {
  const holes = (svg: string) => [...svg.matchAll(/width="5\.8" height="13"/g)].length;
  const popcount = (n: number) => bits(n).filter(Boolean).length;
  it('punches exactly the weeks of the year, in binary', () => {
    const p = withDays(year([...Array(30).fill(0), 3, 5, 0, 12, 1, 0, 0, 7, 9, 2, 100, 4]));
    const weeks = weeklyTotals(p.contributions!.days);
    expect(holes(svgOf('punch', p))).toBe(weeks.reduce((s, w) => s + popcount(w), 0));
    expect(svgOf('punch', p)).toContain(`the first ${weeks.length} columns`.replace('first ', 'first '));
  });
  it('types the handle, and the numbers only when statistics are on', () => {
    expect(svgOf('punch', withPicture)).toContain('>@<');
    expect(svgOf('punch', withPicture)).toContain('>7<');
    const quiet = svgOf('punch', withPicture, ['activity']);
    expect([...quiet.matchAll(/font-weight="700">(\S)</g)].map((m) => m[1]).join('')).toBe('@OCTO');
  });
  it('punches nothing for an empty year, and waits without a calendar', () => {
    expect(holes(svgOf('punch', withDays(year([]).slice(-20))))).toBe(0);
    expect(svgOf('punch', { ...withPicture, contributions: undefined })).toContain('after the first automatic update');
    expect(holes(svgOf('punch', { ...withPicture, contributions: undefined }))).toBe(0);
  });
});

describe('plinko bins', () => {
  it('sort each repository into the bin of its main language, the rest into other', () => {
    const bins = plinkoBins(profile.languages, profile.topRepos);
    expect(bins.map((b) => [b.name, b.repos.map((r) => r.name)])).toEqual([
      ['Go', ['alpha', 'gamma']],
      ['Rust', ['beta']],
      ['Zig', ['epsilon']],
      ['other', ['delta']],
    ]);
  });
  it('drop an empty bin, and have no other bin when nothing is left over', () => {
    const only = plinkoBins(profile.languages, [profile.topRepos[0]!]);
    expect(only.map((b) => b.name)).toEqual(['Go']);
    expect(plinkoBins([], [])).toEqual([]);
  });
  it('keep to the limit, with a place for the leftovers', () => {
    const many = Array.from({ length: 9 }, (_v, i) => ({ name: `L${i}`, percent: 10 }));
    const repos = many.map((l, i) => ({ ...profile.topRepos[0]!, name: `r${i}`, language: l.name }));
    const bins = plinkoBins(many, repos, 4);
    expect(bins.map((b) => b.name)).toEqual(['L0', 'L1', 'L2', 'other']);
    expect(bins[3]!.repos).toHaveLength(6);
  });
});

describe('plinko bounces', () => {
  it('make exactly as many rights as the slot number, in slots minus one rows', () => {
    for (const [slot, slots] of [[0, 4], [1, 4], [2, 4], [3, 4], [2, 6], [0, 2], [1, 2]] as const) {
      const moves = bounces(slot, slots, 'octo:alpha');
      expect(moves).toHaveLength(slots - 1);
      expect(moves.filter((m) => m === 'R')).toHaveLength(slot);
    }
  });
  it('are repeatable, and vary from repository to repository', () => {
    expect(bounces(3, 7, 'a')).toEqual(bounces(3, 7, 'a'));
    const seen = new Set(Array.from({ length: 40 }, (_v, i) => bounces(3, 7, `repo${i}`).join('')));
    expect(seen.size).toBeGreaterThan(3);
  });
  it('are all left for the first slot and all right for the last', () => {
    expect(bounces(0, 5, 'x')).toEqual(['L', 'L', 'L', 'L']);
    expect(bounces(4, 5, 'x')).toEqual(['R', 'R', 'R', 'R']);
    expect(bounces(0, 1, 'x')).toEqual([]);
  });
});

describe('plinko board', () => {
  it('rests one ball for each project in the bin of its language, and labels the bins with real counts', () => {
    const svg = svgOf('plinko', withPicture);
    expect([...svg.matchAll(/<circle cx="[\d.]+" cy="[\d.]+" r="7\.5"/g)]).toHaveLength(5);
    expect(svg).toContain('>Python<'.replace('Python', 'Go'));
    expect(svg).toContain('>2 repos<');
    expect(svg).toContain('>1 repo<');
    expect(svg).toContain('>other<');
  });
  it('adds one falling ball for each project when there is motion, and hides them for reduced motion', () => {
    const moving = renderWithMotion('plinko');
    expect([...moving.matchAll(/<animateMotion/g)]).toHaveLength(5);
    expect(moving).toContain('prefers-reduced-motion');
    expect(svgOf('plinko', withPicture)).not.toContain('animateMotion');
  });
  it('has no bins, and says why, without projects or languages', () => {
    expect(svgOf('plinko', withPicture, ['languages'])).toContain('Switch on Top projects');
    expect(svgOf('plinko', withPicture, ['projects'])).toContain('>other<');
    expect(svgOf('plinko', { ...withPicture, topRepos: [] })).toContain('Switch on Top projects'.replace('Switch on Top projects', 'Switch on Languages as well'));
  });
});

describe('every plot design', () => {
  const ids = ['topo', 'natal', 'stitch', 'punch', 'plinko'];
  it.each(ids)('%s draws for hostile, bare and picture-less profiles, with any calendar, in both modes', (id) => {
    const hostile: Profile = { ...withPicture, name: '</text><script>x</script>"&', login: 'a-b', languages: [{ name: '"><b>', percent: 100 }], topRepos: [{ ...profile.topRepos[0]!, name: '</text><script>', description: '"><img src=x onerror=1>', language: '"><b>', pushedAt: '2026-06-02T00:00:00Z' }] };
    const calendars = [undefined, buildContributions(year([])), buildContributions(year([5])), buildContributions(year(Array.from({ length: 300 }, (_v, i) => (i * 7) % 11))), buildContributions([day('2026-03-01', 4)])];
    for (const variant of ['dark', 'light'] as const) {
      for (const p of [hostile, withPicture, profile, bare]) {
        for (const contributions of calendars) {
          const svg = svgOf(id, { ...p, contributions }, undefined, variant);
          expect(wellFormed(svg), id).toEqual([]);
          expect(svg).not.toContain('<script>');
          expect(svg).not.toMatch(/NaN|undefined|Infinity/);
        }
      }
    }
  });
});

import { defaultConfig } from './config';
import { renderProfile } from './render';

/** The dark picture of a design with its animation switched on, which the shared test kit leaves off. */
function renderWithMotion(id: string): string {
  return renderProfile(withPicture, { ...defaultConfig('octo', id), theme: 'dark', motion: true }).assets.find((a) => a.path.endsWith(`${id}-dark.svg`))!.content;
}
