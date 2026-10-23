import { hslToHex, hueOf } from '../color';
import { assetPath } from '../readme';
import { variantsFor, type Variant } from '../themes';
import type { Config, ContributionDay, Output, Profile, Template } from '../types';
import { formatNumber, truncate, xmlEscape } from '../util';
import { FONT, FONT_SANS, describeProfile, imageReadme, plural, rise } from './shared';

const WIDTH = 900;
const PAD = 36;
const ROWS = 7;
const CELL = 11;
const STEP = 14;
/** Seconds the snake takes to cross one cell. */
const STEP_SECONDS = 0.075;
/** Segments behind the head. A cell vanishes at most this many steps after the head reaches it. */
const BODY = 5;
/** Cells are grouped by when they are eaten, which keeps the stylesheet small. */
const BUCKET = 4;

export interface SnakeCell {
  col: number;
  row: number;
  count: number;
  level: number;
  /** Which step of the path the head reaches this cell on. */
  step: number;
}

export interface SnakePlan {
  cols: number;
  /** Every position the head visits, in order. The path is a closed loop, so the last step is next to the first. */
  path: Array<[number, number]>;
  /** Days drawn on the grid. */
  cells: SnakeCell[];
}

/**
 * Plans the snake's route. It sweeps the grid one week at a time, down and then up, so it passes over
 * every cell. Then it goes round the outside, along the right edge and back across the top, so the
 * route ends beside where it started and the animation can repeat with no jump.
 */
export function planSnake(days: ReadonlyArray<ContributionDay>): SnakePlan {
  if (days.length === 0) return { cols: 0, path: [], cells: [] };
  const first = new Date(`${days[0]?.date}T00:00:00Z`).getUTCDay(); // weeks start on Sunday
  const cols = Math.ceil((first + days.length) / ROWS);

  const path: Array<[number, number]> = [];
  for (let col = 0; col < cols; col++) {
    for (let i = 0; i < ROWS; i++) path.push([col, col % 2 === 0 ? i : ROWS - 1 - i]);
  }
  const lastRow = path[path.length - 1]?.[1] ?? 0;
  path.push([cols, lastRow]);
  for (let row = lastRow - 1; row >= -1; row--) path.push([cols, row]);
  for (let col = cols - 1; col >= 0; col--) path.push([col, -1]);

  const stepOf = new Map<string, number>();
  path.forEach(([col, row], index) => stepOf.set(`${col},${row}`, index));

  const cells: SnakeCell[] = days.map((day, index) => {
    const col = Math.floor((first + index) / ROWS);
    const row = (first + index) % ROWS;
    return { col, row, count: day.count, level: day.level, step: stepOf.get(`${col},${row}`) ?? 0 };
  });
  return { cols, path, cells };
}

const num = (value: number): string => String(Math.round(value * 100) / 100 || 0);

interface Look {
  bgTop: string;
  bgBottom: string;
  fg: string;
  muted: string;
  track: string;
  body: string;
  head: string;
  cell: string;
}

function lookFor(variant: Variant, hue: number): Look {
  const dark = variant === 'dark';
  return {
    bgTop: dark ? hslToHex(hue, 0.35, 0.07) : hslToHex(hue, 0.4, 0.96),
    bgBottom: dark ? hslToHex(hue, 0.4, 0.12) : hslToHex(hue, 0.5, 0.9),
    fg: dark ? '#eef0ff' : '#1d2140',
    muted: dark ? '#9aa0c8' : '#5b6190',
    track: dark ? hslToHex(hue, 0.25, 0.2) : hslToHex(hue, 0.2, 0.84),
    cell: hslToHex(hue, 0.75, dark ? 0.58 : 0.45),
    body: hslToHex((hue + 55) % 360, 0.8, dark ? 0.6 : 0.42),
    head: hslToHex((hue + 55) % 360, 0.9, dark ? 0.72 : 0.34),
  };
}

