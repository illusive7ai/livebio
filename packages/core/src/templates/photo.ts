import type { Profile } from '../types';
import { xmlEscape } from '../util';
import { initialOf } from './make';
import { SAFE_DATA_URI } from './shared';

/** Shared parts for the designs that treat the profile picture as a photograph: filters, crops and tiles. */

const channel = (hex: string, index: 0 | 1 | 2): number => Number.parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16) / 255;
const round = (value: number): string => String(Math.round(value * 1000) / 1000);

/** Greyscale of a colour value, the weights the eye uses, as a row of a colour matrix. */
const LUMA = '.299 .587 .114 0 0';

/**
 * Maps a picture's brightness onto a run of colours, dark to light. With two colours this is a duotone; with
 * more it is a heat map. Every pixel's colour depends only on its brightness.
 */
export function gradientMap(id: string, stops: ReadonlyArray<string>): string {
  const table = (index: 0 | 1 | 2) => stops.map((hex) => round(channel(hex, index))).join(' ');
  return (
    `<filter id="${id}" color-interpolation-filters="sRGB" x="0" y="0" width="100%" height="100%">` +
    `<feColorMatrix type="matrix" values="${LUMA} ${LUMA} ${LUMA} 0 0 0 1 0"/>` +
    `<feComponentTransfer><feFuncR type="table" tableValues="${table(0)}"/><feFuncG type="table" tableValues="${table(1)}"/><feFuncB type="table" tableValues="${table(2)}"/></feComponentTransfer>` +
    `</filter>`
  );
}

/** Keeps one colour channel of a picture and drops the others, for an RGB split. */
export function channelFilter(id: string, keep: ReadonlyArray<0 | 1 | 2>): string {
  const row = (index: 0 | 1 | 2) => [0, 1, 2].map((c) => (keep.includes(index) && c === index ? 1 : 0)).join(' ') + ' 0 0';
  return `<filter id="${id}" color-interpolation-filters="sRGB" x="0" y="0" width="100%" height="100%"><feColorMatrix type="matrix" values="${row(0)} ${row(1)} ${row(2)} 0 0 0 1 0"/></filter>`;
}

/**
 * One ink of a print: the picture turned into a single colour whose strength follows how dark (or, with
 * `light`, how bright) each pixel is. Two of these slightly out of line make a two-colour print.
 */
export function inkFilter(id: string, hex: string, o: { light?: boolean; gain?: number; bias?: number } = {}): string {
  const gain = o.gain ?? 1;
  const bias = o.bias ?? 1;
  const sign = o.light ? 1 : -1;
  const alpha = [0.299, 0.587, 0.114].map((w) => round(sign * gain * w)).join(' ');
  return (
    `<filter id="${id}" color-interpolation-filters="sRGB" x="0" y="0" width="100%" height="100%">` +
    `<feColorMatrix type="matrix" values="0 0 0 0 ${round(channel(hex, 0))} 0 0 0 0 ${round(channel(hex, 1))} 0 0 0 0 ${round(channel(hex, 2))} ${alpha} 0 ${round(o.light ? -bias : bias)}"/>` +
    `</filter>`
  );
}

export interface PhotoOptions {
  filter?: string;
  rx?: number;
  /** Enlarges the picture inside its box. 1 shows all of it. */
  zoom?: number;
  /** Where the enlarged picture is centred, from 0 (left or top) to 1 (right or bottom). */
  focus?: [number, number];
  /** Colours of the stand-in tile used when there is no picture. */
  tile?: { fill: string; ink: string };
  blend?: string;
  opacity?: number;
  /** Draw the picture by reference to this id from `pictureDef`, so a design that shows it many times embeds it once. */
  ref?: string;
}

/** The picture's own size in points: its pixel grid, or a square when that is unknown. */
const naturalSize = (profile: Profile): [number, number] => {
  const grid = profile.avatar?.grid;
  return grid && grid.width > 0 && grid.height > 0 ? [grid.width, grid.height] : [1, 1];
};

/** The picture once, for the `defs` of a design that shows it several times. Empty when there is no safe picture. */
export function pictureDef(profile: Profile, id: string): string {
  const uri = profile.avatar?.dataUri;
  if (!uri || !SAFE_DATA_URI.test(uri)) return '';
  const [w, h] = naturalSize(profile);
  return `<image id="${id}" href="${uri}" width="${w}" height="${h}"/>`;
}

/** Where and how big to draw a picture of `nw` by `nh` so it covers the box (x, y, w, h) with its middle in the middle, as xMidYMid slice does. */
export function coverTransform(nw: number, nh: number, x: number, y: number, w: number, h: number): { tx: number; ty: number; scale: number } {
  const scale = Math.max(w / nw, h / nh);
  return { tx: x + (w - nw * scale) / 2, ty: y + (h - nh * scale) / 2, scale };
}

