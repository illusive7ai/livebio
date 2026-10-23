import { DOMParser } from '@xmldom/xmldom';
import { describe, expect, it } from 'vitest';
import { defaultConfig } from './config';
import { CREDIT_TEXT, creditSvg } from './credit';
import { renderProfile } from './render';
import { AUTHOR, REPO_URL, MARKER_END, creditFooter, insertBlocks, wrapReadme } from './readme';
import type { Config, Profile } from './types';

const profile: Profile = {
  login: 'octo',
  name: 'Octo Cat',
  avatarUrl: 'https://avatars.example/octo',
  bio: null,
  company: null,
  location: null,
  website: null,
  url: 'https://github.com/octo',
  followers: 1,
  following: 1,
  publicRepos: 1,
  totalStars: 1,
  createdAt: '2020-01-01T00:00:00Z',
  languages: [],
  topRepos: [],
};
const config = (over: Partial<Config> = {}): Config => ({ ...defaultConfig('octo', 'minimal'), ...over });
const letters = CREDIT_TEXT.replace(/ /g, '');

function parse(svg: string) {
  const errors: string[] = [];
  const doc = new DOMParser({ onError: (_l, m) => errors.push(m) }).parseFromString(svg, 'image/svg+xml');
  expect(errors).toEqual([]);
  return doc;
}

