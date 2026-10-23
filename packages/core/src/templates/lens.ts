import { busiestMonth } from '../contributions';
import { assetPath } from '../readme';
import { variantsFor, type Variant } from '../themes';
import type { BlockId, Config, Output, Profile, RepoSummary, Template } from '../types';
import { formatNumber, truncate, wrap, xmlEscape } from '../util';
import {
  PAD,
  REPO_ROW,
  W,
  enter,
  heatStrip,
  label,
  langBars,
  lookOf,
  mono,
  num,
  panel,
  portrait,
  repoRow,
  riseCss,
  sans,
  shell,
  weekBars,
  type Look,
} from './kit';
import { describeProfile, imageReadme, plural, seeded } from './shared';

/**
 * A "lens" is a profile page that looks at the same public data from one angle: web interfaces, services,
 * infrastructure, community reach, and so on. A lens only says what the data supports. It counts repositories
 * by their main language and never names a job title, so a person is not labelled with a role GitHub never
 * recorded.
 */

export interface Fact {
  label: string;
  value: string;
}

export interface Section {
  title: string;
  repos?: RepoSummary[];
  checks?: string[];
  text?: string;
}

export interface Plan {
  /** A small line above the name, only when the data backs it up. */
  kicker?: string;
  /** The one big number. */
  hero?: Fact;
  facts: Fact[];
  sections: Section[];
}

export type Motif =
  | 'swatches'
  | 'pipeline'
  | 'scatter'
  | 'racks'
  | 'rocket'
  | 'spot'
  | 'rings'
  | 'tree'
  | 'rhythm'
  | 'checks'
  | 'sweep'
  | 'columns';

export interface LensSpec {
  id: string;
  name: string;
  description: string;
  tags: string[];
  /** The design's own hue. The second accent follows the profile picture. */
  hue: number;
  layout: 'dash' | 'board';
  motif: Motif;
  /** Adds a sweeping light and pulsing marks. */
  animated?: boolean;
  plan(profile: Profile, config: Config): Plan;
}

interface Ctx {
  profile: Profile;
  config: Config;
  look: Look;
  variant: Variant;
  motion: boolean;
  blocks: Set<BlockId>;
  plan: Plan;
  spec: LensSpec;
}

