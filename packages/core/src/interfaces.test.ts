import { DOMParser } from '@xmldom/xmldom';
import { describe, expect, it } from 'vitest';
import { defaultConfig } from './config';
import { buildContributions } from './contributions';
import { renderProfile } from './render';
import { dialFraction, isFresh } from './templates/interfaces';
import type { BlockId, ContributionDay, Profile } from './types';

const days = (from: string, counts: number[]): ContributionDay[] =>
  counts.map((count, i) => ({ date: new Date(Date.parse(from) + i * 86_400_000).toISOString().slice(0, 10), count, level: (count === 0 ? 0 : Math.min(4, Math.ceil(count / 3))) as 0 | 1 | 2 | 3 | 4 }));

const profile: Profile = {
  login: 'octo',
  name: 'Octo Cat',
  avatarUrl: 'https://avatars.example/octo',
  bio: 'Makes things',
  company: null,
  location: 'Lisbon',
  website: null,
  url: 'https://github.com/octo',
  followers: 1234,
  following: 2,
  publicRepos: 23,
  totalStars: 777,
  totalForks: 40,
  createdAt: '2019-02-03T00:00:00Z',
  languages: [{ name: 'Go', percent: 70 }, { name: 'Rust', percent: 30 }],
  topRepos: [
    { name: 'fresh', description: 'Pushed lately', stars: 10, forks: 1, language: 'Go', url: 'u', pushedAt: '2026-06-01T00:00:00Z' },
    { name: 'stale', description: null, stars: 5, forks: 0, language: 'Rust', url: 'u', pushedAt: '2024-01-01T00:00:00Z' },
    { name: 'undated', description: 'No push date', stars: 1, forks: 0, language: null, url: 'u' },
  ],
  fetchedAt: '2026-06-10T08:00:00Z',
  contributions: buildContributions(days('2025-06-11', [...Array.from({ length: 360 }, (_v, i) => (i % 2 === 0 ? 1 : 0)), 4, 0, 7, 0, 1])),
};

const svgOf = (id: string, p: Profile = profile, blocks?: BlockId[]): string => {
  const config = { ...defaultConfig('octo', id), motion: false, theme: 'dark' as const, ...(blocks ? { blocks } : {}) };
  return renderProfile(p, config).assets.find((a) => a.path.endsWith(`${id}-dark.svg`))!.content;
};

const wellFormed = (svg: string): string[] => {
  const errors: string[] = [];
  new DOMParser({ onError: (_l, m) => errors.push(m) }).parseFromString(svg, 'image/svg+xml');
  return errors;
};

describe('isFresh', () => {
  const repo = profile.topRepos[0]!;
  it('is true for a push inside the activity window', () => expect(isFresh(repo, profile.fetchedAt)).toBe(true));
  it('is false for an old push', () => expect(isFresh(profile.topRepos[1]!, profile.fetchedAt)).toBe(false));
  it('is false, not a guess, when either date is missing or unreadable', () => {
    expect(isFresh(profile.topRepos[2]!, profile.fetchedAt)).toBe(false);
    expect(isFresh(repo, undefined)).toBe(false);
    expect(isFresh({ ...repo, pushedAt: 'nonsense' }, profile.fetchedAt)).toBe(false);
  });
  it('is false for a push dated after the data was read', () => expect(isFresh({ ...repo, pushedAt: '2027-01-01T00:00:00Z' }, profile.fetchedAt)).toBe(false));
});

describe('dialFraction', () => {
  it('puts nothing and nonsense at the start of the dial', () => {
    for (const v of [0, -5, NaN, Infinity * 0, 0.5]) expect(dialFraction(v)).toBe(0);
  });
  it('moves one sixth of the way for each power of ten, and stops at the end', () => {
    expect(dialFraction(1)).toBe(0);
    expect(dialFraction(10)).toBeCloseTo(1 / 6, 10);
    expect(dialFraction(1000)).toBeCloseTo(0.5, 10);
    expect(dialFraction(1_000_000)).toBe(1);
    expect(dialFraction(5_000_000_000)).toBe(1);
  });
});

