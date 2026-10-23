import { DOMParser } from '@xmldom/xmldom';
import { describe, expect, it } from 'vitest';
import { defaultConfig } from './config';
import { renderProfile } from './render';
import { metroLines, ranksByStars, spineHeight, squarify, symbolOf, type Box } from './templates/dataart';
import type { BlockId, Profile, RepoSummary } from './types';

const repo = (name: string, stars: number, language: string | null = 'Go', description: string | null = 'A thing'): RepoSummary => ({ name, description, stars, forks: 0, language, url: 'u' });

const profile: Profile = {
  login: 'octo',
  name: 'Octo Cat',
  avatarUrl: 'https://avatars.example/octo',
  bio: 'Makes things',
  company: null,
  location: null,
  website: null,
  url: 'https://github.com/octo',
  followers: 1234,
  following: 2,
  publicRepos: 23,
  totalStars: 777,
  createdAt: '2019-02-03T00:00:00Z',
  languages: [{ name: 'Go', percent: 60 }, { name: 'Rust', percent: 30 }, { name: 'Zig', percent: 10 }],
  topRepos: [repo('alpha', 500), repo('beta', 200, 'Rust'), repo('gamma', 50, 'Go'), repo('delta', 0, null), repo('epsilon', 9, 'Go'), repo('zeta', 3, 'Go')],
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

const overlap = (a: Box, b: Box): number => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));

describe('squarify', () => {
  const box: Box = { x: 36, y: 76, w: 828, h: 290 };
  const cases: number[][] = [[1], [5, 3], [500, 200, 50, 1, 10, 4], [1, 1, 1, 1, 1, 1], [1000, 1, 1, 1, 1], [3, 3, 2, 2, 2, 1]];

  it.each(cases)('gives every value its own share of the area: %j', (...values) => {
    const boxes = squarify(values, box);
    const total = values.reduce((a, b) => a + b, 0);
    boxes.forEach((b, i) => expect(b.w * b.h).toBeCloseTo((values[i]! / total) * box.w * box.h, 3));
  });

  it.each(cases)('keeps every tile inside the box and never lets two overlap: %j', (...values) => {
    const boxes = squarify(values, box);
    for (const b of boxes) {
      expect(b.x).toBeGreaterThanOrEqual(box.x - 1e-6);
      expect(b.y).toBeGreaterThanOrEqual(box.y - 1e-6);
      expect(b.x + b.w).toBeLessThanOrEqual(box.x + box.w + 1e-6);
      expect(b.y + b.h).toBeLessThanOrEqual(box.y + box.h + 1e-6);
    }
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) expect(overlap(boxes[i]!, boxes[j]!)).toBeLessThan(1e-3);
  });

  it('returns the tiles in the order the values were given', () => {
    const boxes = squarify([1, 100, 10], box);
    expect(boxes[1]!.w * boxes[1]!.h).toBeGreaterThan(boxes[2]!.w * boxes[2]!.h);
    expect(boxes[2]!.w * boxes[2]!.h).toBeGreaterThan(boxes[0]!.w * boxes[0]!.h);
  });

  it('copes with nothing, with all zeros and with a zero among real values', () => {
    expect(squarify([], box)).toEqual([]);
    expect(squarify([0, 0], box).every((b) => b.w === 0 || b.h === 0)).toBe(true);
    const mixed = squarify([10, 0, 5], box);
    expect(mixed[1]!.w * mixed[1]!.h).toBeCloseTo(0, 6);
    expect(mixed[0]!.w * mixed[0]!.h + mixed[2]!.w * mixed[2]!.h).toBeCloseTo(box.w * box.h, 3);
  });

  it('keeps tiles reasonably square', () => {
    const boxes = squarify([6, 6, 4, 3, 2, 2, 1], box);
    for (const b of boxes) expect(Math.max(b.w / b.h, b.h / b.w)).toBeLessThan(6);
  });
});

describe('symbolOf and ranksByStars', () => {
  it('builds a symbol from the first two letters', () => {
    expect(symbolOf('oopsie')).toBe('Oo');
    expect(symbolOf('tiny-queue')).toBe('Ti');
    expect(symbolOf('x')).toBe('X');
    expect(symbolOf('-_-')).toBe('?');
    expect(symbolOf('3d-engine')).toBe('3d');
  });
  it('ranks by stars with 1 for the most, and keeps the original order for ties', () => {
    expect(ranksByStars([repo('a', 5), repo('b', 50), repo('c', 5)])).toEqual([2, 1, 3]);
    expect(ranksByStars([])).toEqual([]);
  });
});

