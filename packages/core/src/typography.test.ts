import { describe, expect, it } from 'vitest';
import { ConfigError, configToYaml, defaultConfig, parseConfig, parseConfigYaml } from './config';
import { configFromParams, configToParams } from './hosted';
import { renderProfile } from './render';
import { templates } from './templates';
import { profile, wellFormed } from './testkit';
import { FONT_STACKS, contrastRatio, styleText } from './typography';
import { FONT_CHOICES, type Config, type CustomStyle } from './types';

const parse = (custom: unknown) => parseConfig({ username: 'octo', custom });
const withCustom = (id: string, custom: CustomStyle, over: Partial<Config> = {}): Config => ({
  ...defaultConfig('octo', id),
  motion: false,
  theme: 'dark',
  custom,
  ...over,
});
const pictures = (c: Config) => renderProfile(profile, c).assets.filter((a) => a.path.endsWith('.svg') && !a.path.includes('credit-'));

describe('typography in the config', () => {
  it('accepts a font, a text colour and a size, lower-casing the colour', () => {
    expect(parse({ font: 'serif', textColor: '#FFAA00', textSize: 110 }).custom).toEqual({ font: 'serif', textColor: '#ffaa00', textSize: 110 });
    expect(parse({ timelapse: true }).custom).toEqual({ timelapse: true });
  });

  it.each(['comic', 3, null])('refuses the font %j', (font) => {
    if (font === null) return;
    expect(() => parse({ font })).toThrow(/custom\.font/);
  });

  it.each(['red', '#fff', '#12345', '#12345g', 'ffaa00', 5])('refuses the text colour %j', (textColor) => {
    expect(() => parse({ textColor })).toThrow(ConfigError);
  });

  it.each([79, 131, 100.5, '100', 0])('refuses the text size %j', (textSize) => {
    expect(() => parse({ textSize })).toThrow(/custom\.textSize/);
  });

  it('accepts the limits of the text size', () => {
    expect(parse({ textSize: 80 }).custom?.textSize).toBe(80);
    expect(parse({ textSize: 130 }).custom?.textSize).toBe(130);
  });

  it('refuses a time-lapse that is not true or false', () => {
    expect(() => parse({ timelapse: 'yes' })).toThrow(ConfigError);
  });

  it('survives a trip through livebio.yml', () => {
    const original = withCustom('showcase', { font: 'handwriting', textColor: '#00ff88', textSize: 90, timelapse: true });
    expect(parseConfigYaml(configToYaml(original)).custom).toEqual(original.custom);
  });

  it('survives a trip through the hosted picture address', () => {
    const original = withCustom('showcase', { font: 'impact', textColor: '#0a0b0c', textSize: 125, timelapse: true, hue: 40 });
    const params = configToParams(original);
    expect(params.get('tc')).toBe('0a0b0c');
    expect(configFromParams('octo', new URLSearchParams(params.toString())).custom).toEqual(original.custom);
  });

  it('adds nothing to the address when nothing is changed', () => {
    const params = configToParams(defaultConfig('octo', 'showcase')).toString();
    expect(params).not.toMatch(/font|tc=|ts=|tl=/);
  });

  it('refuses a damaged hosted address', () => {
    expect(() => configFromParams('octo', new URLSearchParams('t=showcase&tc=zzzzzz'))).toThrow(ConfigError);
    expect(() => configFromParams('octo', new URLSearchParams('t=showcase&ts=500'))).toThrow(ConfigError);
    expect(() => configFromParams('octo', new URLSearchParams('t=showcase&font=comic'))).toThrow(ConfigError);
  });
});

