import type { Variant } from './themes';

/** Converts 0-255 RGB to hue (0-360), saturation and lightness (0-1). */
export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === rn) h = ((gn - bn) / d) % 6;
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
}

/** Converts hue (0-360), saturation and lightness (0-1) to a #rrggbb string. */
export function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const sector = Math.floor((((h % 360) + 360) % 360) / 60);
  const [r, g, b] = [
    [c, x, 0],
    [x, c, 0],
    [0, c, x],
    [0, x, c],
    [x, 0, c],
    [c, 0, x],
  ][sector] ?? [0, 0, 0];
  const hex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${hex(r ?? 0)}${hex(g ?? 0)}${hex(b ?? 0)}`;
}

/** The hue (0-360) of a picture's tint, or undefined when the picture has no colour. */
export function hueOf(tint: [number, number, number] | undefined): number | undefined {
  return tint ? rgbToHsl(tint[0], tint[1], tint[2])[0] : undefined;
}

/** Colours used when a picture has no usable tint, such as a greyscale photo. */
export const FALLBACK_ACCENTS: Record<Variant, string[]> = {
  dark: ['#3fb950', '#58a6ff', '#bc8cff', '#e3b341', '#39c5cf'],
  light: ['#1a7f37', '#0969da', '#8250df', '#9a6700', '#1b7c83'],
};

/**
 * Five accent colours. With a tint they are spread around the picture's own hue, so a red
 * avatar gives a warm banner and a blue one a cool banner. Without one they come from the
 * fallback set.
 */
export function accentColors(tint: [number, number, number] | undefined, variant: Variant): string[] {
  if (!tint) return FALLBACK_ACCENTS[variant];
  const [hue] = rgbToHsl(tint[0], tint[1], tint[2]);
  const lightness = variant === 'dark' ? 0.62 : 0.42;
  return [0, 38, -38, 90, -90].map((offset) => hslToHex((hue + offset + 360) % 360, 0.72, lightness));
}
