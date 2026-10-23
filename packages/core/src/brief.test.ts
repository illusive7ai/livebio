import { DOMParser } from '@xmldom/xmldom';
import { describe, expect, it } from 'vitest';
import { defaultConfig } from './config';
import { renderProfile } from './render';
import type { Config, Profile } from './types';

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
    { name: 'tool', description: 'A tool that does one thing well and nothing else', stars: 12, forks: 1, language: 'Go', url: 'u' },
    { name: 'lib', description: null, stars: 5, forks: 0, language: null, url: 'u' },
  ],
  avatar: {
    dataUri: 'data:image/png;base64,iVBORw0KGgo=',
    grid: { width: 1, height: 1, luma: [0], alpha: [255], tint: [30, 90, 200] },
  },
};

const config = (over: Partial<Config> = {}): Config => ({ ...defaultConfig('octo', 'brief'), ...over });
const svgOf = (p: Profile, c: Config, variant: 'dark' | 'light' = 'light') =>
  renderProfile(p, c).assets.find((a) => a.path.endsWith(`-${variant}.svg`))!.content;
const heightOf = (svg: string) => Number(/height="(\d+)" viewBox/.exec(svg)![1]);

function parse(svg: string) {
  const errors: string[] = [];
  const doc = new DOMParser({ onError: (_l, m) => errors.push(m) }).parseFromString(svg, 'image/svg+xml');
  expect(errors).toEqual([]);
  return doc;
}

describe('recruiter brief template', () => {
  it('shows who the person is, their proof of work and their stack', () => {
    const svg = svgOf(profile, config({ text: { headline: 'Platform engineer' } }));
    for (const text of ['Octo Cat', 'Platform engineer', 'Acme', 'Lagos', 'octo.dev', 'SELECTED WORK', 'STACK', 'tool', 'TypeScript', '60%']) {
      expect(svg).toContain(text);
    }
  });

  it('sets its headings in a serif font that the base text rule cannot override', () => {
    const svg = svgOf(profile, config());
    expect(svg).toMatch(/\.serif\{font-family:Georgia/);
    expect(svg.match(/class="serif"/g)!.length).toBeGreaterThanOrEqual(4); // name and three or more numbers
  });

  it('shows the at-a-glance numbers, including the year they joined', () => {
    const svg = svgOf(profile, config());
    for (const text of ['51', '330', '1,154', '2023', 'MEMBER SINCE']) expect(svg).toContain(text);
  });

  it('never states a role the user did not write', () => {
    const svg = svgOf(profile, config());
    for (const text of ['engineer', 'developer', 'Open to work', 'Hiring', 'Available']) {
      expect(svg.replace(/Builds tools for developers/, '')).not.toContain(text);
    }
  });

  it('shows the portrait when there is one, and leaves it out otherwise', () => {
    const withPhoto = parse(svgOf(profile, config()));
    expect(withPhoto.getElementsByTagName('image')).toHaveLength(1);
    const { avatar: _a, ...bare } = profile;
    expect(parse(svgOf(bare, config())).getElementsByTagName('image')).toHaveLength(0);
  });

  it.each([
    ['a script URL', 'javascript:alert(1)'],
    ['an external address', 'https://evil.example/x.png'],
    ['an attribute break-out', 'data:image/png;base64,AAAA" onload="alert(1)'],
  ])('refuses %s as the portrait', (_label, uri) => {
    const svg = svgOf({ ...profile, avatar: { ...profile.avatar!, dataUri: uri } }, config());
    expect(parse(svg).getElementsByTagName('image')).toHaveLength(0);
    expect(svg).not.toContain('evil.example');
    expect(svg).not.toContain('onload');
  });

  it('uses the picture’s colour for its accent, and a standard blue without one', () => {
    const tinted = svgOf(profile, config());
    const { avatar: _a, ...bare } = profile;
    const plain = svgOf(bare, config());
    expect(tinted).not.toBe(plain);
    expect(plain).toContain('#0969da');
  });

  it('lays out two columns, or one when a section is off', () => {
    const both = svgOf(profile, config());
    expect(both).toMatch(/SELECTED WORK/);
    expect(both).toMatch(/STACK/);
    const workOnly = svgOf(profile, config({ blocks: ['projects'] }));
    expect(workOnly).toContain('SELECTED WORK');
    expect(workOnly).not.toContain('STACK');
    const stackOnly = svgOf(profile, config({ blocks: ['languages'] }));
    expect(stackOnly).toContain('STACK');
    expect(stackOnly).not.toContain('SELECTED WORK');
  });

  it('omits the join year when the date is unreadable instead of printing nonsense', () => {
    const svg = svgOf({ ...profile, createdAt: 'not a date' }, config());
    expect(svg).not.toContain('NaN');
    expect(svg).not.toContain('MEMBER SINCE');
  });

  it('wraps a long bio and cuts a very long one at a word', () => {
    const svg = svgOf({ ...profile, bio: 'word '.repeat(120) }, config());
    expect(svg).toContain('…');
    expect(svg).not.toMatch(/wor…/);
  });

  it('grows with its content', () => {
    expect(heightOf(svgOf(profile, config({ blocks: [] })))).toBeLessThan(heightOf(svgOf(profile, config())));
  });

  it('is calm: animates only when asked and honours reduced motion', () => {
    expect(svgOf(profile, config())).toContain('@keyframes');
    expect(svgOf(profile, config())).toContain('prefers-reduced-motion');
    expect(svgOf(profile, config({ motion: false }))).not.toContain('@keyframes');
  });

  it('has distinct light and dark versions', () => {
    expect(svgOf(profile, config(), 'light')).not.toBe(svgOf(profile, config(), 'dark'));
    expect(svgOf(profile, config(), 'light')).toContain('#fbfaf6');
    expect(svgOf(profile, config(), 'dark')).toContain('#14161a');
  });
});
