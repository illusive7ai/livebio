import { DOMParser } from '@xmldom/xmldom';
import { describe, expect, it } from 'vitest';
import { defaultConfig } from './config';
import { buildContributions } from './contributions';
import { renderProfile } from './render';
import { planSnake } from './templates/snake';
import type { Config, ContributionDay, Profile } from './types';

const day = (date: string, count: number): ContributionDay => ({
  date,
  count,
  level: count === 0 ? 0 : count > 30 ? 4 : count > 10 ? 3 : count > 4 ? 2 : 1,
});

function span(start: string, counts: number[]): ContributionDay[] {
  const first = Date.parse(`${start}T00:00:00Z`);
  return counts.map((count, i) => day(new Date(first + i * 86_400_000).toISOString().slice(0, 10), count));
}

/** A year of days with a mix of busy, quiet and empty days. */
function year(): ContributionDay[] {
  const end = Date.parse('2026-06-10T00:00:00Z');
  return Array.from({ length: 365 }, (_v, k) => {
    const i = 364 - k;
    const date = new Date(end - i * 86_400_000).toISOString().slice(0, 10);
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
    return day(date, weekday === 0 || weekday === 6 ? 0 : ((i * 7) % 23) + 1);
  });
}

const manhattan = (a: [number, number], b: [number, number]) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);

describe('planSnake', () => {
  it('has no route for no days', () => {
    expect(planSnake([])).toEqual({ cols: 0, path: [], cells: [] });
  });

  // 2026-06-07 is a Sunday. One column, two, three: odd and even column counts end on different rows.
  it.each([7, 14, 15, 21, 22, 365, 371])('routes %i days as one closed loop of single steps', (count) => {
    const { path } = planSnake(span('2026-06-07', Array(count).fill(1)));
    for (let i = 1; i < path.length; i++) expect(manhattan(path[i - 1]!, path[i]!)).toBe(1);
    // The last step must sit beside the first, so the animation can repeat with no jump.
    expect(manhattan(path[path.length - 1]!, path[0]!)).toBe(1);
  });

  it('passes over every cell of the grid exactly once before leaving it', () => {
    const { cols, path } = planSnake(span('2026-06-07', Array(30).fill(1)));
    const inGrid = path.slice(0, cols * 7);
    expect(new Set(inGrid.map(([c, r]) => `${c},${r}`)).size).toBe(cols * 7);
    for (const [c, r] of inGrid) {
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThan(cols);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThan(7);
    }
  });

  it('sweeps down the first week, then up the next', () => {
    const { path } = planSnake(span('2026-06-07', Array(14).fill(1)));
    expect(path.slice(0, 7).map(([, r]) => r)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(path.slice(7, 14).map(([, r]) => r)).toEqual([6, 5, 4, 3, 2, 1, 0]);
  });

  it('comes back round the outside, never across the grid', () => {
    const { cols, path } = planSnake(year());
    for (const [c, r] of path.slice(cols * 7)) expect(c === cols || r === -1).toBe(true);
    expect(path[path.length - 1]).toEqual([0, -1]);
  });

  it('has the length the route needs: the sweep, the way out and the way back', () => {
    for (const count of [7, 14, 15, 365]) {
      const { cols, path } = planSnake(span('2026-06-07', Array(count).fill(1)));
      const lastRow = path[cols * 7 - 1]![1];
      expect(path).toHaveLength(7 * cols + 1 + (lastRow + 1) + cols);
    }
  });

  it('places days in the grid Sunday first, even when the data starts mid-week', () => {
    const { cells } = planSnake(span('2026-06-10', [1, 1, 1, 1, 1])); // Wednesday to Sunday
    expect(cells.map((c) => [c.col, c.row])).toEqual([[0, 3], [0, 4], [0, 5], [0, 6], [1, 0]]);
  });

  it('records the step at which the head reaches each day', () => {
    const plan = planSnake(year());
    for (const cell of plan.cells) expect(plan.path[cell.step]).toEqual([cell.col, cell.row]);
  });

  it('copes with a single day', () => {
    const plan = planSnake(span('2026-06-10', [5]));
    expect(plan.cols).toBe(1);
    expect(plan.cells).toHaveLength(1);
    expect(manhattan(plan.path[plan.path.length - 1]!, plan.path[0]!)).toBe(1);
  });
});

const profile: Profile = {
  login: 'octo',
  name: 'Octo Cat',
  avatarUrl: 'https://avatars.example/octo',
  bio: null,
  company: null,
  location: null,
  website: null,
  url: 'https://github.com/octo',
  followers: 900,
  following: 3,
  publicRepos: 42,
  totalStars: 5400,
  createdAt: '2019-03-01T00:00:00Z',
  languages: [{ name: 'Go', percent: 100 }],
  topRepos: [],
  contributions: buildContributions(year()),
};

const config = (over: Partial<Config> = {}): Config => ({ ...defaultConfig('octo', 'snake'), ...over });
const svgOf = (p: Profile, c: Config, variant: 'dark' | 'light' = 'dark') =>
  renderProfile(p, c).assets.find((a) => a.path.endsWith(`-${variant}.svg`))!.content;

function parse(svg: string) {
  const errors: string[] = [];
  const doc = new DOMParser({ onError: (_l, m) => errors.push(m) }).parseFromString(svg, 'image/svg+xml');
  expect(errors).toEqual([]);
  return doc;
}

const rects = (svg: string) => Array.from(parse(svg).getElementsByTagName('rect'));

/** The image's alt text from the generated README. The file name also contains "snake", so only this is checked. */
const altOf = (p: Profile, c: Config) => /alt="([^"]*)"/.exec(renderProfile(p, c).readme)![1]!;
const segments = (svg: string) => rects(svg).filter((r) => r.getAttribute('class') === 's');
const plan = planSnake(year());
const STEP_SECONDS = 0.075;

