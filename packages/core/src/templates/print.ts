import { hslToHex, hueOf } from '../color';
import type { Variant } from '../themes';
import type { Config, ContributionDay, Profile, RepoSummary, Template } from '../types';
import { formatNumber, timeAgo, truncate, wrap, xmlEscape } from '../util';
import { num, riseCss } from './kit';
import { hashOf, imageTemplate, isoDate, langColor, svgDoc } from './make';
import { photo, pictureDef } from './photo';
import { rise, seeded } from './shared';

/** Five designs made of print and screens: a zine cover, a film contact sheet, a museum wall, a mission patch and a lock screen. */

const hueFor = (profile: Profile, fallback: number): number => hueOf(profile.avatar?.grid.tint) ?? fallback;
const IMPACT = "Impact, Haettenschweiler, 'Franklin Gothic Bold', 'Arial Narrow Bold', 'Arial Black', sans-serif";

const text = (value: string, x: number, y: number, size: number, fill: string, extra = ''): string =>
  `<text x="${num(x)}" y="${num(y)}" font-size="${size}" fill="${fill}" ${extra}>${xmlEscape(value)}</text>`;

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/** The activity a design may draw: none when the section is off or the calendar is missing or empty. */
function daysOf(profile: Profile, config: Config): ContributionDay[] {
  return config.blocks.includes('activity') && profile.contributions ? profile.contributions.days : [];
}

/* ------------------------------------------------------------------------------------------------ */
/* Zine cover                                                                                        */
/* ------------------------------------------------------------------------------------------------ */

/** Cover lines, each one a real fact in the loud voice of a magazine cover. Fewer when sections are off or data is missing. */
export function coverLines(profile: Profile, blocks: ReadonlySet<string>): string[] {
  const lines: string[] = [];
  const top = blocks.has('projects') ? [...profile.topRepos].sort((a, b) => b.stars - a.stars)[0] : undefined;
  if (blocks.has('stats')) lines.push(`${formatNumber(profile.totalStars)} STARS AND COUNTING`, `${formatNumber(profile.followers)} PEOPLE ARE FOLLOWING`);
  if (top) lines.push(`INSIDE: ${truncate(top.name, 22).toUpperCase()}${top.stars > 0 ? ` (★ ${formatNumber(top.stars)})` : ''}`);
  const langs = blocks.has('languages') ? profile.languages.slice(0, 3).map((l) => l.name.toUpperCase()) : [];
  if (langs.length > 0) lines.push(`PLUS: ${langs.join(', ')}`);
  if (blocks.has('stats') && profile.publicRepos > 0) lines.push(`${formatNumber(profile.publicRepos)} PROJECTS, ALL PUBLIC`);
  return lines;
}

/** The bars of a barcode, widths from 1 to 4. They come from the login, so a person's code never changes. */
export function barcode(login: string, bars = 38): number[] {
  const random = seeded(`barcode:${login}`);
  return Array.from({ length: bars }, () => 1 + Math.floor(random() * 4));
}

/** A rough top or bottom edge, like paper torn by hand: points across `w` that wander up to `amp` either way. */
export function tornEdge(login: string, x: number, y: number, w: number, amp: number, steps = 18): Array<[number, number]> {
  const random = seeded(`torn:${login}:${x}:${y}`);
  return Array.from({ length: steps + 1 }, (_v, i) => [x + (w * i) / steps, y + (random() * 2 - 1) * amp]);
}

function zineSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const paper = dark ? '#16151c' : '#fff1a6';
  const mast = dark ? '#ffe14a' : '#d7192d';
  const ink = dark ? '#f4f1ea' : '#16121a';
  const hot = dark ? '#ff4f9a' : '#0b57d0';
  const name = (profile.name ?? profile.login).toUpperCase();
  const height = 580;
  const size = Math.round(Math.min(118, 846 / (Math.min(name.length, 16) * 0.62)));
  const lines = coverLines(profile, blocks);
  const since = isoDate(profile.createdAt)?.slice(0, 4);
  const edition = isoDate(profile.fetchedAt);
  let body = `<rect width="900" height="${height}" fill="${paper}"/>`;
  body += `<rect x="0" y="0" width="900" height="8" fill="${hot}"/>`;
  body += text(truncate(name, 16), 450, 22 + size * 0.86, size, mast, `text-anchor="middle" font-family="${IMPACT}" letter-spacing="2"`);
  const strip = [since ? `ON GITHUB SINCE ${since}` : null, edition ? `EDITION OF ${MONTHS[Number(edition.slice(5, 7)) - 1]} ${edition.slice(0, 4)}` : null, 'PRICE: FREE'].filter((v): v is string => Boolean(v));
  body += `<rect x="40" y="${24 + size}" width="820" height="26" fill="${ink}"/>` + text(strip.join('   ★   '), 450, 42 + size, 13, paper, 'text-anchor="middle" class="mono" font-weight="700" letter-spacing="2"');
  // The picture, torn at both edges and held with tape.
  const px = 318;
  const py = 48 + size + 24;
  const pw = 264;
  const ph = 330;
  const top = tornEdge(profile.login, px, py, pw, 5);
  const bottom = tornEdge(profile.login, px, py + ph, pw, 5).reverse();
  const clip = `M${top.map(([x, y]) => `${num(x)} ${num(y)}`).join('L')}L${bottom.map(([x, y]) => `${num(x)} ${num(y)}`).join('L')}Z`;
  body += `<path d="${clip}" fill="#000" fill-opacity="0.25" transform="translate(5 6)"/><clipPath id="zine-torn"><path d="${clip}"/></clipPath>`;
  body += `<g clip-path="url(#zine-torn)">${photo(profile, px - 6, py - 6, pw + 12, ph + 12, 'zine-p', { tile: { fill: hot, ink: paper } })}</g>`;
  body += `<rect x="${px + pw / 2 - 34}" y="${py - 14}" width="68" height="22" fill="${mast}" fill-opacity="0.7" transform="rotate(-3 ${px + pw / 2} ${py})"/>`;
  const left = lines.filter((_l, i) => i % 2 === 0);
  const right = lines.filter((_l, i) => i % 2 === 1);
  const column = (items: string[], x: number, anchor: 'start' | 'end') =>
    items
      .map((line, i) => {
        const parts = wrap(line, 17, 3);
        const y = py + 24 + i * 100;
        return parts.map((p, j) => text(p, x, y + j * 28, 25, i % 2 === 0 ? hot : ink, `text-anchor="${anchor}" font-family="${IMPACT}"`)).join('') + `<rect x="${anchor === 'start' ? x : x - 56}" y="${y + parts.length * 28 - 14}" width="56" height="5" fill="${mast}"/>`;
      })
      .join('');
  body += column(left, 40, 'start') + column(right, 860, 'end');
  // A barcode that spells nothing but the name under it.
  const bars = barcode(profile.login);
  let bx = 40;
  const by = height - 76;
  body += `<rect x="30" y="${by - 8}" width="${bars.reduce((s, b) => s + b * 2.4 + 2, 0) + 20}" height="62" fill="${dark ? '#f4f1ea' : '#ffffff'}"/>`;
  bars.forEach((b) => {
    body += `<rect x="${num(bx)}" y="${by}" width="${num(b * 2.4)}" height="38" fill="#111"/>`;
    bx += b * 2.4 + 2;
  });
  body += text(`@${profile.login}`, 40, by + 52, 10.5, '#111', 'class="mono"');
  body += text('livebio', 860, height - 24, 12, ink, 'class="mono" text-anchor="end" letter-spacing="3" font-weight="700"');
  return svgDoc({ height, title: `${profile.name ?? profile.login} on GitHub, as a magazine cover`, bg: paper, radius: 14, css: riseCss(motion), body: rise(body, motion, 0.05) });
}

export const zine: Template = imageTemplate('zine', 'Zine cover', 'A loud magazine cover: your name as the masthead, your picture torn and taped, and cover lines made of your real numbers.', ['creative', 'image', 'print'], zineSvg, {
  extra: () => 'shown as a magazine cover',
});

