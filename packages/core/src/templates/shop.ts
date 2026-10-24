import { hslToHex, hueOf } from '../color';
import type { Variant } from '../themes';
import type { Config, Profile, RepoSummary, Template } from '../types';
import { formatNumber, truncate, wrap, xmlEscape } from '../util';
import { num, riseCss } from './kit';
import { imageTemplate, isoDate, langColor, svgDoc, yearsBetween } from './make';
import { gradientMap, photo, pictureDef } from './photo';
import { rise } from './shared';

/** Five designs from the shop floor: a potion shelf, a vending machine, a pinball table, a sushi belt and a photo booth. */

const hueFor = (profile: Profile, fallback: number): number => hueOf(profile.avatar?.grid.tint) ?? fallback;

const text = (value: string, x: number, y: number, size: number, fill: string, extra = ''): string =>
  `<text x="${num(x)}" y="${num(y)}" font-size="${size}" fill="${fill}" ${extra}>${xmlEscape(value)}</text>`;

/* ------------------------------------------------------------------------------------------------ */
/* Potion shelf                                                                                      */
/* ------------------------------------------------------------------------------------------------ */

/** How full a bottle is: its share of 100, out of the room inside, with at least `min` showing for any share above nothing. */
export function liquidHeight(percent: number, inner: number, min = 4): number {
  if (!(percent > 0)) return 0;
  return Math.min(inner, Math.max(min, Math.round((Math.min(100, percent) / 100) * inner * 10) / 10));
}

/** Six bottle shapes in a 90 by 150 box, each with its neck at the top and its base on the line y=150. */
const BOTTLES = [
  'M36 4H54V34C78 46 88 76 88 108A43 43 0 0 1 2 108C2 76 12 46 36 34Z',
  'M30 4H60V28L66 34V138Q66 150 54 150H36Q24 150 24 138V34L30 28Z',
  'M36 4H54V50L88 140Q90 150 78 150H12Q0 150 2 140L36 50Z',
  'M14 4H76V22Q84 28 84 40V140Q84 150 74 150H16Q6 150 6 140V40Q6 28 14 22Z',
  'M38 4H52V24C70 30 70 56 56 66C86 80 90 150 45 150C0 150 4 80 34 66C20 56 20 30 38 24Z',
  'M45 4C45 4 90 70 90 110A45 40 0 0 1 0 110C0 70 45 4 45 4Z',
];

function potionsSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const wall = dark ? '#1b1410' : '#e9dcc3';
  const wood = dark ? '#5a3d24' : '#9a6a3a';
  const woodDark = dark ? '#3a2616' : '#6e4a26';
  const ink = dark ? '#f2e6d0' : '#3a2410';
  const muted = dark ? '#b09a7a' : '#7a5f3a';
  const name = profile.name ?? profile.login;
  const langs = blocks.has('languages') ? profile.languages.slice(0, 6) : [];
  const height = 520;
  const gap = 26;
  const total = langs.length * 90 + Math.max(0, langs.length - 1) * gap;
  const x0 = (900 - total) / 2;
  const shelfY = 372;
  let body = `<rect width="900" height="${height}" fill="${wall}"/>`;
  for (let x = 0; x < 900; x += 60) body += `<rect x="${x}" y="0" width="1" height="${height}" fill="${woodDark}" fill-opacity="0.18"/>`;
  body += text(`${truncate(name, 24)}’s apothecary`, 450, 62, 28, ink, 'class="serif" text-anchor="middle" font-style="italic" font-weight="700"');
  body += text(`@${profile.login}`, 450, 86, 13, muted, 'class="mono" text-anchor="middle"');
  if (langs.length === 0) body += text('Switch on Languages to fill the bottles.', 450, 200, 15, muted, 'text-anchor="middle" font-style="italic"');
  const defs: string[] = [];
  langs.forEach((l, i) => {
    const x = x0 + i * (90 + gap);
    const y = shelfY - 150;
    const color = langColor(l.name, variant);
    const level = liquidHeight(l.percent, 146);
    defs.push(`<clipPath id="pot${i}"><path d="${BOTTLES[i % BOTTLES.length]}" transform="translate(${num(x)} ${y})"/></clipPath>`);
    let piece = `<g clip-path="url(#pot${i})"><rect x="${num(x)}" y="${y}" width="90" height="150" fill="#fff" fill-opacity="0.12"/>`;
    piece += `<rect x="${num(x)}" y="${num(y + 150 - level)}" width="90" height="${num(level)}" fill="${color}"/><rect x="${num(x)}" y="${num(y + 150 - level)}" width="90" height="4" fill="#fff" fill-opacity="0.35"/>`;
    if (motion && level > 14) for (let b = 0; b < 3; b++) piece += `<circle class="bub" cx="${num(x + 24 + b * 20)}" cy="${y + 144}" r="${3 - (b % 2)}" fill="#fff" fill-opacity="0.7" style="animation-delay:${(i * 0.7 + b * 1.1).toFixed(1)}s;--rise:${-Math.min(level - 8, 70)}px"/>`;
    piece += `</g><path d="${BOTTLES[i % BOTTLES.length]}" transform="translate(${num(x)} ${y})" fill="none" stroke="${ink}" stroke-opacity="0.55" stroke-width="2.5"/>`;
    piece += `<rect x="${num(x + 33)}" y="${y - 10}" width="24" height="16" rx="3" fill="${dark ? '#a8794a' : '#c9955c'}"/>`;
    piece += `<path d="M${num(x + 14)} ${y + 40}Q${num(x + 10)} ${y + 90} ${num(x + 16)} ${y + 130}" stroke="#fff" stroke-opacity="0.35" stroke-width="5" stroke-linecap="round" fill="none"/>`;
    piece += `<rect x="${num(x + 2)}" y="${shelfY + 22}" width="86" height="46" rx="4" fill="${dark ? '#d8c79e' : '#f6ecd0'}" stroke="${woodDark}" stroke-opacity="0.5"/>` + text(truncate(l.name, 11), x + 45, shelfY + 42, 12.5, '#2b1c0a', 'text-anchor="middle" font-weight="800" class="serif"') + text(`${l.percent}%`, x + 45, shelfY + 60, 13, '#2b1c0a', 'text-anchor="middle" class="mono" font-weight="700"');
    body += rise(piece, motion, 0.1 * i);
  });
  body += `<rect x="40" y="${shelfY}" width="820" height="16" rx="3" fill="${wood}"/><rect x="40" y="${shelfY + 16}" width="820" height="6" fill="${woodDark}"/>`;
  if (blocks.has('stats')) body += text(`${formatNumber(profile.totalStars)} stars  ·  ${formatNumber(profile.followers)} followers  ·  ${formatNumber(profile.publicRepos)} repositories`, 450, 478, 13, ink, 'class="mono" text-anchor="middle"');
  body += text(langs.length > 0 ? 'The fuller the bottle, the bigger that language’s share of your repositories. A full bottle would be all of them.' : '', 450, 502, 11, muted, 'class="mono" text-anchor="middle"');
  const css = riseCss(motion) + (motion ? `.bub{animation:bub 4s ease-in infinite}@keyframes bub{from{transform:translateY(0);opacity:.8}to{transform:translateY(var(--rise));opacity:0}}@media (prefers-reduced-motion:reduce){.bub{display:none}}` : '');
  return svgDoc({ height, title: `${name} on GitHub, as a shelf of potion bottles filled by language`, bg: wall, radius: 14, defs: defs.join(''), css, body });
}

export const potions: Template = imageTemplate('potions', 'Potion shelf', 'An apothecary shelf: one bottle for each of your languages, filled as full as that language’s share.', ['creative', 'object', 'languages'], potionsSvg, {
  extra: () => 'shown as a shelf of potion bottles',
});

/* ------------------------------------------------------------------------------------------------ */
/* Vending machine                                                                                   */
/* ------------------------------------------------------------------------------------------------ */

