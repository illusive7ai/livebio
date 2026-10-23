import { DOMParser } from '@xmldom/xmldom';
import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../config';
import { buildContributions } from '../contributions';
import { renderProfile } from '../render';
import type { Config, ContributionDay, Profile, RepoSummary } from '../types';
import { breakName, hubSections, longDate } from './editorial';

const repo = (name: string, stars: number, over: Partial<RepoSummary> = {}): RepoSummary => ({
  name,
  description: `${name} does something`,
  stars,
  forks: 2,
  language: 'Go',
  url: `https://github.com/octo/${name}`,
  ...over,
});

const days: ContributionDay[] = Array.from({ length: 80 }, (_v, i) => ({
  date: new Date(Date.UTC(2026, 3, 1 + i)).toISOString().slice(0, 10),
  count: i % 3,
  level: (i % 3 === 0 ? 0 : 2) as 0 | 2,
}));

const profile: Profile = {
  login: 'octo',
  name: 'Octo Cat',
  avatarUrl: 'https://avatars.example/octo',
  bio: 'Makes things',
  company: null,
  location: null,
  website: 'octo.dev',
  url: 'https://github.com/octo',
  followers: 4321,
  following: 17,
  publicRepos: 33,
  totalStars: 777,
  totalForks: 88,
  createdAt: '2020-01-01T00:00:00Z',
  languages: [{ name: 'TypeScript', percent: 70 }, { name: 'Go', percent: 30 }],
  topRepos: [repo('big-project', 500), repo('small-one', 12)],
  contributions: buildContributions(days),
  fetchedAt: '2026-06-10T08:00:00Z',
};

const config = (template: string, over: Partial<Config> = {}): Config => ({ ...defaultConfig('octo', template), ...over });
const out = (p: Profile, id: string, over: Partial<Config> = {}) => renderProfile(p, config(id, over));
const svg = (p: Profile, id: string, over: Partial<Config> = {}) => out(p, id, over).assets.find((a) => a.path.endsWith(`${id}-dark.svg`))!.content;
const texts = (s: string) => Array.from(new DOMParser().parseFromString(s, 'image/svg+xml').getElementsByTagName('text')).map((t) => t.textContent ?? '');

describe('longDate', () => {
  it('writes the date out in full, in UTC', () => {
    expect(longDate('2026-06-10T08:00:00Z')).toBe('Wednesday, 10 June 2026');
    expect(longDate('2026-01-01T23:59:59Z')).toBe('Thursday, 1 January 2026');
  });

  it('never makes up a date', () => {
    expect(longDate(undefined)).toBeNull();
    expect(longDate(null)).toBeNull();
    expect(longDate('')).toBeNull();
    expect(longDate('not a date')).toBeNull();
  });
});

describe('breakName', () => {
  it('keeps the name exactly as written, only choosing where to wrap', () => {
    for (const name of ['WI-FI-Brute-Forcer-Key-Combinator-', 'a_b_c_d_e_f', 'plain', 'x-y']) {
      expect(breakName(name, 12, 9).join('')).toBe(name);
    }
  });

  it('wraps after a hyphen and respects the width and line limit', () => {
    const lines = breakName('WI-FI-Brute-Forcer-Key-Combinator-', 20, 3);
    expect(lines).toEqual(['WI-FI-Brute-Forcer-', 'Key-Combinator-']);
    for (const l of breakName('a-very-long-project-name-that-keeps-going-and-going-and-going', 12, 2)) expect(l.length).toBeLessThanOrEqual(12);
    expect(breakName('a-very-long-project-name-that-keeps-going-and-going-and-going', 12, 2)).toHaveLength(2);
  });

  it('cuts a single unbreakable word with an ellipsis', () => {
    expect(breakName('abcdefghijklmnopqrstuvwxyz', 10, 3)[0]).toBe('abcdefghi…');
  });
});

