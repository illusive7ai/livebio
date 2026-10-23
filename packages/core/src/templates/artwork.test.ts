import { DOMParser } from '@xmldom/xmldom';
import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../config';
import { buildContributions } from '../contributions';
import { renderProfile } from '../render';
import type { Config, ContributionDay, Profile, RepoSummary } from '../types';
import { gridOf, zapFraction } from './arcade';

const repo = (name: string, stars: number): RepoSummary => ({ name, description: `${name} does something useful`, stars, forks: 3, language: 'Go', url: `https://github.com/octo/${name}` });

const days: ContributionDay[] = Array.from({ length: 120 }, (_v, i) => {
  const count = i % 4 === 0 ? 0 : (i % 6) + 1;
  return { date: new Date(Date.UTC(2026, 1, 1 + i)).toISOString().slice(0, 10), count, level: (count === 0 ? 0 : Math.min(4, Math.ceil(count / 2))) as 0 | 1 | 2 | 3 | 4 };
});

const profile: Profile = {
  login: 'octo',
  name: 'Octo Cat',
  avatarUrl: 'https://avatars.example/octo',
  bio: 'Makes things',
  company: null,
  location: null,
  website: null,
  url: 'https://github.com/octo',
  followers: 4321,
  following: 17,
  publicRepos: 33,
  totalStars: 777,
  createdAt: '2020-01-01T00:00:00Z',
  languages: [{ name: 'TypeScript', percent: 70 }, { name: 'Go', percent: 30 }],
  topRepos: [repo('alpha', 500), repo('beta', 40), repo('gamma', 3), repo('delta', 1)],
  contributions: buildContributions(days),
  fetchedAt: '2026-06-10T08:00:00Z',
};

const config = (id: string, over: Partial<Config> = {}): Config => ({ ...defaultConfig('octo', id), ...over });
const svg = (p: Profile, id: string, over: Partial<Config> = {}) =>
  renderProfile(p, config(id, over)).assets.find((a) => a.path.endsWith(`${id}-dark.svg`))!.content;
const doc = (s: string) => new DOMParser().parseFromString(s, 'image/svg+xml');
const texts = (s: string) => Array.from(doc(s).getElementsByTagName('text')).map((t) => t.textContent ?? '');

describe('creative portfolio', () => {
  it('draws the same art for the same login, and different art for another', () => {
    expect(svg(profile, 'creative')).toBe(svg(profile, 'creative'));
    expect(svg({ ...profile, login: 'someone-else' }, 'creative')).not.toBe(svg(profile, 'creative'));
  });

  it('frames at most three projects, in order of stars, with their exact names', () => {
    const text = texts(svg(profile, 'creative'));
    expect(text).toContain('SELECTED WORKS');
    expect(text).toContain('alpha');
    expect(text).toContain('beta');
    expect(text).toContain('gamma');
    expect(text).not.toContain('delta');
    expect(text.indexOf('alpha')).toBeLessThan(text.indexOf('beta'));
  });

  it('has no gallery without projects, or when that block is off, and is shorter then', () => {
    const height = (s: string) => Number(/height="(\d+)" viewBox/.exec(s)![1]);
    const without = svg(profile, 'creative', { blocks: ['languages'] });
    expect(texts(without)).not.toContain('SELECTED WORKS');
    expect(texts(svg({ ...profile, topRepos: [] }, 'creative'))).not.toContain('SELECTED WORKS');
    expect(height(without)).toBeLessThan(height(svg(profile, 'creative')));
  });

  it('shows languages as dabs only when asked, with real shares', () => {
    const text = texts(svg(profile, 'creative'));
    expect(text).toContain('70%');
    expect(texts(svg(profile, 'creative', { blocks: ['projects'] }))).not.toContain('70%');
  });

  it('takes its colours from the picture when it has one, and from a fallback when not', () => {
    const tinted: Profile = { ...profile, avatar: { dataUri: 'data:image/png;base64,AAAA', grid: { width: 1, height: 1, luma: [100], alpha: [255], tint: [220, 40, 40] } } };
    expect(svg(tinted, 'creative')).not.toBe(svg(profile, 'creative'));
  });

  it('drifts only with motion on, and honours reduced motion', () => {
    expect(svg(profile, 'creative', { motion: false })).not.toContain('@keyframes');
    expect(svg(profile, 'creative')).toContain('prefers-reduced-motion');
  });

  it('keeps the plate readable: the name sits on a backing shape', () => {
    const rects = Array.from(doc(svg(profile, 'creative')).getElementsByTagName('rect'));
    expect(rects.some((r) => r.getAttribute('rx') === '20' && r.getAttribute('fill-opacity') === '0.78')).toBe(true);
  });
});

