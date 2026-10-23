import { DOMParser } from '@xmldom/xmldom';
import { describe, expect, it } from 'vitest';
import { buildContributions } from './contributions';
import { defaultConfig } from './config';
import { renderProfile } from './render';
import type { Config, ContributionDay, Profile } from './types';

/** A year of days ending on a Wednesday, busy on weekdays, with a quiet fortnight in the middle. */
function year(): ContributionDay[] {
  const end = Date.parse('2026-06-10T00:00:00Z'); // a Wednesday
  const days: ContributionDay[] = [];
  for (let i = 364; i >= 0; i--) {
    const date = new Date(end - i * 86_400_000);
    const weekday = date.getUTCDay();
    const quiet = i > 150 && i < 165;
    const count = quiet || weekday === 0 || weekday === 6 ? 0 : (i % 5) + 1;
    days.push({ date: date.toISOString().slice(0, 10), count, level: count === 0 ? 0 : (Math.min(4, Math.ceil(count / 2)) as 1 | 2 | 3 | 4) });
  }
  return days;
}

const contributions = buildContributions(year());

const base: Profile = {
  login: 'octo',
  name: 'Octo Cat',
  avatarUrl: 'https://avatars.example/octo',
  bio: null,
  company: null,
  location: null,
  website: null,
  url: 'https://github.com/octo',
  followers: 10,
  following: 2,
  publicRepos: 5,
  totalStars: 7,
  createdAt: '2023-01-15T00:00:00Z',
  languages: [{ name: 'Go', percent: 100 }],
  topRepos: [],
};
const withActivity: Profile = { ...base, contributions };

const config = (template: string, over: Partial<Config> = {}): Config => ({ ...defaultConfig('octo', template), ...over });
const svgOf = (p: Profile, c: Config) => renderProfile(p, c).assets.find((a) => a.path.endsWith('-dark.svg'))!.content;
const readmeOf = (p: Profile, c: Config) => renderProfile(p, c).readme;

function parse(svg: string) {
  const errors: string[] = [];
  const doc = new DOMParser({ onError: (_l, m) => errors.push(m) }).parseFromString(svg, 'image/svg+xml');
  expect(errors).toEqual([]);
  return doc;
}

