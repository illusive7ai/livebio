import { hslToHex, hueOf } from '../color';
import type { Variant } from '../themes';
import type { Config, Contributions, Profile, Template } from '../types';
import { formatNumber, truncate, xmlEscape } from '../util';
import { num, riseCss } from './kit';
import { hashOf, imageTemplate, langColor, pictureBox, svgDoc, yearsBetween } from './make';
import { isFresh } from './interfaces';
import { plural, rise } from './shared';

/** Five designs that look like things you can hold: a departures board, a handheld console, a neon sign, a laptop and a pet. */

const hueFor = (profile: Profile, fallback: number): number => hueOf(profile.avatar?.grid.tint) ?? fallback;

const text = (value: string, x: number, y: number, size: number, fill: string, extra = ''): string =>
  `<text x="${num(x)}" y="${num(y)}" font-size="${size}" fill="${fill}" ${extra}>${xmlEscape(value)}</text>`;

/* ------------------------------------------------------------------------------------------------ */
/* Departures board                                                                                  */
/* ------------------------------------------------------------------------------------------------ */

/** A value in a fixed number of cells: cut when too long, padded when too short. Right-aligned for numbers. */
export function cells(value: string, length: number, align: 'left' | 'right' = 'left'): string[] {
  const chars = [...value.toUpperCase()].slice(0, length);
  const pad = Array.from({ length: length - chars.length }, () => ' ');
  return align === 'left' ? [...chars, ...pad] : [...pad, ...chars];
}

/** ACTIVE for a repository pushed to lately, IDLE for one that was not, and nothing for one with no push date. */
export function boardStatus(pushedAt: string | null | undefined, fetchedAt: string | undefined, isFreshFn: (a: string | undefined, b: string | undefined) => boolean): string {
  if (!pushedAt || Number.isNaN(Date.parse(pushedAt))) return '';
  return isFreshFn(pushedAt, fetchedAt) ? 'ACTIVE' : 'IDLE';
}

function departuresSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const bg = dark ? '#090b0e' : '#dfe3e8';
  const tile = dark ? '#171b21' : '#1e2630';
  const ink = dark ? '#ffcf4a' : '#f4f6f8';
  const dim = dark ? '#8a7a3a' : '#9aa6b4';
  const good = dark ? '#6ee79a' : '#8ff0b3';
  const name = profile.name ?? profile.login;
  const repos = blocks.has('projects') ? profile.topRepos.slice(0, 6) : [];
  const read = profile.fetchedAt && !Number.isNaN(Date.parse(profile.fetchedAt)) ? new Date(profile.fetchedAt).toISOString().slice(11, 16) : '';
  const langs = blocks.has('languages') ? profile.languages.slice(0, 4) : [];
  const px = 19;
  const rowH = 42;
  const x0 = 46;
  const cols: Array<[string, number, 'left' | 'right']> = [['DESTINATION', 16, 'left'], ['GATE', 10, 'left'], ['STARS', 6, 'right'], ['STATUS', 6, 'left']];
  const gap = 18;
  const top = 128;
  const height = top + Math.max(repos.length, 1) * rowH + (langs.length > 0 ? 80 : 44);

  let body = `<rect x="22" y="22" width="856" height="${height - 44}" rx="12" fill="${dark ? '#10141a' : '#ffffff'}" stroke="${dark ? '#252c36' : '#b8c0ca'}" stroke-width="2"/>`;
  body += pictureBox(profile, ink, '#000000', 46, 40, 44, 44, 22, 'db');
  body += text('DEPARTURES', 106, 66, 26, ink, 'font-weight="800" letter-spacing="6"');
  body += text(`@${truncate(profile.login, 24)}  ·  ${truncate(name, 24)}`, 106, 86, 12.5, dim, 'class="mono"');
  if (read) body += text(`${read} UTC`, 852, 66, 26, ink, 'class="mono" text-anchor="end" font-weight="700"');
  let cx = x0;
  for (const [label, length] of cols) {
    body += text(label, cx, top - 8, 10, dim, 'letter-spacing="3" font-weight="800"');
    cx += length * px + gap;
  }
  if (repos.length === 0) body += text(blocks.has('projects') ? 'NO DEPARTURES TODAY' : 'THE PROJECTS SECTION IS SWITCHED OFF', x0, top + 28, 18, dim, 'class="mono" font-weight="700"');
  repos.forEach((repo, r) => {
    const y = top + r * rowH;
    const status = boardStatus(repo.pushedAt, profile.fetchedAt, (pushed, read) => isFresh({ ...repo, pushedAt: pushed }, read));
    const values: string[][] = [cells(repo.name, 16), cells(repo.language ?? '', 10), cells(formatNumber(repo.stars), 6, 'right'), cells(status, 6)];
    let x = x0;
    values.forEach((chars, c) => {
      chars.forEach((ch, i) => {
        const delay = (0.05 * r + 0.012 * (i + c * 6)).toFixed(3);
        body += `<g class="flap" style="animation-delay:${delay}s"><rect x="${x + i * px}" y="${y}" width="${px - 2}" height="32" rx="3" fill="${tile}"/>`;
        body += `<path d="M${x + i * px} ${y + 16}h${px - 2}" stroke="#000" stroke-opacity="0.55"/>`;
        if (ch !== ' ') body += `<text x="${x + i * px + (px - 2) / 2}" y="${y + 23}" text-anchor="middle" font-size="19" font-weight="800" class="mono" fill="${c === 3 ? (status === 'ACTIVE' ? good : dim) : ink}">${xmlEscape(ch)}</text>`;
        body += `</g>`;
      });
      x += cols[c]![1] * px + gap;
    });
  });
  if (langs.length > 0) {
    body += text(`MADE WITH  ${langs.map((l) => `${l.name.toUpperCase()} ${Math.round(l.percent)}%`).join('   ')}`, x0, height - 40, 12.5, dim, 'class="mono" font-weight="700"');
  }
  const css =
    riseCss(motion) +
    (motion ? `.flap{transform-box:fill-box;transform-origin:center;animation:flip .45s ease-out both}@keyframes flip{from{transform:scaleY(.05);opacity:.2}}@media (prefers-reduced-motion:reduce){.flap{animation:none}}` : '');
  return svgDoc({ height, title: `${name} on GitHub, as a departures board`, bg, radius: 14, css, body });
}

export const departures: Template = imageTemplate('departures', 'Departures board', 'An airport split-flap board: a row for each repository, with its language, stars and whether it is active.', ['creative', 'device', 'projects'], departuresSvg, {
  extra: () => 'shown as an airport departures board with a row for each repository',
});

/* ------------------------------------------------------------------------------------------------ */
/* Handheld console                                                                                  */
/* ------------------------------------------------------------------------------------------------ */

function handheldSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const hue = hueFor(profile, 280);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const desk = dark ? '#14121a' : '#d8d4e0';
  const shell = dark ? '#3a3548' : '#cfcac0';
  const shellEdge = dark ? '#262232' : '#a9a498';
  const bezel = dark ? '#1c1a26' : '#5b586a';
  const lcd = dark ? '#8bac0f' : '#9bbc0f';
  const lcdInk = '#0f380f';
  const lcdDim = '#306230';
  const accent = hslToHex(hue, 0.55, dark ? 0.5 : 0.42);
  const name = profile.name ?? profile.login;
  const years = yearsBetween(profile.createdAt, profile.fetchedAt);
  const repos = blocks.has('projects') ? profile.topRepos.slice(0, 3) : [];
  const langs = blocks.has('languages') ? profile.languages.slice(0, 3).map((l) => l.name) : [];
  const height = 520;
  const sx = 258;
  const sy = 70;
  const sw = 384;
  const sh = 312;

  let body = `<rect x="90" y="30" width="720" height="${height - 50}" rx="30" fill="${shellEdge}"/><rect x="90" y="24" width="720" height="${height - 50}" rx="30" fill="${shell}"/>`;
  body += `<rect x="${sx - 30}" y="${sy - 26}" width="${sw + 60}" height="${sh + 80}" rx="14" fill="${bezel}"/>`;
  body += text('PROFILE-PAD', sx + sw / 2, sy - 6, 11, dark ? '#9a94b0' : '#cfcce0', 'text-anchor="middle" letter-spacing="5" font-weight="800"');
  body += `<rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" fill="${lcd}"/>`;
  // What the screen shows.
  let y = sy + 36;
  body += text(truncate(name.toUpperCase(), 20), sx + 18, y, 21, lcdInk, 'class="mono" font-weight="800"');
  y += 24;
  body += text(`@${truncate(profile.login, 24)}`, sx + 18, y, 14, lcdDim, 'class="mono" font-weight="700"');
  const facts: string[] = [];
  if (years !== null) facts.push(`YRS ${years}`);
  if (blocks.has('stats')) facts.push(`REPOS ${formatNumber(profile.publicRepos)}`, `STARS ${formatNumber(profile.totalStars)}`, `FANS ${formatNumber(profile.followers)}`);
  facts.slice(0, 4).forEach((fact, i) => {
    body += text(fact, sx + 18 + (i % 2) * 180, y + 32 + Math.floor(i / 2) * 24, 15, lcdInk, 'class="mono" font-weight="800"');
  });
  y += 32 + Math.ceil(Math.min(4, facts.length) / 2) * 24 + 14;
  if (langs.length > 0) {
    body += text(`TYPE: ${langs.join('/').toUpperCase()}`, sx + 18, y, 13, lcdDim, 'class="mono" font-weight="800"');
    y += 22;
  }
  if (repos.length > 0) {
    body += `<path d="M${sx + 14} ${y - 8}H${sx + sw - 14}" stroke="${lcdInk}" stroke-width="2"/>`;
    body += text('MOVES', sx + 18, y + 12, 12, lcdDim, 'class="mono" font-weight="800" letter-spacing="3"');
    repos.forEach((repo, i) => {
      body += text(`${i === 0 ? '▶' : ' '} ${truncate(repo.name.toUpperCase(), 15)}`, sx + 18, y + 34 + i * 22, 15, lcdInk, 'class="mono" font-weight="800"');
      body += text(formatNumber(repo.stars), sx + sw - 18, y + 34 + i * 22, 15, lcdInk, 'class="mono" text-anchor="end" font-weight="800"');
    });
  }
  for (let line = 0; line < sh; line += 3) body += `<path d="M${sx} ${sy + line}h${sw}" stroke="#000" stroke-opacity="0.07"/>`;
  // The controls.
  const dx = 168;
  const dy = 300;
  body += `<path d="M${dx - 15} ${dy - 45}h30v30h30v30h-30v30h-30v-30h-30v-30h30z" fill="${bezel}"/>`;
  body += `<circle cx="${735}" cy="${dy - 5}" r="26" fill="${accent}"/><circle cx="${679}" cy="${dy + 20}" r="26" fill="${accent}"/>`;
  body += text('A', 735, dy + 3, 17, '#ffffff', 'text-anchor="middle" font-weight="800"') + text('B', 679, dy + 28, 17, '#ffffff', 'text-anchor="middle" font-weight="800"');
  for (const [px, label] of [[390, 'SELECT'], [510, 'START']] as const) {
    body += `<rect x="${px - 34}" y="${sy + sh + 52}" width="68" height="16" rx="8" fill="${bezel}" transform="rotate(-20 ${px} ${sy + sh + 60})"/>`;
    body += text(label, px, sy + sh + 90, 10, dark ? '#9a94b0' : '#6c6880', 'text-anchor="middle" letter-spacing="2" font-weight="800"');
  }
  for (let i = 0; i < 5; i++) body += `<rect x="${704 + i * 16}" y="410" width="7" height="46" rx="3.5" fill="${shellEdge}" transform="rotate(-20 ${708 + i * 16} 433)"/>`;
  body += `<circle cx="${sx - 10}" cy="${sy + 100}" r="5" fill="${motion ? '#e0342b' : '#8a2a24'}" class="led"/>`;

  const css = riseCss(motion) + (motion ? `.led{animation:glow 2.2s ease-in-out infinite alternate}@keyframes glow{from{opacity:.35}to{opacity:1}}@media (prefers-reduced-motion:reduce){.led{animation:none}}` : '');
  return svgDoc({ height, title: `${name} on GitHub, as a handheld console`, bg: desk, radius: 14, css, body: rise(body, motion, 0.05) });
}

