import { DOMParser } from '@xmldom/xmldom';
import { describe, expect, it } from 'vitest';
import { defaultConfig } from './config';
import { renderProfile } from './render';
import { tiltOf } from './templates/scrapbook';
import type { BlockId, Profile, RepoSummary } from './types';

const repo = (name: string, stars: number, language: string | null = 'Go', description: string | null = 'A thing'): RepoSummary => ({ name, description, stars, forks: 0, language, url: 'u' });

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
  createdAt: '2019-02-03T00:00:00Z',
  languages: [{ name: 'Go', percent: 60 }, { name: 'Rust', percent: 30 }, { name: 'Zig', percent: 10 }],
  topRepos: [repo('alpha', 500), repo('beta', 200, 'Rust', null), repo('gamma', 50), repo('delta', 7), repo('epsilon', 1)],
  fetchedAt: '2026-06-10T08:00:00Z',
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

describe('tiltOf', () => {
  it('is the same every time for the same seed, and stays within its spread', () => {
    expect(tiltOf('octo:1', 4)).toBe(tiltOf('octo:1', 4));
    for (let i = 0; i < 200; i++) expect(Math.abs(tiltOf(`seed:${i}`, 4))).toBeLessThanOrEqual(4 * 0.9 + 1e-9);
  });
  it('gives different seeds different tilts', () => {
    const tilts = new Set(Array.from({ length: 40 }, (_v, i) => tiltOf(`octo:${i}`, 4)));
    expect(tilts.size).toBeGreaterThan(4);
  });
});

describe('trading card', () => {
  it('takes HP from the real follower count and damage from the real stars', () => {
    const svg = svgOf('card');
    expect(svg).toContain('HP 1,234');
    expect(svg).toContain('>500<');
    expect(svg).toContain('>200<');
    expect(svg).toContain('>50<');
  });
  it('has exactly three attacks, never a fourth', () => {
    const svg = svgOf('card');
    expect(svg).toContain('>gamma<');
    expect(svg).not.toContain('>delta<');
  });
  it('leaves out HP when stats are switched off, and the attacks when projects are', () => {
    expect(svgOf('card', profile, ['projects'])).not.toContain('HP ');
    expect(svgOf('card', profile, ['stats'])).toContain('Attacks are switched off.');
  });
  it('writes no flavour text, and no type line it cannot back up, without a bio or dates', () => {
    const bare = { ...profile, bio: null, createdAt: 'nonsense', languages: [] };
    const svg = svgOf('card', bare);
    expect(svg).not.toContain('font-style="italic">Makes');
    expect(svg).not.toContain('since ');
    expect(svg).not.toContain(' type');
    expect(wellFormed(svg)).toEqual([]);
  });
  it('gives a repository with no description no description line', () => {
    const svg = svgOf('card');
    expect(svg.match(/A thing/g)).toHaveLength(2);
    // The small grey line under an attack's name is the only text at this size: two repositories have one, "beta" has none.
    expect(svg.match(/font-size="10.5"/g)).toHaveLength(2);
  });
});

describe('polaroid wall', () => {
  it('has the person and three repositories, pinned', () => {
    const svg = svgOf('polaroids');
    expect(svg.match(/class="pol"/g)).toHaveLength(6); // four polaroids, a note and an index card
    for (const name of ['alpha', 'beta', 'gamma']) expect(svg).toContain(`>${name}<`);
    expect(svg).not.toContain('>delta<');
  });
  it('shows the real stars, real languages and real numbers', () => {
    const svg = svgOf('polaroids');
    expect(svg).toContain('★ 500');
    expect(svg).toContain('Rust  30%');
    expect(svg).toContain('>1,234<');
  });
  it('says nothing is written, rather than inventing a bio', () => {
    expect(svgOf('polaroids', { ...profile, bio: null })).toContain('(nothing written here yet)');
  });
  it('is identical on every run, specks included', () => {
    expect(svgOf('polaroids')).toBe(svgOf('polaroids'));
  });
  it('drops the index card with stats off and the tape with languages off', () => {
    expect(svgOf('polaroids', profile, ['projects', 'languages']).match(/class="pol"/g)).toHaveLength(5);
    expect(svgOf('polaroids')).toContain('Zig  10%');
    expect(svgOf('polaroids', profile, ['projects', 'stats'])).not.toContain('Zig  10%');
  });
});

describe('comic strip', () => {
  it('shows the real stars in the burst and the real followers under it', () => {
    const svg = svgOf('comic');
    expect(svg).toContain('>777<');
    expect(svg).toContain('1,234 followers');
  });
  it('puts only real languages and at most four of them in the tools panel', () => {
    const svg = svgOf('comic');
    expect(svg).toContain('>Go<');
    expect(svg).toContain('>10%<');
    const many = { ...profile, languages: ['A', 'B', 'C', 'D', 'E', 'F'].map((name) => ({ name, percent: 10 })) };
    expect(svgOf('comic', many)).not.toContain('>E<');
  });
  it('lists three repositories, and no description for one without', () => {
    const svg = svgOf('comic');
    expect(svg).toContain('>beta<');
    expect(svg).not.toContain('>delta<');
    expect(svg.match(/A thing/g)).toHaveLength(2);
  });
  it('has no speech bubble without a bio', () => {
    expect(svgOf('comic')).toContain('a14 14 0 0 1 14 14');
    const bare = svgOf('comic', { ...profile, bio: null });
    expect(bare).not.toContain('a14 14 0 0 1 14 14');
    expect(bare).not.toContain('Makes things');
  });
  it('says the numbers are switched off when stats are off', () => {
    expect(svgOf('comic', profile, ['projects'])).toContain('The numbers are switched off.');
  });
});

describe('hostile text', () => {
  const evil = '</text><script>alert(1)</script>"&';
  const hostile = { ...profile, name: evil, location: evil, bio: evil, languages: [{ name: evil, percent: 100 }], topRepos: [{ ...profile.topRepos[0]!, name: evil, description: evil, language: evil }] };
  it.each(['card', 'polaroids', 'comic'])('%s escapes everything it is given', (id) => {
    const svg = svgOf(id, hostile);
    expect(svg).not.toContain('<script');
    expect(wellFormed(svg)).toEqual([]);
  });
});
