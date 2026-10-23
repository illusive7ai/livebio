import { hslToHex, hueOf } from '../color';
import type { Variant } from '../themes';
import type { Config, LanguageShare, Profile, RepoSummary, Template } from '../types';
import { formatNumber, truncate, wrap, xmlEscape } from '../util';
import { num, riseCss } from './kit';
import { imageTemplate, langColor, pictureBox, svgDoc } from './make';
import { rise } from './shared';

/** Four designs that turn the numbers into a picture: a transit map, a periodic table, a treemap and a bookshelf. */

const hueFor = (profile: Profile, fallback: number): number => hueOf(profile.avatar?.grid.tint) ?? fallback;

const text = (value: string, x: number, y: number, size: number, fill: string, extra = ''): string =>
  `<text x="${num(x)}" y="${num(y)}" font-size="${size}" fill="${fill}" ${extra}>${xmlEscape(value)}</text>`;

/* ------------------------------------------------------------------------------------------------ */
/* Metro map                                                                                         */
/* ------------------------------------------------------------------------------------------------ */

export interface MetroLine {
  language: LanguageShare;
  stations: RepoSummary[];
}

/** One line for each language, with a station for each of the repositories written in it (at most three). */
export function metroLines(profile: Profile, maxLines = 6): MetroLine[] {
  return profile.languages.slice(0, maxLines).map((language) => ({
    language,
    stations: profile.topRepos.filter((repo) => repo.language === language.name).slice(0, 3),
  }));
}

function metroSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const hue = hueFor(profile, 200);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const bg = dark ? '#101319' : '#f3f1ea';
  const ink = dark ? '#eef1f6' : '#1b1f27';
  const muted = dark ? '#8590a3' : '#6b7280';
  const name = profile.name ?? profile.login;
  const lines = blocks.has('languages') ? metroLines(profile) : [];
  const hub = { x: 450, y: 232 };
  // Right side first, middle slot first: the biggest language gets the straightest line.
  const slots: Array<[number, number]> = [[1, 1], [-1, 1], [1, 0], [-1, 2], [1, 2], [-1, 0]];

  let body = text('GITHUB TRANSIT', 36, 52, 11, muted, 'letter-spacing="4" font-weight="800"');
  body += text(truncate(name, 30), 36, 82, 26, ink, 'font-weight="800"');
  body += text(`@${profile.login}`, 36, 104, 13, muted, 'class="mono"');
  if (lines.length === 0) body += text(blocks.has('languages') ? 'No lines are open yet.' : 'The languages section is switched off.', 36, 150, 14, muted, 'font-style="italic"');

  let stations = '';
  lines.forEach((line, i) => {
    const [side, slot] = slots[i]!;
    const color = langColor(line.language.name, variant);
    const dy = (slot - 1) * 118;
    const yEnd = hub.y + dy;
    const xBend = hub.x + side * 78;
    const xTurn = xBend + side * Math.abs(dy);
    const xEnd = hub.x + side * 388;
    const d = `M${hub.x} ${hub.y}H${xBend}L${xTurn} ${yEnd}H${xEnd}`;
    body += `<path d="${d}" fill="none" stroke="${color}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"${motion ? ' class="draw" pathLength="1"' : ''} style="animation-delay:${(0.2 + i * 0.25).toFixed(2)}s"/>`;
    // The terminus names the language.
    body += `<rect x="${xEnd - side * 3 - 3}" y="${yEnd - 16}" width="6" height="32" rx="3" fill="${color}"/>`;
    body += text(`${truncate(line.language.name, 14)} ${Math.round(line.language.percent)}%`, xEnd + side * 2, yEnd - 24, 12.5, color, `text-anchor="${side === 1 ? 'end' : 'start'}" font-weight="800"`);
    const first = xTurn + side * 50;
    const last = xEnd - side * 44;
    line.stations.forEach((repo, j) => {
      const t = line.stations.length === 1 ? 0.5 : j / (line.stations.length - 1);
      const x = first + (last - first) * t;
      stations += `<circle cx="${num(x)}" cy="${yEnd}" r="8" fill="${dark ? '#101319' : '#ffffff'}" stroke="${ink}" stroke-width="3.5"/>`;
      stations += text(truncate(repo.name, 14), x, yEnd + 30, 12, ink, 'text-anchor="middle" font-weight="700"');
      stations += text(`★ ${formatNumber(repo.stars)}`, x, yEnd + 45, 10.5, muted, 'class="mono" text-anchor="middle"');
    });
  });
  body += stations;

  // The interchange in the middle is the person.
  body += `<circle cx="${hub.x}" cy="${hub.y}" r="30" fill="${dark ? '#101319' : '#ffffff'}" stroke="${ink}" stroke-width="5"/>`;
  body += pictureBox(profile, hslToHex(hue, 0.6, 0.5), '#ffffff', hub.x - 22, hub.y - 22, 44, 44, 22, 'mm');
  if (blocks.has('stats')) body += text(`${formatNumber(profile.publicRepos)} repositories  ·  ${formatNumber(profile.totalStars)} stars`, 450, 408, 12, muted, 'class="mono" text-anchor="middle"');

  const css =
    riseCss(motion) +
    (motion ? `.draw{stroke-dasharray:1;stroke-dashoffset:0;animation:draw 1.2s ease-out both}@keyframes draw{from{stroke-dashoffset:1}}@media (prefers-reduced-motion:reduce){.draw{animation:none}}` : '');
  return svgDoc({ height: 440, title: `${name} on GitHub, as a transit map`, bg, radius: 14, css, body: rise(body, motion, 0.05) });
}

