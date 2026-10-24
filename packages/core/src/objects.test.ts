import { describe, expect, it } from 'vitest';
import { buildContributions } from './contributions';
import { allocate, blobRadii, drawCards, flakes, perforations } from './templates/objects';
import { langColor } from './templates/make';
import { bare, profile, svgOf, wellFormed, year } from './testkit';
import type { ContributionDay, Profile } from './types';

const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
const withPicture: Profile = { ...profile, avatar: { dataUri: PNG, grid: { width: 1, height: 1, luma: [128], alpha: [255] } } };
const day = (date: string, count: number, level?: 0 | 1 | 2 | 3 | 4): ContributionDay => ({ date, count, level: level ?? ((count === 0 ? 0 : Math.min(4, Math.ceil(count / 3))) as 0 | 1 | 2 | 3 | 4) });
const withDays = (days: ContributionDay[], over: Partial<Profile> = {}): Profile => ({ ...withPicture, ...over, contributions: buildContributions(days) });
const words = (svg: string) => svg.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
const NOW = '2026-06-10T08:00:00Z';

describe('lava lamp blobs', () => {
  it('make the area of a blob follow the share, the biggest being the largest allowed', () => {
    expect(blobRadii([{ name: 'a', percent: 40 }, { name: 'b', percent: 10 }], 46, 10)).toEqual([46, 23]);
    expect(blobRadii([{ name: 'a', percent: 50 }, { name: 'b', percent: 25 }, { name: 'c', percent: 5 }], 40, 10)[0]).toBe(40);
  });
  it('never go below the smallest allowed, and grow with the share', () => {
    const r = blobRadii([{ name: 'a', percent: 90 }, { name: 'b', percent: 1 }], 46, 16);
    expect(r[1]).toBe(16);
    const many = blobRadii([100, 70, 40, 20, 5].map((percent, i) => ({ name: `l${i}`, percent })), 46, 8);
    expect(many).toEqual([...many].sort((a, b) => b - a));
  });
  it('give every blob the smallest size when no language has a share, and none for no languages', () => {
    expect(blobRadii([{ name: 'a', percent: 0 }], 46, 16)).toEqual([16]);
    expect(blobRadii([], 46, 16)).toEqual([]);
  });
  it('are drawn one for each language, in that language’s colour', () => {
    const svg = svgOf('lava', withPicture);
    const group = /<g filter="url\(#goo\)">([\s\S]*?)<\/g>/.exec(svg)![1]!;
    expect([...group.matchAll(/<circle /g)]).toHaveLength(3);
    for (const l of profile.languages) expect(group).toContain(`fill="${langColor(l.name, 'dark')}"`);
  });
  it('are left out with the languages section off, and the lamp says why', () => {
    const svg = svgOf('lava', withPicture, ['stats']);
    expect(/<g filter="url\(#goo\)">([\s\S]*?)<\/g>/.exec(svg)![1]).not.toContain('<circle');
    expect(words(svg)).toContain('Switch on Languages');
    expect(svgOf('lava', withPicture, ['languages'])).not.toContain('followers');
  });
});

describe('snow globe flakes', () => {
  const days = [day('2026-03-01', 1), day('2026-03-02', 0), day('2026-03-03', 4), day('2026-03-04', 20), day('2026-03-05', 0)];
  it('are one for every active day and none for a quiet one', () => {
    expect(flakes(days, 300, 230, 184)).toHaveLength(3);
    expect(flakes([day('2026-03-02', 0)], 300, 230, 184)).toEqual([]);
    expect(flakes([], 300, 230, 184)).toEqual([]);
  });
  it('stay inside the glass', () => {
    const many = Array.from({ length: 365 }, (_v, i) => day(new Date(Date.UTC(2025, 5, 11 + i)).toISOString().slice(0, 10), 1 + (i % 9)));
    for (const f of flakes(many, 300, 230, 184)) expect(Math.hypot(f.x - 300, f.y - 230)).toBeLessThanOrEqual(184 - 10 + 0.1);
  });
  it('are bigger on busier days', () => {
    const [a, b, c] = flakes(days, 0, 0, 100);
    expect(a!.r).toBeLessThan(b!.r);
    expect(b!.r).toBeLessThan(c!.r);
  });
  it('stay where the date puts them, whoever looks', () => {
    expect(flakes(days, 300, 230, 184)).toEqual(flakes(days, 300, 230, 184));
    const [first, second] = flakes([day('2026-03-01', 3), day('2026-03-02', 3)], 300, 230, 184);
    expect([first!.x, first!.y]).not.toEqual([second!.x, second!.y]);
  });
  it('fall for a few seconds each, starting at different points', () => {
    for (const f of flakes(days, 0, 0, 100)) {
      expect(f.duration).toBeGreaterThanOrEqual(9);
      expect(f.duration).toBeLessThan(17);
      expect(f.delay).toBeLessThanOrEqual(0);
      expect(f.delay).toBeGreaterThan(-f.duration - 1);
    }
  });
});