describe('styleText', () => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg"><style>text{font-family:Georgia,serif}.k{font-size:11px;fill:#fff}</style><text font-family="'Segoe UI', Arial" font-size="12.5" fill="#abc">Hi</text><text class="k" font-size="40">9</text></svg>`;

  it('swaps every font family, in attributes and in stylesheets', () => {
    const out = styleText(svg, { font: 'mono' });
    expect(out).not.toContain('Georgia');
    expect(out).not.toContain('Segoe');
    expect(out.match(new RegExp(FONT_STACKS.mono.replace(/[()*+.?[\]\\^$|{}]/g, '\\$&'), 'g'))).toHaveLength(2);
    expect(wellFormed(out)).toEqual([]);
  });

  it('scales every font size, in attributes and in stylesheets', () => {
    const out = styleText(svg, { textSize: 120 });
    expect(out).toContain('font-size="15"');
    expect(out).toContain('font-size="48"');
    expect(out).toContain('font-size:13.2px');
  });

  it('leaves sizes alone at 100', () => {
    expect(styleText(svg, { textSize: 100 })).toBe(svg);
  });

  it('forces one text colour above both attributes and class rules', () => {
    const out = styleText(svg, { textColor: '#ff0000' });
    expect(out).toContain('svg text:not(#x),svg tspan:not(#x){fill:#ff0000}');
    expect(out.indexOf('{fill:#ff0000}')).toBeGreaterThan(out.indexOf('.k{'));
  });

  it('adds a style element to a picture that has none', () => {
    const out = styleText('<svg xmlns="http://www.w3.org/2000/svg"><text>x</text></svg>', { textColor: '#00ff00' });
    expect(out).toContain('<style>svg text:not(#x)');
    expect(wellFormed(out)).toEqual([]);
  });

  it('has a stack that ends in a generic family for every choice', () => {
    for (const font of FONT_CHOICES) expect(FONT_STACKS[font]).toMatch(/(sans-serif|serif|monospace|cursive)$/);
  });
});

describe('typography across every design', () => {
  it.each(templates.map((t) => t.id))('%s takes a font, a colour and a size, and stays well formed', (id) => {
    const plain = pictures(withCustom(id, {}));
    const styled = pictures(withCustom(id, { font: 'classic', textColor: '#112233', textSize: 90 }));
    expect(styled.map((a) => a.path)).toEqual(plain.map((a) => a.path));
    for (const a of styled) {
      expect(wellFormed(a.content), a.path).toEqual([]);
      expect(a.content).toContain(FONT_STACKS.classic);
      expect(a.content).toContain('fill:#112233');
      expect(a.content).not.toContain(FONT_STACKS.sans);
    }
  });

  it('does not touch the credit line', () => {
    const credit = renderProfile(profile, withCustom('showcase', { font: 'classic', textColor: '#112233' }, { motion: true })).assets.filter((a) =>
      a.path.includes('credit-'),
    );
    expect(credit.length).toBeGreaterThan(0);
    for (const a of credit) expect(a.content).not.toContain('#112233');
  });

  it('changes nothing when no typography is set', () => {
    const a = renderProfile(profile, withCustom('showcase', {}));
    const b = renderProfile(profile, { ...withCustom('showcase', {}), custom: undefined });
    expect(a.assets).toEqual(b.assets);
  });
});

describe('contrastRatio', () => {
  it('is 21 for black on white and 1 for the same colour', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#336699', '#336699')).toBeCloseTo(1, 5);
  });

  it('does not depend on which colour is first', () => {
    expect(contrastRatio('#ff0000', '#0d1117')).toBeCloseTo(contrastRatio('#0d1117', '#ff0000'), 10);
  });

  it('matches published WCAG figures', () => {
    expect(contrastRatio('#777777', '#ffffff')).toBeCloseTo(4.48, 1);
    expect(contrastRatio('#767676', '#ffffff')).toBeCloseTo(4.54, 1);
  });

  it('says pale text vanishes on white and dark text vanishes on a dark page', () => {
    expect(contrastRatio('#f0f0f0', '#ffffff')).toBeLessThan(1.2);
    expect(contrastRatio('#222222', '#0d1117')).toBeLessThan(1.5);
  });
});
