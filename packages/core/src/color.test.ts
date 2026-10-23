import { describe, expect, it } from 'vitest';
import { FALLBACK_ACCENTS, accentColors, hslToHex, rgbToHsl } from './color';

describe('colour conversion', () => {
  it.each([
    [255, 0, 0, '#ff0000'],
    [0, 255, 0, '#00ff00'],
    [0, 0, 255, '#0000ff'],
    [255, 255, 0, '#ffff00'],
    [128, 128, 128, '#808080'],
  ])('round-trips rgb(%i, %i, %i)', (r, g, b, hex) => {
    const [h, s, l] = rgbToHsl(r, g, b);
    expect(hslToHex(h, s, l)).toBe(hex);
  });

  it('finds the hue of primary colours', () => {
    expect(rgbToHsl(255, 0, 0)[0]).toBe(0);
    expect(rgbToHsl(0, 255, 0)[0]).toBe(120);
    expect(rgbToHsl(0, 0, 255)[0]).toBe(240);
  });

  it('gives greys no saturation', () => {
    expect(rgbToHsl(90, 90, 90)[1]).toBe(0);
  });
});

describe('accentColors', () => {
  it('uses the fallback set when the picture has no colour', () => {
    expect(accentColors(undefined, 'dark')).toBe(FALLBACK_ACCENTS.dark);
    expect(accentColors(undefined, 'light')).toBe(FALLBACK_ACCENTS.light);
  });

  it('builds five valid colours around the picture hue', () => {
    const colors = accentColors([200, 30, 30], 'dark');
    expect(colors).toHaveLength(5);
    for (const color of colors) expect(color).toMatch(/^#[0-9a-f]{6}$/);
    expect(colors[0]).toMatch(/^#[ef]/); // a red tint stays red
  });

  it('gives different results for different tints and for light and dark', () => {
    expect(accentColors([200, 30, 30], 'dark')).not.toEqual(accentColors([30, 30, 200], 'dark'));
    expect(accentColors([200, 30, 30], 'dark')).not.toEqual(accentColors([200, 30, 30], 'light'));
  });
});
