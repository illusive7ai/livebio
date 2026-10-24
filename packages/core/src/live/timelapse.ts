import type { ContributionDay } from '../types';

/** How long one replay of the year takes. */
export const TIMELAPSE_SECONDS = 18;

/** The part of each replay, in percent, during which the year is being built. The rest is a pause on the finished city. */
const BUILD_START = 3;
const BUILD_END = 84;
/** The finished city stays until this point, then fades so the loop can restart unseen. */
export const HOLD_UNTIL = 94;
/** How much of the replay a building takes to rise, in percent. */
const RISE = 1.6;

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export interface TimelapseMonth {
  /** "Mar 2026". */
  label: string;
  /** Contributions from the start of the window up to the end of this month. */
  total: number;
  /** When the month begins and when the next begins, in percent of the replay. The last month runs to HOLD_UNTIL. */
  from: number;
  to: number;
}

export interface TimelapsePlan {
  /** When each calendar-graph column (one week) starts to rise, in percent of the replay. Keyed by column number. */
  columns: Map<number, number>;
  months: TimelapseMonth[];
}

/** Where day number `index` of `count` falls in the replay, in percent. The first day is at the start, the last at the end. */
function at(index: number, count: number): number {
  return count <= 1 ? BUILD_START : BUILD_START + ((BUILD_END - BUILD_START) * index) / (count - 1);
}

/**
 * Works out when each week's buildings rise and which month the clock shows. Time runs in step with the real
 * calendar: a quiet month passes as quickly as a busy one, and the running total only ever uses real counts.
 * `columnOf` says which graph column a day sits in, so a week's buildings rise together.
 */
export function planTimelapse(days: ContributionDay[], columnOf: (date: string) => number | undefined): TimelapsePlan {
  const columns = new Map<number, number>();
  const monthsByKey = new Map<string, { label: string; first: number; total: number }>();
  let running = 0;
  days.forEach((day, index) => {
    const column = columnOf(day.date);
    if (column !== undefined && !columns.has(column)) columns.set(column, at(index, days.length));
    running += day.count;
    const key = day.date.slice(0, 7);
    const existing = monthsByKey.get(key);
    if (existing) existing.total = running;
    else {
      const [year, month] = key.split('-');
      monthsByKey.set(key, { label: `${MONTH_NAMES[Number(month) - 1] ?? ''} ${year}`, first: index, total: running });
    }
  });
  const list = [...monthsByKey.values()];
  const months = list.map((m, i) => ({
    label: m.label,
    total: m.total,
    from: i === 0 ? 0 : at(m.first, days.length),
    to: i === list.length - 1 ? HOLD_UNTIL : at(list[i + 1]!.first, days.length),
  }));
  return { columns, months };
}

const pct = (value: number): string => String(Math.round(value * 100) / 100);

/** The keyframes and rules for the replay. Only used when motion is on. */
export function timelapseCss(plan: TimelapsePlan, peakAt: number | undefined): string {
  const t = `${TIMELAPSE_SECONDS}s`;
  let css = `.tl-fade{animation:tl-fade ${t} linear infinite both}@keyframes tl-fade{0%,${HOLD_UNTIL}%{opacity:1}99%,100%{opacity:0}}`;
  for (const [column, start] of plan.columns) {
    css += `.tl${column}{transform-box:fill-box;transform-origin:50% 100%;animation:tl${column} ${t} linear infinite both}`;
    css += `@keyframes tl${column}{0%,${pct(start)}%{transform:scaleY(0)}${pct(start + RISE)}%,100%{transform:scaleY(1)}}`;
  }
  plan.months.forEach((m, i) => {
    css += `.tm${i}{opacity:0;animation:tm${i} ${t} linear infinite both}`;
    const rise = m.from === 0 ? `0%,${pct(m.to)}%{opacity:1}` : `0%,${pct(m.from)}%{opacity:0}${pct(m.from + 0.01)}%,${pct(m.to)}%{opacity:1}`;
    const fall = i === plan.months.length - 1 ? '99%,100%{opacity:0}' : `${pct(m.to + 0.01)}%,100%{opacity:0}`;
    css += `@keyframes tm${i}{${rise}${fall}}`;
  });
  if (peakAt !== undefined) {
    css += `.tl-flag{animation:tl-flag ${t} linear infinite both}@keyframes tl-flag{0%,${pct(peakAt + RISE)}%{opacity:0}${pct(peakAt + RISE + 0.5)}%,${HOLD_UNTIL}%{opacity:1}99%,100%{opacity:0}}`;
  }
  // Without motion, show the finished city and the full-year total.
  css += `@media (prefers-reduced-motion:reduce){[class^=tl]{animation:none!important}.tm${plan.months.length - 1}{animation:none;opacity:1}}`;
  return css;
}
