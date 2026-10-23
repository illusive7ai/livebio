import { FALLBACK_ACCENTS, accentColors } from '../color';
import { assetPath } from '../readme';
import { variantsFor, type Variant } from '../themes';
import type { Config, Output, Profile, Template } from '../types';
import { formatNumber, truncate, wrap, xmlEscape } from '../util';
import { gridOf, zapFraction } from './arcade';
import { PAD, W, enter, label, lookOf, mono, num, riseCss, sans, shell } from './kit';
import { fitSize } from './showpieces';
import { FONT_SERIF, describeProfile, imageReadme, seeded } from './shared';

/** Two designs that are mostly picture: generative art, and a dot matrix that is wiped away. */

function build(id: string, name: string, description: string, tags: string[], svg: (p: Profile, c: Config, v: Variant) => string, needsAvatar: boolean): Template {
  return {
    id,
    name,
    description,
    tags,
    needsAvatar,
    render(profile, config): Output {
      const assets = variantsFor(config.theme).map((variant) => ({ path: assetPath(id, variant), content: svg(profile, config, variant) }));
      return { readme: imageReadme(profile, config, id, W, describeProfile(profile, config, undefined, { activity: id === 'erased' })), assets };
    },
  };
}

/* ------------------------------------------------------------------------------------------------ */
/* Creative portfolio                                                                                */
/* ------------------------------------------------------------------------------------------------ */