/* ------------------------------------------------------------------------------------------------ */
/* Contact sheet                                                                                     */
/* ------------------------------------------------------------------------------------------------ */

export interface MonthFrame {
  key: string;
  label: string;
  total: number;
  /** How much of the busiest month's activity this month had, from 0 to 1. */
  exposure: number;
}

/** The last twelve calendar months in the calendar, oldest first, each with how well exposed its frame is. */
export function monthFrames(days: ReadonlyArray<ContributionDay>): MonthFrame[] {
  const totals = new Map<string, number>();
  for (const day of days) totals.set(day.date.slice(0, 7), (totals.get(day.date.slice(0, 7)) ?? 0) + day.count);
  const last = [...totals].slice(-12);
  const peak = Math.max(0, ...last.map(([, t]) => t));
  return last.map(([key, total]) => ({ key, label: MONTHS[Number(key.slice(5, 7)) - 1] ?? key, total, exposure: peak > 0 ? Math.round((total / peak) * 1000) / 1000 : 0 }));
}

/** How much black covers a frame: none for the busiest month, and never so much that a quiet month cannot be seen. The curve is a square root, so small differences between months stay visible. */
export function darkness(exposure: number): number {
  const e = Math.min(1, Math.max(0, exposure));
  return Math.round(0.7 * (1 - Math.sqrt(e)) * 1000) / 1000;
}

function contactSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const bg = dark ? '#0c0c0d' : '#e7e2d6';
  const film = dark ? '#18181a' : '#2a2a2c';
  const edge = dark ? '#d9d4c5' : '#f2eee3';
  const ink = dark ? '#ece8dc' : '#1e1c18';
  const days = daysOf(profile, config);
  const frames = monthFrames(days);
  const name = profile.name ?? profile.login;
  const height = frames.length > 0 ? 500 : 280;
  let body = `<rect width="900" height="${height}" fill="${bg}"/>`;
  body += text('CONTACT SHEET', 40, 44, 12, ink, 'class="mono" letter-spacing="5" font-weight="700"') + text(`${truncate(name, 24)}  ·  @${profile.login}`, 860, 44, 12, ink, 'class="mono" text-anchor="end"');
  if (frames.length === 0) {
    body += photo(profile, 40, 70, 160, 160, 'cs0', { tile: { fill: film, ink: edge } });
    body += text(blocks.has('activity') ? 'Twelve frames appear after the first automatic update, once the calendar is available.' : 'The activity section is switched off.', 224, 150, 14, ink, 'font-style="italic"');
    return svgDoc({ height, title: `${name} on GitHub, as a contact sheet`, bg, radius: 14, css: riseCss(motion), body });
  }
  const best = frames.reduce((b, f) => (f.total > b.total ? f : b), frames[0]!);
  const cols = 6;
  const fw = 128;
  const gap = 12;
  const x0 = (900 - (cols * fw + (cols - 1) * gap)) / 2;
  frames.forEach((frame, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = x0 + col * (fw + gap);
    const y = 70 + row * 200;
    let cell = `<rect x="${num(x - 8)}" y="${y - 10}" width="${fw + 16}" height="${fw + 60}" fill="${film}"/>`;
    for (let h = 0; h < 6; h++) cell += `<rect x="${num(x - 5)}" y="${num(y - 6 + h * 23)}" width="4" height="9" rx="1" fill="${edge}"/><rect x="${num(x + fw + 1)}" y="${num(y - 6 + h * 23)}" width="4" height="9" rx="1" fill="${edge}"/>`;
    cell += photo(profile, x, y, fw, fw, `cs${i + 1}`, { ref: 'av', tile: { fill: '#555', ink: edge } });
    cell += `<rect x="${num(x)}" y="${y}" width="${fw}" height="${fw}" fill="#000" fill-opacity="${num(darkness(frame.exposure))}"/>`;
    cell += text(`${i + 1}  ${frame.label}`, x, y + fw + 22, 12, edge, 'class="mono" font-weight="700"');
    cell += text(`${formatNumber(frame.total)} ${frame.total === 1 ? 'contribution' : 'contributions'}`, x, y + fw + 40, 10.5, edge, 'class="mono" fill-opacity="0.75"');
    if (frame === best && best.total > 0) cell += `<ellipse cx="${num(x + fw / 2)}" cy="${num(y + fw / 2)}" rx="${fw / 2 + 6}" ry="${fw / 2 + 6}" fill="none" stroke="#e8352e" stroke-width="4" transform="rotate(-8 ${num(x + fw / 2)} ${num(y + fw / 2)})"/>` + text('keeper', x + 10, y + fw - 10, 16, '#ff5a50', 'class="serif" font-style="italic" font-weight="700"');
    body += rise(cell, motion, 0.05 * i);
  });
  body += text('Each frame is one month. The darker the frame, the fewer contributions that month. The circled one was the busiest.', 450, height - 22, 11, ink, 'class="mono" text-anchor="middle"');
  return svgDoc({ height, title: `${name} on GitHub, as a contact sheet of twelve months`, bg, radius: 14, defs: pictureDef(profile, 'av'), css: riseCss(motion), body });
}

