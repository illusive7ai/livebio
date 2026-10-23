import { hslToHex, hueOf } from '../color';
import type { Variant } from '../themes';
import type { Config, PixelGrid, Profile, Template } from '../types';
import { formatNumber, truncate, wrap, xmlEscape } from '../util';
import { num, riseCss } from './kit';
import { hashOf, imageTemplate, isoDate, langColor, pictureBox, svgDoc } from './make';
import { rise } from './shared';
import { starScale } from './worlds';

/** Five designs that draw the data as an instrument or a diagram: a sonar, a word cloud, a timeline, a sunburst and a brick mosaic. */

const hueFor = (profile: Profile, fallback: number): number => hueOf(profile.avatar?.grid.tint) ?? fallback;

const text = (value: string, x: number, y: number, size: number, fill: string, extra = ''): string =>
  `<text x="${num(x)}" y="${num(y)}" font-size="${size}" fill="${fill}" ${extra}>${xmlEscape(value)}</text>`;

/* ------------------------------------------------------------------------------------------------ */
/* Sonar                                                                                             */
/* ------------------------------------------------------------------------------------------------ */

/** How far from the centre a blip sits: close for a very starred repository, near the edge for an unstarred one. */
export function blipRadius(stars: number, radius: number): number {
  const inner = radius * 0.12;
  return inner + (1 - starScale(stars)) * (radius * 0.84 - inner);
}

function sonarSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const bg = dark ? '#03100a' : '#d5e4da';
  const screen = dark ? '#041a10' : '#eaf4ee';
  const line = dark ? '#0f5a35' : '#9fc2ae';
  const glow = dark ? '#37ff8b' : '#0b7a40';
  const ink = dark ? '#cfeedd' : '#133a26';
  const name = profile.name ?? profile.login;
  const repos = blocks.has('projects') ? profile.topRepos.slice(0, 6) : [];
  const langs = blocks.has('languages') ? profile.languages.slice(0, 5) : [];
  const cx = 290;
  const cy = 262;
  const R = 220;
  const height = 540;
  const defs = `<linearGradient id="sweep" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="${glow}" stop-opacity="0"/><stop offset="1" stop-color="${glow}" stop-opacity="${dark ? 0.55 : 0.4}"/></linearGradient><clipPath id="disc"><circle cx="${cx}" cy="${cy}" r="${R}"/></clipPath>`;

  let body = `<circle cx="${cx}" cy="${cy}" r="${R + 10}" fill="${screen}" stroke="${line}" stroke-width="3"/>`;
  for (const f of [0.25, 0.5, 0.75, 1]) body += `<circle cx="${cx}" cy="${cy}" r="${R * f}" fill="none" stroke="${line}" stroke-width="1.2"/>`;
  body += `<path d="M${cx - R} ${cy}H${cx + R}M${cx} ${cy - R}V${cy + R}" stroke="${line}" stroke-width="1.2"/>`;
  body += `<g clip-path="url(#disc)"><g class="sweep" style="transform-origin:${cx}px ${cy}px"><path d="M${cx} ${cy}L${cx + R} ${cy}A${R} ${R} 0 0 0 ${num(cx + R * Math.cos(-0.9))} ${num(cy + R * Math.sin(-0.9))}Z" fill="url(#sweep)"/></g></g>`;
  body += `<circle cx="${cx}" cy="${cy}" r="4" fill="${glow}"/>`;
  repos.forEach((repo, i) => {
    const angle = (i / repos.length) * Math.PI * 2 + ((hashOf(`${profile.login}:${repo.name}`) % 100) / 100) * (Math.PI / repos.length) * 0.8 - Math.PI / 2;
    const r = blipRadius(repo.stars, R);
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    const color = repo.language ? langColor(repo.language, variant) : glow;
    const size = 5 + starScale(repo.stars) * 9;
    body += `<g class="blip" style="animation-delay:${(i * 0.5).toFixed(1)}s"><circle cx="${num(x)}" cy="${num(y)}" r="${num(size + 5)}" fill="${color}" fill-opacity="0.22"/><circle cx="${num(x)}" cy="${num(y)}" r="${num(size)}" fill="${color}"/>`;
    body += text(truncate(repo.name, 14), x + size + 8, y + 4, 12, ink, 'class="mono" font-weight="700"') + `</g>`;
  });
  // The readout on the right.
  body += text('SONAR', 580, 80, 12, glow, 'letter-spacing="6" font-weight="800"') + text(truncate(name, 22), 580, 114, 26, ink, 'font-weight="800"') + text(`@${profile.login}`, 580, 136, 13, glow, 'class="mono"');
  if (repos.length === 0) body += text(blocks.has('projects') ? 'Nothing on the screen.' : 'The projects section is switched off.', 580, 190, 14, ink, 'font-style="italic"');
  repos.forEach((repo, i) => {
    const y = 184 + i * 28;
    body += `<circle cx="588" cy="${y - 4}" r="5" fill="${repo.language ? langColor(repo.language, variant) : glow}"/>` + text(truncate(repo.name, 20), 604, y, 14, ink, 'class="mono" font-weight="700"') + text(`★ ${formatNumber(repo.stars)}`, 860, y, 13, glow, 'class="mono" text-anchor="end"');
  });
  if (langs.length > 0) {
    for (const [i, part] of wrap(langs.map((l) => `${l.name} ${Math.round(l.percent)}%`).join('  ·  '), 38, 3).entries()) body += text(part, 580, 184 + Math.max(repos.length, 1) * 28 + 24 + i * 18, 12, ink, 'class="mono"');
  }
  body += text('closer to the centre = more stars (log scale) · the angle of a blip means nothing', 36, height - 14, 10.5, ink, 'class="mono"');
  const css = riseCss(motion) + (motion ? `.sweep{animation:turn 6s linear infinite}@keyframes turn{to{transform:rotate(360deg)}}.blip{animation:ping 6s ease-out infinite}@keyframes ping{0%{opacity:1}60%{opacity:.35}100%{opacity:1}}@media (prefers-reduced-motion:reduce){.sweep,.blip{animation:none}}` : '');
  return svgDoc({ height, title: `${name} on GitHub, as a sonar screen of repositories`, bg, radius: 14, defs, css, body });
}

