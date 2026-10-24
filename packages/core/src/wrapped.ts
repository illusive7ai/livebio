import type { LanguageShare, Profile, RepoSummary } from './types';

/**
 * A look back over the last twelve months, worked out only from the contribution calendar and public profile
 * that GitHub returned. Nothing is guessed: GitHub's calendar has no time of day, so there is no "night owl",
 * and it covers one year, so there is no comparison with an earlier one.
 */

const MS_PER_DAY = 86_400_000;
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const WEEKDAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

const dayNumber = (date: string): number => {
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1) / MS_PER_DAY;
};
/** Monday is 0, Sunday is 6. */
const weekdayOf = (date: string): number => (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7;

export interface Span {
  length: number;
  from: string;
  to: string;
}

export interface WrappedTrait {
  id: string;
  title: string;
  /** The numbers that earned the label, in a sentence. A label is never shown without its reason. */
  reason: string;
}

export interface WrappedData {
  login: string;
  name: string | null;
  from: string;
  to: string;
  total: number;
  activeDays: number;
  days: number;
  /** Whole percent of days with any contribution. */
  activePercent: number;
  longestStreak: Span | null;
  currentStreak: number;
  /** The longest run of days with nothing, which is a fact about the year and not a fault. */
  longestBreak: Span | null;
  busiestDay: { date: string; count: number } | null;
  busiestMonth: { key: string; label: string; total: number } | null;
  months: Array<{ key: string; label: string; total: number }>;
  weekdays: Array<{ name: (typeof WEEKDAY_NAMES)[number]; total: number; activeDays: number }>;
  busiestWeekday: { name: (typeof WEEKDAY_NAMES)[number]; total: number } | null;
  /** Whole percent of contributions made on a Saturday or Sunday. Null when there were none. */
  weekendShare: number | null;
  bestWeek: { from: string; total: number } | null;
  stars: number;
  followers: number;
  publicRepos: number;
  yearsOnGitHub: number | null;
  languages: LanguageShare[];
  topRepos: RepoSummary[];
  traits: WrappedTrait[];
}

export function longestRun(days: ReadonlyArray<{ date: string; count: number }>, active: boolean): Span | null {
  let best: Span | null = null;
  let start = -1;
  const close = (end: number) => {
    if (start < 0) return;
    const length = end - start + 1;
    if (!best || length > best.length) best = { length, from: days[start]!.date, to: days[end]!.date };
    start = -1;
  };
  days.forEach((day, i) => {
    const matches = active ? day.count > 0 : day.count === 0;
    const continues = start >= 0 && dayNumber(day.date) - dayNumber(days[i - 1]!.date) === 1;
    if (matches && start >= 0 && !continues) close(i - 1);
    if (matches) {
      if (start < 0) start = i;
    } else close(i - 1);
  });
  close(days.length - 1);
  return best;
}

const MONTH_LABEL = (key: string): string => `${MONTH_NAMES[Number(key.slice(5, 7)) - 1] ?? key}`;

export function traitsOf(d: Omit<WrappedData, 'traits'>): WrappedTrait[] {
  const out: WrappedTrait[] = [];
  if (d.total === 0) return [{ id: 'quiet', title: 'A quiet year', reason: 'GitHub shows no public contributions for these twelve months.' }];
  if (d.longestStreak && d.longestStreak.length >= 14) {
    out.push({ id: 'streak-keeper', title: 'Streak keeper', reason: `Your longest run was ${d.longestStreak.length} days in a row.` });
  }
  if (d.activePercent >= 50) {
    out.push({ id: 'steady', title: 'Steady hand', reason: `You contributed on ${d.activePercent}% of days (${d.activeDays} of ${d.days}).` });
  }
  if (d.weekendShare !== null && d.total >= 50) {
    if (d.weekendShare >= 35) out.push({ id: 'weekend-warrior', title: 'Weekend warrior', reason: `${d.weekendShare}% of your contributions landed on a Saturday or Sunday.` });
    else if (d.weekendShare <= 10) out.push({ id: 'weekday-regular', title: 'Weekday regular', reason: `Only ${d.weekendShare}% of your contributions landed on a weekend.` });
  }
  if (d.busiestMonth && d.total >= 50 && d.busiestMonth.total / d.total >= 0.3) {
    const share = Math.round((d.busiestMonth.total / d.total) * 100);
    out.push({ id: 'sprinter', title: 'Sprinter', reason: `${share}% of your year happened in ${d.busiestMonth.label}.` });
  }
  if (d.busiestDay && d.total >= 50 && d.busiestDay.count / d.total >= 0.1) {
    const share = Math.round((d.busiestDay.count / d.total) * 100);
    out.push({ id: 'big-day', title: 'Big-day builder', reason: `One day, ${d.busiestDay.date}, made up ${share}% of your year (${d.busiestDay.count} contributions).` });
  }
  if (d.languages.filter((l) => l.percent >= 10).length >= 4) {
    out.push({ id: 'polyglot', title: 'Polyglot', reason: `${d.languages.filter((l) => l.percent >= 10).length} languages each make up at least 10% of your repositories.` });
  }
  if (d.stars >= 100) out.push({ id: 'star-collector', title: 'Star collector', reason: `Your repositories hold ${d.stars.toLocaleString('en-US')} stars.` });
  if (d.yearsOnGitHub !== null && d.yearsOnGitHub >= 8) {
    out.push({ id: 'veteran', title: 'Veteran', reason: `Your account is ${d.yearsOnGitHub} years old.` });
  }
  if (d.total < 20) out.push({ id: 'quiet', title: 'A quiet year', reason: `${d.total} public ${d.total === 1 ? 'contribution' : 'contributions'} in these twelve months.` });
  return out.slice(0, 4);
}

/** Null when the profile came without its contribution calendar, since there is nothing to look back on. */
export function computeWrapped(profile: Profile): WrappedData | null {
  const c = profile.contributions;
  if (!c || c.days.length === 0) return null;
  const { days } = c;

  const monthTotals = new Map<string, number>();
  const weekdayTotals = WEEKDAY_NAMES.map((name) => ({ name, total: 0, activeDays: 0 }));
  const weeks = new Map<number, { from: string; total: number }>();
  let busiestDay: WrappedData['busiestDay'] = null;
  let weekend = 0;
  for (const day of days) {
    const key = day.date.slice(0, 7);
    monthTotals.set(key, (monthTotals.get(key) ?? 0) + day.count);
    const w = weekdayOf(day.date);
    weekdayTotals[w]!.total += day.count;
    if (day.count > 0) weekdayTotals[w]!.activeDays++;
    if (w >= 5) weekend += day.count;
    const weekStart = dayNumber(day.date) - w;
    const week = weeks.get(weekStart);
    if (week) week.total += day.count;
    else weeks.set(weekStart, { from: day.date, total: day.count });
    if (day.count > 0 && (!busiestDay || day.count > busiestDay.count)) busiestDay = { date: day.date, count: day.count };
  }

  const months = [...monthTotals].map(([key, total]) => ({ key, label: MONTH_LABEL(key), total }));
  let busiestMonth: WrappedData['busiestMonth'] = null;
  for (const m of months) if (m.total > 0 && (!busiestMonth || m.total > busiestMonth.total)) busiestMonth = m;
  let busiestWeekday: WrappedData['busiestWeekday'] = null;
  for (const w of weekdayTotals) if (w.total > 0 && (!busiestWeekday || w.total > busiestWeekday.total)) busiestWeekday = { name: w.name, total: w.total };
  let bestWeek: WrappedData['bestWeek'] = null;
  for (const w of weeks.values()) if (w.total > 0 && (!bestWeek || w.total > bestWeek.total)) bestWeek = w;

  const total = days.reduce((sum, day) => sum + day.count, 0);
  const activeDays = days.filter((day) => day.count > 0).length;
  const to = days[days.length - 1]!.date;
  const years = Number.isFinite(Date.parse(profile.createdAt)) ? Math.floor((dayNumber(to) - dayNumber(profile.createdAt.slice(0, 10))) / 365.25) : null;

  const base: Omit<WrappedData, 'traits'> = {
    login: profile.login,
    name: profile.name,
    from: days[0]!.date,
    to,
    total,
    activeDays,
    days: days.length,
    activePercent: Math.round((activeDays / days.length) * 100),
    longestStreak: longestRun(days, true),
    currentStreak: c.currentStreak,
    longestBreak: longestRun(days, false),
    busiestDay,
    busiestMonth,
    months,
    weekdays: weekdayTotals,
    busiestWeekday,
    weekendShare: total > 0 ? Math.round((weekend / total) * 100) : null,
    bestWeek,
    stars: profile.totalStars,
    followers: profile.followers,
    publicRepos: profile.publicRepos,
    yearsOnGitHub: years !== null && years >= 0 ? years : null,
    languages: profile.languages.slice(0, 3),
    topRepos: [...profile.topRepos].sort((a, b) => b.stars - a.stars).slice(0, 3),
  };
  return { ...base, traits: traitsOf(base) };
}
