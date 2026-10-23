import { DOMParser } from '@xmldom/xmldom';
import { describe, expect, it } from 'vitest';
import { defaultConfig } from './config';
import { renderProfile } from './render';
import type { Config, PixelGrid, Profile } from './types';

const size = 64;
const grid: PixelGrid = {
  width: size,
  height: size,
  luma: Array.from({ length: size * size }, (_v, i) => ((i % size) / size) * 255),
  alpha: Array(size * size).fill(255),
};

const profile: Profile = {
  login: 'octo',
  name: 'Octo Cat',
  avatarUrl: 'https://avatars.example/octo',
  bio: 'Builds tools for developers and writes about the small details that make them pleasant to use every day.',
  company: 'Acme',
  location: 'Lagos',
  website: 'https://octo.dev/',
  url: 'https://github.com/octo',
  followers: 1154,
  following: 20,
  publicRepos: 51,
  totalStars: 330,
  createdAt: '2023-01-15T00:00:00Z',
  languages: [
    { name: 'TypeScript', percent: 60 },
    { name: 'Go', percent: 30 },
    { name: 'Rust', percent: 10 },
  ],
  topRepos: [
    { name: 'tool', description: null, stars: 12, forks: 1, language: 'Go', url: 'https://github.com/octo/tool' },
    { name: 'lib', description: null, stars: 5, forks: 0, language: 'Go', url: 'https://github.com/octo/lib' },
  ],
  avatar: { dataUri: 'data:image/png;base64,AAAA', grid },
};

const config = (over: Partial<Config> = {}): Config => ({ ...defaultConfig('octo', 'neofetch'), ...over });

function svgOf(p: Profile, c: Config, variant: 'dark' | 'light' = 'dark'): string {
  return renderProfile(p, c).assets.find((a) => a.path.endsWith(`-${variant}.svg`))!.content;
}

function parse(svg: string) {
  const errors: string[] = [];
  const doc = new DOMParser({ onError: (_l, m) => errors.push(m) }).parseFromString(svg, 'image/svg+xml');
  expect(errors).toEqual([]);
  return doc;
}

describe('neofetch template', () => {
  it('draws the portrait as text rows beside the details', () => {
    const doc = parse(svgOf(profile, config({ motion: false })));
    const rows = Array.from(doc.getElementsByTagName('text')).filter((t) => t.getAttribute('class') === 'art');
    expect(rows.length).toBeGreaterThan(15);
  });

  it('lists the details GitHub has and the stats the user chose', () => {
    const svg = svgOf(profile, config());
    for (const text of ['Octo Cat', 'Acme', 'Lagos', 'octo.dev', 'Jan 2023', '1,154', 'TypeScript, Go, Rust', 'tool']) {
      expect(svg).toContain(text);
    }
  });

  it('shows the headline the user typed as the role', () => {
    expect(svgOf(profile, config({ text: { headline: 'Maintainer' } }))).toContain('Maintainer');
  });

  it('wraps a bio over several lines under one About label', () => {
    const svg = svgOf(profile, config());
    expect(svg.match(/About/g)).toHaveLength(1);
    expect(svg).toContain('Builds tools for developers and writes about');
    expect(svg).toContain('every day.');
  });

  it('cuts a very long bio with an ellipsis instead of running off the card', () => {
    const svg = svgOf({ ...profile, bio: 'word '.repeat(80) }, config());
    expect(svg).toContain('…');
  });

  it('renders cleanly without a profile picture, and says nothing about a portrait', () => {
    const { avatar: _avatar, ...bare } = profile;
    const out = renderProfile(bare, config());
    const doc = parse(out.assets[0]!.content);
    expect(Array.from(doc.getElementsByTagName('text')).some((t) => t.getAttribute('class') === 'art')).toBe(false);
    expect(out.readme).not.toContain('ASCII');
  });

  it('describes the portrait in the alt text only when there is one', () => {
    expect(renderProfile(profile, config()).readme).toContain('with an ASCII portrait of the profile picture');
  });

  it('declares that it needs the profile picture', async () => {
    const { getTemplate } = await import('./templates');
    expect(getTemplate('neofetch')?.needsAvatar).toBe(true);
  });

  it('differs between light and dark, and animates only when asked', () => {
    expect(svgOf(profile, config(), 'dark')).not.toBe(svgOf(profile, config(), 'light'));
    expect(svgOf(profile, config())).toContain('@keyframes');
    expect(svgOf(profile, config({ motion: false }))).not.toContain('@keyframes');
  });

  it('puts every row in an element that appears only when animation starts', () => {
    const svg = svgOf(profile, config());
    expect(svg).toContain('class="ln"');
    expect(svg).toContain('prefers-reduced-motion');
  });
});
