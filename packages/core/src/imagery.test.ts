import { describe, expect, it } from 'vitest';
import { buildContributions } from './contributions';
import { HALFTONE_COLS, dotRadius, dotRows, masonry, tears } from './templates/imagery';
import { channelFilter, gradientMap, inkFilter, lumaAt, lumaRange, stretchLuma } from './templates/photo';
import { bare, profile, svgOf, wellFormed, year } from './testkit';
import type { Profile } from './types';

const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
/** A 4 by 2 picture: dark on the left, bright on the right, with one see-through corner. */
const withPicture: Profile = {
  ...profile,
  avatar: { dataUri: PNG, grid: { width: 4, height: 2, luma: [20, 60, 140, 220, 30, 70, 150, 230], alpha: [255, 255, 255, 255, 255, 255, 255, 0] } },
};
const dots = (svg: string): string[] => [...svg.matchAll(/<circle [^>]*r="([\d.]+)"/g)].map((m) => m[1]!);

describe('masonry', () => {
  it('puts each box in the shortest column so far', () => {
    const { slots, height } = masonry([100, 50, 50, 80], 2, 200, 10, 0, 0);
    expect(slots.map((s) => s.col)).toEqual([0, 1, 1, 0]);
    expect(slots[0]).toEqual({ x: 0, y: 0, col: 0 });
    expect(slots[1]).toEqual({ x: 210, y: 0, col: 1 });
    expect(slots[2]).toEqual({ x: 210, y: 60, col: 1 });
    expect(slots[3]).toEqual({ x: 0, y: 110, col: 0 });
    expect(height).toBe(190);
  });

  it('never lets two boxes in a column overlap', () => {
    const heights = [120, 80, 200, 64, 64, 90, 150, 40, 77];
    const { slots } = masonry(heights, 3, 100, 12);
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        if (slots[i]!.col !== slots[j]!.col) continue;
        const [a, b] = slots[i]!.y < slots[j]!.y ? [i, j] : [j, i];
        expect(slots[a]!.y + heights[a]!).toBeLessThanOrEqual(slots[b]!.y);
      }
    }
  });

  it('is only as tall as its tallest column, and has no height without boxes', () => {
    expect(masonry([30], 3, 50, 8, 0, 20).height).toBe(50);
    expect(masonry([], 3, 50, 8, 0, 20).height).toBe(20);
    expect(masonry([10, 10], 0, 50, 8).slots.map((s) => s.col)).toEqual([0, 0]);
  });

  it('starts at the left and top it is given', () => {
    expect(masonry([10], 2, 100, 5, 36, 92).slots[0]).toEqual({ x: 36, y: 92, col: 0 });
  });
});

describe('halftone dots', () => {
  it('fits a year of days in rows of 26', () => {
    expect(HALFTONE_COLS).toBe(26);
    expect(dotRows(371)).toBe(15);
    expect(dotRows(26)).toBe(1);
    expect(dotRows(27)).toBe(2);
    expect(dotRows(0)).toBe(1);
  });

  it('draws big dots where the picture is dark and small ones where it is bright', () => {
    expect(dotRadius(0, 10)).toBe(10);
    expect(dotRadius(255, 10)).toBe(1.2);
    expect(dotRadius(255, 10, 3)).toBe(3);
    const radii = [0, 50, 100, 150, 200, 255].map((l) => dotRadius(l, 10));
    expect(radii).toEqual([...radii].sort((a, b) => b - a));
    expect(dotRadius(-40, 10)).toBe(10);
    expect(dotRadius(900, 10)).toBe(1.2);
  });

  it('grows the dot smoothly with darkness, not in a jump', () => {
    expect(dotRadius(128, 10)).toBeCloseTo(5.53, 1);
    expect(dotRadius(64, 10)).toBeCloseTo(7.9, 0);
  });

  it('uses a middling dot when the picture cannot be read', () => {
    expect(dotRadius(null, 10)).toBe(5.5);
  });

  it('draws exactly one dot for each day, plus the five legend dots', () => {
    const days = year([...Array(40).fill(0), 3, 0, 9]).slice(-37);
    const p = { ...withPicture, contributions: buildContributions(days) };
    expect(dots(svgOf('halftone', p))).toHaveLength(37 + 5);
    expect(dots(svgOf('halftone', { ...p, contributions: buildContributions(days.slice(-1)) }))).toHaveLength(1 + 5);
  });

  it('draws a neutral picture and no legend when there is no calendar, and says why', () => {
    const svg = svgOf('halftone', withPicture, undefined);
    const noCalendar = svgOf('halftone', { ...withPicture, contributions: undefined });
    expect(dots(noCalendar)).toHaveLength(26 * 14);
    expect(noCalendar).toContain('after the first automatic update');
    expect(noCalendar).not.toContain('LEVEL');
    expect(svgOf('halftone', withPicture, ['stats'])).toContain('switched off');
    expect(svg).toContain('One dot for each day');
  });

  it('colours a dot by how active its day was, and only by that', () => {
    const days = year([0, 1, 4, 8, 20]).slice(-5);
    const svg = svgOf('halftone', { ...withPicture, contributions: buildContributions(days) });
    const fills = [...svg.matchAll(/<circle [^>]*fill="(#[0-9a-f]{6})"/g)].map((m) => m[1]!).slice(0, 5);
    expect(new Set(fills).size).toBe(new Set(days.map((d) => d.level)).size);
  });
});

