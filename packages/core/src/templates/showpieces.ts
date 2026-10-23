import { asciiPortrait } from '../avatar';
import { busiestMonth, weeklyTotals } from '../contributions';
import { assetPath } from '../readme';
import { variantsFor, type Variant } from '../themes';
import type { Config, Output, Profile, Template } from '../types';
import { formatNumber, truncate, wrap, xmlEscape } from '../util';
import { PAD, W, enter, heatStrip, label, langBars, lookOf, mono, num, panel, portrait, riseCss, sans, shell, type Look } from './kit';
import { describeProfile, imageReadme, plural, seeded } from './shared';

/** Designs that each have a single, distinctive look, built from the shared kit. */

/** A font size that makes `text` fit `width` pixels, between `min` and `max`. */
export function fitSize(text: string, width: number, max: number, min = 18, factor = 0.6): number {
  return Math.max(min, Math.min(max, Math.floor(width / (Math.max(text.length, 1) * factor))));
}

const subline = (profile: Profile, config: Config, look: Look): string => {
  const parts = [`<tspan fill="${look.muted}">@${xmlEscape(profile.login)}</tspan>`];
  if (config.text.headline) parts.push(`<tspan fill="${look.accent}" font-weight="600">${xmlEscape(truncate(config.text.headline, 46))}</tspan>`);
  return parts.join(`<tspan fill="${look.muted}">  ·  </tspan>`);
};

function altFor(profile: Profile, config: Config, extra?: string): string {
  return describeProfile(profile, config, extra, { activity: true });
}

function build(
  id: string,
  name: string,
  description: string,
  tags: string[],
  svg: (profile: Profile, config: Config, variant: Variant) => string,
  needsAvatar = true,
): Template {
  return {
    id,
    name,
    description,
    tags,
    needsAvatar,
    render(profile, config): Output {
      const assets = variantsFor(config.theme).map((variant) => ({ path: assetPath(id, variant), content: svg(profile, config, variant) }));
      return { readme: imageReadme(profile, config, id, W, altFor(profile, config)), assets };
    },
  };
}

/* ------------------------------------------------------------------------------------------------ */
/* Cinematic: widescreen, letterboxed, widgets that move.                                           */
/* ------------------------------------------------------------------------------------------------ */

