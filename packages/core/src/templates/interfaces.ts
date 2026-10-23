import { hslToHex, hueOf } from '../color';
import { recentWeeks } from '../contributions';
import { ACTIVE_WINDOW_DAYS } from '../github';
import type { Variant } from '../themes';
import type { Config, Profile, RepoSummary, Template } from '../types';
import { formatNumber, timeAgo, truncate, wrap, xmlEscape } from '../util';
import { W, num, riseCss } from './kit';
import { imageTemplate, isoDate, langColor, pictureBox, svgDoc } from './make';
import { plural, rise } from './shared';

/** Four designs that look like software: a music player, a mail client, a 90s desktop and a cockpit. */

const hueFor = (profile: Profile, fallback: number): number => hueOf(profile.avatar?.grid.tint) ?? fallback;

const text = (value: string, x: number, y: number, size: number, fill: string, extra = ''): string =>
  `<text x="${num(x)}" y="${num(y)}" font-size="${size}" fill="${fill}" ${extra}>${xmlEscape(value)}</text>`;

/** True when a repository was pushed to within the activity window before the data was read. Never guesses. */
export function isFresh(repo: RepoSummary, fetchedAt: string | undefined): boolean {
  if (!repo.pushedAt || !fetchedAt) return false;
  const pushed = Date.parse(repo.pushedAt);
  const read = Date.parse(fetchedAt);
  if (Number.isNaN(pushed) || Number.isNaN(read) || pushed > read) return false;
  return read - pushed <= ACTIVE_WINDOW_DAYS * 86_400_000;
}

/* ------------------------------------------------------------------------------------------------ */
/* Now playing                                                                                       */
/* ------------------------------------------------------------------------------------------------ */

function playerSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const hue = hueFor(profile, 300);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const bg = dark ? hslToHex(hue, 0.45, 0.09) : hslToHex(hue, 0.5, 0.93);
  const card = dark ? hslToHex(hue, 0.35, 0.14) : '#ffffff';
  const ink = dark ? '#f3eefc' : '#231a33';
  const muted = dark ? '#a99fc0' : '#7c7192';
  const accent = hslToHex(hue, 0.8, dark ? 0.66 : 0.5);
  const name = profile.name ?? profile.login;
  const tracks = blocks.has('projects') ? profile.topRepos.slice(0, 5) : [];
  const weeks = blocks.has('activity') && profile.contributions ? recentWeeks(profile.contributions.days, 26) : [];

  const listTop = weeks.length > 0 ? 248 : 160;
  const height = Math.max(420, listTop + Math.max(tracks.length, 1) * 36 + 40);
  let body = `<rect x="22" y="22" width="856" height="${height - 44}" rx="18" fill="${card}"/>`;
  // The record, half hidden behind the cover.
  const discX = 200;
  const discY = 190;
  let disc = `<g class="spin"><circle cx="${discX + 64}" cy="${discY}" r="112" fill="${dark ? '#08060d' : '#22192f'}"/>`;
  for (const r of [100, 88, 76, 64]) disc += `<circle cx="${discX + 64}" cy="${discY}" r="${r}" fill="none" stroke="#ffffff" stroke-opacity="0.07"/>`;
  disc += `<circle cx="${discX + 64}" cy="${discY}" r="34" fill="${accent}"/><circle cx="${discX + 64}" cy="${discY}" r="5" fill="${card}"/>`;
  disc += `<path d="M${discX + 64} ${discY - 34}a34 34 0 0 1 34 34" fill="none" stroke="#ffffff" stroke-opacity="0.45" stroke-width="2"/></g>`;
  body += disc;
  body += `<rect x="50" y="68" width="244" height="244" rx="14" fill="${accent}" fill-opacity="0.35"/>`;
  body += pictureBox(profile, accent, card, 54, 72, 236, 236, 12, 'np');
  if (blocks.has('stats')) body += text(`♥  ${formatNumber(profile.followers)} followers`, 54, 348, 14, ink, 'font-weight="700"');
  // Controls.
  const cy = 378;
  body += `<g fill="${ink}"><path d="M120 ${cy - 9}v18l-14-9zM106 ${cy - 9}v18" stroke="${ink}" stroke-width="2.5"/>`;
  body += `<circle cx="172" cy="${cy}" r="18" fill="${accent}"/><path d="M167 ${cy - 8}l14 8l-14 8z" fill="${card}"/>`;
  body += `<path d="M224 ${cy - 9}v18l14-9zM238 ${cy - 9}v18" stroke="${ink}" stroke-width="2.5"/></g>`;

  // Right: title, equaliser and the track list.
  body += text('NOW PLAYING', 384, 66, 11, accent, 'letter-spacing="3.4" font-weight="800"');
  body += text(truncate(name, 22), 384, 104, 32, ink, 'font-weight="800"');
  body += text(`@${truncate(profile.login, 28)}`, 384, 128, 14, muted, 'class="mono"');
  let y = 152;
  if (weeks.length > 0) {
    const peak = Math.max(...weeks, 1);
    const bw = 10;
    weeks.forEach((count, i) => {
      const h = Math.max(3, (count / peak) * 46);
      const delay = ((i * 0.13) % 1.1).toFixed(2);
      body += `<rect class="eq" style="animation-delay:${delay}s" x="${384 + i * (bw + 7)}" y="${num(y + 52 - h)}" width="${bw}" height="${num(h)}" rx="3" fill="${accent}" fill-opacity="${num(0.4 + (count / peak) * 0.6)}"/>`;
    });
    body += text(`${plural(profile.contributions!.activeDays, 'active day')} this year`, 384, y + 74, 11.5, muted, 'class="mono"');
  }
  y = listTop;
  if (tracks.length === 0) body += text(blocks.has('projects') ? 'No tracks yet.' : 'The projects section is switched off.', 384, y + 22, 14, muted, 'font-style="italic"');
  tracks.forEach((repo, i) => {
    const ty = y + i * 36;
    body += `<path d="M384 ${ty + 28}H850" stroke="${ink}" stroke-opacity="0.08"/>`;
    body += i === 0 ? `<path d="M386 ${ty + 6}l11 6l-11 6z" fill="${accent}"/>` : text(String(i + 1), 386, ty + 18, 13, muted, 'class="mono"');
    body += text(truncate(repo.name, 24), 412, ty + 18, 15, i === 0 ? accent : ink, 'font-weight="700"');
    if (repo.language) body += text(truncate(repo.language, 14), 660, ty + 18, 12.5, muted);
    body += text(`★ ${formatNumber(repo.stars)}`, 850, ty + 18, 13, ink, 'class="mono" text-anchor="end" font-weight="700"');
  });

  const css =
    riseCss(motion) +
    (motion
      ? `.spin{transform-origin:${discX + 64}px ${discY}px;animation:spin 9s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}` +
        `.eq{transform-box:fill-box;transform-origin:bottom;animation:eq 1.1s ease-in-out infinite alternate}@keyframes eq{from{transform:scaleY(.45)}to{transform:scaleY(1)}}` +
        `@media (prefers-reduced-motion:reduce){.spin,.eq{animation:none}}`
      : '');
  return svgDoc({ height, title: `${name} on GitHub, as a music player`, bg, radius: 18, css, body: rise(body, motion, 0.05) });
}

export const player: Template = imageTemplate(
  'player',
  'Now playing',
  'A music player: your photo as the cover, repositories as tracks and your weeks as an equaliser.',
  ['creative', 'interface', 'fun'],
  playerSvg,
  { extra: () => 'shown as a music player with repositories as tracks' },
);

/* ------------------------------------------------------------------------------------------------ */
/* Inbox                                                                                             */
/* ------------------------------------------------------------------------------------------------ */

function inboxSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const hue = hueFor(profile, 212);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const bg = dark ? '#14161b' : '#e9ecf1';
  const win = dark ? '#1b1e25' : '#ffffff';
  const side = dark ? '#171a20' : '#f4f6f9';
  const ink = dark ? '#e8eaf0' : '#1d2330';
  const muted = dark ? '#8b93a3' : '#6c7587';
  const line = dark ? '#2a2f39' : '#e3e7ee';
  const accent = hslToHex(hue, 0.75, dark ? 0.64 : 0.46);
  const name = profile.name ?? profile.login;
  const mails = blocks.has('projects') ? profile.topRepos.slice(0, 5) : [];
  const unread = mails.filter((r) => isFresh(r, profile.fetchedAt)).length;
  const rowH = 62;
  const top = 84;
  const height = Math.max(400, top + Math.max(mails.length, 1) * rowH + 40);

  let body = `<rect x="22" y="22" width="856" height="${height - 44}" rx="12" fill="${win}" stroke="${line}"/>`;
  body += `<rect x="22" y="22" width="856" height="50" rx="12" fill="${side}"/><rect x="22" y="56" width="856" height="16" fill="${side}"/><path d="M22 72H878" stroke="${line}"/>`;
  body += `<circle cx="46" cy="47" r="5" fill="#ff5f57"/><circle cx="64" cy="47" r="5" fill="#febc2e"/><circle cx="82" cy="47" r="5" fill="#28c840"/>`;
  body += `<rect x="300" y="33" width="300" height="28" rx="14" fill="${bg}"/>`;
  body += text(`Search in @${truncate(profile.login, 24)}`, 320, 52, 12.5, muted);
  body += pictureBox(profile, accent, win, 832, 36, 28, 28, 14, 'ib');

  // Sidebar.
  body += `<rect x="22" y="72" width="170" height="${height - 94}" fill="${side}"/><rect x="22" y="${height - 34}" width="170" height="12" rx="12" fill="${side}"/><path d="M192 72V${height - 22}" stroke="${line}"/>`;
  const folders: Array<[string, string]> = [['Inbox', unread > 0 ? String(unread) : '']];
  if (blocks.has('stats')) folders.push(['Starred', formatNumber(profile.totalStars)], ['Followers', formatNumber(profile.followers)], ['Repositories', formatNumber(profile.publicRepos)]);
  if (blocks.has('languages') && profile.languages.length > 0) folders.push(['Languages', String(profile.languages.length)]);
  folders.forEach(([label, count], i) => {
    const fy = 92 + i * 36;
    if (i === 0) body += `<rect x="32" y="${fy - 2}" width="150" height="30" rx="8" fill="${accent}" fill-opacity="0.16"/>`;
    body += text(label, 48, fy + 18, 13.5, i === 0 ? accent : ink, `font-weight="${i === 0 ? 800 : 500}"`);
    if (count) body += text(count, 172, fy + 18, 12, i === 0 ? accent : muted, 'class="mono" text-anchor="end" font-weight="700"');
  });

  // The message list.
  if (mails.length === 0) body += text(blocks.has('projects') ? 'No messages.' : 'The projects section is switched off.', 220, top + 30, 14, muted, 'font-style="italic"');
  mails.forEach((repo, i) => {
    const my = top + i * rowH;
    const fresh = isFresh(repo, profile.fetchedAt);
    if (i === 0) body += `<rect x="193" y="${my}" width="403" height="${rowH}" fill="${accent}" fill-opacity="0.09"/>`;
    body += `<path d="M193 ${my + rowH}H596" stroke="${line}"/>`;
    if (fresh) body += `<circle cx="209" cy="${my + 24}" r="4.5" fill="${accent}"/>`;
    body += text(truncate(repo.language ?? 'Repository', 18), 224, my + 24, 13, ink, `font-weight="${fresh ? 800 : 600}"`);
    const ago = repo.pushedAt && profile.fetchedAt ? timeAgo(repo.pushedAt, profile.fetchedAt) : null;
    if (ago) body += text(ago, 584, my + 24, 11.5, muted, 'text-anchor="end"');
    body += text(truncate(repo.name, 34), 224, my + 42, 13, fresh ? ink : muted, `font-weight="${fresh ? 700 : 500}"`);
    if (repo.description) body += text(truncate(repo.description, 44), 224, my + 57 - 2, 11.5, muted);
  });

  // The reading pane: the open message is the profile itself.
  const px = 620;
  body += `<path d="M596 72V${height - 22}" stroke="${line}"/>`;
  body += text(`About ${truncate(name, 20)}`, px, 108, 17, ink, 'font-weight="800"');
  body += text(`@${truncate(profile.login, 26)}`, px, 130, 12.5, accent, 'class="mono"');
  const bio = config.text.bio ?? profile.bio;
  const lines = bio ? wrap(bio, 34, 7) : ['This profile has no bio.'];
  lines.forEach((part, i) => {
    body += text(part, px, 164 + i * 20, 13.5, bio ? ink : muted, bio ? '' : 'font-style="italic"');
  });
  let my = 164 + lines.length * 20 + 14;
  const facts: string[] = [];
  if (profile.location) facts.push(`Location: ${truncate(profile.location, 24)}`);
  const joined = isoDate(profile.createdAt);
  if (joined) facts.push(`Member since ${joined}`);
  for (const fact of facts) {
    body += text(fact, px, my, 12.5, muted);
    my += 20;
  }

  const css = riseCss(motion);
  return svgDoc({ height, title: `${name} on GitHub, as an inbox`, bg, radius: 14, css, body: rise(body, motion, 0.05) });
}

