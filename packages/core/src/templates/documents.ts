import { hslToHex, hueOf } from '../color';
import type { Variant } from '../themes';
import type { Config, Profile, Template } from '../types';
import { formatNumber, truncate, wrap, xmlEscape } from '../util';
import { W, num, riseCss } from './kit';
import { hashOf, imageTemplate, isoDate, langColor, pictureBox, svgDoc, yearsBetween } from './make';
import { plural, rise } from './shared';

/** Four designs that are a document: a passport, a till receipt, a character sheet and a wall calendar. */

const hueFor = (profile: Profile, fallback: number): number => hueOf(profile.avatar?.grid.tint) ?? fallback;

/** A text element. `extra` is any further attributes. */
const text = (value: string, x: number, y: number, size: number, fill: string, extra = ''): string =>
  `<text x="${num(x)}" y="${num(y)}" font-size="${size}" fill="${fill}" ${extra}>${xmlEscape(value)}</text>`;

/* ------------------------------------------------------------------------------------------------ */
/* Passport                                                                                          */
/* ------------------------------------------------------------------------------------------------ */

/** A line of the machine readable strip: capitals, digits and filler, padded to a fixed length. */
export function mrzLine(value: string, length = 44): string {
  const clean = value.toUpperCase().replace(/[^A-Z0-9]+/g, '<');
  return clean.slice(0, length).padEnd(length, '<');
}

function passportSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const hue = hueFor(profile, 215);
  const blocks = new Set(config.blocks);
  const motion = config.motion;
  const desk = dark ? hslToHex(hue, 0.25, 0.08) : hslToHex(hue, 0.2, 0.86);
  const page = dark ? hslToHex(40, 0.16, 0.15) : '#f6efdc';
  const ink = dark ? '#ece2c8' : '#2a2418';
  const muted = dark ? '#a39a82' : '#7a6f55';
  const rule = dark ? '#3b3526' : '#d8ccab';
  const seal = hslToHex(hue, 0.55, dark ? 0.62 : 0.34);
  const name = profile.name ?? profile.login;
  const issued = isoDate(profile.createdAt);

  let body = `<rect x="22" y="22" width="856" height="396" rx="12" fill="${page}" stroke="${rule}"/>`;
  body += `<path d="M450 22V418" stroke="${rule}" stroke-width="2"/><path d="M446 22V418" stroke="${ink}" stroke-opacity="0.07" stroke-width="8"/>`;

  // Left page: the holder.
  body += text('GITHUB PASSPORT', 56, 62, 11, seal, 'letter-spacing="3" font-weight="800"');
  body += text('PASSEPORT · PASAPORTE · PASS', 56, 78, 8.5, muted, 'letter-spacing="1.6"');
  body += pictureBox(profile, seal, page, 56, 102, 150, 184, 6, 'pp');
  body += `<rect x="56.5" y="102.5" width="149" height="183" rx="6" fill="none" stroke="${ink}" stroke-opacity="0.35"/>`;

  const fields: Array<[string, string]> = [['NAME', truncate(name, 22)], ['LOGIN', `@${truncate(profile.login, 20)}`]];
  if (issued) fields.push(['ISSUED (MEMBER SINCE)', issued]);
  if (profile.location) fields.push(['PLACE OF RESIDENCE', truncate(profile.location, 24)]);
  if (blocks.has('stats')) fields.push(['FOLLOWERS', formatNumber(profile.followers)]);
  fields.slice(0, 5).forEach(([caption, value], i) => {
    const y = 112 + i * 37;
    body += text(caption, 228, y, 8.5, muted, 'letter-spacing="1.4" font-weight="700"');
    body += text(value, 228, y + 18, 15, ink, 'font-weight="700"');
    body += `<path d="M228 ${y + 24}H430" stroke="${rule}"/>`;
  });

  const mrz1 = mrzLine(`P<GHB${name.replace(/\s+/g, '<<')}`);
  const mrz2 = mrzLine(`${profile.login}<${(issued ?? '').replace(/-/g, '')}`);
  body += `<rect x="40" y="326" width="396" height="68" rx="4" fill="${ink}" fill-opacity="0.05"/>`;
  body += text(mrz1, 54, 354, 11.5, ink, 'class="mono" letter-spacing="0.5"');
  body += text(mrz2, 54, 378, 11.5, ink, 'class="mono" letter-spacing="0.5"');

  // Right page: one stamp for each language.
  body += text('ENTRIES · LANGUAGES', 482, 62, 11, seal, 'letter-spacing="3" font-weight="800"');
  const langs = blocks.has('languages') ? profile.languages.slice(0, 6) : [];
  if (langs.length === 0) {
    body += text(blocks.has('languages') ? 'No stamps yet.' : 'The languages section is switched off.', 482, 130, 13, muted, 'font-style="italic"');
  }
  langs.forEach((lang, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const cx = 540 + col * 118;
    const cy = 150 + row * 128;
    const tilt = ((hashOf(`${profile.login}:${lang.name}`) % 25) - 12) * 0.9;
    const color = langColor(lang.name, variant);
    const stamp =
      `<g transform="rotate(${num(tilt)} ${cx} ${cy})" class="stamp" style="animation-delay:${(0.2 + i * 0.18).toFixed(2)}s">` +
      `<circle cx="${cx}" cy="${cy}" r="50" fill="none" stroke="${color}" stroke-width="3" stroke-opacity="0.85"/>` +
      `<circle cx="${cx}" cy="${cy}" r="43" fill="none" stroke="${color}" stroke-width="1" stroke-opacity="0.85"/>` +
      text(truncate(lang.name, 11).toUpperCase(), cx, cy - 6, 11.5, color, 'text-anchor="middle" font-weight="800" letter-spacing="0.8"') +
      text(`${Math.round(lang.percent)}%`, cx, cy + 17, 18, color, 'text-anchor="middle" font-weight="800"') +
      `</g>`;
    body += stamp;
  });
  if (blocks.has('stats')) {
    const line = `${formatNumber(profile.publicRepos)} repositories  ·  ${formatNumber(profile.totalStars)} stars`;
    body += `<path d="M482 372H842" stroke="${rule}"/>`;
    body += text(line, 482, 396, 12.5, muted, 'class="mono"');
  }

  const css =
    riseCss(motion) +
    (motion ? `.stamp{transform-box:fill-box;transform-origin:center;animation:slam .5s cubic-bezier(.2,.9,.3,1.4) both}@keyframes slam{from{opacity:0;transform:scale(1.9)}}@media (prefers-reduced-motion:reduce){.stamp{animation:none}}` : '');
  return svgDoc({ height: 440, title: `${name} on GitHub, as a passport`, bg: desk, radius: 14, css, body: rise(body, motion, 0) });
}

