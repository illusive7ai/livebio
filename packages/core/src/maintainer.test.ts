import { DOMParser } from '@xmldom/xmldom';
import { describe, expect, it } from 'vitest';
import { buildContributions } from './contributions';
import { defaultConfig } from './config';
import { renderProfile } from './render';
import type { Config, ContributionDay, Profile, RepoSummary } from './types';

const FETCHED = '2026-06-15T12:00:00.000Z';
const daysAgo = (n: number) => new Date(Date.parse(FETCHED) - n * 86_400_000).toISOString();

const repo = (name: string, over: Partial<RepoSummary> = {}): RepoSummary => ({
  name,
  description: 'A project that does one thing well and says so plainly.',
  stars: 1200,
  forks: 85,
  language: 'Go',
  url: 'https://github.com/octo/' + name,
  pushedAt: daysAgo(2),
  license: 'MIT',
  ...over,
});

function year(): ContributionDay[] {
  const end = Date.parse('2026-06-10T00:00:00Z');
  return Array.from({ length: 365 }, (_v, k) => {
    const i = 364 - k;
    const date = new Date(end - i * 86_400_000);
    const count = date.getUTCDay() % 6 === 0 ? 0 : (i % 6) + 1;
    return { date: date.toISOString().slice(0, 10), count, level: (count === 0 ? 0 : Math.min(4, Math.ceil(count / 2))) as 0 | 1 | 2 | 3 | 4 };
  });
}

const profile: Profile = {
  login: 'octo',
  name: 'Octo Cat',
  avatarUrl: 'https://avatars.example/octo',
  bio: 'Maintains a few small tools that people seem to like.',
  company: null,
  location: null,
  website: null,
  url: 'https://github.com/octo',
  followers: 900,
  following: 3,
  publicRepos: 42,
  totalStars: 5400,
  totalForks: 310,
  activeRepos: 9,
  fetchedAt: FETCHED,
  createdAt: '2019-03-01T00:00:00Z',
  languages: [
    { name: 'Go', percent: 70 },
    { name: 'Rust', percent: 30 },
  ],
  topRepos: [repo('alpha'), repo('beta', { license: null }), repo('gamma', { description: null, pushedAt: null }), repo('delta', { language: null })],
  avatar: { dataUri: 'data:image/png;base64,iVBORw0KGgo=', grid: { width: 1, height: 1, luma: [0], alpha: [255], tint: [40, 120, 200] } },
  contributions: buildContributions(year()),
};

const config = (over: Partial<Config> = {}): Config => ({ ...defaultConfig('octo', 'maintainer'), ...over });
const svgOf = (p: Profile, c: Config, variant: 'dark' | 'light' = 'dark') =>
  renderProfile(p, c).assets.find((a) => a.path.endsWith(`-${variant}.svg`))!.content;
const heightOf = (svg: string) => Number(/height="(\d+)" viewBox/.exec(svg)![1]);

function parse(svg: string) {
  const errors: string[] = [];
  const doc = new DOMParser({ onError: (_l, m) => errors.push(m) }).parseFromString(svg, 'image/svg+xml');
  expect(errors).toEqual([]);
  return doc;
}

