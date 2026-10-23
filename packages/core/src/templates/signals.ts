import { hslToHex, hueOf } from '../color';
import { weeklyTotals } from '../contributions';
import type { Variant } from '../themes';
import type { Config, ContributionDay, Profile, Template } from '../types';
import { formatNumber, truncate, xmlEscape } from '../util';
import { num, riseCss } from './kit';
import { hashOf, imageTemplate, svgDoc } from './make';
import { plural, rise } from './shared';

/** Five designs that turn a year of activity into a picture: a garden, ridgelines, a pulse, a drum machine and a forecast. */

const hueFor = (profile: Profile, fallback: number): number => hueOf(profile.avatar?.grid.tint) ?? fallback;

const text = (value: string, x: number, y: number, size: number, fill: string, extra = ''): string =>
  `<text x="${num(x)}" y="${num(y)}" font-size="${size}" fill="${fill}" ${extra}>${xmlEscape(value)}</text>`;

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/** What a design says when there is no calendar to draw. It says what it is waiting for and never fills the space. */
const waiting = (blocks: Set<string>): string => (blocks.has('activity') ? 'This appears after the first automatic update, once the contribution calendar is available.' : 'The activity section is switched off.');

/** The activity a design may draw: none when the section is off or the calendar is missing or empty. */
function daysOf(profile: Profile, config: Config): ContributionDay[] {
  return config.blocks.includes('activity') && profile.contributions ? profile.contributions.days : [];
}

/* ------------------------------------------------------------------------------------------------ */
/* Garden                                                                                            */
/* ------------------------------------------------------------------------------------------------ */

/** The date each calendar week starts on, in the same order as weeklyTotals. Weeks start on Sunday. */
export function weekStarts(days: ReadonlyArray<{ date: string }>): string[] {
  const starts: string[] = [];
  days.forEach((day, index) => {
    if (index === 0 || new Date(`${day.date}T00:00:00Z`).getUTCDay() === 0) starts.push(day.date);
  });
  return starts;
}

/** How tall a flower stem is: nothing for a week with no activity, otherwise between 14 and `max`. */
export function stemHeight(count: number, peak: number, max: number): number {
  if (!(count > 0) || !(peak > 0)) return 0;
  return Math.round(14 + Math.sqrt(Math.min(1, count / peak)) * (max - 14));
}

function gardenSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const hue = hueFor(profile, 330);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const days = daysOf(profile, config);
  const name = profile.name ?? profile.login;
  const skyTop = dark ? '#0d1424' : '#9fd4f2';
  const skyBottom = dark ? '#1c2b3f' : '#e2f4fb';
  const ground = dark ? '#173222' : '#6fbf6a';
  const groundDark = dark ? '#0f2418' : '#4fa353';
  const ink = dark ? '#e8f1ec' : '#16331f';
  const muted = dark ? '#90a89a' : '#3f6a4a';
  const height = 440;
  const grassY = 340;
  const defs = `<linearGradient id="sky" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${skyTop}"/><stop offset="1" stop-color="${skyBottom}"/></linearGradient>`;

  let body = `<rect width="900" height="${height}" fill="url(#sky)"/>`;
  body += `<circle cx="800" cy="80" r="${dark ? 26 : 36}" fill="${dark ? '#f5f0d0' : '#ffd23f'}" fill-opacity="${dark ? 0.9 : 1}"/>`;
  body += `<path d="M0 ${grassY - 18}Q225 ${grassY - 44} 450 ${grassY - 20}T900 ${grassY - 24}V${height}H0Z" fill="${groundDark}"/><rect x="0" y="${grassY}" width="900" height="${height - grassY}" fill="${ground}"/>`;
  body += text(`${truncate(name, 24)}’s garden`, 36, 52, 24, ink, 'font-weight="800"');
  body += text(`@${profile.login}`, 36, 74, 13, muted, 'class="mono"');

  if (days.length === 0) {
    body += text(waiting(blocks), 36, 150, 15, muted, 'font-style="italic"');
    return svgDoc({ height, title: `${name} on GitHub, as a garden`, bg: skyBottom, radius: 14, defs, css: riseCss(motion), body });
  }
  const weeks = weeklyTotals(days);
  const starts = weekStarts(days);
  const peak = Math.max(...weeks, 0);
  const step = 820 / weeks.length;
  const palette = [0, 40, 200, 290, 340].map((offset) => hslToHex((hue + offset) % 360, 0.8, dark ? 0.65 : 0.55));
  let flowers = '';
  weeks.forEach((count, i) => {
    const x = 50 + (i + 0.5) * step;
    const h = stemHeight(count, peak, 220);
    const sway = motion ? ` class="sway" style="animation-delay:${((i * 0.17) % 2.6).toFixed(2)}s;transform-origin:${num(x)}px ${grassY}px"` : '';
    if (h === 0) {
      flowers += `<path d="M${num(x)} ${grassY}v-7" stroke="${groundDark}" stroke-width="2.5" stroke-linecap="round"/>`;
      return;
    }
    const color = palette[hashOf(`${profile.login}:${i}`) % palette.length]!;
    const r = 5 + Math.sqrt(count / peak) * 11;
    const top = grassY - h;
    flowers += `<g${sway}><path d="M${num(x)} ${grassY}V${num(top)}" stroke="${dark ? '#3f9a5a' : '#2e8a4a'}" stroke-width="2.5" stroke-linecap="round"/>`;
    for (let p = 0; p < 6; p++) {
      const a = (p / 6) * Math.PI * 2;
      flowers += `<circle cx="${num(x + Math.cos(a) * r * 0.9)}" cy="${num(top + Math.sin(a) * r * 0.9)}" r="${num(r * 0.62)}" fill="${color}"/>`;
    }
    flowers += `<circle cx="${num(x)}" cy="${num(top)}" r="${num(Math.max(2.5, r * 0.42))}" fill="#ffd23f"/></g>`;
  });
  body += flowers;
  // Month names under the grass, at the first week of each month.
  let last = '';
  starts.forEach((date, i) => {
    const key = date.slice(0, 7);
    // A month name is shown once, and the first week is skipped when it begins late in its month and would crowd the next label.
    const lateStart = i === 0 && weeks.length > 6 && date.slice(8) > '20';
    if (key === last || lateStart) return;
    last = key;
    body += text(MONTHS[Number(date.slice(5, 7)) - 1]!, 50 + (i + 0.5) * step, grassY + 26, 11, dark ? '#bfe3c9' : '#ffffff', 'class="mono" text-anchor="middle" font-weight="700"');
  });
  const active = days.filter((d) => d.count > 0).length;
  body += text(`${plural(active, 'active day')} · one flower for each week, taller for a busier week`, 36, height - 28, 12, dark ? '#bfe3c9' : '#ffffff', 'class="mono"');
  const css = riseCss(motion) + (motion ? `.sway{animation:sway 2.6s ease-in-out infinite alternate}@keyframes sway{from{transform:rotate(-2.2deg)}to{transform:rotate(2.2deg)}}@media (prefers-reduced-motion:reduce){.sway{animation:none}}` : '');
  return svgDoc({ height, title: `${name} on GitHub, as a garden of contributions`, bg: skyBottom, radius: 14, defs, css, body });
}

export const garden: Template = imageTemplate('garden', 'Garden', 'A garden with a flower for every week of the year, taller in busier weeks.', ['creative', 'activity', 'nature'], gardenSvg, {
  activity: true,
  extra: () => 'shown as a garden with a flower for each week',
});

/* ------------------------------------------------------------------------------------------------ */
/* Ridgeline                                                                                         */
/* ------------------------------------------------------------------------------------------------ */

