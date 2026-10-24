import { hslToHex, hueOf } from '../color';
import type { Variant } from '../themes';
import type { Config, ContributionDay, Profile, Template } from '../types';
import { formatNumber, truncate, wrap, xmlEscape } from '../util';
import { num, riseCss } from './kit';
import { hashOf, imageTemplate, langColor, svgDoc } from './make';
import { channelFilter, gradientMap, hasPicture, inkFilter, lumaAt, lumaRange, photo, pictureDef, stretchLuma } from './photo';
import { rise, seeded } from './shared';

/** Five designs that treat the profile picture as a photograph: a moodboard, a two-ink print, a glitch, a heat map and a halftone. */

const hueFor = (profile: Profile, fallback: number): number => hueOf(profile.avatar?.grid.tint) ?? fallback;

const text = (value: string, x: number, y: number, size: number, fill: string, extra = ''): string =>
  `<text x="${num(x)}" y="${num(y)}" font-size="${size}" fill="${fill}" ${extra}>${xmlEscape(value)}</text>`;

/** The activity a design may draw: none when the section is off or the calendar is missing or empty. */
function daysOf(profile: Profile, config: Config): ContributionDay[] {
  return config.blocks.includes('activity') && profile.contributions ? profile.contributions.days : [];
}

/* ------------------------------------------------------------------------------------------------ */
/* Moodboard                                                                                         */
/* ------------------------------------------------------------------------------------------------ */

/**
 * Places boxes of different heights into columns, each into the shortest column so far, the way a pinboard fills.
 * Returns where each one goes and how tall the whole board is.
 */
export function masonry(heights: ReadonlyArray<number>, cols: number, colWidth: number, gap: number, left = 0, top = 0): { slots: Array<{ x: number; y: number; col: number }>; height: number } {
  const bottoms = Array.from({ length: Math.max(1, cols) }, () => top);
  const slots = heights.map((h) => {
    let col = 0;
    for (let i = 1; i < bottoms.length; i++) if (bottoms[i]! < bottoms[col]!) col = i;
    const slot = { x: left + col * (colWidth + gap), y: bottoms[col]!, col };
    bottoms[col] = bottoms[col]! + h + gap;
    return slot;
  });
  return { slots, height: Math.max(top, ...bottoms.map((b) => b - gap)) };
}

interface Pin {
  h: number;
  /** A sticky note, which has no card behind it. */
  note?: boolean;
  draw: (x: number, y: number, w: number, index: number) => string;
}

function moodboardSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const hue = hueFor(profile, 20);
  const accent = hslToHex(hue, 0.75, dark ? 0.66 : 0.42);
  const board = dark ? '#1b1a1f' : '#eadfcb';
  const cardFill = dark ? '#2a2830' : '#fffdf7';
  const ink = dark ? '#ece8f1' : '#2b2118';
  const muted = dark ? '#9b96a6' : '#6d5f4e';
  const name = profile.name ?? profile.login;
  const colW = 264;
  const gap = 18;
  const left = 36;
  const top = 92;
  const pins: Pin[] = [];

  const photoPin = (zoom: number, focus: [number, number], ratio: number, id: string): Pin => ({
    h: Math.round(colW * ratio),
    draw: (x, y, w) => photo(profile, x + 8, y + 8, w - 16, Math.round(colW * ratio) - 16, id, { zoom, focus, rx: 4, ref: 'av', tile: { fill: accent, ink: board } }),
  });
  const languages = blocks.has('languages') ? profile.languages.slice(0, 5) : [];
  const repos = blocks.has('projects') ? profile.topRepos.slice(0, 3) : [];

  pins.push(photoPin(1, [0.5, 0.5], 1.18, 'mb0'));
  if (languages.length > 0) {
    pins.push({
      h: 56 + languages.length * 36,
      draw: (x, y, w) => {
        let out = text('PALETTE', x + 16, y + 30, 11, muted, 'class="mono" letter-spacing="3" font-weight="700"');
        languages.forEach((l, i) => {
          const yy = y + 44 + i * 36;
          out += `<rect x="${x + 16}" y="${yy}" width="${w - 32}" height="28" rx="3" fill="${langColor(l.name, variant)}"/>`;
          out += text(truncate(l.name, 16), x + 26, yy + 19, 13, dark ? '#101014' : '#ffffff', 'font-weight="800"');
          out += text(`${l.percent}%`, x + w - 26, yy + 19, 12, dark ? '#101014' : '#ffffff', 'class="mono" text-anchor="end" font-weight="700"');
        });
        return out;
      },
    });
  }
  if (hasPicture(profile)) pins.push(photoPin(2.4, [0.3, 0.25], 0.8, 'mb1'));
  if (blocks.has('stats')) {
    pins.push({
      h: 104,
      draw: (x, y, w) => text(`★ ${formatNumber(profile.totalStars)}`, x + w / 2, y + 62, 40, accent, 'text-anchor="middle" font-weight="800"') + text('stars across all repositories', x + w / 2, y + 86, 12, muted, 'text-anchor="middle"'),
    });
    pins.push({
      h: 104,
      draw: (x, y, w) => text(formatNumber(profile.followers), x + w / 2, y + 62, 40, ink, 'text-anchor="middle" font-weight="800"') + text('followers', x + w / 2, y + 86, 12, muted, 'text-anchor="middle"'),
    });
  }
  if (profile.bio) {
    const lines = wrap(profile.bio, 26, 5);
    pins.push({
      h: 44 + lines.length * 22,
      draw: (x, y, w) => text('“', x + 16, y + 44, 44, accent, 'class="serif"') + lines.map((line, i) => text(line, x + 20, y + 46 + i * 22, 15, ink, 'class="serif" font-style="italic"')).join(''),
    });
  }
  if (hasPicture(profile)) pins.push(photoPin(3, [0.75, 0.7], 1.05, 'mb2'));
  repos.forEach((repo) => {
    pins.push({
      h: 92,
      note: true,
      draw: (x, y, w) =>
        `<rect x="${x + 6}" y="${y + 6}" width="${w - 12}" height="${80}" fill="${dark ? '#f2d974' : '#ffe27a'}" transform="rotate(-1 ${x + w / 2} ${y + 46})"/>` +
        text(truncate(repo.name, 22), x + 18, y + 34, 15, '#2a2008', 'font-weight="800"') +
        text(`★ ${formatNumber(repo.stars)}${repo.language ? `  ·  ${truncate(repo.language, 12)}` : ''}`, x + 18, y + 58, 12.5, '#5a4a14', 'class="mono"'),
    });
  });
  if (hasPicture(profile)) pins.push(photoPin(1.7, [0.9, 0.15], 0.9, 'mb3'));

  const layout = masonry(pins.map((p) => p.h), 3, colW, gap, left, top);
  const height = Math.max(layout.height + 40, 220);
  let body = `<rect width="900" height="${height}" fill="${board}"/>`;
  body += `<pattern id="mb-dots" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="12" cy="12" r="1" fill="${muted}" fill-opacity="0.25"/></pattern><rect width="900" height="${height}" fill="url(#mb-dots)"/>`;
  body += text(`${truncate(name, 26)}’s moodboard`, left, 54, 26, ink, 'class="serif" font-weight="800"');
  body += text(`@${profile.login}`, left, 76, 13, muted, 'class="mono"');
  pins.forEach((pin, i) => {
    const { x, y } = layout.slots[i]!;
    const tilt = ((hashOf(`${profile.login}:pin:${i}`) % 9) - 4) * 0.45;
    const cx = x + colW / 2;
    const cy = y + pin.h / 2;
    let card = '';
    if (!pin.note) card += `<rect x="${x + 4}" y="${y + 6}" width="${colW}" height="${pin.h}" rx="4" fill="#000" fill-opacity="${dark ? 0.45 : 0.22}"/><rect x="${x}" y="${y}" width="${colW}" height="${pin.h}" rx="4" fill="${cardFill}"/>`;
    card += pin.draw(x, y, colW, i);
    card += `<circle cx="${x + colW / 2}" cy="${y + 6}" r="6" fill="${accent}"/><circle cx="${x + colW / 2 - 1.5}" cy="${y + 4.5}" r="2" fill="#fff" fill-opacity="0.6"/>`;
    body += rise(`<g transform="rotate(${num(tilt)} ${num(cx)} ${num(cy)})">${card}</g>`, motion, 0.04 * i);
  });
  return svgDoc({ height, title: `${name} on GitHub, as a pinned moodboard`, bg: board, radius: 14, defs: pictureDef(profile, 'av'), css: riseCss(motion), body });
}

