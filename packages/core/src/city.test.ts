import { DOMParser } from '@xmldom/xmldom';
import { describe, expect, it } from 'vitest';
import { defaultConfig } from './config';
import { buildContributions } from './contributions';
import { renderProfile } from './render';
import { layoutCity } from './templates/city';
import type { Config, ContributionDay, Profile } from './types';

const day = (date: string, count: number): ContributionDay => ({
  date,
  count,
  level: count === 0 ? 0 : count > 30 ? 4 : count > 10 ? 3 : count > 4 ? 2 : 1,
});

/** `counts` on consecutive days starting at `start`. */
function span(start: string, counts: number[]): ContributionDay[] {
  const first = Date.parse(`${start}T00:00:00Z`);
  return counts.map((count, i) => day(new Date(first + i * 86_400_000).toISOString().slice(0, 10), count));
}

/** A year ending on a Wednesday, with a spread of busy and quiet days. */
function year(): ContributionDay[] {
  const end = Date.parse('2026-06-10T00:00:00Z');
  return Array.from({ length: 365 }, (_v, k) => {
    const i = 364 - k;
    const date = new Date(end - i * 86_400_000).toISOString().slice(0, 10);
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
    return day(date, weekday === 0 || weekday === 6 ? 0 : ((i * 7) % 23) + 1);
  });
}