export interface MonthRow {
  key: string;
  label: string;
  /** One count for each day the data has in that month, from the first one present. */
  days: Array<{ day: number; count: number }>;
  total: number;
}

/** The last `months` calendar months of data, oldest first. A month at either end holds only the days there are. */
export function monthlySeries(days: ReadonlyArray<ContributionDay>, months = 12): MonthRow[] {
  const rows: MonthRow[] = [];
  for (const d of days) {
    const key = d.date.slice(0, 7);
    let row = rows[rows.length - 1];
    if (!row || row.key !== key) {
      row = { key, label: `${MONTHS[Number(key.slice(5, 7)) - 1] ?? '???'} ${key.slice(0, 4)}`, days: [], total: 0 };
      rows.push(row);
    }
    row.days.push({ day: Number(d.date.slice(8, 10)), count: d.count });
    row.total += d.count;
  }
  return rows.slice(-months);
}

function ridgeSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const hue = hueFor(profile, 200);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const days = daysOf(profile, config);
  const bg = dark ? '#0a0b0e' : '#f4f3ef';
  const line = dark ? '#f2f2f2' : '#111111';
  const muted = dark ? '#8a8f9a' : '#6b7080';
  const name = profile.name ?? profile.login;
  const rows = monthlySeries(days, 12);
  const rowH = 38;
  const top = 128;
  const height = Math.max(260, top + Math.max(rows.length, 1) * rowH + 90);
  const peak = Math.max(...days.map((d) => d.count), 0);
  const left = 150;
  const right = 760;

  let body = text('CONTRIBUTIONS, MONTH BY MONTH', 36, 52, 11, muted, 'letter-spacing="5" font-weight="800"');
  body += text(truncate(name, 28), 36, 86, 28, line, 'font-weight="800"');
  body += text(`@${profile.login}`, 36, 108, 13, muted, 'class="mono"');
  if (rows.length === 0 || peak === 0) {
    body += text(rows.length === 0 ? waiting(blocks) : 'No contributions in this period, so the lines stay flat.', 36, 160, 15, muted, 'font-style="italic"');
    if (rows.length === 0) return svgDoc({ height: 260, title: `${name} on GitHub, as ridgelines`, bg, radius: 14, css: riseCss(motion), body });
  }
  const stroke = hslToHex(hue, 0.0, dark ? 0.95 : 0.05);
  rows.forEach((row, i) => {
    const base = top + i * rowH + 40;
    const pts = row.days.map((d) => `${num(left + ((d.day - 1) / 30) * (right - left))} ${num(base - (peak > 0 ? (d.count / peak) * 58 : 0))}`);
    const first = row.days[0]!;
    const lastD = row.days[row.days.length - 1]!;
    const x0 = left + ((first.day - 1) / 30) * (right - left);
    const x1 = left + ((lastD.day - 1) / 30) * (right - left);
    const shape = `M${num(x0)} ${base}L${pts.join('L')}L${num(x1)} ${base}Z`;
    body += `<g class="ridge" style="animation-delay:${(i * 0.09).toFixed(2)}s"><path d="${shape}" fill="${bg}"/><path d="M${pts.join('L')}" fill="none" stroke="${stroke}" stroke-width="1.6" stroke-linejoin="round"/><path d="M${num(x0)} ${base}H${num(x1)}" stroke="${stroke}" stroke-opacity="0.25"/></g>`;
    body += text(row.label, 36, base + 2, 11.5, muted, 'class="mono" font-weight="700"');
    body += text(formatNumber(row.total), 864, base + 2, 11.5, muted, 'class="mono" text-anchor="end"');
  });
  body += text('each line is one month, left to right across its days; a taller peak is a busier day', 36, height - 24, 11, muted, 'class="mono"');
  const css = riseCss(motion) + (motion ? `.ridge{animation:fade .6s ease-out both}@keyframes fade{from{opacity:0;transform:translateY(8px)}}@media (prefers-reduced-motion:reduce){.ridge{animation:none}}` : '');
  return svgDoc({ height, title: `${name} on GitHub, as ridgelines of contributions`, bg, radius: 14, css, body });
}