export const moodboard: Template = imageTemplate('moodboard', 'Moodboard', 'A pinboard of your profile picture in different crops, a palette of your languages, sticky notes for your projects and your numbers.', ['creative', 'image', 'collage'], moodboardSvg, {
  extra: () => 'shown as a pinned moodboard',
});

/* ------------------------------------------------------------------------------------------------ */
/* Riso print                                                                                        */
/* ------------------------------------------------------------------------------------------------ */

function risoSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const paper = dark ? '#15131b' : '#f2ead7';
  const pink = dark ? '#ff6fb1' : '#ff48b0';
  const blue = dark ? '#4d8dff' : '#0078bf';
  const ink = dark ? '#f1ecf6' : '#26212f';
  const blend = dark ? 'screen' : 'multiply';
  const name = profile.name ?? profile.login;
  const height = 560;
  const defs =
    inkFilter('ink-a', pink, dark ? { light: true, gain: 1.6, bias: 0.12 } : { gain: 0.95, bias: 1 }) +
    inkFilter('ink-b', blue, dark ? { light: true, gain: 2.2, bias: 0.75 } : { gain: 1.6, bias: 0.95 });

  let body = `<rect width="900" height="${height}" fill="${paper}"/>`;
  const px = 56;
  const py = 56;
  body += photo(profile, px, py, 360, 448, 'riso-a', { filter: 'ink-a', blend, ref: 'av', tile: { fill: pink, ink: paper } });
  body += photo(profile, px + 7, py + 5, 360, 448, 'riso-b', { filter: 'ink-b', blend, ref: 'av', tile: { fill: blue, ink: paper } });
  // Both inks print slightly off from each other, as a real two-colour print does.
  const size = Math.round(Math.min(70, Math.max(30, 400 / (Math.min(name.length, 16) * 0.84))));
  const title = truncate(name, 16).toUpperCase();
  body += text(title, 458 + 4, 134 + 3, size, blue, `font-weight="800" style="mix-blend-mode:${blend}" class="serif"`);
  body += text(title, 458, 134, size, pink, `font-weight="800" style="mix-blend-mode:${blend}" class="serif"`);
  body += text(`@${profile.login}`, 460, 166, 15, ink, 'class="mono"');
  const stamps: Array<[string, string]> = blocks.has('stats')
    ? [[formatNumber(profile.totalStars), 'stars'], [formatNumber(profile.followers), 'followers'], [formatNumber(profile.publicRepos), 'repositories']]
    : [];
  stamps.forEach(([value, label], i) => {
    const cx = 506 + i * 128;
    const color = i % 2 === 0 ? pink : blue;
    body += `<circle cx="${cx}" cy="290" r="54" fill="none" stroke="${color}" stroke-width="5" style="mix-blend-mode:${blend}"/><circle cx="${cx + 3}" cy="293" r="54" fill="none" stroke="${i % 2 === 0 ? blue : pink}" stroke-width="2" style="mix-blend-mode:${blend}"/>`;
    body += text(value, cx, 292, 24, ink, 'text-anchor="middle" font-weight="800"');
    body += text(label, cx, 312, 11, ink, 'class="mono" text-anchor="middle"');
  });
  const languages = blocks.has('languages') ? profile.languages.slice(0, 4).map((l) => l.name.toLowerCase()) : [];
  if (languages.length > 0) body += text(truncate(languages.join(' / '), 42), 460, 408, 20, ink, 'class="serif" font-style="italic"');
  body += text('two inks, printed a little off-register on purpose', 460, 500, 11.5, ink, 'class="mono" fill-opacity="0.7"');
  return svgDoc({ height, title: `${name} on GitHub, as a two-colour print`, bg: paper, radius: 14, defs: defs + pictureDef(profile, 'av'), css: riseCss(motion), body: rise(body, motion, 0.05) });
}

