import { DOMParser } from '@xmldom/xmldom';
import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../config';
import { buildContributions } from '../contributions';
import { renderProfile } from '../render';
import type { Config, ContributionDay, Profile } from '../types';
import { gridOf, planBreakout, planRunner, zapFraction } from './arcade';

/** Starts on a Wednesday, so the first column is only partly filled. Busy on some days, quiet on the rest. */
const days: ContributionDay[] = Array.from({ length: 100 }, (_v, i) => {
  const count = i % 3 === 0 ? 0 : (i % 7) + 1;
  return { date: new Date(Date.UTC(2026, 0, 7 + i)).toISOString().slice(0, 10), count, level: (count === 0 ? 0 : Math.min(4, Math.ceil(count / 2))) as 0 | 1 | 2 | 3 | 4 };
});
const active = days.filter((d) => d.count > 0).length;

const profile: Profile = {
  login: 'octo',
  name: 'Octo Cat',
  avatarUrl: 'https://avatars.example/octo',
  bio: null,
  company: null,
  location: null,
  website: null,
  url: 'https://github.com/octo',
  followers: 4321,
  following: 1,
  publicRepos: 9,
  totalStars: 777,
  createdAt: '2020-01-01T00:00:00Z',
  languages: [],
  topRepos: [],
  contributions: buildContributions(days),
  fetchedAt: '2026-06-10T08:00:00Z',
};

const config = (id: string, over: Partial<Config> = {}): Config => ({ ...defaultConfig('octo', id), ...over });
const svgOf = (p: Profile, id: string, over: Partial<Config> = {}) =>
  renderProfile(p, config(id, over)).assets.find((a) => a.path.endsWith(`${id}-dark.svg`))!.content;
const doc = (svg: string) => new DOMParser().parseFromString(svg, 'image/svg+xml');

describe('gridOf', () => {
  it('puts each day in the column of its week and the row of its weekday', () => {
    const { cols, cells } = gridOf(days);
    expect(cells).toHaveLength(days.length);
    expect(cells[0]).toMatchObject({ col: 0, row: 3 }); // 7 January 2026 was a Wednesday
    expect(cells[4]).toMatchObject({ col: 1, row: 0 }); // the following Sunday starts a new week
    expect(cols).toBe(Math.ceil((3 + days.length) / 7));
  });

  it('handles no days at all', () => {
    expect(gridOf([])).toEqual({ cols: 0, cells: [] });
  });
});

describe('zapFraction', () => {
  it('moves forward column by column and finishes inside the sweep', () => {
    const fractions = Array.from({ length: 20 }, (_v, c) => zapFraction(c, 20));
    for (let i = 1; i < fractions.length; i++) expect(fractions[i]!).toBeGreaterThan(fractions[i - 1]!);
    expect(fractions[0]!).toBeGreaterThan(0);
    expect(fractions[19]!).toBeLessThanOrEqual(0.88);
  });
});

describe('planRunner', () => {
  const plan = planRunner(days);

  it('makes one orb for each active week and none for quiet ones', () => {
    expect(plan.orbs.length).toBe(plan.weeks.filter((w) => w > 0).length);
    for (const orb of plan.orbs) expect(plan.weeks[orb.week]).toBe(orb.total);
  });

  it('reaches the weeks in order, inside the first 88% of the loop', () => {
    for (let i = 1; i < plan.orbs.length; i++) expect(plan.orbs[i]!.at).toBeGreaterThan(plan.orbs[i - 1]!.at);
    expect(Math.max(...plan.orbs.map((o) => o.at))).toBeLessThanOrEqual(0.88);
  });

  it('knows the busiest week', () => {
    expect(plan.peak).toBe(Math.max(...plan.weeks));
  });

  it('copes with no activity', () => {
    expect(planRunner([]).orbs).toEqual([]);
    expect(planRunner(days.map((d) => ({ ...d, count: 0, level: 0 as const }))).orbs).toEqual([]);
  });
});

describe('planBreakout', () => {
  const plan = planBreakout(days);
  const { cells } = gridOf(days);

  it('keeps the ball on the board and moving right', () => {
    expect(plan.path.length).toBeGreaterThan(10);
    for (const p of plan.path) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(plan.rows - 1);
    }
    for (let i = 1; i < plan.path.length; i++) expect(plan.path[i]!.x).toBeGreaterThan(plan.path[i - 1]!.x);
  });

  it('bounces between the top of the bricks and the paddle', () => {
    // A full year, as a real calendar is, so the ball has room to bounce several times.
    const year = Array.from({ length: 365 }, (_v, i) => ({ date: new Date(Date.UTC(2025, 5, 11 + i)).toISOString().slice(0, 10), count: i % 2, level: (i % 2) as 0 | 1 }));
    const ys = planBreakout(year).path.map((p) => p.y);
    const rows = planBreakout(year).rows;
    expect(Math.min(...ys)).toBe(0);
    expect(Math.max(...ys)).toBe(rows - 1);
    // A real zigzag: one row every step, and back to the paddle again and again.
    for (let i = 1; i < ys.length; i++) expect(Math.abs(ys[i]! - ys[i - 1]!)).toBe(1);
    expect(ys.filter((y) => y === 0).length).toBeGreaterThan(2);
    expect(ys.filter((y) => y === rows - 1).length).toBeGreaterThan(2);
  });

  it('only hits bricks that exist, once each, with the ball inside them at that moment', () => {
    const activeKeys = new Set(cells.filter((c) => c.count > 0).map((c) => `${c.col},${c.row}`));
    expect(plan.hits.size).toBeGreaterThan(0);
    for (const [key, step] of plan.hits) {
      expect(activeKeys.has(key)).toBe(true);
      const p = plan.path[step]!;
      expect(`${Math.floor(p.x)},${Math.floor(p.y)}`).toBe(key);
    }
  });

  it('copes with no days', () => {
    expect(planBreakout([])).toMatchObject({ path: [], cols: 0 });
  });
});