export const ridgeline: Template = imageTemplate('ridgeline', 'Ridgeline', 'Your last twelve months as stacked ridgelines, one line for each month.', ['creative', 'activity', 'art'], ridgeSvg, {
  activity: true,
  extra: () => 'shown as stacked ridgelines, one for each month',
});

/* ------------------------------------------------------------------------------------------------ */
/* Pulse monitor                                                                                     */
/* ------------------------------------------------------------------------------------------------ */

/** How many of the most recent days the pulse monitor traces. A whole year would be too tight to read. */
export const PULSE_DAYS = 90;

/** The path of a heartbeat trace: flat for a quiet day and a spike for an active one, as tall as its share of the busiest day. */
export function pulsePath(counts: ReadonlyArray<number>, x0: number, width: number, base: number, maxSpike: number): string {
  if (counts.length === 0) return '';
  const peak = Math.max(...counts, 0);
  const step = width / counts.length;
  let d = `M${num(x0)} ${num(base)}`;
  counts.forEach((count, i) => {
    const x = x0 + i * step;
    if (count > 0 && peak > 0) {
      const h = 14 + Math.sqrt(count / peak) * (maxSpike - 14);
      d += `L${num(x + step * 0.2)} ${num(base)}L${num(x + step * 0.45)} ${num(base - h)}L${num(x + step * 0.7)} ${num(base + h * 0.25)}L${num(x + step * 0.9)} ${num(base)}`;
    } else {
      d += `L${num(x + step)} ${num(base)}`;
    }
  });
  return d;
}

function pulseSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const days = daysOf(profile, config);
  const bg = dark ? '#050807' : '#cfd9d2';
  const screen = dark ? '#06130c' : '#e8f2ea';
  const trace = dark ? '#3dff8a' : '#0a7a3c';
  const grid = dark ? '#0f3a22' : '#a9c4b3';
  const dim = dark ? '#2d8a55' : '#3d6b4f';
  const name = profile.name ?? profile.login;
  const height = 420;

  let body = `<rect x="22" y="22" width="856" height="${height - 44}" rx="16" fill="${screen}" stroke="${dark ? '#12261b' : '#8fa89a'}" stroke-width="3"/>`;
  for (let x = 40; x <= 860; x += 41) body += `<path d="M${x} 40V${height - 40}" stroke="${grid}" stroke-width="1"/>`;
  for (let y = 40; y <= height - 40; y += 38) body += `<path d="M40 ${y}H860" stroke="${grid}" stroke-width="1"/>`;
  body += text(`${truncate(name, 24).toUpperCase()}   @${profile.login}`, 48, 66, 14, trace, 'class="mono" font-weight="700" letter-spacing="2"');
  if (days.length === 0) {
    body += text(waiting(blocks), 48, 160, 14, dim, 'class="mono"');
    return svgDoc({ height, title: `${name} on GitHub, as a pulse monitor`, bg, radius: 14, css: riseCss(motion), body });
  }
  const counts = days.map((d) => d.count);
  const shown = counts.slice(-PULSE_DAYS);
  const d = pulsePath(shown, 48, 560, 220, 120);
  body += `<path d="${d}" fill="none" stroke="${trace}" stroke-width="2.2" stroke-linejoin="round" stroke-opacity="0.35"/>`;
  body += `<path class="trace" d="${d}" fill="none" stroke="${trace}" stroke-width="2.2" stroke-linejoin="round" pathLength="1"/>`;
  body += `<rect class="scan" x="48" y="46" width="3" height="${height - 92}" fill="${trace}" fill-opacity="0.6"/>`;
  const sum = (list: number[]) => list.reduce((a, b) => a + b, 0);
  const rows: Array<[string, string]> = [['TOTAL (YEAR)', formatNumber(sum(counts))], ['LAST 7 DAYS', formatNumber(sum(counts.slice(-7)))], ['ACTIVE DAYS', `${counts.filter((c) => c > 0).length} / ${counts.length}`]];
  if (profile.contributions) rows.push(['STREAK', `${profile.contributions.currentStreak} d`], ['BEST STREAK', `${profile.contributions.longestStreak} d`]);
  rows.forEach(([label, value], i) => {
    const y = 108 + i * 52;
    body += text(label, 640, y, 11, dim, 'class="mono" letter-spacing="3" font-weight="700"') + text(value, 640, y + 26, 26, trace, 'class="mono" font-weight="800"');
  });
  body += text(`LAST ${shown.length} DAYS · EACH SPIKE IS A DAY WITH ACTIVITY, TALLER IS BUSIER`, 48, height - 52, 10.5, dim, 'class="mono" letter-spacing="1"');
  const css =
    riseCss(motion) +
    (motion
      ? `.trace{stroke-dasharray:1;stroke-dashoffset:0;animation:draw 3.2s linear both}@keyframes draw{from{stroke-dashoffset:1}}.scan{animation:scan 3.2s linear both}@keyframes scan{to{transform:translateX(560px)}}@media (prefers-reduced-motion:reduce){.trace,.scan{animation:none}.scan{display:none}}`
      : '.scan{display:none}');
  return svgDoc({ height, title: `${name} on GitHub, as a pulse monitor of contributions`, bg, radius: 14, css, body });
}