export const sonar: Template = imageTemplate('sonar', 'Sonar', 'A sonar screen with a blip for each repository: the more stars, the closer to the centre.', ['creative', 'device', 'projects'], sonarSvg, {
  extra: () => 'shown as a sonar screen with a blip for each repository',
});

/* ------------------------------------------------------------------------------------------------ */
/* Word cloud                                                                                        */
/* ------------------------------------------------------------------------------------------------ */

export interface Word {
  text: string;
  size: number;
}

export interface Placed extends Word {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The space a word takes, a little generous so neighbours never touch. */
export function wordBox(word: Word): { w: number; h: number } {
  return { w: Math.ceil([...word.text].length * word.size * 0.6 + 8), h: Math.ceil(word.size * 1.05 + 6) };
}

const overlaps = (a: Placed, b: Placed): boolean => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/**
 * Places words, biggest first, as close to the middle of the box as they will fit, spiralling outwards until a spot
 * is free. A word that fits nowhere is left out. The result is the same every time for the same words.
 */
export function placeWords(words: ReadonlyArray<Word>, width: number, height: number): { placed: Placed[]; dropped: Word[] } {
  const placed: Placed[] = [];
  const dropped: Word[] = [];
  const order = [...words].sort((a, b) => b.size - a.size || a.text.localeCompare(b.text));
  for (const word of order) {
    const { w, h } = wordBox(word);
    let found = false;
    for (let step = 0; step < 6000 && !found; step++) {
      const angle = step * 0.3;
      const radius = 1.6 * angle;
      const x = width / 2 + Math.cos(angle) * radius * 1.6 - w / 2;
      const y = height / 2 + Math.sin(angle) * radius - h / 2;
      if (x < 0 || y < 0 || x + w > width || y + h > height) {
        if (radius > width) break;
        continue;
      }
      const candidate: Placed = { ...word, x, y, w, h };
      if (!placed.some((p) => overlaps(candidate, p))) {
        placed.push(candidate);
        found = true;
      }
    }
    if (!found) dropped.push(word);
  }
  return { placed, dropped };
}

function cloudSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const bg = dark ? '#0d0e14' : '#f6f5f1';
  const ink = dark ? '#eceef6' : '#1a1b22';
  const muted = dark ? '#8b90a3' : '#6a6f80';
  const name = profile.name ?? profile.login;
  const words: Array<Word & { color: string; upper: boolean }> = [];
  if (blocks.has('projects')) for (const repo of profile.topRepos.slice(0, 12)) words.push({ text: truncate(repo.name, 22), size: Math.round(22 + starScale(repo.stars) * 50), color: repo.language ? langColor(repo.language, variant) : muted, upper: false });
  if (blocks.has('languages')) for (const l of profile.languages.slice(0, 8)) words.push({ text: l.name.toUpperCase(), size: Math.round(20 + (Math.min(100, l.percent) / 100) * 56), color: langColor(l.name, variant), upper: true });
  const W = 828;
  const H = 360;
  const { placed, dropped } = placeWords(words, W, H);
  const style = new Map(words.map((w) => [`${w.text}:${w.size}`, w] as const));
  const height = 470;