describe('the credit image', () => {
  it('says "livebio by illusivehacks"', () => {
    expect(CREDIT_TEXT).toBe(`livebio by ${AUTHOR}`);
    expect(parse(creditSvg('dark', true)).getElementsByTagName('title')[0]!.textContent).toBe('livebio by illusivehacks');
  });

  it('is well-formed in both colours, with and without motion', () => {
    for (const variant of ['dark', 'light'] as const) for (const motion of [true, false]) parse(creditSvg(variant, motion));
  });

  it('draws every letter in three layers, red, cyan and the letter itself, in the right order', () => {
    const texts = Array.from(parse(creditSvg('dark', false)).getElementsByTagName('text'));
    expect(texts).toHaveLength(letters.length * 3);
    const white = texts.filter((t) => t.getAttribute('class') === 'w').map((t) => t.textContent).join('');
    expect(white).toBe(letters);
    // The letter itself is painted last, over its coloured fringes.
    const groups = Array.from(parse(creditSvg('dark', false)).getElementsByTagName('g'));
    expect(groups).toHaveLength(letters.length);
    for (const g of groups) expect(Array.from(g.getElementsByTagName('text')).map((t) => t.getAttribute('class'))).toEqual(['r', 'b', 'w']);
  });

  it('adds a stand-in glyph for each letter only when it moves', () => {
    const moving = Array.from(parse(creditSvg('dark', true)).getElementsByTagName('text'));
    expect(moving).toHaveLength(letters.length * 4);
    const stand = moving.filter((t) => t.getAttribute('class') === 'a');
    expect(stand).toHaveLength(letters.length);
    for (const s of stand) expect(s.textContent).toHaveLength(1);
  });

  it('gives each letter its own timing, so the glitch ripples', () => {
    const delays = [...creditSvg('dark', true).matchAll(/--d:([\d.]+)s/g)].map((m) => m[1]);
    expect(delays).toHaveLength(letters.length);
    expect(new Set(delays).size).toBeGreaterThan(letters.length / 2);
    for (const d of delays) expect(Number(d)).toBeLessThan(2.4);
  });

  it('applies that timing to every layer of a letter, so the layers glitch together', () => {
    const svg = creditSvg('dark', true);
    expect(svg).toContain('animation-delay:var(--d)');
    // The delay sits on the letter's group, which all four layers are inside.
    const groups = Array.from(parse(svg).getElementsByTagName('g'));
    for (const g of groups) {
      expect(g.getAttribute('style')).toMatch(/^--d:[\d.]+s$/);
      expect(g.getElementsByTagName('text')).toHaveLength(4);
    }
  });

  it('is completely still without motion, and honours reduced motion with it', () => {
    expect(creditSvg('dark', false)).not.toContain('@keyframes');
    expect(creditSvg('dark', false)).not.toContain('animation');
    const moving = creditSvg('dark', true);
    expect(moving).toContain('@keyframes');
    expect(moving).toContain('prefers-reduced-motion');
  });

  it('looks the same every time it is drawn, and differently in light and dark', () => {
    expect(creditSvg('dark', true)).toBe(creditSvg('dark', true));
    expect(creditSvg('dark', true)).not.toBe(creditSvg('light', true));
  });

  it('keeps stand-in glyphs from becoming markup', () => {
    const doc = parse(creditSvg('dark', true));
    expect(doc.getElementsByTagName('script')).toHaveLength(0);
  });

  it('keeps most of the time quiet: letters glitch in a short burst of each cycle', () => {
    const w = /@keyframes w\{0%,(\d+)%\{opacity:1\}(\d+)%,(\d+)%\{opacity:0\}(\d+)%,100%\{opacity:1\}/.exec(creditSvg('dark', true))!;
    const quiet = Number(w[1]) + (100 - Number(w[4]));
    expect(quiet).toBeGreaterThan(80);
  });
});

describe('the credit line in a README', () => {
  it('is the image, linked to the project, with the words as its alt text', () => {
    const footer = creditFooter('auto');
    expect(footer).toContain(`<a href="${REPO_URL}">`);
    expect(footer).toContain('srcset="livebio/credit-dark.svg"');
    expect(footer).toContain('src="livebio/credit-light.svg"');
    expect(footer).toContain('alt="livebio by illusivehacks"');
  });

  it('uses a single image for a fixed theme', () => {
    expect(creditFooter('dark')).toContain('src="livebio/credit-dark.svg"');
    expect(creditFooter('dark')).not.toContain('<picture>');
  });

  it('no longer says "Made with"', () => {
    expect(wrapReadme('body', config())).not.toContain('Made with');
  });

  it('is on by default and gone when switched off', () => {
    expect(renderProfile(profile, config()).readme).toContain('credit-');
    expect(renderProfile(profile, config({ credit: false })).readme).not.toContain('credit-');
  });

  it('keeps the credit at the very end, after blocks added later', () => {
    const base = wrapReadme('body', config());
    const out = insertBlocks(base, ['EXTRA'], 'auto');
    expect(out.indexOf('EXTRA')).toBeLessThan(out.indexOf('credit-dark'));
    expect(out.indexOf('credit-dark')).toBeLessThan(out.indexOf(MARKER_END));
  });
});

describe('the credit files', () => {
  const credit = (c: Config) => renderProfile(profile, c).assets.filter((a) => a.path.includes('credit-'));

  it('are written for each colour the theme needs', () => {
    expect(credit(config()).map((a) => a.path)).toEqual(['livebio/credit-dark.svg', 'livebio/credit-light.svg']);
    expect(credit(config({ theme: 'dark' })).map((a) => a.path)).toEqual(['livebio/credit-dark.svg']);
    expect(credit(config({ theme: 'light' })).map((a) => a.path)).toEqual(['livebio/credit-light.svg']);
  });

  it('are not written when the credit is off', () => {
    expect(credit(config({ credit: false }))).toEqual([]);
  });

  it('follow the motion setting', () => {
    expect(credit(config({ motion: false }))[0]!.content).not.toContain('@keyframes');
    expect(credit(config({ motion: true }))[0]!.content).toContain('@keyframes');
  });

  it('are written for every design', () => {
    for (const id of ['showcase', 'terminal', 'hub', 'frontpage', 'city']) {
      const files = renderProfile(profile, { ...defaultConfig('octo', id) }).assets.filter((a) => a.path.includes('credit-'));
      expect(files, id).toHaveLength(2);
    }
  });
});
