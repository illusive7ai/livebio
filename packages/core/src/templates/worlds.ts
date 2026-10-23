import { hslToHex, hueOf } from '../color';
import type { Variant } from '../themes';
import type { Config, Contributions, Profile, Template } from '../types';
import { formatNumber, truncate, xmlEscape } from '../util';
import { num, riseCss } from './kit';
import { isFresh } from './interfaces';
import { hashOf, imageTemplate, langColor, pictureBox, svgDoc } from './make';
import { rise } from './shared';

/** Five designs that are small worlds: activity rings, a language tree, an aquarium, an island map and a circuit board. */

const hueFor = (profile: Profile, fallback: number): number => hueOf(profile.avatar?.grid.tint) ?? fallback;

const text = (value: string, x: number, y: number, size: number, fill: string, extra = ''): string =>
  `<text x="${num(x)}" y="${num(y)}" font-size="${size}" fill="${fill}" ${extra}>${xmlEscape(value)}</text>`;

/** "1 repository" or "23 repositories". */
export function repositories(count: number): string {
  return `${formatNumber(count)} ${count === 1 ? 'repository' : 'repositories'}`;
}

/** How big a repository looks on a log scale: 0 for none or one star, up to 1 at 10,000 stars and above. */
export function starScale(stars: number): number {
  if (!(stars > 0)) return 0;
  return Math.min(1, Math.log10(stars + 1) / 4);
}

/* ------------------------------------------------------------------------------------------------ */
/* Activity rings                                                                                    */
/* ------------------------------------------------------------------------------------------------ */

export interface RingValue {
  label: string;
  fraction: number;
  caption: string;
}

/** The three rings, each a real share between 0 and 1. With no calendar there are none. */
export function ringValues(contributions: Contributions | undefined): RingValue[] {
  if (!contributions || contributions.days.length === 0) return [];
  const clamp = (n: number): number => (Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0);
  const recent = contributions.days.slice(-30);
  const active30 = recent.filter((d) => d.count > 0).length;
  return [
    { label: 'STREAK', fraction: clamp(contributions.longestStreak > 0 ? contributions.currentStreak / contributions.longestStreak : 0), caption: `${contributions.currentStreak} of ${contributions.longestStreak} days, the best streak` },
    { label: 'ACTIVE DAYS', fraction: clamp(contributions.activeDays / contributions.days.length), caption: `${contributions.activeDays} of ${contributions.days.length} days` },
    { label: 'LAST 30 DAYS', fraction: clamp(active30 / Math.max(1, recent.length)), caption: `${active30} of ${recent.length} days` },
  ];
}

function ringsSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const hue = hueFor(profile, 340);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const bg = dark ? '#000000' : '#f2f2f7';
  const ink = dark ? '#ffffff' : '#111114';
  const muted = dark ? '#8e8e99' : '#6c6c78';
  const name = profile.name ?? profile.login;
  const rings = blocks.has('activity') ? ringValues(profile.contributions) : [];
  const colors = [0, 120, 200].map((offset) => hslToHex((hue + offset) % 360, 0.95, dark ? 0.55 : 0.5));
  const cx = 270;
  const cy = 215;
  const radii = [150, 114, 78];
  const height = 430;

  let body = '';
  radii.forEach((r, i) => {
    body += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${colors[i]}" stroke-opacity="0.2" stroke-width="28"/>`;
    const ring = rings[i];
    if (ring && ring.fraction > 0) {
      body += `<circle class="ring" cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${colors[i]}" stroke-width="28" stroke-linecap="round" pathLength="1" stroke-dasharray="${num(ring.fraction)} 1" transform="rotate(-90 ${cx} ${cy})" style="animation-delay:${(0.2 + i * 0.25).toFixed(2)}s"/>`;
    }
  });
  body += pictureBox(profile, colors[0]!, bg, cx - 46, cy - 46, 92, 92, 46, 'ar');
  body += text(truncate(name, 22), 520, 92, 26, ink, 'font-weight="800"') + text(`@${profile.login}`, 520, 114, 13, muted, 'class="mono"');
  if (rings.length === 0) body += text(blocks.has('activity') ? 'The rings fill after the first automatic update, once the calendar is available.' : 'The activity section is switched off.', 520, 170, 14, muted, 'font-style="italic"');
  rings.forEach((ring, i) => {
    const y = 168 + i * 74;
    body += `<circle cx="532" cy="${y - 6}" r="8" fill="${colors[i]}"/>`;
    body += text(ring.label, 552, y - 8, 11, muted, 'letter-spacing="3" font-weight="800"');
    body += text(`${Math.round(ring.fraction * 100)}%`, 552, y + 24, 30, colors[i]!, 'font-weight="800"');
    body += text(ring.caption, 640, y + 22, 12.5, ink, 'class="mono"');
  });
  if (blocks.has('stats')) body += text(`${formatNumber(profile.totalStars)} stars  ·  ${formatNumber(profile.followers)} followers  ·  ${repositories(profile.publicRepos)}`, 520, height - 40, 12.5, muted, 'class="mono"');
  const css = riseCss(motion) + (motion ? `.ring{animation:fill 1.4s ease-out both}@keyframes fill{from{stroke-dasharray:0 1}}@media (prefers-reduced-motion:reduce){.ring{animation:none}}` : '');
  return svgDoc({ height, title: `${name} on GitHub, as activity rings`, bg, radius: 14, css, body });
}

