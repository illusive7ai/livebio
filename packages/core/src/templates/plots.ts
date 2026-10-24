import { weeklyTotals } from '../contributions';
import { hslToHex, hueOf } from '../color';
import type { Variant } from '../themes';
import type { Config, ContributionDay, LanguageShare, Profile, RepoSummary, Template } from '../types';
import { formatNumber, truncate, wrap, xmlEscape } from '../util';
import { num, riseCss } from './kit';
import { imageTemplate, isoDate, langColor, svgDoc } from './make';
import { photo } from './photo';
import { rise, seeded } from './shared';

/** Five designs that draw data as unusual objects: a topographic map, a birth chart, a cross-stitch sampler, a punch card and a Plinko board. */

const hueFor = (profile: Profile, fallback: number): number => hueOf(profile.avatar?.grid.tint) ?? fallback;

const text = (value: string, x: number, y: number, size: number, fill: string, extra = ''): string =>
  `<text x="${num(x)}" y="${num(y)}" font-size="${size}" fill="${fill}" ${extra}>${xmlEscape(value)}</text>`;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** The activity a design may draw: none when the section is off or the calendar is missing or empty. */
function daysOf(profile: Profile, config: Config): ContributionDay[] {
  return config.blocks.includes('activity') && profile.contributions ? profile.contributions.days : [];
}

const waiting = (blocks: ReadonlySet<string>): string => (blocks.has('activity') ? 'This appears after the first automatic update, once the contribution calendar is available.' : 'The activity section is switched off.');

/* ------------------------------------------------------------------------------------------------ */
/* Topographic map                                                                                   */
/* ------------------------------------------------------------------------------------------------ */

/** The calendar as a grid of weeks across and weekdays down, as GitHub draws it. Cells with no day hold 0. */
export function activityGrid(days: ReadonlyArray<ContributionDay>): { cols: number; rows: number; cells: number[][] } {
  const rows = 7;
  if (days.length === 0) return { cols: 0, rows, cells: [] };
  const first = new Date(`${days[0]!.date}T00:00:00Z`).getUTCDay();
  const cols = Math.ceil((first + days.length) / rows);
  const cells = Array.from({ length: cols }, () => Array.from({ length: rows }, () => 0));
  days.forEach((day, i) => {
    cells[Math.floor((first + i) / rows)]![(first + i) % rows] = day.count;
  });
  return { cols, rows, cells };
}

/** A smooth surface through the cells: each cell is enlarged `scale` times by blending its neighbours, then softened once. */
export function smoothField(grid: { cols: number; rows: number; cells: number[][] }, scale = 3): number[][] {
  const w = grid.cols * scale;
  const h = grid.rows * scale;
  if (w === 0) return [];
  const at = (c: number, r: number): number => grid.cells[Math.min(grid.cols - 1, Math.max(0, c))]![Math.min(grid.rows - 1, Math.max(0, r))]!;
  const fine = Array.from({ length: h }, (_v, j) =>
    Array.from({ length: w }, (_w, i) => {
      const gx = (i + 0.5) / scale - 0.5;
      const gy = (j + 0.5) / scale - 0.5;
      const x0 = Math.floor(gx);
      const y0 = Math.floor(gy);
      const fx = gx - x0;
      const fy = gy - y0;
      return at(x0, y0) * (1 - fx) * (1 - fy) + at(x0 + 1, y0) * fx * (1 - fy) + at(x0, y0 + 1) * (1 - fx) * fy + at(x0 + 1, y0 + 1) * fx * fy;
    }),
  );
  const kernel = [1, 2, 1];
  return fine.map((row, j) =>
    row.map((_v, i) => {
      let sum = 0;
      let weight = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const y = j + dy;
          const x = i + dx;
          if (y < 0 || y >= h || x < 0 || x >= w) continue;
          const k = kernel[dx + 1]! * kernel[dy + 1]!;
          sum += fine[y]![x]! * k;
          weight += k;
        }
      }
      return sum / weight;
    }),
  );
}

export type Segment = [number, number, number, number];

/**
 * The line where a surface crosses a height, by marching squares: for every square of four neighbouring points, where
 * the line enters and leaves it. Coordinates are in points, so x runs 0 to width-1.
 */
export function contourSegments(field: ReadonlyArray<ReadonlyArray<number>>, level: number): Segment[] {
  const out: Segment[] = [];
  const h = field.length;
  const w = field[0]?.length ?? 0;
  for (let y = 0; y < h - 1; y++) {
    for (let x = 0; x < w - 1; x++) {
      const tl = field[y]![x]!;
      const tr = field[y]![x + 1]!;
      const br = field[y + 1]![x + 1]!;
      const bl = field[y + 1]![x]!;
      const index = (tl >= level ? 8 : 0) | (tr >= level ? 4 : 0) | (br >= level ? 2 : 0) | (bl >= level ? 1 : 0);
      if (index === 0 || index === 15) continue;
      const t = (a: number, b: number): number => (level - a) / (b - a);
      const top: [number, number] = [x + t(tl, tr), y];
      const right: [number, number] = [x + 1, y + t(tr, br)];
      const bottom: [number, number] = [x + t(bl, br), y + 1];
      const left: [number, number] = [x, y + t(tl, bl)];
      const pairs: Record<number, Array<[[number, number], [number, number]]>> = {
        1: [[left, bottom]],
        2: [[bottom, right]],
        3: [[left, right]],
        4: [[top, right]],
        5: [[left, top], [bottom, right]],
        6: [[top, bottom]],
        7: [[left, top]],
        8: [[left, top]],
        9: [[top, bottom]],
        10: [[top, right], [left, bottom]],
        11: [[top, right]],
        12: [[left, right]],
        13: [[bottom, right]],
        14: [[left, bottom]],
      };
      for (const [a, b] of pairs[index]!) out.push([a[0], a[1], b[0], b[1]]);
    }
  }
  return out;
}

