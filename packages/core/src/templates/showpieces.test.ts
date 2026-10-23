import { DOMParser } from '@xmldom/xmldom';
import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../config';
import { buildContributions } from '../contributions';
import { renderProfile } from '../render';
import type { Config, ContributionDay, Profile } from '../types';
import { fitSize } from './showpieces';

const days: ContributionDay[] = Array.from({ length: 90 }, (_v, i) => ({
  date: new Date(Date.UTC(2026, 2, 1 + i)).toISOString().slice(0, 10),
  count: i % 5,
  level: (i % 5 === 0 ? 0 : 2) as 0 | 2,
}));

/** A small picture with a clear shape, so the ASCII portrait has something to draw. */
const grid = { width: 8, height: 8, luma: Array.from({ length: 64 }, (_v, i) => (i % 8 < 4 ? 30 : 220)), alpha: Array(64).fill(255) as number[], tint: [60, 120, 220] as [number, number, number] };

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
  languages: [{ name: 'TypeScript', percent: 60 }, { name: 'Go', percent: 30 }, { name: 'Shell', percent: 10 }],
  topRepos: [],
  avatar: { dataUri: 'data:image/png;base64,AAAA', grid },
  contributions: buildContributions(days),
  fetchedAt: '2026-06-10T08:00:00Z',
};

const config = (id: string, over: Partial<Config> = {}): Config => ({ ...defaultConfig('octo', id), ...over });
const svg = (p: Profile, id: string, over: Partial<Config> = {}) =>
  renderProfile(p, config(id, over)).assets.find((a) => a.path.endsWith(`${id}-dark.svg`))!.content;
const doc = (s: string) => new DOMParser().parseFromString(s, 'image/svg+xml');
const texts = (s: string) => Array.from(doc(s).getElementsByTagName('text')).map((t) => t.textContent ?? '');

describe('fitSize', () => {
  it('shrinks long text to fit, and never goes outside the limits', () => {
    expect(fitSize('Hi', 400, 60)).toBe(60);
    expect(fitSize('A name that is rather long indeed', 400, 60, 20)).toBeLessThan(60);
    expect(fitSize('x'.repeat(500), 400, 60, 22)).toBe(22);
    expect(fitSize('', 400, 60)).toBe(60);
  });
});

describe('cinematic', () => {
  it('fills a ring to each language’s share, up to three', () => {
    const s = svg(profile, 'cinematic');
    const rings = Array.from(doc(s).getElementsByTagName('circle')).filter((c) => (c.getAttribute('class') ?? '') === 'ring');
    expect(rings).toHaveLength(3);
    const c = 2 * Math.PI * 29;
    expect(Number(rings[0]!.getAttribute('stroke-dashoffset'))).toBeCloseTo(c * (1 - 0.6), 1);
    expect(Number(rings[2]!.getAttribute('stroke-dashoffset'))).toBeCloseTo(c * (1 - 0.1), 1);
    expect(texts(s)).toEqual(expect.arrayContaining(['60%', '30%', '10%']));
  });

  it('draws the activity line from the real weeks, and states the real total', () => {
    const s = svg(profile, 'cinematic');
    expect(s).toContain('class="draw"');
    expect(texts(s).join(' ')).toContain(`${profile.contributions!.total} contributions`);
  });

  it('leaves out each widget when its block is off', () => {
    expect(texts(svg(profile, 'cinematic', { blocks: ['stats', 'activity'] }))).not.toContain('60%');
    expect(svg(profile, 'cinematic', { blocks: ['stats', 'languages'] })).not.toContain('class="draw"');
    expect(texts(svg(profile, 'cinematic', { blocks: ['languages', 'activity'] }))).not.toContain('4,321');
  });

  it('shows its final state when it cannot animate', () => {
    const s = svg(profile, 'cinematic', { motion: false });
    expect(s).not.toContain('@keyframes');
    expect(s).toContain('stroke-dashoffset');
    expect(svg(profile, 'cinematic')).toContain('prefers-reduced-motion');
  });
});