export const rings: Template = imageTemplate('rings', 'Activity rings', 'Three rings that fill with real shares of your activity: your streak, your active days and the last 30 days.', ['creative', 'activity', 'stats'], ringsSvg, {
  extra: () => 'shown as three activity rings',
});

/* ------------------------------------------------------------------------------------------------ */
/* Language tree                                                                                     */
/* ------------------------------------------------------------------------------------------------ */

/** The angle of each branch from straight up, in degrees, spread evenly. A single branch grows straight up. */
export function branchAngles(count: number, spread = 62): number[] {
  if (count <= 0) return [];
  if (count === 1) return [0];
  return Array.from({ length: count }, (_v, i) => -spread + (i / (count - 1)) * spread * 2);
}

/** A point a fraction `t` of the way along a quadratic curve. */
export function quadPoint(p0: [number, number], p1: [number, number], p2: [number, number], t: number): [number, number] {
  const u = 1 - t;
  return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]];
}

function treeSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const hue = hueFor(profile, 120);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const sky = dark ? '#0f1a22' : '#e7f3f7';
  const ground = dark ? '#1a2a1d' : '#9ccc83';
  const bark = dark ? '#6b4a32' : '#7a5236';
  const ink = dark ? '#e8f0ea' : '#20301f';
  const muted = dark ? '#8fa596' : '#4b6b4d';
  const name = profile.name ?? profile.login;
  const langs = blocks.has('languages') ? profile.languages.slice(0, 5) : [];
  const repos = blocks.has('projects') ? profile.topRepos : [];
  const height = 560;
  const root: [number, number] = [450, 480];
  const angles = branchAngles(langs.length, 76);

  let body = text(truncate(name, 24), 36, 52, 24, ink, 'font-weight="800"') + text(`@${profile.login}`, 36, 74, 13, muted, 'class="mono"');
  body += `<path d="M0 ${root[1] - 6}Q225 ${root[1] - 30} 450 ${root[1] - 8}T900 ${root[1] - 14}V${height}H0Z" fill="${ground}"/>`;
  body += pictureBox(profile, hslToHex(hue, 0.5, 0.5), '#fff', 36, 96, 70, 70, 35, 'tr');
  if (langs.length === 0) body += text(blocks.has('languages') ? 'No branches yet.' : 'The languages section is switched off.', 450, 250, 15, muted, 'text-anchor="middle" font-style="italic"');
  let shown = 0;
  let canopy = '';
  let branches = '';
  langs.forEach((lang, i) => {
    const a = (angles[i]! * Math.PI) / 180;
    const len = 190 + lang.percent * 2.2;
    const tip: [number, number] = [root[0] + Math.sin(a) * len * 0.92, root[1] - 60 - Math.cos(a) * len * 0.92];
    const ctrl: [number, number] = [root[0] + Math.sin(a) * len * 0.12, root[1] - 60 - len * 0.7];
    const start: [number, number] = [root[0], root[1] - 60];
    const color = langColor(lang.name, variant);
    branches += `<path d="M${num(start[0])} ${num(start[1])}Q${num(ctrl[0])} ${num(ctrl[1])} ${num(tip[0])} ${num(tip[1])}" fill="none" stroke="${bark}" stroke-width="${num(4 + lang.percent * 0.14)}" stroke-linecap="round"/>`;
    const here = repos.filter((r) => r.language === lang.name).slice(0, 3);
    here.forEach((repo, j) => {
      const t = here.length === 1 ? 0.58 : 0.4 + (j / (here.length - 1)) * 0.28;
      const [px, py] = quadPoint(start, ctrl, tip, t);
      const r = 9 + starScale(repo.stars) * 16;
      const side = Math.sin(a) >= 0 ? 1 : -1;
      const x = px + side * (r + 10 + (j % 2) * 6);
      canopy += `<g class="leaf" style="animation-delay:${(0.3 + i * 0.12 + j * 0.06).toFixed(2)}s"><circle cx="${num(x)}" cy="${num(py)}" r="${num(r)}" fill="${color}" fill-opacity="0.92"/>`;
      canopy += text(truncate(repo.name, 14), x, py - r - 5, 11, ink, 'text-anchor="middle" font-weight="700"');
      canopy += text(`★ ${formatNumber(repo.stars)}`, x, py + 4, 10, '#ffffff', 'class="mono" text-anchor="middle" font-weight="700"') + `</g>`;
      shown += 1;
    });
    canopy += text(`${truncate(lang.name, 12)} ${Math.round(lang.percent)}%`, tip[0] + Math.sin(a) * 56, tip[1] - 10, 14, color, 'text-anchor="middle" font-weight="800"');
  });
  body += `<path d="M${root[0] - 20} ${root[1]}L${root[0] - 10} ${root[1] - 64}H${root[0] + 10}L${root[0] + 20} ${root[1]}Z" fill="${bark}"/>`;
  body += branches + canopy;
  const other = repos.length - shown;
  body += text(`branch = language, thicker for a bigger share · leaf = repository, bigger for more stars (log scale)${other > 0 ? ` · ${repositories(other)} in other languages not shown` : ''}`, 36, height - 20, 10.5, muted, 'class="mono"');
  const css = riseCss(motion) + (motion ? `.leaf{animation:grow .6s ease-out both}@keyframes grow{from{opacity:0;transform:scale(.6)}}@media (prefers-reduced-motion:reduce){.leaf{animation:none}}` : '');
  return svgDoc({ height, title: `${name} on GitHub, as a tree of languages`, bg: sky, radius: 14, css, body });
}