export const pulse: Template = imageTemplate('pulse', 'Pulse monitor', 'A heart monitor whose trace is your year: a spike for every active day.', ['creative', 'activity', 'fun'], pulseSvg, {
  activity: true,
  extra: () => 'shown as a heart monitor trace of the year',
});

/* ------------------------------------------------------------------------------------------------ */
/* Drum machine                                                                                      */
/* ------------------------------------------------------------------------------------------------ */

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

/** The last `weeks` weeks as a grid, one row for each weekday from Monday and one column for each week. Missing days are null. */
export function padGrid(days: ReadonlyArray<ContributionDay>, weeks = 26): Array<Array<ContributionDay | null>> {
  const grid: Array<Array<ContributionDay | null>> = Array.from({ length: 7 }, () => []);
  if (days.length === 0) return grid;
  const monday = (iso: string): number => {
    const day = new Date(`${iso}T00:00:00Z`);
    return Math.floor((day.getTime() - ((day.getUTCDay() + 6) % 7) * 86_400_000) / 86_400_000);
  };
  const last = monday(days[days.length - 1]!.date);
  const byDate = new Map(days.map((d) => [d.date, d] as const));
  for (let w = weeks - 1; w >= 0; w--) {
    const start = (last - w * 7) * 86_400_000;
    for (let r = 0; r < 7; r++) grid[r]!.push(byDate.get(new Date(start + r * 86_400_000).toISOString().slice(0, 10)) ?? null);
  }
  return grid;
}

function drumsSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const hue = hueFor(profile, 20);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const days = daysOf(profile, config);
  const body0 = dark ? '#1b1c21' : '#e3e1dc';
  const plate = dark ? '#24262d' : '#f4f2ec';
  const ink = dark ? '#e9e9ee' : '#25262b';
  const muted = dark ? '#8b8f9c' : '#767985';
  const padOff = dark ? '#33363f' : '#cfccc4';
  const lit = [0.5, 0.58, 0.64, 0.7].map((l) => hslToHex(hue, 0.9, dark ? l : l - 0.12));
  const name = profile.name ?? profile.login;
  const weeks = 26;
  const grid = padGrid(days, weeks);
  const px = 28;
  const py = 150;
  const cw = 22;
  const gap = 6;
  const rh = 30;
  const height = 520;

  let body = `<rect x="22" y="22" width="856" height="${height - 44}" rx="18" fill="${plate}"/>`;
  body += text(truncate(name, 26).toUpperCase(), 48, 62, 22, ink, 'font-weight="800" letter-spacing="3"');
  body += text(`@${profile.login}  ·  SEQUENCER`, 48, 84, 12, muted, 'class="mono" letter-spacing="2"');
  if (days.length === 0) {
    body += text(waiting(blocks), 48, 170, 14, muted, 'font-style="italic"');
    return svgDoc({ height: 300, title: `${name} on GitHub, as a drum machine`, bg: body0, radius: 14, css: riseCss(motion), body });
  }
  // Knobs: each is a real ratio, with the numbers beside it.
  const total = days.length;
  const active = days.filter((d) => d.count > 0).length;
  const contributions = profile.contributions;
  const knobs: Array<[string, number, string]> = [['ACTIVE DAYS', total ? active / total : 0, `${active}/${total}`]];
  if (contributions) knobs.push(['STREAK', contributions.longestStreak > 0 ? contributions.currentStreak / contributions.longestStreak : 0, `${contributions.currentStreak}/${contributions.longestStreak}`]);
  const peak = Math.max(...days.map((d) => d.count), 0);
  const recent = days.slice(-7).reduce((a, d) => a + d.count, 0);
  knobs.push(['LAST 7 DAYS', peak > 0 ? Math.min(1, recent / (peak * 7)) : 0, formatNumber(recent)]);
  knobs.forEach(([label, frac, readout], i) => {
    const cx = 640 + i * 78;
    const cy = 70;
    const ang = -135 + Math.max(0, Math.min(1, frac)) * 270;
    body += `<circle cx="${cx}" cy="${cy}" r="24" fill="${dark ? '#0f1013' : '#d9d6cf'}"/><circle cx="${cx}" cy="${cy}" r="19" fill="${dark ? '#2b2e37' : '#fbfaf6'}"/>`;
    body += `<path d="M${cx} ${cy}L${num(cx + Math.sin((ang * Math.PI) / 180) * 17)} ${num(cy - Math.cos((ang * Math.PI) / 180) * 17)}" stroke="${lit[1]}" stroke-width="3.5" stroke-linecap="round"/>`;
    body += text(label, cx, cy + 42, 8.5, muted, 'text-anchor="middle" letter-spacing="1" font-weight="800"') + text(readout, cx, cy + 56, 10.5, ink, 'class="mono" text-anchor="middle" font-weight="700"');
  });
  WEEKDAYS.forEach((day, r) => {
    body += text(day, 48, py + r * rh + 19, 10.5, muted, 'class="mono" font-weight="700"');
    for (let c = 0; c < weeks; c++) {
      const cell = grid[r]![c];
      const x = 90 + c * (cw + gap);
      const color = cell && cell.count > 0 ? lit[Math.min(3, Math.max(0, cell.level - 1))]! : padOff;
      body += `<rect x="${x}" y="${py + r * rh}" width="${cw}" height="${rh - 6}" rx="4" fill="${color}"${cell ? '' : ' fill-opacity="0.45"'}/>`;
    }
  });
  body += `<rect class="head" x="${90 - 3}" y="${py - 6}" width="${cw + 6}" height="${7 * rh + 4}" rx="6" fill="none" stroke="${ink}" stroke-opacity="0.7" stroke-width="2"/>`;
  const sum = days.reduce((a, d) => a + d.count, 0);
  body += text(`${formatNumber(sum)} CONTRIBUTIONS · LAST ${weeks} WEEKS · LIT PAD = ACTIVE DAY, BRIGHTER = BUSIER`, 48, py + 7 * rh + 36, 10.5, muted, 'class="mono" letter-spacing="1"');
  const css = riseCss(motion) + (motion ? `.head{animation:play ${weeks * 0.25}s steps(${weeks}) infinite}@keyframes play{to{transform:translateX(${weeks * (cw + gap)}px)}}@media (prefers-reduced-motion:reduce){.head{animation:none}}` : '');
  return svgDoc({ height: py + 7 * rh + 70, title: `${name} on GitHub, as a drum machine of contributions`, bg: body0, radius: 14, css, body });
}