describe('open-source maintainer card', () => {
  it('leads with the impact numbers', () => {
    const svg = svgOf(profile, config());
    for (const text of ['5,400', 'STARS EARNED', '310', 'FORKS', '42', 'REPOSITORIES', '>9<', 'ACTIVE, LAST 90 DAYS']) {
      expect(svg).toContain(text);
    }
  });

  it('falls back to followers when forks or recent activity are unknown', () => {
    const { totalForks: _f, activeRepos: _a, ...older } = profile;
    const svg = svgOf(older, config());
    expect(svg).toContain('FOLLOWERS');
    expect(svg).not.toContain('FORKS</text>');
    expect(svg).not.toContain('ACTIVE, LAST');
    expect(svg).not.toContain('NaN');
  });

  describe('project tiles', () => {
    it('shows stars, forks, licence and how recently each project was updated', () => {
      const svg = svgOf(profile, config());
      expect(svg).toContain('★ 1,200');
      expect(svg).toContain('MIT');
      expect(svg).toContain('updated 2 days ago');
    });

    it('leaves out a licence or date it does not have, instead of guessing', () => {
      const svg = svgOf({ ...profile, topRepos: [repo('plain', { license: null, pushedAt: null })] }, config({ blocks: ['projects'] }));
      expect(svg).not.toContain('updated');
      expect(svg).not.toContain('MIT');
      expect(svg).not.toContain('Unlicensed');
      expect(svg).not.toContain('No license');
    });

    it('does not claim a freshness it cannot measure when the fetch time is missing', () => {
      const { fetchedAt: _t, ...noClock } = profile;
      expect(svgOf(noClock, config())).not.toContain('updated ');
    });

    it('lays out two across, and lets an odd last tile fill the row', () => {
      const tiles = (p: Profile) =>
        Array.from(parse(svgOf(p, config({ blocks: ['projects'] }))).getElementsByTagName('rect')).filter((r) => r.getAttribute('height') === '140');
      expect(tiles(profile)).toHaveLength(4);
      const three = tiles({ ...profile, topRepos: profile.topRepos.slice(0, 3) });
      expect(three).toHaveLength(3);
      expect(three[2]!.getAttribute('width')).toBe('828'); // the odd one spans the whole row
      expect(Number(three[0]!.getAttribute('width'))).toBeLessThan(420);
    });

    it('shows at most four projects', () => {
      const many = Array.from({ length: 9 }, (_v, i) => repo(`repo${i}`));
      const tiles = Array.from(parse(svgOf({ ...profile, topRepos: many }, config({ blocks: ['projects'] }))).getElementsByTagName('rect')).filter(
        (r) => r.getAttribute('height') === '140',
      );
      expect(tiles).toHaveLength(4);
    });

    it('cuts a very long project name to fit its tile', () => {
      const long = 'x'.repeat(120);
      const half = svgOf({ ...profile, topRepos: [repo(long), repo('short')] }, config({ blocks: ['projects'] }));
      expect(half).toContain('…');
      expect(half).not.toContain('x'.repeat(40)); // a half-width tile holds about 35 characters
      const full = svgOf({ ...profile, topRepos: [repo(long)] }, config({ blocks: ['projects'] }));
      expect(full).toContain('…');
      expect(full).not.toContain('x'.repeat(100)); // even a full-width tile cuts it
      expect(full.match(/x{40,}/)![0].length).toBeGreaterThan(half.match(/x{20,}/)![0].length); // wider tile, longer name
    });
  });

  describe('pulse chart', () => {
    const bars = (svg: string) => Array.from(parse(svg).getElementsByTagName('rect')).filter((r) => r.getAttribute('class') === 'bar');

    it('draws one bar per calendar week', () => {
      const weeks = 52;
      expect(bars(svgOf(profile, config())).length).toBeGreaterThanOrEqual(weeks);
      expect(bars(svgOf(profile, config())).length).toBeLessThanOrEqual(54);
    });

    it('scales bars to the busiest week and keeps them inside the chart', () => {
      const heights = bars(svgOf(profile, config())).map((b) => Number(b.getAttribute('height')));
      expect(Math.max(...heights)).toBeCloseTo(70, 1);
      expect(Math.min(...heights)).toBeGreaterThanOrEqual(2);
    });

    it('states the real totals, streaks and busiest month', () => {
      const svg = svgOf(profile, config());
      expect(svg).toContain(`${profile.contributions!.total.toLocaleString('en-US')} contributions`);
      expect(svg).toContain('current streak');
      expect(svg).toContain('longest streak');
      expect(svg).toContain('busiest month');
    });

    it('is omitted without data or when switched off', () => {
      const { contributions: _c, ...none } = profile;
      expect(svgOf(none, config())).not.toContain('PULSE');
      expect(svgOf(profile, config({ blocks: ['stats', 'projects'] }))).not.toContain('PULSE');
    });
  });

  it('shows the languages on one quiet line, and never overflows the card', () => {
    const svg = svgOf({ ...profile, languages: Array.from({ length: 5 }, (_v, i) => ({ name: `Language${i}`, percent: 20 })) }, config());
    expect(svg).toContain('WRITTEN IN');
    for (const m of svg.matchAll(/<text x="([\d.]+)" y="[\d.]+" font-size="13"[^>]*>(Language\d 20%)</g)) {
      expect(Number(m[1]) + m[2]!.length * 7).toBeLessThan(900);
    }
  });

  it('uses a fixed layout, whatever order the blocks are listed in', () => {
    const a = svgOf(profile, config({ blocks: ['stats', 'activity', 'languages', 'projects'] }));
    const b = svgOf(profile, config({ blocks: ['projects', 'languages', 'activity', 'stats'] }));
    expect(a.indexOf('PROJECTS')).toBeLessThan(a.indexOf('PULSE'));
    expect(b.indexOf('PROJECTS')).toBeLessThan(b.indexOf('PULSE'));
    expect(heightOf(a)).toBe(heightOf(b));
  });

  it('grows as sections are added', () => {
    expect(heightOf(svgOf(profile, config({ blocks: [] })))).toBeLessThan(heightOf(svgOf(profile, config({ blocks: ['stats'] }))));
    expect(heightOf(svgOf(profile, config({ blocks: ['stats'] })))).toBeLessThan(heightOf(svgOf(profile, config())));
  });

  it('shows the portrait when it is safe, and an initial otherwise', () => {
    expect(parse(svgOf(profile, config())).getElementsByTagName('image')).toHaveLength(1);
    const bad = { ...profile, avatar: { ...profile.avatar!, dataUri: 'https://evil.example/x.png' } };
    expect(parse(svgOf(bad, config())).getElementsByTagName('image')).toHaveLength(0);
    expect(svgOf(bad, config())).toContain('>O<');
    expect(svgOf(bad, config())).not.toContain('evil.example');
  });

  it('never calls the user a maintainer or claims a role they did not write', () => {
    const svg = svgOf({ ...profile, bio: null }, config());
    for (const text of ['Maintainer', 'maintainer', 'Core team', 'Founder', 'Open to work']) expect(svg).not.toContain(text);
  });

  it('names the top projects in the alt text only when they are shown', () => {
    expect(renderProfile(profile, config()).readme).toContain('top projects alpha, beta, gamma, delta');
    expect(renderProfile(profile, config({ blocks: ['stats'] })).readme).not.toContain('top projects');
  });

  it('has distinct dark and light versions, and animates only when asked', () => {
    expect(svgOf(profile, config(), 'dark')).toContain('#0b1220');
    expect(svgOf(profile, config(), 'light')).toContain('#f4f7fc');
    expect(svgOf(profile, config())).toContain('@keyframes');
    expect(svgOf(profile, config())).toContain('prefers-reduced-motion');
    expect(svgOf(profile, config({ motion: false }))).not.toContain('@keyframes');
  });

  it('uses the picture’s colour for its accent, and a standard blue without one', () => {
    const { avatar: _a, ...bare } = profile;
    expect(svgOf(profile, config())).not.toBe(svgOf(bare, config()));
    expect(svgOf(bare, config())).toContain('#58a6ff');
  });
});