describe('the activity section', () => {
  describe('showcase heatmap', () => {
    const doc = () => parse(svgOf(withActivity, config('showcase')));
    const cells = () => Array.from(doc().getElementsByTagName('rect')).filter((r) => r.getAttribute('width') === '12' && r.getAttribute('height') === '12');

    it('draws one square for every day', () => {
      expect(cells()).toHaveLength(contributions.days.length);
    });

    it('lays squares in seven rows and in week columns that start on Sunday', () => {
      const rows = new Set(cells().map((c) => c.getAttribute('y')));
      expect(rows.size).toBe(7);
      const columns = new Set(cells().map((c) => c.getAttribute('x')));
      const firstWeekday = new Date(`${contributions.days[0]!.date}T00:00:00Z`).getUTCDay();
      expect(columns.size).toBe(Math.ceil((firstWeekday + contributions.days.length) / 7));
    });

    it('puts the first day on the row of its weekday', () => {
      const [first] = cells();
      const top = Math.min(...cells().map((c) => Number(c.getAttribute('y'))));
      const weekday = new Date(`${contributions.days[0]!.date}T00:00:00Z`).getUTCDay();
      expect(Number(first!.getAttribute('y'))).toBe(top + weekday * 15);
    });

    it('shows quiet days plainly and busier days more strongly', () => {
      const opacities = cells().map((c) => c.getAttribute('fill-opacity'));
      expect(opacities.filter((o) => o === null).length).toBe(contributions.days.filter((d) => d.level === 0).length);
      expect(new Set(opacities.filter(Boolean)).size).toBeGreaterThan(1);
    });

    it('stays inside the card', () => {
      for (const c of cells()) expect(Number(c.getAttribute('x')) + 12).toBeLessThanOrEqual(900 - 36);
    });

    it('states the real totals and streaks', () => {
      const svg = svgOf(withActivity, config('showcase'));
      expect(svg).toContain('ACTIVITY');
      expect(svg).toContain('contributions in the past year');
      expect(svg).toContain(contributions.total.toLocaleString('en-US'));
      expect(svg).toContain(`${contributions.longestStreak} days`);
    });

    it('is omitted without data, or when the user switches it off', () => {
      expect(svgOf(base, config('showcase'))).not.toContain('ACTIVITY');
      expect(svgOf(withActivity, config('showcase', { blocks: ['stats', 'languages'] }))).not.toContain('ACTIVITY');
    });

    it('makes the card taller when it is shown', () => {
      const height = (p: Profile) => Number(/height="(\d+)" viewBox/.exec(svgOf(p, config('showcase')))![1]);
      expect(height(withActivity)).toBeGreaterThan(height(base));
    });
  });

  describe('terminal and neofetch', () => {
    it('terminal prints the streak lines', () => {
      const svg = svgOf(withActivity, config('terminal'));
      expect(svg).toContain('streak');
      expect(svg).toContain('past year');
      expect(svg).toContain(`${contributions.longestStreak} days`);
    });

    it('neofetch lists the streak and the past year', () => {
      const svg = svgOf(withActivity, config('neofetch'));
      expect(svg).toContain('Streak');
      expect(svg).toContain('Past year');
      expect(svg).toContain(`best ${contributions.longestStreak}`);
    });

    it.each(['terminal', 'neofetch', 'showcase'])('%s shows no activity without data', (template) => {
      const svg = svgOf(base, config(template));
      expect(svg).not.toContain('Past year');
      expect(svg).not.toContain('contributions in the past year');
      expect(svg).not.toContain('streak');
    });

    it.each(['terminal', 'neofetch'])('%s respects the block being off', (template) => {
      expect(svgOf(withActivity, config(template, { blocks: ['stats'] }))).not.toContain('Past year');
    });
  });

  describe('terminal project lines', () => {
    const repo = (name: string, stars: number) => ({ name, description: null, stars, forks: 0, language: null, url: 'u' });

    it('keeps a space between a large star count and the project name', () => {
      const profile = { ...base, topRepos: [repo('linux', 253_256), repo('tiny', 4)] };
      const svg = svgOf(profile, config('terminal', { blocks: ['projects'] }));
      expect(svg).toMatch(/★ 253,256 {2,}linux/);
      expect(svg).toMatch(/★ 4 {2,}tiny/);
    });

    it('starts every project name in the same column', () => {
      const profile = { ...base, topRepos: [repo('linux', 253_256), repo('tiny', 4), repo('mid', 12_345)] };
      const svg = svgOf(profile, config('terminal', { blocks: ['projects'] }));
      const widths = [...svg.matchAll(/★ ([\d,]+)( +)(linux|tiny|mid)/g)].map((m) => `★ ${m[1]}${m[2]}`.length);
      expect(widths).toHaveLength(3);
      expect(new Set(widths).size).toBe(1);
    });
  });

  describe('alt text', () => {
    it('mentions activity only for templates that draw it, and only when it is shown', () => {
      for (const template of ['showcase', 'terminal', 'neofetch']) {
        expect(readmeOf(withActivity, config(template))).toContain('contributions in the past year');
        expect(readmeOf(withActivity, config(template, { blocks: ['stats'] }))).not.toContain('contributions in the past year');
        expect(readmeOf(base, config(template))).not.toContain('contributions in the past year');
      }
    });

    it('does not claim activity for a template that does not draw it', () => {
      expect(readmeOf(withActivity, config('brief'))).not.toContain('contributions in the past year');
      expect(svgOf(withActivity, config('brief'))).not.toContain('ACTIVITY');
    });
  });
});
