import { accentColors, hslToHex } from '../color';
import { assetPath } from '../readme';
import { variantsFor, type Variant } from '../themes';
import type { Config, Output, Profile, Template } from '../types';
import { xmlEscape } from '../util';
import { W } from './kit';
import { FONT, FONT_SANS, FONT_SERIF, SAFE_DATA_URI, describeProfile, imageReadme } from './shared';

/** Shared parts for the designs that are a single picture with a look of its own. */

export interface MakeOptions {
  needsAvatar?: boolean;
  /** True when the design draws the activity section, so its alt text may mention contributions. */
  activity?: boolean;
  /** What the picture shows beyond the numbers, for its alt text. Say only what it really draws. */
  extra?: (profile: Profile, config: Config) => string | undefined;
}

export function imageTemplate(
  id: string,
  name: string,
  description: string,
  tags: string[],
  svg: (profile: Profile, config: Config, variant: Variant) => string,
  options: MakeOptions = {},
): Template {
  return {
    id,
    name,
    description,
    tags,
    needsAvatar: options.needsAvatar ?? true,
    render(profile, config): Output {
      const assets = variantsFor(config.theme).map((variant) => ({ path: assetPath(id, variant), content: svg(profile, config, variant) }));
      const alt = describeProfile(profile, config, options.extra?.(profile, config), { activity: options.activity ?? false });
      return { readme: imageReadme(profile, config, id, W, alt), assets };
    },
  };
}

export interface Doc {
  height: number;
  title: string;
  bg: string;
  stroke?: string;
  radius?: number;
  css?: string;
  defs?: string;
  body: string;
}

/** A picture with no frame of its own beyond a background: the design draws everything else. */
export function svgDoc(d: Doc): string {
  const r = d.radius ?? 14;
  const height = Math.ceil(d.height);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${height}" viewBox="0 0 ${W} ${height}" role="img" aria-labelledby="t">
<title id="t">${xmlEscape(d.title)}</title>
<defs>
${d.defs ?? ''}
</defs>
<style>
text{font-family:${FONT_SANS}}
.mono{font-family:${FONT}}
.serif{font-family:${FONT_SERIF}}
${d.css ?? ''}
</style>
<rect width="${W}" height="${height}" rx="${r}" fill="${d.bg}"/>
${d.body}
${d.stroke ? `<rect x="0.5" y="0.5" width="${W - 1}" height="${height - 1}" rx="${r}" fill="none" stroke="${d.stroke}"/>` : ''}
</svg>
`;
}

/** A repeatable number from a piece of text, so a design's "random" choices never change between runs. */
export function hashOf(text: string): number {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  return h;
}

/** A colour for a language that is always the same one, whoever's profile it is on. */
export function langColor(name: string, variant: Variant): string {
  return hslToHex(hashOf(name.toLowerCase()) % 360, 0.62, variant === 'dark' ? 0.6 : 0.42);
}

/** YYYY-MM-DD from an ISO timestamp, or null when it is missing or not a real date. Never guesses. */
export function isoDate(iso: string | null | undefined): string | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

/** Five colours around the profile picture's own colour, or a fixed set when it has none. */
export function accents(profile: Profile, variant: Variant): string[] {
  return accentColors(profile.avatar?.grid.tint, variant);
}

export const initialOf = (profile: Profile): string => [...(profile.name ?? profile.login)][0]?.toUpperCase() ?? '?';

/**
 * The profile picture in a box, or a coloured tile with the first letter when there is no picture. `id` names the
 * clip, so it must be different for every picture in one drawing.
 */
export function pictureBox(profile: Profile, fill: string, ink: string, x: number, y: number, w: number, h: number, rx: number, id: string): string {
  const uri = profile.avatar?.dataUri;
  if (uri && SAFE_DATA_URI.test(uri)) {
    return (
      `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"/></clipPath>` +
      `<image href="${uri}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})"/>`
    );
  }
  return (
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"/>` +
    `<text x="${x + w / 2}" y="${y + h / 2 + Math.min(w, h) * 0.17}" text-anchor="middle" font-size="${Math.round(Math.min(w, h) * 0.5)}" font-weight="800" fill="${ink}">${xmlEscape(initialOf(profile))}</text>`
  );
}

/** Whole years between two ISO timestamps, or null when either is missing, invalid or in the wrong order. */
export function yearsBetween(from: string | null | undefined, to: string | null | undefined): number | null {
  if (!from || !to) return null;
  const a = Date.parse(from);
  const b = Date.parse(to);
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return null;
  return Math.floor((b - a) / (365.25 * 86_400_000));
}
