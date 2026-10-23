import { hslToHex, hueOf } from '../color';
import { busiestMonth } from '../contributions';
import { assetPath } from '../readme';
import { variantsFor, type Variant } from '../themes';
import type { Config, ContributionDay, Output, Profile, Template } from '../types';
import { formatNumber, truncate, xmlEscape } from '../util';
import { FONT, FONT_SANS, SAFE_DATA_URI, describeProfile, imageReadme, plural, rise, seeded } from './shared';

const WIDTH = 900;
const PAD = 36;

/** Isometric projection: a grid unit moves 30 degrees down and sideways on screen. */
const COS = Math.cos(Math.PI / 6);
const SIN = 0.5;
const ROWS = 7;
const MAX_CELL = 14;
const MAX_HEIGHT = 120;
const MIN_HEIGHT = 4;
/** Empty space around each building, as a share of its cell, so the city reads as separate towers. */
const GAP = 0.14;
const SLAB_DEPTH = 10;
const SLAB_MARGIN = 0.45;
/** Space kept above the tallest tower for its flag and date. */
const FLAG_ROOM = 46;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export interface Building {
  col: number;
  row: number;
  count: number;
  level: number;
  date: string;
  /** Height in pixels on screen. */
  height: number;
}

/**
 * Turns the contribution calendar into buildings. Weeks run along one street and weekdays along
 * the other, like GitHub's own graph. Days with no activity get no building, only the ground.
 * Buildings come back in drawing order: furthest from the viewer first, so nearer towers cover
 * the ones behind them.
 */
export function layoutCity(days: ReadonlyArray<ContributionDay>): { cols: number; buildings: Building[] } {
  if (days.length === 0) return { cols: 0, buildings: [] };
  const first = new Date(`${days[0]?.date}T00:00:00Z`).getUTCDay(); // weeks start on Sunday
  const cols = Math.ceil((first + days.length) / ROWS);
  const peak = Math.max(...days.map((day) => day.count), 1);

  const buildings: Building[] = [];
  days.forEach((day, index) => {
    if (day.count <= 0) return;
    buildings.push({
      col: Math.floor((first + index) / ROWS),
      row: (first + index) % ROWS,
      count: day.count,
      level: day.level,
      date: day.date,
      // Square-root scaling keeps quiet days visible next to a very busy one.
      height: MIN_HEIGHT + Math.sqrt(day.count / peak) * (MAX_HEIGHT - MIN_HEIGHT),
    });
  });
  buildings.sort((a, b) => a.col + a.row - (b.col + b.row) || a.col - b.col);
  return { cols, buildings };
}

const num = (value: number): string => String(Math.round(value * 10) / 10 || 0);

function shortDate(date: string): string {
  const [, month, day] = date.split('-');
  return `${MONTHS[Number(month) - 1] ?? ''} ${Number(day)}`.trim();
}

interface Look {
  skyTop: string;
  skyBottom: string;
  slabTop: string;
  slabSide: string;
  slabLine: string;
  fg: string;
  muted: string;
  glow: string;
  /** Face colours for activity levels 1 to 4. */
  faces: Array<{ top: string; left: string; right: string }>;
  peak: { top: string; left: string; right: string };
}

function lookFor(variant: Variant, hue: number): Look {
  const dark = variant === 'dark';
  const faces = [1, 2, 3, 4].map((level) => {
    const t = level / 4;
    const lightness = dark ? 0.3 + 0.34 * t : 0.72 - 0.34 * t;
    return {
      top: hslToHex(hue, 0.74, lightness),
      left: hslToHex(hue, 0.7, lightness - 0.08),
      right: hslToHex(hue, 0.66, lightness - 0.17),
    };
  });
  const peakHue = (hue + 42) % 360;
  const peakL = dark ? 0.68 : 0.46;
  return {
    skyTop: dark ? hslToHex(hue, 0.5, 0.07) : hslToHex(hue, 0.6, 0.95),
    skyBottom: dark ? hslToHex((hue + 22) % 360, 0.5, 0.17) : hslToHex((hue + 24) % 360, 0.75, 0.86),
    slabTop: dark ? hslToHex(hue, 0.3, 0.15) : hslToHex(hue, 0.25, 0.93),
    slabSide: dark ? hslToHex(hue, 0.3, 0.09) : hslToHex(hue, 0.2, 0.8),
    slabLine: dark ? hslToHex(hue, 0.4, 0.32) : hslToHex(hue, 0.3, 0.7),
    fg: dark ? '#eef0ff' : '#1d2140',
    muted: dark ? '#9aa0c8' : '#5b6190',
    glow: hslToHex(hue, 0.85, dark ? 0.5 : 0.7),
    faces,
    peak: {
      top: hslToHex(peakHue, 0.85, peakL),
      left: hslToHex(peakHue, 0.8, peakL - 0.08),
      right: hslToHex(peakHue, 0.75, peakL - 0.17),
    },
  };
}