export const drums: Template = imageTemplate('drums', 'Drum machine', 'A step sequencer: a pad for each of your last 26 weeks and 7 weekdays, lit by real activity, with knobs for your streaks.', ['creative', 'activity', 'music'], drumsSvg, {
  activity: true,
  extra: () => 'shown as a drum machine with a lit pad for each active day',
});

/* ------------------------------------------------------------------------------------------------ */
/* Weather forecast                                                                                  */
/* ------------------------------------------------------------------------------------------------ */

export type Sky = 'quiet' | 'some' | 'busy';

/** The usual size of an active day: the middle one of the days with any activity. Zero when there were none. */
export function typicalDay(days: ReadonlyArray<{ count: number }>): number {
  const counts = days.filter((d) => d.count > 0).map((d) => d.count).sort((a, b) => a - b);
  if (counts.length === 0) return 0;
  const mid = Math.floor(counts.length / 2);
  return counts.length % 2 ? counts[mid]! : (counts[mid - 1]! + counts[mid]!) / 2;
}

/** The weather for a day: quiet with no activity, busy when it beat a typical active day, otherwise some. */
export function skyFor(count: number, typical: number): Sky {
  if (!(count > 0)) return 'quiet';
  return count > typical ? 'busy' : 'some';
}

function skyIcon(sky: Sky, cx: number, cy: number, s: number, dark: boolean): string {
  const sun = '#ffc933';
  const cloud = dark ? '#8b97ab' : '#aab4c4';
  const cloudBody = (x: number, y: number, k: number, fill: string) => `<g fill="${fill}"><circle cx="${num(x - 14 * k)}" cy="${num(y + 4 * k)}" r="${num(12 * k)}"/><circle cx="${num(x)}" cy="${num(y - 4 * k)}" r="${num(16 * k)}"/><circle cx="${num(x + 16 * k)}" cy="${num(y + 5 * k)}" r="${num(11 * k)}"/><rect x="${num(x - 22 * k)}" y="${num(y + 4 * k)}" width="${num(48 * k)}" height="${num(12 * k)}" rx="${num(6 * k)}"/></g>`;
  const rays = (x: number, y: number, r: number) => Array.from({ length: 8 }, (_v, i) => { const a = (i / 8) * Math.PI * 2; return `<path d="M${num(x + Math.cos(a) * (r + 5))} ${num(y + Math.sin(a) * (r + 5))}L${num(x + Math.cos(a) * (r + 12))} ${num(y + Math.sin(a) * (r + 12))}" stroke="${sun}" stroke-width="3" stroke-linecap="round"/>`; }).join('');
  if (sky === 'busy') return `<circle cx="${cx}" cy="${cy}" r="${num(14 * s)}" fill="${sun}"/>${rays(cx, cy, 14 * s)}`;
  if (sky === 'some') return `<circle cx="${num(cx - 8 * s)}" cy="${num(cy - 8 * s)}" r="${num(12 * s)}" fill="${sun}"/>${cloudBody(cx + 4 * s, cy + 6 * s, 0.9 * s, cloud)}`;
  return cloudBody(cx, cy, 1.1 * s, cloud);
}