export const handheld: Template = imageTemplate('handheld', 'Handheld console', 'A green-screen handheld: your name, numbers and best repositories as moves.', ['creative', 'device', 'fun'], handheldSvg, {
  extra: () => 'shown as a handheld game console with a green screen',
});

/* ------------------------------------------------------------------------------------------------ */
/* Neon sign                                                                                         */
/* ------------------------------------------------------------------------------------------------ */

function neonSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const hue = hueFor(profile, 320);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const wall = dark ? '#1a1114' : '#b9694f';
  const brick = dark ? '#2a1a1d' : '#c97a5f';
  const mortar = dark ? '#120b0d' : '#a45a42';
  const name = (profile.name ?? profile.login).trim();
  const main = hslToHex(hue, 1, dark ? 0.62 : 0.55);
  const second = hslToHex((hue + 150) % 360, 1, dark ? 0.62 : 0.5);
  const off = dark ? '#5a4a52' : '#e8d3c8';
  const height = 440;
  const size = Math.max(44, Math.min(120, Math.floor(780 / (Math.max(name.length, 1) * 0.62))));

  let bricks = '';
  for (let r = 0; r < Math.ceil(height / 30); r++) {
    for (let c = -1; c < 10; c++) bricks += `<rect x="${c * 100 + (r % 2) * 50 + 2}" y="${r * 30 + 2}" width="96" height="26" fill="${brick}" fill-opacity="${0.6 + ((hashOf(`${profile.login}:${r}:${c}`) % 5) * 0.08)}"/>`;
  }
  const defs = `<filter id="glow" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="${dark ? 7 : 0.01}"/></filter>`;
  let body = `<rect width="900" height="${height}" fill="${mortar}"/>${bricks}`;
  if (dark) body += `<rect width="900" height="${height}" fill="#000" fill-opacity="0.3"/>`;

  const tube = (value: string, x: number, y: number, fs: number, color: string, extra = '', cls = ''): string => {
    const t = xmlEscape(value);
    const lit = dark;
    let out = '';
    if (lit) out += `<text x="${x}" y="${y}" font-size="${fs}" fill="none" stroke="${color}" stroke-width="${Math.max(3, fs / 9)}" filter="url(#glow)" ${extra}>${t}</text>`;
    out += `<text${cls} x="${x}" y="${y}" font-size="${fs}" fill="none" stroke="${lit ? color : off}" stroke-width="${Math.max(1.6, fs / 18)}" stroke-linejoin="round" ${extra}>${t}</text>`;
    if (lit) out += `<text x="${x}" y="${y}" font-size="${fs}" fill="none" stroke="#ffffff" stroke-opacity="0.8" stroke-width="${Math.max(0.6, fs / 60)}" ${extra}>${t}</text>`;
    return out;
  };
  body += tube(truncate(name, 24).toUpperCase(), 450, 170, size, main, 'text-anchor="middle" font-weight="800" letter-spacing="3"', ' class="flicker"');
  body += tube(`@${profile.login}`, 450, 232, 34, second, 'text-anchor="middle" font-weight="700" letter-spacing="4"');
  const items: Array<[string, string]> = [];
  if (blocks.has('stats')) items.push([`${formatNumber(profile.totalStars)} STARS`, main], [`${formatNumber(profile.followers)} FOLLOWERS`, second]);
  if (blocks.has('languages')) for (const [i, l] of profile.languages.slice(0, 3).entries()) items.push([l.name.toUpperCase(), i % 2 ? main : second]);
  let x = 70;
  let y = 312;
  items.forEach(([label, color]) => {
    const w = label.length * 17 + 40;
    if (x + w > 840) {
      x = 70;
      y += 62;
    }
    body += `<rect x="${x}" y="${y - 30}" width="${w}" height="44" rx="22" fill="none" stroke="${dark ? color : off}" stroke-width="3"${dark ? ' filter="url(#glow)"' : ''}/><rect x="${x}" y="${y - 30}" width="${w}" height="44" rx="22" fill="none" stroke="${dark ? color : off}" stroke-width="2"/>`;
    body += text(label, x + w / 2, y, 21, dark ? color : '#8a6a5e', 'text-anchor="middle" font-weight="700" letter-spacing="2"');
    x += w + 18;
  });
  const css = riseCss(motion) + (motion ? `.flicker{animation:flick 5s steps(1) infinite}@keyframes flick{0%,92%,96%,100%{opacity:1}93%,95%{opacity:.25}94%{opacity:.8}}@media (prefers-reduced-motion:reduce){.flicker{animation:none}}` : '');
  return svgDoc({ height, title: `${name} on GitHub, as a neon sign`, bg: wall, radius: 14, css, defs, body });
}

