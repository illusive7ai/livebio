import { hslToHex, hueOf } from '../color';
import type { Variant } from '../themes';
import type { Config, ContributionDay, LanguageShare, Profile, RepoSummary, Template } from '../types';
import { formatNumber, timeAgo, truncate, wrap, xmlEscape } from '../util';
import { num, riseCss } from './kit';
import { imageTemplate, isoDate, langColor, svgDoc } from './make';
import { photo } from './photo';
import { rise, seeded } from './shared';

/** Five designs made of objects: a lava lamp, a snow globe, a tarot spread, a stamp sheet and a cube. */

const hueFor = (profile: Profile, fallback: number): number => hueOf(profile.avatar?.grid.tint) ?? fallback;

const text = (value: string, x: number, y: number, size: number, fill: string, extra = ''): string =>
  `<text x="${num(x)}" y="${num(y)}" font-size="${size}" fill="${fill}" ${extra}>${xmlEscape(value)}</text>`;

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/** The activity a design may draw: none when the section is off or the calendar is missing or empty. */
function daysOf(profile: Profile, config: Config): ContributionDay[] {
  return config.blocks.includes('activity') && profile.contributions ? profile.contributions.days : [];
}

const waiting = (blocks: ReadonlySet<string>): string => (blocks.has('activity') ? 'This appears after the first automatic update, once the contribution calendar is available.' : 'The activity section is switched off.');

/* ------------------------------------------------------------------------------------------------ */
/* Lava lamp                                                                                         */
/* ------------------------------------------------------------------------------------------------ */

/** Blob radii for the languages: the area of a blob follows its share, the biggest being `maxR`, none smaller than `minR`. */
export function blobRadii(languages: ReadonlyArray<LanguageShare>, maxR: number, minR: number): number[] {
  const top = Math.max(0, ...languages.map((l) => l.percent));
  if (top <= 0) return languages.map(() => minR);
  return languages.map((l) => Math.max(minR, Math.round(Math.sqrt(Math.max(0, l.percent) / top) * maxR * 10) / 10));
}

function lavaSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const hue = hueFor(profile, 330);
  const room = dark ? '#0e0a14' : '#efe7f4';
  const ink = dark ? '#f1eaf8' : '#2a1d3a';
  const muted = dark ? '#a392b8' : '#6a5a82';
  const metal = dark ? '#3c3646' : '#8d84a0';
  const name = profile.name ?? profile.login;
  const languages = blocks.has('languages') ? profile.languages.slice(0, 6) : [];
  const radii = blobRadii(languages, 46, 16);
  const height = 540;
  const cx = 210;
  const glass = `M${cx - 56} 96L${cx + 56} 96C${cx + 80} 190 ${cx + 112} 380 ${cx + 104} 430L${cx - 104} 430C${cx - 112} 380 ${cx - 80} 190 ${cx - 56} 96Z`;
  const halfAt = (y: number): number => 56 + ((y - 96) / (430 - 96)) * 48;
  const defs =
    `<radialGradient id="lava-glow" cx="0.5" cy="0.55" r="0.6"><stop offset="0" stop-color="${hslToHex(hue, 0.85, dark ? 0.4 : 0.7)}" stop-opacity="${dark ? 0.55 : 0.5}"/><stop offset="1" stop-color="${room}" stop-opacity="0"/></radialGradient>` +
    `<linearGradient id="lava-liquid" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${hslToHex((hue + 20) % 360, 0.8, dark ? 0.2 : 0.55)}"/><stop offset="1" stop-color="${hslToHex(hue, 0.9, dark ? 0.12 : 0.4)}"/></linearGradient>` +
    `<clipPath id="lava-clip"><path d="${glass}"/></clipPath>` +
    `<filter id="goo" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur in="SourceGraphic" stdDeviation="7" result="b"/><feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9"/></filter>`;
  let body = `<rect width="900" height="${height}" fill="${room}"/><ellipse cx="${cx}" cy="270" rx="260" ry="290" fill="url(#lava-glow)"/>`;
  // The metal cap and the base.
  body += `<path d="M${cx - 50} 96L${cx - 28} 56H${cx + 28}L${cx + 50} 96Z" fill="${metal}"/><circle cx="${cx}" cy="50" r="9" fill="${metal}"/>`;
  body += `<path d="M${cx - 112} 430H${cx + 112}L${cx + 150} 500H${cx - 150}Z" fill="${metal}"/><rect x="${cx - 156}" y="498" width="312" height="14" rx="5" fill="${dark ? '#27222f' : '#6f6682'}"/>`;
  body += `<path d="${glass}" fill="url(#lava-liquid)"/>`;
  const random = seeded(`lava:${profile.login}`);
  let blobs = '';
  languages.forEach((l, i) => {
    const r = radii[i]!;
    const y = 150 + random() * 240;
    const room2 = Math.max(8, halfAt(y) - r * 0.8);
    const x = cx + (random() * 2 - 1) * room2;
    const travel = -(60 + Math.floor(random() * 120));
    const dur = 7 + Math.floor(random() * 7);
    const delay = -Math.floor(random() * dur);
    const motionStyle = motion ? ` class="lv" style="--t:${travel}px;animation-duration:${dur}s;animation-delay:${delay}s"` : '';
    blobs += `<circle cx="${num(x)}" cy="${num(y)}" r="${num(r)}" fill="${langColor(l.name, variant)}"${motionStyle}/>`;
  });
  const wax = languages[0] ? langColor(languages[0].name, variant) : hslToHex(hue, 0.8, 0.5);
  body += `<g clip-path="url(#lava-clip)"><g filter="url(#goo)"><rect x="${cx - 120}" y="404" width="240" height="40" fill="${wax}"/>${blobs}</g></g>`;
  body += `<path d="${glass}" fill="none" stroke="#fff" stroke-opacity="0.35" stroke-width="2"/><path d="M${cx - 40} 120C${cx - 56} 220 ${cx - 78} 330 ${cx - 82} 410" fill="none" stroke="#fff" stroke-opacity="0.28" stroke-width="7" stroke-linecap="round"/>`;
  const rx = 470;
  body += text('LAVA LAMP', rx, 96, 12, muted, 'class="mono" letter-spacing="5" font-weight="700"');
  body += text(truncate(name, 20), rx, 142, 38, ink, 'font-weight="800"') + text(`@${profile.login}`, rx, 170, 14, muted, 'class="mono"');
  languages.forEach((l, i) => {
    const y = 228 + i * 36;
    body += `<circle cx="${rx + 10}" cy="${y - 5}" r="9" fill="${langColor(l.name, variant)}"/>` + text(truncate(l.name, 18), rx + 30, y, 16, ink, 'font-weight="700"') + text(`${l.percent}%`, rx + 270, y, 14, muted, 'class="mono" text-anchor="end"');
  });
  if (blocks.has('stats')) body += text(`${formatNumber(profile.totalStars)} stars  ·  ${formatNumber(profile.followers)} followers  ·  ${formatNumber(profile.publicRepos)} repositories`, rx, 228 + Math.max(languages.length, 1) * 36 + 34, 13, ink, 'class="mono"');
  wrap(languages.length > 0 ? 'Each blob of wax is a language. The bigger the blob, the bigger its share of your repositories.' : 'Switch on Languages to put wax in the lamp.', 52, 3).forEach((l, i) => (body += text(l, rx, height - 56 + i * 16, 11.5, muted, 'class="mono"')));
  const css = riseCss(motion) + (motion ? `.lv{animation:lv 10s ease-in-out infinite alternate}@keyframes lv{from{transform:translateY(0)}to{transform:translateY(var(--t))}}@media (prefers-reduced-motion:reduce){.lv{animation:none}}` : '');
  return svgDoc({ height, title: `${name} on GitHub, as a lava lamp with a blob of wax for each language`, bg: room, radius: 14, defs, css, body });
}

export const lava: Template = imageTemplate('lava', 'Lava lamp', 'A glowing lava lamp: each blob of wax is one of your languages, the bigger the blob the bigger its share.', ['creative', 'object', 'languages'], lavaSvg, {
  extra: () => 'shown as a lava lamp',
});

/* ------------------------------------------------------------------------------------------------ */
/* Snow globe                                                                                        */
/* ------------------------------------------------------------------------------------------------ */

export interface Flake {
  x: number;
  y: number;
  r: number;
  /** Seconds the flake takes to drift down, and how far into its fall it starts. */
  duration: number;
  delay: number;
}

/**
 * One flake for every day with any activity, inside a circle of radius `R` around (cx, cy). Busier days make bigger flakes.
 * Where a flake sits comes from its date, so it is always in the same place.
 */
