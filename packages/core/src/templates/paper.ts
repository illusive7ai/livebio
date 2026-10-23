import { hslToHex, hueOf } from '../color';
import type { Variant } from '../themes';
import type { Config, Profile, Template } from '../types';
import { formatNumber, truncate, wrap, xmlEscape } from '../util';
import { num, riseCss } from './kit';
import { hashOf, imageTemplate, isoDate, langColor, pictureBox, svgDoc, yearsBetween } from './make';
import { plural, rise } from './shared';

/** Five designs made of paper: a wanted poster, a recipe card, a nutrition label, a postcard and a ransom note. */

const hueFor = (profile: Profile, fallback: number): number => hueOf(profile.avatar?.grid.tint) ?? fallback;

const text = (value: string, x: number, y: number, size: number, fill: string, extra = ''): string =>
  `<text x="${num(x)}" y="${num(y)}" font-size="${size}" fill="${fill}" ${extra}>${xmlEscape(value)}</text>`;

/** "Go", "Go and Rust", "Go, Rust and Zig": a list in plain words. */
export function listWords(items: ReadonlyArray<string>): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/* ------------------------------------------------------------------------------------------------ */
/* Wanted poster                                                                                     */
/* ------------------------------------------------------------------------------------------------ */

function wantedSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const wood = dark ? '#2a1d12' : '#8a6238';
  const plank = dark ? '#1f150d' : '#6e4d2b';
  const paper = dark ? '#cdb78a' : '#ecd9a8';
  const ink = '#2b1b0c';
  const red = '#8c1c13';
  const name = profile.name ?? profile.login;
  const langs = blocks.has('languages') ? profile.languages.slice(0, 3).map((l) => l.name) : [];
  const since = isoDate(profile.createdAt)?.slice(0, 4);
  const height = 610;

  let body = '';
  for (let i = 0; i < 7; i++) body += `<rect x="0" y="${i * 100}" width="900" height="2" fill="${plank}"/>`;
  const px = 170;
  const pw = 560;
  body += `<g transform="rotate(-1.2 450 290)">`;
  body += `<rect x="${px + 6}" y="30" width="${pw}" height="550" fill="#000" fill-opacity="0.35"/><rect x="${px}" y="24" width="${pw}" height="550" fill="${paper}"/>`;
  body += `<rect x="${px + 14}" y="38" width="${pw - 28}" height="522" fill="none" stroke="${ink}" stroke-width="3"/><rect x="${px + 20}" y="44" width="${pw - 40}" height="510" fill="none" stroke="${ink}"/>`;
  body += text('WANTED', 450, 112, 68, ink, 'class="serif" text-anchor="middle" font-weight="800" letter-spacing="8"');
  body += text('FOR SHIPPING GOOD CODE', 450, 138, 12, red, 'text-anchor="middle" letter-spacing="5" font-weight="800"');
  body += `<rect x="320" y="156" width="260" height="206" fill="${ink}"/>`;
  body += pictureBox(profile, '#a07a45', paper, 326, 162, 248, 194, 0, 'wp');
  body += `<rect x="326" y="162" width="248" height="194" fill="#8a5a1f" fill-opacity="${dark ? 0.35 : 0.28}"/>`;
  body += text(truncate(name, 22).toUpperCase(), 450, 396, 30, ink, 'class="serif" text-anchor="middle" font-weight="800" letter-spacing="2"');
  body += text(`@${profile.login}`, 450, 417, 13, ink, 'class="mono" text-anchor="middle"');
  if (langs.length > 0) {
    for (const [i, part] of wrap(`FOR WRITING ${listWords(langs).toUpperCase()}`, 44, 2).entries()) body += text(part, 450, 446 + i * 17, 14, ink, 'class="serif" text-anchor="middle" font-weight="700"');
  }
  if (blocks.has('stats')) {
    body += text('REWARD', 450, 494, 11, red, 'text-anchor="middle" letter-spacing="6" font-weight="800"');
    body += text(`★ ${formatNumber(profile.totalStars)} STARS`, 450, 522, 24, red, 'class="serif" text-anchor="middle" font-weight="800"');
  }
  const foot = [profile.location ? `LAST SEEN IN ${truncate(profile.location, 24).toUpperCase()}` : null, since ? `ON GITHUB SINCE ${since}` : null].filter((v): v is string => Boolean(v));
  if (foot.length > 0) body += text(foot.join('  ·  '), 450, 548, 10.5, ink, 'class="mono" text-anchor="middle"');
  for (const [nx, ny] of [[px + 28, 54], [px + pw - 28, 54], [px + 28, 544], [px + pw - 28, 544]] as const) body += `<circle cx="${nx}" cy="${ny}" r="6" fill="#3a3a3a"/><circle cx="${nx - 1.5}" cy="${ny - 1.5}" r="2" fill="#bdbdbd"/>`;
  body += `</g>`;
  return svgDoc({ height, title: `${name} on GitHub, as a wanted poster`, bg: wood, radius: 14, css: riseCss(motion), body: rise(body, motion, 0.05) });
}