/** A faint drawing behind the header, different for each lens. */
function motif(c: Ctx, x: number, y: number, w: number, h: number): string {
  const { look, motion } = c;
  const rand = seeded(`${c.profile.login}:${c.spec.id}`);
  const o = 'opacity="0.55"';
  switch (c.spec.motif) {
    case 'swatches':
      return [0, 1, 2, 3, 4]
        .map((i) => `<rect x="${num(x + w - 40 - i * 46)}" y="${num(y + 10 + (i % 2) * 14)}" width="34" height="34" rx="9" fill="${i % 2 ? look.accent2 : look.accent}" fill-opacity="${num(0.18 + i * 0.12)}"/>`)
        .join('');
    case 'pipeline': {
      const xs = [0, 1, 2, 3].map((i) => x + w - 220 + i * 70);
      const cy = y + h / 2;
      const dot = motion ? `<circle r="4" fill="${look.accent2}"><animateMotion dur="4s" repeatCount="indefinite" path="M${xs[0]} ${cy}L${xs[3]} ${cy}"/></circle>` : '';
      return `<path d="M${xs[0]} ${cy}L${xs[3]} ${cy}" stroke="${look.border}" stroke-width="2" stroke-dasharray="4 5"/>` + xs.map((px) => `<rect x="${px - 9}" y="${cy - 9}" width="18" height="18" rx="5" fill="${look.panel}" stroke="${look.accent}"/>`).join('') + dot;
    }
    case 'scatter':
      return (
        Array.from({ length: 26 }, (_v, i) => {
          const px = x + w - 250 + (i / 25) * 240;
          const py = y + h - 14 - (i / 25) * (h - 40) - rand() * 34;
          return `<circle cx="${num(px)}" cy="${num(py)}" r="${num(2 + rand() * 2.5)}" fill="${i % 3 ? look.accent : look.accent2}" fill-opacity="0.5"/>`;
        }).join('') + `<path d="M${x + w - 250} ${y + h - 14}L${x + w - 10} ${y + 22}" stroke="${look.accent}" stroke-opacity="0.35" stroke-dasharray="3 4"/>`
      );
    case 'racks':
      return [0, 1, 2, 3]
        .map((i) => {
          const py = y + 8 + i * 22;
          const led = motion ? ` style="animation-delay:${(i * 0.4).toFixed(1)}s"` : '';
          return `<rect x="${x + w - 230}" y="${py}" width="220" height="16" rx="4" fill="${look.panel}" stroke="${look.border}"/><circle class="pulse" cx="${x + w - 216}" cy="${py + 8}" r="3" fill="${i % 2 ? look.accent2 : look.accent}"${led}/>`;
        })
        .join('');
    case 'rocket':
      return (
        Array.from({ length: 9 }, (_v, i) => `<circle cx="${num(x + w - 230 + i * 20)}" cy="${num(y + h - 20 - i * 7)}" r="${num(1.5 + i * 0.35)}" fill="${look.accent}" fill-opacity="${num(0.12 + i * 0.07)}"/>`).join('') +
        `<path d="M${x + w - 36} ${y + h - 88}l12 30l-12 -7l-12 7z" fill="${look.accent2}" fill-opacity="0.7"/>`
      );
    case 'spot':
      return [70, 48, 26].map((r, i) => `<circle cx="${x + w - 90}" cy="${y + h / 2}" r="${r}" fill="none" stroke="${i === 2 ? look.accent2 : look.accent}" stroke-opacity="${num(0.18 + i * 0.12)}"/>`).join('') + `<circle cx="${x + w - 90}" cy="${y + h / 2}" r="7" fill="${look.accent2}" fill-opacity="0.8"/>`;
    case 'rings':
      return [60, 42, 24].map((r) => `<circle cx="${x + w - 90}" cy="${y + h / 2}" r="${r}" fill="none" stroke="${look.accent2}" stroke-opacity="0.3" stroke-dasharray="3 5"/>`).join('') + [0, 1, 2].map((i) => `<circle cx="${num(x + w - 90 + Math.cos(i * 2.1) * 42)}" cy="${num(y + h / 2 + Math.sin(i * 2.1) * 42)}" r="4" fill="${look.accent}"/>`).join('');
    case 'tree': {
      const bx = x + w - 140;
      const by = y + h - 8;
      return `<path d="M${bx} ${by}V${y + 40}M${bx} ${y + 70}L${bx - 52} ${y + 30}M${bx} ${y + 56}L${bx + 52} ${y + 16}M${bx} ${y + 88}L${bx + 44} ${y + 60}" stroke="${look.accent}" stroke-opacity="0.45" stroke-width="2" fill="none"/>` + [[bx - 52, y + 30], [bx + 52, y + 16], [bx + 44, y + 60], [bx, y + 40]].map(([px, py]) => `<circle cx="${px}" cy="${py}" r="5" fill="${look.accent2}" fill-opacity="0.8"/>`).join('');
    }
    case 'rhythm': {
      const pts = Array.from({ length: 24 }, (_v, i) => `${i === 0 ? 'M' : 'L'}${num(x + w - 250 + i * 10.4)} ${num(y + h / 2 + Math.sin(i / 2.2) * 22 + (rand() - 0.5) * 10)}`);
      return `<path d="${pts.join('')}" fill="none" stroke="${look.accent}" stroke-width="2" stroke-opacity="0.5"/>`;
    }
    case 'checks':
      return [0, 1, 2, 3].map((i) => `<circle cx="${x + w - 200 + i * 52}" cy="${y + h / 2}" r="13" fill="none" stroke="${look.accent}" stroke-opacity="0.5"/><path d="M${x + w - 207 + i * 52} ${y + h / 2}l5 5l9 -10" fill="none" stroke="${look.accent2}" stroke-width="2" stroke-linecap="round"/>`).join('');
    case 'sweep':
      return `<rect x="${x + w - 250}" y="${y + 20}" width="240" height="${h - 40}" rx="12" fill="none" stroke="${look.border}"/>` + [0, 1, 2].map((i) => `<rect x="${x + w - 236}" y="${y + 36 + i * 22}" width="${150 - i * 30}" height="8" rx="4" fill="${i === 1 ? look.accent2 : look.accent}" fill-opacity="0.45"/>`).join('');
    case 'columns':
      return [0, 1, 2].map((i) => `<rect x="${x + w - 190 + i * 62}" y="${y + 14}" width="44" height="${h - 28}" rx="8" fill="none" stroke="${i === 1 ? look.accent : look.border}" stroke-dasharray="${i === 1 ? '0' : '4 4'}" ${o}/>`).join('');
  }
}