function cinematicSvg(profile: Profile, config: Config, variant: Variant): string {
  const look = lookOf(232, variant, profile);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const rand = seeded(`${profile.login}:cinema`);
  const bar = 34;
  const height = 470;
  const stageTop = bar;
  const stageBottom = height - bar;
  let step = 0;
  const next = () => step++ * 0.12;

  const dust = Array.from({ length: 16 }, (_v, i) => {
    const x = rand() * W;
    const y = stageTop + rand() * (stageBottom - stageTop);
    const delay = motion ? ` style="animation-delay:-${(rand() * 14).toFixed(1)}s"` : '';
    return `<circle class="dust" cx="${num(x)}" cy="${num(y)}" r="${num(0.8 + rand() * 1.6)}" fill="${look.fg}" fill-opacity="${num(0.1 + rand() * 0.25)}"${delay}/>`;
  }).join('');

  const name = profile.name ?? profile.login;
  const fs = fitSize(name, 430, 54, 26);
  const bio = config.text.bio ?? profile.bio;
  let title = `<text x="${PAD}" y="${stageTop + 124}" font-size="${fs}" font-weight="800" fill="${look.fg}">${xmlEscape(truncate(name, 26))}</text>`;
  title += `<text x="${PAD}" y="${stageTop + 124 + 30}" font-size="15" xml:space="preserve">${subline(profile, config, look)}</text>`;
  if (bio) wrap(bio, 46, 3).forEach((line, i) => (title += sans(line, PAD, stageTop + 192 + i * 21, look.fg, 'font-size="13.5" fill-opacity="0.78"')));
  title += label(look, 'NOW SHOWING', PAD, stageTop + 74);

  // Rings: the top languages, each drawn as a circle that fills to its share.
  let widgets = '';
  const rx = 520;
  if (blocks.has('languages') && profile.languages.length > 0) {
    const r = 29;
    const c = 2 * Math.PI * r;
    widgets += profile.languages.slice(0, 3).map((language, i) => {
      const cx = rx + 40 + i * 112;
      const cy = stageTop + 84;
      const target = c * (1 - language.percent / 100);
      const style = motion ? ` style="--c:${num(c)};animation-delay:${(0.4 + i * 0.25).toFixed(2)}s"` : '';
      return (
        `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${look.track}" stroke-width="7"/>` +
        `<circle class="ring" cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${i % 2 ? look.accent2 : look.accent}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${num(c)}" stroke-dashoffset="${num(target)}" transform="rotate(-90 ${cx} ${cy})"${style}/>` +
        mono(`${language.percent}%`, cx, cy + 4, look.fg, 'font-size="12" font-weight="700" text-anchor="middle"') +
        sans(truncate(language.name, 12), cx, cy + r + 22, look.muted, 'font-size="11.5" text-anchor="middle"')
      );
    }).join('');
  }
  // A line that draws itself: contributions per week.
  if (blocks.has('activity') && profile.contributions) {
    const weeks = weeklyTotals(profile.contributions.days);
    const peak = Math.max(...weeks, 1);
    const w = 340;
    const h = 64;
    const y0 = stageTop + 190;
    const pts = weeks.map((total, i) => `${i === 0 ? 'M' : 'L'}${num(rx + (i / Math.max(weeks.length - 1, 1)) * w)} ${num(y0 + h - (total / peak) * h)}`).join('');
    const month = busiestMonth(profile.contributions.days);
    widgets +=
      label(look, 'ACTIVITY', rx, y0 - 14) +
      `<path d="${pts}" fill="none" stroke="${look.accent}" stroke-width="2.2" stroke-linejoin="round" pathLength="1"${motion ? ' class="draw"' : ''}/>` +
      `<rect x="${rx}" y="${y0 + h + 1}" width="${w}" height="1" fill="${look.border}"/>` +
      mono(truncate(`${formatNumber(profile.contributions.total)} contributions${month ? `  ·  busiest ${month.name}` : ''}`, 56), rx, y0 + h + 22, look.muted, 'font-size="11.5"');
  }
  if (blocks.has('stats')) {
    const tiles: Array<[string, string]> = [[formatNumber(profile.totalStars), 'STARS'], [formatNumber(profile.followers), 'FOLLOWERS'], [formatNumber(profile.publicRepos), 'REPOS']];
    widgets += tiles.map(([value, caption], i) => {
      const x = rx + i * 116;
      const y = stageBottom - 78;
      return `<rect x="${x}" y="${y}" width="106" height="58" rx="10" fill="${look.panel}" stroke="${look.border}"/>` + sans(value, x + 14, y + 29, look.fg, 'font-size="20" font-weight="800"') + mono(caption, x + 14, y + 47, look.muted, 'font-size="9.5" letter-spacing="1"');
    }).join('');
  }

  const css =
    riseCss(motion) +
    (motion
      ? `.dust{animation:dust 14s linear infinite}@keyframes dust{from{transform:translateY(0)}to{transform:translateY(-46px)}}` +
        `.ring{animation:ring 1.4s cubic-bezier(.3,.7,.2,1) both}@keyframes ring{from{stroke-dashoffset:var(--c)}}` +
        `.draw{stroke-dasharray:1;animation:draw 2.4s ease-out .6s both}@keyframes draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}` +
        `.beam{animation:beam 9s ease-in-out infinite}@keyframes beam{0%{transform:translateX(-260px)}60%,100%{transform:translateX(1000px)}}` +
        `@media (prefers-reduced-motion:reduce){.dust,.ring,.draw,.beam{animation:none}.draw{stroke-dasharray:none}}`
      : '');
  const defs = `<linearGradient id="cb" x1="0" x2="1"><stop offset="0" stop-color="${look.fg}" stop-opacity="0"/><stop offset="0.5" stop-color="${look.fg}" stop-opacity="0.07"/><stop offset="1" stop-color="${look.fg}" stop-opacity="0"/></linearGradient>`;
  const letterbox = `<rect width="${W}" height="${bar}" fill="#000"/><rect y="${height - bar}" width="${W}" height="${bar}" fill="#000"/>` +
    mono(`@${profile.login}`, PAD, 22, '#9aa3b2', 'font-size="11" letter-spacing="2"') +
    mono(`github.com/${profile.login}`, W - PAD, height - 13, '#9aa3b2', 'font-size="11" text-anchor="end"');
  const body =
    `<clipPath id="stage"><rect y="${stageTop}" width="${W}" height="${stageBottom - stageTop}"/></clipPath>` +
    `<g clip-path="url(#stage)">${dust}<rect class="beam" x="0" y="${stageTop}" width="220" height="${stageBottom - stageTop}" fill="url(#cb)" transform="skewX(-18)"/></g>` +
    enter(title, motion, next()) +
    enter(widgets, motion, next()) +
    letterbox;
  return shell({ height, look, variant, title: `${name} (@${profile.login}) on GitHub`, css, defs, body, radius: 14, glow: [0.15, 0.4] });
}