describe('layoutCity', () => {
  it('returns nothing for no days', () => {
    expect(layoutCity([])).toEqual({ cols: 0, buildings: [] });
  });

  it('builds only on days with activity', () => {
    const { buildings } = layoutCity(span('2026-06-07', [0, 3, 0, 9])); // starts on a Sunday
    expect(buildings.map((b) => b.count).sort()).toEqual([3, 9]);
  });

  it('puts weeks on one street and weekdays on the other, Sunday first', () => {
    // 2026-06-07 is a Sunday, so these seven days fill one column, and the eighth starts the next.
    const { cols, buildings } = layoutCity(span('2026-06-07', [1, 1, 1, 1, 1, 1, 1, 1]));
    expect(cols).toBe(2);
    const byDate = Object.fromEntries(buildings.map((b) => [b.date, b]));
    expect(byDate['2026-06-07']).toMatchObject({ col: 0, row: 0 });
    expect(byDate['2026-06-13']).toMatchObject({ col: 0, row: 6 });
    expect(byDate['2026-06-14']).toMatchObject({ col: 1, row: 0 });
  });

  it('starts part-way down the first column when the data begins mid-week', () => {
    const { buildings } = layoutCity(span('2026-06-10', [5])); // a Wednesday
    expect(buildings[0]).toMatchObject({ col: 0, row: 3 });
  });

  it('counts columns including the partial first and last weeks', () => {
    expect(layoutCity(span('2026-06-10', Array(8).fill(1))).cols).toBe(2); // Wed..Wed spans two columns
    expect(layoutCity(span('2026-06-07', Array(14).fill(1))).cols).toBe(2);
    expect(layoutCity(span('2026-06-07', Array(15).fill(1))).cols).toBe(3);
  });

  it('draws furthest buildings first so nearer ones cover them', () => {
    const { buildings } = layoutCity(year());
    for (let i = 1; i < buildings.length; i++) {
      const a = buildings[i - 1]!;
      const b = buildings[i]!;
      expect(a.col + a.row).toBeLessThanOrEqual(b.col + b.row);
    }
  });

  it('makes busier days taller, with the busiest tower at full height', () => {
    const { buildings } = layoutCity(span('2026-06-07', [1, 4, 16, 100]));
    const byCount = [...buildings].sort((a, b) => a.count - b.count);
    for (let i = 1; i < byCount.length; i++) expect(byCount[i]!.height).toBeGreaterThan(byCount[i - 1]!.height);
    expect(byCount[3]!.height).toBeCloseTo(120, 5);
  });

  it('scales height with the square root of the count, between 4 and 120 pixels', () => {
    // height = 4 + sqrt(count / busiest) * (120 - 4)
    const heights = Object.fromEntries(layoutCity(span('2026-06-07', [1, 4, 16, 100])).buildings.map((b) => [b.count, b.height]));
    expect(heights[1]).toBeCloseTo(4 + 0.1 * 116, 6); // 15.6
    expect(heights[4]).toBeCloseTo(4 + 0.2 * 116, 6); // 27.2
    expect(heights[16]).toBeCloseTo(4 + 0.4 * 116, 6); // 50.4
    expect(heights[100]).toBeCloseTo(120, 6);
  });

  it('keeps a quiet day clearly visible beside a very busy one', () => {
    const { buildings } = layoutCity(span('2026-06-07', [1, 1000]));
    const quiet = buildings.find((b) => b.count === 1)!;
    expect(quiet.height).toBeGreaterThan(7); // a linear scale would leave it at barely 4
  });

  it('copes with a single active day and with all-quiet years', () => {
    expect(layoutCity(span('2026-06-07', [7])).buildings[0]!.height).toBeCloseTo(120, 5);
    expect(layoutCity(span('2026-06-07', [0, 0, 0])).buildings).toEqual([]);
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
  topRepos: [{ name: 'alpha', description: null, stars: 12, forks: 1, language: 'Go', url: 'u' }],
  avatar: { dataUri: 'data:image/png;base64,iVBORw0KGgo=', grid: { width: 1, height: 1, luma: [0], alpha: [255], tint: [40, 120, 200] } },
  contributions: buildContributions(year()),
};

const config = (over: Partial<Config> = {}): Config => ({ ...defaultConfig('octo', 'city'), ...over });
const svgOf = (p: Profile, c: Config, variant: 'dark' | 'light' = 'dark') =>
  renderProfile(p, c).assets.find((a) => a.path.endsWith(`-${variant}.svg`))!.content;

function parse(svg: string) {
  const errors: string[] = [];
  const doc = new DOMParser({ onError: (_l, m) => errors.push(m) }).parseFromString(svg, 'image/svg+xml');
  expect(errors).toEqual([]);
  return doc;
}

const buildingGroups = (svg: string) => Array.from(parse(svg).getElementsByTagName('g')).filter((g) => g.getAttribute('class') === 'b');
const pairs = (d: string): Array<[number, number]> => {
  const n = [...d.matchAll(/-?\d+(?:\.\d+)?/g)].map((m) => Number(m[0]));
  return Array.from({ length: n.length / 2 }, (_v, i) => [n[2 * i]!, n[2 * i + 1]!]);
};

describe('contribution city template', () => {
  it('draws exactly one building, with three faces, for every active day', () => {
    const active = profile.contributions!.days.filter((d) => d.count > 0).length;
    const groups = buildingGroups(svgOf(profile, config()));
    expect(groups).toHaveLength(active);
    for (const g of groups.slice(0, 20)) expect(g.getElementsByTagName('path')).toHaveLength(3);
  });

  it('keeps every building, the ground and the flag inside the card', () => {
    for (const variant of ['dark', 'light'] as const) {
      const svg = svgOf(profile, config(), variant);
      const height = Number(/height="(\d+)" viewBox/.exec(svg)![1]);
      for (const path of Array.from(parse(svg).getElementsByTagName('path'))) {
        for (const [x, y] of pairs(path.getAttribute('d') ?? '')) {
          expect(x).toBeGreaterThanOrEqual(0);
          expect(x).toBeLessThanOrEqual(900);
          expect(y).toBeGreaterThanOrEqual(0);
          expect(y).toBeLessThanOrEqual(height);
        }
      }
    }
  });

  it('keeps the tallest tower and its flag on the card even at the very back corner', () => {
    // The first day is a Sunday, so it sits in the back corner of the grid, where towers reach furthest up.
    const days = span('2026-06-07', [500, ...Array(60).fill(1)]);
    const svg = svgOf({ ...profile, contributions: buildContributions(days) }, config());
    const doc = parse(svg);
    for (const path of Array.from(doc.getElementsByTagName('path'))) {
      for (const [, y] of pairs(path.getAttribute('d') ?? '')) expect(y).toBeGreaterThanOrEqual(0);
    }
    const flag = Array.from(doc.getElementsByTagName('text')).find((t) => (t.textContent ?? '').startsWith('Jun 7: 500'))!;
    // The header ends at y=100, and the lettering is about 12px tall, so its baseline must be at least 112.
    expect(Number(flag.getAttribute('y'))).toBeGreaterThanOrEqual(112);
  });

  it('leaves a gap around each building so towers read as separate', () => {
    const svg = svgOf({ ...profile, contributions: buildContributions(span('2026-06-07', [5])) }, config());
    const top = buildingGroups(svg)[0]!.getElementsByTagName('path')[2]!; // the roof
    const xs = pairs(top.getAttribute('d') ?? '').map(([x]) => x);
    const width = Math.max(...xs) - Math.min(...xs);
    const fullCell = 2 * Math.cos(Math.PI / 6) * 14; // a cell with no gap, at the largest cell size
    expect(width).toBeCloseTo(fullCell * 0.72, 0); // 14% gap on each side leaves 72% of the cell
    expect(width).toBeLessThan(fullCell - 3);
  });

  it('fits even a very short history', () => {
    const short = { ...profile, contributions: buildContributions(span('2026-06-10', [3, 8, 1])) };
    const svg = svgOf(short, config());
    for (const path of Array.from(parse(svg).getElementsByTagName('path'))) {
      for (const [x] of pairs(path.getAttribute('d') ?? '')) expect(x).toBeGreaterThanOrEqual(0);
    }
    expect(buildingGroups(svg)).toHaveLength(3);
  });

  it('paints buildings from back to front on screen', () => {
    const groups = buildingGroups(svgOf(profile, config()));
    // The first point of each left face sits on the ground at the building's front corner.
    const groundY = groups.map((g) => pairs(g.getElementsByTagName('path')[0]!.getAttribute('d') ?? '')[0]![1]);
    for (let i = 1; i < groundY.length; i++) expect(groundY[i]!).toBeGreaterThanOrEqual(groundY[i - 1]! - 0.11);
  });

  it('flags the busiest day with its date and count', () => {
    const days = span('2026-06-07', [3, 40, 2, 9]);
    const svg = svgOf({ ...profile, contributions: buildContributions(days) }, config());
    expect(svg).toContain('Jun 8: 40');
  });

  it('flags the most recent day when two days tie for busiest', () => {
    const days = span('2026-06-07', [30, 5, 30, 2]);
    const svg = svgOf({ ...profile, contributions: buildContributions(days) }, config());
    expect(svg).toContain('Jun 9: 30');
    expect(svg).not.toContain('Jun 7: 30');
  });

  it('highlights only the busiest tower in a different colour', () => {
    const svg = svgOf(profile, config());
    expect(svg.match(/class="tp"/g)).toHaveLength(1);
    expect(svg).toContain('.tp{fill:');
  });

  it('states the totals and streaks from the calendar', () => {
    const c = profile.contributions!;
    const svg = svgOf(profile, config());
    expect(svg).toContain(`${c.total.toLocaleString('en-US')} contributions in the past year`);
    expect(svg).toContain(`current streak ${c.currentStreak}`);
    expect(svg).toContain('busiest month');
  });

  describe('without contribution data', () => {
    const { contributions: _c, ...bare } = profile;

    it('says plainly that the city is not ready, and draws no buildings', () => {
      const svg = svgOf(bare, config());
      expect(svg).toContain('Your contribution city appears here');
      expect(buildingGroups(svg)).toHaveLength(0);
      expect(svg).not.toContain('NaN');
      expect(svg).not.toContain('undefined');
    });

    it('does not describe a city in the alt text', () => {
      expect(renderProfile(bare, config()).readme).not.toContain('isometric city');
    });
  });

  it('is left out entirely when the activity section is switched off', () => {
    const svg = svgOf(profile, config({ blocks: ['stats'] }));
    expect(buildingGroups(svg)).toHaveLength(0);
    expect(svg).not.toContain('appears here');
    expect(renderProfile(profile, config({ blocks: ['stats'] })).readme).not.toContain('isometric city');
  });

  it('describes the city in the alt text when it is drawn', () => {
    expect(renderProfile(profile, config()).readme).toContain('an isometric city with one building for each active day');
  });

  describe('sky and colour', () => {
    it('is repeatable, and different for different usernames', () => {
      expect(svgOf(profile, config())).toBe(svgOf(profile, config()));
      const stars = (svg: string) => (svg.match(/<circle [^>]*fill="#ffffff"/g) ?? []).join('');
      expect(stars(svgOf(profile, config()))).not.toBe(stars(svgOf({ ...profile, login: 'someone-else' }, config())));
    });

    it('has stars at night and none at dawn', () => {
      expect(svgOf(profile, config(), 'dark')).toMatch(/<circle [^>]*fill="#ffffff"/);
      expect(svgOf(profile, config(), 'light')).not.toMatch(/<circle [^>]*fill="#ffffff"/);
    });

    it('takes its colours from the picture, with a standard blue without one', () => {
      const red = svgOf({ ...profile, avatar: { ...profile.avatar!, grid: { ...profile.avatar!.grid, tint: [200, 30, 30] } } }, config());
      const blue = svgOf({ ...profile, avatar: { ...profile.avatar!, grid: { ...profile.avatar!.grid, tint: [30, 30, 200] } } }, config());
      expect(red).not.toBe(blue);
      const { avatar: _a, ...plain } = profile;
      expect(svgOf(plain, config())).not.toBe(red);
    });
  });

  it('shows the portrait only when it is safe', () => {
    expect(parse(svgOf(profile, config())).getElementsByTagName('image')).toHaveLength(1);
    const bad = { ...profile, avatar: { ...profile.avatar!, dataUri: 'javascript:alert(1)' } };
    const svg = svgOf(bad, config());
    expect(parse(svg).getElementsByTagName('image')).toHaveLength(0);
    expect(svg).not.toContain('javascript');
  });

  it('keeps the file size reasonable for a full year', () => {
    expect(svgOf(profile, config()).length).toBeLessThan(150_000);
  });

  it('has distinct dark and light versions, and animates only when asked', () => {
    expect(svgOf(profile, config(), 'dark')).not.toBe(svgOf(profile, config(), 'light'));
    expect(svgOf(profile, config())).toContain('@keyframes grow');
    expect(svgOf(profile, config())).toContain('prefers-reduced-motion');
    expect(svgOf(profile, config({ motion: false }))).not.toContain('@keyframes');
  });
});