function renderSvg(profile: Profile, config: Config, variant: Variant): string {
  const look = lookFor(variant, hueOf(profile.avatar?.grid.tint) ?? 130);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const parts: string[] = [];
  let step = 0;
  const next = () => step++ * 0.1;

  // Header: the name on the left and the headline numbers on the right.
  const subline = [profile.name ? `@${profile.login}` : '', config.text.headline ? truncate(config.text.headline, 46) : ''].filter(Boolean);
  let header = `<text x="${PAD}" y="${PAD + 24}" font-size="28" font-weight="800" fill="${look.fg}">${xmlEscape(truncate(profile.name ?? profile.login, 28))}</text>`;
  if (subline.length > 0) {
    header += `<text x="${PAD}" y="${PAD + 46}" font-size="14" fill="${look.muted}">${xmlEscape(subline.join('  ·  '))}</text>`;
  }
  if (blocks.has('stats')) {
    const stats: Array<[string, string]> = [
      [formatNumber(profile.publicRepos), 'REPOS'],
      [formatNumber(profile.totalStars), 'STARS'],
      [formatNumber(profile.followers), 'FOLLOWERS'],
    ];
    stats.forEach(([value, caption], index) => {
      const x = WIDTH - PAD - (stats.length - 1 - index) * 104;
      header +=
        `<text x="${x}" y="${PAD + 22}" text-anchor="end" font-size="22" font-weight="800" fill="${look.fg}">${xmlEscape(value)}</text>` +
        `<text class="mono" x="${x}" y="${PAD + 40}" text-anchor="end" font-size="10" letter-spacing="1.2" fill="${look.muted}">${caption}</text>`;
    });
  }
  parts.push(rise(header, motion, next()));
  let cursor = PAD + 64;

  const wantsGrid = blocks.has('activity');
  const activity = profile.contributions;
  const plan = planSnake(activity?.days ?? []);
  let css = '';

  if (wantsGrid && activity && plan.cols > 0) {
    const gridWidth = plan.cols * STEP - (STEP - CELL);
    const x0 = Math.round((WIDTH - gridWidth) / 2);
    const y0 = cursor + STEP + 6; // one row of room above the grid for the snake's way back
    const at = (col: number, row: number): [number, number] => [x0 + col * STEP, y0 + row * STEP];

    const length = plan.path.length;
    const period = length * STEP_SECONDS;
    const levelOpacity = [0, 0.3, 0.5, 0.75, 1];

    // Cells. Those with activity are eaten as the head passes, so each gets the time bucket it vanishes in.
    const buckets = new Set<number>();
    const cells = plan.cells
      .map((cell) => {
        const [x, y] = at(cell.col, cell.row);
        const active = cell.count > 0;
        const fill = active ? `fill="${look.cell}" fill-opacity="${levelOpacity[Math.min(4, Math.max(1, cell.level || 1))]}"` : `fill="${look.track}"`;
        let cls = '';
        if (active && motion) {
          const bucket = Math.floor(cell.step / BUCKET);
          buckets.add(bucket);
          cls = ` class="c e${bucket}"`;
        }
        return `<rect${cls} x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2.5" ${fill}/>`;
      })
      .join('');

    // The snake: one head and BODY segments, all following the same route a step apart.
    const poseAt = (index: number): [number, number] => at(...(plan.path[((index % length) + length) % length] ?? [0, 0]));
    const segments = Array.from({ length: BODY + 1 }, (_v, i) => {
      const size = i === 0 ? CELL : CELL - Math.min(3, i * 0.5);
      const inset = (CELL - size) / 2;
      const [px, py] = poseAt(BODY - i); // resting pose, used when nothing is animating
      const fill = i === 0 ? look.head : look.body;
      const opacity = i === 0 ? 1 : Math.max(0.35, 1 - i * 0.13);
      const delay = motion ? ` style="animation-delay:-${num((length - i) * STEP_SECONDS)}s"` : '';
      return `<rect class="s" x="${num(inset)}" y="${num(inset)}" width="${num(size)}" height="${num(size)}" rx="${i === 0 ? 4 : 3}" fill="${fill}" fill-opacity="${num(opacity)}" transform="translate(${px} ${py})"${delay}/>`;
    });
    // Draw the tail first, so the head sits on top.
    const snake = segments.reverse().join('');

    parts.push(rise(cells + snake, false, 0));

    if (motion) {
      const slither = Array.from({ length: length + 1 }, (_v, index) => {
        const [px, py] = poseAt(index);
        return `${num((index / length) * 100)}%{transform:translate(${px}px,${py}px)}`;
      }).join('');
      const eaten = [...buckets]
        .sort((a, b) => a - b)
        .map((bucket) => {
          const vanish = (((bucket + 1) * BUCKET - 1) / length) * 100; // inside the snake's body when it happens
          return `@keyframes e${bucket}{0%,${num(vanish)}%{opacity:1}${num(vanish + 0.01)}%,100%{opacity:0}}.e${bucket}{animation-name:e${bucket}}`;
        })
        .join('');
      css =
        `.s{animation:slither ${num(period)}s linear infinite}` +
        `@keyframes slither{${slither}}` +
        `.c{animation-duration:${num(period)}s;animation-iteration-count:infinite;animation-timing-function:linear}` +
        eaten +
        `@media (prefers-reduced-motion:reduce){.s,.c{animation:none}}`;
    }

    cursor = y0 + ROWS * STEP + 18;
    const captions = [
      [`${formatNumber(activity.total)} contributions in the past year`, plural(activity.activeDays, 'active day')],
      [`current streak ${plural(activity.currentStreak, 'day')}`, `longest ${plural(activity.longestStreak, 'day')}`],
    ].map((items) => items.join('  ·  '));
    parts.push(
      rise(
        captions
          .map((line, index) => `<text class="mono" x="${WIDTH / 2}" y="${num(cursor + index * 20)}" text-anchor="middle" font-size="12.5" fill="${look.muted}">${xmlEscape(line)}</text>`)
          .join(''),
        motion,
        next(),
      ),
    );
    cursor += 20 + 22;
  } else if (wantsGrid) {
    // The snake needs contribution data. Say so plainly rather than draw an empty grid.
    const top = cursor + 16;
    parts.push(
      rise(
        `<text x="${WIDTH / 2}" y="${top + 54}" text-anchor="middle" font-size="16" font-weight="700" fill="${look.fg}">Your snake appears here</text>` +
          `<text x="${WIDTH / 2}" y="${top + 80}" text-anchor="middle" font-size="13" fill="${look.muted}">It crosses your contribution graph, which is added at your first automatic update.</text>`,
        motion,
        next(),
      ),
    );
    cursor = top + 120;
  }

  if (blocks.has('languages') && profile.languages.length > 0) {
    const text = profile.languages.slice(0, 4).map((l) => `${truncate(l.name, 14)} ${l.percent}%`).join('   ');
    parts.push(
      rise(
        `<text class="mono" x="${PAD}" y="${num(cursor)}" font-size="12.5" fill="${look.muted}">written in  <tspan fill="${look.fg}">${xmlEscape(text)}</tspan></text>`,
        motion,
        next(),
      ),
    );
    cursor += 24;
  }

  const height = Math.ceil(cursor + PAD - 18);
  const title = `${profile.name ?? profile.login} (@${profile.login}) on GitHub`;
  const entrance = motion
    ? `.rise{animation:rise .6s ease both}@keyframes rise{from{opacity:0}}@media (prefers-reduced-motion:reduce){.rise{animation:none}}`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}" role="img" aria-labelledby="t">
<title id="t">${xmlEscape(title)}</title>
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${look.bgTop}"/><stop offset="1" stop-color="${look.bgBottom}"/></linearGradient>
</defs>
<style>
text{font-family:${FONT_SANS}}
.mono{font-family:${FONT}}
${entrance}
${css}
</style>
<rect width="${WIDTH}" height="${height}" rx="20" fill="url(#bg)"/>
${parts.filter(Boolean).join('\n')}
</svg>
`;
}

export const snake: Template = {
  id: 'snake',
  name: 'Snake trail',
  description: 'A snake slithers across your contribution graph and eats every active day, then starts over.',
  tags: ['animated', 'game', 'activity'],
  needsAvatar: false,
  render(profile, config): Output {
    const assets = variantsFor(config.theme).map((variant) => ({
      path: assetPath('snake', variant),
      content: renderSvg(profile, config, variant),
    }));
    const drawn = config.blocks.includes('activity') && profile.contributions && profile.contributions.days.length > 0;
    const extra = drawn ? 'an animated snake crossing the contribution graph and eating the active days' : undefined;
    return { readme: imageReadme(profile, config, 'snake', WIDTH, describeProfile(profile, config, extra, { activity: true })), assets };
  },
};