export const inbox: Template = imageTemplate(
  'inbox',
  'Inbox',
  'A mail client: each repository is a message, unread when it was pushed to recently.',
  ['creative', 'interface', 'projects'],
  inboxSvg,
  { extra: () => 'shown as a mail inbox with repositories as messages' },
);

/* ------------------------------------------------------------------------------------------------ */
/* Retro desktop                                                                                     */
/* ------------------------------------------------------------------------------------------------ */

/** Draws one classic window with a raised edge and a blue title bar. */
function retroWindow(x: number, y: number, w: number, h: number, title: string, face: string, titleA: string, titleB: string): string {
  let out = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${face}" stroke="#000"/>`;
  out += `<path d="M${x + 1} ${y + h - 1}V${y + 1}H${x + w - 1}" fill="none" stroke="#ffffff"/><path d="M${x + w - 1} ${y + 1}V${y + h - 1}H${x + 1}" fill="none" stroke="#7b7b7b"/>`;
  out += `<defs><linearGradient id="tb${x}${y}" x1="0" x2="1"><stop offset="0" stop-color="${titleA}"/><stop offset="1" stop-color="${titleB}"/></linearGradient></defs>`;
  out += `<rect x="${x + 3}" y="${y + 3}" width="${w - 6}" height="20" fill="url(#tb${x}${y})"/>`;
  out += text(truncate(title, Math.floor((w - 50) / 7.4)), x + 9, y + 18, 12.5, '#ffffff', 'font-weight="700"');
  out += `<rect x="${x + w - 22}" y="${y + 5}" width="16" height="16" fill="${face}" stroke="#000"/>` + text('×', x + w - 17, y + 18, 14, '#000', 'font-weight="700"');
  return out;
}

function desktopSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const bg = dark ? '#0c3b3b' : '#008080';
  const face = dark ? '#a8a8a8' : '#c0c0c0';
  const titleA = dark ? '#0a0a60' : '#000080';
  const titleB = dark ? '#3565a8' : '#1084d0';
  const name = profile.name ?? profile.login;
  const bio = config.text.bio ?? profile.bio;
  const repos = blocks.has('projects') ? profile.topRepos.slice(0, 5) : [];
  const weeks = blocks.has('activity') && profile.contributions ? recentWeeks(profile.contributions.days, 30) : [];
  const height = 500;

  let body = '';
  // Icons: a folder for each repository.
  repos.forEach((repo, i) => {
    const x = 40;
    const y = 36 + i * 82;
    body += `<path d="M${x} ${y + 8}h14l4 5h22v26h-40z" fill="#f4d34a" stroke="#000"/><path d="M${x + 1} ${y + 17}h38" stroke="#fff3b0"/>`;
    body += text(truncate(repo.name, 13), x + 20, y + 58, 11.5, '#ffffff', 'text-anchor="middle" font-weight="600"');
  });

  // Window one: a text file about the person.
  body += retroWindow(150, 30, 400, 230, `About ${truncate(profile.login, 18)}.txt - Notepad`, face, titleA, titleB);
  body += `<rect x="156" y="52" width="388" height="200" fill="#ffffff" stroke="#7b7b7b"/>`;
  const lines: Array<[string, string]> = [[name, 'font-weight="800"'], [`@${profile.login}`, '']];
  if (profile.location) lines.push([`Location: ${truncate(profile.location, 30)}`, '']);
  const joined = isoDate(profile.createdAt);
  if (joined) lines.push([`Member since: ${joined}`, '']);
  if (blocks.has('stats')) lines.push([`${formatNumber(profile.followers)} followers, ${formatNumber(profile.totalStars)} stars`, '']);
  for (const part of bio ? wrap(bio, 46, 3) : []) lines.push([part, 'font-style="italic"']);
  lines.slice(0, 9).forEach(([value, extra], i) => {
    body += text(value, 166, 74 + i * 20, 13.5, '#000', `class="mono" ${extra}`);
  });

  // Window two: the languages, as segmented bars.
  body += retroWindow(590, 80, 280, 250, 'Languages.exe', face, titleA, titleB);
  body += `<rect x="596" y="102" width="268" height="222" fill="${face}"/>`;
  const langs = blocks.has('languages') ? profile.languages.slice(0, 5) : [];
  if (langs.length === 0) body += text(blocks.has('languages') ? 'Nothing to show.' : 'Switched off.', 610, 130, 13, '#000', 'class="mono"');
  langs.forEach((lang, i) => {
    const y = 120 + i * 40;
    body += text(`${truncate(lang.name, 12)}  ${Math.round(lang.percent)}%`, 610, y + 4, 12.5, '#000', 'class="mono"');
    body += `<rect x="610" y="${y + 10}" width="240" height="16" fill="#ffffff" stroke="#7b7b7b"/>`;
    const cells = Math.max(1, Math.round((lang.percent / 100) * 20));
    for (let c = 0; c < cells; c++) body += `<rect x="${612 + c * 11.8}" y="${y + 12}" width="9" height="12" fill="${langColor(lang.name, variant)}"/>`;
  });

  // Window three: a graph of the past weeks.
  if (weeks.length > 0) {
    body += retroWindow(150, 290, 400, 150, 'Activity.exe', face, titleA, titleB);
    body += `<rect x="156" y="312" width="388" height="122" fill="#000"/>`;
    const peak = Math.max(...weeks, 1);
    weeks.forEach((count, i) => {
      const h = Math.max(2, (count / peak) * 90);
      body += `<rect x="${164 + i * 12.4}" y="${num(424 - h)}" width="9" height="${num(h)}" fill="#33ff33"/>`;
    });
    body += text(`last ${weeks.length} weeks`, 166, 328, 11, '#33ff33', 'class="mono"');
  }

  // The taskbar.
  const bar = height - 36;
  body += `<rect x="0" y="${bar}" width="${W}" height="36" fill="${face}"/><path d="M0 ${bar + 1}H${W}" stroke="#fff"/>`;
  body += `<rect x="6" y="${bar + 5}" width="82" height="26" fill="${face}" stroke="#000"/>` + text('Start', 36, bar + 24, 14, '#000', 'font-weight="800"');
  body += `<path d="M12 ${bar + 11}h8v8h-8zM22 ${bar + 11}h8v8h-8zM12 ${bar + 21}h8v8h-8zM22 ${bar + 21}h8v8h-8z" fill="#e0412e"/>`;
  body += `<rect x="98" y="${bar + 5}" width="170" height="26" fill="${dark ? '#8c8c8c' : '#dcdcdc'}" stroke="#000"/>` + text(truncate(`About ${profile.login}.txt`, 22), 108, bar + 23, 12, '#000');
  const clock = profile.fetchedAt && !Number.isNaN(Date.parse(profile.fetchedAt)) ? new Date(profile.fetchedAt).toISOString().slice(11, 16) : '';
  if (clock) {
    body += `<rect x="${W - 98}" y="${bar + 5}" width="90" height="26" fill="${face}" stroke="#7b7b7b"/>` + text(`${clock} UTC`, W - 53, bar + 23, 12, '#000', 'class="mono" text-anchor="middle"');
  }

  return svgDoc({ height, title: `${name} on GitHub, as a retro desktop`, bg, radius: 12, css: riseCss(motion), body: rise(body, motion, 0.05) });
}

