import { describe, expect, it } from 'vitest';
import { ConfigError, defaultConfig } from './config';
import { buildContributions } from './contributions';
import { assetName, cardUrl, configFromParams, configToParams, creditUrl, hostedReadme, normaliseBase, parseCardPath } from './hosted';
import { renderProfile } from './render';
import { templates } from './templates';
import type { BlockId, Config, ContributionDay, Profile, ThemeMode } from './types';

const BASE = 'https://cards.example.dev';

const days: ContributionDay[] = Array.from({ length: 90 }, (_v, i) => ({
  date: new Date(Date.UTC(2026, 2, 1 + i)).toISOString().slice(0, 10),
  count: i % 4,
  level: (i % 4 === 0 ? 0 : 2) as 0 | 2,
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
  contributions: buildContributions(days),
  fetchedAt: '2026-06-10T08:00:00Z',
};

const config = (over: Partial<Config> = {}): Config => ({ ...defaultConfig('octo', 'showcase'), ...over });
const hosted = (c: Config) => {
  const out = renderProfile(profile, c);
  return { out, readme: hostedReadme(out.readme, out.assets, 'octo', c, BASE) };
};

describe('configToParams and configFromParams', () => {
  it('leave out everything that is the default', () => {
    expect(configToParams(config()).toString()).toBe('t=showcase');
  });

  it('write only what differs, in a fixed order', () => {
    const c = config({ motion: false, credit: false, blocks: ['stats', 'city'], text: { headline: 'Hello there', bio: 'About me' }, custom: { hue: 140, look: 'paper', companion: 'chess' } });
    expect(configToParams(c).toString()).toBe('t=showcase&b=stats%2Ccity&m=0&c=0&h=Hello+there&bio=About+me&hue=140&look=paper&game=chess');
  });

  it('give back exactly the settings they were made from', () => {
    const cases: Config[] = [
      config(),
      config({ template: 'terminal' }),
      config({ motion: false }),
      config({ credit: false }),
      config({ blocks: [] }),
      config({ blocks: ['languages'] }),
      config({ blocks: ['stats', 'activity', 'languages', 'projects', 'city'] }),
      config({ text: { headline: 'Security researcher & "builder" <b>' } }),
      config({ text: { bio: 'Line one — with ünïcode and 日本語' } }),
      config({ custom: { hue: 0 } }),
      config({ custom: { hue: 359, look: 'blueprint', companion: 'none' } }),
      config({ template: 'frontpage', motion: false, credit: false, blocks: ['stats'], text: { headline: 'h' }, custom: { companion: 'snake' } }),
    ];
    for (const c of cases) {
      const back = configFromParams('octo', new URLSearchParams(configToParams(c).toString()));
      expect(back, JSON.stringify(c)).toEqual({ ...c, theme: 'auto' });
    }
  });

  it('treat an empty block list as "none", not as "all"', () => {
    expect(configFromParams('octo', new URLSearchParams('t=showcase&b=')).blocks).toEqual([]);
    expect(configFromParams('octo', new URLSearchParams('t=showcase')).blocks).toHaveLength(6);
  });

  it('check everything with the same rules as livebio.yml', () => {
    const bad = ['b=nonsense', 'hue=400', 'hue=abc', 'hue=1.5', 'look=neon', 'game=poker', 'h=' + 'x'.repeat(201), 'bio=' + 'x'.repeat(201)];
    for (const q of bad) expect(() => configFromParams('octo', new URLSearchParams(`t=showcase&${q}`)), q).toThrow(ConfigError);
    expect(() => configFromParams('not a name!', new URLSearchParams('t=showcase'))).toThrow(ConfigError);
  });

  it('ignore parameters it does not know, and default to the showcase design', () => {
    expect(configFromParams('octo', new URLSearchParams('x=1&y=2')).template).toBe('showcase');
  });
});

describe('parseCardPath', () => {
  it('reads a login and a picture name', () => {
    expect(parseCardPath('/u/octo/showcase-dark.svg')).toEqual({ login: 'octo', name: 'showcase-dark' });
    expect(parseCardPath('/u/Octo-Cat/showcase-city-light.svg')).toEqual({ login: 'Octo-Cat', name: 'showcase-city-light' });
  });

  it('refuses anything else', () => {
    for (const p of [
      '/u/octo/showcase.svg', // no colour
      '/u/octo/showcase-dark.png',
      '/u/octo/../x-dark.svg',
      '/u/octo/Showcase-dark.svg',
      '/u//showcase-dark.svg',
      '/u/-bad/showcase-dark.svg',
      '/u/bad-/showcase-dark.svg',
      '/u/ba--d/showcase-dark.svg',
      `/u/${'a'.repeat(40)}/showcase-dark.svg`,
      '/x/octo/showcase-dark.svg',
      '/u/octo/showcase-dark.svg/extra',
      '/u/octo/a/b-dark.svg',
      '/',
    ]) {
      expect(parseCardPath(p), p).toBeNull();
    }
  });
});

describe('addresses', () => {
  it('are built from the server address, the login, the picture and the settings', () => {
    expect(cardUrl(BASE, 'octo', 'showcase-dark', config())).toBe('https://cards.example.dev/u/octo/showcase-dark.svg?t=showcase');
    expect(cardUrl(`${BASE}/`, 'octo', 'showcase-dark', config())).toBe('https://cards.example.dev/u/octo/showcase-dark.svg?t=showcase');
    expect(creditUrl(BASE, 'credit-dark', config())).toBe('https://cards.example.dev/credit-dark.svg');
    expect(creditUrl(BASE, 'credit-dark', config({ motion: false }))).toBe('https://cards.example.dev/credit-dark.svg?m=0');
  });

  it('only accept http and https servers', () => {
    expect(normaliseBase('https://a.example/')).toBe('https://a.example');
    expect(normaliseBase('http://localhost:8787')).toBe('http://localhost:8787');
    expect(() => normaliseBase('javascript:alert(1)')).toThrow();
    expect(() => normaliseBase('ftp://a.example')).toThrow();
    expect(() => normaliseBase('not a url')).toThrow();
  });

  it('name a picture from its path', () => {
    expect(assetName('livebio/showcase-city-dark.svg')).toBe('showcase-city-dark');
  });
});

describe('a hosted README', () => {
  it('points every picture at the server and no longer at a file in the repository', () => {
    const { readme } = hosted(config());
    expect(readme).not.toContain('livebio/');
    expect(readme).toContain('srcset="https://cards.example.dev/u/octo/showcase-dark.svg?t=showcase"');
    expect(readme).toContain('src="https://cards.example.dev/u/octo/showcase-light.svg?t=showcase"');
    expect(readme).toContain('src="https://cards.example.dev/credit-light.svg"');
  });

  it('leaves everything that is not a picture untouched', () => {
    const { out, readme } = hosted(config());
    const strip = (s: string) => s.replace(/(?:src|srcset)="[^"]*"/g, '');
    expect(strip(readme)).toBe(strip(out.readme));
  });

  it('writes ampersands as entities, so the address is valid inside an HTML attribute', () => {
    const { readme } = hosted(config({ blocks: ['stats', 'city'], motion: false }));
    expect(readme).toContain('?t=showcase&amp;b=stats%2Ccity&amp;m=0"');
    expect(readme).not.toMatch(/(?:src|srcset)="[^"]*&(?!amp;)/);
  });

  it('cannot be broken out of an attribute by text in the settings', () => {
    const { readme } = hosted(config({ text: { headline: '"><script>alert(1)</script>', bio: "' onerror='x" } }));
    expect(readme).not.toContain('<script>');
    for (const m of readme.matchAll(/(?:src|srcset)="([^"]*)"/g)) expect(m[1]).not.toMatch(/[<>'" ]/);
    expect(readme).not.toMatch(/onerror=/);
  });

  it('uses one picture for a fixed theme and a pair for the automatic one', () => {
    expect((hosted(config({ theme: 'dark' })).readme.match(/<picture>/g) ?? []).length).toBe(0);
    expect((hosted(config({ theme: 'auto' })).readme.match(/<picture>/g) ?? []).length).toBeGreaterThan(0);
  });

  it('has no credit address when the credit is off', () => {
    expect(hosted(config({ credit: false })).readme).not.toContain('credit-');
  });
});