describe.each(['spaceshooter', 'jetrunner', 'playablesignal'])('%s card', (id) => {
  it('is well-formed with and without motion', () => {
    for (const motion of [true, false]) {
      const errors: string[] = [];
      new DOMParser({ onError: (_l, m) => errors.push(m) }).parseFromString(svgOf(profile, id, { motion }), 'image/svg+xml');
      expect(errors).toEqual([]);
    }
  });

  it('is fully still without motion and honours reduced motion with it', () => {
    expect(svgOf(profile, id, { motion: false })).not.toContain('@keyframes');
    const moving = svgOf(profile, id);
    expect(moving).toContain('@keyframes');
    expect(moving).toContain('prefers-reduced-motion');
  });

  it('says what it needs instead of drawing a fake game when there is no calendar', () => {
    const none = svgOf({ ...profile, contributions: undefined as never }, id);
    expect(none).toContain('Your game appears here');
    expect(none).not.toContain('@keyframes');
    const off = svgOf(profile, id, { blocks: ['stats'] });
    expect(off).toContain('Turn on the activity section');
    expect(off).not.toContain('@keyframes');
  });

  it('shows no number from the stats block when it is off', () => {
    const text = svgOf(profile, id, { blocks: ['activity'] });
    for (const hidden of ['777', '4,321']) expect(text).not.toContain(hidden);
  });

  it('draws the real contribution total', () => {
    expect(svgOf(profile, id)).toContain(profile.contributions!.total.toLocaleString('en-US'));
  });
});

describe('space shooter', () => {
  it('lets only active days be zapped, each in its own column’s moment', () => {
    const svg = svgOf(profile, 'spaceshooter');
    expect((svg.match(/class="z z\d+"/g) ?? []).length).toBe(active);
    const cols = new Set([...svg.matchAll(/class="z z(\d+)"/g)].map((m) => m[1]));
    expect((svg.match(/@keyframes ar-z\d+/g) ?? []).length).toBe(cols.size);
    expect((svg.match(/class="bm b\d+"/g) ?? []).length).toBe(cols.size);
  });

  it('flashes each beam at the moment its column is zapped', () => {
    const svg = svgOf(profile, 'spaceshooter');
    const total = (gridOf(days).cols * 0.16 + 3).toFixed(2).replace(/\.?0+$/, '');
    expect(svg).toContain(`animation:ar-fly ${total}s`);
    const zap = /@keyframes ar-z1\{0%,([\d.]+)%\{opacity:1\}/.exec(svg)!;
    const beam = /@keyframes ar-b1\{0%,[\d.]+%\{opacity:0\}([\d.]+)%\{opacity:1\}/.exec(svg)!;
    expect(zap[1]).toBe(beam[1]);
    expect(Number(zap[1])).toBeCloseTo(zapFraction(1, gridOf(days).cols) * 100, 1);
  });
});

describe('jet runner', () => {
  it('draws a terrain bar for every week and an orb for every active week', () => {
    const plan = planRunner(days);
    const svg = svgOf(profile, 'jetrunner', { motion: false });
    const circles = Array.from(doc(svg).getElementsByTagName('circle')).filter((c) => c.getAttribute('fill-opacity') === null && Number(c.getAttribute('r')) >= 3);
    expect(circles.length).toBeGreaterThanOrEqual(plan.orbs.length);
    expect(svg).toContain(`${plan.orbs.length} active weeks collected`);
  });

  it('removes an orb at the moment the jet reaches it', () => {
    const svg = svgOf(profile, 'jetrunner');
    const orb = planRunner(days).orbs[2]!;
    const m = new RegExp(`@keyframes ar-o${orb.week}\\{0%,([\\d.]+)%`).exec(svg)!;
    expect(Number(m[1])).toBeCloseTo(orb.at * 100, 1);
  });
});

describe('playable signal', () => {
  it('removes a brick only when the ball reaches it', () => {
    const svg = svgOf(profile, 'playablesignal');
    const plan = planBreakout(days);
    const hit = [...plan.hits.values()];
    const buckets = new Set(hit.map((step) => Math.floor(step / 4)));
    expect((svg.match(/class="k k\d+"/g) ?? []).length).toBe(plan.hits.size);
    expect((svg.match(/@keyframes ar-k\d+/g) ?? []).length).toBe(buckets.size);
  });

  it('keeps the paddle under the ball', () => {
    const svg = svgOf(profile, 'playablesignal');
    expect(svg).toContain('@keyframes ar-ball');
    expect(svg).toContain('@keyframes ar-pad');
  });

  it('shows the score and the streak as real figures', () => {
    const svg = svgOf(profile, 'playablesignal');
    expect(svg).toContain(`SCORE   ${profile.contributions!.total}`);
    expect(svg).toContain(`STREAK  ${profile.contributions!.currentStreak}`);
  });
});