/* ------------------------------------------------------------------------------------------------ */
/* Wow: a name with real depth, beside an ASCII portrait.                                            */
/* ------------------------------------------------------------------------------------------------ */

function wowSvg(profile: Profile, config: Config, variant: Variant): string {
  const look = lookOf(285, variant, profile);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const art = profile.avatar ? asciiPortrait(profile.avatar.grid, 34, variant) : [];
  const artLine = 9.4;
  const artW = art.length > 0 ? 200 : 0;
  const x0 = art.length > 0 ? PAD + artW + 40 : PAD;
  const room = W - PAD - x0;
  const word = truncate((profile.name ?? profile.login).toUpperCase(), 18);
  const fs = fitSize(word, room - 24, 76, 28, 0.66);
  const depth = 14;
  const baseY = PAD + 40 + fs;
  const layers = Array.from({ length: depth }, (_v, i) => {
    const k = depth - i; // furthest layer first, so nearer ones paint over it
    const shade = variant === 'dark' ? `hsl(${285 - k * 2}, 55%, ${14 + (depth - k) * 1.4}%)` : `hsl(${285 - k * 2}, 40%, ${70 - (depth - k) * 2}%)`;
    return `<text x="${num(x0 + k * 1.15)}" y="${num(baseY + k * 1.15)}" font-size="${fs}" font-weight="900" fill="${shade}">${xmlEscape(word)}</text>`;
  }).join('');
  const face = `<text x="${x0}" y="${baseY}" font-size="${fs}" font-weight="900" fill="${look.accent}">${xmlEscape(word)}</text><text x="${x0}" y="${baseY}" font-size="${fs}" font-weight="900" fill="none" stroke="${look.fg}" stroke-opacity="0.5" stroke-width="0.8">${xmlEscape(word)}</text>`;
  const wordmark = `<g${motion ? ' class="float"' : ''}>${layers}${face}</g>`;

  let y = baseY + depth + 38;
  let info = `<text x="${x0}" y="${y}" font-size="15" xml:space="preserve">${subline(profile, config, look)}</text>`;
  y += 28;
  const bio = config.text.bio ?? profile.bio;
  if (bio) wrap(bio, Math.floor(room / 7.4), 3).forEach((line) => { info += sans(line, x0, y, look.fg, 'font-size="13.5" fill-opacity="0.8"'); y += 20; });
  y += 14;
  if (blocks.has('stats')) {
    const facts: Array<[string, string]> = [['STARS', formatNumber(profile.totalStars)], ['FOLLOWERS', formatNumber(profile.followers)], ['REPOSITORIES', formatNumber(profile.publicRepos)]];
    facts.forEach(([k, v], i) => (info += mono(k, x0, y + i * 22, look.muted, 'font-size="11" letter-spacing="1.5"') + mono(v, x0 + 130, y + i * 22, look.fg, 'font-size="13" font-weight="700"')));
    y += 3 * 22;
  }
  if (blocks.has('languages') && profile.languages.length > 0) {
    info += mono(truncate(profile.languages.slice(0, 4).map((l) => `${l.name} ${l.percent}%`).join('  ·  '), Math.floor(room / 7.2)), x0, y + 6, look.accent2, 'font-size="12"');
    y += 26;
  }
  const artBlock = art.map((line, i) => `<text class="mono" x="${PAD}" y="${PAD + 12 + i * artLine}" font-size="9" fill="${look.accent2}" fill-opacity="0.85" xml:space="preserve">${xmlEscape(line)}</text>`).join('');
  const height = Math.max(PAD * 2 + art.length * artLine, y + PAD - 6, 300);
  const css = motion ? `.float{animation:float 7s ease-in-out infinite}@keyframes float{50%{transform:translate(3px,-5px)}}@media (prefers-reduced-motion:reduce){.float{animation:none}}` : '';
  return shell({ height, look, variant, title: `${profile.name ?? profile.login} (@${profile.login}) on GitHub`, css, body: artBlock + wordmark + info, glow: [0.7, 0.1] });
}

