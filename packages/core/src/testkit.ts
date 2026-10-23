import { DOMParser } from '@xmldom/xmldom';
import { defaultConfig } from './config';
import { buildContributions } from './contributions';
import { renderProfile } from './render';
import type { BlockId, ContributionDay, Profile, RepoSummary } from './types';

/** Shared parts for the tests of the single-picture designs. This file holds no tests itself. */

export const repo = (name: string, stars: number, language: string | null = 'Go', description: string | null = 'A thing', pushedAt?: string): RepoSummary => ({
  name,
  description,
  stars,
  forks: 0,
  language,
  url: 'u',
  ...(pushedAt ? { pushedAt } : {}),
});

/** A year of days that ends on 2026-06-10, counts given oldest first, padded with zeros at the start. */
export function year(counts: number[]): ContributionDay[] {
  const pad = Array.from({ length: Math.max(0, 365 - counts.length) }, () => 0);
  const all = [...pad, ...counts];
  const end = Date.UTC(2026, 5, 10);
  return all.map((count, i) => ({
    date: new Date(end - (all.length - 1 - i) * 86_400_000).toISOString().slice(0, 10),
    count,
    level: (count === 0 ? 0 : Math.min(4, Math.ceil(count / 3))) as 0 | 1 | 2 | 3 | 4,
  }));
}

export const profile: Profile = {
  login: 'octo',
  name: 'Octo Cat',
  avatarUrl: 'https://avatars.example/octo',
  bio: 'Makes things',
  company: null,
  location: 'Lisbon',
  website: null,
  url: 'https://github.com/octo',
  followers: 1234,
  following: 48,
  publicRepos: 23,
  totalStars: 777,
  totalForks: 40,
  createdAt: '2019-02-03T00:00:00Z',
  languages: [{ name: 'Go', percent: 60 }, { name: 'Rust', percent: 30 }, { name: 'Zig', percent: 10 }],
  topRepos: [
    repo('alpha', 500, 'Go', 'The first one', '2026-06-01T00:00:00Z'),
    repo('beta', 200, 'Rust', null, '2024-01-01T00:00:00Z'),
    repo('gamma', 50, 'Go', 'Third', '2026-05-20T00:00:00Z'),
    repo('delta', 7, null, 'No language'),
    repo('epsilon', 1, 'Zig', 'Tiny', '2026-06-09T00:00:00Z'),
  ],
  fetchedAt: '2026-06-10T08:00:00Z',
  contributions: buildContributions(year([...Array.from({ length: 300 }, (_v, i) => (i % 4 === 0 ? 2 : 0)), 4, 0, 7, 0, 1, 0, 0, 3, 5, 2])),
};

/** The picture a design draws, in dark mode with no motion, for the profile given. */
export function svgOf(id: string, p: Profile = profile, blocks?: BlockId[], variant: 'dark' | 'light' = 'dark'): string {
  const config = { ...defaultConfig('octo', id), motion: false, theme: variant, ...(blocks ? { blocks } : {}) };
  return renderProfile(p, config).assets.find((a) => a.path.endsWith(`${id}-${variant}.svg`))!.content;
}

export const wellFormed = (svg: string): string[] => {
  const errors: string[] = [];
  new DOMParser({ onError: (_l, m) => errors.push(m) }).parseFromString(svg, 'image/svg+xml');
  return errors;
};

export const EVIL = '</text><script>alert(1)</script>"&';

/** A profile whose every piece of text tries to break out of the picture. */
export const hostile: Profile = {
  ...profile,
  name: EVIL,
  location: EVIL,
  bio: EVIL,
  languages: [{ name: EVIL, percent: 100 }],
  topRepos: [{ ...profile.topRepos[0]!, name: EVIL, description: EVIL, language: EVIL }],
};

/** A profile with almost nothing in it, as a brand new account has. */
export const bare: Profile = {
  login: 'new',
  name: null,
  avatarUrl: 'x',
  bio: null,
  company: null,
  location: null,
  website: null,
  url: 'https://github.com/new',
  followers: 0,
  following: 0,
  publicRepos: 0,
  totalStars: 0,
  createdAt: 'nonsense',
  languages: [],
  topRepos: [],
};