/** True when the profile has a picture that is safe to embed. */
export const hasPicture = (profile: Profile): boolean => Boolean(profile.avatar?.dataUri && SAFE_DATA_URI.test(profile.avatar.dataUri));

/**
 * The profile picture in a box, cropped by `zoom` and `focus`, with an optional filter. `id` names the clip and
 * must differ for every picture in one drawing. Without a picture, a plain tile with the first letter.
 */
export function photo(profile: Profile, x: number, y: number, w: number, h: number, id: string, o: PhotoOptions = {}): string {
  const rx = o.rx ?? 0;
  const uri = profile.avatar?.dataUri;
  if (uri && SAFE_DATA_URI.test(uri)) {
    const zoom = Math.max(1, o.zoom ?? 1);
    const [fx, fy] = o.focus ?? [0.5, 0.5];
    const iw = w * zoom;
    const ih = h * zoom;
    const ix = x - (iw - w) * Math.min(1, Math.max(0, fx));
    const iy = y - (ih - h) * Math.min(1, Math.max(0, fy));
    const style = [o.blend ? `mix-blend-mode:${o.blend}` : '', o.opacity !== undefined ? `opacity:${o.opacity}` : ''].filter(Boolean).join(';');
    if (o.ref) {
      const [nw, nh] = naturalSize(profile);
      const { tx, ty, scale } = coverTransform(nw, nh, ix, iy, iw, ih);
      // The clip sits on a group with no transform of its own, so it is in the same space as the box.
      return (
        `<clipPath id="${id}"><rect x="${round(x)}" y="${round(y)}" width="${round(w)}" height="${round(h)}" rx="${rx}"/></clipPath>` +
        `<g clip-path="url(#${id})"${o.filter ? ` filter="url(#${o.filter})"` : ''}${style ? ` style="${style}"` : ''}><use href="#${o.ref}" transform="translate(${round(tx)} ${round(ty)}) scale(${round(scale)})"/></g>`
      );
    }
    return (
      `<clipPath id="${id}"><rect x="${round(x)}" y="${round(y)}" width="${round(w)}" height="${round(h)}" rx="${rx}"/></clipPath>` +
      `<image href="${uri}" x="${round(ix)}" y="${round(iy)}" width="${round(iw)}" height="${round(ih)}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})"${o.filter ? ` filter="url(#${o.filter})"` : ''}${style ? ` style="${style}"` : ''}/>`
    );
  }
  const tile = o.tile ?? { fill: '#8884', ink: '#fff' };
  return (
    `<rect x="${round(x)}" y="${round(y)}" width="${round(w)}" height="${round(h)}" rx="${rx}" fill="${tile.fill}"/>` +
    `<text x="${round(x + w / 2)}" y="${round(y + h / 2 + Math.min(w, h) * 0.17)}" text-anchor="middle" font-size="${Math.round(Math.min(w, h) * 0.5)}" font-weight="800" fill="${tile.ink}">${xmlEscape(initialOf(profile))}</text>`
  );
}

/** How bright the picture is at a spot, 0 to 255, or null when there is no readable picture there. */
export function lumaAt(profile: Profile, u: number, v: number): number | null {
  const grid = profile.avatar?.grid;
  if (!grid || grid.width <= 0 || grid.height <= 0) return null;
  const gx = Math.min(grid.width - 1, Math.max(0, Math.floor(u * grid.width)));
  const gy = Math.min(grid.height - 1, Math.max(0, Math.floor(v * grid.height)));
  const index = gy * grid.width + gx;
  const luma = grid.luma[index];
  const alpha = grid.alpha[index] ?? 255;
  if (luma === undefined) return null;
  // A see-through pixel is as bright as the page behind it, which for a dot picture is paper.
  return alpha < 128 ? 255 : luma;
}

/** The darkest and brightest the picture really gets (ignoring the extreme 4% at each end), or null when it cannot be read. */
export function lumaRange(profile: Profile): [number, number] | null {
  const grid = profile.avatar?.grid;
  if (!grid) return null;
  const seen: number[] = [];
  grid.luma.forEach((value, i) => {
    if ((grid.alpha[i] ?? 255) >= 128) seen.push(value);
  });
  if (seen.length < 4) return null;
  seen.sort((a, b) => a - b);
  const lo = seen[Math.floor(seen.length * 0.04)]!;
  const hi = seen[Math.min(seen.length - 1, Math.floor(seen.length * 0.96))]!;
  return hi - lo < 8 ? null : [lo, hi];
}

/** Stretches a brightness so the picture's own darkest is 0 and its brightest 255. Unchanged without a range. */
export function stretchLuma(luma: number, range: [number, number] | null): number {
  if (!range) return luma;
  return Math.min(255, Math.max(0, ((luma - range[0]) / (range[1] - range[0])) * 255));
}
