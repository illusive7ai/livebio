import { hslToHex, hueOf } from '../color';
import { assetPath } from '../readme';
import { variantsFor, type Variant } from '../themes';
import type { Config, Output, Profile, RepoSummary, Template } from '../types';
import { formatNumber, truncate, xmlEscape } from '../util';
import { FONT, FONT_SANS, SAFE_DATA_URI, describeProfile, imageReadme, rise, seeded } from './shared';

const WIDTH = 900;
const PAD = 36;
export const MAX_PLANETS = 6;
const FIRST_ORBIT = 76;
const ORBIT_STEP = 28;
const MIN_PLANET = 5;
const MAX_PLANET = 18;
const SUN = 34;
const GOLDEN_ANGLE = 137.508;
/** Seconds for one lap of the innermost orbit, and how much longer each further orbit takes. */
const BASE_PERIOD = 22;
const PERIOD_STEP = 11;
const LEGEND_ROW = 48;

export interface Planet {
  name: string;
  stars: number;
  forks: number;
  language: string | null;
  /** Distance from the sun in pixels. */
  orbit: number;
  /** Radius of the planet in pixels. */
  size: number;
  /** Where the planet starts on its orbit, in degrees. */
  angle: number;
  /** Seconds for one lap. */
  period: number;
  moons: number;
}

/** One moon from the first fork, two from ten, three from a hundred. */
export function moonsFor(forks: number): number {
  if (forks >= 100) return 3;
  if (forks >= 10) return 2;
  return forks >= 1 ? 1 : 0;
}

/**
 * Plans the galaxy. The most-starred repository gets the innermost orbit, and a planet's size
 * follows the square root of its stars, so one huge project does not shrink the rest to dots.
 * Start angles are spread by the golden angle, which keeps neighbours from lining up.
 */
export function layoutGalaxy(repos: ReadonlyArray<RepoSummary>): Planet[] {
  const shown = [...repos].sort((a, b) => b.stars - a.stars || a.name.localeCompare(b.name)).slice(0, MAX_PLANETS);
  const peak = Math.max(...shown.map((repo) => repo.stars), 1);
  return shown.map((repo, index) => ({
    name: repo.name,
    stars: repo.stars,
    forks: repo.forks,
    language: repo.language,
    orbit: FIRST_ORBIT + index * ORBIT_STEP,
    size: MIN_PLANET + Math.sqrt(repo.stars / peak) * (MAX_PLANET - MIN_PLANET),
    angle: (index * GOLDEN_ANGLE) % 360,
    period: BASE_PERIOD + index * PERIOD_STEP,
    moons: moonsFor(repo.forks),
  }));
}

/** The same language always gets the same hue, so colours mean something across profiles. */
export function languageHue(language: string): number {
  let hash = 2166136261;
  for (const char of language.toLowerCase()) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  return hash % 360;
}

const num = (value: number): string => String(Math.round(value * 10) / 10 || 0);

interface Look {
  skyTop: string;
  skyBottom: string;
  fg: string;
  muted: string;
  glow: string;
  ring: string;
  none: string;
}

function lookFor(variant: Variant, hue: number): Look {
  const dark = variant === 'dark';
  return {
    skyTop: dark ? hslToHex(hue, 0.5, 0.05) : hslToHex(hue, 0.6, 0.96),
    skyBottom: dark ? hslToHex((hue + 25) % 360, 0.5, 0.13) : hslToHex((hue + 25) % 360, 0.7, 0.88),
    fg: dark ? '#eef0ff' : '#1d2140',
    muted: dark ? '#9aa0c8' : '#5b6190',
    glow: hslToHex(hue, 0.9, dark ? 0.55 : 0.6),
    ring: dark ? '#9aa0c8' : '#5b6190',
    none: dark ? '#8b93b8' : '#7a82a6',
  };
}

