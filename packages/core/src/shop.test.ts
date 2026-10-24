import { describe, expect, it } from 'vitest';
import { buildContributions } from './contributions';
import { defaultConfig } from './config';
import { renderProfile } from './render';
import { belt, boothFacts, bumperRadius, bumpers, liquidHeight, slotCode, stock } from './templates/shop';
import { bare, profile, svgOf, wellFormed, year } from './testkit';
import type { Profile } from './types';

const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
const withPicture: Profile = { ...profile, avatar: { dataUri: PNG, grid: { width: 1, height: 1, luma: [128], alpha: [255] } } };
const words = (svg: string) => svg.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
const ALL = new Set(['stats', 'activity', 'languages', 'projects', 'city', 'game']);
const only = (...keep: string[]) => new Set(keep);

/** The dark picture of a design with its animation switched on, which the shared test kit leaves off. */
function moving(id: string, p: Profile): string {
  return renderProfile(p, { ...defaultConfig('octo', id), theme: 'dark', motion: true }).assets.find((a) => a.path.endsWith(`${id}-dark.svg`))!.content;
}

describe('potion levels', () => {
  it('fill a bottle by its share of the whole', () => {
    expect(liquidHeight(100, 146)).toBe(146);
    expect(liquidHeight(50, 146)).toBe(73);
    expect(liquidHeight(25, 100)).toBe(25);
  });
  it('show a trace for any share above nothing, and nothing for none', () => {
    expect(liquidHeight(0.1, 146)).toBe(4);
    expect(liquidHeight(2, 146)).toBeCloseTo(4, 0);
    expect(liquidHeight(0, 146)).toBe(0);
    expect(liquidHeight(-5, 146)).toBe(0);
    expect(liquidHeight(Number.NaN, 146)).toBe(0);
  });
  it('never go over the top, and grow with the share', () => {
    expect(liquidHeight(140, 146)).toBe(146);
    const levels = [1, 5, 20, 40, 80, 100].map((p) => liquidHeight(p, 146));
    expect(levels).toEqual([...levels].sort((a, b) => a - b));
  });
  it('are drawn for each language, with the real percentage on its label', () => {
    const svg = svgOf('potions', withPicture);
    expect([...svg.matchAll(/<clipPath id="pot\d"/g)]).toHaveLength(3);
    for (const text of ['>60%<', '>30%<', '>10%<', '>Go<', '>Rust<', '>Zig<']) expect(svg).toContain(text);
    // 60%, 30% and 10% of the 146 points of room inside a bottle.
    for (const h of ['87.6', '43.8', '14.6']) expect(svg).toContain(`height="${h}"`);
  });
  it('fill at most six bottles', () => {
    const many = { ...withPicture, languages: Array.from({ length: 9 }, (_v, i) => ({ name: `L${i}`, percent: 10 })) };
    expect([...svgOf('potions', many).matchAll(/<clipPath id="pot\d"/g)]).toHaveLength(6);
  });
  it('leave the shelf bare, and say why, without the languages section, and hide the numbers without statistics', () => {
    expect(words(svgOf('potions', withPicture, ['stats']))).toContain('Switch on Languages');
    expect(svgOf('potions', withPicture, ['languages'])).not.toContain('777 stars');
    expect(svgOf('potions', withPicture, ['stats'])).toContain('777 stars');
  });
  it('bubbles only with motion, and only in a bottle with enough in it to bubble', () => {
    expect(svgOf('potions', withPicture)).not.toContain('class="bub"');
    // Three bubbles for each bottle holding more than 14 of its 146 points: all three here.
    expect([...moving('potions', withPicture).matchAll(/class="bub"/g)]).toHaveLength(9);
    const shallow = { ...withPicture, languages: [{ name: 'Go', percent: 60 }, { name: 'Zig', percent: 5 }] };
    expect([...moving('potions', shallow).matchAll(/class="bub"/g)]).toHaveLength(3);
    expect(moving('potions', withPicture)).toContain('prefers-reduced-motion');
  });
});

