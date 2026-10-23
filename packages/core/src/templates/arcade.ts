import { weeklyTotals } from '../contributions';
import { assetPath } from '../readme';
import { variantsFor, type Variant } from '../themes';
import type { Config, ContributionDay, Output, Profile, Template } from '../types';
import { formatNumber, truncate, xmlEscape } from '../util';
import { PAD, W, lookOf, mono, num, sans, shell, type Look } from './kit';
import { describeProfile, imageReadme, plural, seeded } from './shared';

/**
 * Three small games played on a person's real contribution calendar. Each is drawn from the days themselves,
 * so every active day is a target, an orb or a brick, and a quiet day is empty space.
 */

const ROWS = 7;
/** Seconds the whole loop takes per column, and the pause at the end. */
const SECONDS_PER_COLUMN = 0.16;
const HOLD_SECONDS = 3;

export interface GridCell {
  col: number;
  row: number;
  count: number;
  level: number;
}

/** The calendar as a grid: one column per week, one row per weekday. */
export function gridOf(days: ReadonlyArray<ContributionDay>): { cols: number; cells: GridCell[] } {
  if (days.length === 0) return { cols: 0, cells: [] };
  const first = new Date(`${days[0]?.date}T00:00:00Z`).getUTCDay();
  const cols = Math.ceil((first + days.length) / ROWS);
  const cells = days.map((day, index) => ({ col: Math.floor((first + index) / ROWS), row: (first + index) % ROWS, count: day.count, level: day.level }));
  return { cols, cells };
}

/** How far through the loop the ship has zapped column `col`, from 0 to 1. The sweep takes the first 88% of the loop. */
export function zapFraction(col: number, cols: number): number {
  return ((col + 1) / (cols + 1)) * 0.88;
}

export interface Orb {
  week: number;
  /** How far through the loop the jet reaches this week, 0 to 1. */
  at: number;
  total: number;
}

export interface RunnerPlan {
  weeks: number[];
  peak: number;
  /** Orbs for the weeks that had any activity. */
  orbs: Orb[];
}

export function planRunner(days: ReadonlyArray<ContributionDay>): RunnerPlan {
  const weeks = weeklyTotals(days);
  const peak = Math.max(...weeks, 1);
  const last = Math.max(weeks.length - 1, 1);
  const orbs = weeks.flatMap((total, week) => (total > 0 ? [{ week, at: (week / last) * 0.88, total }] : []));
  return { weeks, peak, orbs };
}

export interface BreakoutPlan {
  /** The ball's position at each step, in grid units. */
  path: Array<{ x: number; y: number }>;
  /** For each brick that gets hit, the step it happens on. */
  hits: Map<string, number>;
  cols: number;
  rows: number;
}

/**
 * A ball that crosses the board in a zigzag, rising into the bricks and falling back to the paddle. It passes
 * through every brick in its way, so the bricks it reaches are removed in the order it reaches them.
 */
export function planBreakout(days: ReadonlyArray<ContributionDay>): BreakoutPlan {
  const { cols, cells } = gridOf(days);
  const rows = ROWS + 4; // the bricks, then open space above the paddle
  const alive = new Set(cells.filter((c) => c.count > 0).map((c) => `${c.col},${c.row}`));
  const path: Array<{ x: number; y: number }> = [];
  const hits = new Map<string, number>();
  if (cols === 0) return { path, hits, cols, rows };
  let x = 0;
  let y = rows - 1;
  let dy = -1;
  const dx = 0.5;
  for (let step = 0; x <= cols - 0.5; step++) {
    path.push({ x, y });
    const key = `${Math.floor(x)},${Math.floor(y)}`;
    if (y < ROWS && alive.delete(key)) hits.set(key, step);
    x += dx;
    y += dy;
    
    if (y <= 0) dy = 1;
    if (y >= rows - 1) dy = -1;
    y = Math.min(rows - 1, Math.max(0, y));
  }
  return { path, hits, cols, rows };
}

type Game = 'shooter' | 'runner' | 'signal';

interface Spec {
  id: string;
  name: string;
  description: string;
  tags: string[];
  hue: number;
  game: Game;
}

interface Part {
  markup: string;
  css: string;
}

const INSET = PAD;