const r1 = (value: number): string => String(Math.round(value * 10) / 10);

function topoSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const paper = dark ? '#101a1c' : '#f1e6c9';
  const line = dark ? '#58c4a8' : '#8a5a2b';
  const index = dark ? '#a7f0d6' : '#5a3510';
  const ink = dark ? '#d6efe6' : '#3a2410';
  const muted = dark ? '#6f9a92' : '#8a6d45';
  const name = profile.name ?? profile.login;
  const days = daysOf(profile, config);
  const height = 520;
  let body = `<rect width="900" height="${height}" fill="${paper}"/>`;
  body += text(`TOPOGRAPHIC SURVEY  ·  ${truncate(name, 26).toUpperCase()}`, 40, 44, 14, ink, 'class="mono" font-weight="700" letter-spacing="3"');
  body += text(`@${profile.login}`, 860, 44, 12, muted, 'class="mono" text-anchor="end"');
  if (days.length === 0) {
    body += text(waiting(blocks), 40, 120, 15, muted, 'font-style="italic"');
    return svgDoc({ height: 200, title: `${name} on GitHub, as a topographic map`, bg: paper, radius: 14, css: riseCss(motion), body: body.replace(`height="${height}"`, 'height="200"') });
  }
  const grid = activityGrid(days);
  const scale = 3;
  const field = smoothField(grid, scale);
  const peak = Math.max(0, ...field.flat());
  const mapX = 40;
  const mapY = 76;
  const mapW = 820;
  const stretch = 3;
  const cellW = mapW / grid.cols;
  const sx = mapW / (grid.cols * scale);
  const sy = (cellW * stretch) / scale;
  const mapH = sy * grid.rows * scale;
  body += `<rect x="${mapX - 6}" y="${mapY - 6}" width="${mapW + 12}" height="${num(mapH + 12)}" fill="none" stroke="${muted}" stroke-width="1.5"/>`;
  const fractions = [0.06, 0.16, 0.28, 0.42, 0.58, 0.76, 0.92];
  let lines = '';
  const labels: string[] = [];
  const random = seeded(`topo:${profile.login}`);
  if (peak > 0) {
    fractions.forEach((f, li) => {
      const level = peak * f;
      const segs = contourSegments(field, level);
      const major = li % 2 === 1;
      lines += `<path d="${segs.map(([a, b, c, d]) => `M${r1(mapX + (a + 0.5) * sx)} ${r1(mapY + (b + 0.5) * sy)}L${r1(mapX + (c + 0.5) * sx)} ${r1(mapY + (d + 0.5) * sy)}`).join('')}" fill="none" stroke="${major ? index : line}" stroke-width="${major ? 1.6 : 0.8}" stroke-linecap="round"/>`;
      if (major && segs.length > 12) {
        for (let k = 0; k < 2; k++) {
          const s = segs[Math.floor(random() * segs.length)]!;
          const lx = mapX + ((s[0] + s[2]) / 2 + 0.5) * sx;
          const ly = mapY + ((s[1] + s[3]) / 2 + 0.5) * sy;
          labels.push(text(r1(level), lx, ly + 3, 9.5, ink, `class="mono" text-anchor="middle" stroke="${paper}" stroke-width="3" paint-order="stroke"`));
        }
      }
    });
  }
  body += `<g${motion ? ' class="draw"' : ''}>${lines}</g>${labels.join('')}`;
  // The summit: the busiest day.
  const first = new Date(`${days[0]!.date}T00:00:00Z`).getUTCDay();
  let top = -1;
  days.forEach((d, i) => {
    if (d.count > 0 && (top < 0 || d.count > days[top]!.count)) top = i;
  });
  if (top >= 0) {
    const px = mapX + (Math.floor((first + top) / 7) + 0.5) * cellW;
    const py = mapY + (((first + top) % 7) + 0.5) * cellW * stretch;
    // The label goes on whichever side of the summit has room, so it never runs off the map.
    const toLeft = px > mapX + mapW * 0.7;
    body += `<path d="M${num(px)} ${num(py - 9)}l7 13h-14z" fill="${ink}"/>` + text(`${formatNumber(days[top]!.count)} · ${days[top]!.date}`, toLeft ? px - 11 : px + 11, py + 4, 11, ink, `class="mono" font-weight="700" text-anchor="${toLeft ? 'end' : 'start'}" stroke="${paper}" stroke-width="3" paint-order="stroke"`);
  }
  // Months along the foot of the map.
  days.forEach((d, i) => {
    // A month is named where it starts. The first day shown gets a name only if the month has most of its days left.
    if (d.date.endsWith('-01') || (i === 0 && Number(d.date.slice(8, 10)) <= 10)) {
      const x = mapX + (Math.floor((first + i) / 7) + 0.5) * cellW;
      body += text(MONTHS[Number(d.date.slice(5, 7)) - 1]!, x, mapY + mapH + 22, 10, muted, 'class="mono"');
    }
  });
  body += text(peak > 0 ? 'Lines join days with the same number of contributions, smoothed between days. Each column is one week. Stretched 3 times from top to bottom.' : 'A flat map: there were no contributions in these days, so there is nothing to draw contours around.', 40, height - 36, 11, muted, 'class="mono"');
  if (blocks.has('stats') && days.length > 0 && profile.contributions) body += text(`${formatNumber(profile.contributions.total)} contributions on ${formatNumber(profile.contributions.activeDays)} active days`, 40, height - 16, 11.5, ink, 'class="mono"');
  const css = riseCss(motion) + (motion ? `.draw{animation:topo 1.4s ease both}@keyframes topo{from{opacity:0}}@media (prefers-reduced-motion:reduce){.draw{animation:none}}` : '');
  return svgDoc({ height, title: `${name} on GitHub, as a topographic map of a year of activity`, bg: paper, radius: 14, css, body });
}