export const riso: Template = imageTemplate('riso', 'Riso print', 'A two-ink risograph poster: your picture printed in pink and blue, a little off-register, with your numbers as stamps.', ['creative', 'image', 'print'], risoSvg, {
  extra: () => 'shown as a two-colour print',
});

/* ------------------------------------------------------------------------------------------------ */
/* Glitch portrait                                                                                   */
/* ------------------------------------------------------------------------------------------------ */

/** Horizontal slices of the picture that are knocked sideways: where each starts, how tall it is and how far it moves. */
export function tears(login: string, count: number, height: number): Array<{ y: number; h: number; dx: number }> {
  const random = seeded(`glitch:${login}`);
  return Array.from({ length: count }, (_v, i) => {
    const h = 6 + Math.floor(random() * 22);
    const y = Math.floor(((i + random() * 0.8) / count) * (height - h));
    const dx = Math.round((random() - 0.5) * 56);
    return { y, h, dx: dx === 0 ? 9 : dx };
  });
}

function glitchSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const page = dark ? '#07070d' : '#e8e8ee';
  const ink = dark ? '#e9f7ff' : '#12121a';
  const muted = dark ? '#7f8aa0' : '#555a6b';
  const cyan = '#19e3ff';
  const magenta = '#ff2e93';
  const name = profile.name ?? profile.login;
  const height = 500;
  const px = 40;
  const py = 40;
  const pw = 360;
  const ph = 420;
  const defs = channelFilter('g-red', [0]) + channelFilter('g-cyan', [1, 2]);

  let body = `<rect width="900" height="${height}" fill="${page}"/>`;
  body += `<rect x="${px}" y="${py}" width="${pw}" height="${ph}" fill="#05050a"/>`;
  body += photo(profile, px - 5, py, pw, ph, 'gl-r', { filter: 'g-red', blend: 'screen', ref: 'av', tile: { fill: '#3a1030', ink: magenta } });
  body += photo(profile, px + 5, py, pw, ph, 'gl-c', { filter: 'g-cyan', blend: 'screen', ref: 'av', tile: { fill: '#082a33', ink: cyan } });
  tears(profile.login, 7, ph).forEach((t, i) => {
    const id = `gl-t${i}`;
    const clip = `<clipPath id="${id}-c"><rect x="${px}" y="${py + t.y}" width="${pw}" height="${t.h}"/></clipPath>`;
    const inner = `<g clip-path="url(#${id}-c)">${photo(profile, px + t.dx, py, pw, ph, id, { ref: 'av', tile: { fill: '#2a1030', ink: cyan } })}</g>`;
    body += `<g class="${motion ? 'tear' : ''}" style="animation-delay:${(i * 0.37).toFixed(2)}s">${clip}${inner}</g>`;
  });
  for (let y = py; y < py + ph; y += 4) body += `<rect x="${px}" y="${y}" width="${pw}" height="1" fill="#000" fill-opacity="0.28"/>`;
  const rx = 440;
  body += text(`@${profile.login}`.toUpperCase(), rx - 3, 118, 44, magenta, 'class="mono" font-weight="800" fill-opacity="0.9"');
  body += text(`@${profile.login}`.toUpperCase(), rx + 3, 120, 44, cyan, 'class="mono" font-weight="800" fill-opacity="0.9"');
  body += text(`@${profile.login}`.toUpperCase(), rx, 119, 44, ink, 'class="mono" font-weight="800"');
  body += text(`> ${truncate(name, 30)}`, rx, 168, 17, ink, 'class="mono"');
  const lines: string[] = [];
  if (blocks.has('stats')) lines.push(`followers ..... ${formatNumber(profile.followers)}`, `stars ......... ${formatNumber(profile.totalStars)}`, `repositories .. ${formatNumber(profile.publicRepos)}`);
  if (blocks.has('languages') && profile.languages.length > 0) lines.push(`languages ..... ${truncate(profile.languages.slice(0, 3).map((l) => l.name).join(', '), 24)}`);
  const days = daysOf(profile, config);
  if (days.length > 0 && profile.contributions) lines.push(`contributions . ${formatNumber(profile.contributions.total)}`);
  lines.forEach((line, i) => {
    body += text(`> ${line}`, rx, 214 + i * 30, 15, i % 2 === 0 ? cyan : muted, 'class="mono"');
  });
  body += text('signal corrupted on purpose', rx, 456, 11.5, muted, 'class="mono"');
  const css = riseCss(motion) + (motion ? `.tear{animation:tear 3.2s steps(1) infinite}@keyframes tear{0%,86%{opacity:1}88%{opacity:0}92%{opacity:1}95%{opacity:0.2}}@media (prefers-reduced-motion:reduce){.tear{animation:none}}` : '');
  return svgDoc({ height, title: `${name} on GitHub, as a glitched portrait`, bg: page, radius: 14, defs: defs + pictureDef(profile, 'av'), css, body: rise(body, motion, 0.05) });
}

