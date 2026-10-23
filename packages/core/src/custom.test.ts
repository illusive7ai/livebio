import { describe, expect, it } from 'vitest';
import { ConfigError, configToYaml, defaultConfig, parseConfig, parseConfigYaml } from './config';
import { buildContributions } from './contributions';
import { renderProfile } from './render';
import type { Config, ContributionDay, Profile } from './types';

const days: ContributionDay[] = Array.from({ length: 60 }, (_v, i) => ({
  date: new Date(Date.UTC(2026, 3, 1 + i)).toISOString().slice(0, 10),
  count: i % 3,
  level: (i % 3 === 0 ? 0 : 2) as 0 | 2,
}));

const grid = { width: 1, height: 1, luma: [128], alpha: [255], tint: [200, 60, 60] as [number, number, number] };
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
  createdAt: '2023-01-15T00:00:00Z',
  languages: [{ name: 'Go', percent: 100 }],
  topRepos: [],
  avatar: { dataUri: 'data:image/png;base64,AAAA', grid },
  contributions: buildContributions(days),
  fetchedAt: '2026-06-10T08:00:00Z',
};
const config = (over: Partial<Config> = {}): Config => ({ ...defaultConfig('octo', 'showcase'), ...over });
const files = (c: Config) => Object.fromEntries(renderProfile(profile, c).assets.map((a) => [a.path, a.content]));

describe('custom settings in the config', () => {
  const parse = (custom: unknown) => parseConfig({ username: 'octo', custom });

  it('are optional, and absent when not given', () => {
    expect(parseConfig({ username: 'octo' }).custom).toBeUndefined();
    expect(parse({}).custom).toBeUndefined();
  });

  it('accept a hue, a look and a companion', () => {
    expect(parse({ hue: 0, look: 'paper', companion: 'chess' }).custom).toEqual({ hue: 0, look: 'paper', companion: 'chess' });
    expect(parse({ hue: 359 }).custom).toEqual({ hue: 359 });
  });

  it.each([-1, 360, 12.5, '120', null])('refuse the hue %j', (hue) => {
    if (hue === null) return;
    expect(() => parse({ hue })).toThrow(ConfigError);
  });

  it('refuse an unknown look or companion, naming the choices', () => {
    expect(() => parse({ look: 'neon' })).toThrow(/custom\.look.*aurora/);
    expect(() => parse({ companion: 'poker' })).toThrow(/custom\.companion.*snake/);
    expect(() => parse('red')).toThrow(ConfigError);
    expect(() => parse([1])).toThrow(ConfigError);
  });

  it('survive a round trip through livebio.yml', () => {
    const original = config({ custom: { hue: 140, look: 'blueprint', companion: 'none' } });
    expect(parseConfigYaml(configToYaml(original))).toEqual(original);
    expect(configToYaml(config())).not.toContain('custom');
  });
});

describe('rendering with custom settings', () => {
  it('recolours a design by hue without touching the profile', () => {
    const plain = files(config())['livebio/showcase-dark.svg']!;
    const green = files(config({ custom: { hue: 120 } }))['livebio/showcase-dark.svg']!;
    const blue = files(config({ custom: { hue: 220 } }))['livebio/showcase-dark.svg']!;
    expect(green).not.toBe(plain);
    expect(green).not.toBe(blue);
    expect(profile.avatar!.grid.tint).toEqual([200, 60, 60]);
  });

  it('gives the same result for the same hue, and the picture’s own colour when none is chosen', () => {
    expect(files(config({ custom: { hue: 120 } }))).toEqual(files(config({ custom: { hue: 120 } })));
    const own = files(config())['livebio/showcase-dark.svg'];
    expect(own).toBe(files(config({ custom: {} }))['livebio/showcase-dark.svg']);
  });

  it('changes the look of the live panels', () => {
    const aurora = files(config())['livebio/showcase-city-dark.svg'];
    const paper = files(config({ custom: { look: 'paper' } }))['livebio/showcase-city-dark.svg'];
    expect(paper).toBeDefined();
    expect(paper).not.toBe(aurora);
  });

  it('swaps the companion game, or drops it', () => {
    const base = Object.keys(files(config()));
    expect(base.some((p) => p.includes('showcase-chess'))).toBe(true);
    const snake = Object.keys(files(config({ custom: { companion: 'snake' } })));
    expect(snake.some((p) => p.includes('showcase-snake'))).toBe(true);
    expect(snake.some((p) => p.includes('showcase-chess'))).toBe(false);
    const none = Object.keys(files(config({ custom: { companion: 'none' } })));
    expect(none.some((p) => /showcase-(snake|chess)/.test(p))).toBe(false);
    expect(none.some((p) => p.includes('showcase-city'))).toBe(true);
  });

  it('keeps the README in step with the images it writes', () => {
    const out = renderProfile(profile, config({ custom: { companion: 'snake' } }));
    expect(out.readme).toContain('showcase-snake-dark.svg');
    expect(out.readme).not.toContain('showcase-chess');
  });
});