export const tree: Template = imageTemplate('tree', 'Language tree', 'A tree with a branch for each language, thicker for a bigger share, and a leaf for each repository.', ['creative', 'nature', 'languages'], treeSvg, {
  extra: () => 'shown as a tree with a branch for each language and a leaf for each repository',
});

/* ------------------------------------------------------------------------------------------------ */
/* Aquarium                                                                                          */
/* ------------------------------------------------------------------------------------------------ */

/** The length of a fish in pixels: from 54 for a repository nobody has starred to 150 for a very popular one. */
export function fishLength(stars: number): number {
  return Math.round(54 + starScale(stars) * 96);
}

function fishSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const top = dark ? '#06223a' : '#6ec6ea';
  const bottom = dark ? '#031321' : '#2a86b5';
  const sand = dark ? '#3a3524' : '#e6d49a';
  const ink = '#ffffff';
  const name = profile.name ?? profile.login;
  const repos = blocks.has('projects') ? profile.topRepos.slice(0, 6) : [];
  const langs = blocks.has('languages') ? profile.languages.slice(0, 5) : [];
  const height = 470;
  const defs = `<linearGradient id="water" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>`;

  let body = `<rect width="900" height="${height}" fill="url(#water)"/>`;
  for (let i = 0; i < 26; i++) {
    const h = hashOf(`${profile.login}:bubble:${i}`);
    body += `<circle cx="${h % 900}" cy="${(h >>> 9) % 330 + 20}" r="${1.5 + (h % 4)}" fill="#fff" fill-opacity="0.18"/>`;
  }
  body += text(truncate(name, 24), 36, 54, 24, ink, 'font-weight="800"') + text(`@${profile.login}`, 36, 76, 13, '#cfe9f5', 'class="mono"');
  if (repos.length === 0) body += text(blocks.has('projects') ? 'The tank is empty.' : 'The projects section is switched off.', 36, 150, 15, '#cfe9f5', 'font-style="italic"');
  repos.forEach((repo, i) => {
    const len = fishLength(repo.stars);
    const h = len * 0.5;
    const h0 = hashOf(`${profile.login}:fish:${repo.name}`);
    const laneY = 140 + Math.floor(i / 3) * 120;
    const x = 50 + (i % 3) * 280 + ((h0 >>> 3) % 60);
    const right = (h0 & 1) === 0;
    const color = repo.language ? langColor(repo.language, variant) : '#9aa7b4';
    const sway = motion ? ` class="swim" style="--d:${right ? 34 : -34}px;animation-duration:${(5 + (h0 % 5)).toFixed(0)}s;animation-delay:${(-(h0 % 4)).toFixed(0)}s"` : '';
    const dir = right ? 1 : -1;
    const bx = x + len / 2;
    body += `<g${sway}><g transform="translate(${num(bx)} ${laneY}) scale(${dir} 1)">`;
    body += `<path d="M${num(-len / 2)} 0Q${num(-len * 0.1)} ${num(-h)} ${num(len / 2 - 10)} 0Q${num(-len * 0.1)} ${num(h)} ${num(-len / 2)} 0Z" fill="${color}"/>`;
    body += `<path d="M${num(len / 2 - 14)} 0L${num(len / 2 + 22)} ${num(-h * 0.7)}L${num(len / 2 + 22)} ${num(h * 0.7)}Z" fill="${color}" fill-opacity="0.85"/>`;
    body += `<circle cx="${num(-len / 2 + len * 0.22)}" cy="${num(-h * 0.1)}" r="${num(Math.max(3, h * 0.12))}" fill="#fff"/><circle cx="${num(-len / 2 + len * 0.22 - 1)}" cy="${num(-h * 0.1)}" r="${num(Math.max(1.5, h * 0.06))}" fill="#10243a"/>`;
    body += `</g>`;
    body += text(`${truncate(repo.name, 16)}  ★ ${formatNumber(repo.stars)}`, bx, laneY + h + 14, 11.5, ink, 'text-anchor="middle" font-weight="700"') + `</g>`;
  });
  body += `<path d="M0 ${height - 70}Q225 ${height - 90} 450 ${height - 72}T900 ${height - 78}V${height}H0Z" fill="${sand}"/>`;
  langs.forEach((lang, i) => {
    const x = 70 + i * 165;
    const h = 26 + lang.percent * 1.8;
    const color = langColor(lang.name, variant);
    for (let b = 0; b < 3; b++) body += `<path d="M${x + b * 14} ${height - 70}q${b % 2 ? 14 : -14} ${num(-h * 0.5)} 0 ${num(-h * (0.7 + b * 0.15))}" fill="none" stroke="${color}" stroke-width="7" stroke-linecap="round"/>`;
    body += text(`${truncate(lang.name, 12)} ${Math.round(lang.percent)}%`, x + 16, height - 28, 12.5, '#10243a', 'text-anchor="middle" font-weight="800"');
  });
  body += text('fish length = stars (log scale) · colour = main language · seaweed height = share of code', 36, height - 8, 10, '#10243a', 'class="mono"');
  const css = riseCss(motion) + (motion ? `.swim{animation:swim 6s ease-in-out infinite alternate}@keyframes swim{to{transform:translateX(var(--d))}}@media (prefers-reduced-motion:reduce){.swim{animation:none}}` : '');
  return svgDoc({ height, title: `${name} on GitHub, as an aquarium of repositories`, bg: bottom, radius: 14, defs, css, body });
}