function telemetry(profile: Profile, blocks: Set<string>, look: Look, x: number, y: number, extra: string[] = []): string {
  const lines = [`@${profile.login}`];
  if (blocks.has('stats')) lines.push(`${formatNumber(profile.totalStars)} stars`, `${formatNumber(profile.followers)} followers`, `${formatNumber(profile.publicRepos)} repos`);
  lines.push(...extra);
  return lines.map((line, i) => mono(truncate(line, 30), x, y + i * 20, i === 0 ? look.fg : look.muted, `font-size="${i === 0 ? 14 : 12.5}"${i === 0 ? ' font-weight="700"' : ''}`)).join('');
}

function stars(look: Look, w: number, h: number, seed: string, motion: boolean): string {
  const rand = seeded(seed);
  return Array.from({ length: 70 }, (_v, i) => {
    const twinkle = motion && i % 4 === 0 ? ` class="tw" style="animation-delay:${(rand() * 3).toFixed(1)}s"` : '';
    return `<circle cx="${num(rand() * w)}" cy="${num(rand() * h)}" r="${num(0.5 + rand() * 1.1)}" fill="${look.fg}" fill-opacity="${num(0.2 + rand() * 0.5)}"${twinkle}/>`;
  }).join('');
}

/** SPACE SHOOTER: the ship sweeps along the bottom and zaps each column of active days. */
function shooter(profile: Profile, config: Config, look: Look, days: ReadonlyArray<ContributionDay>, y0: number, blocks: Set<string>): Part & { height: number } {
  const { cols, cells } = gridOf(days);
  const gx = 300;
  const gw = W - PAD - gx;
  const step = Math.max(4, Math.min(12, Math.floor(gw / cols)));
  const cell = step - 2;
  const motion = config.motion;
  const total = cols * SECONDS_PER_COLUMN + HOLD_SECONDS;
  const gridW = cols * step;
  const top = y0 + 14;
  const shipY = top + ROWS * step + 46;
  const height = shipY + 30 - y0;
  const opacities = [0, 0.3, 0.5, 0.75, 1];
  const buckets = new Set<number>();

  const grid = cells
    .map((c) => {
      const x = gx + c.col * step;
      const y = top + c.row * step;
      if (c.count === 0) return `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="1.5" fill="${look.track}"/>`;
      buckets.add(c.col);
      const cls = motion ? ` class="z z${c.col}"` : '';
      return `<rect${cls} x="${x}" y="${y}" width="${cell}" height="${cell}" rx="2" fill="${look.accent}" fill-opacity="${opacities[Math.min(4, Math.max(1, c.level))]}"/>`;
    })
    .join('');

  const shipX = (col: number) => gx + col * step + cell / 2;
  const ship = (x: number) => `M${num(x)} ${shipY - 14}l9 20h-18z`;
  let css = '';
  let beams = '';
  let ships = `<path d="${ship(shipX(0))}" fill="${look.fg}"/><path d="M${num(shipX(0) - 4)} ${shipY + 6}h8l-4 7z" fill="${look.accent2}"/>`;
  if (motion) {
    const f = (col: number) => num(zapFraction(col, cols) * 100);
    css += `.ship{animation:ar-fly ${num(total)}s linear infinite}@keyframes ar-fly{0%{transform:translateX(0)}88%{transform:translateX(${num(gridW - step)}px)}100%{transform:translateX(0)}}`;
    css += `.z{animation-duration:${num(total)}s;animation-iteration-count:infinite;animation-timing-function:linear}`;
    css += `.bm{opacity:0;animation-duration:${num(total)}s;animation-iteration-count:infinite;animation-timing-function:linear}`;
    for (const col of [...buckets].sort((a, b) => a - b)) {
      css += `@keyframes ar-z${col}{0%,${f(col)}%{opacity:1}${num(Number(f(col)) + 0.01)}%,99.9%{opacity:0}100%{opacity:1}}.z${col}{animation-name:ar-z${col}}`;
      css += `@keyframes ar-b${col}{0%,${num(Number(f(col)) - 0.6)}%{opacity:0}${f(col)}%{opacity:1}${num(Number(f(col)) + 1.2)}%,100%{opacity:0}}.b${col}{animation-name:ar-b${col}}`;
      beams += `<rect class="bm b${col}" x="${num(shipX(col) - 0.75)}" y="${top - 6}" width="1.5" height="${shipY - 16 - top + 6}" fill="${look.accent2}"/>`;
    }
    css += `.tw{animation:ar-tw 2.4s ease-in-out infinite}@keyframes ar-tw{50%{opacity:.15}}@media (prefers-reduced-motion:reduce){.ship,.z,.bm,.tw{animation:none!important}.bm{opacity:0}}`;
    ships = `<g class="ship">${ships}</g>`;
  }
  const label = mono('TELEMETRY', INSET, y0 + 22, look.accent, 'font-size="11.5" font-weight="700" letter-spacing="2"');
  const markup =
    stars(look, W, 400, `${profile.login}:shooter`, motion) +
    label +
    telemetry(profile, blocks, look, INSET, y0 + 48, profile.contributions ? [`${formatNumber(profile.contributions.total)} shots`] : []) +
    grid +
    beams +
    ships;
  return { markup, css, height };
}