describe('reading the picture', () => {
  it('finds how bright it is at a spot, treating see-through as paper', () => {
    expect(lumaAt(withPicture, 0, 0)).toBe(20);
    expect(lumaAt(withPicture, 0.99, 0)).toBe(220);
    expect(lumaAt(withPicture, 0, 0.99)).toBe(30);
    expect(lumaAt(withPicture, 0.99, 0.99)).toBe(255);
    expect(lumaAt(withPicture, 5, -3)).toBe(220);
  });

  it('has no brightness without a picture', () => {
    expect(lumaAt(profile, 0.5, 0.5)).toBeNull();
    expect(lumaAt({ ...withPicture, avatar: { dataUri: PNG, grid: { width: 0, height: 0, luma: [], alpha: [] } } }, 0.5, 0.5)).toBeNull();
  });

  it('stretches the picture so its own darkest and brightest use the whole range', () => {
    const range = lumaRange(withPicture);
    expect(range).not.toBeNull();
    expect(stretchLuma(range![0], range)).toBe(0);
    expect(stretchLuma(range![1], range)).toBe(255);
    expect(stretchLuma(range![0] - 50, range)).toBe(0);
    expect(stretchLuma(range![1] + 50, range)).toBe(255);
    expect(stretchLuma(100, null)).toBe(100);
  });

  it('ignores see-through pixels and refuses a flat picture', () => {
    const flat: Profile = { ...withPicture, avatar: { dataUri: PNG, grid: { width: 4, height: 1, luma: [100, 101, 102, 103], alpha: [255, 255, 255, 255] } } };
    expect(lumaRange(flat)).toBeNull();
    const seeThrough: Profile = { ...withPicture, avatar: { dataUri: PNG, grid: { width: 4, height: 1, luma: [0, 255, 0, 255], alpha: [0, 0, 0, 0] } } };
    expect(lumaRange(seeThrough)).toBeNull();
    expect(lumaRange(profile)).toBeNull();
  });
});

describe('filters', () => {
  it('maps brightness onto the colours given, dark to light', () => {
    const f = gradientMap('x', ['#000000', '#ff8000', '#ffffff']);
    expect(f).toContain('<feFuncR type="table" tableValues="0 1 1"/>');
    expect(f).toContain('<feFuncG type="table" tableValues="0 0.502 1"/>');
    expect(f).toContain('<feFuncB type="table" tableValues="0 0 1"/>');
    expect(f).toContain('id="x"');
  });

  it('keeps only the channels asked for', () => {
    const red = channelFilter('r', [0]);
    expect(red).toContain('values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0"');
    const cyan = channelFilter('c', [1, 2]);
    expect(cyan).toContain('values="0 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0"');
  });

  it('prints an ink strongest where the picture is dark, or where it is bright when asked', () => {
    const dark = inkFilter('a', '#ff0000');
    expect(dark).toContain('-0.299 -0.587 -0.114 0 1"');
    expect(dark).toContain('values="0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 -0.299 -0.587 -0.114 0 1"');
    const bright = inkFilter('b', '#0000ff', { light: true, gain: 2, bias: 0.5 });
    expect(bright).toContain('0.598 1.174 0.228 0 -0.5"');
  });
});