/** Reads the head's route out of the stylesheet: one translate per keyframe stop. */
function keyframeStops(svg: string): Array<{ percent: number; x: number; y: number }> {
  const body = /@keyframes slither\{(.*?)\}\.c\{/s.exec(svg)![1]!;
  return [...body.matchAll(/([\d.]+)%\{transform:translate\((-?[\d.]+)px,(-?[\d.]+)px\)\}/g)].map((m) => ({
    percent: Number(m[1]),
    x: Number(m[2]),
    y: Number(m[3]),
  }));
}

describe('snake trail template', () => {
  it('draws one square for every day, apart from the snake itself', () => {
    const cells = rects(svgOf(profile, config())).filter(
      (r) => r.getAttribute('width') === '11' && r.getAttribute('height') === '11' && r.getAttribute('class') !== 's',
    );
    expect(cells).toHaveLength(profile.contributions!.days.length);
  });

  describe('the snake', () => {
    it('has a head and five body segments, with the head drawn last so it sits on top', () => {
      const s = segments(svgOf(profile, config()));
      expect(s).toHaveLength(6);
      const sizes = s.map((r) => Number(r.getAttribute('width')));
      expect(sizes[sizes.length - 1]).toBe(11); // the head is the full cell size
      expect(Math.max(...sizes.slice(0, -1))).toBeLessThan(11); // the body is a little smaller
    });

    it('trails the head by one step per segment, as a negative delay so the loop wraps cleanly', () => {
      const svg = svgOf(profile, config());
      const L = plan.path.length;
      const delays = segments(svg)
        .map((r) => Number(/animation-delay:-([\d.]+)s/.exec(r.getAttribute('style') ?? '')![1]))
        .reverse(); // head first
      delays.forEach((delay, i) => expect(delay).toBeCloseTo((L - i) * STEP_SECONDS, 1));
    });

    it('follows the planned route exactly, stop by stop', () => {
      const svg = svgOf(profile, config());
      const stops = keyframeStops(svg);
      const L = plan.path.length;
      expect(stops).toHaveLength(L + 1);
      const x0 = Number(/<rect x="(\d+)" y="\d+" width="11"/.exec(svg)![1]); // first drawn cell is column 0
      stops.slice(0, L).forEach((stop, index) => {
        const [col, row] = plan.path[index]!;
        expect(stop.percent).toBeCloseTo((index / L) * 100, 1);
        expect(stop.x - x0).toBe(col * 14 + (plan.cells[0]!.col === 0 ? 0 : 0));
        expect(stop.y).toBe(stop.y); // y checked against the neighbour below
        if (index > 0) {
          const [pc, pr] = plan.path[index - 1]!;
          expect(Math.abs(stop.x - stops[index - 1]!.x) + Math.abs(stop.y - stops[index - 1]!.y)).toBe(14 * (Math.abs(col - pc) + Math.abs(row - pr)));
        }
      });
    });

    it('ends where it began, so the loop repeats with no jump', () => {
      const stops = keyframeStops(svgOf(profile, config()));
      expect(stops[stops.length - 1]).toMatchObject({ percent: 100, x: stops[0]!.x, y: stops[0]!.y });
    });

    it('runs one lap in as many seconds as the route has steps', () => {
      const svg = svgOf(profile, config());
      const period = Number(/\.s\{animation:slither ([\d.]+)s linear infinite\}/.exec(svg)![1]);
      expect(period).toBeCloseTo(plan.path.length * STEP_SECONDS, 1);
      expect(svg).toContain(`.c{animation-duration:${period}s`);
    });

    it('rests curled at the start when nothing is animating', () => {
      const s = segments(svgOf(profile, config({ motion: false })));
      expect(s).toHaveLength(6);
      for (const r of s) expect(r.getAttribute('transform')).toMatch(/^translate\(\d+ \d+\)$/);
      expect(s[s.length - 1]!.getAttribute('style')).toBeNull(); // no animation properties
    });
  });

  describe('eating', () => {
    const svg = svgOf(profile, config());
    const active = plan.cells.filter((c) => c.count > 0);

    it('gives every active day, and only those, a time to vanish', () => {
      const eaten = rects(svg).filter((r) => /\bc\b/.test(r.getAttribute('class') ?? ''));
      expect(eaten).toHaveLength(active.length);
    });

    it('makes each cell vanish after the head reaches it, while the snake’s body still covers it', () => {
      const vanishAt = new Map<number, number>();
      for (const m of svg.matchAll(/@keyframes e(\d+)\{0%,([\d.]+)%\{opacity:1\}/g)) vanishAt.set(Number(m[1]), Number(m[2]));
      const L = plan.path.length;
      for (const cell of active) {
        const bucket = Math.floor(cell.step / 4);
        const vanishStep = (vanishAt.get(bucket)! / 100) * L;
        expect(vanishStep).toBeGreaterThanOrEqual(cell.step - 0.2); // never before the head arrives
        expect(vanishStep - cell.step).toBeLessThanOrEqual(5); // hidden under the five body segments
      }
    });

    it('defines every vanishing animation it uses, and none it does not', () => {
      const used = new Set([...svg.matchAll(/class="c e(\d+)"/g)].map((m) => m[1]));
      const defined = new Set([...svg.matchAll(/@keyframes e(\d+)\{/g)].map((m) => m[1]));
      expect(used).toEqual(defined);
    });

    it('brings every cell back when the loop restarts', () => {
      expect(svg).toMatch(/@keyframes e\d+\{0%,[\d.]+%\{opacity:1\}[\d.]+%,100%\{opacity:0\}\}/);
      expect(svg).toContain('animation-iteration-count:infinite');
    });
  });

  it('keeps the grid and the whole route, including the way back, inside the card', () => {
    for (const variant of ['dark', 'light'] as const) {
      const svg = svgOf(profile, config(), variant);
      const height = Number(/height="(\d+)" viewBox/.exec(svg)![1]);
      for (const r of rects(svg).filter((x) => x.getAttribute('width') === '11')) {
        expect(Number(r.getAttribute('x')) + 11).toBeLessThanOrEqual(900);
        expect(Number(r.getAttribute('x'))).toBeGreaterThanOrEqual(0);
        expect(Number(r.getAttribute('y')) + 11).toBeLessThanOrEqual(height);
      }
      for (const stop of keyframeStops(svg)) {
        expect(stop.x).toBeGreaterThanOrEqual(0);
        expect(stop.x + 11).toBeLessThanOrEqual(900);
        expect(stop.y).toBeGreaterThanOrEqual(60); // below the header
        expect(stop.y + 11).toBeLessThanOrEqual(height);
      }
    }
  });

  it('stays a sensible size for a full year', () => {
    expect(svgOf(profile, config()).length).toBeLessThan(100_000);
    expect(svgOf(profile, config({ motion: false })).length).toBeLessThan(50_000);
  });

  it('has no animation at all when motion is off, and honours reduced motion otherwise', () => {
    const still = svgOf(profile, config({ motion: false }));
    expect(still).not.toContain('@keyframes');
    expect(still).not.toMatch(/class="c /);
    const moving = svgOf(profile, config());
    expect(moving).toContain('prefers-reduced-motion');
    expect(moving).toContain('.s,.c{animation:none}');
  });

  it('states the totals and streaks from the calendar', () => {
    const c = profile.contributions!;
    const svg = svgOf(profile, config());
    expect(svg).toContain(`${c.total.toLocaleString('en-US')} contributions in the past year`);
    expect(svg).toContain(`current streak ${c.currentStreak}`);
  });

  describe('without contribution data', () => {
    const { contributions: _c, ...bare } = profile;

    it('says plainly that the snake is not ready, and draws nothing else', () => {
      const svg = svgOf(bare, config());
      expect(svg).toContain('Your snake appears here');
      expect(segments(svg)).toHaveLength(0);
      expect(svg).not.toContain('NaN');
    });

    it('does not describe a snake in the alt text', () => {
      expect(altOf(bare, config())).not.toContain('snake');
    });
  });

  it('is left out entirely when the activity section is switched off', () => {
    const svg = svgOf(profile, config({ blocks: ['stats'] }));
    expect(segments(svg)).toHaveLength(0);
    expect(svg).not.toContain('appears here');
    expect(altOf(profile, config({ blocks: ['stats'] }))).not.toContain('snake');
  });

  it('describes the snake in the alt text when it is drawn', () => {
    expect(altOf(profile, config())).toContain('an animated snake crossing the contribution graph');
  });

  it('has distinct dark and light versions', () => {
    expect(svgOf(profile, config(), 'dark')).not.toBe(svgOf(profile, config(), 'light'));
  });

  it('copes with a very short history', () => {
    const short = { ...profile, contributions: buildContributions(span('2026-06-10', [3, 8, 1])) };
    const svg = svgOf(short, config());
    expect(segments(svg)).toHaveLength(6);
    expect(svg).not.toContain('NaN');
  });
});
