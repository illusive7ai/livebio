import { hslToHex, hueOf } from '../color';
import type { Variant } from '../themes';
import type { Config, Profile, Template } from '../types';
import { formatNumber, truncate, wrap, xmlEscape } from '../util';
import { num, riseCss } from './kit';
import { hashOf, imageTemplate, isoDate, langColor, pictureBox, svgDoc } from './make';
import { rise } from './shared';
import { symbolOf } from './dataart';

/** Three designs that look handmade: a trading card, a wall of polaroids and a comic strip. */

const hueFor = (profile: Profile, fallback: number): number => hueOf(profile.avatar?.grid.tint) ?? fallback;

const text = (value: string, x: number, y: number, size: number, fill: string, extra = ''): string =>
  `<text x="${num(x)}" y="${num(y)}" font-size="${size}" fill="${fill}" ${extra}>${xmlEscape(value)}</text>`;

/** A repeatable tilt in degrees, so a design looks hand-placed but never changes between runs. */
export function tiltOf(seed: string, spread: number): number {
  return ((hashOf(seed) % (spread * 2 + 1)) - spread) * 0.9;
}

/* ------------------------------------------------------------------------------------------------ */
/* Trading card                                                                                      */
/* ------------------------------------------------------------------------------------------------ */

function cardSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const hue = hueFor(profile, 265);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const desk = dark ? '#0d0b14' : '#e4e0ee';
  const paper = dark ? '#1a1526' : '#fbf8ef';
  const ink = dark ? '#f3eefc' : '#241d33';
  const muted = dark ? '#a79dc0' : '#6f6584';
  const gold = hslToHex(42, 0.85, dark ? 0.6 : 0.5);
  const accent = hslToHex(hue, 0.7, dark ? 0.65 : 0.45);
  const name = profile.name ?? profile.login;
  const bio = config.text.bio ?? profile.bio;
  const since = isoDate(profile.createdAt)?.slice(0, 4);
  const main = blocks.has('languages') ? profile.languages[0] : undefined;
  const attacks = blocks.has('projects') ? profile.topRepos.slice(0, 3) : [];
  const cx = 450;
  const cw = 360;
  const x = cx - cw / 2;
  const y = 28;
  const ch = 520;
  const height = ch + 56;

  const defs =
    `<linearGradient id="rb" x1="0" x2="1" y1="0" y2="0.3">` +
    ['#ff5f8a', '#ffd35f', '#7dffb0', '#5fd2ff', '#b08dff', '#ff5f8a'].map((c, i) => `<stop offset="${i / 5}" stop-color="${c}"/>`).join('') +
    `</linearGradient>` +
    `<linearGradient id="gold" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="${gold}"/><stop offset="0.5" stop-color="${dark ? '#fff1b8' : '#fff4c2'}"/><stop offset="1" stop-color="${gold}"/></linearGradient>` +
    `<clipPath id="face"><rect x="${x + 8}" y="${y + 8}" width="${cw - 16}" height="${ch - 16}" rx="16"/></clipPath>` +
    `<pattern id="back" width="14" height="14" patternUnits="userSpaceOnUse"><path d="M0 7L7 0L14 7L7 14Z" fill="none" stroke="${accent}" stroke-opacity="0.5"/></pattern>`;

  let body = '';
  // Two cards face down, behind the front one.
  for (const [dx, rot] of [[-196, -9], [196, 8]] as const) {
    body += `<g transform="rotate(${rot} ${cx + dx} ${y + ch / 2})"><rect x="${x + dx + 30}" y="${y + 40}" width="${cw - 60}" height="${ch - 80}" rx="18" fill="${paper}" stroke="url(#gold)" stroke-width="4"/>`;
    body += `<rect x="${x + dx + 44}" y="${y + 54}" width="${cw - 88}" height="${ch - 108}" rx="10" fill="url(#back)"/>`;
    body += text(`@${truncate(profile.login, 16)}`, cx + dx, y + ch / 2 + 4, 15, ink, 'class="mono" text-anchor="middle" font-weight="700"') + `</g>`;
  }

  // The front card.
  body += `<rect x="${x}" y="${y}" width="${cw}" height="${ch}" rx="22" fill="url(#gold)"/>`;
  body += `<rect x="${x + 8}" y="${y + 8}" width="${cw - 16}" height="${ch - 16}" rx="16" fill="${paper}"/>`;
  body += text(truncate(name, 18), x + 24, y + 44, 21, ink, 'font-weight="800"');
  if (blocks.has('stats')) body += text(`HP ${formatNumber(profile.followers)}`, x + cw - 24, y + 44, 17, '#e0425a', 'class="mono" text-anchor="end" font-weight="800"');
  body += `<rect x="${x + 22}" y="${y + 60}" width="${cw - 44}" height="194" rx="6" fill="${accent}" fill-opacity="0.25" stroke="${gold}" stroke-width="3"/>`;
  body += pictureBox(profile, accent, paper, x + 26, y + 64, cw - 52, 186, 4, 'tc');
  const line = [main ? `${main.name} type` : null, since ? `since ${since}` : null].filter((v): v is string => Boolean(v)).join('  ·  ');
  if (line) body += text(truncate(line, 40), x + 24, y + 276, 11.5, muted, 'class="mono" font-style="italic"');

  if (attacks.length === 0) body += text(blocks.has('projects') ? 'No attacks learned yet.' : 'Attacks are switched off.', x + 24, y + 316, 13, muted, 'font-style="italic"');
  attacks.forEach((repo, i) => {
    const ay = y + 306 + i * 52;
    body += `<path d="M${x + 24} ${ay - 12}H${x + cw - 24}" stroke="${muted}" stroke-opacity="0.35"/>`;
    body += `<circle cx="${x + 38}" cy="${ay + 10}" r="9" fill="${repo.language ? langColor(repo.language, variant) : muted}"/>`;
    body += text(truncate(repo.name, 17), x + 58, ay + 14, 15.5, ink, 'font-weight="800"');
    if (repo.description) body += text(truncate(repo.description, 36), x + 58, ay + 30, 10.5, muted);
    body += text(formatNumber(repo.stars), x + cw - 26, ay + 16, 22, ink, 'text-anchor="end" font-weight="800"');
  });

  const flavour = bio ? wrap(bio, 46, 2) : [];
  if (flavour.length > 0) {
    body += `<rect x="${x + 22}" y="${y + ch - 78}" width="${cw - 44}" height="42" rx="6" fill="${accent}" fill-opacity="0.12"/>`;
    flavour.forEach((part, i) => {
      body += text(part, x + 32, y + ch - 58 + i * 15, 11, ink, 'class="serif" font-style="italic"');
    });
  }
  body += text(`Illus. @${truncate(profile.login, 20)}`, x + 24, y + ch - 20, 10, muted, 'class="mono"');
  if (profile.location) body += text(truncate(profile.location, 22), x + cw - 24, y + ch - 20, 10, muted, 'class="mono" text-anchor="end"');
  // The foil: a band of rainbow sliding across the whole card.
  body += `<g clip-path="url(#face)"><rect class="holo" x="${cx - 220}" y="${y - 20}" width="150" height="${ch + 40}" fill="url(#rb)" fill-opacity="${dark ? 0.2 : 0.22}" transform="skewX(-18)"/></g>`;

  const css =
    riseCss(motion) +
    (motion ? `.holo{animation:foil 4.5s ease-in-out infinite alternate}@keyframes foil{from{transform:translateX(0) skewX(-18deg)}to{transform:translateX(420px) skewX(-18deg)}}@media (prefers-reduced-motion:reduce){.holo{animation:none}}` : '');
  return svgDoc({ height, title: `${name} on GitHub, as a trading card`, bg: desk, radius: 14, css, defs, body: rise(body, motion, 0.05) });
}