describe('erased', () => {
  const { cols, cells } = gridOf(days);

  it('draws one dot for every day', () => {
    const dots = Array.from(doc(svg(profile, 'erased', { motion: false })).getElementsByTagName('circle')).filter((c) => c.getAttribute('fill-opacity') !== null);
    expect(dots).toHaveLength(days.length);
  });

  it('draws busier days as bigger dots and quiet days as pin-pricks', () => {
    const radii = (level: number) => Array.from(new Set(cells.filter((c) => c.count > 0 && c.level === level).map(() => level)));
    expect(radii(1).length + radii(4).length).toBeGreaterThan(0);
    const circles = Array.from(doc(svg(profile, 'erased', { motion: false })).getElementsByTagName('circle'));
    const r = circles.map((c) => Number(c.getAttribute('r')));
    const quiet = Math.min(...r);
    const busy = Math.max(...r);
    expect(busy).toBeGreaterThan(quiet * 3);
  });

  it('wipes each column at the moment the eraser reaches it', () => {
    const s = svg(profile, 'erased');
    const columnsWithDots = new Set(cells.map((c) => c.col));
    expect((s.match(/@keyframes er\d+/g) ?? []).length).toBe(columnsWithDots.size);
    const m = /@keyframes er3\{0%,([\d.]+)%/.exec(s)!;
    expect(Number(m[1])).toBeCloseTo(zapFraction(3, cols) * 100, 1);
    expect(s).toContain('class="er"');
  });

  it('is completely still without motion, with the name visible beneath the dots', () => {
    const s = svg(profile, 'erased', { motion: false });
    expect(s).not.toContain('@keyframes');
    expect(s).not.toContain('class="er"');
    expect(texts(s)).toContain('Octo Cat');
  });

  it('shows its facts only for the blocks that are on', () => {
    expect(texts(svg(profile, 'erased')).join(' ')).toContain('4,321 followers');
    const noStats = texts(svg(profile, 'erased', { blocks: ['activity'] })).join(' ');
    expect(noStats).not.toContain('4,321');
    expect(noStats).not.toContain('777');
  });

  it('says what it needs when there is no calendar, and draws no dots', () => {
    const none = svg({ ...profile, contributions: undefined }, 'erased');
    expect(texts(none).join(' ')).toContain('contribution dots appear here');
    expect(none).not.toMatch(/@keyframes er\d|class="er"|class="e e\d/);
    expect(Array.from(doc(none).getElementsByTagName('circle')).filter((c) => c.getAttribute('fill-opacity') !== null)).toHaveLength(0);
    const off = svg(profile, 'erased', { blocks: ['stats'] });
    expect(texts(off).join(' ')).toContain('Turn on the activity section');
  });

  it('is well-formed in both modes and variants', () => {
    for (const motion of [true, false]) {
      for (const out of renderProfile(profile, config('erased', { motion })).assets) {
        const errors: string[] = [];
        new DOMParser({ onError: (_l, m) => errors.push(m) }).parseFromString(out.content, 'image/svg+xml');
        expect(errors).toEqual([]);
      }
    }
  });
});
