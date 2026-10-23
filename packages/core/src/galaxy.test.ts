import { DOMParser } from '@xmldom/xmldom';
import { describe, expect, it } from 'vitest';
import { hslToHex } from './color';
import { defaultConfig } from './config';
import { renderProfile } from './render';
import { MAX_PLANETS, languageHue, layoutGalaxy, moonsFor } from './templates/galaxy';
import type { Config, Profile, RepoSummary } from './types';

const repo = (name: string, stars: number, over: Partial<RepoSummary> = {}): RepoSummary => ({
  name,
  description: null,
  stars,
  forks: 0,
  language: null,
  url: `https://github.com/octo/${name}`,
  ...over,
});

describe('layoutGalaxy', () => {
  it('returns nothing for no repositories', () => {
    expect(layoutGalaxy([])).toEqual([]);
  });

  it('puts the most-starred repository on the innermost orbit', () => {
    const planets = layoutGalaxy([repo('small', 3), repo('big', 900), repo('mid', 40)]);
    expect(planets.map((p) => p.name)).toEqual(['big', 'mid', 'small']);
  });

  it('breaks ties by name so the picture never changes between runs', () => {
    const planets = layoutGalaxy([repo('b', 5), repo('a', 5), repo('c', 5)]);
    expect(planets.map((p) => p.name)).toEqual(['a', 'b', 'c']);
  });

  it('shows at most six planets', () => {
    const many = Array.from({ length: 12 }, (_v, i) => repo(`r${i}`, 100 - i));
    expect(layoutGalaxy(many)).toHaveLength(MAX_PLANETS);
    expect(MAX_PLANETS).toBe(6);
  });

  it('spaces orbits evenly outwards from 76 pixels, and slows outer planets', () => {
    const planets = layoutGalaxy(Array.from({ length: 4 }, (_v, i) => repo(`r${i}`, 100 - i)));
    expect(planets.map((p) => p.orbit)).toEqual([76, 104, 132, 160]);
    expect(planets.map((p) => p.period)).toEqual([22, 33, 44, 55]);
  });

  it('sizes planets by the square root of their stars, between 5 and 18 pixels', () => {
    const [a, b, c] = layoutGalaxy([repo('a', 100), repo('b', 25), repo('c', 1)]);
    expect(a!.size).toBeCloseTo(18, 6);
    expect(b!.size).toBeCloseTo(5 + 0.5 * 13, 6); // 11.5
    expect(c!.size).toBeCloseTo(5 + 0.1 * 13, 6); // 6.3
  });

  it('gives a repository with no stars the smallest planet instead of failing', () => {
    const planets = layoutGalaxy([repo('a', 0), repo('b', 0)]);
    for (const p of planets) {
      expect(p.size).toBe(5);
      expect(Number.isFinite(p.size)).toBe(true);
    }
  });

  it('spreads start angles by the golden angle so neighbours do not line up', () => {
    const planets = layoutGalaxy(Array.from({ length: 6 }, (_v, i) => repo(`r${i}`, 100 - i)));
    expect(planets[0]!.angle).toBe(0);
    for (let i = 1; i < planets.length; i++) {
      const gap = (planets[i]!.angle - planets[i - 1]!.angle + 360) % 360;
      expect(gap).toBeCloseTo(137.508, 2);
    }
    expect(new Set(planets.map((p) => Math.round(p.angle))).size).toBe(6);
  });

  it('carries each repository’s language, stars and forks through unchanged', () => {
    const [p] = layoutGalaxy([repo('x', 7, { forks: 3, language: 'Go' })]);
    expect(p).toMatchObject({ name: 'x', stars: 7, forks: 3, language: 'Go', moons: 1 });
  });
});

describe('moonsFor', () => {
  it.each([
    [0, 0],
    [1, 1],
    [9, 1],
    [10, 2],
    [99, 2],
    [100, 3],
    [250_000, 3],
  ])('%i forks gives %i moon(s)', (forks, moons) => {
    expect(moonsFor(forks)).toBe(moons);
  });
});

describe('languageHue', () => {
  it('is the same every time and ignores capitalisation', () => {
    expect(languageHue('Python')).toBe(languageHue('Python'));
    expect(languageHue('Python')).toBe(languageHue('python'));
  });

  it('stays on the colour wheel and tells languages apart', () => {
    const hues = ['Python', 'Go', 'Rust', 'TypeScript', 'C', 'HTML'].map(languageHue);
    for (const hue of hues) {
      expect(hue).toBeGreaterThanOrEqual(0);
      expect(hue).toBeLessThan(360);
    }
    expect(new Set(hues).size).toBeGreaterThanOrEqual(5);
  });
});