export const topo: Template = imageTemplate('topo', 'Topographic map', 'Your year of activity as contour lines on a survey map, with the busiest day marked as the summit.', ['creative', 'map', 'activity'], topoSvg, {
  activity: true,
  extra: () => 'shown as a topographic map',
});

/* ------------------------------------------------------------------------------------------------ */
/* Birth chart                                                                                       */
/* ------------------------------------------------------------------------------------------------ */

/**
 * Which of the last twelve months a push date falls in, 0 for the oldest and 11 for the month of `nowIso`,
 * with how far through that month it was (0 to 1). Null for a date outside that window or one that cannot be read.
 */
export function monthSlot(pushedAt: string | null | undefined, nowIso: string | undefined): { slot: number; fraction: number } | null {
  const when = isoDate(pushedAt);
  const now = isoDate(nowIso);
  if (!when || !now) return null;
  const [wy, wm, wd] = when.split('-').map(Number) as [number, number, number];
  const [ny, nm] = now.split('-').map(Number) as [number, number];
  const ago = (ny - wy) * 12 + (nm - wm);
  if (ago < 0 || ago > 11 || when > now) return null;
  const length = new Date(Date.UTC(wy, wm, 0)).getUTCDate();
  return { slot: 11 - ago, fraction: (wd - 1) / length };
}

export interface Planet {
  repo: RepoSummary;
  slot: number;
  angle: number;
  /** 0 for the first repository in its month, then 1, 2 ... so those in one month sit on different orbits. */
  orbit: number;
}

/** Places each repository pushed to within the last twelve months at the angle of its push date, starting at the top and going clockwise. */
export function planets(repos: ReadonlyArray<RepoSummary>, nowIso: string | undefined): Planet[] {
  const used = new Map<number, number>();
  const placed: Planet[] = [];
  for (const repo of repos) {
    const spot = monthSlot(repo.pushedAt, nowIso);
    if (!spot) continue;
    const orbit = used.get(spot.slot) ?? 0;
    used.set(spot.slot, orbit + 1);
    placed.push({ repo, slot: spot.slot, angle: -90 + (spot.slot + spot.fraction) * 30, orbit });
  }
  return placed;
}

/** How far from the centre the first planet of a month sits, and how much further out each next one in that month goes. */
export const ORBIT_FIRST = 104;
export const ORBIT_STEP = 26;

function natalSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const hue = hueFor(profile, 265);
  const sky = dark ? '#0d0a1a' : '#f0ecf8';
  const ring = dark ? '#1c1640' : '#ddd5f2';
  const ring2 = dark ? '#251d52' : '#cdc2ec';
  const gold = dark ? '#e9c46a' : '#8a5a00';
  const ink = dark ? '#ece8fb' : '#241a45';
  const muted = dark ? '#8f86b8' : '#5b4f86';
  const name = profile.name ?? profile.login;
  const now = profile.fetchedAt;
  const repos = blocks.has('projects') ? profile.topRepos : [];
  const placed = planets(repos, now);
  const notShown = repos.length - placed.length;
  const most = Math.max(1, ...placed.map((p) => p.repo.stars));
  const cx = 300;
  const cy = 270;
  const R = 232;
  const nowDate = isoDate(now);
  const startIndex = nowDate ? Number(nowDate.slice(5, 7)) - 1 : 0;
  const height = 540;
  let body = `<rect width="900" height="${height}" fill="${sky}"/>`;
  for (let i = 0; i < 12; i++) {
    const a0 = ((-90 + i * 30) * Math.PI) / 180;
    const a1 = ((-90 + (i + 1) * 30) * Math.PI) / 180;
    const p = (r: number, a: number) => `${num(cx + Math.cos(a) * r)} ${num(cy + Math.sin(a) * r)}`;
    body += `<path d="M${p(R, a0)}A${R} ${R} 0 0 1 ${p(R, a1)}L${p(R - 40, a1)}A${R - 40} ${R - 40} 0 0 0 ${p(R - 40, a0)}Z" fill="${i % 2 === 0 ? ring : ring2}"/>`;
    const mid = (a0 + a1) / 2;
    const label = nowDate ? MONTHS[(startIndex - 11 + i + 12) % 12]!.toUpperCase() : '';
    if (label) body += `<text x="${num(cx + Math.cos(mid) * (R - 20))}" y="${num(cy + Math.sin(mid) * (R - 20) + 4)}" text-anchor="middle" font-size="11" font-weight="700" letter-spacing="1.5" fill="${gold}" class="mono" transform="rotate(${num((mid * 180) / Math.PI + 90)} ${num(cx + Math.cos(mid) * (R - 20))} ${num(cy + Math.sin(mid) * (R - 20))})">${label}</text>`;
    body += `<path d="M${p(R - 40, a0)}L${p(40, a0)}" stroke="${muted}" stroke-opacity="0.25"/>`;
  }
  for (const r of [R - 40, 150, 100]) body += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${muted}" stroke-opacity="0.45"/>`;
  const pos = (p: Planet) => {
    const rad = Math.min(ORBIT_FIRST + p.orbit * ORBIT_STEP, ORBIT_FIRST + 3 * ORBIT_STEP);
    const a = (p.angle * Math.PI) / 180;
    return [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad] as const;
  };
  // Repositories pushed to in the same month are joined by a thin line, as aspects are on a real chart.
  for (const a of placed) for (const b of placed) if (a.slot === b.slot && a.repo.name < b.repo.name) body += `<path d="M${pos(a).map(num).join(' ')}L${pos(b).map(num).join(' ')}" stroke="${gold}" stroke-opacity="0.6" stroke-dasharray="3 3"/>`;
  placed.forEach((p, i) => {
    const [x, y] = pos(p);
    const r = 7 + Math.sqrt(p.repo.stars / most) * 8;
    const color = p.repo.language ? langColor(p.repo.language, variant) : gold;
    body += rise(`<circle cx="${num(x)}" cy="${num(y)}" r="${num(r + 4)}" fill="${color}" fill-opacity="0.22"/><circle cx="${num(x)}" cy="${num(y)}" r="${num(r)}" fill="${color}" stroke="${ink}" stroke-opacity="0.5"/><text x="${num(x)}" y="${num(y + 4)}" text-anchor="middle" font-size="${num(Math.max(9, r * 0.9))}" font-weight="800" fill="${dark ? '#12101f' : '#ffffff'}">${i + 1}</text>`, motion, 0.08 * i);
  });
  body += `<circle cx="${cx}" cy="${cy}" r="72" fill="${gold}"/>` + photo(profile, cx - 66, cy - 66, 132, 132, 'natal-p', { rx: 66, tile: { fill: ring2, ink: gold } });
  const rx = 590;
  body += text('BIRTH CHART', rx, 76, 12, muted, 'class="mono" letter-spacing="5" font-weight="700"');
  body += text(truncate(name, 20), rx, 116, 30, ink, 'font-weight="800"');
  body += text(`@${profile.login}`, rx, 140, 13, muted, 'class="mono"');
  placed.slice(0, 10).forEach((p, i) => {
    const y = 190 + i * 30;
    const color = p.repo.language ? langColor(p.repo.language, variant) : gold;
    body += `<circle cx="${rx + 9}" cy="${y - 5}" r="9" fill="${color}"/>` + text(String(i + 1), rx + 9, y - 1.5, 10, dark ? '#12101f' : '#ffffff', 'text-anchor="middle" font-weight="800"');
    body += text(truncate(p.repo.name, 20), rx + 26, y - 1, 14, ink, 'font-weight="700"') + text(`${MONTHS[(startIndex - 11 + p.slot + 12) % 12]}  ·  ★ ${formatNumber(p.repo.stars)}`, rx + 26, y + 13, 10.5, muted, 'class="mono"');
  });
  const note = !blocks.has('projects') ? 'Switch on Top projects to place repositories.' : placed.length === 0 ? 'None of the top projects was pushed to in the last twelve months, so none is placed.' : notShown > 0 ? `${notShown} older ${notShown === 1 ? 'project is' : 'projects are'} not placed.` : 'Every top project was pushed to in the last twelve months.';
  const noteTop = 188 + Math.min(placed.length, 10) * 30 + 22;
  const explain = wrap('Each planet is a repository, placed by the month it was last pushed to. Planets in one month are joined.', 36, 4);
  [...explain, '', ...wrap(note, 36, 4)].forEach((l, i) => (body += l ? text(l, rx, noteTop + i * 16, 11, muted, 'class="mono"') : ''));
  return svgDoc({ height, title: `${name} on GitHub, as a birth chart of repositories placed by when they were last pushed to`, bg: sky, radius: 14, css: riseCss(motion), body });
}