export const aquarium: Template = imageTemplate('aquarium', 'Aquarium', 'A fish tank with a fish for each repository, longer for more stars, over seaweed for your languages.', ['creative', 'nature', 'projects'], fishSvg, {
  extra: () => 'shown as an aquarium with a fish for each repository',
});

/* ------------------------------------------------------------------------------------------------ */
/* Island map                                                                                        */
/* ------------------------------------------------------------------------------------------------ */

/** The outline of an island: a closed, repeatable blob around (cx, cy), roughly `radius` across. */
export function blobPath(seed: string, cx: number, cy: number, radius: number): string {
  const points = 9;
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < points; i++) {
    const a = (i / points) * Math.PI * 2;
    const r = radius * (0.72 + ((hashOf(`${seed}:${i}`) % 100) / 100) * 0.5);
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.82]);
  }
  const mid = (a: [number, number], b: [number, number]): [number, number] => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let d = `M${num(mid(pts[points - 1]!, pts[0]!)[0])} ${num(mid(pts[points - 1]!, pts[0]!)[1])}`;
  for (let i = 0; i < points; i++) {
    const next = pts[(i + 1) % points]!;
    const m = mid(pts[i]!, next);
    d += `Q${num(pts[i]![0])} ${num(pts[i]![1])} ${num(m[0])} ${num(m[1])}`;
  }
  return `${d}Z`;
}

