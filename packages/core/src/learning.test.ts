import { DOMParser } from '@xmldom/xmldom';
import { describe, expect, it } from 'vitest';
import { defaultConfig } from './config';
import { buildContributions } from './contributions';
import { renderProfile } from './render';
import { blocksFor, habitGrid } from './templates/learning';
import type { Config, ContributionDay, Profile, RepoSummary } from './types';

const FETCHED = '2026-06-10T12:00:00.000Z';
const daysAgo = (n: number) => new Date(Date.parse(FETCHED) - n * 86_400_000).toISOString();

const day = (date: string, count: number): ContributionDay => ({ date, count, level: count === 0 ? 0 : 1 });
function span(start: string, counts: number[]): ContributionDay[] {
  const first = Date.parse(`${start}T00:00:00Z`);
  return counts.map((count, i) => day(new Date(first + i * 86_400_000).toISOString().slice(0, 10), count));
}

describe('habitGrid', () => {
  it('is empty for no days or no weeks', () => {
    expect(habitGrid([], 12)).toEqual([]);
    expect(habitGrid(span('2026-06-07', [1, 2]), 0)).toEqual([]);
  });

  it('lays days in columns of seven, Sunday first', () => {
    // 2026-06-07 is a Sunday.
    const grid = habitGrid(span('2026-06-07', Array(14).fill(1)), 12);
    expect(grid).toHaveLength(2);
    expect(grid[0]!.map((d) => d?.date)).toEqual(['2026-06-07', '2026-06-08', '2026-06-09', '2026-06-10', '2026-06-11', '2026-06-12', '2026-06-13']);
    expect(grid[1]![0]?.date).toBe('2026-06-14');
  });

  it('leaves empty slots before the data begins and after today', () => {
    // Wednesday to Friday of one week.
    const [week] = habitGrid(span('2026-06-10', [1, 1, 1]), 12);
    expect(week!.map((d) => d !== null)).toEqual([false, false, false, true, true, true, false]);
  });

  it('keeps only the newest weeks when there are more than asked for', () => {
    const grid = habitGrid(span('2026-06-07', Array(70).fill(1)), 3);
    expect(grid).toHaveLength(3);
    expect(grid[2]![0]?.date).toBe('2026-08-09'); // the last Sunday in the data
    expect(grid[0]![0]?.date).toBe('2026-07-26');
  });

  it('keeps every real day exactly once', () => {
    const days = span('2026-06-10', Array.from({ length: 40 }, (_v, i) => i % 3));
    const dates = habitGrid(days, 99).flat().filter(Boolean).map((d) => d!.date);
    expect(dates).toEqual(days.map((d) => d.date));
  });

  it('carries the counts through unchanged', () => {
    const [week] = habitGrid(span('2026-06-07', [0, 5, 0, 9, 0, 0, 2]), 12);
    expect(week!.map((d) => d!.count)).toEqual([0, 5, 0, 9, 0, 0, 2]);
  });
});

describe('blocksFor', () => {
  it.each([
    [0, 0],
    [1, 1],
    [4, 1],
    [5, 1],
    [14, 1],
    [15, 2],
    [42, 4],
    [50, 5],
    [89, 9],
    [95, 10],
    [100, 10],
    [140, 10],
  ])('%i%% fills %i of ten blocks', (percent, blocks) => {
    expect(blocksFor(percent)).toBe(blocks);
  });

  it('shows at least one block for any language that is present', () => {
    expect(blocksFor(0.4)).toBe(1);
  });
});