describe('vending slots', () => {
  it('are lettered by row and numbered along it', () => {
    expect([0, 1, 3, 4, 7, 8, 11].map((i) => slotCode(i))).toEqual(['A1', 'A2', 'A4', 'B1', 'B4', 'C1', 'C4']);
    expect(slotCode(5, 3)).toBe('B3');
  });
  it('are stocked with the most starred first, ties by name, and at most twelve', () => {
    const repos = ['b', 'a', 'c', 'd'].map((name, i) => ({ ...profile.topRepos[0]!, name, stars: i === 0 || i === 1 ? 5 : i }));
    // a and b both have 5 stars, so they go in name order; then d with 3 and c with 2.
    expect(stock(repos).map((r) => r.name)).toEqual(['a', 'b', 'd', 'c']);
    expect(stock(Array.from({ length: 20 }, (_v, i) => ({ ...profile.topRepos[0]!, name: `r${i}`, stars: i }))).length).toBe(12);
    expect(stock([])).toEqual([]);
  });
  it('does not rearrange the list it is given', () => {
    const repos = [...profile.topRepos];
    stock(repos);
    expect(repos.map((r) => r.name)).toEqual(profile.topRepos.map((r) => r.name));
  });
  it('sell each project at its star count under its code, marking the most starred', () => {
    const svg = svgOf('vending', withPicture);
    expect(svg).toContain('>A1  ★ 500<');
    expect(svg).toContain('>A2  ★ 200<');
    expect(svg).toContain('>B1  ★ 1<');
    expect([...svg.matchAll(/>TOP</g)]).toHaveLength(1);
    expect(svg).toContain('>★ 777<');
  });
  it('shows no credit without statistics, no stock without projects, and no TOP when nothing is starred', () => {
    expect(svgOf('vending', withPicture, ['projects'])).toContain('>READY<');
    expect(words(svgOf('vending', withPicture, ['stats']))).toContain('Switch on Top projects');
    expect(svgOf('vending', { ...withPicture, topRepos: profile.topRepos.map((r) => ({ ...r, stars: 0 })) })).not.toContain('>TOP<');
    expect(words(svgOf('vending', { ...withPicture, topRepos: [] }))).toContain('Out of stock');
  });
});

describe('pinball bumpers', () => {
  it('grow with stars on a log scale between the smallest and largest size', () => {
    expect(bumperRadius(0, 500)).toBe(20);
    expect(bumperRadius(500, 500)).toBe(34);
    expect(bumperRadius(900, 500)).toBe(34);
    expect(bumperRadius(5, 0)).toBe(20);
    expect(bumperRadius(50, 500)).toBe(28.9);
    expect(bumperRadius(50, 500)).toBeGreaterThan(bumperRadius(50, 5000));
  });
  it('are at most six, the most starred in the best spot, all inside the table and clear of each other', () => {
    const many = Array.from({ length: 10 }, (_v, i) => ({ ...profile.topRepos[0]!, name: `r${i}`, stars: i * 10 }));
    const list = bumpers(many, 340, 500);
    expect(list).toHaveLength(6);
    expect(list[0]!.repo.name).toBe('r9');
    expect([list[0]!.x, list[0]!.y]).toEqual([170, 100]);
    for (const b of list) {
      expect(b.x - b.r).toBeGreaterThan(0);
      expect(b.x + b.r).toBeLessThan(340);
      expect(b.y - b.r).toBeGreaterThan(0);
      expect(b.y + b.r).toBeLessThan(500);
    }
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) expect(Math.hypot(list[i]!.x - list[j]!.x, list[i]!.y - list[j]!.y)).toBeGreaterThan(list[i]!.r + list[j]!.r + 8);
  });
  it('are none for no projects', () => {
    expect(bumpers([], 340, 500)).toEqual([]);
  });
  it('draw one bumper for each project, score the real stars, and send a ball round only with motion', () => {
    const svg = svgOf('pinball', withPicture);
    expect([...svg.matchAll(/stroke="#fff" stroke-width="3"/g)]).toHaveLength(5);
    expect(svg).toContain('>777<');
    expect(svg).not.toContain('animateMotion');
    expect([...moving('pinball', withPicture).matchAll(/<animateMotion/g)]).toHaveLength(1);
    expect(moving('pinball', withPicture)).toContain('prefers-reduced-motion');
    expect(svgOf('pinball', withPicture, ['projects'])).toContain('>- - -<');
    expect(words(svgOf('pinball', withPicture, ['stats']))).toContain('Switch on Top projects');
  });
});

describe('sushi belt layout', () => {
  it('has nothing for no plates', () => {
    expect(belt(0, 820, 150)).toEqual({ count: 0, xs: [], loop: 0 });
  });
  it('moves by exactly one round of the plates to start over where it began', () => {
    for (const n of [1, 2, 3, 5, 8]) expect(belt(n, 820, 150).loop).toBe(n * 150);
  });
  it('spaces plates evenly and always has enough to fill the belt, even half way through a loop', () => {
    for (const n of [1, 2, 3, 5, 8]) {
      const { count, xs, loop } = belt(n, 820, 150);
      expect(xs).toHaveLength(count);
      xs.forEach((x, i) => expect(x).toBe(i * 150));
      expect((count - 1) * 150 - loop).toBeGreaterThanOrEqual(820);
    }
  });
  it('draws the plates, cycling through the projects, priced in stars', () => {
    const svg = svgOf('sushi', withPicture);
    expect(svg).toContain('>alpha<');
    expect(svg).toContain('>★ 500<');
    expect([...svg.matchAll(/>alpha</g)].length).toBeGreaterThanOrEqual(1);
    expect(words(svgOf('sushi', withPicture, ['stats']))).toContain('Switch on Top projects');
    expect(words(svgOf('sushi', { ...withPicture, topRepos: [] }))).toContain('The belt is empty');
  });
  it('sets the belt moving by exactly its loop distance, and only with motion', () => {
    expect(svgOf('sushi', withPicture)).not.toContain('class="belt"');
    const m = moving('sushi', withPicture);
    expect(m).toContain('class="belt"');
    expect(m).toContain(`--loop:${-5 * 150}px`);
    expect(m).toContain('prefers-reduced-motion');
  });
});