function sub(c: Ctx): string {
  const { profile, look, config } = c;
  const parts = [`<tspan fill="${look.muted}">@${xmlEscape(profile.login)}</tspan>`];
  if (config.text.headline) parts.push(`<tspan fill="${look.accent}" font-weight="600">${xmlEscape(truncate(config.text.headline, 44))}</tspan>`);
  return parts.join(`<tspan fill="${look.muted}">  ·  </tspan>`);
}

function activityCaption(profile: Profile): string | null {
  const a = profile.contributions;
  if (!a) return null;
  const month = busiestMonth(a.days);
  return [`${formatNumber(a.total)} contributions`, `streak ${plural(a.currentStreak, 'day')}`, month ? `busiest ${month.name}` : null].filter(Boolean).join('  ·  ');
}

/** The dashboard layout: identity, three panels side by side, then the projects. */
function dash(c: Ctx): { body: string; height: number } {
  const { profile, look, motion, blocks, plan, config } = c;
  const parts: string[] = [];
  let step = 0;
  const next = () => step++ * 0.09;

  const name = truncate(profile.name ?? profile.login, 28);
  const bio = config.text.bio ?? profile.bio;
  const textX = PAD + 38 * 2 + 26;
  const showStats = blocks.has('stats');
  let header = motif(c, 0, PAD - 10, W - PAD - 190, 118) + portrait(profile, look, PAD + 38, PAD + 40, 38);
  if (plan.kicker) header += label(look, plan.kicker, textX, PAD + 8);
  header += sans(name, textX, PAD + 38, look.fg, 'font-size="28" font-weight="800"') + `<text x="${textX}" y="${PAD + 62}" font-size="14" xml:space="preserve">${sub(c)}</text>`;
  if (bio) header += sans(truncate(bio, 70), textX, PAD + 84, look.fg, 'font-size="13" fill-opacity="0.8"');
  if (showStats && plan.hero) {
    header += sans(plan.hero.value, W - PAD, PAD + 52, look.fg, 'font-size="46" font-weight="800" text-anchor="end"') + mono(plan.hero.label, W - PAD, PAD + 74, look.muted, 'font-size="10.5" letter-spacing="1" text-anchor="end"');
  }
  parts.push(enter(header, motion, next()));
  let cursor = PAD + 118;

  type Pane = { title: string; draw: (x: number, y: number, w: number) => string };
  const panes: Pane[] = [];
  if (showStats && plan.facts.length > 0) {
    panes.push({
      title: 'SIGNAL',
      draw: (x, y) => plan.facts.slice(0, 3).map((f, i) => sans(f.value, x, y + 22 + i * 44, look.fg, 'font-size="24" font-weight="800"') + mono(f.label, x, y + 38 + i * 44, look.muted, 'font-size="10" letter-spacing="1"')).join(''),
    });
  }
  if (blocks.has('languages') && profile.languages.length > 0) {
    panes.push({ title: 'STACK', draw: (x, y, w) => langBars(look, profile.languages, x, y + 2, w, 4).markup });
  }
  if (blocks.has('activity') && profile.contributions) {
    const a = profile.contributions;
    panes.push({
      title: 'RHYTHM',
      draw: (x, y, w) => weekBars(look, a.days, x, y + 4, w, 78, motion) + mono(`${formatNumber(a.total)} contributions`, x, y + 112, look.fg, 'font-size="12" font-weight="700"') + mono(`streak ${plural(a.currentStreak, 'day')}, best ${plural(a.longestStreak, 'day')}`, x, y + 130, look.muted, 'font-size="11"'),
    });
  }
  if (panes.length > 0) {
    const gap = 16;
    const w = (W - PAD * 2 - gap * (panes.length - 1)) / panes.length;
    const h = 186;
    const markup = panes.map((p, i) => {
      const x = PAD + i * (w + gap);
      return panel(look, x, cursor, w, h) + label(look, p.title, x + 18, cursor + 28) + p.draw(x + 18, cursor + 44, w - 36);
    }).join('');
    parts.push(enter(markup, motion, next()));
    cursor += h + 24;
  }

  const repoSection = blocks.has('projects') ? plan.sections.find((s) => s.repos && s.repos.length > 0) : undefined;
  if (repoSection?.repos) {
    const rows = repoSection.repos.slice(0, 4);
    const markup = label(look, repoSection.title, PAD, cursor + 8) + rows.map((r, i) => repoRow(look, r, profile, PAD, cursor + 22 + i * REPO_ROW, W - PAD * 2)).join('');
    parts.push(enter(markup, motion, next()));
    cursor += 22 + rows.length * REPO_ROW + 14;
  }
  return { body: parts.join('\n'), height: Math.max(cursor - 14 + PAD, 300) };
}