export const contact: Template = imageTemplate('contact', 'Contact sheet', 'A film contact sheet of your year: twelve frames of your picture, each one exposed as much as that month was busy.', ['creative', 'image', 'activity'], contactSvg, {
  activity: true,
  extra: () => 'shown as a film contact sheet, one frame for each month',
});

/* ------------------------------------------------------------------------------------------------ */
/* Museum wall                                                                                       */
/* ------------------------------------------------------------------------------------------------ */

/** Width of a framed work: bigger for more stars, on a log scale so one huge repository does not shrink the rest. */
export function frameWidth(stars: number, mostStars: number, min = 84, max = 116): number {
  if (!(mostStars > 0) || !(stars > 0)) return min;
  return Math.round(min + (Math.log1p(Math.min(stars, mostStars)) / Math.log1p(mostStars)) * (max - min));
}

/** A small abstract picture for a repository, made only from its name and language, so it is always the same one. */
function artwork(repo: RepoSummary, variant: Variant, x: number, y: number, w: number, h: number, id: string): string {
  const random = seeded(`art:${repo.name}`);
  const base = repo.language ? langColor(repo.language, variant) : hslToHex(hashOf(repo.name) % 360, 0.5, 0.5);
  let out = `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath><g clip-path="url(#${id})"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${hslToHex(hashOf(repo.name) % 360, 0.35, variant === 'dark' ? 0.18 : 0.88)}"/>`;
  for (let i = 0; i < 5; i++) {
    const cx = x + random() * w;
    const cy = y + random() * h;
    const r = 14 + random() * Math.min(w, h) * 0.5;
    out += `<circle cx="${num(cx)}" cy="${num(cy)}" r="${num(r)}" fill="${i % 2 === 0 ? base : hslToHex((hashOf(repo.name) + 140 + i * 30) % 360, 0.6, 0.55)}" fill-opacity="${num(0.35 + random() * 0.4)}"/>`;
  }
  return out + `</g>`;
}

function museumSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const wall = dark ? '#24211d' : '#eee8dc';
  const floor = dark ? '#171512' : '#cdbfa6';
  const frameColor = dark ? '#b89a5e' : '#7a5a24';
  const ink = dark ? '#ece5d6' : '#2a2218';
  const muted = dark ? '#a39a88' : '#6d5f48';
  const name = profile.name ?? profile.login;
  const repos = blocks.has('projects') ? [...profile.topRepos].sort((a, b) => b.stars - a.stars).slice(0, 4) : [];
  const most = repos[0]?.stars ?? 0;
  const since = isoDate(profile.createdAt)?.slice(0, 4);
  const height = 500;
  const lineY = 150;
  const plaqueY = 340;
  let body = `<rect width="900" height="${height}" fill="${wall}"/><rect y="${height - 54}" width="900" height="54" fill="${floor}"/>`;
  body += text(`${truncate(name, 26)}: selected works`, 450, 52, 22, ink, 'class="serif" text-anchor="middle" font-style="italic"');
  const slots: Array<{ x: number; w: number; repo: RepoSummary | null }> = [];
  const left = repos.slice(0, 2);
  const right = repos.slice(2, 4);
  const portraitW = 160;
  const gap = 34;
  let cursor = 450 - portraitW / 2 - gap;
  for (const repo of [...left].reverse()) {
    const w = frameWidth(repo.stars, most);
    cursor -= w;
    slots.push({ x: cursor, w, repo });
    cursor -= gap;
  }
  slots.push({ x: 450 - portraitW / 2, w: portraitW, repo: null });
  cursor = 450 + portraitW / 2 + gap;
  for (const repo of right) {
    const w = frameWidth(repo.stars, most);
    slots.push({ x: cursor, w, repo });
    cursor += w + gap;
  }
  slots.forEach((slot, i) => {
    const h = Math.round(slot.w * (slot.repo ? 1.2 : 1.28));
    const y = lineY + 20 + (plaqueY - 60 - h) / 2 + (slot.repo ? 0 : -8);
    const cx = slot.x + slot.w / 2;
    let piece = `<path d="M${num(cx - 28)} ${lineY - 30}L${num(cx)} ${lineY - 56}L${num(cx + 28)} ${lineY - 30}" fill="none" stroke="${muted}" stroke-width="1"/>`;
    piece += `<path d="M${num(cx - 30)} ${lineY - 30}h60l30 ${num(h + 80)}h-120z" fill="#fff" fill-opacity="${dark ? 0.05 : 0.18}"/>`;
    piece += `<rect x="${num(slot.x - 10 + 3)}" y="${num(y - 10 + 5)}" width="${slot.w + 20}" height="${h + 20}" fill="#000" fill-opacity="0.3"/><rect x="${num(slot.x - 10)}" y="${num(y - 10)}" width="${slot.w + 20}" height="${h + 20}" fill="${frameColor}"/><rect x="${num(slot.x - 3)}" y="${num(y - 3)}" width="${slot.w + 6}" height="${h + 6}" fill="${wall}"/>`;
    piece += slot.repo ? artwork(slot.repo, variant, slot.x, y, slot.w, h, `mu${i}`) : photo(profile, slot.x, y, slot.w, h, `mu${i}`, { tile: { fill: frameColor, ink: wall } });
    const py = plaqueY + 4;
    piece += `<rect x="${num(slot.x - 6)}" y="${py}" width="${slot.w + 12}" height="${slot.repo ? 92 : 70}" fill="${dark ? '#2f2b25' : '#f8f4ea'}" stroke="${muted}" stroke-opacity="0.5"/>`;
    if (slot.repo) {
      piece += text(truncate(slot.repo.name, Math.max(10, Math.floor(slot.w / 8))), slot.x, py + 20, 12.5, ink, 'class="serif" font-style="italic" font-weight="700"');
      piece += text(`${slot.repo.language ?? 'Mixed media'}  ·  ★ ${formatNumber(slot.repo.stars)}`, slot.x, py + 38, 10.5, muted, 'class="mono"');
      wrap(slot.repo.description ?? '', Math.max(14, Math.floor(slot.w / 6.4)), 3).forEach((l, j) => (piece += text(l, slot.x, py + 55 + j * 13, 10.5, ink, '')));
    } else {
      piece += text('Self-portrait', slot.x, py + 20, 13, ink, 'class="serif" font-style="italic" font-weight="700"');
      piece += text(`@${profile.login}`, slot.x, py + 38, 10.5, muted, 'class="mono"');
      if (since) piece += text(`On GitHub since ${since}`, slot.x, py + 56, 10.5, ink, '');
    }
    body += rise(piece, motion, 0.12 * i);
  });
  body += text(repos.length > 0 ? 'The bigger the frame, the more stars. Each picture is made from the repository’s name.' : 'Switch on Top projects to hang more works.', 450, height - 20, 11, ink, 'class="mono" text-anchor="middle"');
  return svgDoc({ height, title: `${name} on GitHub, as a museum wall of framed works`, bg: wall, radius: 14, css: riseCss(motion), body });
}

