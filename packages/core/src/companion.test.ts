import { describe, expect, it } from 'vitest';
import { defaultConfig } from './config';
import { buildContributions } from './contributions';
import { configFromParams, configToParams } from './hosted';
import { renderProfile } from './render';
import { defaultCompanion, templates } from './templates';
import type { Companion, Config, ContributionDay, Profile } from './types';

/** Any design can carry either game, or none. This runs the choice against every design. */

const days: ContributionDay[] = Array.from({ length: 365 }, (_v, i) => ({
  date: new Date(Date.UTC(2025, 5, 11 + i)).toISOString().slice(0, 10),
  count: i % 3,
  level: (i % 3 === 0 ? 0 : 1) as 0 | 1,
}));

const profile: Profile = {
  login: 'octo',
  name: 'Octo Cat',
  avatarUrl: 'https://avatars.example/octo',
  bio: 'Makes things',
  company: null,
  location: null,
  website: null,
  url: 'https://github.com/octo',
  followers: 10,
  following: 2,
  publicRepos: 5,
  totalStars: 7,
  createdAt: '2020-01-01T00:00:00Z',
  languages: [{ name: 'Go', percent: 100 }],
  topRepos: [{ name: 'tool', description: 'A tool', stars: 3, forks: 1, language: 'Go', url: 'https://github.com/octo/tool' }],
  fetchedAt: '2026-06-10T08:00:00Z',
  contributions: buildContributions(days),
};

const configFor = (id: string, companion?: Companion): Config => ({ ...defaultConfig('octo', id), ...(companion ? { custom: { companion } } : {}) });
const paths = (config: Config): string[] => renderProfile(profile, config).assets.map((a) => a.path);
const has = (list: string[], id: string, game: 'chess' | 'snake'): boolean => list.some((p) => p.includes(`${id}-${game}-`));

describe.each(templates.map((t) => t.id))('%s', (id) => {
  it('can carry chess', () => {
    const list = paths(configFor(id, 'chess'));
    expect(has(list, id, 'chess')).toBe(true);
    expect(has(list, id, 'snake')).toBe(false);
  });

  it('can carry snake', () => {
    const list = paths(configFor(id, 'snake'));
    expect(has(list, id, 'snake')).toBe(true);
    expect(has(list, id, 'chess')).toBe(false);
  });

  it('can carry no game, and keeps its own picture (a text-only design has none)', () => {
    const list = paths(configFor(id, 'none'));
    expect(has(list, id, 'chess') || has(list, id, 'snake')).toBe(false);
    const own = (l: string[]) => l.some((p) => p.includes(`${id}-dark`));
    expect(own(list)).toBe(own(paths(configFor(id))));
  });

  it('keeps the README in step with the files for each choice', () => {
    for (const choice of ['chess', 'snake', 'none'] as const) {
      const config = configFor(id, choice);
      const out = renderProfile(profile, config);
      for (const asset of out.assets) if (!asset.path.includes('credit-')) expect(out.readme, `${choice}: ${asset.path}`).toContain(asset.path);
      for (const other of ['chess', 'snake'] as const) if (other !== choice) expect(out.readme).not.toContain(`${id}-${other}-`);
    }
  });

  it('matches its stated default when nothing is chosen', () => {
    const fallback = defaultCompanion(id);
    const list = paths(configFor(id));
    expect(has(list, id, 'chess')).toBe(fallback === 'chess');
    expect(has(list, id, 'snake')).toBe(fallback === 'snake');
  });

  it('gives identical output when the default is chosen explicitly', () => {
    const fallback = defaultCompanion(id) ?? 'none';
    expect(renderProfile(profile, configFor(id, fallback))).toEqual(renderProfile(profile, configFor(id)));
  });

  it('keeps its choice in the live picture address', () => {
    for (const choice of ['chess', 'snake', 'none'] as const) {
      const config = configFor(id, choice);
      expect(configFromParams('octo', configToParams(config)).custom?.companion).toBe(choice);
    }
  });
});

describe('the two games differ', () => {
  it('draws a different picture for chess and for snake', () => {
    const chess = renderProfile(profile, configFor('showcase', 'chess')).assets.find((a) => a.path.includes('showcase-chess-dark'))!.content;
    const snake = renderProfile(profile, configFor('showcase', 'snake')).assets.find((a) => a.path.includes('showcase-snake-dark'))!.content;
    expect(chess).not.toBe(snake);
  });
  it('lets the switched-off game block win over any choice', () => {
    const config = { ...configFor('showcase', 'chess'), blocks: defaultConfig('octo', 'showcase').blocks.filter((b) => b !== 'game') };
    expect(has(paths(config), 'showcase', 'chess')).toBe(false);
  });
});