export const wanted: Template = imageTemplate('wanted', 'Wanted poster', 'A wild-west wanted poster: your photo, your languages as the crime and your stars as the reward.', ['creative', 'paper', 'fun'], wantedSvg, {
  extra: () => 'shown as a wanted poster',
});

/* ------------------------------------------------------------------------------------------------ */
/* Recipe card                                                                                       */
/* ------------------------------------------------------------------------------------------------ */

function recipeSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const hue = hueFor(profile, 12);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const desk = dark ? '#1c1815' : '#d9cdbb';
  const card = dark ? '#2a2420' : '#fffaf0';
  const ink = dark ? '#f1e6d3' : '#3a2c1c';
  const muted = dark ? '#a8967c' : '#8a7458';
  const rule = dark ? '#4a3e33' : '#e5d5b5';
  const red = hslToHex(hue, 0.65, dark ? 0.62 : 0.45);
  const name = profile.name ?? profile.login;
  const years = yearsBetween(profile.createdAt, profile.fetchedAt);
  const langs = blocks.has('languages') ? profile.languages.slice(0, 6) : [];
  const repos = blocks.has('projects') ? profile.topRepos.slice(0, 4) : [];
  let stepsHeight = 0;
  const steps = repos.map((repo) => {
    const desc = repo.description ? wrap(repo.description, 34, 2) : [];
    stepsHeight += 30 + desc.length * 15;
    return { repo, desc };
  });
  const height = Math.max(440, 220 + Math.max(langs.length * 30, stepsHeight) + 50);

  let body = `<g transform="rotate(-0.6 450 ${height / 2})"><rect x="40" y="30" width="820" height="${height - 52}" fill="#000" fill-opacity="0.22"/><rect x="34" y="24" width="820" height="${height - 52}" rx="4" fill="${card}"/>`;
  body += `<path d="M34 78H854" stroke="${red}" stroke-width="2.5"/>`;
  for (let y = 108; y < height - 40; y += 30) body += `<path d="M34 ${y}H854" stroke="${rule}"/>`;
  body += `<path d="M84 24V${height - 28}" stroke="${red}" stroke-opacity="0.45"/>`;
  body += text('FROM THE KITCHEN OF', 110, 48, 10.5, muted, 'letter-spacing="4" font-weight="800"');
  body += text(truncate(`${name}’s GitHub profile`, 38), 110, 70, 26, ink, 'class="serif" font-style="italic" font-weight="700"');
  const meta = [years !== null ? `Prep time: ${plural(years, 'year')} on GitHub` : null, blocks.has('stats') ? `Serves: ${plural(profile.followers, 'follower')}` : null].filter((v): v is string => Boolean(v));
  meta.forEach((part, i) => {
    body += text(part, 110, 98 + i * 0, 12.5, muted, `class="mono" ${i === 0 ? '' : `transform="translate(${i * 250} 0)"`}`);
  });
  body += pictureBox(profile, red, card, 740, 34, 100, 74, 3, 'rc');
  body += `<rect x="740" y="34" width="100" height="74" fill="none" stroke="${ink}" stroke-opacity="0.35"/>`;

  body += text('INGREDIENTS', 110, 150, 12, red, 'letter-spacing="4" font-weight="800"');
  if (langs.length === 0) body += text(blocks.has('languages') ? 'None listed.' : 'Switched off.', 110, 186, 14, muted, 'class="serif" font-style="italic"');
  langs.forEach((lang, i) => {
    const y = 186 + i * 30;
    body += `<rect x="112" y="${y - 12}" width="13" height="13" fill="none" stroke="${ink}" stroke-opacity="0.6"/>`;
    body += text(`${Math.round(lang.percent)}%`, 140, y, 15, red, 'class="mono" font-weight="700"');
    body += text(truncate(lang.name, 16), 190, y, 17, ink, 'class="serif"');
    body += `<rect x="300" y="${y - 7}" width="${num((lang.percent / 100) * 100)}" height="5" rx="2.5" fill="${langColor(lang.name, variant)}"/>`;
  });
  body += `<path d="M436 120V${height - 50}" stroke="${rule}" stroke-width="1.5"/>`;
  body += text('DIRECTIONS', 462, 150, 12, red, 'letter-spacing="4" font-weight="800"');
  if (steps.length === 0) body += text(blocks.has('projects') ? 'No steps yet.' : 'Switched off.', 462, 186, 14, muted, 'class="serif" font-style="italic"');
  let y = 186;
  steps.forEach(({ repo, desc }, i) => {
    body += text(`${i + 1}.`, 462, y, 17, red, 'class="serif" font-weight="800"');
    body += text(truncate(repo.name, 22), 486, y, 17, ink, 'class="serif" font-weight="700"');
    body += text(`★ ${formatNumber(repo.stars)}`, 840, y, 13, muted, 'class="mono" text-anchor="end"');
    desc.forEach((part, j) => {
      body += text(part, 486, y + 17 + j * 15, 12.5, muted, 'class="serif" font-style="italic"');
    });
    y += 30 + desc.length * 15;
  });
  body += `<circle cx="780" cy="${height - 74}" r="34" fill="none" stroke="#7a4a1d" stroke-opacity="0.18" stroke-width="5"/>`;
  body += `</g>`;
  return svgDoc({ height, title: `${name} on GitHub, as a recipe card`, bg: desk, radius: 14, css: riseCss(motion), body: rise(body, motion, 0.05) });
}