export const neon: Template = imageTemplate('neon', 'Neon sign', 'A glowing neon sign on a brick wall: your name, handle and numbers in tube light. It is unlit in the light theme.', ['creative', 'device', 'fun'], neonSvg, {
  extra: () => 'shown as a neon sign on a brick wall',
});

/* ------------------------------------------------------------------------------------------------ */
/* Laptop stickers                                                                                   */
/* ------------------------------------------------------------------------------------------------ */

/** Places for stickers on the lid, each a centre and a size. The same slots are used every time. */
export const STICKER_SLOTS: Array<{ x: number; y: number }> = [
  { x: 190, y: 160 }, { x: 330, y: 120 }, { x: 470, y: 170 }, { x: 610, y: 120 }, { x: 740, y: 190 },
  { x: 150, y: 300 }, { x: 290, y: 280 }, { x: 440, y: 330 }, { x: 590, y: 290 }, { x: 730, y: 350 },
  { x: 220, y: 410 }, { x: 590, y: 420 },
];

function laptopSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const hue = hueFor(profile, 200);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const desk = dark ? '#15171c' : '#d9dde3';
  const lid = dark ? '#8b919b' : '#c9ced6';
  const lidEdge = dark ? '#5d626b' : '#9aa1ab';
  const name = profile.name ?? profile.login;
  const langs = blocks.has('languages') ? profile.languages.slice(0, 5) : [];
  const repos = blocks.has('projects') ? profile.topRepos.slice(0, 5) : [];
  const height = 560;

  const stickers: string[] = [];
  const sticker = (i: number, draw: (x: number, y: number) => string) => {
    const slot = STICKER_SLOTS[i];
    if (!slot) return;
    const rot = ((hashOf(`${profile.login}:sticker:${i}`) % 21) - 10) * 0.9;
    stickers.push(`<g class="stk" style="animation-delay:${(0.1 + i * 0.07).toFixed(2)}s" transform="rotate(${num(rot)} ${slot.x} ${slot.y})">${draw(slot.x, slot.y)}</g>`);
  };
  let slot = 0;
  sticker(slot++, (x, y) => `<circle cx="${x}" cy="${y}" r="60" fill="#fff"/>${pictureBox(profile, hslToHex(hue, 0.6, 0.5), '#ffffff', x - 54, y - 54, 108, 108, 54, 'ls')}`);
  langs.forEach((lang) => {
    const r = 34 + lang.percent * 0.42;
    sticker(slot++, (x, y) => `<circle cx="${x}" cy="${y}" r="${num(r + 5)}" fill="#fff"/><circle cx="${x}" cy="${y}" r="${num(r)}" fill="${langColor(lang.name, variant)}"/>${text(truncate(lang.name, 10), x, y - 2, Math.max(9, Math.min(20, (r * 1.7) / (Math.min(lang.name.length, 10) * 0.62))), '#ffffff', 'text-anchor="middle" font-weight="800"')}${text(`${Math.round(lang.percent)}%`, x, y + 17, 13, '#ffffff', 'class="mono" text-anchor="middle" font-weight="700"')}`);
  });
  repos.forEach((repo) => {
    const w = Math.min(190, 60 + repo.name.length * 9);
    sticker(slot++, (x, y) => `<rect x="${x - w / 2 - 5}" y="${y - 31}" width="${w + 10}" height="62" rx="14" fill="#fff"/><rect x="${x - w / 2}" y="${y - 26}" width="${w}" height="52" rx="10" fill="${repo.language ? langColor(repo.language, variant) : '#6b7280'}" fill-opacity="0.95"/>${text(truncate(repo.name, 16), x, y - 3, 15, '#ffffff', 'text-anchor="middle" font-weight="800"')}${text(`★ ${formatNumber(repo.stars)}`, x, y + 16, 12.5, '#ffffff', 'class="mono" text-anchor="middle" font-weight="700"')}`);
  });
  if (blocks.has('stats')) sticker(slot++, (x, y) => `<path d="M${x} ${y + 40}C${x - 90} ${y - 20} ${x - 40} ${y - 70} ${x} ${y - 28}C${x + 40} ${y - 70} ${x + 90} ${y - 20} ${x} ${y + 40}Z" fill="#fff" stroke="#fff" stroke-width="10" stroke-linejoin="round"/><path d="M${x} ${y + 40}C${x - 90} ${y - 20} ${x - 40} ${y - 70} ${x} ${y - 28}C${x + 40} ${y - 70} ${x + 90} ${y - 20} ${x} ${y + 40}Z" fill="#e0425a"/>${text(formatNumber(profile.followers), x, y + 2, 19, '#ffffff', 'text-anchor="middle" font-weight="800"')}${text('followers', x, y + 19, 10.5, '#ffffff', 'text-anchor="middle" font-weight="700"')}`);
  sticker(slot++, (x, y) => `<rect x="${x - 70}" y="${y - 20}" width="140" height="40" rx="20" fill="#fff"/><rect x="${x - 65}" y="${y - 15}" width="130" height="30" rx="15" fill="#16181d"/>${text(`@${truncate(profile.login, 14)}`, x, y + 5, 14, '#ffffff', 'class="mono" text-anchor="middle" font-weight="700"')}`);

  let body = `<rect x="70" y="30" width="760" height="470" rx="26" fill="${lidEdge}"/><rect x="70" y="24" width="760" height="470" rx="26" fill="${lid}"/>`;
  body += `<path d="M96 40H804" stroke="#fff" stroke-opacity="0.35" stroke-width="2"/>`;
  body += stickers.join('');
  body += `<path d="M30 500H870L850 530H50Z" fill="${lidEdge}"/><rect x="380" y="500" width="140" height="8" rx="4" fill="${dark ? '#40444c' : '#8a919b'}"/>`;
  const css = riseCss(motion) + (motion ? `.stk{transform-box:fill-box;transform-origin:center;animation:peel .45s ease-out both}@keyframes peel{from{opacity:0;transform:scale(1.3)}}@media (prefers-reduced-motion:reduce){.stk{animation:none}}` : '');
  return svgDoc({ height, title: `${name} on GitHub, as a laptop covered in stickers`, bg: desk, radius: 14, css, body });
}