export function flakes(days: ReadonlyArray<ContributionDay>, cx: number, cy: number, R: number): Flake[] {
  return days
    .filter((d) => d.count > 0)
    .map((d) => {
      const random = seeded(`flake:${d.date}`);
      const angle = random() * Math.PI * 2;
      const dist = Math.sqrt(random()) * (R - 10);
      const duration = 9 + Math.floor(random() * 8);
      return { x: Math.round((cx + Math.cos(angle) * dist) * 10) / 10, y: Math.round((cy + Math.sin(angle) * dist) * 10) / 10, r: 1.8 + d.level * 0.9, duration, delay: -Math.floor(random() * duration) };
    });
}

function globeSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const hue = hueFor(profile, 210);
  const room = dark ? '#0b1020' : '#e6edf8';
  const ink = dark ? '#eaf1ff' : '#14213d';
  const muted = dark ? '#8da0c8' : '#53648c';
  const wood = dark ? '#4a3524' : '#8a5a34';
  const name = profile.name ?? profile.login;
  const days = daysOf(profile, config);
  const list = flakes(days, 300, 230, 184);
  const height = 540;
  const cx = 300;
  const cy = 230;
  const R = 190;
  const defs =
    `<radialGradient id="gl-water" cx="0.4" cy="0.35" r="0.8"><stop offset="0" stop-color="${hslToHex(hue, 0.7, dark ? 0.34 : 0.8)}"/><stop offset="1" stop-color="${hslToHex((hue + 30) % 360, 0.8, dark ? 0.12 : 0.55)}"/></radialGradient>` +
    `<clipPath id="gl-clip"><circle cx="${cx}" cy="${cy}" r="${R}"/></clipPath>`;
  let body = `<rect width="900" height="${height}" fill="${room}"/>`;
  body += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#gl-water)"/><g clip-path="url(#gl-clip)">`;
  body += `<ellipse cx="${cx}" cy="${cy + R - 20}" rx="${R}" ry="46" fill="#fff" fill-opacity="${dark ? 0.85 : 0.95}"/>`;
  body += photo(profile, cx - 70, cy - 76, 140, 140, 'gl-p', { rx: 70, tile: { fill: wood, ink: room } }) + `<circle cx="${cx}" cy="${cy - 6}" r="72" fill="none" stroke="#fff" stroke-opacity="0.8" stroke-width="3"/>`;
  const snow = list.map((f) => `<circle cx="${f.x}" cy="${f.y}" r="${f.r}" fill="#fff" fill-opacity="0.92"${motion ? ` class="fl" style="animation-duration:${f.duration}s;animation-delay:${f.delay}s"` : ''}/>`).join('');
  body += snow + `</g>`;
  body += `<ellipse cx="${cx - 70}" cy="${cy - 90}" rx="60" ry="100" fill="#fff" fill-opacity="${dark ? 0.1 : 0.22}" transform="rotate(30 ${cx - 70} ${cy - 90})"/><circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#fff" stroke-opacity="0.5" stroke-width="3"/>`;
  body += `<path d="M${cx - 120} ${cy + R - 6}H${cx + 120}L${cx + 170} ${cy + R + 90}H${cx - 170}Z" fill="${wood}"/><rect x="${cx - 120}" y="${cy + R + 36}" width="240" height="38" rx="4" fill="#d9b66a"/>`;
  body += text(truncate(`@${profile.login}`, 24), cx, cy + R + 60, 15, '#3a2a10', 'class="mono" text-anchor="middle" font-weight="800"');
  const rx = 560;
  body += text('SNOW GLOBE', rx, 120, 12, muted, 'class="mono" letter-spacing="5" font-weight="700"') + text(truncate(name, 18), rx, 166, 36, ink, 'font-weight="800"') + text(`@${profile.login}`, rx, 194, 14, muted, 'class="mono"');
  if (days.length > 0) {
    body += text(formatNumber(list.length), rx, 270, 52, '#ffffff', `font-weight="800" stroke="${room}" stroke-width="0"`).replace('fill="#ffffff"', `fill="${dark ? '#ffffff' : '#27406e'}"`);
    body += text(list.length === 1 ? 'snowflake, one for the day you were active' : 'snowflakes, one for every day you were active', rx, 298, 14, ink, '');
    if (blocks.has('stats') && profile.contributions) body += text(`${formatNumber(profile.contributions.total)} contributions in all. A busier day is a bigger flake.`, rx, 330, 12.5, muted, '');
  } else body += wrap(waiting(blocks), 34, 3).map((l, i) => text(l, rx, 262 + i * 22, 14, muted, 'font-style="italic"')).join('');
  const css = riseCss(motion) + (motion ? `.fl{animation:fall 12s linear infinite}@keyframes fall{from{transform:translateY(-30px)}to{transform:translateY(${R}px)}}@media (prefers-reduced-motion:reduce){.fl{animation:none}}` : '');
  return svgDoc({ height, title: `${name} on GitHub, as a snow globe with a snowflake for each active day`, bg: room, radius: 14, defs, css, body });
}