export const metro: Template = imageTemplate(
  'metro',
  'Metro map',
  'A transit map: a line for each language, a station for each repository, you at the interchange.',
  ['creative', 'data', 'languages'],
  metroSvg,
  { extra: () => 'shown as a transit map with a line for each language and a station for each repository' },
);

/* ------------------------------------------------------------------------------------------------ */
/* Elements                                                                                          */
/* ------------------------------------------------------------------------------------------------ */

/** A chemical-style symbol from a name: its first letter in capitals and its second in lower case. */
export function symbolOf(name: string): string {
  const letters = [...name].filter((c) => /[\p{L}\p{N}]/u.test(c));
  if (letters.length === 0) return '?';
  return (letters[0]!.toUpperCase() + (letters[1] ?? '').toLowerCase()).slice(0, 2);
}

/** 1 for the repository with the most stars, 2 for the next, and so on. Ties keep their original order. */
export function ranksByStars(repos: ReadonlyArray<RepoSummary>): number[] {
  const order = repos.map((_r, i) => i).sort((a, b) => repos[b]!.stars - repos[a]!.stars || a - b);
  const ranks = new Array<number>(repos.length);
  order.forEach((index, rank) => {
    ranks[index] = rank + 1;
  });
  return ranks;
}

function elementsSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const hue = hueFor(profile, 260);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const bg = dark ? '#0f1216' : '#f5f4ef';
  const ink = dark ? '#eef0f4' : '#1d2127';
  const muted = dark ? '#8a92a1' : '#6a7080';
  const name = profile.name ?? profile.login;
  const repos = blocks.has('projects') ? profile.topRepos.slice(0, 6) : [];
  const ranks = ranksByStars(repos);
  const langs = blocks.has('languages') ? profile.languages.slice(0, 6) : [];

  let body = text('THE PERIODIC TABLE OF', 36, 50, 11, muted, 'letter-spacing="4" font-weight="800"');
  body += text(truncate(name, 28).toUpperCase(), 36, 84, 30, ink, 'font-weight="800" letter-spacing="1"');
  body += text(`@${profile.login}`, 864, 84, 13, muted, 'class="mono" text-anchor="end"');

  const tw = 128;
  const th = 156;
  const gap = 12;
  const x0 = 450 - (repos.length * tw + (repos.length - 1) * gap) / 2;
  if (repos.length === 0 && blocks.has('projects')) body += text('No elements discovered yet.', 36, 150, 14, muted, 'font-style="italic"');
  repos.forEach((repo, i) => {
    const x = x0 + i * (tw + gap);
    const y = 112;
    const color = repo.language ? langColor(repo.language, variant) : hslToHex(hue, 0.4, dark ? 0.55 : 0.5);
    body += `<g class="el" style="animation-delay:${(0.1 + i * 0.1).toFixed(2)}s">`;
    body += `<rect x="${x}" y="${y}" width="${tw}" height="${th}" rx="8" fill="${color}" fill-opacity="${dark ? 0.16 : 0.14}" stroke="${color}" stroke-width="2"/>`;
    body += text(String(ranks[i]), x + 10, y + 22, 14, ink, 'class="mono" font-weight="700"');
    body += text(formatNumber(repo.stars), x + tw - 10, y + 22, 12.5, muted, 'class="mono" text-anchor="end"');
    body += text(symbolOf(repo.name), x + tw / 2, y + 90, 52, color, 'text-anchor="middle" font-weight="800"');
    body += text(truncate(repo.name, 15), x + tw / 2, y + 122, 13.5, ink, 'text-anchor="middle" font-weight="700"');
    body += text(repo.language ? truncate(repo.language, 16) : 'unclassified', x + tw / 2, y + 142, 11, muted, 'text-anchor="middle"');
    body += `</g>`;
  });

  // Smaller tiles: the languages.
  if (langs.length > 0) {
    body += text('LANGUAGES', 36, 318, 11, muted, 'letter-spacing="4" font-weight="800"');
    const sw = 100;
    const sx0 = 450 - (langs.length * sw + (langs.length - 1) * 12) / 2;
    langs.forEach((lang, i) => {
      const x = sx0 + i * (sw + 12);
      const color = langColor(lang.name, variant);
      body += `<rect x="${x}" y="330" width="${sw}" height="82" rx="8" fill="${color}" fill-opacity="${dark ? 0.16 : 0.14}" stroke="${color}" stroke-width="1.5"/>`;
      body += text(`${Math.round(lang.percent)}%`, x + sw - 8, 348, 11.5, muted, 'class="mono" text-anchor="end"');
      body += text(symbolOf(lang.name), x + sw / 2, 384, 28, color, 'text-anchor="middle" font-weight="800"');
      body += text(truncate(lang.name, 12), x + sw / 2, 403, 10.5, ink, 'text-anchor="middle" font-weight="700"');
    });
  }
  body += text('number = rank by stars · top right = stars · bottom = main language', 36, 436, 10.5, muted, 'class="mono"');

  const css = riseCss(motion) + (motion ? `.el{animation:pop .5s ease-out both}@keyframes pop{from{opacity:0;transform:translateY(10px)}}@media (prefers-reduced-motion:reduce){.el{animation:none}}` : '');
  return svgDoc({ height: 456, title: `${name} on GitHub, as a periodic table of repositories`, bg, radius: 14, css, body });
}