  let body = text(truncate(name, 26), 36, 54, 26, ink, 'font-weight="800"') + text(`@${profile.login}`, 36, 76, 13, muted, 'class="mono"');
  if (words.length === 0) body += text(blocks.has('projects') || blocks.has('languages') ? 'There are no words yet.' : 'The projects and languages sections are switched off.', 36, 140, 15, muted, 'font-style="italic"');
  placed.forEach((p, i) => {
    const s = style.get(`${p.text}:${p.size}`)!;
    body += `<text class="w" style="animation-delay:${(i * 0.04).toFixed(2)}s" x="${num(36 + p.x + p.w / 2)}" y="${num(90 + p.y + p.h * 0.76)}" text-anchor="middle" font-size="${p.size}" font-weight="${s.upper ? 800 : 600}" ${s.upper ? 'letter-spacing="1" ' : ''}fill="${s.color}">${xmlEscape(p.text)}</text>`;
  });
  body += text(`size = stars for repositories, share of code for the CAPITALS (languages)${dropped.length > 0 ? ` · ${dropped.length} more did not fit` : ''}`, 36, height - 16, 10.5, muted, 'class="mono"');
  const css = riseCss(motion) + (motion ? `.w{animation:pop .5s ease-out both}@keyframes pop{from{opacity:0}}@media (prefers-reduced-motion:reduce){.w{animation:none}}` : '');
  return svgDoc({ height, title: `${name} on GitHub, as a word cloud of repositories and languages`, bg, radius: 14, css, body });
}

export const cloud: Template = imageTemplate('cloud', 'Word cloud', 'Your repository names and languages as a word cloud, sized by stars and by share of code.', ['creative', 'art', 'projects'], cloudSvg, {
  extra: () => 'shown as a word cloud of repository names and languages',
});

/* ------------------------------------------------------------------------------------------------ */
/* Timeline                                                                                          */
/* ------------------------------------------------------------------------------------------------ */

/** Where each date falls along a line from `start` to `end`, from 0 to 1. A date outside that span, or unreadable, gets null. */
export function timelinePositions(start: number, end: number, dates: ReadonlyArray<number>): Array<number | null> {
  const span = end - start;
  return dates.map((d) => (Number.isFinite(d) && span > 0 && d >= start && d <= end ? (d - start) / span : null));
}

/** The first day of each year that falls inside the span, as positions from 0 to 1 with their year. */
export function yearTicks(start: number, end: number): Array<{ year: number; at: number }> {
  const out: Array<{ year: number; at: number }> = [];
  if (!(end > start)) return out;
  for (let y = new Date(start).getUTCFullYear() + 1; y <= new Date(end).getUTCFullYear(); y++) {
    const t = Date.UTC(y, 0, 1);
    if (t > start && t < end) out.push({ year: y, at: (t - start) / (end - start) });
  }
  return out;
}

/**
 * Moves labels apart, keeping their order, until none overlaps and all lie between `min` and `max`. Each label keeps
 * as close to its own x as it can. Anything that cannot fit in the room given is simply as tight as it can be.
 */
export function spreadLabels(xs: ReadonlyArray<number>, widths: ReadonlyArray<number>, min: number, max: number, gap = 8): number[] {
  const out = xs.map((x, i) => Math.max(min + widths[i]! / 2, Math.min(max - widths[i]! / 2, x)));
  for (let i = 1; i < out.length; i++) out[i] = Math.max(out[i]!, out[i - 1]! + (widths[i - 1]! + widths[i]!) / 2 + gap);
  for (let i = out.length - 1; i >= 0; i--) {
    const limit = i === out.length - 1 ? max - widths[i]! / 2 : out[i + 1]! - (widths[i]! + widths[i + 1]!) / 2 - gap;
    if (out[i]! > limit) out[i] = limit;
  }
  return out;
}

function timelineSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const bg = dark ? '#0e1116' : '#f4f1ea';
  const ink = dark ? '#eef0f4' : '#1f2228';
  const muted = dark ? '#8a92a1' : '#6d7280';
  const accent = hslToHex(hueFor(profile, 210), 0.7, dark ? 0.62 : 0.45);
  const name = profile.name ?? profile.login;
  const start = Date.parse(profile.createdAt);
  const pushes = (blocks.has('projects') ? [...profile.topRepos, ...(profile.recentRepos ?? [])] : []).filter((r, i, all) => r.pushedAt && all.findIndex((o) => o.name === r.name) === i);
  const lastPush = Math.max(0, ...pushes.map((r) => Date.parse(r.pushedAt!)).filter(Number.isFinite));
  const readAt = profile.fetchedAt ? Date.parse(profile.fetchedAt) : NaN;
  const end = Number.isFinite(readAt) ? readAt : lastPush;
  const height = 470;
  const x0 = 60;
  const x1 = 840;
  const lineY = 230;

  let body = text(truncate(name, 26), 36, 54, 26, ink, 'font-weight="800"') + text(`@${profile.login}`, 36, 76, 13, muted, 'class="mono"');
  if (!Number.isFinite(start) || !(end > start)) {
    body += text('A timeline needs the date the account was created and the date the data was read.', 36, 150, 15, muted, 'font-style="italic"');
    return svgDoc({ height: 240, title: `${name} on GitHub, as a timeline`, bg, radius: 14, css: riseCss(motion), body });
  }
  const at = (fraction: number): number => x0 + fraction * (x1 - x0);
  body += `<path d="M${x0} ${lineY}H${x1}" stroke="${muted}" stroke-width="3" stroke-linecap="round"/>`;
  for (const tick of yearTicks(start, end)) body += `<path d="M${num(at(tick.at))} ${lineY - 8}v16" stroke="${muted}" stroke-width="1.5"/>` + text(String(tick.year), at(tick.at), lineY + 28, 11, muted, 'class="mono" text-anchor="middle"');
  const pos = timelinePositions(start, end, pushes.map((r) => Date.parse(r.pushedAt!)));
  const markers = pushes.map((repo, i) => ({ repo, at: pos[i] })).filter((m): m is { repo: (typeof pushes)[number]; at: number } => m.at !== null).sort((a, b) => a.at - b.at);
  const labels = markers.map((m) => truncate(m.repo.name, 16));
  const widths = labels.map((l) => l.length * 7.4 + 12);
  // Alternate above and below the line, then spread each side's labels apart so they never overlap.
  const sides = [0, 1].map((side) => markers.map((m, i) => ({ m, i })).filter(({ i }) => i % 2 === side));
  sides.forEach((group, side) => {
    const dots = group.map(({ m }) => at(m.at));
    const ws = group.map(({ i }) => widths[i]!);
    const centres = spreadLabels(dots, ws, 40, 860);
    group.forEach(({ m, i }, k) => {
      const x = at(m.at);
      const lx = centres[k]!;
      const up = side === 0;
      const y = up ? lineY - 70 : lineY + 84;
      body += `<g class="mk" style="animation-delay:${(0.2 + i * 0.12).toFixed(2)}s"><path d="M${num(x)} ${lineY}L${num(lx)} ${up ? y + 20 : y - 16}" stroke="${accent}" stroke-width="1.5"/><circle cx="${num(x)}" cy="${lineY}" r="6" fill="${accent}"/>`;
      body += text(labels[i]!, lx, y, 12.5, ink, 'text-anchor="middle" font-weight="700"') + text(isoDate(m.repo.pushedAt) ?? '', lx, y + 14, 10.5, muted, 'class="mono" text-anchor="middle"') + `</g>`;
    });
  });
  body += `<circle cx="${x0}" cy="${lineY}" r="9" fill="${ink}"/>` + text('Joined GitHub', x0, lineY + 150, 13, ink, 'font-weight="800"') + text(isoDate(profile.createdAt) ?? '', x0, lineY + 166, 11, muted, 'class="mono"');
  body += `<circle cx="${x1}" cy="${lineY}" r="9" fill="${ink}"/>` + text(Number.isFinite(readAt) ? 'Data read' : 'Last push', x1, lineY + 150, 13, ink, 'text-anchor="end" font-weight="800"') + text(new Date(end).toISOString().slice(0, 10), x1, lineY + 166, 11, muted, 'class="mono" text-anchor="end"');
  body += text('each dot is the most recent push to a repository; only dates GitHub gave are shown', 36, height - 16, 10.5, muted, 'class="mono"');
  const css = riseCss(motion) + (motion ? `.mk{animation:drop .5s ease-out both}@keyframes drop{from{opacity:0;transform:translateY(-8px)}}@media (prefers-reduced-motion:reduce){.mk{animation:none}}` : '');
  return svgDoc({ height, title: `${name} on GitHub, as a timeline`, bg, radius: 14, css, body });
}

