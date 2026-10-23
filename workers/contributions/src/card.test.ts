import { DOMParser } from '@xmldom/xmldom';
import { describe, expect, it } from 'vitest';
import { MemoryCache, github } from './fake-github';
import { handle, type CacheLike, type Env } from './handler';

const TOKEN = 'ghp_SUPERSECRET123';
const env: Env = { GITHUB_TOKEN: TOKEN, ALLOWED_ORIGINS: 'https://app.example' };

const get = (path: string) => new Request(`https://cards.example${path}`);
const draw = (path: string, gh = github(), cache?: CacheLike, e: Env = env) => handle(get(path), e, { fetch: gh.fetcher, cache });
const text = async (path: string, gh = github()) => (await draw(path, gh)).text();
const svgTexts = (svg: string) => Array.from(new DOMParser().parseFromString(svg, 'image/svg+xml').getElementsByTagName('text')).map((t) => t.textContent ?? '');

describe('GET /u/{login}/{picture}.svg', () => {
  it('answers with an image that nothing in it can run, and that browsers and proxies may keep', async () => {
    const response = await draw('/u/octo/showcase-dark.svg?t=showcase');
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/svg+xml; charset=utf-8');
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600');
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('Content-Security-Policy')).toContain("default-src 'none'");
    const svg = await response.text();
    expect(svg.startsWith('<svg')).toBe(true);
    new DOMParser({ onError: (_l, m) => expect.fail(m) }).parseFromString(svg, 'image/svg+xml');
  });

  it('draws the live numbers of the person it is asked for', async () => {
    const t = svgTexts(await text('/u/octo/showcase-dark.svg?t=showcase')).join(' ');
    expect(t).toContain('Octo Cat');
    expect(t).toContain('1,234');
    expect(t).toContain('alpha');
  });

  it('draws the contribution city from the real calendar', async () => {
    const t = svgTexts(await text('/u/octo/showcase-city-dark.svg?t=showcase')).join(' ');
    expect(t).toContain('CONTRIBUTION CITY');
    expect(t).not.toContain('appears here');
  });

  it('draws the live game too, and the dark and light versions differently', async () => {
    const chess = await text('/u/octo/showcase-chess-dark.svg?t=showcase');
    expect(svgTexts(chess).join(' ')).toContain('LIVE');
    expect(await text('/u/octo/showcase-dark.svg?t=showcase')).not.toBe(await text('/u/octo/showcase-light.svg?t=showcase'));
  });

  it('embeds the profile picture it decoded', async () => {
    const svg = await text('/u/octo/showcase-dark.svg?t=showcase');
    expect(svg).toMatch(/href="data:image\/png;base64,[A-Za-z0-9+/=]+"/);
  });

  it('follows the settings in the address', async () => {
    const base = await text('/u/octo/terminal-dark.svg?t=terminal');
    const still = await text('/u/octo/terminal-dark.svg?t=terminal&m=0');
    expect(base).toContain('@keyframes');
    expect(still).not.toContain('@keyframes');
    expect(svgTexts(await text('/u/octo/showcase-dark.svg?t=showcase&b=stats')).join(' ')).not.toContain('alpha');
    expect(await text('/u/octo/showcase-dark.svg?t=showcase&hue=40')).not.toBe(await text('/u/octo/showcase-dark.svg?t=showcase&hue=200'));
    expect(svgTexts(await text('/u/octo/frontpage-dark.svg?t=frontpage')).join(' ')).toContain('THE OCTO GAZETTE');
  });

  it('draws the date from the day it is drawn, so a hosted card changes as time passes', async () => {
    const t = svgTexts(await text('/u/octo/frontpage-dark.svg?t=frontpage')).join(' ');
    expect(t).toMatch(/(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), \d+ \w+ 20\d\d/);
  });

  it('never puts the token, or anything hostile, in a picture', async () => {
    const hostile = encodeURIComponent('"><script>alert(1)</script>');
    const response = await draw(`/u/octo/showcase-dark.svg?t=showcase&h=${hostile}`);
    const svg = await response.text();
    expect(svg).not.toContain(TOKEN);
    expect([...response.headers].join(';')).not.toContain(TOKEN);
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
    expect(doc.getElementsByTagName('script')).toHaveLength(0);
  });

  describe('when it cannot draw what was asked', () => {
    it('answers with a picture that says so, not with an error status, because a README shows those as broken icons', async () => {
      const response = await draw('/u/octo/showcase-dark.svg?t=showcase&hue=999');
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toContain('image/svg+xml');
      expect(response.headers.get('Cache-Control')).toBe('public, max-age=60');
      expect(svgTexts(await response.text()).join(' ')).toMatch(/hue/i);
    });

    it('says which design is unknown, and does not call GitHub for it', async () => {
      const gh = github();
      const svg = await (await draw('/u/octo/nonsense-dark.svg?t=nonsense', gh)).text();
      expect(svgTexts(svg).join(' ')).toMatch(/nonsense/);
      expect(gh.calls).toEqual([]);
    });

    it('says when a design has no such picture', async () => {
      const svg = await text('/u/octo/showcase-nothing-dark.svg?t=showcase');
      expect(svgTexts(svg).join(' ')).toContain('does not have this picture');
    });

    it('refuses addresses that are not valid, without calling GitHub', async () => {
      const gh = github();
      for (const path of ['/u/octo/x.svg', '/u/-bad/showcase-dark.svg', '/u/octo/showcase-dark.png', `/u/${'a'.repeat(40)}/showcase-dark.svg`]) {
        const response = await draw(path, gh);
        expect(response.status, path).not.toBe(500);
      }
      expect(gh.calls).toEqual([]);
    });

    it('refuses a very long address', async () => {
      const gh = github();
      const svg = await text(`/u/octo/showcase-dark.svg?t=showcase&h=${'x'.repeat(2000)}`, gh);
      expect(svgTexts(svg).join(' ')).toContain('too long');
      expect(gh.calls).toEqual([]);
    });

    it('says there is no such user, briefly', async () => {
      const response = await draw('/u/nobody/showcase-dark.svg?t=showcase', github({ userStatus: 404 }));
      expect(svgTexts(await response.text()).join(' ')).toContain('no GitHub user called nobody');
      expect(response.headers.get('Cache-Control')).toBe('public, max-age=60');
    });

    it('says it is busy when GitHub limits it, and never caches that', async () => {
      const cache = new MemoryCache();
      const response = await draw('/u/octo/showcase-dark.svg?t=showcase', github({ userStatus: 403 }), cache);
      expect(svgTexts(await response.text()).join(' ')).toContain('busy');
      expect(cache.store.size).toBe(0);
    });

    it('says it could not draw when GitHub fails, without details, and never caches that', async () => {
      const cache = new MemoryCache();
      const response = await draw('/u/octo/showcase-dark.svg?t=showcase', github({ userStatus: 500 }), cache);
      const svg = await response.text();
      expect(svgTexts(svg).join(' ')).toContain('could not draw');
      expect(svg).not.toContain(TOKEN);
      expect(cache.store.size).toBe(0);
    });

    it('says it is not set up when it has no token', async () => {
      const gh = github();
      const svg = await (await draw('/u/octo/showcase-dark.svg?t=showcase', gh, undefined, { ALLOWED_ORIGINS: '' })).text();
      expect(svgTexts(svg).join(' ')).toContain('not set up');
      expect(gh.calls).toEqual([]);
    });
  });

  describe('when part of the data is missing', () => {
    it('still draws everything else if the calendar cannot be read', async () => {
      const svg = await text('/u/octo/showcase-city-dark.svg?t=showcase', github({ graphql: () => new Response('boom', { status: 500 }) }));
      expect(svgTexts(svg).join(' ')).toContain('appears here');
    });

    it('still draws everything else if the picture cannot be read', async () => {
      const svg = await text('/u/octo/showcase-dark.svg?t=showcase', github({ avatar: () => new Response('nope', { status: 500 }) }));
      expect(svgTexts(svg).join(' ')).toContain('Octo Cat');
      expect(svg).not.toContain('data:image/png');
    });

    it('does not decode something that is not a picture', async () => {
      const svg = await text('/u/octo/showcase-dark.svg?t=showcase', github({ avatar: () => new Response('<html>not a picture</html>') }));
      expect(svgTexts(svg).join(' ')).toContain('Octo Cat');
    });
  });

  describe('where it fetches pictures from', () => {
    it('only fetches a profile picture from GitHub’s own hosts', async () => {
      const gh = github({ avatarUrl: 'https://evil.example/steal.png' });
      await text('/u/octo/showcase-dark.svg?t=showcase', gh);
      expect(gh.calls.some((c) => c.includes('evil.example'))).toBe(false);
    });

    it('refuses look-alike hosts, other schemes, and addresses with a login in them', async () => {
      const lookAlikes = [
        'https://avatars.githubusercontent.com.evil.example/x.png',
        'https://evil-avatars.githubusercontent.com/x.png',
        'https://githubusercontent.evil.example/x.png',
        'https://xavatars.githubusercontent.com/x.png',
        'https://github.com/octo.png',
        'https://user:pass@avatars.githubusercontent.com/x.png',
        'http://avatars.githubusercontent.com/x.png',
        'ftp://avatars.githubusercontent.com/x.png',
        'javascript:alert(1)',
        'not a url',
      ];
      for (const avatarUrl of lookAlikes) {
        const gh = github({ avatarUrl });
        const svg = await text('/u/octo/showcase-dark.svg?t=showcase', gh);
        expect(gh.calls.filter((c) => !c.startsWith('https://api.github.com/')), avatarUrl).toEqual([]);
        expect(svgTexts(svg).join(' '), avatarUrl).toContain('Octo Cat');
      }
    });

    it('does fetch from GitHub’s numbered picture hosts', async () => {
      const gh = github({ avatarUrl: 'https://avatars3.githubusercontent.com/u/1?v=4' });
      await text('/u/octo/showcase-dark.svg?t=showcase', gh);
      expect(gh.calls.some((c) => c.startsWith('https://avatars3.githubusercontent.com/'))).toBe(true);
    });

    it('never fetches anything but GitHub', async () => {
      const gh = github();
      await text('/u/octo/showcase-city-dark.svg?t=showcase', gh);
      for (const call of gh.calls) expect(new URL(call).hostname).toMatch(/^(api\.github\.com|avatars\.githubusercontent\.com)$/);
    });
  });

  describe('caching', () => {
    it('keeps a finished picture, so a busy profile costs one render an hour', async () => {
      const cache = new MemoryCache();
      const gh = github();
      const first = await draw('/u/octo/showcase-dark.svg?t=showcase', gh, cache);
      expect(first.headers.get('X-Livebio-Cache')).toBe('MISS');
      const callsAfterFirst = gh.calls.length;
      const second = await draw('/u/octo/showcase-dark.svg?t=showcase', gh, cache);
      expect(second.headers.get('X-Livebio-Cache')).toBe('HIT');
      expect(gh.calls.length).toBe(callsAfterFirst);
      expect(await second.text()).toBe(await first.text());
    });

    it('shares one person’s data between all their pictures, so the token is spent once', async () => {
      const cache = new MemoryCache();
      const gh = github();
      await draw('/u/octo/showcase-dark.svg?t=showcase', gh, cache);
      const callsAfterFirst = gh.calls.length;
      await draw('/u/octo/showcase-city-dark.svg?t=showcase', gh, cache);
      await draw('/u/octo/showcase-chess-light.svg?t=showcase', gh, cache);
      await draw('/u/octo/showcase-light.svg?t=showcase&hue=90', gh, cache);
      expect(gh.calls.length).toBe(callsAfterFirst);
    });

    it('keeps different settings apart', async () => {
      const cache = new MemoryCache();
      const a = await (await draw('/u/octo/showcase-dark.svg?t=showcase&hue=10', github(), cache)).text();
      const b = await (await draw('/u/octo/showcase-dark.svg?t=showcase&hue=200', github(), cache)).text();
      expect(a).not.toBe(b);
    });

    it('keeps different people apart', async () => {
      const cache = new MemoryCache();
      await draw('/u/octo/showcase-dark.svg?t=showcase', github(), cache);
      const gh = github();
      await draw('/u/someone/showcase-dark.svg?t=showcase', gh, cache);
      expect(gh.calls.length).toBeGreaterThan(0);
    });
  });
});