export const natal: Template = imageTemplate('natal', 'Birth chart', 'A zodiac wheel of your year: each project is a planet, placed in the month it was last pushed to, with your picture at the centre.', ['creative', 'chart', 'projects'], natalSvg, {
  extra: () => 'shown as a birth chart',
});

/* ------------------------------------------------------------------------------------------------ */
/* Cross-stitch sampler                                                                              */
/* ------------------------------------------------------------------------------------------------ */

/** A five by seven letter, seven strings of five marks. Anything not listed is left as a gap. */
const FONT: Record<string, string> = {
  A: '01110/10001/10001/11111/10001/10001/10001', B: '11110/10001/10001/11110/10001/10001/11110', C: '01110/10001/10000/10000/10000/10001/01110',
  D: '11110/10001/10001/10001/10001/10001/11110', E: '11111/10000/10000/11110/10000/10000/11111', F: '11111/10000/10000/11110/10000/10000/10000',
  G: '01110/10001/10000/10111/10001/10001/01111', H: '10001/10001/10001/11111/10001/10001/10001', I: '01110/00100/00100/00100/00100/00100/01110',
  J: '00111/00010/00010/00010/00010/10010/01100', K: '10001/10010/10100/11000/10100/10010/10001', L: '10000/10000/10000/10000/10000/10000/11111',
  M: '10001/11011/10101/10101/10001/10001/10001', N: '10001/11001/10101/10011/10001/10001/10001', O: '01110/10001/10001/10001/10001/10001/01110',
  P: '11110/10001/10001/11110/10000/10000/10000', Q: '01110/10001/10001/10001/10101/10010/01101', R: '11110/10001/10001/11110/10100/10010/10001',
  S: '01111/10000/10000/01110/00001/00001/11110', T: '11111/00100/00100/00100/00100/00100/00100', U: '10001/10001/10001/10001/10001/10001/01110',
  V: '10001/10001/10001/10001/10001/01010/00100', W: '10001/10001/10001/10101/10101/11011/10001', X: '10001/10001/01010/00100/01010/10001/10001',
  Y: '10001/10001/01010/00100/00100/00100/00100', Z: '11111/00001/00010/00100/01000/10000/11111',
  '0': '01110/10001/10011/10101/11001/10001/01110', '1': '00100/01100/00100/00100/00100/00100/01110', '2': '01110/10001/00001/00010/00100/01000/11111',
  '3': '11110/00001/00001/01110/00001/00001/11110', '4': '00010/00110/01010/10010/11111/00010/00010', '5': '11111/10000/11110/00001/00001/10001/01110',
  '6': '00110/01000/10000/11110/10001/10001/01110', '7': '11111/00001/00010/00100/01000/01000/01000', '8': '01110/10001/10001/01110/10001/10001/01110',
  '9': '01110/10001/10001/01111/00001/00010/01100',
  '-': '00000/00000/00000/11111/00000/00000/00000', _: '00000/00000/00000/00000/00000/00000/11111', '.': '00000/00000/00000/00000/00000/01100/01100',
  ',': '00000/00000/00000/00000/01100/00100/01000', ' ': '00000/00000/00000/00000/00000/00000/00000',
};

/** The cells to stitch for a line of text: [column, row] pairs, six columns to a letter (five and a gap). Characters with no letter are skipped over as gaps. */
export function stitchText(value: string): { cells: Array<[number, number]>; width: number } {
  const cells: Array<[number, number]> = [];
  [...value.toUpperCase()].forEach((ch, i) => {
    const glyph = FONT[ch] ?? FONT[' ']!;
    glyph.split('/').forEach((row, r) => [...row].forEach((mark, c) => mark === '1' && cells.push([i * 6 + c, r])));
  });
  return { cells, width: Math.max(0, [...value].length * 6 - 1) };
}

function stitchSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const hue = hueFor(profile, 350);
  const cloth = dark ? '#2a2623' : '#f3ead7';
  const holes = dark ? '#3a3531' : '#e1d5ba';
  const ink = dark ? '#ece3d0' : '#4a2a20';
  const muted = dark ? '#9a9080' : '#8a7458';
  const floss = [0, 1, 2, 3, 4].map((i) => (i === 0 ? (dark ? '#4a443e' : '#d8ccb0') : hslToHex((hue + 20 * i) % 360, 0.68, dark ? 0.45 + i * 0.07 : 0.72 - i * 0.1)));
  const title = hslToHex((hue + 200) % 360, 0.55, dark ? 0.72 : 0.36);
  const name = profile.name ?? profile.login;
  const days = daysOf(profile, config);
  const grid = activityGrid(days);
  const height = days.length > 0 ? 470 : 280;
  let body = `<rect width="900" height="${height}" fill="${cloth}"/>`;
  // The weave: one tiny hole for each stitch square, drawn as a repeating pattern so the picture stays small.
  body += `<pattern id="aida" width="10" height="10" patternUnits="userSpaceOnUse"><rect x="9" y="9" width="2" height="2" fill="${holes}"/></pattern><rect width="900" height="${height}" fill="url(#aida)"/>`;
  const by: Record<string, string[]> = {};
  const stitch = (x: number, y: number, s: number, color: string) => {
    (by[color] ??= []).push(`M${num(x + s * 0.12)} ${num(y + s * 0.12)}L${num(x + s * 0.88)} ${num(y + s * 0.88)}M${num(x + s * 0.12)} ${num(y + s * 0.88)}L${num(x + s * 0.88)} ${num(y + s * 0.12)}`);
  };
  // A border of alternating stitches.
  const cell = 10;
  for (let x = 20; x < 880; x += cell) {
    const color = floss[1 + (Math.floor(x / cell) % 4)]!;
    stitch(x, 14, cell, color);
    stitch(x, height - 24, cell, color);
  }
  for (let y = 24; y < height - 24; y += cell) {
    const color = floss[1 + (Math.floor(y / cell) % 4)]!;
    stitch(16, y, cell, color);
    stitch(874, y, cell, color);
  }
  const heading = truncate(profile.login, 16);
  const hs = Math.min(8, Math.floor(780 / (Math.max(1, heading.length) * 6)));
  const hText = stitchText(heading);
  const hx = (900 - hText.width * hs) / 2;
  hText.cells.forEach(([c, r]) => stitch(hx + c * hs, 50 + r * hs, hs, title));
  const textBottom = 50 + 7 * hs;
  if (days.length > 0) {
    const gs = Math.min(11, Math.floor(780 / grid.cols));
    const gx = (900 - grid.cols * gs) / 2;
    const gy = textBottom + 40;
    const first = new Date(`${days[0]!.date}T00:00:00Z`).getUTCDay();
    days.forEach((d, i) => {
      const col = Math.floor((first + i) / 7);
      const row = (first + i) % 7;
      stitch(gx + col * gs, gy + row * gs, gs, floss[d.level]!);
    });
    const total = profile.contributions?.total ?? 0;
    const line = blocks.has('stats') ? `${formatNumber(total)} CONTRIBUTIONS` : '';
    if (line) {
      const t = stitchText(line);
      const s = 4;
      t.cells.forEach(([c, r]) => stitch((900 - t.width * s) / 2 + c * s, gy + 7 * gs + 34 + r * s, s, title));
    }
    body += text('one stitch for each day, in the colour of how busy it was', 450, height - 40, 11, muted, 'class="mono" text-anchor="middle"');
    floss.forEach((c, i) => (body += `<circle cx="${392 + i * 22}" cy="${height - 62}" r="7" fill="${c}"/>`));
  } else {
    body += text(waiting(blocks), 450, textBottom + 60, 14, muted, 'class="serif" font-style="italic" text-anchor="middle"');
  }
  body += Object.entries(by)
    .map(([color, parts]) => `<path d="${parts.join('')}" stroke="${color}" stroke-width="${color === floss[0] ? 2 : 2.6}" stroke-linecap="round" fill="none"/>`)
    .join('');
  return svgDoc({ height, title: `${name} on GitHub, as a cross-stitch sampler of a year of activity`, bg: cloth, radius: 14, css: riseCss(motion), body: rise(body, motion, 0.05) });
}

export const stitch: Template = imageTemplate('stitch', 'Cross-stitch sampler', 'A cross-stitch sampler: your handle stitched in letters and your year as a field of stitches, one for each day.', ['creative', 'craft', 'activity'], stitchSvg, {
  activity: true,
  extra: () => 'shown as a cross-stitch sampler',
});

/* ------------------------------------------------------------------------------------------------ */
/* Punch card                                                                                        */
/* ------------------------------------------------------------------------------------------------ */

export const PUNCH_ROWS = 12;

/** A number as holes: true where the bit is set, least significant bit first, `rows` of them. Anything too big is shown as all holes. */
export function bits(n: number, rows = PUNCH_ROWS): boolean[] {
  const cap = 2 ** rows - 1;
  const value = Math.min(cap, Math.max(0, Math.floor(n)));
  return Array.from({ length: rows }, (_v, i) => ((value >> i) & 1) === 1);
}

/** The number a column of holes stands for. The reverse of `bits`. */
export const readBits = (holes: ReadonlyArray<boolean>): number => holes.reduce((sum, hole, i) => sum + (hole ? 2 ** i : 0), 0);

function punchSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const stock = dark ? '#d8c9a3' : '#efe2bd';
  const back = dark ? '#14110d' : '#c9bda0';
  const ink = '#2a1f12';
  const faint = '#8a7650';
  const name = profile.name ?? profile.login;
  const days = daysOf(profile, config);
  const weeks = days.length > 0 ? weeklyTotals(days) : [];
  const cols = 80;
  const pitch = 10.4;
  const x0 = 34;
  const height = 424;
  const typed = `${`@${profile.login}`.toUpperCase()}${blocks.has('stats') ? `  ${formatNumber(profile.totalStars)} STARS ${formatNumber(profile.followers)} FOLLOWERS` : ''}`.replace(/[^A-Z0-9 @,._-]/g, ' ').slice(0, cols);
  const defs = '';
  let body = `<rect width="900" height="${height}" fill="${back}"/>`;
  body += `<path d="M44 24H880a8 8 0 0 1 8 8V${height - 32}a8 8 0 0 1-8 8H20a8 8 0 0 1-8-8V56Z" fill="${stock}"/>`;
  [...typed].forEach((ch, i) => (body += ch === ' ' ? '' : text(ch, x0 + i * pitch + pitch / 2, 52, 10.5, ink, 'class="mono" text-anchor="middle" font-weight="700"')));
  body += `<rect x="20" y="62" width="860" height="1" fill="${faint}"/>`;
  const top = 78;
  const rowGap = 19.5;
  let holes = '';
  for (let c = 0; c < cols; c++) {
    const x = x0 + c * pitch + pitch / 2;
    const punched = c < weeks.length ? bits(weeks[c]!) : null;
    for (let r = 0; r < PUNCH_ROWS; r++) {
      const y = top + (PUNCH_ROWS - 1 - r) * rowGap;
      if (punched?.[r]) holes += `<rect x="${num(x - 2.9)}" y="${num(y - 6.5)}" width="5.8" height="13" rx="1" fill="${back}"/>`;
      else body += text(String((PUNCH_ROWS - 1 - r) % 10), x, y + 3, 7.5, faint, 'class="mono" text-anchor="middle" fill-opacity="0.55"');
    }
  }
  body += `<g${motion ? ' class="holes"' : ''}>${holes}</g>`;
  const foot = top + PUNCH_ROWS * rowGap + 4;
  const note = weeks.length > 0 ? `Each of the first ${weeks.length} columns is one week. The holes spell that week's contributions in binary: the bottom hole is 1, then 2, 4, 8 and so on.` : waiting(blocks);
  const noteLines = wrap(note, 112, 3);
  noteLines.forEach((l, i) => (body += text(l, x0, foot + 20 + i * 16, 11, ink, 'class="mono"')));
  if (weeks.length > 0) body += text(`Read back, the last eight weeks: ${weeks.map((w) => formatNumber(w)).slice(-8).join(', ')}`, x0, foot + 20 + noteLines.length * 16 + 6, 10.5, faint, 'class="mono"');
  body += text(`${truncate(name, 24)}  ·  80 columns  ·  12 rows`, 880 - 16, height - 14, 10, faint, 'class="mono" text-anchor="end"');
  const css = riseCss(motion) + (motion ? `.holes{animation:punch 1.2s steps(14) both}@keyframes punch{from{opacity:0}}@media (prefers-reduced-motion:reduce){.holes{animation:none}}` : '');
  return svgDoc({ height, title: `${name} on GitHub, as a punch card: each column holds one week's contributions in binary`, bg: back, radius: 14, defs, css, body });
}

export const punch: Template = imageTemplate('punch', 'Punch card', 'An 80-column punch card: your handle typed across the top and each week of the year punched out as a number in binary.', ['creative', 'retro', 'activity'], punchSvg, {
  activity: true,
  extra: () => 'shown as a punch card with one column for each week',
});

/* ------------------------------------------------------------------------------------------------ */
/* Plinko                                                                                            */
/* ------------------------------------------------------------------------------------------------ */

/** The bins of the board: the main languages, then "other" for repositories whose language is not among them. At most `max` bins. */
export function plinkoBins(languages: ReadonlyArray<LanguageShare>, repos: ReadonlyArray<RepoSummary>, max = 6): Array<{ name: string; repos: RepoSummary[] }> {
  const names = languages.slice(0, max - 1).map((l) => l.name);
  const bins = names.map((name) => ({ name, repos: [] as RepoSummary[] }));
  const other: RepoSummary[] = [];
  for (const repo of repos) {
    const bin = bins.find((b) => b.name === repo.language);
    (bin ? bin.repos : other).push(repo);
  }
  const used = bins.filter((b) => b.repos.length > 0);
  return other.length > 0 ? [...used, { name: 'other', repos: other }] : used;
}

/** The left and right bounces of a ball that drops through `slots - 1` rows of pegs and lands in `slot`: exactly `slot` rights, in an order that comes from `seed`. */
export function bounces(slot: number, slots: number, seed: string): Array<'L' | 'R'> {
  const rows = Math.max(0, slots - 1);
  const moves: Array<'L' | 'R'> = Array.from({ length: rows }, (_v, i) => (i < slot ? 'R' : 'L'));
  const random = seeded(`plinko:${seed}`);
  for (let i = moves.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [moves[i], moves[j]] = [moves[j]!, moves[i]!];
  }
  return moves;
}

function plinkoSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const board = dark ? '#14161f' : '#eef1f8';
  const peg = dark ? '#c9d3ec' : '#566184';
  const ink = dark ? '#e9eefc' : '#1d2742';
  const muted = dark ? '#8693b8' : '#5d6a90';
  const name = profile.name ?? profile.login;
  const bins = blocks.has('projects') && blocks.has('languages') ? plinkoBins(profile.languages, profile.topRepos) : blocks.has('projects') ? plinkoBins([], profile.topRepos).slice(0, 1) : [];
  const height = 560;
  let body = `<rect width="900" height="${height}" fill="${board}"/>`;
  body += text('PLINKO', 40, 50, 12, muted, 'class="mono" letter-spacing="5" font-weight="700"') + text(truncate(name, 24), 40, 92, 32, ink, 'font-weight="800"') + text(`@${profile.login}`, 40, 116, 13, muted, 'class="mono"');
  if (bins.length === 0) {
    body += text(blocks.has('projects') ? 'Switch on Languages as well, so there are bins to drop into.' : 'Switch on Top projects to have something to drop.', 40, 170, 15, muted, 'font-style="italic"');
    return svgDoc({ height: 220, title: `${name} on GitHub, as a Plinko board`, bg: board, radius: 14, css: riseCss(motion), body: body.replace(`height="${height}"`, 'height="220"') });
  }
  const slots = Math.max(2, bins.length);
  const rows = slots - 1;
  const sp = Math.min(100, 470 / slots);
  const cx = 610;
  const top = 70;
  const rowH = Math.min(64, 250 / rows);
  const binTop = top + rows * rowH + 30;
  // A faint lattice of pegs fills out the board. The bright pegs are the ones the balls actually bounce off.
  for (let r = 0; r <= rows; r++) for (let j = 0; j <= slots; j++) body += `<circle cx="${num(cx + (j - slots / 2 + (r % 2 === 0 ? 0 : 0.5)) * sp)}" cy="${num(top + r * rowH)}" r="3" fill="${peg}" fill-opacity="0.25"/>`;
  for (let r = 0; r < rows; r++) for (let j = 0; j <= r; j++) body += `<circle cx="${num(cx + (j - r / 2) * sp)}" cy="${top + r * rowH}" r="4.5" fill="${peg}"/>`;
  let balls = '';
  let resting = '';
  const stack = new Map<number, number>();
  let order = 0;
  bins.forEach((bin, slot) => {
    const bx = cx + (slot - rows / 2) * sp;
    const color = langColor(bin.name === 'other' ? 'zzz-other' : bin.name, variant);
    body += `<path d="M${num(bx - sp / 2)} ${binTop}v${height - binTop - 70}M${num(bx + sp / 2)} ${binTop}v${height - binTop - 70}" stroke="${peg}" stroke-opacity="0.6"/>`;
    body += text(truncate(bin.name, 9), bx, height - 42, 11.5, ink, 'class="mono" text-anchor="middle" font-weight="700"') + text(`${bin.repos.length} ${bin.repos.length === 1 ? 'repo' : 'repos'}`, bx, height - 26, 10, muted, 'class="mono" text-anchor="middle"');
    bin.repos.forEach((repo) => {
      const level = stack.get(slot) ?? 0;
      stack.set(slot, level + 1);
      const ry = height - 82 - level * 17;
      const moves = bounces(slot, slots, `${profile.login}:${repo.name}`);
      let x = cx;
      let d = `M${num(cx)} ${top - 30}`;
      moves.forEach((m, r) => {
        x += m === 'R' ? sp / 2 : -sp / 2;
        d += `L${num(x)} ${top + r * rowH + 14}`;
      });
      d += `L${num(bx)} ${binTop + 12}L${num(bx)} ${ry}`;
      resting += `<circle cx="${num(bx)}" cy="${ry}" r="7.5" fill="${color}" stroke="${ink}" stroke-opacity="0.35"/>`;
      if (motion) {
        balls += `<circle class="drop" r="7.5" fill="${color}" stroke="${ink}" stroke-opacity="0.35"><animateMotion dur="8s" begin="${(order * 0.6).toFixed(1)}s" repeatCount="indefinite" calcMode="linear" keyPoints="0;1;1" keyTimes="0;0.25;1" path="${d}"/></circle>`;
      }
      order++;
    });
  });
  body += resting + balls;
  const lines = ['Each ball is one of your top projects.', 'It drops through the pegs and lands in the bin of its main language, so the bins show how your best work divides by language.', 'The bounces are only for fun. Where a ball lands is not.'];
  lines.forEach((l, i) => wrap(l, 30, 4).forEach((part, j) => (body += text(part, 40, 190 + i * 96 + j * 20, 14, i === 2 ? muted : ink, ''))));
  const css = riseCss(motion) + (motion ? `@media (prefers-reduced-motion:reduce){.drop{display:none}}` : '');
  return svgDoc({ height, title: `${name} on GitHub, as a Plinko board: each top project lands in the bin of its main language`, bg: board, radius: 14, css, body });
}

export const plinko: Template = imageTemplate('plinko', 'Plinko', 'A Plinko board: each top project drops through the pegs and lands in the bin of its main language.', ['creative', 'game', 'projects'], plinkoSvg, {
  extra: () => 'shown as a Plinko board',
});

export const plotTemplates: Template[] = [topo, natal, stitch, punch, plinko];