const profile: Profile = {
  login: 'octo',
  name: 'Octo Cat',
  avatarUrl: 'https://avatars.example/octo',
  bio: null,
  company: null,
  location: null,
  website: null,
  url: 'https://github.com/octo',
  followers: 900,
  following: 3,
  publicRepos: 42,
  totalStars: 5400,
  createdAt: '2019-03-01T00:00:00Z',
  languages: [{ name: 'Go', percent: 100 }],
  topRepos: [
    repo('alpha', 5000, { language: 'Go', forks: 320 }),
    repo('beta', 800, { language: 'Python', forks: 14 }),
    repo('gamma', 90, { language: null, forks: 1 }),
    repo('delta', 12, { language: 'Go', forks: 0 }),
  ],
  avatar: { dataUri: 'data:image/png;base64,iVBORw0KGgo=', grid: { width: 1, height: 1, luma: [0], alpha: [255], tint: [40, 120, 200] } },
};

const config = (over: Partial<Config> = {}): Config => ({ ...defaultConfig('octo', 'galaxy'), ...over });
const svgOf = (p: Profile, c: Config, variant: 'dark' | 'light' = 'dark') =>
  renderProfile(p, c).assets.find((a) => a.path.endsWith(`-${variant}.svg`))!.content;

function parse(svg: string) {
  const errors: string[] = [];
  const doc = new DOMParser({ onError: (_l, m) => errors.push(m) }).parseFromString(svg, 'image/svg+xml');
  expect(errors).toEqual([]);
  return doc;
}

const orbits = (svg: string) => Array.from(parse(svg).getElementsByTagName('g')).filter((g) => g.getAttribute('class') === 'orbit');

/** The sun's centre, read from the glow circle that sits on it. */
function sunCentre(svg: string): [number, number] {
  const sun = Array.from(parse(svg).getElementsByTagName('circle')).find((c) => c.getAttribute('class') === 'sun')!;
  return [Number(sun.getAttribute('cx')), Number(sun.getAttribute('cy'))];
}