describe('glitch tears', () => {
  it('are the same for the same person and different for another', () => {
    expect(tears('octo', 7, 420)).toEqual(tears('octo', 7, 420));
    expect(tears('octo', 7, 420)).not.toEqual(tears('hubot', 7, 420));
  });

  it('are never zero wide for any login', () => {
    for (let n = 0; n < 300; n++) for (const t of tears(`user-${n}`, 7, 420)) expect(t.dx).not.toBe(0);
  });

  it('stay inside the picture, are never zero wide and are in order from top to bottom', () => {
    for (const login of ['a', 'octo', 'a-much-longer-login']) {
      const list = tears(login, 7, 420);
      expect(list).toHaveLength(7);
      for (const t of list) {
        expect(t.y).toBeGreaterThanOrEqual(0);
        expect(t.y + t.h).toBeLessThanOrEqual(420);
        expect(t.dx).not.toBe(0);
        expect(Math.abs(t.dx)).toBeLessThanOrEqual(28);
      }
      expect(list.map((t) => t.y)).toEqual([...list.map((t) => t.y)].sort((a, b) => a - b));
    }
  });
});

describe('moodboard', () => {
  it('pins four crops of the picture when there is one, and one tile when there is not', () => {
    const count = (svg: string) => [...svg.matchAll(/<clipPath id="mb\d"/g)].length;
    expect(count(svgOf('moodboard', withPicture))).toBe(4);
    expect(count(svgOf('moodboard', profile))).toBe(0);
    expect([...svgOf('moodboard', profile).matchAll(/>O</g)]).toHaveLength(1);
  });

  it('shows the real languages, stars, followers and at most three projects', () => {
    const svg = svgOf('moodboard', withPicture);
    expect(svg).toContain('>Go<');
    expect(svg).toContain('>Zig<');
    expect(svg).toContain('★ 777');
    expect(svg).toContain('>1,234<');
    expect(svg).toContain('>alpha<');
    expect(svg).toContain('>gamma<');
    expect(svg).not.toContain('>epsilon<');
    expect(svg).not.toContain('>delta<');
  });

  it('leaves out each pin whose data is missing or switched off', () => {
    expect(svgOf('moodboard', withPicture, ['languages', 'projects'])).not.toContain('★ 777');
    expect(svgOf('moodboard', withPicture, ['stats', 'projects'])).not.toContain('PALETTE');
    expect(svgOf('moodboard', withPicture, ['stats', 'languages'])).not.toContain('>alpha<');
    expect(svgOf('moodboard', { ...withPicture, bio: null })).not.toContain('class="serif" font-style="italic"');
  });
});

describe('riso print', () => {
  it('prints the real numbers as stamps and the real languages in lower case', () => {
    const svg = svgOf('riso', withPicture);
    expect(svg).toContain('>777<');
    expect(svg).toContain('>1,234<');
    expect(svg).toContain('go / rust / zig');
    expect(svgOf('riso', withPicture, ['languages'])).not.toContain('>777<');
    expect(svgOf('riso', withPicture, ['stats'])).not.toContain('go / rust');
  });

  it('keeps even a very long name inside the poster', () => {
    const svg = svgOf('riso', { ...withPicture, name: 'Maximilian Alexander Wolfgang' });
    const sizes = [...svg.matchAll(/font-size="(\d+)"[^>]*class="serif"/g)].map((m) => Number(m[1]));
    expect(Math.max(...sizes)).toBeLessThanOrEqual(36);
    const short = [...svgOf('riso', { ...withPicture, name: 'Ada' }).matchAll(/font-size="(\d+)"[^>]*class="serif"/g)].map((m) => Number(m[1]));
    expect(Math.max(...short)).toBe(70);
    expect(svg).toContain('MAXIMILIAN ALEX…');
  });
});