function weatherSvg(profile: Profile, config: Config, variant: Variant): string {
  const dark = variant === 'dark';
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const days = daysOf(profile, config);
  const bgTop = dark ? '#1a2540' : '#6fb4e8';
  const bgBottom = dark ? '#0e1424' : '#bfe0f5';
  const card = dark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.55)';
  const ink = dark ? '#f1f5ff' : '#10243f';
  const muted = dark ? '#a7b4d0' : '#2e4a6e';
  const name = profile.name ?? profile.login;
  const defs = `<linearGradient id="wx" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${bgTop}"/><stop offset="1" stop-color="${bgBottom}"/></linearGradient>`;
  const height = 440;
  let body = `<rect width="900" height="${height}" fill="url(#wx)"/>`;
  body += text(truncate(name, 26), 40, 60, 24, ink, 'font-weight="800"') + text(`@${profile.login}`, 40, 82, 13, muted, 'class="mono"');
  if (days.length === 0) {
    body += text(waiting(blocks), 40, 150, 15, muted, 'font-style="italic"');
    return svgDoc({ height: 260, title: `${name} on GitHub, as a weather forecast`, bg: bgBottom, radius: 14, defs, css: riseCss(motion), body });
  }
  const typical = typicalDay(days);
  const week = days.slice(-7);
  const today = week[week.length - 1]!;
  const todaySky = skyFor(today.count, typical);
  const label: Record<Sky, string> = { quiet: 'Quiet', some: 'Some activity', busy: 'Busy' };
  // Today, large.
  body += `<rect x="40" y="108" width="300" height="190" rx="20" fill="${card}"/>`;
  body += text('LATEST DAY', 62, 140, 11, muted, 'letter-spacing="4" font-weight="800"') + text(today.date, 62, 160, 13, muted, 'class="mono"');
  body += skyIcon(todaySky, 130, 214, 2.1, dark);
  body += text(String(today.count), 220, 240, 64, ink, 'font-weight="800"') + text(label[todaySky], 62, 282, 17, ink, 'font-weight="700"');
  // The seven days.
  week.forEach((day, i) => {
    const x = 366 + i * 70;
    const sky = skyFor(day.count, typical);
    const weekday = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][new Date(`${day.date}T00:00:00Z`).getUTCDay()]!;
    body += `<g class="day" style="animation-delay:${(i * 0.08).toFixed(2)}s"><rect x="${x}" y="108" width="62" height="190" rx="16" fill="${card}"/>`;
    body += text(weekday, x + 31, 136, 12, muted, 'text-anchor="middle" letter-spacing="2" font-weight="800"');
    body += skyIcon(sky, x + 31, 190, 1, dark);
    body += text(String(day.count), x + 31, 262, 26, ink, 'text-anchor="middle" font-weight="800"');
    body += `</g>`;
  });
  // The year, as a line.
  const weeks = weeklyTotals(days);
  const peak = Math.max(...weeks, 1);
  const step = 820 / Math.max(1, weeks.length - 1);
  const pts = weeks.map((w, i) => `${num(40 + i * step)} ${num(420 - (w / peak) * 46)}`).join('L');
  body += `<path d="M${pts}" fill="none" stroke="${ink}" stroke-opacity="0.8" stroke-width="2.2" stroke-linejoin="round"/>`;
  body += text('THE WEEKS OF THE YEAR', 40, 326, 11, muted, 'letter-spacing="4" font-weight="800"');
  body += text(`Busy = more than a typical active day (${typical}). The last seven days are shown.`, 40, 346, 12, muted, 'class="mono"');
  const css = riseCss(motion) + (motion ? `.day{animation:rise .5s ease-out both}@keyframes rise{from{opacity:0;transform:translateY(10px)}}@media (prefers-reduced-motion:reduce){.day{animation:none}}` : '');
  return svgDoc({ height, title: `${name} on GitHub, as a weather forecast`, bg: bgBottom, radius: 14, defs, css, body });
}

export const weather: Template = imageTemplate('weather', 'Weather forecast', 'A forecast card for your last seven days: sunny when busy, cloudy when quiet, with the year as a line.', ['creative', 'activity', 'fun'], weatherSvg, {
  activity: true,
  extra: () => 'shown as a weather forecast of the last seven days',
});

export const signalTemplates: Template[] = [garden, ridgeline, pulse, drums, weather];
