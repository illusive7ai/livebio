import { DOMParser } from '@xmldom/xmldom';
import { describe, expect, it } from 'vitest';
import { defaultConfig } from './config';
import { renderProfile } from './render';
import { getTemplate } from './templates';
import type { Avatar, Config, Profile } from './types';

function avatar(tint?: [number, number, number], dataUri = 'data:image/png;base64,iVBORw0KGgo='): Avatar {
  return { dataUri, grid: { width: 2, height: 2, luma: [0, 0, 0, 0], alpha: [255, 255, 255, 255], tint } };
}

const profile: Profile = {
  login: 'octo',
  name: 'Octo Cat',
  avatarUrl: 'https://avatars.example/octo',
  bio: 'Builds tools for developers and writes about the small details that make them pleasant to use.',
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
    { name: 'tool', description: 'A tool that does one thing well', stars: 12, forks: 1, language: 'Go', url: 'u' },
    { name: 'lib', description: null, stars: 5, forks: 0, language: null, url: 'u' },
  ],
  avatar: avatar([200, 30, 30]),
};

const config = (over: Partial<Config> = {}): Config => ({ ...defaultConfig('octo', 'showcase'), ...over });
const svgOf = (p: Profile, c: Config, variant: 'dark' | 'light' = 'dark') =>
  renderProfile(p, c).assets.find((a) => a.path.endsWith(`-${variant}.svg`))!.content;

function parse(svg: string) {
  const errors: string[] = [];
  const doc = new DOMParser({ onError: (_l, m) => errors.push(m) }).parseFromString(svg, 'image/svg+xml');
  expect(errors).toEqual([]);
  return doc;
}

describe('showcase template', () => {
  it('embeds the profile picture as an image', () => {
    const doc = parse(svgOf(profile, config()));
    const images = Array.from(doc.getElementsByTagName('image'));
    expect(images).toHaveLength(1);
    expect(images[0]!.getAttribute('href')).toBe('data:image/png;base64,iVBORw0KGgo=');
  });

  it('declares that it needs the profile picture', () => {
    expect(getTemplate('showcase')?.needsAvatar).toBe(true);
  });

  it('takes its colours from the picture', () => {
    const red = svgOf(profile, config());
    const blue = svgOf({ ...profile, avatar: avatar([30, 30, 200]) }, config());
    expect(red).not.toBe(blue);
    const plain = svgOf({ ...profile, avatar: avatar(undefined) }, config());
    expect(plain).toContain('#3fb950'); // the fallback palette
  });

  it('shows an initial instead of an image when there is no picture', () => {
    const { avatar: _a, ...bare } = profile;
    const doc = parse(svgOf(bare, config()));
    expect(doc.getElementsByTagName('image')).toHaveLength(0);
    expect(svgOf(bare, config())).toContain('>O<');
  });

  it.each([
    ['a script URL', 'javascript:alert(1)'],
    ['an SVG image', 'data:image/svg+xml;base64,PHN2Zz4='],
    ['a quote that breaks out of the attribute', 'data:image/png;base64,AAAA" onload="alert(1)'],
    ['an external address', 'https://evil.example/pic.png'],
  ])('refuses %s as a picture', (_label, uri) => {
    const svg = svgOf({ ...profile, avatar: avatar([200, 30, 30], uri) }, config());
    const doc = parse(svg);
    expect(doc.getElementsByTagName('image')).toHaveLength(0);
    expect(svg).not.toContain('evil.example');
    expect(svg).not.toContain('onload');
  });

  it('draws one language segment per language and one card per project', () => {
    const svg = svgOf(profile, config());
    expect(svg).toContain('TypeScript 60%');
    expect(svg).toContain('Rust 10%');
    expect(svg).toContain('>tool<');
    expect(svg).toContain('>lib<');
    expect(svg).toContain('A tool that does one thing well');
  });

  it('shows only the details GitHub has, as chips', () => {
    const svg = svgOf(profile, config());
    for (const text of ['Acme', 'Lagos', 'octo.dev', 'Joined Jan 2023']) expect(svg).toContain(text);
    const sparse = svgOf({ ...profile, company: null, location: null, website: null }, config());
    expect(sparse).not.toContain('Acme');
    expect(sparse).toContain('Joined Jan 2023');
  });

  it('does not repeat the login as a handle when it is already the name', () => {
    const visible = (p: Profile) => svgOf(p, config()).match(/>@octo</g);
    expect(visible({ ...profile, name: null })).toBeNull();
    expect(visible(profile)).toHaveLength(1);
  });

  it('gets taller as sections are added', () => {
    const height = (blocks: Config['blocks']) =>
      Number(/height="(\d+)" viewBox/.exec(svgOf(profile, config({ blocks })))![1]);
    expect(height([])).toBeLessThan(height(['stats']));
    expect(height(['stats'])).toBeLessThan(height(['stats', 'languages', 'projects']));
  });

  it('animates only when asked, and honours reduced motion', () => {
    expect(svgOf(profile, config())).toContain('@keyframes');
    expect(svgOf(profile, config())).toContain('prefers-reduced-motion');
    expect(svgOf(profile, config({ motion: false }))).not.toContain('@keyframes');
  });

  it('has a light version that differs from the dark one', () => {
    expect(svgOf(profile, config(), 'light')).not.toBe(svgOf(profile, config(), 'dark'));
  });
});