export const laptop: Template = imageTemplate('laptop', 'Laptop stickers', 'A laptop lid covered in die-cut stickers: your photo, a round sticker for each language and one for each repository.', ['creative', 'device', 'fun'], laptopSvg, {
  extra: () => 'shown as a laptop lid covered in stickers',
});

/* ------------------------------------------------------------------------------------------------ */
/* Pixel pet                                                                                         */
/* ------------------------------------------------------------------------------------------------ */

export type Mood = 'happy' | 'content' | 'sleepy' | 'hungry' | 'unknown';

/** Whole days between the last day with activity and the last day of the data, or null when there was none at all. */
export function daysSinceActive(contributions: Contributions | undefined): number | null {
  if (!contributions || contributions.days.length === 0) return null;
  const days = contributions.days;
  const last = [...days].reverse().find((d) => d.count > 0);
  if (!last) return null;
  const gap = Math.round((Date.parse(`${days[days.length - 1]!.date}T00:00:00Z`) - Date.parse(`${last.date}T00:00:00Z`)) / 86_400_000);
  return Number.isFinite(gap) && gap >= 0 ? gap : null;
}

/** How the pet feels, from how long ago there was last activity. With no data it does not pretend to know. */
export function petMood(contributions: Contributions | undefined): Mood {
  if (!contributions || contributions.days.length === 0) return 'unknown';
  const gap = daysSinceActive(contributions);
  if (gap === null) return 'hungry';
  if (gap <= 1) return 'happy';
  if (gap <= 7) return 'content';
  if (gap <= 30) return 'sleepy';
  return 'hungry';
}

