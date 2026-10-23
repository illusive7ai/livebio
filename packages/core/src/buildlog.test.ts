import { DOMParser } from '@xmldom/xmldom';
import { describe, expect, it } from 'vitest';
import { defaultConfig } from './config';
import { buildContributions } from './contributions';
import { renderProfile } from './render';
import { groupByMonth, shortDay } from './templates/buildlog';
import type { Config, ContributionDay, Profile, RepoSummary } from './types';

const FETCHED = '2026-06-15T12:00:00.000Z';

const repo = (name: string, pushedAt: string | null, over: Partial<RepoSummary> = {}): RepoSummary => ({
  name,
  description: 'What this does, in a sentence or two, for whoever is scrolling.',
  stars: 4,
  forks: 0,
  language: 'Go',
  url: `https://github.com/octo/${name}`,
  pushedAt,
  license: 'MIT',
  ...over,
});

describe('shortDay', () => {
  it('reads the month and day in UTC', () => {
    expect(shortDay('2026-10-22T18:00:00Z')).toBe('Oct 22');
    expect(shortDay('2026-01-01T00:00:00Z')).toBe('Jan 1');
    expect(shortDay('2026-12-31T23:59:59Z')).toBe('Dec 31');
  });

  it('returns null for a date it cannot read', () => {
    expect(shortDay('not a date')).toBeNull();
    expect(shortDay('')).toBeNull();
  });
});

describe('groupByMonth', () => {
  it('returns nothing for no repositories', () => {
    expect(groupByMonth([])).toEqual([]);
  });

  it('groups by month, newest month first and newest push first within it', () => {
    const groups = groupByMonth([
      repo('may', '2026-05-03T10:00:00Z'),
      repo('june-early', '2026-06-02T10:00:00Z'),
      repo('june-late', '2026-06-20T10:00:00Z'),
    ]);
    expect(groups.map((g) => g.label)).toEqual(['June 2026', 'May 2026']);
    expect(groups[0]!.items.map((r) => r.name)).toEqual(['june-late', 'june-early']);
  });

  it('keeps the same month of different years apart, and orders across a year boundary', () => {
    const groups = groupByMonth([
      repo('old-jan', '2025-01-10T00:00:00Z'),
      repo('new-jan', '2026-01-10T00:00:00Z'),
      repo('dec', '2025-12-31T12:00:00Z'),
    ]);
    expect(groups.map((g) => g.label)).toEqual(['January 2026', 'December 2025', 'January 2025']);
  });

  it('puts a push on the right side of midnight UTC at the end of a month', () => {
    const groups = groupByMonth([repo('late', '2026-01-31T23:30:00Z'), repo('early', '2026-02-01T00:30:00Z')]);
    expect(groups.map((g) => [g.label, g.items[0]!.name])).toEqual([
      ['February 2026', 'early'],
      ['January 2026', 'late'],
    ]);
  });

  it('leaves out repositories with no readable date, since a timeline needs one', () => {
    const groups = groupByMonth([repo('dated', '2026-06-01T00:00:00Z'), repo('none', null), repo('junk', 'sometime')]);
    expect(groups.flatMap((g) => g.items).map((r) => r.name)).toEqual(['dated']);
  });

  it('breaks ties by name so the page never changes between runs', () => {
    const groups = groupByMonth([repo('b', '2026-06-01T00:00:00Z'), repo('a', '2026-06-01T00:00:00Z')]);
    expect(groups[0]!.items.map((r) => r.name)).toEqual(['a', 'b']);
  });

  it('keeps at most six entries, and the newest ones', () => {
    const many = Array.from({ length: 10 }, (_v, i) => repo(`r${i}`, new Date(Date.UTC(2026, 0, 1 + i)).toISOString()));
    const names = groupByMonth(many).flatMap((g) => g.items).map((r) => r.name);
    expect(names).toEqual(['r9', 'r8', 'r7', 'r6', 'r5', 'r4']);
  });

  it('never changes the list it was given', () => {
    const input = [repo('a', '2026-01-01T00:00:00Z'), repo('b', '2026-06-01T00:00:00Z')];
    groupByMonth(input);
    expect(input.map((r) => r.name)).toEqual(['a', 'b']);
  });
});