const ISLAND_SLOTS: Array<[number, number]> = [[250, 230], [560, 190], [430, 370], [700, 340], [150, 400], [770, 170]];

function islandSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const sea = dark ? '#10222e' : '#cfe6ea';
  const seaLine = dark ? '#1c3a4c' : '#a9ccd3';
  const paper = dark ? '#1a2d3a' : '#efe1bb';
  const ink = dark ? '#e7dcc0' : '#4a3520';
  const name = profile.name ?? profile.login;
  const repos = blocks.has('projects') ? [...profile.topRepos.slice(0, 6)].sort((a, b) => b.stars - a.stars) : [];
  const langs = blocks.has('languages') ? profile.languages.slice(0, 4) : [];
  const height = 520;

  let body = `<rect width="900" height="${height}" fill="${sea}"/>`;
  for (let i = 0; i < 14; i++) body += `<path d="M0 ${40 + i * 36}q75 -10 150 0t150 0t150 0t150 0t150 0t150 0" fill="none" stroke="${seaLine}" stroke-width="1.4"/>`;
  body += `<g><rect x="30" y="28" width="300" height="74" rx="6" fill="${paper}" stroke="${ink}" stroke-width="2"/><rect x="36" y="34" width="288" height="62" rx="3" fill="none" stroke="${ink}" stroke-opacity="0.5"/>`;
  body += text(truncate(name, 22), 180, 62, 24, ink, 'class="serif" text-anchor="middle" font-style="italic" font-weight="700"') + text(`@${profile.login}`, 180, 84, 12, ink, 'class="mono" text-anchor="middle"') + `</g>`;
  if (repos.length === 0) body += text(blocks.has('projects') ? 'No islands charted yet.' : 'The projects section is switched off.', 450, 270, 16, ink, 'class="serif" text-anchor="middle" font-style="italic"');
  const spots = repos.map((_r, i) => ISLAND_SLOTS[i]!);
  if (repos.length > 1) body += `<path d="M${spots.map(([x, y]) => `${x} ${y}`).join('L')}" fill="none" stroke="${ink}" stroke-opacity="0.55" stroke-width="2" stroke-dasharray="3 7" stroke-linecap="round"/>`;
  repos.forEach((repo, i) => {
    const [x, y] = spots[i]!;
    const radius = 30 + starScale(repo.stars) * 52;
    const color = repo.language ? langColor(repo.language, variant) : '#9a8f78';
    body += `<g class="isle" style="animation-delay:${(0.1 + i * 0.1).toFixed(2)}s"><path d="${blobPath(`${profile.login}:${repo.name}`, x, y, radius * 1.2)}" fill="${seaLine}" fill-opacity="0.9"/>`;
    body += `<path d="${blobPath(`${profile.login}:${repo.name}`, x, y, radius)}" fill="${color}" fill-opacity="0.85" stroke="${ink}" stroke-width="1.6"/>`;
    if (i === 0) body += `<path d="M${x - 9} ${y - 9}l18 18M${x + 9} ${y - 9}l-18 18" stroke="#b3261e" stroke-width="4" stroke-linecap="round"/>`;
    body += text(truncate(repo.name, 18), x, y + radius * 0.82 + 22, 14, ink, 'class="serif" text-anchor="middle" font-style="italic" font-weight="700"');
    body += text(`★ ${formatNumber(repo.stars)}`, x, y + radius * 0.82 + 38, 11, ink, 'class="mono" text-anchor="middle"') + `</g>`;
  });
  // The compass rose and the key.
  const ccx = 820;
  const ccy = 440;
  body += `<g stroke="${ink}" fill="${ink}"><path d="M${ccx} ${ccy - 44}L${ccx + 8} ${ccy}L${ccx} ${ccy + 44}L${ccx - 8} ${ccy}Z" fill-opacity="0.8"/><path d="M${ccx - 44} ${ccy}L${ccx} ${ccy - 8}L${ccx + 44} ${ccy}L${ccx} ${ccy + 8}Z" fill-opacity="0.35"/></g>` + text('N', ccx, ccy - 52, 14, ink, 'class="serif" text-anchor="middle" font-weight="700"');
  langs.forEach((lang, i) => {
    body += `<rect x="700" y="${40 + i * 20}" width="14" height="14" rx="3" fill="${langColor(lang.name, variant)}" stroke="${ink}" stroke-opacity="0.6"/>` + text(`${truncate(lang.name, 14)} ${Math.round(lang.percent)}%`, 722, 52 + i * 20, 12, ink, 'class="serif"');
  });
  body += text('island size = stars (log scale) · colour = main language · the X marks the most starred repository', 36, height - 12, 10.5, ink, 'class="mono"');
  const css = riseCss(motion) + (motion ? `.isle{animation:rise .6s ease-out both}@keyframes rise{from{opacity:0;transform:translateY(10px)}}@media (prefers-reduced-motion:reduce){.isle{animation:none}}` : '');
  return svgDoc({ height, title: `${name} on GitHub, as a treasure map of repositories`, bg: sea, radius: 14, css, body });
}