describe('repo galaxy template', () => {
  it('draws one planet for every repository, up to six', () => {
    expect(orbits(svgOf(profile, config()))).toHaveLength(4);
    const many = { ...profile, topRepos: Array.from({ length: 9 }, (_v, i) => repo(`r${i}`, 50 - i)) };
    expect(orbits(svgOf(many, config()))).toHaveLength(6);
  });

  it('turns every planet about the sun, not about some other point', () => {
    const svg = svgOf(profile, config());
    const [cx, cy] = sunCentre(svg);
    for (const orbit of orbits(svg)) {
      expect(orbit.getAttribute('style')).toContain(`transform-origin:${cx}px ${cy}px`);
    }
  });

  it('starts each planet exactly its orbit’s distance from the sun', () => {
    const svg = svgOf(profile, config());
    const [cx] = sunCentre(svg);
    const planets = layoutGalaxy(profile.topRepos);
    orbits(svg).forEach((orbit, index) => {
      const inner = orbit.getElementsByTagName('g')[0]!; // the translate group that holds the planet
      const x = Number(/translate\(([\d.-]+) /.exec(inner.getAttribute('transform') ?? '')![1]);
      expect(x - cx).toBeCloseTo(planets[index]!.orbit, 0);
    });
  });

  it('gives each planet its moons, one for each fork milestone', () => {
    const svg = svgOf(profile, config());
    const moons = layoutGalaxy(profile.topRepos).reduce((sum, p) => sum + p.moons, 0);
    expect(moons).toBe(3 + 2 + 1 + 0);
    expect((svg.match(/class="moon"/g) ?? []).length).toBe(moons);
  });

  it('lists each project with its stars, language and forks, and explains how to read it', () => {
    const svg = svgOf(profile, config());
    for (const text of ['alpha', '★ 5,000', 'Go', '320 forks', 'beta', 'Python', 'gamma']) expect(svg).toContain(text);
    expect(svg).toContain('size shows stars');
    expect(svg).toContain('closest to the sun is most starred');
    expect(svg).toContain('a moon is a fork');
  });

  it('colours a planet by its language, the same everywhere, and greys out an unknown one', () => {
    const svg = svgOf(profile, config());
    expect(svg).toContain(hslToHex(languageHue('Python'), 0.72, 0.62));
    expect(svg).toContain(hslToHex(languageHue('Go'), 0.72, 0.62));
    expect(svg).toContain('#8b93b8'); // the repository with no language
  });

  it('keeps the whole galaxy and its legend inside the card, with the legend clear of the planets', () => {
    for (const variant of ['dark', 'light'] as const) {
      const svg = svgOf(profile, config(), variant);
      const height = Number(/height="(\d+)" viewBox/.exec(svg)![1]);
      const [cx, cy] = sunCentre(svg);
      for (const c of Array.from(parse(svg).getElementsByTagName('circle'))) {
        if (c.getAttribute('fill') !== 'none' || c.getAttribute('stroke-dasharray') === null) continue;
        const r = Number(c.getAttribute('r'));
        expect(cx - r).toBeGreaterThanOrEqual(0);
        expect(cx + r).toBeLessThanOrEqual(900);
        expect(cy - r).toBeGreaterThanOrEqual(0);
        expect(cy + r).toBeLessThanOrEqual(height);
      }
      const outer = Math.max(...layoutGalaxy(profile.topRepos).map((p) => p.orbit + p.size));
      const legendDot = Array.from(parse(svg).getElementsByTagName('circle')).find((c) => c.getAttribute('r') === '6')!;
      expect(Number(legendDot.getAttribute('cx'))).toBeGreaterThan(cx + outer + 20);
    }
  });

  it('stays inside the card for a full set of six, with every moon', () => {
    const six = { ...profile, topRepos: Array.from({ length: 6 }, (_v, i) => repo(`repo-${i}`, 6000 - i * 900, { forks: 500, language: 'Rust' })) };
    const svg = svgOf(six, config());
    const height = Number(/height="(\d+)" viewBox/.exec(svg)![1]);
    const [cx, cy] = sunCentre(svg);
    // How far from the sun the outermost moon of any planet can reach: its orbit, the planet, then the moon's own orbit.
    const extent = Math.max(
      ...layoutGalaxy(six.topRepos).map((p) => p.orbit + p.size + (p.moons > 0 ? p.size + 6 + (p.moons - 1) * 3 + 2.2 : 0)),
    );
    expect(cx - extent).toBeGreaterThanOrEqual(36 - 0.5); // the card's side margin
    expect(cy + extent).toBeLessThanOrEqual(height - 18);
    expect(cx + extent).toBeLessThan(560); // and clear of the legend
  });

  it('uses the picture as the sun when it is safe, and an initial otherwise', () => {
    expect(parse(svgOf(profile, config())).getElementsByTagName('image')).toHaveLength(1);
    const bad = { ...profile, avatar: { ...profile.avatar!, dataUri: 'https://evil.example/x.png' } };
    const svg = svgOf(bad, config());
    expect(parse(svg).getElementsByTagName('image')).toHaveLength(0);
    expect(svg).toContain('>O<');
    expect(svg).not.toContain('evil.example');
  });

  describe('without repositories', () => {
    it('says so plainly, and draws no planets', () => {
      const svg = svgOf({ ...profile, topRepos: [] }, config());
      expect(svg).toContain('Your project galaxy appears here');
      expect(orbits(svg)).toHaveLength(0);
      expect(svg).not.toContain('NaN');
    });

    it('draws nothing at all when the projects section is switched off', () => {
      const svg = svgOf(profile, config({ blocks: ['stats'] }));
      expect(orbits(svg)).toHaveLength(0);
      expect(svg).not.toContain('appears here');
    });
  });

  it('names the planets in the alt text only when they are drawn', () => {
    expect(renderProfile(profile, config()).readme).toContain('one planet for each project: alpha, beta, gamma, delta');
    expect(renderProfile(profile, config({ blocks: ['stats'] })).readme).not.toContain('planet');
    expect(renderProfile({ ...profile, topRepos: [] }, config()).readme).not.toContain('planet');
  });

  describe('sky', () => {
    /** Stars are tiny white dots. Planet highlights are white too, but larger. */
    const stars = (svg: string) =>
      Array.from(parse(svg).getElementsByTagName('circle')).filter((c) => c.getAttribute('fill') === '#ffffff' && Number(c.getAttribute('r')) <= 1.6);

    it('is repeatable for the same user and different for another', () => {
      expect(svgOf(profile, config())).toBe(svgOf(profile, config()));
      const positions = (p: Profile) => stars(svgOf(p, config())).map((c) => `${c.getAttribute('cx')},${c.getAttribute('cy')}`).join(';');
      expect(positions(profile)).not.toBe(positions({ ...profile, login: 'someone-else' }));
    });

    it('has stars at night and none at dawn', () => {
      expect(stars(svgOf(profile, config(), 'dark')).length).toBe(70);
      expect(stars(svgOf(profile, config(), 'light'))).toHaveLength(0);
    });
  });

  it('animates orbits only when asked, and honours reduced motion', () => {
    expect(svgOf(profile, config())).toContain('@keyframes spin');
    expect(svgOf(profile, config())).toContain('prefers-reduced-motion');
    expect(svgOf(profile, config({ motion: false }))).not.toContain('@keyframes');
  });
});