export const globe: Template = imageTemplate('globe', 'Snow globe', 'A snow globe with your picture inside and one snowflake for every day you were active.', ['creative', 'object', 'activity'], globeSvg, {
  activity: true,
  extra: () => 'shown as a snow globe with one snowflake for each active day',
});

/* ------------------------------------------------------------------------------------------------ */
/* Tarot spread                                                                                      */
/* ------------------------------------------------------------------------------------------------ */

export interface TarotCard {
  numeral: string;
  title: string;
  repo: RepoSummary;
  /** The real fact that earned the card, written plainly. */
  reason: string;
}

const pushed = (r: RepoSummary): number => Date.parse(r.pushedAt ?? '');

/**
 * Up to four cards, each one earned by a real fact: the Star is the most starred repository, the Sun the one pushed to
 * most recently, the Tower the most forked, the Hermit the one left quiet longest. A card is left out when no repository earns it.
 */
export function drawCards(repos: ReadonlyArray<RepoSummary>, nowIso: string | undefined): TarotCard[] {
  const cards: TarotCard[] = [];
  const starred = [...repos].sort((a, b) => b.stars - a.stars)[0];
  if (starred && starred.stars > 0) cards.push({ numeral: 'XVII', title: 'THE STAR', repo: starred, reason: `Most starred: ★ ${formatNumber(starred.stars)}` });
  const dated = repos.filter((r) => Number.isFinite(pushed(r)));
  const newest = [...dated].sort((a, b) => pushed(b) - pushed(a))[0];
  if (newest) {
    const ago = timeAgo(newest.pushedAt ?? '', nowIso ?? '');
    cards.push({ numeral: 'XIX', title: 'THE SUN', repo: newest, reason: ago ? `Pushed to most recently: ${ago}` : 'Pushed to most recently' });
  }
  const forked = [...repos].sort((a, b) => b.forks - a.forks)[0];
  if (forked && forked.forks > 0) cards.push({ numeral: 'XVI', title: 'THE TOWER', repo: forked, reason: `Most forked: ${formatNumber(forked.forks)} ${forked.forks === 1 ? 'fork' : 'forks'}` });
  const oldest = [...dated].sort((a, b) => pushed(a) - pushed(b))[0];
  if (oldest && newest && oldest !== newest) {
    const ago = timeAgo(oldest.pushedAt ?? '', nowIso ?? '');
    cards.push({ numeral: 'IX', title: 'THE HERMIT', repo: oldest, reason: ago ? `Quiet the longest: last pushed ${ago}` : 'Quiet the longest' });
  }
  return cards;
}

function tarotIcon(title: string, cx: number, cy: number, color: string, ink: string): string {
  if (title === 'THE STAR') {
    const pts = Array.from({ length: 16 }, (_v, i) => {
      const a = (i / 16) * Math.PI * 2 - Math.PI / 2;
      const r = i % 2 === 0 ? 46 : 18;
      return `${num(cx + Math.cos(a) * r)} ${num(cy + Math.sin(a) * r)}`;
    });
    return `<path d="M${pts.join('L')}Z" fill="${color}"/>`;
  }
  if (title === 'THE SUN') {
    let rays = '';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      rays += `<path d="M${num(cx + Math.cos(a) * 34)} ${num(cy + Math.sin(a) * 34)}L${num(cx + Math.cos(a) * 52)} ${num(cy + Math.sin(a) * 52)}" stroke="${color}" stroke-width="5" stroke-linecap="round"/>`;
    }
    return rays + `<circle cx="${cx}" cy="${cy}" r="26" fill="${color}"/><circle cx="${cx}" cy="${cy}" r="14" fill="none" stroke="${ink}" stroke-width="2"/>`;
  }
  if (title === 'THE TOWER') {
    return `<path d="M${cx - 22} ${cy + 50}V${cy - 26}h-8v-16h10v8h10v-8h10v8h10v-8h10v16h-8V${cy + 50}Z" fill="${color}"/><path d="M${cx + 6} ${cy - 56}L${cx - 8} ${cy - 10}h14L${cx - 4} ${cy + 30}" fill="none" stroke="${ink}" stroke-width="4" stroke-linejoin="round"/>`;
  }
  return `<path d="M${cx + 18} ${cy - 50}V${cy + 52}" stroke="${color}" stroke-width="5" stroke-linecap="round"/><circle cx="${cx - 8}" cy="${cy - 10}" r="22" fill="${color}" fill-opacity="0.3"/><path d="M${cx - 22} ${cy - 24}h28v34a14 14 0 0 1-28 0Z" fill="${color}"/><path d="M${cx - 8} ${cy - 24}v-12" stroke="${color}" stroke-width="4"/>`;
}

function tarotSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const hue = hueFor(profile, 280);
  const table = dark ? '#150f22' : '#2b1d45';
  const cardFill = dark ? '#1f1633' : '#f4ecd8';
  const gold = dark ? '#e9c46a' : '#a8741a';
  const ink = dark ? '#efe6ff' : '#2a1a40';
  const accent = hslToHex(hue, 0.6, dark ? 0.68 : 0.4);
  const name = profile.name ?? profile.login;
  const cards = blocks.has('projects') ? drawCards(profile.topRepos, profile.fetchedAt) : [];
  const height = 520;
  let body = `<rect width="900" height="${height}" fill="${table}"/>`;
  body += text(`A READING FOR ${truncate(name, 24).toUpperCase()}`, 450, 46, 15, '#e9c46a', 'class="serif" text-anchor="middle" letter-spacing="6" font-weight="700"');
  if (cards.length === 0) {
    body += text(blocks.has('projects') ? 'No project has earned a card yet.' : 'Switch on Top projects to draw cards.', 450, 200, 16, '#e9c46a', 'text-anchor="middle" font-style="italic"');
    return svgDoc({ height: 280, title: `${name} on GitHub, as a tarot spread`, bg: table, radius: 14, css: riseCss(motion), body: body.replace(`height="${height}"`, 'height="280"') });
  }
  const cw = 190;
  const ch = 400;
  const gap = 24;
  const x0 = (900 - (cards.length * cw + (cards.length - 1) * gap)) / 2;
  cards.forEach((card, i) => {
    const x = x0 + i * (cw + gap);
    const y = 76;
    const cx = x + cw / 2;
    let piece = `<rect x="${x + 4}" y="${y + 6}" width="${cw}" height="${ch}" rx="12" fill="#000" fill-opacity="0.4"/><rect x="${x}" y="${y}" width="${cw}" height="${ch}" rx="12" fill="${cardFill}" stroke="${gold}" stroke-width="3"/><rect x="${x + 10}" y="${y + 10}" width="${cw - 20}" height="${ch - 20}" rx="7" fill="none" stroke="${gold}" stroke-opacity="0.7"/>`;
    piece += text(card.numeral, cx, y + 44, 17, gold, 'class="serif" text-anchor="middle" font-weight="700" letter-spacing="3"');
    piece += `<circle cx="${cx}" cy="${y + 140}" r="66" fill="${accent}" fill-opacity="0.18" stroke="${gold}" stroke-opacity="0.6"/>` + tarotIcon(card.title, cx, y + 140, accent, cardFill);
    piece += text(card.title, cx, y + 252, 17, ink, 'class="serif" text-anchor="middle" font-weight="800" letter-spacing="3"');
    piece += `<path d="M${cx - 40} ${y + 264}h80" stroke="${gold}"/>`;
    piece += text(truncate(card.repo.name, 20), cx, y + 292, 15, ink, 'text-anchor="middle" font-weight="700"');
    wrap(card.reason, 24, 3).forEach((l, j) => (piece += text(l, cx, y + 316 + j * 17, 12, ink, 'text-anchor="middle" fill-opacity="0.85"')));
    body += rise(piece, motion, 0.15 * i);
  });
  body += text('Each card is earned by a real fact about your top projects. None of this is a prediction.', 450, height - 20, 11.5, '#c9b88a', 'class="mono" text-anchor="middle"');
  return svgDoc({ height, title: `${name} on GitHub, as a tarot spread drawn from top projects`, bg: table, radius: 14, css: riseCss(motion), body });
}