export const desktop: Template = imageTemplate(
  'desktop',
  'Retro desktop',
  'A 90s desktop: a folder for each repository, a notepad about you and a taskbar.',
  ['creative', 'interface', 'fun'],
  desktopSvg,
  { extra: () => 'shown as a retro computer desktop with folders for repositories' },
);

/* ------------------------------------------------------------------------------------------------ */
/* Cockpit                                                                                           */
/* ------------------------------------------------------------------------------------------------ */

const SWEEP = 120; // degrees either side of straight up
const DECADES = 6; // 1 to 1,000,000

/** How far round the dial a value goes, from 0 to 1, on a scale of powers of ten. */
export function dialFraction(value: number): number {
  if (!Number.isFinite(value) || value < 1) return 0;
  return Math.min(1, Math.log10(value) / DECADES);
}

const polar = (cx: number, cy: number, r: number, deg: number): [number, number] => [cx + r * Math.sin((deg * Math.PI) / 180), cy - r * Math.cos((deg * Math.PI) / 180)];
const arc = (cx: number, cy: number, r: number, from: number, to: number): string => {
  const [x1, y1] = polar(cx, cy, r, from);
  const [x2, y2] = polar(cx, cy, r, to);
  return `M${num(x1)} ${num(y1)}A${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${num(x2)} ${num(y2)}`;
};

function cockpitSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const hue = hueFor(profile, 150);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const bg = dark ? '#0d0f10' : '#d6d9d7';
  const panel = dark ? '#171a1b' : '#eef0ee';
  const face = dark ? '#0a0c0d' : '#ffffff';
  const ink = dark ? '#e6ece8' : '#1a201d';
  const muted = dark ? '#7e8a84' : '#69756e';
  const accent = hslToHex(hue, 0.8, dark ? 0.58 : 0.38);
  const warn = hslToHex((hue + 150) % 360, 0.85, dark ? 0.6 : 0.42);
  const name = profile.name ?? profile.login;

  const dials: Array<[string, number]> = [];
  if (blocks.has('stats')) dials.push(['STARS', profile.totalStars], ['FOLLOWERS', profile.followers], ['REPOSITORIES', profile.publicRepos]);
  if (blocks.has('activity') && profile.contributions) dials.push(['CONTRIBUTIONS', profile.contributions.total]);
  else if (blocks.has('stats') && profile.totalForks !== undefined) dials.push(['FORKS', profile.totalForks]);

  const langs = blocks.has('languages') ? profile.languages.slice(0, 5) : [];
  const height = 410;
  let body = `<rect x="18" y="18" width="864" height="${height - 36}" rx="16" fill="${panel}" stroke="${muted}" stroke-opacity="0.4"/>`;
  for (const [x, y] of [[34, 34], [866, 34], [34, height - 34], [866, height - 34]] as const) body += `<circle cx="${x}" cy="${y}" r="4" fill="${muted}" fill-opacity="0.5"/>`;
  body += text(truncate(name, 28).toUpperCase(), 60, 58, 14, ink, 'letter-spacing="4" font-weight="800"');
  body += text(`@${profile.login}`, 840, 58, 13, muted, 'class="mono" text-anchor="end"');

  if (dials.length === 0) body += text('All the dials are switched off.', 60, 160, 15, muted, 'font-style="italic"');
  const r = 86;
  dials.forEach(([label, value], i) => {
    const cx = 450 + (i - (dials.length - 1) / 2) * 212;
    const cy = 176;
    const frac = dialFraction(value);
    body += `<circle cx="${cx}" cy="${cy}" r="${r + 12}" fill="${face}" stroke="${muted}" stroke-opacity="0.55" stroke-width="3"/>`;
    body += `<path d="${arc(cx, cy, r - 6, -SWEEP, SWEEP)}" fill="none" stroke="${muted}" stroke-opacity="0.25" stroke-width="8" stroke-linecap="round"/>`;
    if (frac > 0) body += `<path d="${arc(cx, cy, r - 6, -SWEEP, -SWEEP + frac * 2 * SWEEP)}" fill="none" stroke="${accent}" stroke-width="8" stroke-linecap="round"/>`;
    for (let d = 0; d <= DECADES; d++) {
      const deg = -SWEEP + (d / DECADES) * 2 * SWEEP;
      const [x1, y1] = polar(cx, cy, r - 17, deg);
      const [x2, y2] = polar(cx, cy, r - 26, deg);
      const [lx, ly] = polar(cx, cy, r - 38, deg);
      body += `<path d="M${num(x1)} ${num(y1)}L${num(x2)} ${num(y2)}" stroke="${muted}" stroke-width="2"/>`;
      body += text(['0', '10', '100', '1k', '10k', '100k', '1M'][d]!, lx, ly + 3.5, 9.5, muted, 'class="mono" text-anchor="middle"');
    }
    const needle = -SWEEP + frac * 2 * SWEEP;
    body += `<g class="needle" style="transform:rotate(${num(needle)}deg);transform-origin:${cx}px ${cy}px"><path d="M${cx} ${cy + 12}L${cx} ${cy - r + 22}" stroke="${warn}" stroke-width="3.5" stroke-linecap="round"/></g>`;
    body += `<circle cx="${cx}" cy="${cy}" r="9" fill="${ink}"/><circle cx="${cx}" cy="${cy}" r="3.5" fill="${face}"/>`;
    body += `<rect x="${cx - 52}" y="${cy + 38}" width="104" height="28" rx="5" fill="${face}" stroke="${muted}" stroke-opacity="0.5"/>`;
    body += text(formatNumber(value), cx, cy + 58, 17, accent, 'class="mono" text-anchor="middle" font-weight="800"');
    body += text(label, cx, cy + 118, 11, muted, 'text-anchor="middle" letter-spacing="3" font-weight="800"');
  });

  // The warning lights: one for each language.
  if (dials.length > 0) body += text('LOG SCALE: EACH TICK IS TEN TIMES THE LAST', 450, 322, 9.5, muted, 'class="mono" text-anchor="middle" letter-spacing="2"');
  langs.forEach((lang, i) => {
    const x = 450 + (i - (langs.length - 1) / 2) * 164;
    const color = langColor(lang.name, variant);
    body += `<rect x="${x - 74}" y="340" width="148" height="34" rx="17" fill="${face}" stroke="${color}" stroke-opacity="0.7"/>`;
    body += `<circle cx="${x - 54}" cy="357" r="6" fill="${color}"/>`;
    body += text(truncate(lang.name, 10), x - 40, 362, 12.5, ink, 'font-weight="700"');
    body += text(`${Math.round(lang.percent)}%`, x + 64, 362, 11.5, muted, 'class="mono" text-anchor="end"');
  });

  const css =
    riseCss(motion) +
    (motion ? `.needle{animation:sweep 1.8s cubic-bezier(.2,.8,.2,1) both}@keyframes sweep{from{transform:rotate(-${SWEEP}deg)}}@media (prefers-reduced-motion:reduce){.needle{animation:none}}` : '');
  return svgDoc({ height, title: `${name} on GitHub, as a cockpit panel`, bg, radius: 16, css, body: rise(body, motion, 0.05) });
}

export const cockpit: Template = imageTemplate(
  'cockpit',
  'Cockpit',
  'Dial gauges with sweeping needles for stars, followers, repositories and contributions.',
  ['creative', 'interface', 'stats'],
  cockpitSvg,
  { activity: false, extra: () => 'shown as cockpit dials on a logarithmic scale' },
);

export const interfaceTemplates: Template[] = [player, inbox, desktop, cockpit];