/* ------------------------------------------------------------------------------------------------ */
/* Signature: the name, written out.                                                                 */
/* ------------------------------------------------------------------------------------------------ */

function signatureSvg(profile: Profile, config: Config, variant: Variant): string {
  const look = lookOf(218, variant, profile);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const name = truncate(profile.name ?? profile.login, 22);
  const fs = fitSize(name, 520, 76, 34, 0.5);
  const hand = "'Segoe Script','Lucida Handwriting','Brush Script MT','Snell Roundhand','Apple Chancery',cursive";
  const baseY = PAD + 28 + fs;
  const bio = config.text.bio ?? profile.bio;
  const portraitSize = 46;
  let step = 0;
  const next = () => step++ * 0.12;

  const reveal = motion ? ` clip-path="url(#sig)"` : '';
  let head =
    portrait(profile, look, W - PAD - portraitSize, PAD + portraitSize + 6, portraitSize) +
    `<clipPath id="sig"><rect class="wipe" x="${PAD - 6}" y="${PAD}" width="640" height="${fs + 60}"/></clipPath>` +
    `<text x="${PAD}" y="${baseY}" font-family="${hand}" font-style="italic" font-size="${fs}" fill="${look.fg}"${reveal}>${xmlEscape(name)}</text>` +
    `<path class="flourish" d="M${PAD} ${baseY + 16}C${PAD + 120} ${baseY + 6} ${PAD + 260} ${baseY + 24} ${PAD + 420} ${baseY + 10}S${PAD + 560} ${baseY + 8} ${PAD + 600} ${baseY + 14}" fill="none" stroke="${look.accent}" stroke-width="2.4" stroke-linecap="round" pathLength="1"/>`;
  let y = baseY + 52;
  head += `<text x="${PAD}" y="${y}" font-size="15" xml:space="preserve">${subline(profile, config, look)}</text>`;
  y += 24;
  if (bio) wrap(bio, 78, 2).forEach((line) => { head += sans(line, PAD, y, look.fg, 'font-size="13.5" fill-opacity="0.78"'); y += 20; });
  y += 14;

  let widgets = '';
  if (blocks.has('stats')) {
    const tiles: Array<[string, string]> = [[formatNumber(profile.totalStars), 'STARS EARNED'], [formatNumber(profile.followers), 'FOLLOWERS'], [formatNumber(profile.publicRepos), 'REPOSITORIES'], [formatNumber(profile.following), 'FOLLOWING']];
    const w = (W - PAD * 2 - 3 * 14) / 4;
    widgets += tiles.map(([value, caption], i) => {
      const x = PAD + i * (w + 14);
      return panel(look, x, y, w, 78) + sans(value, x + 18, y + 40, look.fg, 'font-size="26" font-weight="800"') + mono(caption, x + 18, y + 62, look.muted, 'font-size="10" letter-spacing="1"');
    }).join('');
    y += 78 + 22;
  }
  const half = (W - PAD * 2 - 16) / 2;
  const row = y;
  let rowH = 0;
  if (blocks.has('activity') && profile.contributions) {
    const a = profile.contributions;
    const heat = heatStrip(look, a.days, PAD + 18, row + 44, half - 36);
    const h = 44 + heat.height + 38;
    widgets += panel(look, PAD, row, half, h) + label(look, 'ACTIVITY', PAD + 18, row + 28) + heat.markup + mono(truncate(`${formatNumber(a.total)} contributions  ·  streak ${plural(a.currentStreak, 'day')}`, 50), PAD + 18, row + 44 + heat.height + 22, look.muted, 'font-size="11.5"');
    rowH = Math.max(rowH, h);
  }
  if (blocks.has('languages') && profile.languages.length > 0) {
    const x = PAD + half + 16;
    const bars = langBars(look, profile.languages, x + 18, row + 44, half - 36, 4);
    const h = 44 + bars.height + 16;
    widgets += panel(look, x, row, half, Math.max(h, rowH || h)) + label(look, 'WRITTEN IN', x + 18, row + 28) + bars.markup;
    rowH = Math.max(rowH, h);
  }
  const height = (rowH > 0 ? row + rowH : y - 22 + 0) + PAD;
  const css =
    riseCss(motion) +
    (motion
      ? `.wipe{animation:wipe 2.2s steps(48,end) both}@keyframes wipe{from{width:0}}` +
        `.flourish{stroke-dasharray:1;animation:flo 1.4s ease-out 1.8s both}@keyframes flo{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}` +
        `@media (prefers-reduced-motion:reduce){.wipe,.flourish{animation:none}.flourish{stroke-dasharray:none}}`
      : '');
  return shell({ height: Math.max(height, 260), look, variant, title: `${profile.name ?? profile.login} (@${profile.login}) on GitHub`, css, body: head + enter(widgets, motion, next()) });
}