function year(): ContributionDay[] {
  const end = Date.parse('2026-06-10T00:00:00Z');
  return Array.from({ length: 365 }, (_v, k) => {
    const i = 364 - k;
    const date = new Date(end - i * 86_400_000).toISOString().slice(0, 10);
    const count = i % 5 === 0 ? 0 : (i % 9) + 1;
    return { date, count, level: (count === 0 ? 0 : Math.min(4, Math.ceil(count / 3))) as 0 | 1 | 2 | 3 | 4 };
  });
}

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
  activeRepos: 5,
  fetchedAt: FETCHED,
  createdAt: '2021-03-01T00:00:00Z',
  languages: [{ name: 'Go', percent: 100 }],
  topRepos: [repo('starred-one', '2020-01-01T00:00:00Z', { stars: 9000 })],
  recentRepos: [
    repo('fresh', '2026-06-14T09:00:00Z'),
    repo('same-month', '2026-06-03T09:00:00Z', { description: null, language: null, stars: 0, license: null }),
    repo('last-month', '2026-05-20T09:00:00Z'),
    repo('older', '2026-01-05T09:00:00Z'),
  ],
  contributions: buildContributions(year()),
};

const config = (over: Partial<Config> = {}): Config => ({ ...defaultConfig('octo', 'buildlog'), ...over });
const svgOf = (p: Profile, c: Config, variant: 'dark' | 'light' = 'dark') =>
  renderProfile(p, c).assets.find((a) => a.path.endsWith(`-${variant}.svg`))!.content;
const heightOf = (svg: string) => Number(/height="(\d+)" viewBox/.exec(svg)![1]);

function parse(svg: string) {
  const errors: string[] = [];
  const doc = new DOMParser({ onError: (_l, m) => errors.push(m) }).parseFromString(svg, 'image/svg+xml');
  expect(errors).toEqual([]);
  return doc;
}

const dots = (svg: string) => Array.from(parse(svg).getElementsByTagName('circle')).filter((c) => c.getAttribute('class') === 'dot');