/** The code painted by a slot: A1, A2, A3, A4, then B1 and so on, `cols` to a row. */
export const slotCode = (index: number, cols = 4): string => `${String.fromCharCode(65 + Math.floor(index / cols))}${(index % cols) + 1}`;

/** The projects to stock, the most starred first, at most `max` of them. */
export const stock = (repos: ReadonlyArray<RepoSummary>, max = 12): RepoSummary[] => [...repos].sort((a, b) => b.stars - a.stars || a.name.localeCompare(b.name)).slice(0, max);

function vendingSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const hue = hueFor(profile, 200);
  const room = dark ? '#0d1017' : '#e7ebf2';
  const body1 = hslToHex(hue, 0.55, dark ? 0.3 : 0.5);
  const body2 = hslToHex(hue, 0.6, dark ? 0.2 : 0.38);
  const glass = dark ? '#0b1118' : '#dbe7f0';
  const ink = dark ? '#eaf0fb' : '#17203a';
  const muted = dark ? '#8d9ab8' : '#53618a';
  const name = profile.name ?? profile.login;
  const items = blocks.has('projects') ? stock(profile.topRepos) : [];
  const height = 540;
  let body = `<rect width="900" height="${height}" fill="${room}"/>`;
  body += `<rect x="40" y="26" width="500" height="490" rx="18" fill="${body2}"/><rect x="46" y="32" width="488" height="478" rx="14" fill="${body1}"/>`;
  body += `<rect x="64" y="44" width="452" height="62" rx="8" fill="${body2}"/>` + photo(profile, 76, 52, 46, 46, 'vend-p', { rx: 23, tile: { fill: glass, ink: ink } }) + text(truncate(name, 20).toUpperCase(), 136, 86, 24, '#ffffff', 'font-weight="800" letter-spacing="2"');
  body += `<rect x="64" y="120" width="340" height="326" rx="6" fill="${glass}" stroke="${body2}" stroke-width="4"/>`;
  items.forEach((repo, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const x = 72 + col * 82;
    const y = 128 + row * 104;
    const color = repo.language ? langColor(repo.language, variant) : hslToHex(hue, 0.3, 0.5);
    let slot = `<rect x="${x}" y="${y + 84}" width="76" height="3" fill="${muted}"/>`;
    slot += `<rect x="${x + 12}" y="${y + 8}" width="52" height="72" rx="6" fill="${color}"/><rect x="${x + 12}" y="${y + 8}" width="52" height="16" rx="6" fill="#fff" fill-opacity="0.25"/>`;
    slot += text(truncate(repo.name, 9), x + 38, y + 50, 9.5, dark ? '#10131a' : '#ffffff', 'text-anchor="middle" font-weight="800"');
    slot += `<rect x="${x + 4}" y="${y + 90}" width="68" height="14" rx="3" fill="#000" fill-opacity="0.6"/>` + text(`${slotCode(i)}  ★ ${formatNumber(repo.stars)}`, x + 38, y + 101, 9, '#7dffb0', 'class="mono" text-anchor="middle" font-weight="700"');
    if (i === 0 && repo.stars > 0) slot += `<rect x="${x}" y="${y - 4}" width="40" height="13" rx="3" fill="#ffd23f"/>` + text('TOP', x + 20, y + 6, 9, '#3a2a00', 'text-anchor="middle" font-weight="800"');
    body += rise(slot, motion, 0.06 * i);
  });
  if (items.length === 0) body += text(blocks.has('projects') ? 'Out of stock' : 'Switch on Top projects to stock the machine.', 234, 270, 15, muted, 'text-anchor="middle" font-style="italic"');
  // The panel: a display and a keypad.
  body += `<rect x="424" y="120" width="96" height="326" rx="8" fill="${body2}"/><rect x="434" y="132" width="76" height="40" rx="4" fill="#06140d"/>`;
  body += text(blocks.has('stats') ? `★ ${formatNumber(profile.totalStars)}` : 'READY', 472, 158, blocks.has('stats') ? 17 : 14, '#7dffb0', 'class="mono" text-anchor="middle" font-weight="800"');
  for (let k = 0; k < 12; k++) body += `<rect x="${438 + (k % 3) * 24}" y="${190 + Math.floor(k / 3) * 30}" width="20" height="24" rx="4" fill="${dark ? '#3b4256' : '#cfd6e6'}"/>` + text(['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'][k]!, 448 + (k % 3) * 24, 207 + Math.floor(k / 3) * 30, 12, ink, 'class="mono" text-anchor="middle" font-weight="700"');
  body += `<rect x="64" y="458" width="340" height="40" rx="6" fill="#06080c"/>` + text('PUSH', 234, 484, 13, '#444c60', 'class="mono" text-anchor="middle" letter-spacing="8"');
  const rx = 590;
  body += text('VENDING MACHINE', rx, 96, 12, muted, 'class="mono" letter-spacing="5" font-weight="700"') + text(truncate(name, 16), rx, 144, 32, ink, 'font-weight="800"') + text(`@${profile.login}`, rx, 170, 13, muted, 'class="mono"');
  wrap(items.length > 0 ? 'Each slot is one of your top projects. The price is its stars, and the code is its slot. TOP marks the most starred.' : 'Nothing to sell yet.', 34, 5).forEach((l, i) => (body += text(l, rx, 230 + i * 22, 14, ink, '')));
  return svgDoc({ height, title: `${name} on GitHub, as a vending machine stocked with top projects priced in stars`, bg: room, radius: 14, css: riseCss(motion), body });
}