export const passport: Template = imageTemplate(
  'passport',
  'Passport',
  'An open passport with your photo and a stamp for every language you use.',
  ['creative', 'document', 'fun'],
  passportSvg,
  { extra: () => 'shown as an open passport with a stamp for each language' },
);

/* ------------------------------------------------------------------------------------------------ */
/* Receipt                                                                                           */
/* ------------------------------------------------------------------------------------------------ */

function receiptSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const desk = dark ? '#15171c' : '#d9dde3';
  const paper = dark ? '#ecebe6' : '#fbfaf6';
  const ink = '#26282d';
  const faint = '#7d8088';
  const left = 300;
  const right = 600;
  const lh = 19;
  const repos = blocks.has('projects') ? profile.topRepos.slice(0, 5) : [];
  const date = isoDate(profile.fetchedAt);
  const name = profile.name ?? profile.login;

  const lines: string[] = [];
  let y = 74;
  const centre = (value: string, size = 13, weight = 600, fill = ink) => {
    lines.push(text(value, 450, y, size, fill, `class="mono" text-anchor="middle" font-weight="${weight}"`));
    y += lh;
  };
  const dashes = () => {
    lines.push(`<path d="M${left} ${y - 5}H${right}" stroke="${faint}" stroke-dasharray="4 3"/>`);
    y += 12;
  };
  const row = (a: string, b: string, size = 12.5, weight = 500) => {
    lines.push(text(a, left, y, size, ink, `class="mono" font-weight="${weight}"`));
    lines.push(text(b, right, y, size, ink, `class="mono" text-anchor="end" font-weight="${weight}"`));
    y += lh;
  };

  centre('GITHUB  GENERAL  STORE', 14, 800);
  centre(`@${truncate(profile.login, 28)}`, 12.5, 500, faint);
  if (profile.location) centre(truncate(profile.location, 36), 12, 500, faint);
  y += 4;
  dashes();
  if (date) row('DATE', date);
  row('CUSTOMER', truncate(name, 24).toUpperCase());
  dashes();
  if (repos.length > 0) {
    row('ITEM', 'STARS', 11, 800);
    for (const repo of repos) {
      row(truncate(repo.name, 26), formatNumber(repo.stars));
      if (repo.description) {
        lines.push(text(truncate(repo.description, 40), left + 10, y - 2, 10.5, faint, 'class="mono"'));
        y += 15;
      }
    }
    dashes();
    row(`SUBTOTAL (${plural(repos.length, 'item')})`, formatNumber(repos.reduce((sum, r) => sum + r.stars, 0)));
  }
  if (blocks.has('stats')) {
    row('TOTAL STARS', formatNumber(profile.totalStars), 14, 800);
    row('REPOSITORIES', formatNumber(profile.publicRepos));
    row('FOLLOWERS', formatNumber(profile.followers));
  }
  if (blocks.has('languages') && profile.languages.length > 0) {
    dashes();
    const tags = profile.languages.slice(0, 4).map((l) => `${l.name} ${Math.round(l.percent)}%`).join('  ');
    for (const part of wrap(`MADE WITH: ${tags}`, 38, 2)) {
      lines.push(text(part, left, y, 11.5, ink, 'class="mono"'));
      y += 16;
    }
  }
  dashes();
  centre('THANK YOU FOR VISITING', 12.5, 700);
  y += 6;

  // A bar code that is the same every time for the same login.
  let bars = '';
  let bx = 340;
  const seed = hashOf(profile.login);
  for (let i = 0; bx < 560; i++) {
    const w = 1 + (((seed >>> (i % 24)) ^ (i * 7)) % 4);
    if (i % 2 === 0) bars += `<rect x="${bx}" y="${y}" width="${w}" height="38" fill="${ink}"/>`;
    bx += w + 1;
  }
  lines.push(bars);
  y += 52;
  lines.push(text(profile.login.toUpperCase(), 450, y, 10.5, faint, 'class="mono" text-anchor="middle" letter-spacing="3"'));
  y += 30;

  const height = y + 36;
  // Torn top and bottom edges.
  const across = (sign: 1 | -1, dir: 1 | -1): string => {
    let d = '';
    for (let x = left - 20; x < right + 20; x += 10) d += `l${5 * sign} ${5 * dir}l${5 * sign} ${-5 * dir}`;
    return d;
  };
  const shape = `M${left - 20} 52${across(1, -1)}V${height - 40}${across(-1, 1)}Z`;
  const slot = `<rect x="260" y="26" width="380" height="24" rx="12" fill="${dark ? '#05060a' : '#8b909a'}"/>`;
  const paperShape =
    `<path d="${shape}" fill="${paper}"/>` +
    `<path d="${shape}" fill="none" stroke="#000" stroke-opacity="0.12"/>`;
  const printed = motion ? `<g class="print">${lines.join('')}</g>` : lines.join('');
  const css = motion ? `.print{animation:printout 2.4s steps(30) both}@keyframes printout{from{clip-path:inset(0 0 100% 0)}to{clip-path:inset(0 0 0 0)}}@media (prefers-reduced-motion:reduce){.print{animation:none}}` : '';
  return svgDoc({
    height,
    title: `${name} on GitHub, as a till receipt`,
    bg: desk,
    css,
    body: `${paperShape}${slot}${printed}`,
  });
}