export const glitch: Template = imageTemplate('glitch', 'Glitch portrait', 'Your profile picture split into red and cyan, torn sideways in slices, with your numbers printed as a corrupted terminal.', ['creative', 'image', 'cyber'], glitchSvg, {
  extra: () => 'shown as a glitched portrait',
});

/* ------------------------------------------------------------------------------------------------ */
/* Thermal cam                                                                                       */
/* ------------------------------------------------------------------------------------------------ */

const HEAT = ['#05020f', '#2a0a5e', '#7a1b8e', '#d4244f', '#ff7a1a', '#ffd23a', '#fffbe0'];

function thermalSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const page = dark ? '#06030b' : '#efe9e4';
  const ink = dark ? '#ffe2b8' : '#2a1208';
  const muted = dark ? '#a98d78' : '#7a5a48';
  const name = profile.name ?? profile.login;
  const height = 480;
  const px = 44;
  const py = 50;
  const size = 380;
  const defs =
    gradientMap('heat', HEAT) +
    `<linearGradient id="scale" x1="0" x2="0" y1="0" y2="1">${[...HEAT].reverse().map((c, i, all) => `<stop offset="${num(i / (all.length - 1))}" stop-color="${c}"/>`).join('')}</linearGradient>`;

  let body = `<rect width="900" height="${height}" fill="${page}"/>`;
  body += photo(profile, px, py, size, size, 'th', { filter: 'heat', tile: { fill: '#7a1b8e', ink: '#ffd23a' } });
  // Corner brackets and a crosshair, as a camera's screen has.
  for (const [cx, cy, sx, sy] of [[px, py, 1, 1], [px + size, py, -1, 1], [px, py + size, 1, -1], [px + size, py + size, -1, -1]] as const) {
    body += `<path d="M${cx + sx * 26} ${cy}H${cx}V${cy + sy * 26}" fill="none" stroke="${ink}" stroke-width="3"/>`;
  }
  const mx = px + size / 2;
  const my = py + size / 2;
  body += `<path d="M${mx - 22} ${my}H${mx + 22}M${mx} ${my - 22}V${my + 22}" stroke="#ffffff" stroke-width="2"/><circle cx="${mx}" cy="${my}" r="14" fill="none" stroke="#ffffff" stroke-width="2"/>`;
  if (motion) body += `<rect class="scan" x="${px}" y="${py}" width="${size}" height="3" fill="#ffffff" fill-opacity="0.55"/>`;
  body += `<rect x="${px + size + 22}" y="${py}" width="14" height="${size}" fill="url(#scale)" rx="3"/>`;
  body += text('brighter', px + size + 44, py + 10, 11, muted, 'class="mono"');
  body += text('darker', px + size + 44, py + size, 11, muted, 'class="mono"');
  const rx = 536;
  body += text('THERMAL VIEW', rx, py + 12, 12, muted, 'class="mono" letter-spacing="4" font-weight="700"');
  body += text(truncate(name, 20), rx, py + 52, 30, ink, 'font-weight="800"');
  body += text(`@${profile.login}`, rx, py + 76, 14, muted, 'class="mono"');
  const rows: Array<[string, string]> = [];
  if (blocks.has('stats')) rows.push(['STARS', formatNumber(profile.totalStars)], ['FOLLOWERS', formatNumber(profile.followers)], ['REPOSITORIES', formatNumber(profile.publicRepos)]);
  const days = daysOf(profile, config);
  if (days.length > 0) {
    const peak = days.reduce<ContributionDay | null>((best, d) => (d.count > 0 && (!best || d.count > best.count) ? d : best), null);
    if (peak) rows.push(['PEAK DAY', `${formatNumber(peak.count)} on ${peak.date}`]);
  }
  rows.forEach(([label, value], i) => {
    const y = py + 128 + i * 52;
    body += text(label, rx, y, 11, muted, 'class="mono" letter-spacing="3"');
    body += text(value, rx, y + 26, 24, i % 2 === 0 ? '#ff7a1a' : ink, 'font-weight="800"');
  });
  body += text('colour shows picture brightness,', rx, py + size - 20, 11, muted, 'class="mono"') + text('not any temperature', rx, py + size - 6, 11, muted, 'class="mono"');
  const css = riseCss(motion) + (motion ? `.scan{animation:scan 4.5s linear infinite}@keyframes scan{from{transform:translateY(0)}to{transform:translateY(${size - 3}px)}}@media (prefers-reduced-motion:reduce){.scan{animation:none}}` : '');
  return svgDoc({ height, title: `${name} on GitHub, as a thermal camera view`, bg: page, radius: 14, defs, css, body: rise(body, motion, 0.05) });
}