export const timeline: Template = imageTemplate('timeline', 'Timeline', 'A timeline from the day you joined to today, with a dot where each repository was last pushed to.', ['creative', 'projects', 'history'], timelineSvg, {
  extra: () => 'shown as a timeline from joining GitHub to the latest pushes',
});

/* ------------------------------------------------------------------------------------------------ */
/* Sunburst                                                                                          */
/* ------------------------------------------------------------------------------------------------ */

/** A ring segment between two radii and two angles (radians, clockwise from straight up). */
export function arcPath(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number): string {
  const sweep = Math.min(a1 - a0, Math.PI * 2 - 0.0001);
  const end = a0 + sweep;
  const p = (r: number, a: number): string => `${num(cx + Math.sin(a) * r)} ${num(cy - Math.cos(a) * r)}`;
  const large = sweep > Math.PI ? 1 : 0;
  return `M${p(r1, a0)}A${r1} ${r1} 0 ${large} 1 ${p(r1, end)}L${p(r0, end)}A${r0} ${r0} 0 ${large} 0 ${p(r0, a0)}Z`;
}

export interface Span {
  name: string;
  from: number;
  to: number;
}

/** Splits the full circle between named shares, in order. Shares that are zero or not numbers get no arc. */
export function splitCircle(shares: ReadonlyArray<{ name: string; share: number }>): Span[] {
  const valid = shares.filter((s) => Number.isFinite(s.share) && s.share > 0);
  const total = valid.reduce((sum, s) => sum + s.share, 0);
  if (total <= 0) return [];
  let at = 0;
  return valid.map((s) => {
    const from = at;
    at += (s.share / total) * Math.PI * 2;
    return { name: s.name, from, to: at };
  });
}

function sunburstSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const bg = dark ? '#0c0d12' : '#f5f4f0';
  const ink = dark ? '#eef0f6' : '#1b1d26';
  const muted = dark ? '#8a8fa2' : '#6a6f80';
  const name = profile.name ?? profile.login;
  const langs = blocks.has('languages') ? profile.languages.slice(0, 6) : [];
  const repos = blocks.has('projects') ? profile.topRepos.slice(0, 8) : [];
  const cx = 300;
  const cy = 260;
  const height = 520;
  const gap = 0.012;

  let body = '';
  const spans = splitCircle(langs.map((l) => ({ name: l.name, share: l.percent })));
  spans.forEach((span, i) => {
    body += `<path class="seg" style="animation-delay:${(i * 0.08).toFixed(2)}s" d="${arcPath(cx, cy, 72, 130, span.from + gap, span.to - gap)}" fill="${langColor(span.name, variant)}"/>`;
    const mid = (span.from + span.to) / 2;
    if (span.to - span.from > 0.28) body += text(truncate(span.name, 10), cx + Math.sin(mid) * 101, cy - Math.cos(mid) * 101 + 4, 11, '#ffffff', 'text-anchor="middle" font-weight="800"');
  });
  // The outer ring: the repositories, each inside the span of its own language.
  let onRing = 0;
  for (const span of spans) {
    const here = repos.filter((r) => r.language === span.name);
    if (here.length === 0) continue;
    const parts = splitCircle(here.map((r) => ({ name: r.name, share: r.stars + 1 })));
    const room = (span.to - span.from) * (Math.min(1, here.length / Math.max(1, profile.topRepos.filter((r) => r.language === span.name).length)));
    parts.forEach((part) => {
      const a0 = span.from + (part.from / (Math.PI * 2)) * room;
      const a1 = span.from + (part.to / (Math.PI * 2)) * room;
      body += `<path class="seg" d="${arcPath(cx, cy, 136, 196, a0 + gap, a1 - gap)}" fill="${langColor(span.name, variant)}" fill-opacity="0.62"/>`;
      onRing += 1;
      const mid = (a0 + a1) / 2;
      if (a1 - a0 > 0.5) body += text(truncate(part.name, 11), cx + Math.sin(mid) * 166, cy - Math.cos(mid) * 166 + 4, 10.5, '#ffffff', 'text-anchor="middle" font-weight="800"');
    });
  }
  body += pictureBox(profile, '#456', '#fff', cx - 48, cy - 48, 96, 96, 48, 'sb');
  if (spans.length === 0) body += text(blocks.has('languages') ? 'No languages to draw.' : 'The languages section is switched off.', 580, 150, 14, muted, 'font-style="italic"');
  body += text(truncate(name, 22), 580, 90, 26, ink, 'font-weight="800"') + text(`@${profile.login}`, 580, 112, 13, muted, 'class="mono"');
  spans.forEach((span, i) => {
    const y = 160 + i * 26;
    body += `<rect x="580" y="${y - 12}" width="14" height="14" rx="3" fill="${langColor(span.name, variant)}"/>` + text(truncate(span.name, 16), 604, y, 14, ink, 'font-weight="700"') + text(`${Math.round(((span.to - span.from) / (Math.PI * 2)) * 100)}%`, 860, y, 13, muted, 'class="mono" text-anchor="end"');
  });
  const listed = repos.filter((r) => spans.some((s) => s.name === r.language));
  listed.slice(0, 4).forEach((repo, i) => {
    body += text(`${truncate(repo.name, 20)}  ★ ${formatNumber(repo.stars)}`, 580, 160 + spans.length * 26 + 30 + i * 20, 12, muted, 'class="mono"');
  });
  const off = repos.length - onRing;
  body += text(`inner ring = share of code · outer ring = repositories of that language, wider for more stars${off > 0 ? ` · ${off} not on a language ring` : ''}`, 36, height - 14, 10.5, muted, 'class="mono"');
  const css = riseCss(motion) + (motion ? `.seg{animation:fade .6s ease-out both}@keyframes fade{from{opacity:0}}@media (prefers-reduced-motion:reduce){.seg{animation:none}}` : '');
  return svgDoc({ height, title: `${name} on GitHub, as a sunburst of languages and repositories`, bg, radius: 14, css, body });
}

export const sunburst: Template = imageTemplate('sunburst', 'Sunburst', 'Two rings: your languages by share, and around them the repositories written in each, wider for more stars.', ['creative', 'languages', 'projects'], sunburstSvg, {
  extra: () => 'shown as a sunburst of languages with repositories around them',
});

/* ------------------------------------------------------------------------------------------------ */
/* Brick mosaic                                                                                      */
/* ------------------------------------------------------------------------------------------------ */

/**
 * The profile picture as a grid of brightness levels from 0 (darkest) to `levels - 1`, `size` bricks across and down.
 * A brick where the picture is mostly see-through is null. Nothing is drawn that the picture does not hold.
 */
export function mosaicLevels(grid: PixelGrid, size: number, levels: number): Array<Array<number | null>> {
  const out: Array<Array<number | null>> = [];
  for (let r = 0; r < size; r++) {
    const row: Array<number | null> = [];
    for (let c = 0; c < size; c++) {
      const x0 = Math.floor((c * grid.width) / size);
      const x1 = Math.max(x0 + 1, Math.floor(((c + 1) * grid.width) / size));
      const y0 = Math.floor((r * grid.height) / size);
      const y1 = Math.max(y0 + 1, Math.floor(((r + 1) * grid.height) / size));
      let luma = 0;
      let alpha = 0;
      let count = 0;
      for (let y = y0; y < y1 && y < grid.height; y++) {
        for (let x = x0; x < x1 && x < grid.width; x++) {
          const i = y * grid.width + x;
          luma += grid.luma[i] ?? 0;
          alpha += grid.alpha[i] ?? 255;
          count += 1;
        }
      }
      if (count === 0 || alpha / count < 128) row.push(null);
      else row.push(Math.max(0, Math.min(levels - 1, Math.floor((luma / count / 256) * levels))));
    }
    out.push(row);
  }
  return out;
}

function mosaicSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const hue = hueFor(profile, 12);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const bg = dark ? '#14151a' : '#e9e7e2';
  const base = dark ? '#1f2128' : '#d5d2ca';
  const ink = dark ? '#f1f2f6' : '#1c1d24';
  const muted = dark ? '#8d92a3' : '#6b6f7e';
  const name = profile.name ?? profile.login;
  const grid = profile.avatar?.grid;
  const size = 28;
  const cell = 15;
  const ox = 46;
  const oy = 46;
  const levels = 6;
  const ramp = Array.from({ length: levels }, (_v, i) => hslToHex(hue, 0.7, (dark ? 0.12 : 0.18) + (i / (levels - 1)) * (dark ? 0.62 : 0.68)));
  const height = Math.max(size * cell + 92, 520);

  let body = `<rect x="${ox - 8}" y="${oy - 8}" width="${size * cell + 16}" height="${size * cell + 16}" rx="6" fill="${base}"/>`;
  const rows = grid ? mosaicLevels(grid, size, levels) : [];
  if (!grid) body += text('Your photo appears here once it has loaded.', ox + 20, oy + 120, 13, muted, 'font-style="italic"');
  rows.forEach((row, r) => {
    row.forEach((level, c) => {
      if (level === null) return;
      const x = ox + c * cell;
      const y = oy + r * cell;
      body += `<rect x="${x}" y="${y}" width="${cell - 1}" height="${cell - 1}" rx="2" fill="${ramp[level]}"/><circle cx="${num(x + (cell - 1) / 2)}" cy="${num(y + (cell - 1) / 2)}" r="${num(cell * 0.28)}" fill="#fff" fill-opacity="${dark ? 0.16 : 0.28}"/>`;
    });
  });
  const tx = ox + size * cell + 50;
  body += text('BUILT FROM', tx, 74, 11, muted, 'letter-spacing="5" font-weight="800"') + text(truncate(name, 20), tx, 114, 30, ink, 'font-weight="800"') + text(`@${profile.login}`, tx, 138, 13, muted, 'class="mono"');
  const bricks: Array<[string, string]> = [];
  if (blocks.has('stats')) bricks.push(['STARS', formatNumber(profile.totalStars)], ['FOLLOWERS', formatNumber(profile.followers)], ['REPOS', formatNumber(profile.publicRepos)]);
  bricks.forEach(([label, value], i) => {
    const x = tx + (i % 2) * 190;
    const y = 180 + Math.floor(i / 2) * 96;
    body += `<g class="brick" style="animation-delay:${(0.2 + i * 0.1).toFixed(2)}s"><rect x="${x}" y="${y}" width="176" height="80" rx="6" fill="${ramp[3 + (i % 3) - 1]}"/>`;
    for (let s = 0; s < 4; s++) body += `<circle cx="${x + 24 + s * 42}" cy="${y + 12}" r="6" fill="#ffffff" fill-opacity="0.28"/>`;
    body += text(value, x + 16, y + 56, 28, '#ffffff', 'font-weight="800"') + text(label, x + 162, y + 70, 10, '#ffffff', 'text-anchor="end" letter-spacing="2" font-weight="800" fill-opacity="0.85"') + `</g>`;
  });
  if (profile.languages.length > 0 && blocks.has('languages')) body += text(profile.languages.slice(0, 4).map((l) => `${l.name} ${Math.round(l.percent)}%`).join('  ·  '), tx, 180 + Math.ceil(bricks.length / 2) * 96 + 20, 12, muted, 'class="mono"');
  body += text(`${size} × ${size} bricks · each brick is the brightness of that part of your photo, in your photo's colour`, 36, height - 16, 10.5, muted, 'class="mono"');
  const css = riseCss(motion) + (motion ? `.brick{animation:snap .5s ease-out both}@keyframes snap{from{opacity:0;transform:translateY(-12px)}}@media (prefers-reduced-motion:reduce){.brick{animation:none}}` : '');
  return svgDoc({ height, title: `${name} on GitHub, as a brick mosaic of their photo`, bg, radius: 14, css, body });
}

export const mosaic: Template = imageTemplate('mosaic', 'Brick mosaic', 'Your own profile photo rebuilt from bricks, with your numbers as bricks beside it.', ['creative', 'art', 'fun'], mosaicSvg, {
  extra: () => 'shown as a brick mosaic built from the profile photo',
});

export const chartTemplates: Template[] = [sonar, cloud, timeline, sunburst, mosaic];