export const tarot: Template = imageTemplate('tarot', 'Tarot spread', 'Up to four tarot cards, each earned by a real fact about your projects: the most starred, the freshest, the most forked and the quietest.', ['creative', 'cards', 'projects'], tarotSvg, {
  extra: () => 'shown as a tarot spread',
});

/* ------------------------------------------------------------------------------------------------ */
/* Stamp sheet                                                                                       */
/* ------------------------------------------------------------------------------------------------ */

/** Centres of the perforation holes along the four edges of a stamp, one every `pitch` points, with none doubled in a corner. */
export function perforations(x: number, y: number, w: number, h: number, pitch = 11): Array<[number, number]> {
  const across = Math.max(1, Math.round(w / pitch));
  const down = Math.max(1, Math.round(h / pitch));
  const out: Array<[number, number]> = [];
  for (let i = 0; i <= across; i++) out.push([x + (w * i) / across, y], [x + (w * i) / across, y + h]);
  for (let j = 1; j < down; j++) out.push([x, y + (h * j) / down], [x + w, y + (h * j) / down]);
  return out;
}

function stampsSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const sheet = dark ? '#d9ceb2' : '#f1e8cf';
  const back = dark ? '#171310' : '#c9bb98';
  const ink = '#2b2014';
  const name = profile.name ?? profile.login;
  const langs = blocks.has('languages') ? profile.languages.slice(0, 6) : [];
  const since = isoDate(profile.createdAt)?.slice(0, 4);
  const sent = isoDate(profile.fetchedAt);
  const height = 470;
  const sw = 150;
  const sh = 190;
  const gap = 26;
  const items: Array<{ kind: 'portrait' } | { kind: 'language'; lang: LanguageShare }> = [{ kind: 'portrait' }, ...langs.map((lang) => ({ kind: 'language' as const, lang }))];
  const perRow = 4;
  const rows = Math.ceil(items.length / perRow);
  const fullHeight = 80 + rows * (sh + gap) + 40;
  let body = `<rect width="900" height="${Math.max(height, fullHeight)}" fill="${back}"/><rect x="26" y="20" width="848" height="${Math.max(height, fullHeight) - 40}" rx="6" fill="${sheet}"/>`;
  body += text('GITHUB POST', 50, 56, 14, ink, 'class="mono" letter-spacing="6" font-weight="800"') + text(`${truncate(name, 26).toUpperCase()}  ·  ${since ? `ISSUED SINCE ${since}` : 'DEFINITIVE ISSUE'}`, 850, 56, 11, ink, 'class="mono" text-anchor="end" letter-spacing="2"');
  items.forEach((item, i) => {
    const col = i % perRow;
    const row = Math.floor(i / perRow);
    const inRow = Math.min(perRow, items.length - row * perRow);
    const x0 = (900 - (inRow * sw + (inRow - 1) * gap)) / 2;
    const x = x0 + col * (sw + gap);
    const y = 78 + row * (sh + gap);
    let stamp = `<rect x="${x}" y="${y}" width="${sw}" height="${sh}" fill="#fffdf6"/>`;
    if (item.kind === 'portrait') {
      stamp += photo(profile, x + 12, y + 12, sw - 24, sh - 66, `st${i}`, { tile: { fill: '#8a6a3a', ink: '#fffdf6' } });
      stamp += text('DEFINITIVE', x + sw / 2, y + sh - 30, 10, ink, 'class="mono" text-anchor="middle" letter-spacing="3"') + text(`@${truncate(profile.login, 14)}`, x + sw / 2, y + sh - 14, 12, ink, 'class="mono" text-anchor="middle" font-weight="800"');
    } else {
      const color = langColor(item.lang.name, 'light');
      stamp += `<rect x="${x + 12}" y="${y + 12}" width="${sw - 24}" height="${sh - 66}" fill="${color}"/><circle cx="${x + sw / 2}" cy="${y + 12 + (sh - 66) / 2}" r="38" fill="#fffdf6" fill-opacity="0.9"/>` + text(item.lang.name.slice(0, 2).toUpperCase(), x + sw / 2, y + 12 + (sh - 66) / 2 + 12, 34, color, 'class="serif" text-anchor="middle" font-weight="800"');
      stamp += text(truncate(item.lang.name, 14), x + sw / 2, y + sh - 28, 12, ink, 'text-anchor="middle" font-weight="700"') + text(`${item.lang.percent}%`, x + sw / 2, y + sh - 12, 16, ink, 'class="serif" text-anchor="middle" font-weight="800"');
    }
    stamp += perforations(x, y, sw, sh).map(([px, py]) => `<circle cx="${num(px)}" cy="${num(py)}" r="3.2" fill="${sheet}"/>`).join('');
    body += rise(stamp, motion, 0.07 * i);
  });
  // A postmark over the corner of the first stamps, with wavy cancelling lines.
  const mx = 120;
  const my = 90;
  const pm = '#5a2230';
  body += `<g opacity="0.78"><circle cx="${mx + 70}" cy="${my + 60}" r="46" fill="none" stroke="${pm}" stroke-width="2.5"/><circle cx="${mx + 70}" cy="${my + 60}" r="38" fill="none" stroke="${pm}" stroke-width="1.2"/>`;
  body += text('ONLINE', mx + 70, my + 46, 9.5, pm, 'class="mono" text-anchor="middle" letter-spacing="3" font-weight="800"') + text(sent ? `${Number(sent.slice(8, 10))} ${MONTHS[Number(sent.slice(5, 7)) - 1]}` : 'GITHUB', mx + 70, my + 66, 14, pm, 'class="mono" text-anchor="middle" font-weight="800"') + text(sent ? sent.slice(0, 4) : 'POST', mx + 70, my + 82, 11, pm, 'class="mono" text-anchor="middle" font-weight="700"');
  for (let k = 0; k < 4; k++) body += `<path d="M${mx + 120} ${my + 32 + k * 12}q15 -8 30 0t30 0t30 0t30 0" fill="none" stroke="${pm}" stroke-width="1.6"/>`;
  body += `</g>`;
  body += text(langs.length > 0 ? 'Each stamp is a language, and its value is that language’s share of your repositories.' : 'Switch on Languages to print more stamps.', 450, Math.max(height, fullHeight) - 34, 11, ink, 'class="mono" text-anchor="middle"');
  return svgDoc({ height: Math.max(height, fullHeight), title: `${name} on GitHub, as a sheet of postage stamps`, bg: back, radius: 14, css: riseCss(motion), body });
}