export const recipe: Template = imageTemplate('recipe', 'Recipe card', 'A recipe card: languages as the ingredients and repositories as the steps.', ['creative', 'paper', 'fun'], recipeSvg, {
  extra: () => 'shown as a recipe card with languages as ingredients',
});

/* ------------------------------------------------------------------------------------------------ */
/* Nutrition label                                                                                   */
/* ------------------------------------------------------------------------------------------------ */

function nutritionSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const hue = hueFor(profile, 140);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const bg = dark ? hslToHex(hue, 0.35, 0.12) : hslToHex(hue, 0.55, 0.88);
  const box = hslToHex(hue, 0.6, dark ? 0.3 : 0.5);
  const name = profile.name ?? profile.login;
  const bio = config.text.bio ?? profile.bio;
  const since = isoDate(profile.createdAt)?.slice(0, 4);
  const read = isoDate(profile.fetchedAt);
  const lx = 478;
  const lw = 386;
  const rows: Array<[string, string]> = [];
  if (blocks.has('stats')) {
    rows.push(['Stars', formatNumber(profile.totalStars)], ['Followers', formatNumber(profile.followers)], ['Following', formatNumber(profile.following)]);
    if (profile.totalForks !== undefined) rows.push(['Forks', formatNumber(profile.totalForks)]);
  }
  if (blocks.has('activity') && profile.contributions) rows.push(['Contributions this year', formatNumber(profile.contributions.total)], ['Active days', formatNumber(profile.contributions.activeDays)]);
  const ingredients = blocks.has('languages') ? profile.languages.slice(0, 6).map((l) => `${l.name} (${Math.round(l.percent)}%)`) : [];
  const ingredientLines = ingredients.length > 0 ? wrap(`INGREDIENTS: ${ingredients.join(', ')}.`, 44, 4) : [];
  const height = 112 + 40 + 86 + rows.length * 28 + (ingredientLines.length > 0 ? 40 + ingredientLines.length * 17 : 0) + 56;

  let body = '';
  // The side of the box.
  body += `<rect x="36" y="36" width="410" height="${height - 72}" rx="10" fill="${box}"/>`;
  body += text('GITHUB PROFILE', 62, 78, 12, '#ffffff', 'letter-spacing="6" font-weight="800" fill-opacity="0.85"');
  const nameLines = wrap(truncate(name, 40), 14, 3);
  const nameSize = Math.min(50, Math.floor(360 / (Math.max(...nameLines.map((l) => l.length), 1) * 0.66)));
  nameLines.forEach((part, i) => {
    body += text(part.toUpperCase(), 62, 150 + i * (nameSize + 8), nameSize, '#ffffff', 'font-weight="800"');
  });
  body += text(`@${profile.login}`, 62, height - 112, 15, '#ffffff', 'class="mono" fill-opacity="0.9"');
  if (bio) wrap(bio, 40, 3).forEach((part, i) => { body += text(part, 62, height - 84 + i * 18, 13.5, '#ffffff', 'font-style="italic" fill-opacity="0.92"'); });
  if (since) body += `<circle cx="392" cy="${height - 110}" r="38" fill="#ffd23f"/>` + text('SINCE', 392, height - 114, 10, '#3a2a00', 'text-anchor="middle" letter-spacing="2" font-weight="800"') + text(since, 392, height - 96, 18, '#3a2a00', 'text-anchor="middle" font-weight="800"');

  // The label.
  let y = 36;
  body += `<rect x="${lx}" y="36" width="${lw}" height="${height - 72}" fill="#ffffff" stroke="#000" stroke-width="3"/>`;
  const ink = '#000000';
  y += 44;
  body += text('Nutrition Facts', lx + 14, y, 36, ink, 'font-weight="900"');
  y += 10;
  body += `<path d="M${lx + 8} ${y}H${lx + lw - 8}" stroke="${ink}" stroke-width="1.5"/>`;
  y += 22;
  body += text('Serving size', lx + 14, y, 15, ink, 'font-weight="700"') + text('1 profile', lx + lw - 14, y, 15, ink, 'text-anchor="end" font-weight="700"');
  y += 10;
  body += `<path d="M${lx + 8} ${y}H${lx + lw - 8}" stroke="${ink}" stroke-width="9"/>`;
  y += 22;
  body += text('Amount per profile', lx + 14, y, 12, ink, 'font-weight="700"');
  y += 14;
  body += `<path d="M${lx + 8} ${y}H${lx + lw - 8}" stroke="${ink}" stroke-width="3"/>`;
  y += 30;
  body += text('Repositories', lx + 14, y, 22, ink, 'font-weight="900"') + text(formatNumber(profile.publicRepos), lx + lw - 14, y, 26, ink, 'text-anchor="end" font-weight="900"');
  y += 10;
  body += `<path d="M${lx + 8} ${y}H${lx + lw - 8}" stroke="${ink}" stroke-width="1"/>`;
  rows.forEach(([label, value]) => {
    y += 21;
    body += text(label, lx + 14, y, 15, ink, 'font-weight="700"') + text(value, lx + lw - 14, y, 15, ink, 'text-anchor="end" font-weight="700"');
    y += 7;
    body += `<path d="M${lx + 8} ${y}H${lx + lw - 8}" stroke="${ink}" stroke-width="1"/>`;
  });
  y += 4;
  body += `<path d="M${lx + 8} ${y}H${lx + lw - 8}" stroke="${ink}" stroke-width="9"/>`;
  ingredientLines.forEach((part, i) => {
    body += text(part, lx + 14, y + 26 + i * 17, 12.5, ink, 'font-weight="600"');
  });
  if (read) body += text(`* Public data from GitHub, read ${read}.`, lx + 14, height - 50, 10.5, '#444', 'class="mono"');
  return svgDoc({ height, title: `${name} on GitHub, as a nutrition label`, bg, radius: 14, css: riseCss(motion), body: rise(body, motion, 0.05) });
}