function renderSvg(profile: Profile, config: Config, variant: Variant): string {
  const look = lookFor(variant, hueOf(profile.avatar?.grid.tint) ?? 225);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const colorOf = (language: string | null): string =>
    language ? hslToHex(languageHue(language), 0.72, variant === 'dark' ? 0.62 : 0.44) : look.none;
  const parts: string[] = [];
  let step = 0;
  const next = () => step++ * 0.1;

  // Header: the name on the left, the headline numbers on the right.
  const subline = [profile.name ? `@${profile.login}` : '', config.text.headline ? truncate(config.text.headline, 46) : ''].filter(Boolean);
  let header = `<text x="${PAD}" y="${PAD + 24}" font-size="28" font-weight="800" fill="${look.fg}">${xmlEscape(truncate(profile.name ?? profile.login, 28))}</text>`;
  if (subline.length > 0) {
    header += `<text x="${PAD}" y="${PAD + 46}" font-size="14" fill="${look.muted}">${xmlEscape(subline.join('  ·  '))}</text>`;
  }
  if (blocks.has('stats')) {
    const stats: Array<[string, string]> = [
      [formatNumber(profile.publicRepos), 'REPOS'],
      [formatNumber(profile.totalStars), 'STARS'],
      [formatNumber(profile.followers), 'FOLLOWERS'],
    ];
    stats.forEach(([value, caption], index) => {
      const x = WIDTH - PAD - (stats.length - 1 - index) * 104;
      header +=
        `<text x="${x}" y="${PAD + 22}" text-anchor="end" font-size="22" font-weight="800" fill="${look.fg}">${xmlEscape(value)}</text>` +
        `<text class="mono" x="${x}" y="${PAD + 40}" text-anchor="end" font-size="10" letter-spacing="1.2" fill="${look.muted}">${caption}</text>`;
    });
  }
  parts.push(rise(header, motion, next()));
  let cursor = PAD + 64;
  let bottom = cursor;

  const planets = blocks.has('projects') ? layoutGalaxy(profile.topRepos) : [];

  if (planets.length > 0) {
    const reach = Math.max(...planets.map((p) => p.orbit + p.size + (p.moons > 0 ? p.size + 8 : 0))) + 12;
    const cx = PAD + reach + 4;
    const cy = cursor + 8 + reach;
    const legendX = cx + reach + 36;
    const legendWidth = WIDTH - PAD - legendX;

    // The sun is the profile picture, or an initial when there is none.
    const uri = profile.avatar?.dataUri;
    const hasPhoto = Boolean(uri && SAFE_DATA_URI.test(uri));
    const initial = [...(profile.name ?? profile.login)][0]?.toUpperCase() ?? '?';
    const sun =
      `<circle class="sun" cx="${cx}" cy="${cy}" r="${SUN * 2.6}" fill="url(#sun)"/>` +
      (hasPhoto && uri
        ? `<clipPath id="face"><circle cx="${cx}" cy="${cy}" r="${SUN}"/></clipPath>` +
          `<image href="${uri}" x="${cx - SUN}" y="${cy - SUN}" width="${SUN * 2}" height="${SUN * 2}" preserveAspectRatio="xMidYMid slice" clip-path="url(#face)"/>`
        : `<circle cx="${cx}" cy="${cy}" r="${SUN}" fill="${look.glow}"/>` +
          `<text x="${cx}" y="${cy + 12}" text-anchor="middle" font-size="34" font-weight="800" fill="#ffffff">${xmlEscape(initial)}</text>`) +
      `<circle cx="${cx}" cy="${cy}" r="${SUN + 3}" fill="none" stroke="${look.glow}" stroke-width="2"/>`;

    const rings = planets
      .map((p) => `<circle cx="${cx}" cy="${cy}" r="${p.orbit}" fill="none" stroke="${look.ring}" stroke-opacity="0.22" stroke-dasharray="2 5"/>`)
      .join('');

    const bodies = planets
      .map((p) => {
        const color = colorOf(p.language);
        const px = cx + p.orbit;
        const moons = Array.from({ length: p.moons }, (_v, k) => {
          const distance = p.size + 6 + k * 3;
          return (
            `<g transform="rotate(${num((360 / p.moons) * k)})">` +
            `<g class="moon" style="animation-duration:${num(3.5 + k * 1.3)}s"><circle cx="${num(distance)}" cy="0" r="2.2" fill="${look.fg}" fill-opacity="0.85"/></g></g>`
          );
        }).join('');
        return (
          `<g transform="rotate(${num(p.angle)} ${cx} ${cy})">` +
          `<g class="orbit" style="transform-origin:${cx}px ${cy}px;animation-duration:${p.period}s">` +
          `<g transform="translate(${num(px)} ${cy})">` +
          `<circle r="${num(p.size)}" fill="${color}"/>` +
          `<circle cx="${num(-p.size * 0.3)}" cy="${num(-p.size * 0.3)}" r="${num(p.size * 0.42)}" fill="#ffffff" fill-opacity="0.22"/>` +
          moons +
          `</g></g></g>`
        );
      })
      .join('');

    parts.push(rise(rings + sun + bodies, motion, next()));

    // Legend: which planet is which, and how to read the picture.
    const legendTop = cy - (planets.length * LEGEND_ROW) / 2 - 24;
    const rows = planets
      .map((p, index) => {
        const y = legendTop + index * LEGEND_ROW;
        const meta = [`★ ${formatNumber(p.stars)}`, p.language, p.forks > 0 ? `${formatNumber(p.forks)} forks` : null]
          .filter((v): v is string => Boolean(v))
          .join('  ·  ');
        return (
          `<circle cx="${legendX + 6}" cy="${num(y + 6)}" r="6" fill="${colorOf(p.language)}"/>` +
          `<text x="${legendX + 20}" y="${num(y + 11)}" font-size="14.5" font-weight="700" fill="${look.fg}">${xmlEscape(truncate(p.name, Math.max(8, Math.floor((legendWidth - 20) / 8.4))))}</text>` +
          `<text class="mono" x="${legendX + 20}" y="${num(y + 29)}" font-size="11.5" fill="${look.muted}">${xmlEscape(truncate(meta, Math.floor((legendWidth - 20) / 6.9)))}</text>`
        );
      })
      .join('');
    const keyY = legendTop + planets.length * LEGEND_ROW + 14;
    const key = ['size shows stars', 'closest to the sun is most starred', 'a moon is a fork: 1, 10+, 100+']
      .map((line, index) => `<text class="mono" x="${legendX}" y="${num(keyY + index * 17)}" font-size="11" fill="${look.muted}" fill-opacity="0.85">${xmlEscape(line)}</text>`)
      .join('');
    parts.push(rise(rows + key, motion, next()));
    bottom = Math.max(cy + reach, keyY + 3 * 17);
  } else if (blocks.has('projects')) {
    // A galaxy needs repositories. Say so plainly rather than draw an empty sky.
    const top = cursor + 20;
    parts.push(
      rise(
        `<text x="${WIDTH / 2}" y="${top + 60}" text-anchor="middle" font-size="16" font-weight="700" fill="${look.fg}">Your project galaxy appears here</text>` +
          `<text x="${WIDTH / 2}" y="${top + 86}" text-anchor="middle" font-size="13" fill="${look.muted}">Each planet is one of your most-starred public repositories.</text>`,
        motion,
        next(),
      ),
    );
    bottom = top + 120;
  }
  cursor = bottom + 28;

  if (blocks.has('languages') && profile.languages.length > 0) {
    const text = profile.languages.slice(0, 4).map((l) => `${truncate(l.name, 14)} ${l.percent}%`).join('   ');
    parts.push(
      rise(
        `<text class="mono" x="${PAD}" y="${num(cursor)}" font-size="12.5" fill="${look.muted}">written in  <tspan fill="${look.fg}">${xmlEscape(text)}</tspan></text>`,
        motion,
        next(),
      ),
    );
    cursor += 24;
  }

  const height = Math.ceil(cursor + PAD - 18);
  const random = seeded(profile.login);
  const stars =
    variant === 'dark'
      ? Array.from({ length: 70 }, () => {
          const x = random() * WIDTH;
          const y = random() * height;
          const r = 0.4 + random() * 1.1;
          const o = 0.2 + random() * 0.6;
          return `<circle cx="${num(x)}" cy="${num(y)}" r="${num(r)}" fill="#ffffff" fill-opacity="${num(o)}"/>`;
        }).join('')
      : '';

  const css = motion
    ? `.rise{animation:rise .6s ease both}
@keyframes rise{from{opacity:0}}
.orbit{animation:spin 30s linear infinite}
.moon{transform-origin:0 0;animation:spin 4s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.sun{animation:glow 5s ease-in-out infinite}
@keyframes glow{50%{opacity:.55}}
@media (prefers-reduced-motion:reduce){.rise,.orbit,.moon,.sun{animation:none}}`
    : '';
  const title = `${profile.name ?? profile.login} (@${profile.login}) on GitHub`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}" role="img" aria-labelledby="t">