export const vending: Template = imageTemplate('vending', 'Vending machine', 'A vending machine stocked with your top projects: each slot has a code and a price in stars.', ['creative', 'object', 'projects'], vendingSvg, {
  extra: () => 'shown as a vending machine',
});

/* ------------------------------------------------------------------------------------------------ */
/* Pinball                                                                                           */
/* ------------------------------------------------------------------------------------------------ */

/** Where the bumpers sit on the table, as fractions of its width and height, the first being the most important one. */
const BUMPER_SPOTS: Array<[number, number]> = [[0.5, 0.2], [0.24, 0.36], [0.76, 0.36], [0.5, 0.5], [0.22, 0.64], [0.78, 0.64]];

/** The size of a bumper: bigger for more stars, on a log scale, between `min` and `max`. */
export function bumperRadius(stars: number, mostStars: number, min = 20, max = 34): number {
  if (!(mostStars > 0) || !(stars > 0)) return min;
  return Math.round((min + (Math.log1p(Math.min(stars, mostStars)) / Math.log1p(mostStars)) * (max - min)) * 10) / 10;
}

/** The bumpers for up to six repositories, the most starred in the best spot, with where each sits on a table `w` wide and `h` high. */
export function bumpers(repos: ReadonlyArray<RepoSummary>, w: number, h: number): Array<{ repo: RepoSummary; x: number; y: number; r: number }> {
  const chosen = stock(repos, BUMPER_SPOTS.length);
  const most = chosen[0]?.stars ?? 0;
  return chosen.map((repo, i) => ({ repo, x: Math.round(BUMPER_SPOTS[i]![0] * w * 10) / 10, y: Math.round(BUMPER_SPOTS[i]![1] * h * 10) / 10, r: bumperRadius(repo.stars, most) }));
}

function pinballSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const hue = hueFor(profile, 300);
  const room = dark ? '#0b0a12' : '#e8e4f1';
  const felt = hslToHex(hue, 0.6, dark ? 0.16 : 0.34);
  const rail = dark ? '#c0c6d8' : '#6a7088';
  const ink = dark ? '#f1ecff' : '#221a3a';
  const muted = dark ? '#9a90bd' : '#5d5280';
  const name = profile.name ?? profile.login;
  const tx = 70;
  const ty = 24;
  const tw = 340;
  const th = 500;
  const height = 548;
  const list = blocks.has('projects') ? bumpers(profile.topRepos, tw, th) : [];
  let body = `<rect width="900" height="${height}" fill="${room}"/>`;
  body += `<rect x="${tx - 10}" y="${ty - 10}" width="${tw + 20}" height="${th + 20}" rx="26" fill="${rail}"/><rect x="${tx}" y="${ty}" width="${tw}" height="${th}" rx="20" fill="${felt}"/>`;
  body += `<path d="M${tx + tw - 36} ${ty + 80}V${ty + th - 20}" stroke="${rail}" stroke-width="3"/><rect x="${tx + tw - 30}" y="${ty + th - 70}" width="20" height="40" rx="4" fill="${rail}"/>`;
  body += `<path d="M${tx + 40} ${ty + th - 120}L${tx + 100} ${ty + th - 60}M${tx + tw - 76} ${ty + th - 120}L${tx + tw - 130} ${ty + th - 60}" stroke="${rail}" stroke-width="4" stroke-linecap="round"/>`;
  body += `<path d="M${tx + 108} ${ty + th - 48}L${tx + 150} ${ty + th - 30}L${tx + 150} ${ty + th - 40}Z" fill="#ff4f6d"/><path d="M${tx + tw - 144} ${ty + th - 48}L${tx + tw - 186} ${ty + th - 30}L${tx + tw - 186} ${ty + th - 40}Z" fill="#ff4f6d"/>`;
  list.forEach((b, i) => {
    const cx = tx + b.x;
    const cy = ty + b.y;
    const color = b.repo.language ? langColor(b.repo.language, variant) : hslToHex(hue, 0.5, 0.6);
    let piece = `<circle cx="${num(cx)}" cy="${num(cy)}" r="${num(b.r + 8)}" fill="${color}" fill-opacity="0.25"/><circle cx="${num(cx)}" cy="${num(cy)}" r="${num(b.r)}" fill="${color}" stroke="#fff" stroke-width="3"/>`;
    piece += text(truncate(b.repo.name, 10), cx, cy - 2, 9.5, dark ? '#10131a' : '#ffffff', 'text-anchor="middle" font-weight="800"') + text(`★ ${formatNumber(b.repo.stars)}`, cx, cy + 11, 9.5, dark ? '#10131a' : '#ffffff', 'class="mono" text-anchor="middle" font-weight="700"');
    body += rise(piece, motion, 0.08 * i);
  });
  if (motion && list.length > 0) {
    // The ball is shot up the lane, then bounces from bumper to bumper and drains, again and again.
    const path = [`M${tx + tw - 20} ${ty + th - 60}`, `L${tx + tw - 20} ${ty + 60}`, ...list.map((b) => `L${num(tx + b.x + (b.x > tw / 2 ? 1 : -1) * (b.r + 8))} ${num(ty + b.y + b.r * 0.4)}`), `L${tx + tw / 2} ${ty + th - 20}`].join('');
    body += `<circle class="ball" r="7" fill="#fff" stroke="#9aa0b4"><animateMotion dur="${6 + list.length * 1.2}s" repeatCount="indefinite" calcMode="linear" path="${path}"/></circle>`;
  } else if (list.length > 0) body += `<circle cx="${tx + tw - 20}" cy="${ty + th - 80}" r="7" fill="#fff" stroke="#9aa0b4"/>`;
  const rx = 480;
  body += text('PINBALL', rx, 96, 12, muted, 'class="mono" letter-spacing="5" font-weight="700"') + text(truncate(name, 18), rx, 144, 34, ink, 'font-weight="800"') + text(`@${profile.login}`, rx, 170, 13, muted, 'class="mono"');
  body += `<rect x="${rx}" y="204" width="360" height="74" rx="8" fill="#050308"/>`;
  body += text(blocks.has('stats') ? formatNumber(profile.totalStars) : '- - -', rx + 180, 258, 44, '#ff9d3d', 'class="mono" text-anchor="middle" font-weight="800"');
  body += text(blocks.has('stats') ? 'SCORE  ·  YOUR STARS' : 'SCORE', rx + 14, 224, 10.5, '#8a6a3a', 'class="mono" letter-spacing="3"');
  wrap(list.length > 0 ? 'Each bumper is one of your top projects, bigger for more stars. The score is your total stars.' : blocks.has('projects') ? 'No projects to bounce off yet.' : 'Switch on Top projects to put bumpers on the table.', 38, 4).forEach((l, i) => (body += text(l, rx, 322 + i * 22, 14, ink, '')));
  const css = riseCss(motion) + (motion ? `@media (prefers-reduced-motion:reduce){.ball{display:none}}` : '');
  return svgDoc({ height, title: `${name} on GitHub, as a pinball table with a bumper for each top project`, bg: room, radius: 14, css, body });
}