export const museum: Template = imageTemplate('museum', 'Museum wall', 'A gallery wall: your picture as the self-portrait and your top projects as framed works with museum labels.', ['creative', 'image', 'art'], museumSvg, {
  extra: () => 'shown as a museum wall of framed works',
});

/* ------------------------------------------------------------------------------------------------ */
/* Mission patch                                                                                     */
/* ------------------------------------------------------------------------------------------------ */

/** The path of an arc of a circle for text to run along: the upper half reads left to right, the lower half too. */
export function arcPath(cx: number, cy: number, r: number, upper: boolean): string {
  return upper ? `M${num(cx - r)} ${num(cy)}A${num(r)} ${num(r)} 0 0 1 ${num(cx + r)} ${num(cy)}` : `M${num(cx - r)} ${num(cy)}A${num(r)} ${num(r)} 0 0 0 ${num(cx + r)} ${num(cy)}`;
}

function patchSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const hue = hueFor(profile, 215);
  const page = dark ? '#0c1018' : '#dfe6ee';
  const ink = dark ? '#e8edf5' : '#16202e';
  const muted = dark ? '#8f9bb0' : '#51607a';
  const navy = hslToHex(hue, 0.5, dark ? 0.16 : 0.2);
  const twill = hslToHex((hue + 40) % 360, 0.75, 0.55);
  const gold = '#f2c14e';
  const name = profile.name ?? profile.login;
  const height = 520;
  const cx = 450;
  const cy = 260;
  const R = 214;
  const since = isoDate(profile.createdAt)?.slice(0, 4);
  const langs = blocks.has('languages') ? profile.languages.slice(0, 3) : [];
  const defs = `<path id="patch-top" d="${arcPath(cx, cy, R - 34, true)}"/><path id="patch-bottom" d="${arcPath(cx, cy, R - 34, false)}"/>`;
  let body = `<rect width="900" height="${height}" fill="${page}"/>`;
  body += `<circle cx="${cx}" cy="${cy}" r="${R + 6}" fill="#000" fill-opacity="0.25" transform="translate(4 6)"/>`;
  body += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${twill}"/><circle cx="${cx}" cy="${cy}" r="${R - 8}" fill="none" stroke="${gold}" stroke-width="3" stroke-dasharray="3 5"/>`;
  body += `<circle cx="${cx}" cy="${cy}" r="${R - 20}" fill="${navy}"/><circle cx="${cx}" cy="${cy}" r="${R - 22}" fill="none" stroke="${gold}" stroke-width="2"/>`;
  body += `<text font-size="30" font-weight="800" letter-spacing="6" fill="${gold}" text-anchor="middle" class="mono"><textPath href="#patch-top" startOffset="50%">${xmlEscape(truncate(`@${profile.login}`.toUpperCase(), 22))}</textPath></text>`;
  const bottom = [since ? `ON GITHUB SINCE ${since}` : null, blocks.has('stats') ? `${formatNumber(profile.followers)} CREW` : null].filter((v): v is string => Boolean(v)).join('  ·  ');
  if (bottom) body += `<text font-size="17" font-weight="700" letter-spacing="4" fill="${gold}" text-anchor="middle" class="mono"><textPath href="#patch-bottom" startOffset="50%">${xmlEscape(bottom)}</textPath></text>`;
  const pr = 96;
  body += `<circle cx="${cx}" cy="${cy}" r="${pr + 7}" fill="${gold}"/>`;
  body += `<clipPath id="patch-clip"><circle cx="${cx}" cy="${cy}" r="${pr}"/></clipPath><g clip-path="url(#patch-clip)">${photo(profile, cx - pr, cy - pr, pr * 2, pr * 2, 'patch-p', { tile: { fill: twill, ink: navy } })}</g>`;
  langs.forEach((l, i) => {
    const a = (Math.PI / 180) * (168 + i * 24);
    const lx = cx + Math.cos(a) * (R - 56);
    const ly = cy + Math.sin(a) * (R - 56);
    body += `<circle cx="${num(lx)}" cy="${num(ly)}" r="19" fill="${langColor(l.name, 'dark')}" stroke="${gold}" stroke-width="2"/>` + text(l.name.slice(0, 2).toUpperCase(), lx, ly + 5, 12, '#10131a', 'class="mono" text-anchor="middle" font-weight="800"');
  });
  const lines: Array<[string, string]> = [['COMMANDER', truncate(name, 20)]];
  if (blocks.has('stats')) lines.push(['STARS', formatNumber(profile.totalStars)], ['PROJECTS', formatNumber(profile.publicRepos)]);
  lines.forEach(([label, value], i) => {
    body += text(label, 40, 120 + i * 78, 11, muted, 'class="mono" letter-spacing="4"') + text(value, 40, 148 + i * 78, 26, ink, 'font-weight="800"');
  });
  if (langs.length > 0) body += text('LANGUAGE BADGES', 860, 120, 11, muted, 'class="mono" letter-spacing="4" text-anchor="end"') + wrap(langs.map((l) => `${l.name} ${l.percent}%`).join(', '), 24, 4).map((l, i) => text(l, 860, 148 + i * 22, 16, ink, 'text-anchor="end"')).join('');
  return svgDoc({ height, title: `${name} on GitHub, as an embroidered mission patch`, bg: page, radius: 14, defs, css: riseCss(motion), body: rise(body, motion, 0.05) });
}