export const nutrition: Template = imageTemplate('nutrition', 'Nutrition label', 'A nutrition facts label for your profile, with your languages as the ingredients.', ['creative', 'paper', 'stats'], nutritionSvg, {
  activity: false,
  extra: () => 'shown as a nutrition facts label',
});

/* ------------------------------------------------------------------------------------------------ */
/* Postcard                                                                                          */
/* ------------------------------------------------------------------------------------------------ */

function postcardSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const hue = hueFor(profile, 205);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const table = dark ? '#1a2128' : '#cfd8de';
  const card = dark ? '#e9e3d4' : '#fbf7ec';
  const ink = '#2c2a26';
  const blue = hslToHex(hue, 0.6, 0.42);
  const red = '#c4443a';
  const name = profile.name ?? profile.login;
  const bio = config.text.bio ?? profile.bio;
  const read = isoDate(profile.fetchedAt);
  const place = profile.location ? truncate(profile.location, 22) : 'GitHub';
  const height = 500;

  let body = `<g transform="rotate(1 450 250)"><rect x="60" y="40" width="780" height="420" fill="#000" fill-opacity="0.3"/><rect x="54" y="34" width="780" height="420" fill="${card}"/>`;
  // Airmail stripes around the edge.
  for (let i = 0; i < 39; i++) body += `<path d="M${54 + i * 20} 34h10l-8 7h-10z" fill="${i % 2 ? blue : red}"/><path d="M${54 + i * 20} 454h10l-8 -7h-10z" fill="${i % 2 ? red : blue}"/>`;
  body += `<path d="M444 62V426" stroke="${ink}" stroke-opacity="0.35" stroke-width="2"/>`;
  body += text(`Greetings from ${place}!`, 76, 100, 30, blue, 'class="serif" font-style="italic" font-weight="700"');
  const message = bio ? wrap(bio, 40, 6) : [];
  for (let i = 0; i < 8; i++) body += `<path d="M76 ${150 + i * 30}H424" stroke="${ink}" stroke-opacity="0.22"/>`;
  message.forEach((part, i) => {
    body += text(part, 80, 144 + i * 30, 17, ink, 'class="serif" font-style="italic"');
  });
  if (message.length === 0) body += text('(no message written yet)', 80, 144, 15, '#8a8576', 'class="serif" font-style="italic"');
  body += text(`— ${truncate(name, 22)}`, 424, 150 + Math.max(1, message.length) * 30 + 8, 18, ink, 'class="serif" text-anchor="end" font-style="italic" font-weight="700"');
  if (blocks.has('stats')) body += text(`${formatNumber(profile.publicRepos)} repositories · ${formatNumber(profile.totalStars)} stars · ${formatNumber(profile.followers)} followers`, 76, 424, 11.5, '#6e6a5e', 'class="mono"');

  // The stamp, the postmark and the address.
  body += `<rect x="722" y="58" width="98" height="116" fill="${card}" stroke="${red}" stroke-width="2" stroke-dasharray="4 3"/>`;
  body += pictureBox(profile, blue, card, 732, 68, 78, 82, 2, 'pc');
  body += text('GITHUB', 771, 166, 10, red, 'text-anchor="middle" letter-spacing="3" font-weight="800"');
  if (read) {
    body += `<g transform="rotate(-10 662 120)"><circle cx="662" cy="120" r="46" fill="none" stroke="${ink}" stroke-opacity="0.55" stroke-width="2.5"/><circle cx="662" cy="120" r="38" fill="none" stroke="${ink}" stroke-opacity="0.4"/>`;
    body += text('POSTED', 662, 112, 10, ink, 'text-anchor="middle" letter-spacing="3" font-weight="800" fill-opacity="0.65"') + text(read, 662, 130, 11.5, ink, 'class="mono" text-anchor="middle" font-weight="700" fill-opacity="0.65"') + `</g>`;
  }
  const address = [truncate(name, 24), `@${truncate(profile.login, 24)}`, `github.com/${truncate(profile.login, 18)}`, profile.location ? truncate(profile.location, 24) : null].filter((v): v is string => Boolean(v));
  address.forEach((part, i) => {
    body += `<path d="M474 ${238 + i * 38}H816" stroke="${ink}" stroke-opacity="0.4"/>`;
    body += text(part, 480, 232 + i * 38, 17, ink, `class="serif" ${i === 0 ? 'font-weight="700"' : 'font-style="italic"'}`);
  });
  body += `</g>`;
  return svgDoc({ height, title: `${name} on GitHub, as a postcard`, bg: table, radius: 14, css: riseCss(motion), body: rise(body, motion, 0.05) });
}