/** The board layout: identity down the left, sections stacked on the right. */
function board(c: Ctx): { body: string; height: number } {
  const { profile, look, motion, blocks, plan, config } = c;
  const parts: string[] = [];
  let step = 0;
  const next = () => step++ * 0.09;
  const leftW = 290;
  const rightX = PAD + leftW + 30;
  const rightW = W - PAD - rightX;
  const showStats = blocks.has('stats');

  // Left column.
  let ly = PAD;
  let left = portrait(profile, look, PAD + 46, PAD + 46, 46);
  ly = PAD + 120;
  if (plan.kicker) {
    left += label(look, plan.kicker, PAD, ly - 6);
    ly += 18;
  }
  left += sans(truncate(profile.name ?? profile.login, 20), PAD, ly + 12, look.fg, 'font-size="26" font-weight="800"') + `<text x="${PAD}" y="${ly + 36}" font-size="13.5" xml:space="preserve">${sub(c)}</text>`;
  ly += 56;
  const bio = config.text.bio ?? profile.bio;
  if (bio) {
    wrap(bio, 38, 3).forEach((line, i) => (left += sans(line, PAD, ly + i * 18, look.fg, 'font-size="13" fill-opacity="0.8"')));
    ly += wrap(bio, 38, 3).length * 18 + 8;
  }
  if (showStats && plan.hero) {
    left += sans(plan.hero.value, PAD, ly + 46, look.fg, 'font-size="46" font-weight="800"') + mono(plan.hero.label, PAD, ly + 66, look.muted, 'font-size="10.5" letter-spacing="1"');
    ly += 90;
  }
  if (showStats) {
    plan.facts.slice(0, 3).forEach((f, i) => {
      left += mono(f.label, PAD, ly + 14 + i * 24, look.muted, 'font-size="10.5" letter-spacing="1"') + mono(f.value, PAD + leftW, ly + 14 + i * 24, look.fg, 'font-size="13" font-weight="700" text-anchor="end"') + `<rect x="${PAD}" y="${ly + 21 + i * 24}" width="${leftW}" height="1" fill="${look.border}"/>`;
    });
    ly += plan.facts.slice(0, 3).length * 24 + 12;
  }
  const motifTop = ly + 4;
  left = motif(c, PAD, motifTop, leftW + 20, 100) + left;
  ly = motifTop + 104;
  parts.push(enter(left, motion, next()));

  // Right column.
  let ry = PAD;
  for (const section of plan.sections) {
    let markup = '';
    let used = 0;
    if (section.repos && section.repos.length > 0 && blocks.has('projects')) {
      const rows = section.repos.slice(0, 5);
      markup = label(look, section.title, rightX, ry + 8) + rows.map((r, i) => repoRow(look, r, profile, rightX, ry + 22 + i * REPO_ROW, rightW)).join('');
      used = 22 + rows.length * REPO_ROW + 14;
    } else if (section.checks && section.checks.length > 0 && showStats) {
      const h = 22 + section.checks.length * 30 + 12;
      markup =
        label(look, section.title, rightX, ry + 8) +
        panel(look, rightX, ry + 18, rightW, h - 14 + 2, false) +
        section.checks.map((line, i) => `<circle cx="${rightX + 24}" cy="${ry + 44 + i * 30}" r="9" fill="${look.accent}" fill-opacity="0.18"/><path d="M${rightX + 19.5} ${ry + 44 + i * 30}l3.5 3.5l6 -7" fill="none" stroke="${look.accent}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>` + sans(truncate(line, 62), rightX + 44, ry + 48.5 + i * 30, look.fg, 'font-size="13.5"')).join('');
      used = h + 16;
    } else if (section.text) {
      const lines = wrap(section.text, Math.floor(rightW / 8), 3);
      markup = label(look, section.title, rightX, ry + 8) + lines.map((line, i) => sans(line, rightX, ry + 36 + i * 22, look.fg, 'font-size="16" font-weight="600"')).join('');
      used = 36 + lines.length * 22 + 10;
    }
    if (markup) {
      parts.push(enter(markup, motion, next()));
      ry += used;
    }
  }
  if (blocks.has('activity') && profile.contributions) {
    const heat = heatStrip(look, profile.contributions.days, rightX + 16, ry + 44, rightW - 32);
    const h = 44 + heat.height + 40;
    const caption = activityCaption(profile);
    const markup =
      label(look, 'ACTIVITY, PAST YEAR', rightX, ry + 8) +
      panel(look, rightX, ry + 18, rightW, h - 18, false) +
      heat.markup +
      (caption ? mono(truncate(caption, 80), rightX + 16, ry + 44 + heat.height + 22, look.muted, 'font-size="11.5"') : '');
    parts.push(enter(markup, motion, next()));
    ry += h + 8;
  }
  return { body: parts.join('\n'), height: Math.max(ly, ry) + PAD - 8 };
}