export const pinball: Template = imageTemplate('pinball', 'Pinball', 'A pinball table: each top project is a bumper sized by its stars, with your total stars as the score.', ['creative', 'game', 'projects'], pinballSvg, {
  extra: () => 'shown as a pinball table',
});

/* ------------------------------------------------------------------------------------------------ */
/* Sushi belt                                                                                        */
/* ------------------------------------------------------------------------------------------------ */

/**
 * How a belt of `n` plates is laid out: how many plates to draw so the belt is always full, where each goes, and how far
 * the whole row moves for the pattern to start again exactly where it began.
 */
export function belt(n: number, beltWidth: number, spacing: number): { count: number; xs: number[]; loop: number } {
  if (n <= 0) return { count: 0, xs: [], loop: 0 };
  const loop = n * spacing;
  const reps = Math.max(1, Math.ceil((beltWidth + spacing) / loop));
  const count = n * reps + n;
  return { count, xs: Array.from({ length: count }, (_v, i) => i * spacing), loop };
}

function sushiSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const wall = dark ? '#1a1210' : '#f3e6d4';
  const counter = dark ? '#2b1c14' : '#caa57c';
  const beltColor = dark ? '#3a3a42' : '#6f7482';
  const ink = dark ? '#f6ebdd' : '#3a2412';
  const muted = dark ? '#b49c86' : '#80623f';
  const name = profile.name ?? profile.login;
  const items = blocks.has('projects') ? stock(profile.topRepos, 8) : [];
  const spacing = 150;
  const beltX = 40;
  const beltW = 820;
  const layout = belt(items.length, beltW, spacing);
  const height = 470;
  const defs = `<clipPath id="belt-clip"><rect x="${beltX}" y="180" width="${beltW}" height="210"/></clipPath>`;
  let body = `<rect width="900" height="${height}" fill="${wall}"/><rect y="150" width="900" height="${height - 150}" fill="${counter}"/>`;
  body += `<rect x="40" y="30" width="360" height="80" rx="10" fill="${dark ? '#8c2f2a' : '#b8382f'}"/>` + photo(profile, 52, 40, 60, 60, 'sushi-p', { rx: 30, tile: { fill: wall, ink: ink } }) + text(truncate(name, 16), 126, 66, 24, '#fff6e8', 'font-weight="800"') + text(`@${profile.login}  ·  SUSHI GO ROUND`, 126, 90, 11, '#fff6e8', 'class="mono"');
  body += `<rect x="${beltX}" y="270" width="${beltW}" height="26" rx="6" fill="${beltColor}"/>`;
  let plates = '';
  layout.xs.forEach((x, i) => {
    const repo = items[i % items.length]!;
    const color = repo.language ? langColor(repo.language, variant) : hslToHex(30, 0.5, 0.55);
    const cx = beltX + 80 + x;
    const r = 52 + Math.min(10, Math.log1p(repo.stars) * 1.6);
    plates += `<ellipse cx="${num(cx)}" cy="262" rx="${num(r)}" ry="14" fill="${dark ? '#e8e1d4' : '#ffffff'}" stroke="${muted}" stroke-opacity="0.5"/><ellipse cx="${num(cx)}" cy="258" rx="${num(r - 12)}" ry="9" fill="none" stroke="${muted}" stroke-opacity="0.3"/>`;
    plates += `<rect x="${num(cx - 26)}" y="228" width="52" height="26" rx="12" fill="#fffdf4"/><rect x="${num(cx - 29)}" y="222" width="58" height="18" rx="9" fill="${color}"/>`;
    plates += text(truncate(repo.name, 13), cx, 322, 12.5, ink, 'text-anchor="middle" font-weight="700"') + `<rect x="${num(cx - 26)}" y="332" width="52" height="18" rx="9" fill="${dark ? '#8c2f2a' : '#b8382f'}"/>` + text(`★ ${formatNumber(repo.stars)}`, cx, 345, 11, '#fff6e8', 'class="mono" text-anchor="middle" font-weight="700"');
  });
  body += `<g clip-path="url(#belt-clip)"><g${motion && items.length > 0 ? ` class="belt" style="--loop:${-layout.loop}px;animation-duration:${Math.max(12, items.length * 5)}s"` : ''}>${plates}</g></g>`;
  if (items.length === 0) body += text(blocks.has('projects') ? 'The belt is empty.' : 'Switch on Top projects to put plates on the belt.', 450, 270, 15, ink, 'text-anchor="middle" font-style="italic"');
  wrap(items.length > 0 ? 'Each plate is one of your top projects, the topping coloured by its language. The price is its stars.' : '', 80, 2).forEach((l, i) => (body += text(l, 450, 420 + i * 18, 12, muted, 'class="mono" text-anchor="middle"')));
  const css = riseCss(motion) + (motion ? `.belt{animation:belt 30s linear infinite}@keyframes belt{from{transform:translateX(0)}to{transform:translateX(var(--loop))}}@media (prefers-reduced-motion:reduce){.belt{animation:none}}` : '');
  return svgDoc({ height, title: `${name} on GitHub, as a sushi conveyor belt carrying top projects`, bg: wall, radius: 14, defs, css, body });
}