describe('metro map', () => {
  it('has a line for each language and a station only for repositories written in it', () => {
    const lines = metroLines(profile);
    expect(lines.map((l) => l.language.name)).toEqual(['Go', 'Rust', 'Zig']);
    expect(lines[0]!.stations.map((r) => r.name)).toEqual(['alpha', 'gamma', 'epsilon']);
    expect(lines[1]!.stations.map((r) => r.name)).toEqual(['beta']);
    expect(lines[2]!.stations).toEqual([]);
  });
  it('never shows a repository with no language, or more than three stations on a line', () => {
    const svg = svgOf('metro');
    expect(svg).not.toContain('>delta<');
    expect(svg).not.toContain('>zeta<');
    expect(svg).toContain('>alpha<');
  });
  it('labels every line with its real share', () => {
    const svg = svgOf('metro');
    expect(svg).toContain('Go 60%');
    expect(svg).toContain('Rust 30%');
    expect(svg).toContain('Zig 10%');
  });
  it('opens no lines when languages are switched off, and says so', () => {
    expect(svgOf('metro', profile, ['stats'])).toContain('switched off');
  });
});

describe('elements', () => {
  it('numbers each repository by its rank in stars and shows its real stars', () => {
    const svg = svgOf('elements');
    expect(svg).toContain('>500<');
    expect(svg).toContain('>Al<');
    expect(svg).toContain('>1<');
  });
  it('calls a repository with no language unclassified instead of inventing one', () => {
    expect(svgOf('elements')).toContain('unclassified');
  });
});

describe('treemap', () => {
  it('draws one tile for each repository', () => {
    expect(svgOf('treemap').match(/class="tile"/g)).toHaveLength(6);
  });
  it('gives the most-starred repository the largest tile', () => {
    const svg = svgOf('treemap');
    const sizes = [...svg.matchAll(/<g class="tile"[^>]*><rect[^>]*width="([\d.]+)" height="([\d.]+)"/g)].map((m) => Number(m[1]) * Number(m[2]));
    expect(sizes[0]).toBe(Math.max(...sizes));
  });
  it('says what the area means', () => {
    expect(svgOf('treemap')).toContain('area = stars + 1');
  });
  it('draws no language bar when languages are switched off', () => {
    expect(svgOf('treemap', profile, ['projects'])).not.toContain('Go 60%');
  });
});

describe('bookshelf', () => {
  it('makes the most-starred book the tallest and keeps every height in range', () => {
    expect(spineHeight(500, 500)).toBe(205);
    expect(spineHeight(0, 500)).toBe(120);
    expect(spineHeight(5, 0)).toBe(120);
    expect(spineHeight(9999, 500)).toBe(205);
    expect(spineHeight(50, 500)).toBeLessThan(spineHeight(200, 500));
    expect(spineHeight(50, 500)).toBeGreaterThan(120);
  });
  it('really uses a log scale, as the caption says', () => {
    // 31 stars out of 999: log10(32) / log10(1000) is exactly half way, so 120 + 0.5 * 85, rounded.
    expect(spineHeight(31, 999)).toBe(163);
    // On a linear scale the same book would be about 123.
    expect(spineHeight(9, 99)).toBe(Math.round(120 + (Math.log10(10) / Math.log10(100)) * 85));
  });
  it('draws a spine for each repository and a flat book for each language', () => {
    const svg = svgOf('shelf');
    expect(svg.match(/class="book"/g)).toHaveLength(6);
    expect(svg).toContain('Go  60%');
  });
  it('says what height means', () => {
    expect(svgOf('shelf')).toContain('height = stars (log scale)');
  });
});

describe('hostile text', () => {
  const evil = '</text><script>alert(1)</script>"&';
  const hostile = {
    ...profile,
    name: evil,
    languages: [{ name: evil, percent: 100 }],
    topRepos: [{ ...profile.topRepos[0]!, name: evil, description: evil, language: evil }],
  };
  it.each(['metro', 'elements', 'treemap', 'shelf'])('%s escapes everything it is given', (id) => {
    const svg = svgOf(id, hostile);
    expect(svg).not.toContain('<script');
    expect(wellFormed(svg)).toEqual([]);
  });
});