export const stamps: Template = imageTemplate('stamps', 'Stamp sheet', 'A sheet of perforated postage stamps: your portrait as the definitive issue and one stamp for each language, valued by its share.', ['creative', 'paper', 'languages'], stampsSvg, {
  extra: () => 'shown as a sheet of postage stamps',
});

/* ------------------------------------------------------------------------------------------------ */
/* Cube                                                                                              */
/* ------------------------------------------------------------------------------------------------ */

/**
 * Shares `total` stickers out in proportion to `shares`, by the largest remainder method: everyone gets the whole part of their
 * due, and the stickers left over go to the biggest fractions. The counts always add up to `total`.
 */
export function allocate(shares: ReadonlyArray<number>, total: number): number[] {
  const sum = shares.reduce((s, v) => s + Math.max(0, v), 0);
  if (shares.length === 0 || sum <= 0 || total <= 0) return shares.map(() => 0);
  const exact = shares.map((v) => (Math.max(0, v) / sum) * total);
  const counts = exact.map(Math.floor);
  let left = total - counts.reduce((s, v) => s + v, 0);
  const order = exact.map((e, i) => ({ i, frac: e - Math.floor(e) })).sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (const { i } of order) {
    if (left <= 0) break;
    counts[i]!++;
    left--;
  }
  return counts;
}

function cubeSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const room = dark ? '#10131b' : '#e9edf5';
  const ink = dark ? '#eaf0fb' : '#17203a';
  const muted = dark ? '#8d9ab8' : '#53618a';
  const name = profile.name ?? profile.login;
  const langs = blocks.has('languages') ? profile.languages.slice(0, 6) : [];
  const counts = allocate(langs.map((l) => l.percent), 27);
  const colors = langs.map((l) => langColor(l.name, variant));
  const stickers: string[] = [];
  langs.forEach((_l, i) => stickers.push(...Array.from({ length: counts[i]! }, () => colors[i]!)));
  const random = seeded(`cube:${profile.login}`);
  for (let i = stickers.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [stickers[i], stickers[j]] = [stickers[j]!, stickers[i]!];
  }
  const height = 520;
  const cell = 52;
  const ox = 290;
  const oy = 250;
  const cos = Math.cos(Math.PI / 6) * cell;
  const sin = Math.sin(Math.PI / 6) * cell;
  // Three faces seen from a corner. u and v run along each face in cells, from 0 to 3.
  // The three faces meet at the near corner (ox, oy). On the top face u runs up and to the right, v up and to the left. On the
  // side faces u runs away from the corner along the top edge and v runs down.
  const top = (u: number, v: number): [number, number] => [ox + (u - v) * cos, oy - (u + v) * sin];
  const left = (u: number, v: number): [number, number] => [ox - u * cos, oy - u * sin + v * cell];
  const right = (u: number, v: number): [number, number] => [ox + u * cos, oy - u * sin + v * cell];
  const pt = (p: [number, number]) => `${num(p[0])} ${num(p[1])}`;
  const quad = (a: [number, number], b: [number, number], c: [number, number], d: [number, number], fill: string): string => `<path d="M${pt(a)}L${pt(b)}L${pt(c)}L${pt(d)}Z" fill="${fill}" stroke="#0b0d12" stroke-width="3" stroke-linejoin="round"/>`;
  let body = `<rect width="900" height="${height}" fill="${room}"/>`;
  body += `<ellipse cx="${ox}" cy="${oy + 3 * cell + 26}" rx="170" ry="30" fill="#000" fill-opacity="${dark ? 0.5 : 0.18}"/>`;
  let cube = '';
  const blank = dark ? '#2a3040' : '#c4ccdc';
  let k = 0;
  const next = () => stickers[k++] ?? blank;
  // Top face, then the left face, then the right face, nine stickers each.
  for (let v = 0; v < 3; v++) for (let u = 0; u < 3; u++) cube += quad(top(u, v), top(u + 1, v), top(u + 1, v + 1), top(u, v + 1), next());
  for (let v = 0; v < 3; v++) for (let u = 0; u < 3; u++) cube += quad(left(u, v), left(u + 1, v), left(u + 1, v + 1), left(u, v + 1), next());
  for (let v = 0; v < 3; v++) for (let u = 0; u < 3; u++) cube += quad(right(u, v), right(u + 1, v), right(u + 1, v + 1), right(u, v + 1), next());
  body += `<g${motion ? ' class="float"' : ''}>${cube}</g>`;
  const rx = 520;
  body += text('CUBE', rx, 96, 12, muted, 'class="mono" letter-spacing="5" font-weight="700"') + text(truncate(name, 20), rx, 142, 36, ink, 'font-weight="800"') + text(`@${profile.login}`, rx, 168, 14, muted, 'class="mono"');
  langs.forEach((l, i) => {
    const y = 224 + i * 34;
    body += `<rect x="${rx}" y="${y - 15}" width="20" height="20" rx="4" fill="${colors[i]}"/>` + text(truncate(l.name, 16), rx + 32, y, 16, ink, 'font-weight="700"') + text(`${counts[i]} of 27 stickers`, rx + 300, y, 12.5, muted, 'class="mono" text-anchor="end"');
  });
  if (blocks.has('stats')) body += text(`${formatNumber(profile.publicRepos)} repositories  ·  ${formatNumber(profile.totalStars)} stars`, rx, 224 + Math.max(langs.length, 1) * 34 + 30, 13, ink, 'class="mono"');
  wrap(langs.length > 0 ? 'The 27 stickers you can see are shared out by language, then shuffled.' : 'Switch on Languages to colour the cube.', 48, 3).forEach((l, i) => (body += text(l, rx, height - 56 + i * 16, 11.5, muted, 'class="mono"')));
  const css = riseCss(motion) + (motion ? `.float{animation:float 5s ease-in-out infinite alternate}@keyframes float{from{transform:translateY(0)}to{transform:translateY(-8px)}}@media (prefers-reduced-motion:reduce){.float{animation:none}}` : '');
  return svgDoc({ height, title: `${name} on GitHub, as a puzzle cube coloured by language`, bg: room, radius: 14, css, body });
}

export const cube: Template = imageTemplate('cube', 'Cube', 'A twisty puzzle cube whose 27 visible stickers are shared out by your languages, then shuffled.', ['creative', 'object', 'languages'], cubeSvg, {
  extra: () => 'shown as a puzzle cube',
});

export const objectTemplates: Template[] = [lava, globe, tarot, stamps, cube];