export const elements: Template = imageTemplate(
  'elements',
  'Elements',
  'A periodic table of your repositories: a symbol, a rank by stars and a tile for each language.',
  ['creative', 'data', 'projects'],
  elementsSvg,
  { extra: () => 'shown as a periodic table of repositories' },
);

/* ------------------------------------------------------------------------------------------------ */
/* Treemap                                                                                           */
/* ------------------------------------------------------------------------------------------------ */

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Splits `box` into one rectangle for each value, each with an area in proportion to its value and as
 * close to square as the method manages. The rectangles come back in the order the values were given.
 */
export function squarify(values: ReadonlyArray<number>, box: Box): Box[] {
  const total = values.reduce((sum, v) => sum + Math.max(0, v), 0);
  const out: Box[] = values.map(() => ({ x: box.x, y: box.y, w: 0, h: 0 }));
  if (values.length === 0 || total <= 0) return out;
  const order = values.map((_v, i) => i).sort((a, b) => values[b]! - values[a]! || a - b);
  const scale = (box.w * box.h) / total;
  let { x, y, w, h } = box;

  const worst = (areas: number[], side: number): number => {
    const sum = areas.reduce((a, b) => a + b, 0);
    const max = Math.max(...areas);
    const min = Math.min(...areas);
    return Math.max((side * side * max) / (sum * sum), (sum * sum) / (side * side * min));
  };

  let at = 0;
  while (at < order.length) {
    const side = Math.min(w, h);
    const row: number[] = [at];
    let areas = [Math.max(0, values[order[at]!]!) * scale];
    while (at + row.length < order.length) {
      const next = Math.max(0, values[order[at + row.length]!]!) * scale;
      if (areas.every((a) => a > 0) && next > 0 && worst([...areas, next], side) > worst(areas, side)) break;
      row.push(at + row.length);
      areas = [...areas, next];
    }
    const sum = areas.reduce((a, b) => a + b, 0);
    if (w >= h) {
      const rowW = h > 0 ? sum / h : 0;
      let cy = y;
      row.forEach((slot, k) => {
        const rh = sum > 0 ? (areas[k]! / sum) * h : 0;
        out[order[slot]!] = { x, y: cy, w: rowW, h: rh };
        cy += rh;
      });
      x += rowW;
      w -= rowW;
    } else {
      const rowH = w > 0 ? sum / w : 0;
      let cx = x;
      row.forEach((slot, k) => {
        const rw = sum > 0 ? (areas[k]! / sum) * w : 0;
        out[order[slot]!] = { x: cx, y, w: rw, h: rowH };
        cx += rw;
      });
      y += rowH;
      h -= rowH;
    }
    at += row.length;
  }
  return out;
}

function treemapSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const bg = dark ? '#0e1115' : '#eceae4';
  const ink = dark ? '#f1f3f7' : '#1a1d23';
  const muted = dark ? '#8a93a3' : '#666d7b';
  const name = profile.name ?? profile.login;
  const repos = blocks.has('projects') ? profile.topRepos.slice(0, 6) : [];
  const langs = blocks.has('languages') ? profile.languages.slice(0, 6) : [];

  let body = text(truncate(name, 30), 36, 54, 24, ink, 'font-weight="800"');
  body += text(`@${profile.login}`, 864, 54, 13, muted, 'class="mono" text-anchor="end"');
  const area: Box = { x: 36, y: 76, w: 828, h: langs.length > 0 ? 290 : 330 };
  if (repos.length === 0) body += text(blocks.has('projects') ? 'Nothing to measure yet.' : 'The projects section is switched off.', 36, 120, 14, muted, 'font-style="italic"');
  const boxes = squarify(repos.map((r) => r.stars + 1), area);
  repos.forEach((repo, i) => {
    const b = boxes[i]!;
    if (b.w < 4 || b.h < 4) return;
    const color = repo.language ? langColor(repo.language, variant) : muted;
    const inset = 2;
    const x = b.x + inset;
    const y = b.y + inset;
    const w = b.w - inset * 2;
    const h = b.h - inset * 2;
    body += `<g class="tile" style="animation-delay:${(0.08 * i).toFixed(2)}s">`;
    body += `<rect x="${num(x)}" y="${num(y)}" width="${num(w)}" height="${num(h)}" rx="6" fill="${color}" fill-opacity="${dark ? 0.2 : 0.17}" stroke="${color}" stroke-width="1.5"/>`;
    if (w > 70 && h > 26 && h <= 62) {
      // A small tile has room for one line only: the name and the stars together.
      body += text(truncate(`${repo.name}  ★ ${formatNumber(repo.stars)}`, Math.max(4, Math.floor(w / 7.4))), x + 10, y + h / 2 + 4.5, 12.5, ink, 'font-weight="800"');
    } else if (w > 70 && h > 62) {
      const size = Math.max(12, Math.min(24, w / 9, (h - 30) / 1.7));
      body += text(truncate(repo.name, Math.max(4, Math.floor(w / (size * 0.58)))), x + 12, y + 14 + size, size, ink, 'font-weight="800"');
      body += text(`★ ${formatNumber(repo.stars)}`, x + 12, y + 32 + size, Math.max(11, size * 0.62), color, 'class="mono" font-weight="700"');
      if (repo.description && h > 110 && w > 150) {
        wrap(repo.description, Math.floor(w / 7), 2).forEach((part, j) => {
          body += text(part, x + 12, y + 62 + size + j * 16, 12, muted);
        });
      }
    }
    body += `</g>`;
  });

  // One strip for the languages, cut in the same way.
  if (langs.length > 0) {
    let cx = 36;
    const total = langs.reduce((s, l) => s + l.percent, 0);
    langs.forEach((lang) => {
      const w = total > 0 ? (lang.percent / total) * 828 : 0;
      const color = langColor(lang.name, variant);
      body += `<rect x="${num(cx + 1)}" y="380" width="${num(Math.max(0, w - 2))}" height="30" rx="4" fill="${color}" fill-opacity="${dark ? 0.85 : 0.9}"/>`;
      if (w > 62) body += text(`${truncate(lang.name, Math.floor(w / 8))} ${Math.round(lang.percent)}%`, cx + 9, 400, 11.5, dark ? '#0b0d10' : '#ffffff', 'font-weight="800"');
      cx += w;
    });
  }
  body += text('area = stars + 1 · colour = main language', 36, 436, 10.5, muted, 'class="mono"');

  const css = riseCss(motion) + (motion ? `.tile{animation:grow .55s ease-out both}@keyframes grow{from{opacity:0;transform:scale(.96)}}@media (prefers-reduced-motion:reduce){.tile{animation:none}}` : '');
  return svgDoc({ height: 456, title: `${name} on GitHub, as a treemap of repositories`, bg, radius: 14, css, body });
}

