import type { Contributions } from '../types';
import { formatNumber, xmlEscape } from '../util';
import { plural } from '../templates/shared';
import { planSnake } from '../templates/snake';
import { CARD_WIDTH, LIVE_BADGE_CSS, cardBackground, label, liveBadge, num, svgDocument } from './frame';
import type { CellShape, LiveStyle } from './style';

const PAD = 44;
const ROWS = 7;
const MAX_STEP = 18;
/** Seconds the snake takes to cross one cell. */
export const STEP_SECONDS = 0.075;
/** Segments behind the head. A cell vanishes at most this many steps after the head reaches it. */
export const BODY = 5;
/** Cells are grouped by when they are eaten, which keeps the stylesheet small. */
export const BUCKET = 4;

export interface SnakeCardOptions {
  login: string;
  contributions: Contributions | undefined;
  style: LiveStyle;
  motion: boolean;
}

/** One cell in the style's shape, with its top-left corner at (x, y). */
export function cellShape(shape: CellShape, x: number, y: number, size: number, attrs: string, cls = ''): string {
  const c = cls ? ` class="${cls}"` : '';
  if (shape === 'round') {
    return `<circle${c} cx="${num(x + size / 2)}" cy="${num(y + size / 2)}" r="${num(size / 2)}" ${attrs}/>`;
  }
  if (shape === 'diamond') {
    const h = size / 2;
    const cx = x + h;
    const cy = y + h;
    return `<path${c} d="M${num(cx)} ${num(cy - h)}L${num(cx + h)} ${num(cy)}L${num(cx)} ${num(cy + h)}L${num(cx - h)} ${num(cy)}Z" ${attrs}/>`;
  }
  return `<rect${c} x="${num(x)}" y="${num(y)}" width="${num(size)}" height="${num(size)}" rx="${num(size * 0.22)}" ${attrs}/>`;
}