export const thermal: Template = imageTemplate('thermal', 'Thermal cam', 'Your profile picture through a heat camera, with a crosshair, a scan line and your numbers as readouts.', ['creative', 'image', 'tech'], thermalSvg, {
  extra: () => 'shown as a thermal camera view',
});

/* ------------------------------------------------------------------------------------------------ */
/* Halftone year                                                                                     */
/* ------------------------------------------------------------------------------------------------ */

export const HALFTONE_COLS = 26;

/** How many rows of dots hold `days` days at `cols` to a row. */
export const dotRows = (days: number, cols = HALFTONE_COLS): number => Math.max(1, Math.ceil(days / cols));

/** Dot radius for a spot of the picture: big where it is dark, small where it is bright, never less than `min`. */
export function dotRadius(luma: number | null, max: number, min = 1.2): number {
  if (luma === null) return max * 0.55;
  const dark = 1 - Math.min(255, Math.max(0, luma)) / 255;
  return Math.max(min, Math.round(max * dark ** 0.85 * 100) / 100);
}

function halftoneSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const hue = hueFor(profile, 150);
  const page = dark ? '#0e1117' : '#f7f4ee';
  const ink = dark ? '#e9eef5' : '#1b2330';
  const muted = dark ? '#8d98a8' : '#5d6878';
  const rest = dark ? '#3a4352' : '#c9c2b4';
  const ramp = [rest, ...[0.34, 0.46, 0.58, 0.7].map((l) => hslToHex(hue, 0.75, dark ? l + 0.08 : 1 - l))];
  const name = profile.name ?? profile.login;
  const days = daysOf(profile, config);
  const count = days.length > 0 ? days.length : HALFTONE_COLS * 14;
  const rows = dotRows(count);
  const cell = 21;
  const x0 = 40;
  const y0 = 64;
  const height = Math.max(y0 + rows * cell + 64, 380);

  const range = lumaRange(profile);
  let dots = '';
  for (let i = 0; i < count; i++) {
    const col = i % HALFTONE_COLS;
    const row = Math.floor(i / HALFTONE_COLS);
    const seen = lumaAt(profile, (col + 0.5) / HALFTONE_COLS, (row + 0.5) / rows);
    const r = dotRadius(seen === null ? null : stretchLuma(seen, range), cell * 0.52);
    const level = days.length > 0 ? days[i]!.level : 0;
    dots += `<circle cx="${num(x0 + (col + 0.5) * cell)}" cy="${num(y0 + (row + 0.5) * cell)}" r="${num(r)}" fill="${ramp[level]}"/>`;
  }
  let body = `<rect width="900" height="${height}" fill="${page}"/>`;
  body += text('HALFTONE YEAR', x0, 40, 12, muted, 'class="mono" letter-spacing="4" font-weight="700"');
  body += `<g${motion ? ' class="fade"' : ''}>${dots}</g>`;
  const rx = 640;
  body += text(truncate(name, 18), rx, 96, 26, ink, 'font-weight="800"');
  body += text(`@${profile.login}`, rx, 118, 13, muted, 'class="mono"');
  const rowsOut: Array<[string, string]> = [];
  if (blocks.has('stats')) rowsOut.push([formatNumber(profile.totalStars), 'stars'], [formatNumber(profile.followers), 'followers']);
  if (days.length > 0 && profile.contributions) rowsOut.push([formatNumber(profile.contributions.total), 'contributions'], [formatNumber(profile.contributions.activeDays), 'active days']);
  rowsOut.forEach(([value, label], i) => {
    body += text(value, rx, 170 + i * 46, 26, i % 2 === 0 ? ramp[3]! : ink, 'font-weight="800"');
    body += text(label, rx, 188 + i * 46, 12, muted, 'class="mono"');
  });
  if (days.length > 0) {
    body += text('LEVEL', rx, height - 92, 10, muted, 'class="mono" letter-spacing="3"');
    ramp.forEach((c, i) => (body += `<circle cx="${rx + 8 + i * 22}" cy="${height - 70}" r="7" fill="${c}"/>`));
    body += text('less', rx, height - 44, 10.5, muted, 'class="mono"') + text('more', rx + 88, height - 44, 10.5, muted, 'class="mono" text-anchor="end"');
  }
  body += text(days.length > 0 ? 'One dot for each day, oldest first, left to right. Size follows the picture; colour follows activity.' : blocks.has('activity') ? 'Dots take their colour from activity after the first automatic update.' : 'The activity section is switched off.', x0, height - 22, 11, muted, 'class="mono"');
  const css = riseCss(motion) + (motion ? `.fade{animation:fade 1.2s ease both}@keyframes fade{from{opacity:0}}@media (prefers-reduced-motion:reduce){.fade{animation:none}}` : '');
  return svgDoc({ height, title: `${name} on GitHub, as a halftone picture with one dot for each day`, bg: page, radius: 14, css, body });
}

export const halftone: Template = imageTemplate('halftone', 'Halftone year', 'Your picture redrawn in dots, one dot for each day of the year, coloured by how active that day was.', ['creative', 'image', 'activity'], halftoneSvg, {
  activity: true,
  extra: () => 'shown as a halftone picture with one dot for each day',
});

export const imageryTemplates: Template[] = [moodboard, riso, glitch, thermal, halftone];