export const card: Template = imageTemplate(
  'card',
  'Trading card',
  'A holographic trading card: HP from followers, an attack for each repository, damage from stars.',
  ['creative', 'scrapbook', 'fun'],
  cardSvg,
  { extra: () => 'shown as a holographic trading card with an attack for each repository' },
);

/* ------------------------------------------------------------------------------------------------ */
/* Polaroid wall                                                                                     */
/* ------------------------------------------------------------------------------------------------ */

function polaroidSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const hue = hueFor(profile, 30);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const cork = dark ? '#3b2d20' : '#c89a6a';
  const frame = dark ? '#ece8df' : '#fffdf8';
  const ink = '#3a2f26';
  const name = profile.name ?? profile.login;
  const bio = config.text.bio ?? profile.bio;
  const repos = blocks.has('projects') ? profile.topRepos.slice(0, 3) : [];
  const langs = blocks.has('languages') ? profile.languages.slice(0, 5) : [];
  const height = 520;

  let body = '';
  // Cork: little specks, the same every time.
  for (let i = 0; i < 150; i++) {
    const h = hashOf(`${profile.login}:cork:${i}`);
    body += `<circle cx="${h % 900}" cy="${(h >>> 10) % height}" r="${1 + (h % 3) * 0.7}" fill="${dark ? '#5a4531' : '#a97b4d'}" fill-opacity="0.45"/>`;
  }

  const pin = (px: number, py: number, color: string): string => `<circle cx="${px}" cy="${py}" r="7" fill="${color}"/><circle cx="${px - 2}" cy="${py - 2}" r="2.4" fill="#fff" fill-opacity="0.6"/>`;
  const polaroid = (px: number, py: number, rot: number, photo: string, caption: string, sub: string | null, pinColor: string, delay: number): string => {
    let out = `<g class="pol" transform="rotate(${num(rot)} ${px + 100} ${py + 120})" style="animation-delay:${delay.toFixed(2)}s">`;
    out += `<rect x="${px + 4}" y="${py + 6}" width="200" height="246" fill="#000" fill-opacity="0.28"/>`;
    out += `<rect x="${px}" y="${py}" width="200" height="246" fill="${frame}"/>${photo}`;
    out += text(truncate(caption, 18), px + 100, py + 214, 17, ink, 'class="serif" text-anchor="middle" font-style="italic" font-weight="700"');
    if (sub) out += text(sub, px + 100, py + 233, 11.5, '#7d6f60', 'class="mono" text-anchor="middle"');
    out += pin(px + 100, py + 10, pinColor) + `</g>`;
    return out;
  };

  const xs = [44, 262, 480, 698];
  body += polaroid(xs[0]!, 40, tiltOf(`${profile.login}:0`, 4), pictureBox(profile, hslToHex(hue, 0.5, 0.5), frame, xs[0]! + 12, 56, 176, 148, 2, 'pw'), name, `@${profile.login}`, '#d94141', 0.1);
  repos.forEach((repo, i) => {
    const px = xs[i + 1]!;
    const color = repo.language ? langColor(repo.language, variant) : hslToHex(hue, 0.3, 0.5);
    const art =
      `<rect x="${px + 12}" y="56" width="176" height="148" fill="${color}" fill-opacity="0.85"/>` +
      `<rect x="${px + 12}" y="56" width="176" height="148" fill="#000" fill-opacity="0.12"/>` +
      text(symbolOf(repo.name), px + 100, 150, 64, '#ffffff', 'text-anchor="middle" font-weight="800" fill-opacity="0.92"') +
      text(`★ ${formatNumber(repo.stars)}`, px + 178, 196, 13, '#ffffff', 'class="mono" text-anchor="end" font-weight="700"');
    body += polaroid(px, 40 + (i % 2 === 0 ? 14 : -4), tiltOf(`${profile.login}:${i + 1}`, 4), art, repo.name, repo.language, ['#3f7fd9', '#3aa86b', '#e0a52e'][i]!, 0.2 + i * 0.12);
  });

  // A note, pinned.
  const noteY = 322;
  body += `<g class="pol" transform="rotate(${num(tiltOf(`${profile.login}:note`, 3))} 190 ${noteY + 80})" style="animation-delay:0.6s">`;
  body += `<rect x="64" y="${noteY + 5}" width="270" height="158" fill="#000" fill-opacity="0.25"/><rect x="60" y="${noteY}" width="270" height="158" fill="#ffe27a"/>`;
  body += text('ABOUT', 80, noteY + 30, 11, '#8a6b00', 'letter-spacing="4" font-weight="800"');
  const lines = bio ? wrap(bio, 29, 4) : ['(nothing written here yet)'];
  lines.forEach((part, i) => {
    body += text(part, 80, noteY + 56 + i * 21, 16, '#4a3b00', `class="serif" font-style="italic"${bio ? '' : ' fill-opacity="0.6"'}`);
  });
  if (profile.location) body += text(truncate(profile.location, 30), 80, noteY + 148, 12.5, '#8a6b00', 'class="mono"');
  body += pin(195, noteY + 8, '#d94141') + `</g>`;

  // An index card with the numbers, and strips of tape for the languages.
  if (blocks.has('stats')) {
    body += `<g class="pol" transform="rotate(${num(tiltOf(`${profile.login}:index`, 3))} 520 ${noteY + 70})" style="animation-delay:0.7s"><rect x="364" y="${noteY + 4}" width="300" height="130" fill="#000" fill-opacity="0.22"/><rect x="360" y="${noteY}" width="300" height="130" fill="#fffdf6"/>`;
    for (let r = 0; r < 4; r++) body += `<path d="M360 ${noteY + 40 + r * 22}H660" stroke="#9db8e8" stroke-opacity="0.7"/>`;
    body += `<path d="M386 ${noteY}V${noteY + 130}" stroke="#e9a1a1"/>`;
    const facts: Array<[string, string]> = [['followers', formatNumber(profile.followers)], ['stars', formatNumber(profile.totalStars)], ['repositories', formatNumber(profile.publicRepos)]];
    facts.forEach(([label, value], i) => {
      body += text(value, 400, noteY + 36 + i * 28, 20, '#27408b', 'class="serif" font-weight="700"') + text(label, 500, noteY + 36 + i * 28, 14, '#7d6f60', 'class="serif" font-style="italic"');
    });
    body += `</g>`;
  }
  langs.forEach((lang, i) => {
    const ty = noteY + 6 + i * 30;
    const color = langColor(lang.name, variant);
    body += `<g transform="rotate(${num(tiltOf(`${profile.login}:tape:${i}`, 3))} 760 ${ty + 12})"><rect x="690" y="${ty}" width="170" height="24" fill="${color}" fill-opacity="0.92"/>`;
    body += text(`${truncate(lang.name, 12)}  ${Math.round(lang.percent)}%`, 775, ty + 17, 12.5, '#ffffff', 'text-anchor="middle" font-weight="800"') + `</g>`;
  });

  const css = riseCss(motion) + (motion ? `.pol{animation:drop .55s ease-out both}@keyframes drop{from{opacity:0;transform:translateY(-16px)}}@media (prefers-reduced-motion:reduce){.pol{animation:none}}` : '');
  return svgDoc({ height, title: `${name} on GitHub, as a wall of polaroids`, bg: cork, radius: 14, css, body });
}