describe('glitch portrait', () => {
  it('writes only real figures and drops each line whose section is off', () => {
    const p = { ...withPicture, contributions: buildContributions(year([4, 4])) };
    const svg = svgOf('glitch', p);
    expect(svg).toContain('followers ..... 1,234');
    expect(svg).toContain('contributions . 8');
    expect(svgOf('glitch', p, ['stats'])).not.toContain('contributions');
    expect(svgOf('glitch', p, ['activity', 'languages'])).not.toContain('followers');
    expect(svgOf('glitch', p)).toContain('languages ..... Go, Rust, Zig');
  });

  it('draws seven torn slices', () => {
    expect([...svgOf('glitch', withPicture).matchAll(/<clipPath id="gl-t\d-c"/g)]).toHaveLength(7);
  });
});

describe('thermal cam', () => {
  it('reports the real peak day, and nothing when there is no activity to report', () => {
    const days = year([2, 0, 11, 3]).slice(-4);
    const svg = svgOf('thermal', { ...withPicture, contributions: buildContributions(days) });
    expect(svg).toContain(`11 on ${days[2]!.date}`);
    expect(svgOf('thermal', { ...withPicture, contributions: buildContributions(year([]).slice(-30)) })).not.toContain('PEAK DAY');
    expect(svgOf('thermal', { ...withPicture, contributions: undefined })).not.toContain('PEAK DAY');
    expect(svgOf('thermal', withPicture, ['stats'])).not.toContain('PEAK DAY');
  });

  it('says what its colours mean', () => {
    expect(svgOf('thermal', withPicture)).toContain('not any temperature');
  });
});

describe('every image design', () => {
  const ids = ['moodboard', 'riso', 'glitch', 'thermal', 'halftone'];
  it.each(ids)('%s draws for a hostile and a bare profile, with and without a picture', (id) => {
    const hostile: Profile = { ...withPicture, name: '</text><script>x</script>"&', bio: '</text><script>x</script>', languages: [{ name: '"><b>', percent: 100 }] };
    for (const p of [hostile, withPicture, profile, bare]) {
      const svg = svgOf(id, p);
      expect(wellFormed(svg), id).toEqual([]);
      expect(svg).not.toContain('<script>');
      expect(svg).not.toMatch(/NaN|undefined|Infinity/);
    }
  });

  it.each(ids)('%s is drawn in both modes without motion and with it', (id) => {
    for (const variant of ['dark', 'light'] as const) expect(wellFormed(svgOf(id, withPicture, undefined, variant))).toEqual([]);
  });
});

import { coverTransform, pictureDef, photo } from './templates/photo';
import { renderProfile } from './render';
import { defaultConfig } from './config';