export const island: Template = imageTemplate('island', 'Island map', 'A treasure map: an island for each repository, bigger for more stars, with an X on the most starred.', ['creative', 'map', 'projects'], islandSvg, {
  extra: () => 'shown as a treasure map with an island for each repository',
});

/* ------------------------------------------------------------------------------------------------ */
/* Circuit board                                                                                     */
/* ------------------------------------------------------------------------------------------------ */

const CHIP_SLOTS: Array<{ x: number; y: number }> = [
  { x: 120, y: 120 }, { x: 700, y: 120 }, { x: 80, y: 330 }, { x: 740, y: 330 }, { x: 330, y: 400 }, { x: 510, y: 400 },
];

/** The width of a chip: from 100 to 150 pixels, wider for a more starred repository. */
export function chipWidth(stars: number): number {
  return Math.round(100 + starScale(stars) * 50);
}

function circuitSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const board = dark ? '#06261a' : '#1c7a4f';
  const boardEdge = dark ? '#0b3a28' : '#13613e';
  const chip = dark ? '#15171c' : '#1d2026';
  const pin = '#d9c27a';
  const text1 = '#e8eef0';
  const name = profile.name ?? profile.login;
  const repos = blocks.has('projects') ? profile.topRepos.slice(0, 6) : [];
  const height = 520;
  const core = { x: 450, y: 250, w: 250, h: 130 };

  let body = `<rect width="900" height="${height}" fill="${board}"/>`;
  for (let i = 0; i < 8; i++) body += `<path d="M${30 + i * 120} 10V${height - 10}" stroke="${boardEdge}" stroke-width="1"/>`;
  let traces = '';
  let chips = '';
  repos.forEach((repo, i) => {
    const slot = CHIP_SLOTS[i]!;
    const w = chipWidth(repo.stars);
    const color = repo.language ? langColor(repo.language, variant) : '#b6c0c8';
    const h = 66;
    const cx = slot.x + w / 2;
    const cy = slot.y + h / 2;
    // A trace leaves the chip towards the middle, runs straight, then bends in at 45 degrees to the core.
    const toX = cx < core.x ? core.x - core.w / 2 : cx > core.x ? core.x + core.w / 2 : core.x;
    const startX = cx < core.x ? slot.x + w : cx > core.x ? slot.x : cx;
    const midX = startX + (toX - startX) * 0.55;
    const endY = core.y - core.h / 2 + 22 + (i % 3) * 43;
    traces += `<path d="M${num(startX)} ${num(cy)}H${num(midX)}L${num(midX + (toX > startX ? 24 : -24))} ${num(endY)}H${num(toX)}" fill="none" stroke="${color}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" class="trace"/>`;
    const lit = isFresh(repo, profile.fetchedAt);
    chips += `<g class="chip" style="animation-delay:${(0.1 + i * 0.1).toFixed(2)}s"><rect x="${slot.x}" y="${slot.y}" width="${w}" height="${h}" rx="5" fill="${chip}" stroke="${color}" stroke-width="2"/>`;
    for (let p = 0; p < 6; p++) chips += `<rect x="${slot.x + 8 + p * ((w - 16) / 6)}" y="${slot.y - 6}" width="6" height="6" fill="${pin}"/><rect x="${slot.x + 8 + p * ((w - 16) / 6)}" y="${slot.y + h}" width="6" height="6" fill="${pin}"/>`;
    chips += text(truncate(repo.name, 14), slot.x + 8, slot.y + 24, 13, text1, 'class="mono" font-weight="800"') + text(`★ ${formatNumber(repo.stars)}`, slot.x + 8, slot.y + 42, 11.5, pin, 'class="mono"');
    chips += text(truncate(repo.language ?? '—', 12), slot.x + 8, slot.y + 58, 10, color, 'class="mono"');
    chips += `<circle cx="${slot.x + w - 14}" cy="${slot.y + 14}" r="5" fill="${lit ? '#4dff88' : '#3a4a40'}"${lit && motion ? ' class="led"' : ''}/></g>`;
  });
  body += traces;
  // The central chip is the person.
  body += `<rect x="${core.x - core.w / 2}" y="${core.y - core.h / 2}" width="${core.w}" height="${core.h}" rx="8" fill="${chip}" stroke="${pin}" stroke-width="2.5"/>`;
  for (let p = 0; p < 10; p++) body += `<rect x="${core.x - core.w / 2 + 14 + p * 24}" y="${core.y - core.h / 2 - 7}" width="7" height="7" fill="${pin}"/><rect x="${core.x - core.w / 2 + 14 + p * 24}" y="${core.y + core.h / 2}" width="7" height="7" fill="${pin}"/>`;
  body += pictureBox(profile, '#2e5d8a', '#ffffff', core.x - core.w / 2 + 12, core.y - core.h / 2 + 12, 52, 52, 4, 'cc');
  body += text(truncate(name, 14), core.x - core.w / 2 + 72, core.y - core.h / 2 + 34, 14, text1, 'class="mono" font-weight="800"') + text(`@${truncate(profile.login, 14)}`, core.x - core.w / 2 + 72, core.y - core.h / 2 + 52, 11, pin, 'class="mono"');
  if (blocks.has('stats')) body += text(`${formatNumber(profile.totalStars)} stars · ${formatNumber(profile.followers)} followers`, core.x, core.y + core.h / 2 - 16, 10.5, text1, 'class="mono" text-anchor="middle"');
  body += chips;
  for (const [sx, sy] of [[26, 26], [874, 26], [26, height - 26], [874, height - 26]] as const) body += `<circle cx="${sx}" cy="${sy}" r="9" fill="${boardEdge}" stroke="${pin}" stroke-width="2"/><path d="M${sx - 5} ${sy}h10" stroke="${pin}"/>`;
  if (repos.length === 0) body += text(blocks.has('projects') ? 'No chips are fitted yet.' : 'The projects section is switched off.', 450, 120, 14, text1, 'class="mono" text-anchor="middle"');
  body += text('chip width = stars · trace colour = main language · a lit LED means pushed to in the last 90 days', 36, height - 14, 10.5, text1, 'class="mono" fill-opacity="0.85"');
  const css = riseCss(motion) + (motion ? `.chip{animation:fitin .5s ease-out both}@keyframes fitin{from{opacity:0;transform:scale(.94)}}.led{animation:blink 1.6s ease-in-out infinite alternate}@keyframes blink{from{opacity:.4}}@media (prefers-reduced-motion:reduce){.chip,.led{animation:none}}` : '');
  return svgDoc({ height, title: `${name} on GitHub, as a circuit board of repositories`, bg: board, radius: 14, css, body });
}

export const circuit: Template = imageTemplate('circuit', 'Circuit board', 'A circuit board: you as the main chip, a chip for each repository, and an LED that lights when it was pushed to lately.', ['creative', 'device', 'projects'], circuitSvg, {
  extra: () => 'shown as a circuit board with a chip for each repository',
});

export const worldTemplates: Template[] = [rings, tree, aquarium, island, circuit];