function creativeSvg(profile: Profile, config: Config, variant: Variant): string {
  const tint = profile.avatar?.grid.tint;
  const colours = tint ? accentColors(tint, variant) : FALLBACK_ACCENTS[variant];
  const look = lookOf(tint ? 0 : 280, variant, profile);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const rand = seeded(`${profile.login}:art`);
  const pick = (i: number) => colours[i % colours.length]!;
  const art = 340;

  const drift = (): string => (motion ? ` class="dr" style="--dx:${num((rand() - 0.5) * 36)}px;--dy:${num((rand() - 0.5) * 28)}px;animation-duration:${num(14 + rand() * 14)}s"` : '');
  let shapes = '';
  for (let i = 0; i < 7; i++) shapes += `<circle${drift()} cx="${num(rand() * W)}" cy="${num(rand() * art)}" r="${num(50 + rand() * 100)}" fill="${pick(i)}" fill-opacity="${num(0.28 + rand() * 0.3)}"/>`;
  for (let i = 0; i < 5; i++) {
    const w = 120 + rand() * 150;
    const h = 36 + rand() * 54;
    const x = rand() * (W - w);
    const y = rand() * (art - h);
    shapes += `<rect${drift()} x="${num(x)}" y="${num(y)}" width="${num(w)}" height="${num(h)}" rx="${num(h / 2)}" fill="${pick(i + 2)}" fill-opacity="${num(0.3 + rand() * 0.25)}" transform="rotate(${num(rand() * 70 - 35)} ${num(x + w / 2)} ${num(y + h / 2)})"/>`;
  }
  for (let i = 0; i < 4; i++) {
    const r = 60 + rand() * 90;
    shapes += `<path${drift()} d="M${num(rand() * W)} ${num(rand() * art)}a${num(r)} ${num(r)} 0 0 1 ${num(r)} ${num(-r * 0.6)}" fill="none" stroke="${pick(i + 1)}" stroke-opacity="0.7" stroke-width="${num(5 + rand() * 9)}" stroke-linecap="round"/>`;
  }
  for (let i = 0; i < 26; i++) shapes += `<circle cx="${num(rand() * W)}" cy="${num(rand() * art)}" r="${num(1 + rand() * 2.2)}" fill="${look.fg}" fill-opacity="${num(0.25 + rand() * 0.4)}"/>`;

  // The name sits on a soft plate so it stays readable over any art.
  const name = truncate(profile.name ?? profile.login, 24);
  const fs = fitSize(name, 440, 50, 26, 0.58);
  const bio = config.text.bio ?? profile.bio;
  const tag = config.text.headline ? truncate(config.text.headline, 46) : bio ? truncate(bio, 60) : '';
  const plateH = tag ? 124 : 100;
  let plate =
    `<rect x="${PAD}" y="${art - plateH - 24}" width="520" height="${plateH}" rx="20" fill="${look.bg}" fill-opacity="0.78"/>` +
    sans(name, PAD + 26, art - plateH - 24 + 20 + fs, look.fg, `font-size="${fs}" font-weight="800"`) +
    sans(`@${profile.login}`, PAD + 26, art - plateH - 24 + 20 + fs + 26, look.muted, 'font-size="14"');
  if (tag) plate += sans(tag, PAD + 26, art - plateH - 24 + 20 + fs + 50, look.fg, 'font-size="13.5" fill-opacity="0.8"');

  // Languages as dabs of paint, bigger for a bigger share.
  let dabs = '';
  if (blocks.has('languages') && profile.languages.length > 0) {
    const shown = profile.languages.slice(0, 4);
    const w = 74 * shown.length + 14;
    dabs += `<rect x="${W - PAD - w}" y="${PAD - 12}" width="${w}" height="92" rx="18" fill="${look.bg}" fill-opacity="0.72"/>`;
    shown.forEach((l, i) => {
      const cx = W - PAD - 44 - i * 74;
      dabs += `<circle cx="${cx}" cy="${PAD + 22}" r="${num(8 + (l.percent / 100) * 18)}" fill="${pick(i)}"/>` + mono(truncate(l.name, 9), cx, PAD + 58, look.fg, 'font-size="10" text-anchor="middle"') + mono(`${l.percent}%`, cx, PAD + 71, look.muted, 'font-size="9.5" text-anchor="middle"');
    });
  }

  // Selected works: the top repositories, each in a frame.
  let works = '';
  let height = art + 24;
  const repos = blocks.has('projects') ? profile.topRepos.slice(0, 3) : [];
  if (repos.length > 0) {
    const gap = 16;
    const w = (W - PAD * 2 - gap * (repos.length - 1)) / repos.length;
    const top = art + 40;
    works += label(look, 'SELECTED WORKS', PAD, art + 22);
    works += repos.map((repo, i) => {
      const x = PAD + i * (w + gap);
      const desc = repo.description ? (wrap(repo.description, Math.floor((w - 40) / 6.2), 1)[0] ?? '') : '';
      return (
        `<rect x="${num(x)}" y="${top}" width="${num(w)}" height="112" rx="6" fill="${look.panel}" stroke="${pick(i)}" stroke-width="2.5"/>` +
        `<rect x="${num(x + 7)}" y="${top + 7}" width="${num(w - 14)}" height="98" rx="3" fill="none" stroke="${look.border}"/>` +
        `<text x="${num(x + 20)}" y="${top + 38}" font-family="${FONT_SERIF}" font-style="italic" font-size="18" fill="${look.fg}">${xmlEscape(truncate(repo.name, 22))}</text>` +
        (desc ? sans(desc, x + 20, top + 60, look.muted, 'font-size="12"') : '') +
        mono(`★ ${formatNumber(repo.stars)}   forks ${formatNumber(repo.forks)}`, x + 20, top + 88, look.fg, 'font-size="11.5"')
      );
    }).join('');
    height = top + 112 + PAD;
  }

  const css =
    riseCss(motion) +
    (motion ? `.dr{animation:dr 20s ease-in-out infinite}@keyframes dr{50%{transform:translate(var(--dx),var(--dy))}}@media (prefers-reduced-motion:reduce){.dr{animation:none}}` : '');
  const body = `<clipPath id="cl"><rect width="${W}" height="${art}"/></clipPath><g clip-path="url(#cl)">${shapes}</g>` + plate + dabs + enter(works, motion, 0.2);
  return shell({ height, look, variant, title: `${profile.name ?? profile.login} (@${profile.login}) on GitHub`, css, body, grid: false, glow: [0.5, 1] });
}

/* ------------------------------------------------------------------------------------------------ */
/* Erased                                                                                            */
/* ------------------------------------------------------------------------------------------------ */

