import { DOMParser } from '@xmldom/xmldom';
import { describe, expect, it } from 'vitest';
import { defaultConfig } from './config';
import { buildContributions } from './contributions';
import { renderProfile } from './render';
import { templates } from './templates';
import type { Config, ContributionDay, Profile } from './types';

/**
 * Plenty of real accounts have no activity at all in the past year: a new account, a quiet one, or one that does
 * its work in private. Every design has to draw for them. A design that cannot draw leaves a person with a blank
 * page, so this runs every design against calendars that have little or nothing in them.
 */

const quiet = (length: number, fill = 0): ContributionDay[] =>
  Array.from({ length }, (_v, i) => ({ date: new Date(Date.UTC(2025, 5, 11 + i)).toISOString().slice(0, 10), count: fill, level: (fill === 0 ? 0 : 1) as 0 | 1 }));

const base: Profile = {
  login: 'octo',
  name: 'Octo Cat',
  avatarUrl: 'https://avatars.example/octo',
  bio: 'Makes things',
  company: null,
  location: null,
  website: null,
  url: 'https://github.com/octo',
  followers: 10,
  following: 2,
  publicRepos: 5,
  totalStars: 7,
  createdAt: '2020-01-01T00:00:00Z',
  languages: [{ name: 'Go', percent: 100 }],
  topRepos: [{ name: 'tool', description: 'A tool', stars: 3, forks: 1, language: 'Go', url: 'https://github.com/octo/tool' }],
  fetchedAt: '2026-06-10T08:00:00Z',
};

const calendars: Array<[string, ContributionDay[]]> = [
  ['a whole year with no activity', quiet(365)],
  ['a single day with no activity', quiet(1)],
  ['a single day with activity', quiet(1, 3)],
  ['one busy day in an empty year', quiet(365).map((d, i) => (i === 200 ? { ...d, count: 9, level: 4 as const } : d))],
  ['activity only on the very first day', quiet(365).map((d, i) => (i === 0 ? { ...d, count: 2, level: 2 as const } : d))],
  ['activity only on the very last day', quiet(365).map((d, i) => (i === 364 ? { ...d, count: 2, level: 2 as const } : d))],
  ['a short calendar of a few days', quiet(4, 1)],
];

const wellFormed = (svg: string) => {
  const errors: string[] = [];
  new DOMParser({ onError: (_l, m) => errors.push(m) }).parseFromString(svg, 'image/svg+xml');
  return errors;
};

describe.each(templates.map((t) => t.id))('%s with little or no activity', (id) => {
  it.each(calendars)('draws for %s', (_name, days) => {
    const config: Config = { ...defaultConfig('octo', id), motion: true };
    const out = renderProfile({ ...base, contributions: buildContributions(days) }, config);
    for (const asset of out.assets) {
      expect(wellFormed(asset.content), asset.path).toEqual([]);
      expect(asset.content, asset.path).not.toMatch(/NaN|Infinity|undefined/);
    }
    expect(out.readme).not.toMatch(/NaN|undefined/);
  });

  it('draws with no calendar at all', () => {
    const out = renderProfile(base, defaultConfig('octo', id));
    for (const asset of out.assets) expect(wellFormed(asset.content), asset.path).toEqual([]);
  });
});

describe('what a quiet account is told', () => {
  it('claims no busiest day in the description either, and a busy account still gets one', () => {
    const alt = (days: ContributionDay[]) => renderProfile({ ...base, contributions: buildContributions(days) }, defaultConfig('octo', 'showcase')).readme;
    expect(alt(quiet(365))).toContain('0 contributions in the past year across 0 active days, one building for each active day');
    expect(alt(quiet(365))).not.toMatch(/busiest day/);
    expect(alt(quiet(365).map((d, i) => (i === 100 ? { ...d, count: 7, level: 4 as const } : d)))).toContain('busiest day 7');
  });

  it('says there were no contributions, and invents none', () => {
    const out = renderProfile({ ...base, contributions: buildContributions(quiet(365)) }, defaultConfig('octo', 'showcase'));
    const city = out.assets.find((a) => a.path.endsWith('showcase-city-dark.svg'))!.content;
    expect(city).toContain('>0<');
    expect(city).not.toContain('Busiest day: 0');
    expect(city).not.toMatch(/Busiest month/);
  });
});
