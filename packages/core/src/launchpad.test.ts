import { DOMParser } from '@xmldom/xmldom';
import { describe, expect, it } from 'vitest';
import { defaultConfig } from './config';
import { buildContributions } from './contributions';
import { renderProfile } from './render';
import { pickProjects } from './templates/launchpad';
import type { Config, ContributionDay, Profile, RepoSummary } from './types';

const FETCHED = '2026-06-15T12:00:00.000Z';
const daysAgo = (n: number) => new Date(Date.parse(FETCHED) - n * 86_400_000).toISOString();

const repo = (name: string, stars: number, over: Partial<RepoSummary> = {}): RepoSummary => ({
  name,
  description: 'A product that does one thing and does it well, for people who ship.',
  stars,
  forks: 12,
  language: 'Go',
  url: `https://github.com/octo/${name}`,
  pushedAt: daysAgo(3),
  license: 'MIT',
  ...over,
});

function year(): ContributionDay[] {
  const end = Date.parse('2026-06-10T00:00:00Z');
  return Array.from({ length: 365 }, (_v, k) => {
    const i = 364 - k;
    const date = new Date(end - i * 86_400_000);
    const count = date.getUTCDay() % 6 === 0 ? 0 : (i % 7) + 1;
    return { date: date.toISOString().slice(0, 10), count, level: (count === 0 ? 0 : Math.min(4, Math.ceil(count / 2))) as 0 | 1 | 2 | 3 | 4 };
  });
}

describe('pickProjects', () => {
  it('features the most-starred project and puts the next two beside each other', () => {
    const { featured, others } = pickProjects([repo('c', 5), repo('a', 900), repo('b', 40), repo('d', 1)]);
    expect(featured?.name).toBe('a');
    expect(others.map((r) => r.name)).toEqual(['b', 'c']);
  });

  it('breaks ties by name, so the card never changes between runs', () => {
    const { featured, others } = pickProjects([repo('b', 10), repo('a', 10), repo('c', 10)]);
    expect(featured?.name).toBe('a');
    expect(others.map((r) => r.name)).toEqual(['b', 'c']);
  });

  it('copes with one project, and with none', () => {
    expect(pickProjects([repo('only', 3)])).toMatchObject({ featured: { name: 'only' }, others: [] });
    expect(pickProjects([])).toEqual({ featured: null, others: [] });
  });

  it('never changes the list it was given', () => {
    const input = [repo('b', 1), repo('a', 2)];
    pickProjects(input);
    expect(input.map((r) => r.name)).toEqual(['b', 'a']);
  });
});

const profile: Profile = {
  login: 'octo',
  name: 'Octo Cat',
  avatarUrl: 'https://avatars.example/octo',
  bio: 'Ships small tools that people use every day.',
  company: null,
  location: null,
  website: null,
  url: 'https://github.com/octo',
  followers: 900,
  following: 3,
  publicRepos: 42,
  totalStars: 5400,
  activeRepos: 7,
  fetchedAt: FETCHED,
  createdAt: '2019-03-01T00:00:00Z',
  languages: [{ name: 'Go', percent: 100 }],
  topRepos: [repo('alpha', 5000, { forks: 320 }), repo('beta', 800), repo('gamma', 90, { license: null, pushedAt: null, language: null }), repo('delta', 12)],
  avatar: { dataUri: 'data:image/png;base64,iVBORw0KGgo=', grid: { width: 1, height: 1, luma: [0], alpha: [255], tint: [200, 90, 30] } },
  contributions: buildContributions(year()),
};

const config = (over: Partial<Config> = {}): Config => ({ ...defaultConfig('octo', 'launchpad'), ...over });
const svgOf = (p: Profile, c: Config, variant: 'dark' | 'light' = 'dark') =>
  renderProfile(p, c).assets.find((a) => a.path.endsWith(`-${variant}.svg`))!.content;