describe('snow globe', () => {
  const p = withDays([day('2026-03-01', 3), day('2026-03-02', 0), day('2026-03-03', 9), day('2026-03-04', 1)]);
  it('draws a flake for each active day and says how many', () => {
    const svg = svgOf('globe', p);
    expect([...svg.matchAll(/fill-opacity="0\.92"/g)]).toHaveLength(3);
    expect(words(svg)).toContain('3 snowflakes, one for every day you were active');
    expect(words(svgOf('globe', withDays([day('2026-03-01', 3)])))).toContain('1 snowflake, one for the day you were active');
  });
  it('lets the flakes fall only when there is motion', () => {
    expect(svgOf('globe', p)).not.toContain('class="fl"');
    const moving = svgOf('globe', p).length;
    expect(moving).toBeGreaterThan(0);
  });
  it('writes the total only when statistics are on, and waits without a calendar', () => {
    expect(words(svgOf('globe', p))).toContain('13 contributions in all');
    expect(words(svgOf('globe', p, ['activity']))).not.toContain('contributions in all');
    expect(words(svgOf('globe', { ...withPicture, contributions: undefined }))).toContain('after the first automatic update');
    expect(words(svgOf('globe', p, ['stats']))).toContain('switched off');
  });
});

describe('tarot cards', () => {
  const repos = profile.topRepos;
  it('are earned by the most stars, the newest push, the most forks and the longest quiet', () => {
    const forked = repos.map((r) => (r.name === 'gamma' ? { ...r, forks: 12 } : r));
    const cards = drawCards(forked, NOW);
    expect(cards.map((c) => [c.title, c.repo.name])).toEqual([
      ['THE STAR', 'alpha'],
      ['THE SUN', 'epsilon'],
      ['THE TOWER', 'gamma'],
      ['THE HERMIT', 'beta'],
    ]);
    expect(cards.map((c) => c.numeral)).toEqual(['XVII', 'XIX', 'XVI', 'IX']);
  });
  it('say the real fact that earned each one', () => {
    const cards = drawCards(repos.map((r) => (r.name === 'gamma' ? { ...r, forks: 1 } : r)), NOW);
    expect(cards[0]!.reason).toBe('Most starred: ★ 500');
    expect(cards[1]!.reason).toBe('Pushed to most recently: yesterday');
    expect(cards[2]!.reason).toBe('Most forked: 1 fork');
    expect(cards[3]!.reason).toBe('Quiet the longest: last pushed 2 years ago');
  });
  it('leave out a card nothing earns', () => {
    expect(drawCards(repos, NOW).map((c) => c.title)).toEqual(['THE STAR', 'THE SUN', 'THE HERMIT']);
    expect(drawCards(repos.map((r) => ({ ...r, stars: 0 })), NOW).map((c) => c.title)).not.toContain('THE STAR');
    expect(drawCards([repos[0]!], NOW).map((c) => c.title)).toEqual(['THE STAR', 'THE SUN']);
    expect(drawCards([repos[3]!], NOW).map((c) => c.title)).toEqual(['THE STAR']);
    expect(drawCards([], NOW)).toEqual([]);
  });
  it('write no time when the date of the data is missing', () => {
    expect(drawCards(repos, undefined).find((c) => c.title === 'THE SUN')!.reason).toBe('Pushed to most recently');
  });
  it('draw as many cards as are earned, and none without the projects section', () => {
    const svg = svgOf('tarot', withPicture);
    for (const t of ['THE STAR', 'THE SUN', 'THE HERMIT']) expect(svg).toContain(`>${t}<`);
    expect(svg).not.toContain('THE TOWER');
    expect(svgOf('tarot', withPicture, ['stats'])).not.toContain('THE STAR');
    expect(words(svgOf('tarot', withPicture, ['stats']))).toContain('Switch on Top projects');
    expect(words(svgOf('tarot', { ...withPicture, topRepos: [] }))).toContain('No project has earned a card yet');
  });
});