function renderSvg(profile: Profile, config: Config, variant: Variant): string {
  const look = lookFor(variant, hueOf(profile.avatar?.grid.tint) ?? 215);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const parts: string[] = [];
  let step = 0;
  const next = () => step++ * 0.1;

  // Header: portrait, name, and the headline the user wrote. The numbers sit on the right.
  const uri = profile.avatar?.dataUri;
  const hasPhoto = Boolean(uri && SAFE_DATA_URI.test(uri));
  const textX = hasPhoto ? PAD + 64 : PAD;
  const subline = [
    profile.name ? `@${profile.login}` : '',
    config.text.headline ? truncate(config.text.headline, 46) : '',
  ].filter(Boolean);
  let header = '';
  if (hasPhoto && uri) {
    header +=
      `<clipPath id="face"><circle cx="${PAD + 24}" cy="${PAD + 24}" r="24"/></clipPath>` +
      `<image href="${uri}" x="${PAD}" y="${PAD}" width="48" height="48" preserveAspectRatio="xMidYMid slice" clip-path="url(#face)"/>` +
      `<circle cx="${PAD + 24}" cy="${PAD + 24}" r="26" fill="none" stroke="${look.glow}" stroke-width="2"/>`;
  }
  header += `<text x="${textX}" y="${PAD + 24}" font-size="28" font-weight="800" fill="${look.fg}">${xmlEscape(truncate(profile.name ?? profile.login, 26))}</text>`;
  if (subline.length > 0) {
    header += `<text x="${textX}" y="${PAD + 46}" font-size="14" fill="${look.muted}">${xmlEscape(subline.join('  ·  '))}</text>`;
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

  // The city.
  let cursor = PAD + 64;
  const wantsCity = blocks.has('activity');
  const activity = profile.contributions;
  const { cols, buildings } = layoutCity(activity?.days ?? []);

  if (wantsCity && activity && cols > 0) {
    const m = SLAB_MARGIN;
    const size = Math.min(MAX_CELL, (WIDTH - PAD * 2 - 8) / ((cols + ROWS + 2 * m) * COS));
    const ox = WIDTH / 2 - ((cols - ROWS) / 2) * COS * size;
    const peak = buildings.reduce((best, b) => (b.count > best.count || (b.count === best.count && b.date > best.date) ? b : best), buildings[0]!);

    // Place the city from its real shape, so there is no dead space above short skylines.
    // First work out how far up anything reaches, then shift everything down to sit under the header.
    const rawY = (u: number, v: number, z = 0): number => (u + v) * SIN * size - z;
    let reach = rawY(-m, -m);
    for (const b of buildings) reach = Math.min(reach, rawY(b.col + GAP, b.row + GAP, b.height));
    reach = Math.min(reach, rawY(peak.col + 0.5, peak.row + 0.5, peak.height) - FLAG_ROOM);
    const oy = cursor + 6 - reach;

    const at = (u: number, v: number, z = 0): [number, number] => [ox + (u - v) * COS * size, oy + rawY(u, v, z)];
    const poly = (points: Array<[number, number]>): string => `M${points.map(([x, y]) => `${num(x)} ${num(y)}`).join('L')}Z`;

    // The ground: a slab with a faint street grid.
    const slabTop = poly([at(-m, -m), at(cols + m, -m), at(cols + m, ROWS + m), at(-m, ROWS + m)]);
    const leftSide = poly([at(-m, ROWS + m), at(cols + m, ROWS + m), at(cols + m, ROWS + m, -SLAB_DEPTH), at(-m, ROWS + m, -SLAB_DEPTH)]);
    const rightSide = poly([at(cols + m, -m), at(cols + m, ROWS + m), at(cols + m, ROWS + m, -SLAB_DEPTH), at(cols + m, -m, -SLAB_DEPTH)]);
    const streets: string[] = [];
    for (let u = 0; u <= cols; u++) streets.push(`M${num(at(u, 0)[0])} ${num(at(u, 0)[1])}L${num(at(u, ROWS)[0])} ${num(at(u, ROWS)[1])}`);
    for (let v = 0; v <= ROWS; v++) streets.push(`M${num(at(0, v)[0])} ${num(at(0, v)[1])}L${num(at(cols, v)[0])} ${num(at(cols, v)[1])}`);

    const towers = buildings
      .map((b) => {
        const u0 = b.col + GAP;
        const u1 = b.col + 1 - GAP;
        const v0 = b.row + GAP;
        const v1 = b.row + 1 - GAP;
        const h = b.height;
        const cls = b === peak ? 'p' : String(Math.min(4, Math.max(1, b.level || 1)));
        const delay = motion ? ` style="animation-delay:${(0.2 + (b.col + b.row) * 0.011).toFixed(3)}s"` : '';
        return (
          `<g class="b"${delay}>` +
          `<path class="l${cls}" d="${poly([at(u0, v1), at(u1, v1), at(u1, v1, h), at(u0, v1, h)])}"/>` +
          `<path class="r${cls}" d="${poly([at(u1, v0), at(u1, v1), at(u1, v1, h), at(u1, v0, h)])}"/>` +
          `<path class="t${cls}" d="${poly([at(u0, v0, h), at(u1, v0, h), at(u1, v1, h), at(u0, v1, h)])}"/>` +
          `</g>`
        );
      })
      .join('');

    // A flag over the tallest tower says which day it was.
    const [px, py] = at(peak.col + 0.5, peak.row + 0.5, peak.height);
    const labelX = Math.min(WIDTH - PAD - 70, Math.max(PAD + 70, px));
    const flag =
      `<path d="M${num(px)} ${num(py - 3)}L${num(px)} ${num(py - 24)}" stroke="${look.fg}" stroke-opacity="0.6"/>` +
      `<text class="mono" x="${num(labelX)}" y="${num(py - 30)}" text-anchor="middle" font-size="12" font-weight="700" fill="${look.fg}">` +
      `${xmlEscape(shortDate(peak.date))}: ${xmlEscape(formatNumber(peak.count))}</text>`;

    const cityMarkup =
      `<path d="${slabTop}" fill="${look.slabTop}"/>` +
      `<path d="${leftSide}" fill="${look.slabSide}"/>` +
      `<path d="${rightSide}" fill="${look.slabSide}" fill-opacity="0.75"/>` +
      `<path d="${streets.join('')}" fill="none" stroke="${look.slabLine}" stroke-opacity="0.35" stroke-width="0.6"/>` +
      towers +
      flag;
    parts.push(rise(cityMarkup, motion, next()));
    cursor = at(cols + m, ROWS + m, -SLAB_DEPTH)[1] + 30;

    const month = busiestMonth(activity.days);
    const captions = [
      [`${formatNumber(activity.total)} contributions in the past year`, plural(activity.activeDays, 'active day')],
      [`current streak ${plural(activity.currentStreak, 'day')}`, `longest ${plural(activity.longestStreak, 'day')}`, month ? `busiest month ${month.name}` : null],
    ].map((items) => items.filter((v): v is string => Boolean(v)).join('  ·  '));
    const lines = captions
      .map(
        (line, index) =>
          `<text class="mono" x="${WIDTH / 2}" y="${num(cursor + index * 20)}" text-anchor="middle" font-size="12.5" fill="${look.muted}">${xmlEscape(truncate(line, 80))}</text>`,
      )
      .join('');
    parts.push(rise(lines, motion, next()));
    cursor += 20 + 26;
  } else if (wantsCity) {
    // The city needs contribution data. Say so plainly rather than draw an empty or invented one.
    const top = cursor + 20;
    const note =
      `<rect x="${PAD}" y="${top}" width="${WIDTH - PAD * 2}" height="150" rx="16" fill="${look.slabTop}" stroke="${look.slabLine}" stroke-opacity="0.5"/>` +
      `<text x="${WIDTH / 2}" y="${top + 70}" text-anchor="middle" font-size="16" font-weight="700" fill="${look.fg}">Your contribution city appears here</text>` +
      `<text x="${WIDTH / 2}" y="${top + 96}" text-anchor="middle" font-size="13" fill="${look.muted}">It is built from GitHub activity, which is added at your first automatic update.</text>`;
    parts.push(rise(note, motion, next()));
    cursor = top + 150 + 28;
  }

  // Quiet footer lines for languages and projects.
  const footer: string[] = [];
  if (blocks.has('languages') && profile.languages.length > 0) {
    footer.push(
      `<text class="mono" x="${PAD}" y="${num(cursor)}" font-size="12.5" fill="${look.muted}">written in  ` +
        `<tspan fill="${look.fg}">${xmlEscape(profile.languages.slice(0, 4).map((l) => `${truncate(l.name, 14)} ${l.percent}%`).join('   '))}</tspan></text>`,
    );
    cursor += 24;
  }
  if (blocks.has('projects') && profile.topRepos.length > 0) {
    const names = profile.topRepos
      .slice(0, 3)
      .map((r) => `★ ${formatNumber(r.stars)} ${truncate(r.name, 22)}`)
      .join('    ');
    footer.push(
      `<text class="mono" x="${PAD}" y="${num(cursor)}" font-size="12.5" fill="${look.muted}">top projects  ` +
        `<tspan fill="${look.fg}">${xmlEscape(truncate(names, 90))}</tspan></text>`,
    );
    cursor += 24;
  }
  if (footer.length > 0) parts.push(rise(footer.join(''), motion, next()));

  const height = Math.ceil(cursor + PAD - 14);

  // Sky: a handful of stars at night, placed from the username so each sky is unique and repeatable.
  const random = seeded(profile.login);
  const stars =
    variant === 'dark'
      ? Array.from({ length: 46 }, () => {
          const x = random() * WIDTH;
          const y = random() * Math.min(height * 0.55, 330);
          const r = 0.5 + random() * 1.1;
          const o = 0.25 + random() * 0.55;
          return `<circle cx="${num(x)}" cy="${num(y)}" r="${num(r)}" fill="#ffffff" fill-opacity="${num(o)}"/>`;
        }).join('')
      : '';

  const faceCss = look.faces
    .map((f, i) => `.t${i + 1}{fill:${f.top}}.l${i + 1}{fill:${f.left}}.r${i + 1}{fill:${f.right}}`)
    .join('') + `.tp{fill:${look.peak.top}}.lp{fill:${look.peak.left}}.rp{fill:${look.peak.right}}`;
  const motionCss = motion
    ? `.rise{animation:rise .6s ease both}
@keyframes rise{from{opacity:0}}
.b{transform-box:fill-box;transform-origin:50% 100%;animation:grow .8s cubic-bezier(.2,.8,.2,1) both}
@keyframes grow{from{transform:scaleY(0)}}
@media (prefers-reduced-motion:reduce){.rise,.b{animation:none}}`
    : '';

  const title = `${profile.name ?? profile.login} (@${profile.login}) on GitHub`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}" role="img" aria-labelledby="t">
<title id="t">${xmlEscape(title)}</title>
<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${look.skyTop}"/><stop offset="1" stop-color="${look.skyBottom}"/></linearGradient>
<radialGradient id="glow" cx="0.5" cy="1.05" r="0.75"><stop offset="0" stop-color="${look.glow}" stop-opacity="${variant === 'dark' ? 0.3 : 0.22}"/><stop offset="1" stop-color="${look.glow}" stop-opacity="0"/></radialGradient>
</defs>
<style>
text{font-family:${FONT_SANS}}
.mono{font-family:${FONT}}
${faceCss}
${motionCss}
</style>
<rect width="${WIDTH}" height="${height}" rx="20" fill="url(#sky)"/>
${stars}
<rect width="${WIDTH}" height="${height}" rx="20" fill="url(#glow)"/>
${parts.filter(Boolean).join('\n')}
</svg>
`;
}

export const city: Template = {
  id: 'city',
  name: 'Contribution city',
  description: 'Every day of your past year as a building in an isometric city, taller on busier days, under your own sky.',
  tags: ['image', 'isometric', '3d', 'activity', 'animated'],
  needsAvatar: true,
  render(profile, config): Output {
    const assets = variantsFor(config.theme).map((variant) => ({
      path: assetPath('city', variant),
      content: renderSvg(profile, config, variant),
    }));
    const drawn = config.blocks.includes('activity') && profile.contributions && profile.contributions.days.length > 0;
    const extra = drawn ? 'an isometric city with one building for each day, taller on busier days' : undefined;
    return { readme: imageReadme(profile, config, 'city', WIDTH, describeProfile(profile, config, extra, { activity: true })), assets };
  },
};
