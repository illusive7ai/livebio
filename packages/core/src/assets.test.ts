import { describe, expect, it } from 'vitest';
import { defaultConfig } from './config';
import { buildContributions } from './contributions';
import { renderProfile } from './render';
import { templates } from './templates';
import type { BlockId, Config, ContributionDay, Profile, ThemeMode } from './types';

/**
 * A README only points at its pictures; the pictures are separate files. If a README ever named a file the
 * generator did not also produce, a person who uploaded the generated files would see broken images.
 */

const days: ContributionDay[] = Array.from({ length: 120 }, (_v, i) => ({
  date: new Date(Date.UTC(2026, 1, 1 + i)).toISOString().slice(0, 10),
  count: i % 4,
  level: (i % 4 === 0 ? 0 : 2) as 0 | 2,
}));

const profile: Profile = {
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
  contributions: buildContributions(days),
  fetchedAt: '2026-06-10T08:00:00Z',
};

/** Every file path the README refers to as an image source. */
function referenced(readme: string): string[] {
  return [...readme.matchAll(/(?:src|srcset)="([^"]+)"/g)].map((m) => m[1]!);
}

const themes: ThemeMode[] = ['auto', 'dark', 'light'];
const blockSets: BlockId[][] = [['stats', 'activity', 'languages', 'projects', 'city', 'game'], ['stats'], ['city'], ['game'], []];

describe.each(templates.map((t) => t.id))('%s: the README and its image files agree', (id) => {
  const cases: Array<[string, Partial<Config>]> = [];
  for (const theme of themes) for (const blocks of blockSets) for (const credit of [true, false]) cases.push([`${theme}, ${blocks.length} blocks, credit ${credit}`, { theme, blocks, credit }]);

  it.each(cases)('%s', (_name, over) => {
    const config: Config = { ...defaultConfig('octo', id), ...over };
    const out = renderProfile(profile, config);
    const files = new Set(out.assets.map((a) => a.path));
    const named = referenced(out.readme);

    // Every picture the README shows is a file that was generated.
    for (const path of named) expect(files.has(path), `${path} is in the README but was not generated`).toBe(true);
    // And no generated picture is left out of the README, which would be wasted work and clutter.
    for (const path of files) expect(named.includes(path), `${path} was generated but is not in the README`).toBe(true);
    // All of them sit in the folder the workflow commits.
    for (const path of files) expect(path.startsWith('livebio/')).toBe(true);
  });
});

describe('the credit picture', () => {
  it('is in the README and the files exactly when the credit is on', () => {
    for (const credit of [true, false]) {
      const out = renderProfile(profile, { ...defaultConfig('octo', 'showcase'), credit });
      expect(referenced(out.readme).some((p) => p.includes('credit-'))).toBe(credit);
      expect(out.assets.some((a) => a.path.includes('credit-'))).toBe(credit);
    }
  });
});