describe('stamp perforations', () => {
  it('run round all four edges with no hole twice', () => {
    const holes = perforations(10, 20, 150, 190, 11);
    expect(holes).toHaveLength(62);
    expect(new Set(holes.map(([x, y]) => `${x.toFixed(3)},${y.toFixed(3)}`)).size).toBe(62);
    for (const [x, y] of holes) expect(x === 10 || x === 160 || y === 20 || y === 210).toBe(true);
  });
  it('put a hole at every corner', () => {
    const holes = perforations(0, 0, 100, 100, 10);
    for (const corner of [[0, 0], [100, 0], [0, 100], [100, 100]]) expect(holes).toContainEqual(corner);
  });
  it('still draw a tiny stamp', () => {
    expect(perforations(0, 0, 4, 4, 11).length).toBeGreaterThanOrEqual(4);
  });
});

describe('stamp sheet', () => {
  it('prints a portrait and a stamp for each language, valued by its share', () => {
    const svg = svgOf('stamps', withPicture);
    expect([...svg.matchAll(/<rect x="[\d.]+" y="[\d.]+" width="150" height="190" fill="#fffdf6"/g)]).toHaveLength(4);
    for (const text of ['>60%<', '>30%<', '>10%<', '>GO<', '>RU<', '>ZI<', '>@octo<']) expect(svg).toContain(text);
    expect(svg).toContain('ISSUED SINCE 2019');
  });
  it('postmarks it with the date the data was read, and says nothing more without one', () => {
    expect(svgOf('stamps', withPicture)).toContain('>10 JUN<');
    expect(svgOf('stamps', withPicture)).toContain('>2026<');
    const none = svgOf('stamps', { ...withPicture, fetchedAt: undefined });
    expect(none).not.toContain('JUN');
    expect(none).toContain('>POST<');
  });
  it('prints only the portrait, and says why, without the languages section', () => {
    const svg = svgOf('stamps', withPicture, ['stats']);
    expect([...svg.matchAll(/width="150" height="190" fill="#fffdf6"/g)]).toHaveLength(1);
    expect(words(svg)).toContain('Switch on Languages');
    expect(svgOf('stamps', { ...withPicture, createdAt: 'nonsense' })).toContain('DEFINITIVE ISSUE');
  });
  it('prints at most six language stamps', () => {
    const many = { ...withPicture, languages: Array.from({ length: 9 }, (_v, i) => ({ name: `Lang${i}`, percent: 10 })) };
    expect([...svgOf('stamps', many).matchAll(/width="150" height="190" fill="#fffdf6"/g)]).toHaveLength(7);
  });
});

describe('allocate', () => {
  it('shares stickers out by the largest remainder', () => {
    expect(allocate([60, 30, 10], 27)).toEqual([16, 8, 3]);
    expect(allocate([1, 1, 1], 10)).toEqual([4, 3, 3]);
    expect(allocate([50, 50], 27)).toEqual([14, 13]);
  });
  it('always adds up to the total and is within one of the exact share', () => {
    let seed = 99;
    const random = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32;
    for (let n = 0; n < 300; n++) {
      const shares = Array.from({ length: 1 + Math.floor(random() * 8) }, () => Math.floor(random() * 100));
      const total = Math.floor(random() * 60);
      const counts = allocate(shares, total);
      const sum = shares.reduce((s, v) => s + v, 0);
      if (sum === 0 || total === 0) {
        expect(counts.every((c) => c === 0)).toBe(true);
        continue;
      }
      expect(counts.reduce((s, v) => s + v, 0)).toBe(total);
      counts.forEach((c, i) => expect(Math.abs(c - (shares[i]! / sum) * total)).toBeLessThan(1));
      shares.forEach((s, i) => s === 0 && expect(counts[i]).toBe(0));
    }
  });
  it('gives nothing to a language with no share, and treats negatives as none', () => {
    expect(allocate([10, 0, 10], 4)).toEqual([2, 0, 2]);
    expect(allocate([10, -5], 4)).toEqual([4, 0]);
  });
  it('copes with nothing to share', () => {
    expect(allocate([], 27)).toEqual([]);
    expect(allocate([5, 5], 0)).toEqual([0, 0]);
    expect(allocate([0, 0], 27)).toEqual([0, 0]);
  });
});