describe('wow profile', () => {
  it('builds depth from stacked copies of the name, with the face on top', () => {
    const t = texts(svg(profile, 'wow')).filter((x) => x === 'OCTO CAT');
    expect(t.length).toBe(14 + 2); // fourteen layers, then the filled face and its outline
  });

  it('draws the ASCII portrait only when there is a picture', () => {
    const withArt = doc(svg(profile, 'wow')).getElementsByTagName('text').length;
    const { avatar: _a, ...bare } = profile;
    const without = doc(svg(bare as Profile, 'wow')).getElementsByTagName('text').length;
    expect(withArt).toBeGreaterThan(without + 5);
  });

  it('states real numbers only when the stats block is on', () => {
    expect(texts(svg(profile, 'wow'))).toContain('4,321');
    expect(texts(svg(profile, 'wow', { blocks: ['languages'] }))).not.toContain('4,321');
    expect(texts(svg(profile, 'wow', { blocks: ['stats'] })).join(' ')).not.toContain('TypeScript');
  });

  it('floats only with motion on', () => {
    expect(svg(profile, 'wow', { motion: false })).not.toContain('class="float"');
    expect(svg(profile, 'wow')).toContain('class="float"');
  });
});

describe('signature profile', () => {
  it('writes the name in a handwriting font, with a fallback that still slants', () => {
    const s = svg(profile, 'signature');
    expect(s).toContain('Segoe Script');
    expect(s).toContain('cursive');
    expect(s).toContain('font-style="italic"');
  });

  it('reveals the name by wiping, and draws the flourish, only with motion', () => {
    expect(svg(profile, 'signature')).toContain('class="wipe"');
    expect(svg(profile, 'signature', { motion: false })).not.toContain('@keyframes');
  });

  it('shows each panel only with its block and data', () => {
    expect(texts(svg(profile, 'signature')).join(' ')).toContain('ACTIVITY');
    expect(texts(svg(profile, 'signature', { blocks: ['stats'] })).join(' ')).not.toContain('ACTIVITY');
    expect(texts(svg({ ...profile, contributions: undefined }, 'signature')).join(' ')).not.toContain('ACTIVITY');
    expect(texts(svg(profile, 'signature', { blocks: ['activity'] })).join(' ')).not.toContain('4,321');
  });
});

describe('signature cap tip', () => {
  const line = (p: Profile, over: Partial<Config> = {}) => texts(svg(p, 'captip', over)).find((t) => /^(Thank|Thanks)/.test(t));

  it('thanks the reader for exactly the stars and followers there are', () => {
    expect(line(profile)).toBe('Thank you for 777 stars and 4,321 followers');
  });

  it('uses the singular for one, and leaves out a zero', () => {
    expect(line({ ...profile, totalStars: 1, followers: 1 })).toBe('Thank you for 1 star and 1 follower');
    expect(line({ ...profile, totalStars: 0 })).toBe('Thank you for 4,321 followers');
    expect(line({ ...profile, followers: 0 })).toBe('Thank you for 777 stars');
  });

  it('claims nothing when there is nothing to thank for, or the stats are hidden', () => {
    expect(line({ ...profile, totalStars: 0, followers: 0 })).toBe('Thanks for stopping by');
    expect(line(profile, { blocks: [] })).toBe('Thanks for stopping by');
  });

  it('never calls the hat a graduation, or the person a graduate', () => {
    const all = texts(svg(profile, 'captip')).join(' ');
    expect(all).not.toMatch(/graduat|degree|alumni|class of/i);
  });

  it('tips the cap only with motion on', () => {
    expect(svg(profile, 'captip')).toContain('@keyframes tip');
    expect(svg(profile, 'captip', { motion: false })).not.toContain('@keyframes');
  });

  it('shows the real languages as chips, only with that block', () => {
    expect(texts(svg(profile, 'captip'))).toEqual(expect.arrayContaining(['TypeScript', 'Go', 'Shell']));
    expect(texts(svg(profile, 'captip', { blocks: ['stats'] }))).not.toContain('TypeScript');
  });
});