const repo = (name: string, over: Partial<RepoSummary> = {}): RepoSummary => ({
  name,
  description: 'Notes from building this, mostly to remember how it works.',
  stars: 3,
  forks: 0,
  language: 'Go',
  url: `https://github.com/octo/${name}`,
  pushedAt: daysAgo(2),
  license: null,
  ...over,
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
  fetchedAt: FETCHED,
  createdAt: '2021-03-01T00:00:00Z',
  languages: [
    { name: 'Go', percent: 60 },
    { name: 'Python', percent: 30 },
    { name: 'Rust', percent: 10 },
  ],
  topRepos: [repo('starred-one', { stars: 9000 })],
  recentRepos: [repo('fresh', { pushedAt: daysAgo(0) }), repo('middle', { pushedAt: daysAgo(9), description: null }), repo('older', { pushedAt: daysAgo(70) }), repo('fourth')],
  contributions: buildContributions(span('2026-03-15', Array.from({ length: 88 }, (_v, i) => (i % 4 === 0 ? 0 : (i % 5) + 1)))),
};

const config = (over: Partial<Config> = {}): Config => ({ ...defaultConfig('octo', 'learning'), ...over });
const svgOf = (p: Profile, c: Config, variant: 'dark' | 'light' = 'light') =>
  renderProfile(p, c).assets.find((a) => a.path.endsWith(`-${variant}.svg`))!.content;
const heightOf = (svg: string) => Number(/height="(\d+)" viewBox/.exec(svg)![1]);

function parse(svg: string) {
  const errors: string[] = [];
  const doc = new DOMParser({ onError: (_l, m) => errors.push(m) }).parseFromString(svg, 'image/svg+xml');
  expect(errors).toEqual([]);
  return doc;
}

describe('learning log template', () => {
  it('titles the page with the name, the handle and the date the data was read', () => {
    const svg = svgOf(profile, config());
    for (const text of ['Octo Cat', 'learning log', '@octo', 'updated Jun 10, 2026']) expect(svg).toContain(text);
  });

  it('leaves the date out rather than inventing one when the time is unknown', () => {
    const { fetchedAt: _f, ...noClock } = profile;
    const svg = svgOf(noClock, config());
    expect(svg).not.toContain('updated ');
    expect(svg).not.toContain('NaN');
  });

  it('shows a few plain facts, including the year they joined', () => {
    const svg = svgOf(profile, config());
    for (const text of ['42 repositories', '5,400 stars', 'on GitHub since 2021']) expect(svg).toContain(text);
  });

  describe('languages', () => {
    const blocks = (svg: string) => Array.from(parse(svg).getElementsByTagName('rect')).filter((r) => r.getAttribute('width') === '13' && r.getAttribute('height') === '16');

    it('draws ten blocks per language, filled in proportion to its share', () => {
      const all = blocks(svgOf(profile, config()));
      expect(all).toHaveLength(30);
      const filled = all.filter((r) => r.getAttribute('fill') !== 'none').length;
      expect(filled).toBe(blocksFor(60) + blocksFor(30) + blocksFor(10)); // 6 + 3 + 1
    });

    it('states each share and how many languages there are, and says what the share counts', () => {
      const svg = svgOf(profile, config());
      for (const text of ['Go', '60%', 'Python', '30%', 'Rust', '10%', '3 languages across my repositories', 'by number of repositories']) expect(svg).toContain(text);
    });

    it('shows at most five languages', () => {
      const many = { ...profile, languages: Array.from({ length: 8 }, (_v, i) => ({ name: `L${i}`, percent: 10 })) };
      expect(blocks(svgOf(many, config()))).toHaveLength(50);
    });
  });

  describe('habit tracker', () => {
    const dots = (svg: string) =>
      Array.from(parse(svg).getElementsByTagName('circle')).filter((c) => c.getAttribute('r') === '7' || c.getAttribute('r') === '5.5');

    it('has one mark for every day of the last twelve weeks that exists, filled where there was activity', () => {
      const svg = svgOf(profile, config());
      const grid = habitGrid(profile.contributions!.days, 12).flat().filter(Boolean);
      const marks = dots(svg);
      expect(marks).toHaveLength(grid.length);
      expect(marks.filter((c) => c.getAttribute('fill') !== 'none')).toHaveLength(grid.filter((d) => d!.count > 0).length);
    });

    it('states the same numbers it draws', () => {
      const svg = svgOf(profile, config());
      const grid = habitGrid(profile.contributions!.days, 12).flat().filter(Boolean);
      expect(svg).toContain(`${grid.filter((d) => d!.count > 0).length} of the last ${grid.length} days had activity`);
      expect(svg).toContain(`current streak ${profile.contributions!.currentStreak}`);
    });

    it('lines marks up in seven rows and at most twelve columns', () => {
      const marks = dots(svgOf(profile, config()));
      expect(new Set(marks.map((c) => c.getAttribute('cy'))).size).toBe(7);
      expect(new Set(marks.map((c) => c.getAttribute('cx'))).size).toBeLessThanOrEqual(12);
    });

    it('is left out without data, or when the activity section is off', () => {
      const { contributions: _c, ...bare } = profile;
      expect(svgOf(bare, config())).not.toContain('HABIT TRACKER');
      expect(svgOf(profile, config({ blocks: ['stats', 'languages'] }))).not.toContain('HABIT TRACKER');
    });
  });

  describe('recently worked on', () => {
    it('lists the three most recently pushed repositories, as a checklist, newest first', () => {
      const svg = svgOf(profile, config());
      expect(svg.indexOf('fresh')).toBeLessThan(svg.indexOf('middle'));
      expect(svg.indexOf('middle')).toBeLessThan(svg.indexOf('older'));
      expect(svg).not.toContain('>fourth<');
      expect(svg).toContain('updated today');
      expect(svg).toContain('updated 1 week ago');
    });

    it('uses recent work, never the most-starred list', () => {
      expect(svgOf(profile, config())).not.toContain('starred-one');
    });

    it('is left out, not faked from stars, when recent work is unknown', () => {
      const { recentRepos: _r, ...older } = profile;
      const svg = svgOf(older, config());
      expect(svg).not.toContain('RECENTLY WORKED ON');
      expect(svg).not.toContain('starred-one');
    });

    it('omits the description line for a repository that has none', () => {
      const svg = svgOf({ ...profile, recentRepos: [repo('plain', { description: null })] }, config({ blocks: ['projects'] }));
      expect(svg).toContain('plain');
      expect(svg).not.toContain('Notes from building');
    });
  });

  it('stays inside the card whatever is shown', () => {
    for (const blocks of [undefined, [] as Config['blocks'], ['stats'] as Config['blocks'], ['activity', 'projects'] as Config['blocks']]) {
      const svg = svgOf(profile, config(blocks ? { blocks } : {}));
      const h = heightOf(svg);
      for (const r of Array.from(parse(svg).getElementsByTagName('rect'))) {
        const w = Number(r.getAttribute('width'));
        if (w >= 900) continue;
        expect(Number(r.getAttribute('x') ?? 0) + w).toBeLessThanOrEqual(900);
        expect(Number(r.getAttribute('y') ?? 0) + Number(r.getAttribute('height'))).toBeLessThanOrEqual(h + 0.5);
      }
    }
  });

  it('grows as sections are added', () => {
    const h = (blocks: Config['blocks']) => heightOf(svgOf(profile, config({ blocks })));
    expect(h([])).toBeLessThan(h(['stats']));
    expect(h(['stats'])).toBeLessThan(h(['stats', 'languages']));
    expect(h(['stats', 'languages'])).toBeLessThan(h(['stats', 'languages', 'projects']));
  });

  it('makes no claim about the person beyond the data', () => {
    const svg = svgOf(profile, config());
    for (const text of ['Student', 'student', 'Beginner', 'Learning to', 'Currently studying', 'Open to work']) expect(svg).not.toContain(text);
  });

  it('shows the headline the user wrote, and nothing in its place otherwise', () => {
    expect(svgOf(profile, config({ text: { headline: 'Learning one project at a time' } }))).toContain('Learning one project at a time');
    expect(heightOf(svgOf(profile, config()))).toBeLessThan(heightOf(svgOf(profile, config({ text: { headline: 'x' } }))));
  });

  it('is a notebook in light and a chalkboard in dark', () => {
    expect(svgOf(profile, config(), 'light')).toContain('#fffdf5');
    expect(svgOf(profile, config(), 'dark')).toContain('#1c2a29');
  });

  it('animates the marks only when asked, and honours reduced motion', () => {
    expect(svgOf(profile, config())).toContain('@keyframes pop');
    expect(svgOf(profile, config())).toContain('prefers-reduced-motion');
    expect(svgOf(profile, config({ motion: false }))).not.toContain('@keyframes');
  });

  it('mentions the habit tracker in the alt text only when it is shown', () => {
    expect(renderProfile(profile, config()).readme).toContain('twelve-week habit tracker');
    expect(renderProfile(profile, config({ blocks: ['stats'] })).readme).not.toContain('habit tracker');
  });
});