describe('front page', () => {
  it('names the paper after the login and dates it from the data, not the clock', () => {
    const text = texts(svg(profile, 'frontpage'));
    expect(text).toContain('THE OCTO GAZETTE');
    expect(text).toContain('Wednesday, 10 June 2026');
    expect(text).toContain('Established 2020');
    const undated = texts(svg({ ...profile, fetchedAt: undefined }, 'frontpage'));
    expect(undated.join(' ')).not.toMatch(/\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/);
  });

  it('leads with the most starred project, keeping its name exact', () => {
    const text = texts(svg(profile, 'frontpage'));
    expect(text).toContain('LEAD STORY');
    expect(text).toContain('big-project');
    expect(text).toContain('★ 500 stars  ·  2 forks  ·  Go');
  });

  it('has no lead story without projects, or when that block is off', () => {
    expect(texts(svg({ ...profile, topRepos: [] }, 'frontpage')).join(' ')).not.toContain('LEAD STORY');
    expect(texts(svg(profile, 'frontpage', { blocks: ['stats'] })).join(' ')).not.toContain('LEAD STORY');
  });

  it('prints the real numbers in the table', () => {
    const text = texts(svg(profile, 'frontpage'));
    for (const value of ['33', '777', '4,321', '17', '88']) expect(text).toContain(value);
  });

  it('shows the year in brief only with activity data and the block on', () => {
    expect(texts(svg(profile, 'frontpage')).join(' ')).toContain('THE YEAR IN BRIEF');
    expect(texts(svg({ ...profile, contributions: undefined }, 'frontpage')).join(' ')).not.toContain('THE YEAR IN BRIEF');
    expect(texts(svg(profile, 'frontpage', { blocks: ['stats'] })).join(' ')).not.toContain('THE YEAR IN BRIEF');
  });

  it('prints on paper in both modes', () => {
    expect(svg(profile, 'frontpage')).not.toBe(out(profile, 'frontpage').assets.find((a) => a.path.endsWith('frontpage-light.svg'))!.content);
  });
});

describe('everything hub', () => {
  const readme = (p: Profile, over: Partial<Config> = {}) => out(p, 'hub', over).readme;

  it('folds each section, opening only the first', () => {
    const r = readme(profile);
    expect((r.match(/<details/g) ?? []).length).toBe(4);
    expect((r.match(/<details open>/g) ?? []).length).toBe(1);
    for (const title of ['Numbers', 'Languages', 'Projects', 'Activity']) expect(r).toContain(`<summary><b>${title}</b></summary>`);
  });

  it('puts a blank line after each summary, so the Markdown inside is rendered', () => {
    for (const m of readme(profile).matchAll(/<\/summary>\n(.)/g)) expect(m[1]).toBe('\n');
  });

  it('states real figures in each section', () => {
    const r = readme(profile);
    expect(r).toContain('| Followers | 4,321 |');
    expect(r).toContain('| Forks | 88 |');
    expect(r).toContain('On GitHub since | 2020');
    expect(r).toContain('| TypeScript | ██████████████ 70% |');
    expect(r).toContain('| [big\\-project](<https://github.com/octo/big-project>) | 500 | 2 |');
    expect(r).toContain('Current streak: **');
  });

  it('leaves out any section whose block is off or whose data is missing', () => {
    expect(hubSections(profile, config('hub', { blocks: [] }))).toEqual([]);
    expect(hubSections({ ...profile, languages: [] }, config('hub')).join('')).not.toContain('Languages');
    expect(hubSections({ ...profile, topRepos: [] }, config('hub')).join('')).not.toContain('Projects');
    expect(hubSections({ ...profile, contributions: undefined }, config('hub')).join('')).not.toContain('Activity');
    expect(hubSections(profile, config('hub', { blocks: ['languages'] }))).toHaveLength(1);
  });

  it('only states a fork total GitHub gave us', () => {
    const { totalForks: _f, ...without } = profile;
    expect(readme(without as Profile)).not.toContain('| Forks | 88 |');
    expect(readme(without as Profile)).not.toMatch(/\| Forks \| \d/);
  });

  it('cannot be broken out of a table by repository text', () => {
    const hostile = { ...profile, topRepos: [repo('evil|name', 1, { description: 'line one\nline two | still the same cell <script>x</script>' })] };
    const r = readme(hostile);
    const row = r.split('\n').find((l) => l.includes('evil'))!;
    expect(row.split(/(?<!\\)\|/).length).toBe(6); // empty edge cells plus four columns
    expect(r).not.toContain('<script>');
    expect(row).not.toContain('\n');
  });

  it('does not link to a repository with an unsafe address', () => {
    const r = readme({ ...profile, topRepos: [repo('x', 1, { url: 'javascript:alert(1)' })] });
    expect(r).not.toContain('javascript:');
  });

  it('keeps the banner free of the numbers, which live in the sections', () => {
    expect(svg(profile, 'hub')).not.toContain('4,321');
  });
});