/** The snake and its graph as a card of its own, in the look of a template's preset. */
export function renderSnakeCard(opts: SnakeCardOptions): string {
  const { style, motion, contributions } = opts;
  const title = contributions
    ? `An animated snake crossing the contribution graph of @${opts.login}, eating the active days among ${contributions.total} contributions`
    : `A contribution snake for @${opts.login}, shown once contribution data is available`;

  if (!contributions || contributions.days.length === 0) {
    const height = 200;
    const bg = cardBackground(style, height, opts.login);
    const body =
      bg.markup +
      label(style, 'SNAKE TRAIL', PAD, 52) +
      `<text x="${CARD_WIDTH / 2}" y="${height / 2 + 4}" text-anchor="middle" font-size="16" font-weight="700" fill="${style.fg}">Your snake appears here</text>` +
      `<text x="${CARD_WIDTH / 2}" y="${height / 2 + 30}" text-anchor="middle" font-size="13" fill="${style.muted}">It crosses your contribution graph, which is added at your first automatic update.</text>`;
    return svgDocument(style, height, title, bg.defs, '', body);
  }

  const plan = planSnake(contributions.days);
  const sn = style.snake;
  const step = Math.min(MAX_STEP, Math.floor((CARD_WIDTH - PAD * 2) / (plan.cols + 1)));
  const cell = step - sn.gap;
  const gridW = plan.cols * step - sn.gap;
  const x0 = Math.round((CARD_WIDTH - gridW) / 2);
  const headerH = 96;
  const y0 = headerH + step + 8; // one row of room above the grid, for the snake's way back
  const height = y0 + ROWS * step + 70;
  const bg = cardBackground(style, height, opts.login);

  const at = (col: number, row: number): [number, number] => [x0 + col * step, y0 + row * step];
  const length = plan.path.length;
  const period = length * STEP_SECONDS;
  const opacities = [0, 0.3, 0.5, 0.75, 1];
  const glow = sn.glow ? ' filter="url(#snk-glow)"' : '';

  // Cells with activity are eaten as the head passes; each gets the time bucket in which it vanishes.
  const buckets = new Set<number>();
  const cells = plan.cells
    .map((c) => {
      const [x, y] = at(c.col, c.row);
      const active = c.count > 0;
      const attrs = active ? `fill="${sn.cellColor}" fill-opacity="${opacities[Math.min(4, Math.max(1, c.level || 1))]}"` : `fill="${sn.track}"`;
      let cls = '';
      if (active && motion) {
        const bucket = Math.floor(c.step / BUCKET);
        buckets.add(bucket);
        cls = `snk-c snk-e${bucket}`;
      }
      return cellShape(sn.cell, x, y, cell, attrs, cls);
    })
    .join('');

  // One head and BODY segments, all following the same route a step apart.
  const poseAt = (index: number): [number, number] => at(...(plan.path[((index % length) + length) % length] ?? [0, 0]));
  const segments = Array.from({ length: BODY + 1 }, (_v, i) => {
    const size = i === 0 ? cell : cell - Math.min(cell * 0.3, i * 0.6);
    const inset = (cell - size) / 2;
    const [px, py] = poseAt(BODY - i);
    const fill = i === 0 ? sn.head : sn.body;
    const opacity = i === 0 ? 1 : Math.max(0.35, 1 - i * 0.13);
    const delay = motion ? ` style="animation-delay:-${num((length - i) * STEP_SECONDS)}s"` : '';
    const shape = cellShape(sn.cell, inset, inset, size, `fill="${fill}" fill-opacity="${num(opacity)}"${glow}`);
    const eyes =
      i === 0 && cell >= 9
        ? `<circle cx="${num(cell * 0.32)}" cy="${num(cell * 0.42)}" r="${num(cell * 0.09)}" fill="${style.bgTop}"/><circle cx="${num(cell * 0.68)}" cy="${num(cell * 0.42)}" r="${num(cell * 0.09)}" fill="${style.bgTop}"/>`
        : '';
    return `<g class="snk-s" transform="translate(${px} ${py})"${delay}>${shape}${eyes}</g>`;
  });
  const snake = segments.reverse().join('');

  let css = motion ? LIVE_BADGE_CSS : '';
  if (motion) {
    const slither = Array.from({ length: length + 1 }, (_v, index) => {
      const [px, py] = poseAt(index);
      return `${num((index / length) * 100)}%{transform:translate(${px}px,${py}px)}`;
    }).join('');
    const eaten = [...buckets]
      .sort((a, b) => a - b)
      .map((bucket) => {
        const vanish = (((bucket + 1) * BUCKET - 1) / length) * 100; // inside the snake's body when it happens
        return `@keyframes snk-k${bucket}{0%,${num(vanish)}%{opacity:1}${num(vanish + 0.01)}%,100%{opacity:0}}.snk-e${bucket}{animation-name:snk-k${bucket}}`;
      })
      .join('');
    css +=
      `.snk-s{animation:snk-slither ${num(period)}s linear infinite}@keyframes snk-slither{${slither}}` +
      `.snk-c{animation-duration:${num(period)}s;animation-iteration-count:infinite;animation-timing-function:linear}` +
      eaten +
      `@media (prefers-reduced-motion:reduce){.snk-s,.snk-c,.lv-live{animation:none!important}}`;
  }

  const defs = bg.defs + (sn.glow ? `<filter id="snk-glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.600" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>` : '');

  let text = label(style, 'SNAKE TRAIL', PAD, 46);
  text += `<text x="${PAD}" y="76" font-size="22" font-weight="800" fill="${style.fg}">${xmlEscape(formatNumber(contributions.total))} contributions, one continuous run</text>`;
  text += liveBadge(style, CARD_WIDTH - PAD - 42, 46, motion);
  const capY = y0 + ROWS * step + 30;
  text += `<text class="mono" x="${PAD}" y="${capY}" font-size="12" fill="${style.muted}">${xmlEscape(`${plural(contributions.activeDays, 'active day')}  ·  current streak ${plural(contributions.currentStreak, 'day')}  ·  longest ${plural(contributions.longestStreak, 'day')}`)}</text>`;
  text += `<text class="mono" x="${CARD_WIDTH - PAD}" y="${capY}" text-anchor="end" font-size="11" fill="${style.muted}">@${xmlEscape(opts.login)}</text>`;

  return svgDocument(style, height, title, defs, css, bg.markup + text + cells + snake);
}