describe('now playing', () => {
  it('has one track for each repository, with real star counts', () => {
    const svg = svgOf('player');
    for (const name of ['fresh', 'stale', 'undated']) expect(svg).toContain(`>${name}<`);
    expect(svg).toContain('★ 10');
  });
  it('draws one equaliser bar for each of the last 26 weeks, and none without activity', () => {
    expect(svgOf('player').match(/class="eq"/g)).toHaveLength(26);
    expect(svgOf('player', { ...profile, contributions: undefined }).match(/class="eq"/g)).toBeNull();
    expect(svgOf('player', profile, ['projects']).match(/class="eq"/g)).toBeNull();
  });
  it('names a language only when the repository has one', () => {
    const svg = svgOf('player');
    expect(svg).toContain('>Go<');
    expect(svg).toContain('>Rust<');
  });
});

describe('inbox', () => {
  it('marks only the repository pushed to lately as unread', () => {
    const svg = svgOf('inbox');
    expect(svg.match(/r="4.5"/g)).toHaveLength(1);
  });
  it('shows the unread count in the sidebar, and no count when there are none', () => {
    expect(svgOf('inbox')).toMatch(/text-anchor="end" font-weight="700">1<\/text>/);
    const none = { ...profile, topRepos: profile.topRepos.map((r) => ({ ...r, pushedAt: '2020-01-01T00:00:00Z' })) };
    expect(svgOf('inbox', none).match(/r="4.5"/g)).toBeNull();
  });
  it('says how long ago from the real dates, and nothing for an undated repository', () => {
    const svg = svgOf('inbox');
    expect(svg).toContain('1 week ago');
    expect(svg).toContain('2 years ago');
    expect(svg.match(/ago</g)).toHaveLength(2);
  });
  it('says the bio is missing rather than making one up', () => {
    expect(svgOf('inbox', { ...profile, bio: null })).toContain('This profile has no bio.');
  });
});

describe('retro desktop', () => {
  it('has a folder for each repository', () => {
    const svg = svgOf('desktop');
    expect(svg.match(/fill="#f4d34a"/g)).toHaveLength(3);
  });
  it('shows the time the data was read, and no clock without it', () => {
    expect(svgOf('desktop')).toContain('08:00 UTC');
    expect(svgOf('desktop', { ...profile, fetchedAt: undefined })).not.toContain('UTC');
  });
  it('has no activity window when activity is switched off', () => {
    expect(svgOf('desktop')).toContain('Activity.exe');
    expect(svgOf('desktop', profile, ['stats', 'projects'])).not.toContain('Activity.exe');
  });
});

describe('cockpit', () => {
  it('shows the real numbers on its dials', () => {
    const svg = svgOf('cockpit');
    expect(svg).toContain('>777<');
    expect(svg).toContain('>1,234<');
    expect(svg).toContain('>23<');
  });
  it('says its scale out loud', () => {
    expect(svgOf('cockpit')).toContain('LOG SCALE');
  });
  it('swaps the contributions dial for forks when there is no calendar, and drops it with no forks either', () => {
    const noCalendar = { ...profile, contributions: undefined };
    expect(svgOf('cockpit', noCalendar)).toContain('>FORKS<');
    expect(svgOf('cockpit', { ...noCalendar, totalForks: undefined })).not.toContain('>FORKS<');
  });
  it('points the needle where the value is', () => {
    // 777 stars: log10(777) / 6 of the way along a 240 degree sweep, starting at -120.
    const expected = -120 + (Math.log10(777) / 6) * 240;
    expect(svgOf('cockpit')).toContain(`rotate(${Math.round(expected * 100) / 100}deg)`);
  });
});

describe('hostile text', () => {
  const evil = '</text><script>alert(1)</script>"&';
  const hostile = { ...profile, name: evil, location: evil, bio: evil, topRepos: [{ ...profile.topRepos[0]!, name: evil, description: evil, language: evil }] };
  it.each(['player', 'inbox', 'desktop', 'cockpit'])('%s escapes everything it is given', (id) => {
    const svg = svgOf(id, hostile);
    expect(svg).not.toContain('<script');
    expect(wellFormed(svg)).toEqual([]);
  });
});