export const postcard: Template = imageTemplate('postcard', 'Postcard', 'A postcard: greetings from your location, your bio as the message and your photo as the stamp.', ['creative', 'paper', 'fun'], postcardSvg, {
  extra: () => 'shown as a postcard',
});

/* ------------------------------------------------------------------------------------------------ */
/* Ransom note                                                                                       */
/* ------------------------------------------------------------------------------------------------ */

const CUTOUT_FONTS = ['Georgia, serif', "'Courier New', monospace", "'Segoe UI', sans-serif", 'Impact, Haettenschweiler, sans-serif', "'Times New Roman', serif"];

/** The look of one cut-out letter: always the same for the same text and position, so the note never reshuffles. */
export function cutout(seed: string, dark: boolean): { font: string; bg: string; fg: string; rot: number; dy: number; weight: number } {
  const h = hashOf(seed);
  const palette = dark
    ? [['#f3e9c9', '#1b1b1b'], ['#1b1b1b', '#f3e9c9'], ['#d94f4f', '#fff6e0'], ['#3f7fd9', '#fff6e0'], ['#f0c14b', '#1b1b1b'], ['#5fb98a', '#10241a']]
    : [['#fffdf3', '#1b1b1b'], ['#1b1b1b', '#fffdf3'], ['#e2574c', '#fffdf3'], ['#2f6fd0', '#fffdf3'], ['#f6c945', '#1b1b1b'], ['#58b887', '#0e2218']];
  const [bg, fg] = palette[h % palette.length]!;
  return { font: CUTOUT_FONTS[(h >>> 4) % CUTOUT_FONTS.length]!, bg: bg!, fg: fg!, rot: ((h >>> 8) % 13) - 6, dy: ((h >>> 12) % 9) - 4, weight: (h >>> 16) % 2 ? 800 : 500 };
}

function ransomSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const table = dark ? '#16181c' : '#c9ccd2';
  const sheet = dark ? '#d8d2c0' : '#f4f1e8';
  const name = (profile.name ?? profile.login).replace(/\s+/g, ' ').slice(0, 14);

  let x = 90;
  let letters = '';
  [...name].forEach((ch, i) => {
    if (ch === ' ') {
      x += 30;
      return;
    }
    const c = cutout(`${profile.login}:${i}:${ch}`, dark);
    const w = 50 + (hashOf(`${profile.login}:w:${i}`) % 14);
    const h = 70 + (hashOf(`${profile.login}:h:${i}`) % 14);
    letters += `<g class="cut" style="animation-delay:${(0.1 + i * 0.06).toFixed(2)}s" transform="rotate(${c.rot} ${x + w / 2} ${130 + h / 2})"><rect x="${x}" y="${130 + c.dy}" width="${w}" height="${h}" fill="${c.bg}" stroke="#000" stroke-opacity="0.25"/>`;
    letters += `<text x="${x + w / 2}" y="${130 + c.dy + h * 0.74}" text-anchor="middle" font-size="${Math.round(h * 0.74)}" font-family="${c.font}" font-weight="${c.weight}" fill="${c.fg}">${xmlEscape(ch.toUpperCase())}</text></g>`;
    x += w + 6;
  });
  const fit = Math.min(1, 720 / Math.max(1, x - 90));
  if (fit < 1) letters = `<g transform="translate(90 130) scale(${fit.toFixed(3)}) translate(-90 -130)">${letters}</g>`;

  // Scraps with the numbers.
  const scraps: string[] = [];
  if (blocks.has('stats')) scraps.push(`${formatNumber(profile.totalStars)} STARS`, `${formatNumber(profile.followers)} FOLLOWERS`, `${formatNumber(profile.publicRepos)} REPOS`);
  if (blocks.has('languages')) for (const l of profile.languages.slice(0, 3)) scraps.push(`${l.name.toUpperCase()} ${Math.round(l.percent)}%`);
  let sx = 90;
  let sy = 262;
  let scrapMarkup = '';
  scraps.forEach((label, i) => {
    const c = cutout(`${profile.login}:scrap:${i}`, dark);
    const w = label.length * 17 + 26;
    if (sx + w > 810) {
      sx = 90;
      sy += 76;
    }
    scrapMarkup += `<g class="cut" style="animation-delay:${(0.6 + i * 0.07).toFixed(2)}s" transform="rotate(${c.rot} ${sx + w / 2} ${sy + 25})"><rect x="${sx}" y="${sy + c.dy}" width="${w}" height="50" fill="${c.bg}" stroke="#000" stroke-opacity="0.25"/>`;
    scrapMarkup += `<text x="${sx + w / 2}" y="${sy + c.dy + 34}" text-anchor="middle" font-size="26" font-family="${c.font}" font-weight="${c.weight}" fill="${c.fg}">${xmlEscape(label)}</text></g>`;
    sx += w + 14;
  });
  const bottom = scraps.length > 0 ? sy + 76 : 262;
  const height = bottom + 120;
  let body = `<g transform="rotate(-0.8 450 250)"><rect x="60" y="34" width="780" height="${height - 70}" fill="${sheet}"/>`;
  body += letters + scrapMarkup;
  body += `<rect x="90" y="${bottom + 4}" width="${Math.min(700, profile.login.length * 15 + 150)}" height="32" fill="#1b1b1b"/>`;
  body += text(`NOTE FROM @${profile.login.toUpperCase()}`, 104, bottom + 26, 15, '#f3e9c9', 'class="mono" letter-spacing="3" font-weight="700"');
  body += `</g>`;
  const css = riseCss(motion) + (motion ? `.cut{animation:stick .4s ease-out both}@keyframes stick{from{opacity:0;transform:scale(1.25)}}@media (prefers-reduced-motion:reduce){.cut{animation:none}}` : '');
  return svgDoc({ height, title: `${profile.name ?? profile.login} on GitHub, as a ransom note`, bg: table, radius: 14, css, body });
}

export const ransom: Template = imageTemplate('ransom', 'Ransom note', 'Your name cut from magazines, with your numbers pasted on as scraps.', ['creative', 'paper', 'fun'], ransomSvg, {
  extra: () => 'shown as a ransom note with letters cut from magazines',
});

export const paperTemplates: Template[] = [wanted, recipe, nutrition, postcard, ransom];