describe('cube', () => {
  const stickers = (svg: string) => [...svg.matchAll(/<path d="M[^"]*Z" fill="(#[0-9a-f]{6})" stroke="#0b0d12" stroke-width="3"/g)].map((m) => m[1]!);
  it('shows 27 stickers shared out by language, with the counts in the legend', () => {
    const svg = svgOf('cube', withPicture);
    const colours = stickers(svg);
    expect(colours).toHaveLength(27);
    expect(colours.filter((c) => c === langColor('Go', 'dark'))).toHaveLength(16);
    expect(colours.filter((c) => c === langColor('Rust', 'dark'))).toHaveLength(8);
    expect(colours.filter((c) => c === langColor('Zig', 'dark'))).toHaveLength(3);
    expect(svg).toContain('>16 of 27 stickers<');
  });
  it('shuffles them, the same way every time', () => {
    expect(stickers(svgOf('cube', withPicture))).toEqual(stickers(svgOf('cube', withPicture)));
    expect(stickers(svgOf('cube', withPicture))).not.toEqual([...stickers(svgOf('cube', withPicture))].sort());
    expect(stickers(svgOf('cube', { ...withPicture, login: 'someone-else' }))).not.toEqual(stickers(svgOf('cube', withPicture)));
  });
  it('draws the top face above the near corner and the side faces below it, as a cube is seen from above', () => {
    const paths = [...svgOf('cube', withPicture).matchAll(/<path d="(M[^"]*Z)" fill="#[0-9a-f]{6}" stroke="#0b0d12" stroke-width="3"/g)].map((m) => [...m[1]!.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)].map((p) => Number(p[2])));
    expect(paths).toHaveLength(27);
    // The three faces meet at (290, 250). The first nine stickers are the top face.
    for (const ys of paths.slice(0, 9)) expect(Math.max(...ys)).toBeLessThanOrEqual(250.01);
    for (const ys of paths.slice(9)) expect(Math.max(...ys)).toBeGreaterThanOrEqual(249.9);
    expect(Math.min(...paths.flat())).toBeCloseTo(250 - 6 * 26, 0);
  });

  it('keeps all faces inside the picture', () => {
    const xs = [...svgOf('cube', withPicture).matchAll(/M(-?[\d.]+) (-?[\d.]+)L/g)].map((m) => [Number(m[1]), Number(m[2])] as const);
    for (const [x, y] of xs.filter(([, y]) => y > 0 && y < 600)) {
      expect(x).toBeGreaterThan(0);
      expect(x).toBeLessThan(520);
      expect(y).toBeLessThan(520);
    }
  });
  it('is plain grey, and says why, without the languages section', () => {
    const svg = svgOf('cube', withPicture, ['stats']);
    const colours = stickers(svg);
    expect(colours).toHaveLength(27);
    expect(new Set(colours).size).toBe(1);
    expect(words(svg)).toContain('Switch on Languages');
  });
});

describe('every object design', () => {
  const ids = ['lava', 'globe', 'tarot', 'stamps', 'cube'];
  it.each(ids)('%s draws for hostile, bare and picture-less profiles, with any calendar, in both modes', (id) => {
    const hostile: Profile = { ...withPicture, name: '</text><script>x</script>"&', languages: [{ name: '"><b>', percent: 100 }], topRepos: [{ ...profile.topRepos[0]!, name: '</text><script>', language: '"><b>', forks: 5, pushedAt: '2026-06-02T00:00:00Z' }] };
    const calendars = [undefined, buildContributions(year([])), buildContributions(year([5])), buildContributions(year(Array.from({ length: 300 }, (_v, i) => (i * 7) % 11))), buildContributions([day('2026-03-01', 4)])];
    for (const variant of ['dark', 'light'] as const) {
      for (const p of [hostile, withPicture, profile, bare]) {
        for (const contributions of calendars) {
          const svg = svgOf(id, { ...p, contributions }, undefined, variant);
          expect(wellFormed(svg), id).toEqual([]);
          expect(svg).not.toContain('<script>');
          expect(svg).not.toMatch(/NaN|undefined|Infinity/);
        }
      }
    }
  });
});

import { defaultConfig } from './config';
import { renderProfile } from './render';

/** The dark picture of a design with its animation switched on, which the shared test kit leaves off. */
function moving(id: string, p: Profile): string {
  return renderProfile(p, { ...defaultConfig('octo', id), theme: 'dark', motion: true }).assets.find((a) => a.path.endsWith(`${id}-dark.svg`))!.content;
}

describe('the objects that move', () => {
  it('lets each wax blob rise and fall, and each flake drift down, only with motion on', () => {
    const lamp = moving('lava', withPicture);
    expect([...lamp.matchAll(/class="lv"/g)]).toHaveLength(3);
    expect(lamp).toContain('prefers-reduced-motion');
    expect(svgOf('lava', withPicture)).not.toContain('class="lv"');
    const p = withDays([day('2026-03-01', 3), day('2026-03-02', 0), day('2026-03-03', 9)]);
    const snow = moving('globe', p);
    expect([...snow.matchAll(/class="fl"/g)]).toHaveLength(2);
    expect(snow).toContain('prefers-reduced-motion');
  });
  it('floats the cube only with motion on', () => {
    expect(moving('cube', withPicture)).toContain('class="float"');
    expect(svgOf('cube', withPicture)).not.toContain('class="float"');
  });
});
