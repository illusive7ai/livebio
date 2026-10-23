import { describe, expect, it } from 'vitest';
import { RAMP, asciiPortrait, gridFromRgba } from './avatar';
import type { PixelGrid } from './types';
import { wrap } from './util';

/** A bright disc fading to dark at its edge, on a fully transparent square. */
function disc(size: number): PixelGrid {
  const luma: number[] = [];
  const alpha: number[] = [];
  const c = (size - 1) / 2;
  const radius = size * 0.45;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - c, y - c);
      if (d > radius) {
        luma.push(0);
        alpha.push(0);
      } else {
        luma.push(255 * (1 - d / radius));
        alpha.push(255);
      }
    }
  }
  return { width: size, height: size, luma, alpha };
}

const density = (char: string | undefined) => RAMP.indexOf(char ?? ' ');

describe('asciiPortrait', () => {
  it('keeps a square picture roughly square in characters', () => {
    const rows = asciiPortrait(disc(64), 40, 'dark');
    expect(rows).toHaveLength(24); // 40 columns * 0.6 (character shape)
    expect(Math.max(...rows.map((r) => r.length))).toBeLessThanOrEqual(40);
  });

  it('leaves transparent corners empty', () => {
    const rows = asciiPortrait(disc(64), 40, 'dark');
    expect(rows[0]).toBe(''); // blank rows are trimmed to nothing
    expect(rows[rows.length - 1]).toBe('');
    expect(rows.every((row) => row === '' || !row.startsWith('@'))).toBe(true);
  });

  it('is densest where the picture is brightest on dark, and sparsest there on light', () => {
    const dark = asciiPortrait(disc(64), 40, 'dark');
    const light = asciiPortrait(disc(64), 40, 'light');
    const middle = (rows: string[]) => rows[Math.floor(rows.length / 2)]!.charAt(20);
    expect(density(middle(dark))).toBeGreaterThanOrEqual(RAMP.length - 3);
    expect(density(middle(light))).toBeLessThanOrEqual(2);
  });

  it('only uses characters that are safe in XML and Markdown', () => {
    for (const row of asciiPortrait(disc(64), 40, 'dark')) expect(row).toMatch(/^[ .:\-=+*#%@]*$/);
  });

  it('uses a flat mid tone for a picture with no contrast instead of failing', () => {
    const flat: PixelGrid = { width: 8, height: 8, luma: Array(64).fill(100), alpha: Array(64).fill(255) };
    const rows = asciiPortrait(flat, 8, 'dark');
    expect(rows.length).toBeGreaterThan(0);
    expect(new Set(rows.join('').replace(/ /g, '')).size).toBe(1);
  });

  it('handles a picture smaller than the requested width', () => {
    expect(() => asciiPortrait(disc(4), 40, 'dark')).not.toThrow();
  });
});

describe('gridFromRgba', () => {
  it('computes brightness and keeps transparency', () => {
    const rgba = [255, 255, 255, 255, 0, 0, 0, 255, 255, 0, 0, 0];
    const grid = gridFromRgba(rgba, 3, 1);
    expect(grid.luma[0]).toBeCloseTo(255);
    expect(grid.luma[1]).toBe(0);
    expect(grid.alpha).toEqual([255, 255, 0]);
  });
});

describe('tint', () => {
  const solid = (r: number, g: number, b: number, n = 100) => Array.from({ length: n }, () => [r, g, b, 255]).flat();

  it('finds the colour of a vivid picture', () => {
    expect(gridFromRgba(solid(200, 40, 40), 10, 10).tint).toEqual([200, 40, 40]);
  });

  it('has no tint for a greyscale picture', () => {
    expect(gridFromRgba(solid(120, 120, 120), 10, 10).tint).toBeUndefined();
  });

  it('ignores near-black pixels and transparent ones', () => {
    expect(gridFromRgba(solid(20, 5, 5), 10, 10).tint).toBeUndefined();
    const clear = Array.from({ length: 100 }, () => [200, 40, 40, 0]).flat();
    expect(gridFromRgba(clear, 10, 10).tint).toBeUndefined();
  });

  it('ignores a tiny splash of colour in an otherwise grey picture', () => {
    const pixels = [...solid(120, 120, 120, 99), 255, 0, 0, 255];
    expect(gridFromRgba(pixels, 10, 10).tint).toBeUndefined();
  });
});

describe('wrap', () => {
  it('breaks on words and respects the width', () => {
    expect(wrap('one two three four', 9, 5)).toEqual(['one two', 'three', 'four']);
  });

  it('ends the last line with an ellipsis when text is cut', () => {
    const lines = wrap('alpha beta gamma delta epsilon', 11, 2);
    expect(lines).toHaveLength(2);
    expect(lines[1]!.endsWith('…')).toBe(true);
    expect(lines.every((l) => l.length <= 11)).toBe(true);
  });

  it('cuts at a word boundary, never in the middle of a word', () => {
    const lines = wrap('Security researcher building offensive and defensive tools for education', 24, 2);
    expect(lines).toEqual(['Security researcher', 'building offensive and…'].map((l, i) => lines[i] ?? l));
    const last = lines[1]!;
    expect(last.endsWith('…')).toBe(true);
    const words = last.slice(0, -1).split(' ');
    for (const word of words) expect('building offensive and defensive tools for education').toContain(word);
  });

  it('shortens a single word that is too long', () => {
    expect(wrap('x'.repeat(30), 10, 2)[0]).toHaveLength(10);
  });

  it('returns nothing for empty text', () => {
    expect(wrap('   ', 10, 3)).toEqual([]);
  });
});