export const polaroids: Template = imageTemplate(
  'polaroids',
  'Polaroid wall',
  'A corkboard of pinned polaroids: you, your best repositories, a note and strips of tape for languages.',
  ['creative', 'scrapbook', 'fun'],
  polaroidSvg,
  { extra: () => 'shown as a corkboard of polaroids, with a note and an index card' },
);

/* ------------------------------------------------------------------------------------------------ */
/* Comic strip                                                                                       */
/* ------------------------------------------------------------------------------------------------ */

function comicSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const hue = hueFor(profile, 12);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const sheet = dark ? '#15151b' : '#f4efe3';
  const panel = dark ? '#22222c' : '#fffdf6';
  const ink = dark ? '#f2f2f6' : '#16161d';
  const line = dark ? '#f2f2f6' : '#16161d';
  const dot = dark ? '#ffffff' : '#000000';
  const accent = hslToHex(hue, 0.85, dark ? 0.6 : 0.5);
  const yellow = '#ffd23f';
  const name = profile.name ?? profile.login;
  const bio = config.text.bio ?? profile.bio;
  const repos = blocks.has('projects') ? profile.topRepos.slice(0, 3) : [];
  const langs = blocks.has('languages') ? profile.languages.slice(0, 4) : [];
  const g = 14;
  const top = 24;
  const h1 = 232;
  const h2 = 232;
  const height = top + h1 + g + h2 + 24;
  const wA = 548;
  const wB = 828 - wA - g;

  const defs = `<pattern id="ht" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><circle cx="4.5" cy="4.5" r="1.7" fill="${dot}" fill-opacity="${dark ? 0.16 : 0.18}"/></pattern>`;
  const frame = (px: number, py: number, w: number, h: number, fill: string): string =>
    `<rect x="${px}" y="${py}" width="${w}" height="${h}" fill="${fill}"/><rect x="${px}" y="${py}" width="${w}" height="${h}" fill="url(#ht)"/><rect x="${px}" y="${py}" width="${w}" height="${h}" fill="none" stroke="${line}" stroke-width="4"/>`;
  const caption = (px: number, py: number, value: string): string => {
    const w = Math.min(280, value.length * 8.4 + 20);
    return `<rect x="${px}" y="${py}" width="${w}" height="24" fill="${yellow}" stroke="${line}" stroke-width="2.5"/>` + text(value, px + 10, py + 17, 12.5, '#16161d', 'font-weight="800" letter-spacing="1"');
  };

  let body = '';
  // Panel one: meet the hero.
  const p1 = { x: 36, y: top };
  body += frame(p1.x, p1.y, wA, h1, panel);
  body += caption(p1.x + 10, p1.y + 10, `MEET ${truncate(name, 22).toUpperCase()}`);
  body += pictureBox(profile, accent, panel, p1.x + 24, p1.y + 52, 150, 150, 6, 'cm');
  body += `<rect x="${p1.x + 24}" y="${p1.y + 52}" width="150" height="150" fill="url(#ht)"/><rect x="${p1.x + 24}" y="${p1.y + 52}" width="150" height="150" fill="none" stroke="${line}" stroke-width="3.5"/>`;
  if (bio) {
    const lines = wrap(bio, 30, 4);
    const bh = lines.length * 22 + 26;
    const bx = p1.x + 204;
    const by = p1.y + 60;
    body += `<path d="M${bx} ${by}h300a14 14 0 0 1 14 14v${bh - 14}a14 14 0 0 1 -14 14h-250l-26 22l6 -22h-30a14 14 0 0 1 -14 -14v${-(bh - 14)}a14 14 0 0 1 14 -14z" fill="#ffffff" stroke="${line}" stroke-width="3"/>`;
    lines.forEach((part, i) => {
      body += text(part, bx + 18, by + 30 + i * 22, 16, '#16161d', 'font-weight="700"');
    });
  }
  body += text(`@${profile.login}`, p1.x + wA - 16, p1.y + h1 - 14, 13, ink, 'class="mono" text-anchor="end" font-weight="700"');

  // Panel two: the numbers, in a burst.
  const p2 = { x: 36 + wA + g, y: top };
  body += frame(p2.x, p2.y, wB, h1, accent);
  if (blocks.has('stats')) {
    const cx = p2.x + wB / 2;
    const cy = p2.y + h1 / 2 + 4;
    let star = '';
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const r = i % 2 === 0 ? 100 : 66;
      star += `${i === 0 ? 'M' : 'L'}${num(cx + Math.cos(a) * r * 1.05)} ${num(cy + Math.sin(a) * r * 0.9)}`;
    }
    body += `<path d="${star}Z" fill="${yellow}" stroke="${line}" stroke-width="3.5"/>`;
    body += text(formatNumber(profile.totalStars), cx, cy + 8, 40, '#16161d', 'text-anchor="middle" font-weight="800"');
    body += text('STARS!', cx, cy + 32, 17, '#16161d', 'text-anchor="middle" font-weight="800" letter-spacing="3"');
    body += text(`${formatNumber(profile.followers)} followers`, cx, p2.y + h1 - 14, 13, '#ffffff', 'text-anchor="middle" font-weight="800"');
  } else {
    body += text('The numbers are switched off.', p2.x + 20, p2.y + 120, 14, '#ffffff', 'font-style="italic" font-weight="700"');
  }

  // Panel three: the tools.
  const p3 = { x: 36, y: top + h1 + g };
  body += frame(p3.x, p3.y, wB, h2, panel);
  body += caption(p3.x + 10, p3.y + 10, 'THE TOOLS');
  if (langs.length === 0) body += text(blocks.has('languages') ? 'No tools yet.' : 'Switched off.', p3.x + 20, p3.y + 80, 14, ink, 'font-style="italic"');
  langs.forEach((lang, i) => {
    const by = p3.y + 48 + i * 44;
    const color = langColor(lang.name, variant);
    body += `<rect x="${p3.x + 16}" y="${by}" width="${wB - 32}" height="34" rx="17" fill="${color}" stroke="${line}" stroke-width="3"/>`;
    body += text(truncate(lang.name, 12), p3.x + 36, by + 23, 15, '#ffffff', 'font-weight="800"');
    body += text(`${Math.round(lang.percent)}%`, p3.x + wB - 36, by + 23, 15, '#ffffff', 'text-anchor="end" font-weight="800"');
  });

  // Panel four: the quests.
  const p4 = { x: 36 + wB + g, y: top + h1 + g };
  body += frame(p4.x, p4.y, wA, h2, panel);
  body += caption(p4.x + 10, p4.y + 10, 'MEANWHILE, IN THE REPOSITORIES...');
  if (repos.length === 0) body += text(blocks.has('projects') ? 'Nothing to report.' : 'Switched off.', p4.x + 20, p4.y + 90, 14, ink, 'font-style="italic"');
  repos.forEach((repo, i) => {
    const ry = p4.y + 48 + i * 58;
    body += `<rect x="${p4.x + 16}" y="${ry}" width="${wA - 32}" height="48" fill="#ffffff" stroke="${line}" stroke-width="2.5"/>`;
    body += text(truncate(repo.name, 22), p4.x + 28, ry + 21, 16, '#16161d', 'font-weight="800"');
    if (repo.description) body += text(truncate(repo.description, 52), p4.x + 28, ry + 38, 11.5, '#4a4a55');
    body += text(`★ ${formatNumber(repo.stars)}`, p4.x + wA - 28, ry + 21, 15, '#16161d', 'class="mono" text-anchor="end" font-weight="800"');
  });

  const css = riseCss(motion);
  return svgDoc({ height, title: `${name} on GitHub, as a comic strip`, bg: sheet, radius: 14, css, defs, body: rise(body, motion, 0.05) });
}

export const comic: Template = imageTemplate(
  'comic',
  'Comic strip',
  'Four halftone panels: meet you, your stars in a burst, your tools and your repositories.',
  ['creative', 'scrapbook', 'fun'],
  comicSvg,
  { extra: () => 'shown as a four-panel comic strip' },
);

export const scrapbookTemplates: Template[] = [card, polaroids, comic];