const heightOf = (svg: string) => Number(/height="(\d+)" viewBox/.exec(svg)![1]);

function parse(svg: string) {
  const errors: string[] = [];
  const doc = new DOMParser({ onError: (_l, m) => errors.push(m) }).parseFromString(svg, 'image/svg+xml');
  expect(errors).toEqual([]);
  return doc;
}

describe('launchpad template', () => {
  it('opens with a big name, the headline the user wrote, and the picture', () => {
    const svg = svgOf(profile, config({ text: { headline: 'Maker of small tools' } }));
    expect(svg).toContain('Octo Cat');
    expect(svg).toContain('Maker of small tools');
    expect(parse(svg).getElementsByTagName('image')).toHaveLength(1);
  });

  it('shows the headline numbers', () => {
    const svg = svgOf(profile, config());
    for (const text of ['5,400', 'STARS EARNED', '>7<', 'PROJECTS ACTIVE, LAST 90 DAYS', '900', 'FOLLOWERS']) expect(svg).toContain(text);
  });

  it('leaves out the active-projects figure when it is unknown rather than showing a made-up zero', () => {
    const { activeRepos: _a, ...older } = profile;
    const svg = svgOf(older, config());
    expect(svg).not.toContain('PROJECTS ACTIVE');
    expect(svg).not.toContain('NaN');
  });

  describe('projects', () => {
    it('features the most-starred project with its stars, forks, licence and freshness', () => {
      const svg = svgOf(profile, config());
      for (const text of ['alpha', '★ 5,000', '320 forks', 'MIT', 'updated 3 days ago']) expect(svg).toContain(text);
    });

    it('shows the next two beside it, and no more', () => {
      const svg = svgOf(profile, config());
      expect(svg).toContain('beta');
      expect(svg).toContain('gamma');
      expect(svg).not.toContain('>delta<');
    });

    it('leaves out a licence, language or date it does not have', () => {
      const svg = svgOf({ ...profile, topRepos: [repo('plain', 5, { license: null, language: null, pushedAt: null, forks: 0 })] }, config({ blocks: ['projects'] }));
      expect(svg).not.toContain('updated');
      expect(svg).not.toContain('MIT');
      expect(svg).not.toContain('undefined');
      expect(svg).not.toContain('null');
    });

    it('lets a single project fill the width of its row', () => {
      const svg = svgOf({ ...profile, topRepos: [repo('a', 9), repo('b', 3)] }, config({ blocks: ['projects'] }));
      const second = Array.from(parse(svg).getElementsByTagName('rect')).filter((r) => r.getAttribute('height') === '92');
      expect(second).toHaveLength(1);
      expect(second[0]!.getAttribute('width')).toBe('820');
    });

    it('cuts a very long project name to fit', () => {
      const svg = svgOf({ ...profile, topRepos: [repo('x'.repeat(150), 5)] }, config({ blocks: ['projects'] }));
      expect(svg).toContain('…');
      expect(svg).not.toContain('x'.repeat(80));
    });
  });

  describe('momentum', () => {
    const bars = (svg: string) => Array.from(parse(svg).getElementsByTagName('rect')).filter((r) => r.getAttribute('width') === '22' && r.getAttribute('rx') === '4');

    it('draws the last twelve weeks, and no more', () => {
      expect(bars(svgOf(profile, config()))).toHaveLength(12);
    });

    it('draws fewer bars when there are fewer weeks of history', () => {
      const short = { ...profile, contributions: buildContributions(year().slice(-20)) };
      expect(bars(svgOf(short, config())).length).toBeLessThan(12);
    });

    it('marks the newest week, and only the newest, in a different colour', () => {
      const fills = bars(svgOf(profile, config())).map((b) => b.getAttribute('fill'));
      const newest = fills[fills.length - 1];
      expect(fills.filter((f) => f === newest)).toHaveLength(1); // nobody else shares its colour
      expect(new Set(fills.slice(0, -1)).size).toBe(1); // the eleven older weeks all match
    });

    it('scales to the busiest of the twelve weeks and keeps every bar visible', () => {
      const heights = bars(svgOf(profile, config())).map((b) => Number(b.getAttribute('height')));
      expect(Math.max(...heights)).toBeCloseTo(56, 0);
      expect(Math.min(...heights)).toBeGreaterThanOrEqual(3);
    });

    it('adds up the same twelve weeks it draws', () => {
      const days = year();
      const sum = days
        .reduce<number[]>((weeks, d, i) => {
          if (i === 0 || new Date(`${d.date}T00:00:00Z`).getUTCDay() === 0) weeks.push(0);
          weeks[weeks.length - 1]! += d.count;
          return weeks;
        }, [])
        .slice(-12)
        .reduce((a, b) => a + b, 0);
      expect(svgOf(profile, config())).toContain(`>${sum.toLocaleString('en-US')}<`);
      expect(svgOf(profile, config())).toContain('contributions in the last 12 weeks');
    });

    it('is left out without data, or when the activity section is off', () => {
      const { contributions: _c, ...bare } = profile;
      expect(svgOf(bare, config())).not.toContain('contributions in the last');
      expect(svgOf(profile, config({ blocks: ['stats', 'projects'] }))).not.toContain('contributions in the last');
    });
  });

  it('stays inside the card, whatever is shown', () => {
    for (const blocks of [undefined, [] as Config['blocks'], ['stats'] as Config['blocks']]) {
      const svg = svgOf(profile, config(blocks ? { blocks } : {}));
      const h = heightOf(svg);
      for (const r of Array.from(parse(svg).getElementsByTagName('rect'))) {
        const x = Number(r.getAttribute('x') ?? 0);
        const y = Number(r.getAttribute('y') ?? 0);
        const w = Number(r.getAttribute('width'));
        const rh = Number(r.getAttribute('height'));
        if (w >= 900) continue; // the full-card background
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x + w).toBeLessThanOrEqual(900);
        expect(y + rh).toBeLessThanOrEqual(h);
      }
    }
  });

  it('grows as sections are added', () => {
    const h = (blocks: Config['blocks']) => heightOf(svgOf(profile, config({ blocks })));
    expect(h([])).toBeLessThan(h(['stats']));
    expect(h(['stats'])).toBeLessThan(h(['stats', 'projects']));
    expect(h(['stats', 'projects'])).toBeLessThan(h(['stats', 'projects', 'activity']));
  });

  it('makes no claim about what the person does beyond what they wrote', () => {
    const svg = svgOf({ ...profile, bio: null }, config());
    for (const text of ['Founder', 'founder', 'SHIPPING', 'Hiring', 'Open to work', 'CEO']) expect(svg).not.toContain(text);
  });

  it('only embeds a safe picture, and has colours from it', () => {
    const bad = { ...profile, avatar: { ...profile.avatar!, dataUri: 'javascript:alert(1)' } };
    expect(parse(svgOf(bad, config())).getElementsByTagName('image')).toHaveLength(0);
    expect(svgOf(bad, config())).not.toContain('javascript');
    const { avatar: _a, ...plain } = profile;
    expect(svgOf(plain, config())).not.toBe(svgOf(profile, config()));
  });

  it('names the featured project in the alt text only when it is shown', () => {
    expect(renderProfile(profile, config()).readme).toContain('featuring alpha');
    expect(renderProfile(profile, config({ blocks: ['stats'] })).readme).not.toContain('featuring');
  });

  it('has distinct dark and light versions, and animates only when asked', () => {
    expect(svgOf(profile, config(), 'dark')).not.toBe(svgOf(profile, config(), 'light'));
    expect(svgOf(profile, config())).toContain('@keyframes');
    expect(svgOf(profile, config())).toContain('prefers-reduced-motion');
    expect(svgOf(profile, config({ motion: false }))).not.toContain('@keyframes');
  });
});