<title id="t">${xmlEscape(title)}</title>
<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${look.skyTop}"/><stop offset="1" stop-color="${look.skyBottom}"/></linearGradient>
<radialGradient id="sun"><stop offset="0" stop-color="${look.glow}" stop-opacity="${variant === 'dark' ? 0.55 : 0.4}"/><stop offset="1" stop-color="${look.glow}" stop-opacity="0"/></radialGradient>
</defs>
<style>
text{font-family:${FONT_SANS}}
.mono{font-family:${FONT}}
${css}
</style>
<rect width="${WIDTH}" height="${height}" rx="20" fill="url(#sky)"/>
${stars}
${parts.filter(Boolean).join('\n')}
</svg>
`;
}

export const galaxy: Template = {
  id: 'galaxy',
  name: 'Repo galaxy',
  description: 'Your projects as planets around your profile picture: bigger for more stars, moons for forks, slowly orbiting.',
  tags: ['image', 'space', 'projects', 'animated'],
  needsAvatar: true,
  render(profile, config): Output {
    const assets = variantsFor(config.theme).map((variant) => ({
      path: assetPath('galaxy', variant),
      content: renderSvg(profile, config, variant),
    }));
    const planets = config.blocks.includes('projects') ? layoutGalaxy(profile.topRepos) : [];
    const extra =
      planets.length > 0 ? `a galaxy with one planet for each project: ${planets.map((p) => p.name).join(', ')}` : undefined;
    return { readme: imageReadme(profile, config, 'galaxy', WIDTH, describeProfile(profile, config, extra)), assets };
  },
};