/** JET RUNNER: weekly terrain along the bottom; the jet flies over it and collects an orb for each active week. */
function runner(profile: Profile, config: Config, look: Look, days: ReadonlyArray<ContributionDay>, y0: number, blocks: Set<string>): Part & { height: number } {
  const plan = planRunner(days);
  const motion = config.motion;
  const n = plan.weeks.length;
  const x0 = PAD;
  const gw = W - PAD * 2;
  const bar = gw / n;
  const base = y0 + 190;
  const terrainH = (total: number) => 8 + (total / plan.peak) * 70;
  const jetY = (week: number) => {
    const near = [-2, -1, 0, 1, 2].map((d) => plan.weeks[week + d] ?? 0);
    return base - terrainH(Math.max(...near)) - 30;
  };
  const jetX = (week: number) => x0 + week * bar + bar / 2;
  const total = n * SECONDS_PER_COLUMN + HOLD_SECONDS;

  const terrain = plan.weeks
    .map((w, i) => `<rect x="${num(x0 + i * bar + 0.5)}" y="${num(base - terrainH(w))}" width="${num(Math.max(1, bar - 1))}" height="${num(terrainH(w))}" rx="1.5" fill="${look.accent}" fill-opacity="${w === 0 ? 0.08 : 0.28}"/>`)
    .join('');
  let css = '';
  const orbs = plan.orbs
    .map((o) => {
      const cls = motion ? ` class="o o${o.week}"` : '';
      if (motion) css += `@keyframes ar-o${o.week}{0%,${num(o.at * 100)}%{opacity:1}${num(o.at * 100 + 0.01)}%,99.9%{opacity:0}100%{opacity:1}}.o${o.week}{animation-name:ar-o${o.week}}`;
      return `<circle${cls} cx="${num(jetX(o.week))}" cy="${num(jetY(o.week) + 4)}" r="${num(3 + Math.min(3, o.total / plan.peak * 3))}" fill="${look.accent2}"/>`;
    })
    .join('');
  const jetShape = (x: number, y: number) => `<path d="M${num(x - 12)} ${num(y)}l24 -4l-8 -5v-5l-8 5l-12 -1z" fill="${look.fg}"/><circle cx="${num(x - 14)}" cy="${num(y - 2)}" r="3" fill="${look.accent}"/>`;
  let jet = jetShape(jetX(0), jetY(0));
  if (motion) {
    const stops = Array.from({ length: n }, (_v, w) => `${num((w / Math.max(n - 1, 1)) * 88)}%{transform:translate(${num(jetX(w) - jetX(0))}px,${num(jetY(w) - jetY(0))}px)}`).join('');
    css += `.jet{animation:ar-jet ${num(total)}s linear infinite}@keyframes ar-jet{${stops}100%{transform:translate(0,0)}}`;
    css += `.o{animation-duration:${num(total)}s;animation-iteration-count:infinite;animation-timing-function:linear}`;
    css += `@media (prefers-reduced-motion:reduce){.jet,.o{animation:none!important}}`;
    jet = `<g class="jet">${jet}</g>`;
  }
  const height = base - y0 + 36;
  const markup =
    mono('JET RUNNER', PAD, y0 + 22, look.accent, 'font-size="11.5" font-weight="700" letter-spacing="2"') +
    mono(truncate([`@${profile.login}`, blocks.has('stats') ? `${formatNumber(profile.totalStars)} stars` : '', profile.contributions ? `${formatNumber(profile.contributions.total)} contributions` : ''].filter(Boolean).join('  ·  '), 80), PAD, y0 + 44, look.muted, 'font-size="12.5"') +
    terrain +
    orbs +
    jet +
    `<rect x="${PAD}" y="${base + 1}" width="${gw}" height="1" fill="${look.border}"/>` +
    mono(`${plural(plan.orbs.length, 'active week')} collected on the run`, PAD, base + 22, look.muted, 'font-size="11.5"');
  return { markup, css, height };
}