function renderSvg(spec: LensSpec, profile: Profile, config: Config, variant: Variant): string {
  const look = lookOf(spec.hue, variant, profile);
  const plan = spec.plan(profile, config);
  const c: Ctx = { profile, config, look, variant, motion: config.motion, blocks: new Set(config.blocks), plan, spec };
  const { body, height } = spec.layout === 'dash' ? dash(c) : board(c);
  const animated = spec.animated && config.motion;
  const sweep = animated
    ? `<rect class="sweep" x="-160" y="0" width="120" height="${height}" fill="url(#sw)"/>`
    : '';
  const css =
    riseCss(config.motion) +
    (config.motion
      ? `.pulse{animation:pulse 1.8s ease-in-out infinite}@keyframes pulse{50%{opacity:.25}}` +
        (animated ? `.sweep{animation:sweep 6s linear infinite}@keyframes sweep{to{transform:translateX(1100px)}}` : '') +
        `@media (prefers-reduced-motion:reduce){.pulse,.sweep{animation:none}}`
      : '');
  const defs = animated ? `<linearGradient id="sw" x1="0" x2="1"><stop offset="0" stop-color="${look.accent}" stop-opacity="0"/><stop offset="0.5" stop-color="${look.accent}" stop-opacity="0.12"/><stop offset="1" stop-color="${look.accent}" stop-opacity="0"/></linearGradient>` : '';
  return shell({
    height,
    look,
    variant,
    title: `${profile.name ?? profile.login} (@${profile.login}) on GitHub`,
    css,
    defs,
    body: body + sweep,
  });
}

/** Builds a template from a lens. */
export function lensTemplate(spec: LensSpec): Template {
  return {
    id: spec.id,
    name: spec.name,
    description: spec.description,
    tags: spec.tags,
    needsAvatar: true,
    render(profile, config): Output {
      const assets = variantsFor(config.theme).map((variant) => ({
        path: assetPath(spec.id, variant),
        content: renderSvg(spec, profile, config, variant),
      }));
      const projects = config.blocks.includes('projects') && profile.topRepos.length > 0 ? `top projects ${profile.topRepos.slice(0, 4).map((r) => r.name).join(', ')}` : undefined;
      return { readme: imageReadme(profile, config, spec.id, W, describeProfile(profile, config, projects, { activity: true })), assets };
    },
  };
}