describe('photo booth facts', () => {
  it('are real, with the right singular and plural', () => {
    expect(boothFacts(profile, ALL)).toEqual(['23 repositories', '★ 777 stars', '1,234 followers', '7 years on GitHub']);
    expect(boothFacts({ ...profile, publicRepos: 1, totalStars: 1, followers: 1 }, ALL).slice(0, 3)).toEqual(['1 repository', '★ 1 star', '1 follower']);
    expect(boothFacts({ ...profile, createdAt: '2025-06-10T00:00:00Z' }, ALL).at(-1)).toBe('1 year on GitHub');
  });
  it('say since when for an account under a year old, and nothing about age when it cannot be read', () => {
    expect(boothFacts({ ...profile, createdAt: '2026-03-01T00:00:00Z' }, ALL).at(-1)).toBe('on GitHub since 2026');
    expect(boothFacts({ ...profile, createdAt: 'nonsense' }, ALL)).toHaveLength(3);
    expect(boothFacts({ ...profile, fetchedAt: undefined }, ALL).at(-1)).toBe('on GitHub since 2019');
  });
  it('leave out the numbers when statistics are off', () => {
    expect(boothFacts(profile, only('languages'))).toEqual(['7 years on GitHub']);
    expect(boothFacts({ ...profile, createdAt: 'nonsense' }, only())).toEqual([]);
  });
});

describe('photo booth', () => {
  it('prints four poses, each in its own treatment, with the first three real facts and the age', () => {
    const svg = svgOf('booth', withPicture);
    expect([...svg.matchAll(/<clipPath id="bt\d"/g)]).toHaveLength(4);
    expect(svg).toContain('filter="url(#duo)"');
    expect(svg).toContain('filter="url(#bw)"');
    expect(svg).toContain('filter="url(#sepia)"');
    for (const t of ['23 repositories', '★ 777 stars', '1,234 followers', '7 years on GitHub']) expect(svg).toContain(`>${t}<`);
  });
  it('still prints four poses, uncaptioned, with nothing to caption them with', () => {
    const svg = svgOf('booth', { ...withPicture, createdAt: 'nonsense' }, ['languages']);
    expect([...svg.matchAll(/<clipPath id="bt\d"/g)]).toHaveLength(4);
    expect(svg).not.toContain('followers');
    expect(svg).not.toContain('repositories<');
  });
  it('blinks the bulbs only with motion', () => {
    expect(svgOf('booth', withPicture)).not.toContain('class="bulb');
    expect(moving('booth', withPicture)).toContain('class="bulb');
    expect(moving('booth', withPicture)).toContain('prefers-reduced-motion');
  });
});

describe('every shop design', () => {
  const ids = ['potions', 'vending', 'pinball', 'sushi', 'booth'];
  it.each(ids)('%s draws for hostile, bare and picture-less profiles, with any calendar, in both modes', (id) => {
    const hostile: Profile = { ...withPicture, name: '</text><script>x</script>"&', login: 'a-b', languages: [{ name: '"><b>', percent: 100 }], topRepos: [{ ...profile.topRepos[0]!, name: '</text><script>', language: '"><b>', forks: 5, pushedAt: '2026-06-02T00:00:00Z' }] };
    const calendars = [undefined, buildContributions(year([])), buildContributions(year([5]))];
    for (const variant of ['dark', 'light'] as const) {
      for (const p of [hostile, withPicture, profile, bare, { ...withPicture, topRepos: [] }, { ...withPicture, languages: [] }]) {
        for (const contributions of calendars) {
          const svg = svgOf(id, { ...p, contributions }, undefined, variant);
          expect(wellFormed(svg), id).toEqual([]);
          expect(svg).not.toContain('<script>');
          expect(svg).not.toMatch(/NaN|undefined|Infinity/);
        }
      }
    }
  });
  it.each(ids)('%s is well formed with motion on', (id) => {
    expect(wellFormed(moving(id, withPicture))).toEqual([]);
    expect(wellFormed(moving(id, { ...withPicture, topRepos: [], languages: [] }))).toEqual([]);
  });
});