export const receipt: Template = imageTemplate(
  'receipt',
  'Receipt',
  'A thermal till receipt that prints your best repositories as items, with a total.',
  ['creative', 'document', 'fun'],
  receiptSvg,
  { extra: () => 'shown as a till receipt listing repositories as items' },
);

/* ------------------------------------------------------------------------------------------------ */
/* Character sheet                                                                                   */
/* ------------------------------------------------------------------------------------------------ */

function sheetSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const hue = hueFor(profile, 28);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const bg = dark ? '#1d1710' : '#efe2c3';
  const sheet = dark ? '#261d12' : '#f7edd3';
  const ink = dark ? '#ead9b4' : '#3a2a14';
  const muted = dark ? '#a8946b' : '#7b6540';
  const line = dark ? '#4b3a22' : '#cdb78a';
  const accent = hslToHex(hue, 0.6, dark ? 0.62 : 0.36);
  const name = profile.name ?? profile.login;
  const since = isoDate(profile.createdAt)?.slice(0, 4);
  const years = yearsBetween(profile.createdAt, profile.fetchedAt);
  const bio = config.text.bio ?? profile.bio;

  const height = 470;
  let body = `<rect x="18" y="18" width="864" height="${height - 36}" rx="10" fill="${sheet}" stroke="${line}" stroke-width="2"/>`;
  body += `<rect x="28" y="28" width="844" height="${height - 56}" rx="6" fill="none" stroke="${line}"/>`;

  // The hero.
  body += pictureBox(profile, accent, sheet, 52, 54, 112, 112, 8, 'cp');
  body += `<rect x="52" y="54" width="112" height="112" rx="8" fill="none" stroke="${accent}" stroke-width="2.5"/>`;
  body += text(truncate(name, 16), 182, 84, name.length > 12 ? 20 : 24, ink, 'class="serif" font-weight="700"');
  body += text(`@${truncate(profile.login, 22)}`, 182, 106, 13, muted, 'class="mono"');
  if (since) body += text(`Adventuring since ${since}`, 182, 130, 13, ink, 'class="serif" font-style="italic"');
  if (profile.location) body += text(`Hails from ${truncate(profile.location, 22)}`, 182, 150, 13, ink, 'class="serif" font-style="italic"');

  // Four numbers, in boxes.
  const tiles: Array<[string, string]> = [];
  if (blocks.has('stats')) {
    tiles.push(['ALLIES', formatNumber(profile.followers)], ['RENOWN', formatNumber(profile.totalStars)], ['REALMS', formatNumber(profile.publicRepos)]);
    if (years !== null) tiles.push(['YEARS', formatNumber(years)]);
    else if (profile.totalForks !== undefined) tiles.push(['SPOILS', formatNumber(profile.totalForks)]);
  }
  tiles.forEach(([caption, value], i) => {
    const x = 52 + (i % 2) * 132;
    const y = 190 + Math.floor(i / 2) * 82;
    body += `<rect x="${x}" y="${y}" width="120" height="70" rx="6" fill="${accent}" fill-opacity="0.1" stroke="${accent}" stroke-opacity="0.6"/>`;
    body += text(value, x + 60, y + 38, 26, ink, 'class="serif" text-anchor="middle" font-weight="700"');
    body += text(caption, x + 60, y + 58, 9.5, muted, 'text-anchor="middle" letter-spacing="2.4" font-weight="700"');
  });

  // Skills: the languages, as bars.
  body += text('SKILLS', 376, 70, 12, accent, 'letter-spacing="4" font-weight="800"');
  body += `<path d="M376 80H600" stroke="${line}"/>`;
  const skills = blocks.has('languages') ? profile.languages.slice(0, 6) : [];
  if (skills.length === 0) body += text(blocks.has('languages') ? 'No skills listed.' : 'Skills are switched off.', 376, 108, 13, muted, 'class="serif" font-style="italic"');
  skills.forEach((lang, i) => {
    const y = 106 + i * 40;
    body += text(truncate(lang.name, 16), 376, y, 13.5, ink, 'class="serif" font-weight="600"');
    body += text(`${Math.round(lang.percent)}%`, 600, y, 12.5, muted, 'class="mono" text-anchor="end"');
    body += `<rect x="376" y="${y + 8}" width="224" height="8" rx="4" fill="${ink}" fill-opacity="0.1"/>`;
    body += `<rect x="376" y="${y + 8}" width="${num(Math.max(6, (224 * lang.percent) / 100))}" height="8" rx="4" fill="${langColor(lang.name, variant)}"/>`;
  });

  // Quests: the best repositories. A repository with no description gets a shorter entry, never an invented one.
  body += text('QUESTS', 636, 70, 12, accent, 'letter-spacing="4" font-weight="800"');
  body += `<path d="M636 80H846" stroke="${line}"/>`;
  const quests = blocks.has('projects') ? profile.topRepos.slice(0, 4) : [];
  if (quests.length === 0) body += text(blocks.has('projects') ? 'No quests yet.' : 'Quests are switched off.', 636, 108, 13, muted, 'class="serif" font-style="italic"');
  let qy = 104;
  for (const repo of quests) {
    body += text(truncate(repo.name, 18), 636, qy, 14, ink, 'class="serif" font-weight="700"');
    body += text(`★ ${formatNumber(repo.stars)}`, 846, qy, 12, accent, 'class="mono" text-anchor="end" font-weight="700"');
    const described = repo.description ? wrap(repo.description, 32, 2) : [];
    described.forEach((part, j) => {
      body += text(part, 636, qy + 17 + j * 15, 11.5, muted, 'class="serif" font-style="italic"');
    });
    qy += 30 + described.length * 15;
  }

  // The legend runs along the bottom.
  body += `<path d="M52 374H846" stroke="${line}"/>`;
  body += text('LEGEND', 52, 398, 10.5, accent, 'letter-spacing="3.6" font-weight="800"');
  const legend = bio ? wrap(bio, 92, 2) : ['Nothing has been written here yet.'];
  legend.forEach((part, i) => {
    body += text(part, 52, 418 + i * 15, 12.5, ink, 'class="serif" font-style="italic"');
  });

  return svgDoc({ height, title: `${name} on GitHub, as a character sheet`, bg, radius: 14, css: riseCss(motion), body: rise(body, motion, 0.05) });
}