export const sushi: Template = imageTemplate('sushi', 'Sushi belt', 'A sushi conveyor belt: your top projects ride past as plates, topped in the colour of their language and priced in stars.', ['creative', 'food', 'projects'], sushiSvg, {
  extra: () => 'shown as a sushi conveyor belt',
});

/* ------------------------------------------------------------------------------------------------ */
/* Photo booth                                                                                       */
/* ------------------------------------------------------------------------------------------------ */

/** Up to four real facts to caption the four photos, fewer when statistics are off or the data is missing. */
export function boothFacts(profile: Profile, blocks: ReadonlySet<string>): string[] {
  const facts: string[] = [];
  if (blocks.has('stats')) {
    facts.push(`${formatNumber(profile.publicRepos)} ${profile.publicRepos === 1 ? 'repository' : 'repositories'}`, `★ ${formatNumber(profile.totalStars)} ${profile.totalStars === 1 ? 'star' : 'stars'}`, `${formatNumber(profile.followers)} ${profile.followers === 1 ? 'follower' : 'followers'}`);
  }
  const years = yearsBetween(profile.createdAt, profile.fetchedAt);
  const since = isoDate(profile.createdAt)?.slice(0, 4);
  if (since) facts.push(years !== null && years >= 1 ? `${years} ${years === 1 ? 'year' : 'years'} on GitHub` : `on GitHub since ${since}`);
  return facts.slice(0, 4);
}

function boothSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const hue = hueFor(profile, 350);
  const room = dark ? '#150d14' : '#f3e4e8';
  const curtain = hslToHex(hue, 0.7, dark ? 0.28 : 0.42);
  const curtainDark = hslToHex(hue, 0.7, dark ? 0.18 : 0.3);
  const ink = dark ? '#f6eaf0' : '#3a1a28';
  const muted = dark ? '#b898a8' : '#80586a';
  const name = profile.name ?? profile.login;
  const facts = boothFacts(profile, blocks);
  const height = 560;
  const filters = gradientMap('bw', ['#0a0a0a', '#ffffff']) + gradientMap('duo', [hslToHex(hue, 0.7, 0.12), hslToHex((hue + 40) % 360, 0.85, 0.7), '#fff6e8']) + gradientMap('sepia', ['#24160a', '#a8763c', '#f6e1b8']);
  const treatments = [undefined, 'duo', 'bw', 'sepia'];
  let body = `<rect width="900" height="${height}" fill="${room}"/>`;
  // The booth: a sign with bulbs and a curtain.
  body += `<rect x="50" y="30" width="360" height="500" rx="14" fill="${curtainDark}"/><rect x="66" y="90" width="328" height="424" fill="${curtain}"/>`;
  for (let i = 0; i < 9; i++) body += `<path d="M${74 + i * 36} 90V514" stroke="${curtainDark}" stroke-opacity="0.6" stroke-width="6"/>`;
  body += `<rect x="86" y="44" width="288" height="38" rx="8" fill="#190b13"/>` + text('PHOTOS', 230, 72, 24, '#ffd23f', 'text-anchor="middle" font-weight="800" letter-spacing="8"');
  for (let i = 0; i < 12; i++) body += `<circle class="${motion ? (i % 2 ? 'bulb b2' : 'bulb') : ''}" cx="${66 + i * 25.6}" cy="30" r="5" fill="#ffe27a"/>`;
  body += `<path d="M230 120C170 120 150 400 150 514H310C310 400 290 120 230 120Z" fill="#000" fill-opacity="0.35"/>`;
  body += text('4 POSES', 230, 300, 15, '#ffe9f1', 'class="mono" text-anchor="middle" letter-spacing="6" font-weight="700"');
  // The printed strip.
  const sx = 520;
  const sy = 24;
  const sw = 150;
  const fw = 126;
  let strip = `<rect x="${sx}" y="${sy}" width="${sw}" height="${height - 48}" fill="#fffdf8"/>`;
  treatments.forEach((t, i) => {
    const y = sy + 12 + i * 126;
    strip += photo(profile, sx + 12, y, fw, 104, `bt${i}`, { ...(t ? { filter: t } : {}), ref: 'av', tile: { fill: curtain, ink: '#fffdf8' } });
    if (facts[i]) strip += `<rect x="${sx + 12}" y="${y + 84}" width="${fw}" height="20" fill="#000" fill-opacity="0.55"/>` + text(truncate(facts[i]!, 20), sx + 12 + fw / 2, y + 98, 11, '#ffffff', 'class="mono" text-anchor="middle" font-weight="700"');
  });
  body += `<g transform="rotate(2.5 ${sx + sw / 2} ${height / 2})"><rect x="${sx + 5}" y="${sy + 6}" width="${sw}" height="${height - 48}" fill="#000" fill-opacity="0.25"/>${rise(strip, motion, 0.1)}</g>`;
  const rx = 696;
  body += text('PHOTO BOOTH', rx, 96, 11, muted, 'class="mono" letter-spacing="4" font-weight="700"') + text(truncate(name, 15), rx, 136, 21, ink, 'font-weight="800"') + text(`@${truncate(profile.login, 16)}`, rx, 158, 12, muted, 'class="mono"');
  wrap(facts.length > 0 ? 'Four poses of the same picture. The captions are real facts about your profile.' : 'Four poses of the same picture.', 20, 5).forEach((l, i) => (body += text(l, rx, 210 + i * 20, 12.5, ink, '')));
  const css = riseCss(motion) + (motion ? `.bulb{animation:bulb 1.4s steps(1) infinite}.b2{animation-delay:.7s}@keyframes bulb{0%{opacity:1}50%{opacity:.25}}@media (prefers-reduced-motion:reduce){.bulb{animation:none}}` : '');
  return svgDoc({ height, title: `${name} on GitHub, as a strip from a photo booth`, bg: room, radius: 14, defs: filters + pictureDef(profile, 'av'), css, body });
}

export const booth: Template = imageTemplate('booth', 'Photo booth', 'A strip from a photo booth: four poses of your picture, each captioned with a real fact about your profile.', ['creative', 'image', 'fun'], boothSvg, {
  extra: () => 'shown as a photo booth strip',
});

export const shopTemplates: Template[] = [potions, vending, pinball, sushi, booth];