export const patch: Template = imageTemplate('patch', 'Mission patch', 'An embroidered mission patch: your picture in gold thread, your handle and your years around the rim, your languages as badges.', ['creative', 'image', 'badge'], patchSvg, {
  extra: () => 'shown as an embroidered mission patch',
});

/* ------------------------------------------------------------------------------------------------ */
/* Lock screen                                                                                       */
/* ------------------------------------------------------------------------------------------------ */

export interface Notice {
  title: string;
  body: string;
}

/** Notifications for the repositories pushed to most recently, with how long ago, worked out from the real push dates. */
export function notices(profile: Profile, blocks: ReadonlySet<string>, limit = 4): Notice[] {
  const now = profile.fetchedAt ?? '';
  const out: Notice[] = [];
  if (blocks.has('projects')) {
    const pool = (profile.recentRepos && profile.recentRepos.length > 0 ? profile.recentRepos : profile.topRepos).filter((r) => r.pushedAt);
    const sorted = [...pool].sort((a, b) => Date.parse(b.pushedAt ?? '') - Date.parse(a.pushedAt ?? ''));
    for (const repo of sorted) {
      const ago = timeAgo(repo.pushedAt ?? '', now);
      if (ago) out.push({ title: truncate(repo.name, 28), body: ago === 'today' ? 'Pushed to today' : `Pushed to ${ago}` });
    }
  }
  const result = out.slice(0, blocks.has('stats') ? Math.max(0, limit - 1) : limit);
  if (blocks.has('stats')) result.push({ title: `@${profile.login}`, body: `${formatNumber(profile.totalStars)} stars · ${formatNumber(profile.followers)} followers` });
  return result;
}

/** The time of day and date of the data, in UTC, such as "08:00" and "Wednesday 10 June", or null when it has no readable time. */
export function clockOf(iso: string | undefined): { time: string; date: string } | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(iso)) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return { time: `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`, date: `${days[d.getUTCDay()]} ${d.getUTCDate()} ${months[d.getUTCMonth()]}` };
}

function lockSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const hue = hueFor(profile, 250);
  const page = dark ? '#0b0d12' : '#e4e8ef';
  const ink = dark ? '#e8ecf4' : '#17202e';
  const muted = dark ? '#8e98ab' : '#566179';
  const name = profile.name ?? profile.login;
  const height = 660;
  const px = 70;
  const py = 30;
  const pw = 330;
  const ph = 600;
  const clock = clockOf(profile.fetchedAt);
  const list = notices(profile, blocks);
  const defs =
    `<linearGradient id="lock-bg" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="${hslToHex(hue, 0.7, dark ? 0.32 : 0.62)}"/><stop offset="1" stop-color="${hslToHex((hue + 60) % 360, 0.65, dark ? 0.12 : 0.4)}"/></linearGradient>` +
    `<filter id="lock-blur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="14"/></filter><clipPath id="lock-screen"><rect x="${px + 10}" y="${py + 10}" width="${pw - 20}" height="${ph - 20}" rx="38"/></clipPath>`;
  let body = `<rect width="900" height="${height}" fill="${page}"/>`;
  body += `<rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="48" fill="#0a0a0c"/><g clip-path="url(#lock-screen)"><rect x="${px + 10}" y="${py + 10}" width="${pw - 20}" height="${ph - 20}" fill="url(#lock-bg)"/>`;
  body += photo(profile, px - 40, py + 60, pw + 80, 340, 'lock-p', { filter: 'lock-blur', opacity: 0.55, tile: { fill: '#ffffff22', ink: '#ffffff' } });
  body += `<rect x="${px + 10}" y="${py + 10}" width="${pw - 20}" height="${ph - 20}" fill="#000" fill-opacity="0.18"/>`;
  body += `<rect x="${px + pw / 2 - 52}" y="${py + 22}" width="104" height="26" rx="13" fill="#0a0a0c"/>`;
  if (clock) {
    body += text(clock.date, px + pw / 2, py + 96, 15, '#ffffff', 'text-anchor="middle" font-weight="600" fill-opacity="0.9"');
    body += text(clock.time, px + pw / 2, py + 170, 76, '#ffffff', 'text-anchor="middle" font-weight="300"');
  } else {
    body += text(`@${profile.login}`, px + pw / 2, py + 130, 26, '#ffffff', 'text-anchor="middle" font-weight="700"');
  }
  list.forEach((n, i) => {
    const y = py + 232 + i * 78;
    body += `<rect x="${px + 24}" y="${y}" width="${pw - 48}" height="66" rx="18" fill="#ffffff" fill-opacity="${dark ? 0.16 : 0.5}"/>`;
    body += `<rect x="${px + 36}" y="${y + 13}" width="26" height="26" rx="7" fill="#24292f"/><text x="${px + 49}" y="${y + 32}" text-anchor="middle" font-size="15" font-weight="800" fill="#fff">G</text>`;
    body += text(n.title, px + 72, y + 27, 14, '#ffffff', 'font-weight="700"') + text(n.body, px + 72, y + 48, 12.5, '#ffffff', 'fill-opacity="0.82"');
  });
  body += `<rect x="${px + pw / 2 - 58}" y="${py + ph - 28}" width="116" height="5" rx="3" fill="#ffffff" fill-opacity="0.7"/></g>`;
  const rx = 470;
  body += text('LOCK SCREEN', rx, 130, 12, muted, 'class="mono" letter-spacing="5" font-weight="700"');
  body += text(truncate(name, 20), rx, 184, 40, ink, 'font-weight="800"');
  body += text(`@${profile.login}`, rx, 214, 15, muted, 'class="mono"');
  const notes = ['Notifications are the repositories you pushed to most recently, newest first.', clock ? `The clock is the moment the data was read (${clock.time} UTC).` : null, 'Nothing here is a real notification.'].filter((v): v is string => Boolean(v));
  notes.forEach((n, i) => wrap(n, 40, 3).forEach((l, j) => (body += text(l, rx, 280 + i * 76 + j * 20, 14, i === 2 ? muted : ink, ''))));
  return svgDoc({ height, title: `${name} on GitHub, as a phone lock screen`, bg: page, radius: 14, defs, css: riseCss(motion), body: rise(body, motion, 0.05) });
}

export const lock: Template = imageTemplate('lock', 'Lock screen', 'A phone lock screen: a blurred wallpaper made from your picture, with your latest pushes as notifications.', ['creative', 'image', 'device'], lockSvg, {
  extra: () => 'shown as a phone lock screen',
});

export const printTemplates: Template[] = [zine, contact, museum, patch, lock];