describe.each(templates.map((t) => t.id))('%s hosted', (id) => {
  const themes: ThemeMode[] = ['auto', 'dark', 'light'];
  const blockSets: BlockId[][] = [['stats', 'activity', 'languages', 'projects', 'city', 'game'], ['stats'], ['city', 'game'], []];
  const cases: Array<[string, Partial<Config>]> = [];
  for (const theme of themes) for (const blocks of blockSets) for (const credit of [true, false]) cases.push([`${theme}, ${blocks.length} blocks, credit ${credit}`, { theme, blocks, credit }]);

  it.each(cases)('%s', (_name, over) => {
    const c = config({ template: id, ...over });
    const { out, readme } = hosted(c);
    const addresses = [...readme.matchAll(/(?:src|srcset)="([^"]+)"/g)].map((m) => m[1]!.replace(/&amp;/g, '&'));

    // Every picture is a full address on the server, and none is a file in the repository.
    for (const address of addresses) {
      const url = new URL(address);
      expect(url.origin).toBe(BASE);
      if (url.pathname.startsWith('/u/')) {
        // The server can read this address back into the same picture of the same design.
        const card = parseCardPath(url.pathname)!;
        expect(card, address).not.toBeNull();
        expect(card.login).toBe('octo');
        const back = configFromParams(card.login, url.searchParams);
        expect(back, address).toEqual({ ...c, theme: 'auto' });
        // And that picture really is one this design produces.
        expect(out.assets.map((a) => assetName(a.path)), address).toContain(card.name);
      } else {
        expect(url.pathname, address).toMatch(/^\/credit-(dark|light)\.svg$/);
      }
    }
    expect(readme).not.toContain('livebio/');
  });
});