describe('a picture shown many times is embedded once', () => {
  const embeds = (svg: string) => [...svg.matchAll(/data:image\/png/g)].length;
  const uses = (svg: string) => [...svg.matchAll(/<use href="#av"/g)].length;
  const days = Array.from({ length: 365 }, (_v, i) => ({ date: new Date(Date.UTC(2025, 5, 11 + i)).toISOString().slice(0, 10), count: i % 5, level: (i % 5 === 0 ? 0 : 2) as 0 | 2 }));
  const full: Profile = { ...withPicture, contributions: buildContributions(days) };

  it.each([
    ['moodboard', 4],
    ['riso', 2],
    ['glitch', 9],
    ['contact', 12],
    ['booth', 4],
  ])('%s draws it %i times from a single copy', (id, times) => {
    const svg = svgOf(id, full);
    expect(embeds(svg)).toBe(1);
    expect(uses(svg)).toBe(times);
    expect(svg).toContain('<image id="av"');
  });

  it('keeps those designs small even with a real-sized picture', () => {
    const big = 'data:image/png;base64,' + 'A'.repeat(30_000);
    const p = { ...full, avatar: { dataUri: big, grid: full.avatar!.grid } };
    for (const id of ['moodboard', 'riso', 'glitch', 'contact', 'booth']) expect(svgOf(id, p).length, id).toBeLessThan(80_000);
  });

  it('draws a stand-in tile and embeds nothing when there is no picture', () => {
    for (const id of ['moodboard', 'riso', 'glitch', 'contact', 'booth']) {
      const svg = svgOf(id, { ...full, avatar: undefined });
      expect(embeds(svg), id).toBe(0);
      expect(svg, id).not.toContain('<use href="#av"');
      expect(wellFormed(svg), id).toEqual([]);
    }
  });

  it('does not use a picture that is not a safe PNG or JPEG', () => {
    const evil = { ...full, avatar: { dataUri: 'data:image/svg+xml;base64,PHN2Zz48c2NyaXB0Pg==', grid: full.avatar!.grid } };
    for (const id of ['moodboard', 'riso', 'glitch', 'contact', 'booth']) expect(svgOf(id, evil), id).not.toContain('data:image/svg');
    expect(pictureDef(evil, 'av')).toBe('');
  });

  it('with motion on, still embeds it once', () => {
    const svg = renderProfile(full, { ...defaultConfig('octo', 'glitch'), theme: 'dark', motion: true }).assets.find((a) => a.path.endsWith('glitch-dark.svg'))!.content;
    expect(embeds(svg)).toBe(1);
  });
});

describe('covering a box with a picture', () => {
  it('scales it to fill the box and centres it, cropping what overflows', () => {
    // A wide picture in a square box: the height fills it and the sides are cropped equally.
    expect(coverTransform(128, 64, 10, 20, 100, 100)).toEqual({ tx: -40, ty: 20, scale: 1.5625 });
    // A tall picture: the width fills it and the top and bottom are cropped equally.
    expect(coverTransform(64, 128, 0, 0, 100, 100)).toEqual({ tx: 0, ty: -50, scale: 1.5625 });
    // A square picture in a square box needs no cropping.
    expect(coverTransform(128, 128, 5, 5, 64, 64)).toEqual({ tx: 5, ty: 5, scale: 0.5 });
  });
  it('uses the picture’s own proportions, and clips the group it draws it in', () => {
    const wide: Profile = { ...withPicture, avatar: { dataUri: PNG, grid: { width: 128, height: 64, luma: [], alpha: [] } } };
    expect(pictureDef(wide, 'av')).toContain('width="128" height="64"');
    const shared = photo(wide, 10, 20, 100, 100, 'p', { ref: 'av' });
    expect(shared).toContain('transform="translate(-40 20) scale(1.563)"');
    expect(shared).toContain('<g clip-path="url(#p)"');
    expect(pictureDef(withPicture, 'av')).toContain('width="4" height="2"');
  });
  it('always covers the whole box', () => {
    for (const [nw, nh, w, h] of [[128, 64, 100, 100], [50, 200, 300, 120], [128, 128, 33, 77], [1, 1, 10, 10]] as const) {
      const { tx, ty, scale } = coverTransform(nw, nh, 0, 0, w, h);
      expect(tx).toBeLessThanOrEqual(1e-9);
      expect(ty).toBeLessThanOrEqual(1e-9);
      expect(tx + nw * scale).toBeGreaterThanOrEqual(w - 1e-9);
      expect(ty + nh * scale).toBeGreaterThanOrEqual(h - 1e-9);
    }
  });
  it('uses the same crop as drawing the picture directly, apart from the reference', () => {
    const direct = photo(withPicture, 10, 20, 100, 100, 'p', { zoom: 2, focus: [0.25, 0.75] });
    const shared = photo(withPicture, 10, 20, 100, 100, 'p', { zoom: 2, focus: [0.25, 0.75], ref: 'av' });
    // The picture is twice the box, and its focus 25% across and 75% down puts it 25% and 75% of the extra 100 out of place.
    expect(direct).toContain('x="-15" y="-55" width="200" height="200"');
    expect(shared).toContain('<use href="#av"');
    expect(shared).not.toContain('data:image');
    expect(shared).toContain('<clipPath id="p"><rect x="10" y="20" width="100" height="100" rx="0"/></clipPath>');
  });
});