export const sheet: Template = imageTemplate(
  'sheet',
  'Character sheet',
  'A fantasy character sheet: allies, renown, skills, quests and a legend.',
  ['creative', 'document', 'fun'],
  sheetSvg,
  { extra: () => 'shown as a fantasy character sheet with skills and quests' },
);

/* ------------------------------------------------------------------------------------------------ */
/* Wall calendar                                                                                     */
/* ------------------------------------------------------------------------------------------------ */

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

/** The month a calendar page shows: the one the contribution data ends in, or the one the data was read in. */
export function calendarMonth(profile: Profile): { year: number; month: number; today: string } | null {
  const date = isoDate(profile.contributions?.to) ?? isoDate(profile.fetchedAt);
  if (!date) return null;
  return { year: Number(date.slice(0, 4)), month: Number(date.slice(5, 7)) - 1, today: date };
}

function calendarSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const hue = hueFor(profile, 8);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const bg = dark ? '#16161a' : '#e6e3dc';
  const page = dark ? '#202026' : '#fffdf8';
  const ink = dark ? '#ecebf0' : '#25232b';
  const muted = dark ? '#8d8c98' : '#8a8693';
  const line = dark ? '#34343d' : '#e3dfd6';
  const accent = hslToHex(hue, 0.7, dark ? 0.62 : 0.46);
  const name = profile.name ?? profile.login;
  const when = calendarMonth(profile);
  const activity = blocks.has('activity') ? profile.contributions : undefined;
  const counts = new Map((activity?.days ?? []).map((d) => [d.date, d] as const));

  const levels = [0.14, 0.34, 0.5, 0.64].map((l, i) => hslToHex(hue, 0.55 + i * 0.1, dark ? l : 1 - l * 0.85));

  const first = when ? new Date(Date.UTC(when.year, when.month, 1)) : null;
  const lead = first ? (first.getUTCDay() + 6) % 7 : 0;
  const length = when ? new Date(Date.UTC(when.year, when.month + 1, 0)).getUTCDate() : 0;
  const gx = 58;
  const gy = 196;
  const cw = 112;
  const ch = 60;
  const bottom = gy + Math.ceil((lead + length) / 7) * ch;
  const height = when ? bottom + 100 : 280;

  let body = `<rect x="28" y="40" width="844" height="${height - 60}" rx="10" fill="${page}" stroke="${line}"/>`;
  body += `<rect x="28" y="40" width="844" height="96" rx="10" fill="${accent}"/><rect x="28" y="110" width="844" height="26" fill="${accent}"/>`;
  for (let i = 0; i < 14; i++) {
    const x = 70 + i * 60;
    body += `<rect x="${x - 4}" y="24" width="8" height="30" rx="4" fill="${dark ? '#0b0b0e' : '#4a4750'}"/><circle cx="${x}" cy="46" r="5" fill="${bg}"/>`;
  }
  body += pictureBox(profile, page, accent, 52, 62, 62, 62, 31, 'wc');
  body += `<circle cx="83" cy="93" r="30" fill="none" stroke="#fff" stroke-opacity="0.8" stroke-width="2"/>`;
  body += text(truncate(name, 24), 130, 90, 20, '#ffffff', 'font-weight="700"');
  body += text(`@${truncate(profile.login, 24)}`, 130, 110, 12.5, '#ffffff', 'class="mono" fill-opacity="0.85"');

  if (!when) {
    body += text('The calendar appears after the first automatic update.', 60, 200, 15, muted, 'font-style="italic"');
    return svgDoc({ height, title: `${name} on GitHub, as a wall calendar`, bg, radius: 14, css: riseCss(motion), body });
  }

  body += text(MONTHS[when.month]!.toUpperCase(), 848, 92, 34, '#ffffff', 'text-anchor="end" font-weight="800" letter-spacing="3"');
  body += text(String(when.year), 848, 114, 14, '#ffffff', 'text-anchor="end" letter-spacing="4" fill-opacity="0.85"');

  WEEKDAYS.forEach((day, i) => {
    body += text(day, gx + i * cw + cw / 2 - 4, 168, 10.5, i > 4 ? accent : muted, 'text-anchor="middle" letter-spacing="2" font-weight="700"');
  });
  for (let d = 1; d <= length; d++) {
    const slot = lead + d - 1;
    const x = gx + (slot % 7) * cw;
    const y = gy + Math.floor(slot / 7) * ch;
    const iso = `${when.year}-${String(when.month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const day = counts.get(iso);
    const future = iso > when.today;
    let fill = 'none';
    let numberFill = future ? muted : ink;
    if (day && day.count > 0) {
      fill = levels[Math.min(3, Math.max(0, day.level - 1))]!;
      numberFill = dark ? '#ffffff' : day.level >= 3 ? '#ffffff' : ink;
    }
    body += `<rect x="${x + 2}" y="${y + 2}" width="${cw - 4}" height="${ch - 4}" rx="6" fill="${fill}" stroke="${iso === when.today ? accent : line}" stroke-width="${iso === when.today ? 2.5 : 1}"${activity && !day && !future ? ' stroke-dasharray="3 3"' : ''}/>`;
    body += text(String(d), x + 12, y + 22, 14, numberFill, 'font-weight="700"');
    if (day && day.count > 0) body += text(String(day.count), x + cw - 12, y + ch - 12, 12, numberFill, 'class="mono" text-anchor="end" font-weight="700"');
  }

  // The sidebar: this month, in numbers.
  let month = 0;
  let active = 0;
  for (const day of activity?.days ?? []) {
    if (day.date.startsWith(`${when.year}-${String(when.month + 1).padStart(2, '0')}`)) {
      month += day.count;
      if (day.count > 0) active += 1;
    }
  }
  const notes: string[] = [];
  if (activity) {
    notes.push(`${formatNumber(month)} contributions this month`, `${plural(active, 'active day')} this month`, `${plural(activity.currentStreak, 'day')} current streak`, `${plural(activity.longestStreak, 'day')} longest streak this year`);
  } else if (blocks.has('activity')) {
    notes.push('Contribution colours appear after the first automatic update.');
  }
  const noteY = bottom + 34;
  body += `<path d="M56 ${bottom + 12}H844" stroke="${line}"/>`;
  notes.forEach((note, i) => {
    body += text(note, 56 + (i % 2) * 400, noteY + Math.floor(i / 2) * 22, 13, i === 0 ? ink : muted, `class="mono" font-weight="${i === 0 ? 700 : 500}"`);
  });
  return svgDoc({ height, title: `${name} on GitHub, as a wall calendar`, bg, radius: 14, css: riseCss(motion), body: rise(body, motion, 0.05) });
}

export const calendar: Template = imageTemplate(
  'calendar',
  'Wall calendar',
  'A wall calendar page with every day coloured by your real contributions.',
  ['creative', 'document', 'activity'],
  calendarSvg,
  { activity: true, extra: () => 'shown as a wall calendar page' },
);

export const documentTemplates: Template[] = [passport, receipt, sheet, calendar];