/** PLAYABLE SIGNAL: a breakout ball clears the bricks, which are the active days. */
function signal(profile: Profile, config: Config, look: Look, days: ReadonlyArray<ContributionDay>, y0: number, blocks: Set<string>): Part & { height: number } {
  const plan = planBreakout(days);
  const { cells } = gridOf(days);
  const motion = config.motion;
  const gx = 30 + 250;
  const gw = W - PAD - gx;
  const step = Math.max(4, Math.min(12, Math.floor(gw / plan.cols)));
  const cell = step - 2;
  const top = y0 + 14;
  const bottom = top + plan.rows * step;
  const steps = plan.path.length;
  const total = Math.max(steps * 0.06, 4) + HOLD_SECONDS;
  const opacities = [0, 0.3, 0.5, 0.75, 1];
  const px = (x: number) => gx + x * step;
  const py = (y: number) => top + y * step;

  let css = '';
  const buckets = new Set<number>();
  const bricks = cells
    .map((c) => {
      const x = px(c.col);
      const y = py(c.row);
      if (c.count === 0) return `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="1" fill="${look.track}" fill-opacity="0.6"/>`;
      const hit = plan.hits.get(`${c.col},${c.row}`);
      let cls = '';
      if (motion && hit !== undefined) {
        const bucket = Math.floor(hit / 4);
        buckets.add(bucket);
        cls = ` class="k k${bucket}"`;
      }
      return `<rect${cls} x="${x}" y="${y}" width="${cell}" height="${cell}" rx="1" fill="${c.level === 4 ? look.accent2 : look.accent}" fill-opacity="${opacities[Math.min(4, Math.max(1, c.level))]}"/>`;
    })
    .join('');
  const ballAt = (i: number) => plan.path[Math.min(i, steps - 1)] ?? { x: 0, y: plan.rows - 1 };
  let ball = `<circle cx="${num(px(ballAt(0).x))}" cy="${num(py(ballAt(0).y))}" r="3.2" fill="${look.fg}"/>`;
  let paddle = `<rect x="${num(px(0) - 14)}" y="${num(bottom + 4)}" width="30" height="5" rx="2.5" fill="${look.accent}"/>`;
  if (motion && steps > 1) {
    const frames = (f: (p: { x: number; y: number }) => string) => plan.path.map((p, i) => `${num((i / (steps - 1)) * 88)}%{transform:translate(${f(p)})}`).join('');
    const first = ballAt(0);
    css += `.ball{animation:ar-ball ${num(total)}s linear infinite}@keyframes ar-ball{${frames((p) => `${num((p.x - first.x) * step)}px,${num((p.y - first.y) * step)}px`)}100%{transform:translate(0,0)}}`;
    css += `.pad{animation:ar-pad ${num(total)}s linear infinite}@keyframes ar-pad{${frames((p) => `${num((p.x - first.x) * step)}px,0`)}100%{transform:translate(0,0)}}`;
    css += `.k{animation-duration:${num(total)}s;animation-iteration-count:infinite;animation-timing-function:linear}`;
    for (const bucket of [...buckets].sort((a, b) => a - b)) {
      const at = (((bucket * 4 + 3) / (steps - 1)) * 88).toFixed(2);
      css += `@keyframes ar-k${bucket}{0%,${at}%{opacity:1}${num(Number(at) + 0.01)}%,99.9%{opacity:0}100%{opacity:1}}.k${bucket}{animation-name:ar-k${bucket}}`;
    }
    css += `@media (prefers-reduced-motion:reduce){.ball,.pad,.k{animation:none!important}}`;
    ball = `<g class="ball">${ball}</g>`;
    paddle = `<g class="pad">${paddle}</g>`;
  }
  const hud = [
    mono('PLAYABLE SIGNAL', PAD, y0 + 22, look.accent, 'font-size="11.5" font-weight="700" letter-spacing="2"'),
    mono(`PLAYER  @${truncate(profile.login, 18)}`, PAD, y0 + 52, look.fg, 'font-size="13" font-weight="700"'),
    profile.contributions ? mono(`SCORE   ${formatNumber(profile.contributions.total)}`, PAD, y0 + 74, look.muted, 'font-size="12.5"') : '',
    profile.contributions ? mono(`STREAK  ${profile.contributions.currentStreak}`, PAD, y0 + 94, look.muted, 'font-size="12.5"') : '',
    blocks.has('stats') ? mono(`STARS   ${formatNumber(profile.totalStars)}`, PAD, y0 + 114, look.muted, 'font-size="12.5"') : '',
  ].join('');
  const height = bottom + 24 - y0;
  return { markup: hud + bricks + ball + paddle, css, height };
}