describe('requests to GitHub', () => {
  it('always carry a User-Agent, which GitHub requires and a Worker does not add by itself', async () => {
    const seen: Array<string | null> = [];
    const gh = github();
    const spy = (async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).startsWith('https://api.github.com/')) seen.push(new Headers(init?.headers).get('user-agent'));
      return gh.fetcher(input, init);
    }) as typeof fetch;
    await handle(get('/u/octo/showcase-city-dark.svg?t=showcase'), env, { fetch: spy });
    expect(seen.length).toBeGreaterThanOrEqual(3); // the user, the repositories, the calendar
    for (const agent of seen) expect(agent).toBeTruthy();
  });

  it('are refused by the fake GitHub when they do not, so the check above is real', async () => {
    const gh = github();
    expect((await gh.fetcher('https://api.github.com/users/octo', { headers: {} })).status).toBe(403);
    expect((await gh.fetcher('https://api.github.com/users/octo', { headers: { 'User-Agent': 'x' } })).status).toBe(200);
  });
});

describe('GET /credit-{dark|light}.svg', () => {
  it('is the same for everyone, needs no data, and is kept for a day', async () => {
    const gh = github();
    const response = await draw('/credit-dark.svg', gh);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('image/svg+xml');
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=86400');
    const title = new DOMParser().parseFromString(await response.text(), 'image/svg+xml').getElementsByTagName('title')[0]!.textContent;
    expect(title).toBe('livebio by illusivehacks');
    expect(gh.calls).toEqual([]);
  });

  it('is still without the motion switch', async () => {
    expect(await text('/credit-dark.svg')).toContain('@keyframes');
    expect(await text('/credit-light.svg?m=0')).not.toContain('@keyframes');
  });

  it('does not exist for any other colour or name', async () => {
    expect((await draw('/credit-blue.svg')).status).toBe(404);
    expect((await draw('/credit-dark.png')).status).toBe(404);
  });
});