const PET = [
  '....XXXXXX....',
  '..XXXXXXXXXX..',
  '.XXXXXXXXXXXX.',
  'XXXXXXXXXXXXXX',
  'XXXXXXXXXXXXXX',
  'XXXXXXXXXXXXXX',
  'XXXXXXXXXXXXXX',
  '.XXXXXXXXXXXX.',
  '..XXXXXXXXXX..',
  '...XX....XX...',
];

function petSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const hue = hueFor(profile, 150);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const sky = dark ? '#161a2b' : '#bfe3f5';
  const hill = dark ? '#1f3a2a' : '#8fd18a';
  const panel = dark ? '#0f1220' : '#ffffff';
  const ink = dark ? '#eef1ff' : '#1d2433';
  const muted = dark ? '#8d96b8' : '#5d6785';
  const body = hslToHex(hue, 0.7, dark ? 0.6 : 0.62);
  const edge = hslToHex(hue, 0.7, dark ? 0.35 : 0.38);
  const name = profile.name ?? profile.login;
  const activity = blocks.has('activity') ? profile.contributions : undefined;
  const mood = petMood(activity);
  const gap = daysSinceActive(activity);
  const cell = 15;
  const ox = 120;
  const oy = 150;

  let art = `<g class="${mood === 'happy' ? 'hop' : mood === 'sleepy' ? 'doze' : ''}">`;
  PET.forEach((row, r) => {
    [...row].forEach((ch, c) => {
      if (ch === 'X') art += `<rect x="${ox + c * cell}" y="${oy + r * cell}" width="${cell}" height="${cell}" fill="${body}"/>`;
    });
  });
  // The outline: the pixels just inside the edge of the body.
  art += `<rect x="${ox + 4 * cell}" y="${oy}" width="${6 * cell}" height="3" fill="${edge}"/>`;
  const eye = (c: number): string => {
    const x = ox + c * cell;
    const y = oy + 4 * cell;
    if (mood === 'sleepy') return `<rect x="${x}" y="${y + 6}" width="${cell * 2}" height="4" fill="${edge}"/>`;
    if (mood === 'hungry') return `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="${edge}"/><rect x="${x + cell}" y="${y + cell}" width="${cell}" height="${cell}" fill="${edge}"/>`;
    return `<rect x="${x}" y="${y}" width="${cell * 2}" height="${cell * 2}" fill="#1d2433"/><rect x="${x + 3}" y="${y + 3}" width="5" height="5" fill="#ffffff"/>`;
  };
  art += eye(3) + eye(9);
  const my = oy + 7 * cell;
  if (mood === 'happy') art += `<path d="M${ox + 5 * cell} ${my}h${4 * cell}v${cell}h${-cell}v${cell}h${-2 * cell}v${-cell}h${-cell}z" fill="#1d2433"/>`;
  else if (mood === 'content') art += `<rect x="${ox + 5 * cell}" y="${my + 4}" width="${4 * cell}" height="${cell * 0.5}" fill="#1d2433"/>`;
  else if (mood === 'sleepy') art += `<rect x="${ox + 6 * cell}" y="${my + 4}" width="${2 * cell}" height="${cell * 0.6}" fill="#1d2433"/>`;
  else if (mood === 'hungry') art += `<path d="M${ox + 5 * cell} ${my + cell}h${cell}v${-cell}h${2 * cell}v${cell}h${cell}v${cell * 0.6}h${-4 * cell}z" fill="#1d2433"/>`;
  else art += `<rect x="${ox + 6 * cell}" y="${my + 4}" width="${2 * cell}" height="${cell * 0.5}" fill="#1d2433"/>`;
  art += `</g>`;
  if (mood === 'sleepy') art += `<text x="${ox + 15 * cell}" y="${oy + 2 * cell}" font-size="26" font-weight="800" fill="${muted}" class="mono">z</text><text x="${ox + 16.5 * cell}" y="${oy - 4}" font-size="20" font-weight="800" fill="${muted}" class="mono">z</text>`;

  const message =
    mood === 'unknown'
      ? 'Waiting for activity data.'
      : activity && activity.currentStreak > 0
        ? `I am on a ${activity.currentStreak}-day streak!`
        : gap === null
          ? 'No activity this year.'
          : gap === 0
            ? 'You were active today!'
            : `I last saw activity ${plural(gap, 'day')} before the data ends.`;

  let scene = `<rect x="0" y="0" width="900" height="400" fill="${sky}"/>`;
  scene += `<ellipse cx="${ox + 7 * cell}" cy="${oy + 10 * cell + 22}" rx="${9 * cell}" ry="28" fill="${hill}"/>`;
  scene += art;
  let side = `<rect x="440" y="40" width="404" height="320" rx="16" fill="${panel}"/>`;
  side += text(truncate(name, 22), 464, 82, 24, ink, 'font-weight="800"');
  side += text(`@${truncate(profile.login, 26)}`, 464, 104, 13, muted, 'class="mono"');
  side += `<rect x="464" y="124" width="356" height="48" rx="12" fill="${body}" fill-opacity="0.25"/>` + text(truncate(message, 40), 478, 154, 16, ink, 'font-weight="700"');
  const bars: Array<[string, number, string]> = [];
  if (activity) {
    bars.push(['STREAK', activity.longestStreak > 0 ? activity.currentStreak / activity.longestStreak : 0, `${activity.currentStreak} of ${activity.longestStreak} days (best)`]);
    bars.push(['ACTIVE DAYS', activity.days.length > 0 ? activity.activeDays / activity.days.length : 0, `${activity.activeDays} of ${activity.days.length} days`]);
    const recent = activity.days.slice(-30);
    const active = recent.filter((d) => d.count > 0).length;
    bars.push(['LAST 30 DAYS', recent.length > 0 ? active / recent.length : 0, `${active} of ${recent.length} days`]);
  }
  if (bars.length === 0) side += text(blocks.has('activity') ? 'Activity appears after the first automatic update.' : 'The activity section is switched off.', 464, 210, 13, muted, 'font-style="italic"');
  bars.forEach(([label, frac, caption], i) => {
    const y = 206 + i * 52;
    side += text(label, 464, y, 11, muted, 'letter-spacing="3" font-weight="800"') + text(caption, 820, y, 12, ink, 'class="mono" text-anchor="end"');
    side += `<rect x="464" y="${y + 8}" width="356" height="14" rx="7" fill="${muted}" fill-opacity="0.25"/><rect x="464" y="${y + 8}" width="${num(Math.max(0, Math.min(1, frac)) * 356)}" height="14" rx="7" fill="${body}"/>`;
  });
  const css = riseCss(motion) + (motion ? `.hop{animation:hop .9s ease-in-out infinite alternate}@keyframes hop{to{transform:translateY(-16px)}}.doze{animation:doze 3s ease-in-out infinite alternate}@keyframes doze{to{transform:translateY(4px)}}@media (prefers-reduced-motion:reduce){.hop,.doze{animation:none}}` : '');
  return svgDoc({ height: 400, title: `${name} on GitHub, as a pixel pet`, bg: sky, radius: 14, css, body: rise(scene + side, motion, 0.05) });
}

export const pet: Template = imageTemplate('pet', 'Pixel pet', 'A pixel pet whose mood follows your real activity: happy when you coded lately, sleepy when you have not.', ['creative', 'device', 'activity'], petSvg, {
  extra: () => 'shown as a pixel pet whose mood follows recent activity',
});

export const deviceTemplates: Template[] = [departures, handheld, neon, laptop, pet];
