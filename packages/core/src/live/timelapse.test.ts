import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../config';
import { buildContributions } from '../contributions';
import { renderProfile } from '../render';
import { bare, profile, wellFormed, year } from '../testkit';
import type { Config, Profile } from '../types';
import { HOLD_UNTIL, planTimelapse, timelapseCss } from './timelapse';

const calendar = profile.contributions!;
const columnOfDay = (date: string): number | undefined => {
  const index = calendar.days.findIndex((d) => d.date === date);
  return index < 0 || calendar.days[index]!.count === 0 ? undefined : Math.floor(index / 7);
};

describe('planTimelapse', () => {
  const plan = planTimelapse(calendar.days, columnOfDay);

  it('ends its running total on the real total, and never goes backwards', () => {
    expect(plan.months.at(-1)!.total).toBe(calendar.total);
    for (let i = 1; i < plan.months.length; i++) expect(plan.months[i]!.total).toBeGreaterThanOrEqual(plan.months[i - 1]!.total);
  });

  it('gives each month the sum of the days up to its end', () => {
    for (const m of plan.months) {
      const [monthName, yearText] = m.label.split(' ');
      const last = calendar.days.filter((d) => d.date.startsWith(`${yearText}-`) && ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][Number(d.date.slice(5, 7)) - 1] === monthName).at(-1)!;
      const upTo = calendar.days.slice(0, calendar.days.indexOf(last) + 1).reduce((sum, d) => sum + d.count, 0);
      expect(m.total).toBe(upTo);
    }
  });

  it('runs the months one after another with no gap and no overlap', () => {
    expect(plan.months[0]!.from).toBe(0);
    for (let i = 1; i < plan.months.length; i++) expect(plan.months[i]!.from).toBe(plan.months[i - 1]!.to);
    expect(plan.months.at(-1)!.to).toBe(HOLD_UNTIL);
  });

  it('raises weeks in calendar order', () => {
    const starts = [...plan.columns.entries()].sort((a, b) => a[0] - b[0]).map(([, start]) => start);
    expect(starts).toEqual([...starts].sort((a, b) => a - b));
    expect(Math.max(...starts)).toBeLessThan(HOLD_UNTIL);
  });

  it('copes with a single day and with none', () => {
    const one = planTimelapse([{ date: '2026-01-01', count: 3, level: 1 }], () => 0);
    expect(one.months).toHaveLength(1);
    expect(one.months[0]!.total).toBe(3);
    expect(planTimelapse([], () => 0).months).toEqual([]);
  });

  it('writes one rule per column and per month', () => {
    const css = timelapseCss(plan, 4);
    for (const column of plan.columns.keys()) expect(css).toContain(`@keyframes tl${column}{`);
    plan.months.forEach((_m, i) => expect(css).toContain(`@keyframes tm${i}{`));
    expect(css).toContain('@keyframes tl-flag');
    expect(css).toContain('prefers-reduced-motion');
  });
});

const city = (p: Profile, timelapse: boolean, motion = true): string => {
  const config: Config = { ...defaultConfig('octo', 'showcase'), motion, theme: 'dark', custom: { timelapse } };
  return renderProfile(p, config).assets.find((a) => a.path.endsWith('showcase-city-dark.svg'))!.content;
};

describe('the time-lapse city card', () => {
  it('is well formed and replaces the still city', () => {
    const still = city(profile, false);
    const replay = city(profile, true);
    expect(wellFormed(replay)).toEqual([]);
    expect(replay).not.toBe(still);
    expect(replay).toContain('class="tl-fade"');
    expect(replay).toContain('Time-lapse of the contribution city');
    expect(still).not.toContain('tl-fade');
  });

  it('draws the same buildings as the still city', () => {
    const count = (svg: string, marker: RegExp) => (svg.match(marker) ?? []).length;
    expect(count(city(profile, true), /class="tl\d+"/g)).toBe(count(city(profile, false), /class="cty-b"/g));
  });

  it('prints only counts that come from the calendar', () => {
    const replay = city(profile, true);
    const totals = [...replay.matchAll(/class="tm\d+"><text[^>]*>([\d,]+)<\/text>/g)].map((m) => Number(m[1]!.replace(/,/g, '')));
    expect(totals.length).toBeGreaterThan(1);
    expect(totals.at(-1)).toBe(calendar.total);
    expect(Math.max(...totals)).toBe(calendar.total);
    expect(replay).toContain(`ending at ${calendar.total.toLocaleString('en-US')}`);
  });

  it('draws the finished city when motion is off', () => {
    const quiet = city(profile, true, false);
    expect(quiet).not.toContain('tl-fade');
    expect(quiet).not.toContain('@keyframes');
    expect(quiet).toContain('contributions in the last year');
  });

  it('holds up for a quiet account, a single busy day and no data', () => {
    const quietYear = { ...profile, contributions: buildContributions(year([])) };
    const oneDay = { ...profile, contributions: buildContributions(year([...Array(300).fill(0), 9])) };
    for (const p of [quietYear, oneDay, bare, { ...profile, contributions: undefined }]) {
      const svg = city(p, true);
      expect(wellFormed(svg)).toEqual([]);
      expect(svg).not.toMatch(/NaN|undefined|Infinity/);
    }
  });
});