describe('build log template', () => {
  it('titles the page with the name, and what the page is', () => {
    const svg = svgOf(profile, config({ text: { headline: 'Building in the open' } }));
    for (const text of ['BUILD LOG', 'Octo Cat', '@octo', 'Building in the open']) expect(svg).toContain(text);
  });

  describe('timeline', () => {
    it('has one dot for every entry, newest first, grouped under month headings', () => {
      const svg = svgOf(profile, config());
      expect(dots(svg)).toHaveLength(4);
      expect(svg.indexOf('fresh')).toBeLessThan(svg.indexOf('same-month'));
      expect(svg.indexOf('same-month')).toBeLessThan(svg.indexOf('last-month'));
      expect(svg.indexOf('last-month')).toBeLessThan(svg.indexOf('older'));
      for (const month of ['JUNE 2026', 'MAY 2026', 'JANUARY 2026']) expect(svg).toContain(month);
      expect(svg.match(/JUNE 2026/g)).toHaveLength(1); // two June entries share one heading
    });

    it('shows each entry’s real date and how long ago it was', () => {
      const svg = svgOf(profile, config());
      for (const text of ['Jun 14', 'yesterday', 'Jun 3', '1 week ago', 'May 20', 'Jan 5']) expect(svg).toContain(text);
    });

    it('draws the axis from the first dot to the last, and only between them', () => {
      const svg = svgOf(profile, config());
      const ys = dots(svg).map((d) => Number(d.getAttribute('cy')));
      const axis = Array.from(parse(svg).getElementsByTagName('rect')).find((r) => r.getAttribute('class') === 'axis')!;
      expect(Number(axis.getAttribute('y'))).toBeCloseTo(Math.min(...ys), 0);
      expect(Number(axis.getAttribute('y')) + Number(axis.getAttribute('height'))).toBeCloseTo(Math.max(...ys), 0);
    });

    it('shows language, stars and licence only where they exist', () => {
      const svg = svgOf(profile, config());
      expect(svg).toContain('Go  ·  ★ 4  ·  MIT');
      const plain = svgOf({ ...profile, recentRepos: [repo('plain', '2026-06-01T00:00:00Z', { language: null, stars: 0, license: null, description: null })] }, config({ blocks: ['projects'] }));
      expect(plain).toContain('plain');
      expect(plain).not.toContain('★ 0');
      expect(plain).not.toContain('null');
      expect(plain).not.toContain('undefined');
    });

    it('wraps a long description and cuts it with an ellipsis rather than overflowing', () => {
      const long = 'word '.repeat(100);
      const svg = svgOf({ ...profile, recentRepos: [repo('long', '2026-06-01T00:00:00Z', { description: long })] }, config({ blocks: ['projects'] }));
      expect(svg).toContain('…');
      const lines = Array.from(parse(svg).getElementsByTagName('text')).filter((t) => (t.textContent ?? '').startsWith('word'));
      expect(lines).toHaveLength(2); // two lines, however long the description
      for (const line of lines) expect((line.textContent ?? '').length).toBeLessThanOrEqual(78);
    });

    it('uses recent work, never the most-starred list', () => {
      expect(svgOf(profile, config())).not.toContain('starred-one');
    });

    it('says plainly when there is nothing to list, instead of drawing an empty timeline', () => {
      for (const recentRepos of [[], undefined]) {
        const svg = svgOf({ ...profile, recentRepos }, config());
        expect(svg).toContain('Your build log appears here');
        expect(dots(svg)).toHaveLength(0);
        expect(svg).not.toContain('NaN');
      }
    });
  });

  describe('header facts', () => {
    it('shows how recent the last push was, how many projects are active and the repository count', () => {
      const svg = svgOf(profile, config());
      for (const text of ['yesterday', 'LAST PUSH', '>5<', 'ACTIVE, 90 DAYS', '42', 'REPOSITORIES']) expect(svg).toContain(text);
    });

    it('leaves out what is unknown instead of showing a made-up figure', () => {
      const { activeRepos: _a, fetchedAt: _f, ...older } = profile;
      const svg = svgOf(older, config());
      expect(svg).not.toContain('ACTIVE, 90 DAYS');
      expect(svg).not.toContain('LAST PUSH');
      expect(svg).not.toContain('NaN');
    });
  });

  describe('activity strip', () => {
    const bars = (svg: string) => Array.from(parse(svg).getElementsByTagName('rect')).filter((r) => r.getAttribute('rx') === '2' && Number(r.getAttribute('height')) <= 38);

    it('draws the last twenty-six weeks, with the newest highlighted', () => {
      const all = bars(svgOf(profile, config()));
      expect(all).toHaveLength(26);
      const fills = all.map((b) => b.getAttribute('fill'));
      expect(fills.filter((f) => f === fills[fills.length - 1])).toHaveLength(1);
    });

    it('is left out without data, or when the activity section is off', () => {
      const { contributions: _c, ...bare } = profile;
      expect(svgOf(bare, config())).not.toContain('contributions in the last');
      expect(svgOf(profile, config({ blocks: ['stats', 'projects'] }))).not.toContain('contributions in the last');
    });
  });

  it('stays inside the card whatever is shown', () => {
    for (const blocks of [undefined, [] as Config['blocks'], ['projects'] as Config['blocks']]) {
      const svg = svgOf(profile, config(blocks ? { blocks } : {}));
      const h = heightOf(svg);
      for (const r of Array.from(parse(svg).getElementsByTagName('rect'))) {
        const w = Number(r.getAttribute('width'));
        if (w >= 899) continue;
        expect(Number(r.getAttribute('x') ?? 0) + w).toBeLessThanOrEqual(900);
        expect(Number(r.getAttribute('y') ?? 0) + Number(r.getAttribute('height'))).toBeLessThanOrEqual(h);
      }
      for (const d of dots(svg)) expect(Number(d.getAttribute('cy'))).toBeLessThan(h);
    }
  });

  it('grows with the number of entries', () => {
    const h = (n: number) => heightOf(svgOf({ ...profile, recentRepos: profile.recentRepos!.slice(0, n) }, config()));
    expect(h(1)).toBeLessThan(h(2));
    expect(h(2)).toBeLessThan(h(4));
  });

  it('names the entries in the alt text only when the timeline is shown', () => {
    expect(renderProfile(profile, config()).readme).toContain('a timeline of recent work: fresh, same-month, last-month, older');
    expect(renderProfile(profile, config({ blocks: ['stats'] })).readme).not.toContain('timeline');
    expect(renderProfile({ ...profile, recentRepos: [] }, config()).readme).not.toContain('timeline');
  });

  it('has distinct dark and light versions, and animates only when asked', () => {
    expect(svgOf(profile, config(), 'dark')).not.toBe(svgOf(profile, config(), 'light'));
    expect(svgOf(profile, config())).toContain('@keyframes');
    expect(svgOf(profile, config())).toContain('prefers-reduced-motion');
    expect(svgOf(profile, config({ motion: false }))).not.toContain('@keyframes');
  });
});