export const treemap: Template = imageTemplate(
  'treemap',
  'Treemap',
  'Your repositories as tiles, each as large as its stars, over a bar of your languages.',
  ['creative', 'data', 'projects'],
  treemapSvg,
  { extra: () => 'shown as a treemap with repository tiles sized by stars' },
);

/* ------------------------------------------------------------------------------------------------ */
/* Bookshelf                                                                                         */
/* ------------------------------------------------------------------------------------------------ */

const SPINE_MIN = 120;
const SPINE_MAX = 205;

/** How tall a spine is, from the number of stars, on a log scale between the shortest and tallest books. */
export function spineHeight(stars: number, mostStars: number): number {
  if (!(mostStars > 0) || !(stars > 0)) return SPINE_MIN;
  const share = Math.log10(stars + 1) / Math.log10(mostStars + 1);
  return Math.round(SPINE_MIN + Math.min(1, Math.max(0, share)) * (SPINE_MAX - SPINE_MIN));
}

function shelfSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const hue = hueFor(profile, 28);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const wall = dark ? '#1b1612' : '#e9dcc6';
  const wood = dark ? '#3a2a1c' : '#9a6b3f';
  const woodDark = dark ? '#251a11' : '#7a5230';
  const ink = dark ? '#f1e6d2' : '#2b1d0f';
  const muted = dark ? '#a89677' : '#7b6240';
  const name = profile.name ?? profile.login;
  const repos = blocks.has('projects') ? profile.topRepos.slice(0, 6) : [];
  const langs = blocks.has('languages') ? profile.languages.slice(0, 5) : [];
  const most = Math.max(0, ...repos.map((r) => r.stars));
  const shelfY = 330;

  let body = '';
  // The framed photo and the name plate.
  body += `<rect x="46" y="48" width="150" height="176" rx="4" fill="${woodDark}"/>`;
  body += pictureBox(profile, hslToHex(hue, 0.5, 0.5), '#ffffff', 58, 60, 126, 152, 2, 'bs');
  body += text(truncate(name, 16), 121, 252, 15, ink, 'text-anchor="middle" font-weight="800"');
  body += text(`@${truncate(profile.login, 20)}`, 121, 272, 12, muted, 'class="mono" text-anchor="middle"');
  if (blocks.has('stats')) body += text(`${formatNumber(profile.followers)} followers`, 121, 292, 11.5, muted, 'text-anchor="middle"');

  // The books: one spine for each repository.
  let x = 236;
  if (repos.length === 0) body += text(blocks.has('projects') ? 'The shelf is empty.' : 'The projects section is switched off.', 240, 280, 14, muted, 'font-style="italic"');
  repos.forEach((repo, i) => {
    const h = spineHeight(repo.stars, most);
    const w = Math.min(86, Math.max(48, 26 + repo.name.length * 5));
    const color = repo.language ? langColor(repo.language, variant) : hslToHex(hue, 0.3, 0.45);
    const y = shelfY - h;
    body += `<g class="book" style="animation-delay:${(0.1 + i * 0.09).toFixed(2)}s">`;
    body += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${color}"/>`;
    body += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="#000" fill-opacity="${dark ? 0.28 : 0.12}"/>`;
    body += `<rect x="${x + 6}" y="${y + 14}" width="${w - 12}" height="3" fill="#ffffff" fill-opacity="0.55"/><rect x="${x + 6}" y="${y + h - 18}" width="${w - 12}" height="3" fill="#ffffff" fill-opacity="0.55"/>`;
    body += `<text x="${x + w / 2 + 5}" y="${y + h - 30}" font-size="${w > 60 ? 14 : 13}" font-weight="800" fill="#ffffff" transform="rotate(-90 ${x + w / 2 + 5} ${y + h - 30})" text-anchor="start">${xmlEscape(truncate(repo.name, Math.max(6, Math.floor((h - 60) / 8.2))))}</text>`;
    body += `</g>`;
    x += w + 5;
  });

  // The shelf itself.
  body += `<rect x="30" y="${shelfY}" width="840" height="16" rx="3" fill="${wood}"/><rect x="30" y="${shelfY + 16}" width="840" height="6" fill="${woodDark}"/>`;
  // A stack of flat books on the right: one for each language, as thick as its share.
  if (langs.length > 0) {
    let sy = shelfY;
    const total = langs.reduce((s, l) => s + l.percent, 0) || 1;
    const stackH = 190;
    langs.forEach((lang) => {
      const h = Math.max(14, Math.round((lang.percent / total) * stackH));
      sy -= h;
      const color = langColor(lang.name, variant);
      body += `<rect x="690" y="${sy}" width="156" height="${h - 2}" rx="3" fill="${color}"/><rect x="690" y="${sy}" width="156" height="${h - 2}" rx="3" fill="#000" fill-opacity="${dark ? 0.25 : 0.1}"/>`;
      if (h >= 17) body += text(`${truncate(lang.name, 12)}  ${Math.round(lang.percent)}%`, 700, sy + h / 2 + 3.5, 11.5, '#ffffff', 'font-weight="800"');
    });
  }
  body += text('height = stars (log scale) · stack thickness = share of code', 36, 380, 10.5, muted, 'class="mono"');

  const css = riseCss(motion) + (motion ? `.book{animation:slide .55s ease-out both}@keyframes slide{from{opacity:0;transform:translateY(-14px)}}@media (prefers-reduced-motion:reduce){.book{animation:none}}` : '');
  return svgDoc({ height: 400, title: `${name} on GitHub, as a bookshelf of repositories`, bg: wall, radius: 14, css, body });
}

export const shelf: Template = imageTemplate(
  'shelf',
  'Bookshelf',
  'Your repositories as book spines, as tall as their stars, with your languages stacked beside them.',
  ['creative', 'data', 'projects'],
  shelfSvg,
  { extra: () => 'shown as a bookshelf with a spine for each repository' },
);

export const dataArtTemplates: Template[] = [metro, elements, treemap, shelf];