const SPECS: Spec[] = [
  { id: 'spaceshooter', name: 'Space Shooter', description: 'Terminal telemetry and a ship that zaps your active days, column by column, then starts over.', tags: ['animated', 'game', 'space'], hue: 262, game: 'shooter' },
  { id: 'jetrunner', name: 'Jet Runner', description: 'A jet flies your year as terrain, one bar per week, and collects an orb for every week you were active.', tags: ['animated', 'game', 'sky'], hue: 18, game: 'runner' },
  { id: 'playablesignal', name: 'Playable Signal', description: 'Your contribution days as bricks and a ball clearing them: a tiny arcade cabinet for your activity.', tags: ['animated', 'game', 'arcade'], hue: 140, game: 'signal' },
];

function renderSvg(spec: Spec, profile: Profile, config: Config, variant: Variant): string {
  const look = lookOf(spec.hue, variant, profile);
  const blocks = new Set<string>(config.blocks);
  const days = blocks.has('activity') && profile.contributions ? profile.contributions.days : [];
  const y0 = PAD;
  let part: Part & { height: number };
  if (days.length === 0) {
    // No calendar to play on: say so, and show what we do know.
    const name = spec.name.toUpperCase();
    const height = 190;
    part = {
      markup:
        mono(name, PAD, y0 + 22, look.accent, 'font-size="11.5" font-weight="700" letter-spacing="2"') +
        telemetry(profile, blocks, look, PAD, y0 + 52) +
        sans(blocks.has('activity') ? 'Your game appears here' : 'Turn on the activity section to play', 360, y0 + 70, look.fg, 'font-size="18" font-weight="700"') +
        sans(blocks.has('activity') ? 'It is played on your contribution calendar, added at your first automatic update.' : 'The game is drawn from your contribution calendar.', 360, y0 + 94, look.muted, 'font-size="12.5"'),
      css: '',
      height,
    };
  } else if (spec.game === 'shooter') part = shooter(profile, config, look, days, y0, blocks);
  else if (spec.game === 'runner') part = runner(profile, config, look, days, y0, blocks);
  else part = signal(profile, config, look, days, y0, blocks);
  const head = `<text x="${W - PAD}" y="${y0 + part.height + 8}" text-anchor="end" class="mono" font-size="11" fill="${look.muted}">${xmlEscape(profile.name ?? profile.login)}</text>`;
  const height = y0 + part.height + PAD - 6;
  return shell({
    height,
    look,
    variant,
    title: `${spec.name}: ${profile.name ?? profile.login} (@${profile.login}) as a game on their contribution calendar`,
    css: part.css,
    body: part.markup + head,
    glow: [0.5, 1],
  });
}

function templateOf(spec: Spec): Template {
  return {
    id: spec.id,
    name: spec.name,
    description: spec.description,
    tags: spec.tags,
    needsAvatar: false,
    render(profile, config): Output {
      const assets = variantsFor(config.theme).map((variant) => ({ path: assetPath(spec.id, variant), content: renderSvg(spec, profile, config, variant) }));
      return { readme: imageReadme(profile, config, spec.id, W, describeProfile(profile, config, `played as ${spec.name.toLowerCase()} on a contribution calendar`, { activity: true })), assets };
    },
  };
}

export const arcadeTemplates = SPECS.map(templateOf);