function erasedSvg(profile: Profile, config: Config, variant: Variant): string {
  const look = lookOf(168, variant, profile);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const days = blocks.has('activity') && profile.contributions ? profile.contributions.days : [];
  const { cols, cells } = gridOf(days);
  const name = truncate(profile.name ?? profile.login, 20);
  const inner = W - PAD * 2;
  const top = PAD + 12;
  const step = cols > 0 ? Math.max(5, Math.min(18, Math.floor(inner / cols))) : 15;
  const band = 7 * step;
  const gx = PAD + (inner - cols * step) / 2;
  const fs = fitSize(name, inner, Math.floor(band * 1.05), 36, 0.6);
  const total = Math.max(cols * 0.15, 4) + 3;

  let css = riseCss(motion);
  let dots = '';
  let eraser = '';
  if (cols > 0) {
    // A dot grows with how busy the day was. Index 0 is unused: quiet days get a pin-prick below.
    const radius = [0, 0.3, 0.42, 0.54, 0.66].map((k) => k * step);
    const buckets = new Set<number>();
    dots = cells
      .map((c) => {
        const cx = gx + c.col * step + step / 2;
        const cy = top + c.row * step + step / 2;
        const r = c.count === 0 ? step * 0.1 : (radius[Math.min(4, Math.max(1, c.level || 1))] ?? 0.4 * step);
        const fill = c.count === 0 ? look.fg : c.level === 4 ? look.accent2 : look.accent;
        buckets.add(c.col);
        return `<circle${motion ? ` class="e e${c.col}"` : ''} cx="${num(cx)}" cy="${num(cy)}" r="${num(r)}" fill="${fill}" fill-opacity="${c.count === 0 ? 0.25 : 0.95}"/>`;
      })
      .join('');
    if (motion) {
      css += `.e{animation-duration:${num(total)}s;animation-iteration-count:infinite;animation-timing-function:linear}`;
      for (const col of [...buckets].sort((a, b) => a - b)) {
        const f = num(zapFraction(col, cols) * 100);
        css += `@keyframes er${col}{0%,${f}%{opacity:1}${num(Number(f) + 0.01)}%,99.9%{opacity:0}100%{opacity:1}}.e${col}{animation-name:er${col}}`;
      }
      css += `.er{animation:erase ${num(total)}s linear infinite}@keyframes erase{0%{transform:translateX(0)}88%{transform:translateX(${num(cols * step)}px)}100%{transform:translateX(0)}}`;
      css += `@media (prefers-reduced-motion:reduce){.e,.er{animation:none!important}}`;
      eraser = `<rect class="er" x="${num(gx - step * 1.2)}" y="${top - 8}" width="${num(step * 1.4)}" height="${band + 16}" rx="5" fill="${look.fg}" fill-opacity="0.9"/>`;
    }
  }
  const baseline = top + band * 0.5 + fs * 0.36;
  const big = `<text x="${W / 2}" y="${num(baseline)}" text-anchor="middle" font-size="${fs}" font-weight="900" fill="${look.fg}" fill-opacity="${cols > 0 ? 0.92 : 1}">${xmlEscape(name)}</text>`;

  let y = top + band + 44;
  let info = sans(name, PAD, y, look.fg, 'font-size="22" font-weight="800"');
  info += `<text x="${PAD}" y="${y + 24}" font-size="14" xml:space="preserve"><tspan fill="${look.muted}">@${xmlEscape(profile.login)}</tspan>${config.text.headline ? `<tspan fill="${look.muted}">  ·  </tspan><tspan fill="${look.accent}" font-weight="600">${xmlEscape(truncate(config.text.headline, 46))}</tspan>` : ''}</text>`;
  y += 24;
  const bio = config.text.bio ?? profile.bio;
  if (bio) {
    info += sans(truncate(bio, 84), PAD, y + 24, look.fg, 'font-size="13.5" fill-opacity="0.78"');
    y += 24;
  }
  if (blocks.has('stats')) {
    const facts = [`${formatNumber(profile.totalStars)} stars`, `${formatNumber(profile.followers)} followers`, `${formatNumber(profile.publicRepos)} repos`];
    if (profile.contributions && blocks.has('activity')) facts.push(`${formatNumber(profile.contributions.total)} contributions`);
    info += mono(facts.join('   ·   '), PAD, y + 30, look.muted, 'font-size="12.5"');
    y += 30;
  }
  if (cols === 0) {
    info += mono(blocks.has('activity') ? 'Your contribution dots appear here after the first automatic update.' : 'Turn on the activity section to see your contribution dots.', PAD, y + 28, look.muted, 'font-size="11.5"');
    y += 28;
  }
  return shell({ height: y + PAD, look, variant, title: `${profile.name ?? profile.login} (@${profile.login}) on GitHub`, css, body: big + dots + eraser + enter(info, motion, 0.15), glow: [0.5, 0.2] });
}

export const creative = build('creative', 'Creative Portfolio', 'Colourful work with a point of view: generative art drawn from your own picture’s colours, with your projects framed beneath it.', ['art', 'colourful', 'portfolio'], creativeSvg, true);
export const erased = build('erased', 'Erased', 'Expressive contribution activity: a field of dots, one for each day, wiped away by an eraser to reveal your name.', ['animated', 'dots', 'expressive'], erasedSvg, false);