/* ------------------------------------------------------------------------------------------------ */
/* Cap tip: a thank-you with a hat that tips.                                                        */
/* ------------------------------------------------------------------------------------------------ */

function capTipSvg(profile: Profile, config: Config, variant: Variant): string {
  const look = lookOf(48, variant, profile);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const rand = seeded(`${profile.login}:cap`);
  const cx = W / 2;
  const cy = 168;
  const r = 62;

  const confetti = Array.from({ length: 28 }, (_v, i) => {
    const x = 30 + rand() * (W - 60);
    const y = 20 + rand() * 250;
    const colour = [look.accent, look.accent2, look.fg][i % 3]!;
    const delay = motion ? ` style="animation-delay:-${(rand() * 8).toFixed(1)}s"` : '';
    return `<rect class="conf" x="${num(x)}" y="${num(y)}" width="${num(4 + rand() * 4)}" height="${num(2 + rand() * 3)}" rx="1" fill="${colour}" fill-opacity="${num(0.3 + rand() * 0.4)}" transform="rotate(${num(rand() * 180)} ${num(x)} ${num(y)})"${delay}/>`;
  }).join('');

  // The hat: a flat board on a cap, with a tassel. It tips from the brim and comes back.
  const hat =
    `<g class="cap" style="transform-origin:${cx + 50}px ${cy - r + 6}px">` +
    `<path d="M${cx - 48} ${cy - r - 4}h96l-8 20q-40 12 -80 0z" fill="${look.panel}" stroke="${look.accent}" stroke-width="2"/>` +
    `<path d="M${cx} ${cy - r - 34}L${cx + 82} ${cy - r - 10}L${cx} ${cy - r + 10}L${cx - 82} ${cy - r - 10}Z" fill="${look.accent}"/>` +
    `<path d="M${cx + 66} ${cy - r - 5}v34" stroke="${look.accent2}" stroke-width="2.4" stroke-linecap="round"/><circle cx="${cx + 66}" cy="${cy - r + 31}" r="4" fill="${look.accent2}"/>` +
    `</g>`;

  const name = truncate(profile.name ?? profile.login, 26);
  const thanks: string[] = [];
  if (blocks.has('stats')) {
    if (profile.totalStars > 0) thanks.push(`${formatNumber(profile.totalStars)} ${profile.totalStars === 1 ? 'star' : 'stars'}`);
    if (profile.followers > 0) thanks.push(`${formatNumber(profile.followers)} ${profile.followers === 1 ? 'follower' : 'followers'}`);
  }
  const line = thanks.length > 0 ? `Thank you for ${thanks.join(' and ')}` : 'Thanks for stopping by';
  let text =
    `<text x="${cx}" y="${cy + r + 52}" text-anchor="middle" font-size="30" font-weight="800" fill="${look.fg}">${xmlEscape(name)}</text>` +
    `<text x="${cx}" y="${cy + r + 76}" text-anchor="middle" font-size="14" fill="${look.muted}">@${xmlEscape(profile.login)}</text>` +
    `<text x="${cx}" y="${cy + r + 112}" text-anchor="middle" font-size="19" font-weight="700" fill="${look.accent}">${xmlEscape(line)}</text>`;
  let height = cy + r + 150;
  if (blocks.has('languages') && profile.languages.length > 0) {
    const chips = profile.languages.slice(0, 5).map((l) => `${truncate(l.name, 14)}`);
    const widths = chips.map((c) => 26 + c.length * 7.4);
    const total = widths.reduce((s, w) => s + w, 0) + (chips.length - 1) * 8;
    let x = cx - total / 2;
    text += chips.map((c, i) => {
      const w = widths[i]!;
      const out = `<rect x="${num(x)}" y="${height - 14}" width="${num(w)}" height="28" rx="14" fill="${look.panel}" stroke="${look.border}"/>` + sans(c, x + w / 2, height + 5, look.fg, 'font-size="12.5" text-anchor="middle"');
      x += w + 8;
      return out;
    }).join('');
    height += 44;
  }
  height += PAD - 6;
  const css = motion
    ? `.cap{animation:tip 3.6s ease-in-out infinite}@keyframes tip{0%,55%,100%{transform:rotate(0) translateY(0)}20%{transform:rotate(-16deg) translateY(-6px)}35%{transform:rotate(-16deg) translateY(-6px)}}` +
      `.conf{animation:fall 8s linear infinite}@keyframes fall{from{transform:translateY(-14px)}to{transform:translateY(14px)}}` +
      `@media (prefers-reduced-motion:reduce){.cap,.conf{animation:none}}`
    : '';
  return shell({ height, look, variant, title: `${profile.name ?? profile.login} (@${profile.login}) on GitHub`, css, body: confetti + portrait(profile, look, cx, cy, r) + hat + text, glow: [0.5, 0.3] });
}

export const cinematic = build('cinematic', 'Cinematic', 'Animated widgets and full motion: a letterboxed title card with rings that fill, a line that draws itself and drifting light.', ['animated', 'dark', 'widescreen'], cinematicSvg);
export const wow = build('wow', 'Wow Profile', 'Your name as a deep, floating wordmark beside an ASCII portrait made from your own profile picture.', ['dark', 'ascii', 'wordmark'], wowSvg);
export const signature = build('signature', 'Signature Profile', 'Your name written out by hand, a flourish drawn under it, and your numbers set out like a letterhead.', ['animated', 'handwritten', 'stats'], signatureSvg);
export const captip = build('captip', 'Signature Cap Tip', 'A thank-you card: your picture with a hat that tips, confetti, and the stars and followers you have been given.', ['animated', 'thanks', 'playful'], capTipSvg);
