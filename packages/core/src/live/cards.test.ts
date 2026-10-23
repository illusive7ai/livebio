import { DOMParser } from '@xmldom/xmldom';
import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../config';
import { buildContributions } from '../contributions';
import { renderProfile } from '../render';
import { templates } from '../templates';
import type { Config, ContributionDay, Profile } from '../types';
import { renderCityCard } from './cityCard';
import { BODY, BUCKET, STEP_SECONDS, renderSnakeCard } from './snakeCard';
import { styleFor, type Preset } from './style';

function year(): ContributionDay[] {
  const end = Date.parse('2026-06-10T00:00:00Z');
  const days: ContributionDay[] = [];
  for (let i = 364; i >= 0; i--) {
    const date = new Date(end - i * 86_400_000);
    const weekday = date.getUTCDay();
    const count = weekday === 0 || weekday === 6 ? 0 : (i % 7) + (i === 100 ? 30 : 0);
    days.push({ date: date.toISOString().slice(0, 10), count, level: count === 0 ? 0 : (Math.min(4, Math.ceil(count / 2)) as 1 | 2 | 3 | 4) });
  }
  return days;
}

const contributions = buildContributions(year());
const style = (preset: Preset = 'aurora', variant: 'dark' | 'light' = 'dark') => styleFor(preset, variant, 200);
const opts = (over: Partial<{ contributions: typeof contributions | undefined; motion: boolean; login: string }> = {}) => ({
  login: 'octo',
  contributions,
  style: style(),
  motion: true,
  ...over,
});

function parse(svg: string) {
  const errors: string[] = [];
  const doc = new DOMParser({ onError: (_l, m) => errors.push(m) }).parseFromString(svg, 'image/svg+xml');
  expect(errors).toEqual([]);
  return doc;
}

describe('the contribution city card', () => {
  it('states the real numbers', () => {
    const svg = renderCityCard(opts());
    expect(svg).toContain(contributions.total.toLocaleString('en-US'));
    expect(svg).toContain(`${contributions.activeDays} active days`);
    expect(svg).toContain(`Busiest day: ${Math.max(...contributions.days.map((d) => d.count))}`);
    expect(svg).toContain(`Longest streak: ${contributions.longestStreak} days`);
  });

  it('builds one tower for every active day, and leaves quiet days as empty streets', () => {
    const towers = (renderCityCard(opts()).match(/class="cty-b"/g) ?? []).length;
    expect(towers).toBe(contributions.days.filter((d) => d.count > 0).length);
  });

  it('flags the busiest day with its real count', () => {
    const peak = Math.max(...contributions.days.map((d) => d.count));
    expect(renderCityCard(opts())).toMatch(new RegExp(`(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \\d+: ${peak}<`));
  });

  it('colours a tower by how busy its day was', () => {
    const days: ContributionDay[] = [
      { date: '2026-06-08', count: 1, level: 1 },
      { date: '2026-06-09', count: 20, level: 4 },
    ];
    const palette = style().city;
    const svg = renderCityCard(opts({ contributions: buildContributions(days) }));
    expect(svg).toContain(`fill="${palette.levels[0]![0]}"`); // the quiet day, on the first level
    expect(svg).toContain(`fill="${palette.peak[0]}"`); // the busiest day gets the highlight
    expect(svg).not.toContain(`fill="${palette.levels[1]![0]}"`);
  });

  it('is honest when there is no data, and invents nothing', () => {
    const svg = renderCityCard(opts({ contributions: undefined }));
    expect(svg).toContain('Your contribution city appears here');
    expect(svg).not.toMatch(/active days|Busiest day/);
    expect(svg).not.toContain('cty-b');
    parse(svg);
  });

  it('is still without motion, and respects reduced motion with it', () => {
    expect(renderCityCard(opts({ motion: false }))).not.toContain('@keyframes');
    expect(renderCityCard(opts())).toContain('prefers-reduced-motion');
  });

  it('is well-formed in every preset and variant, and stays within the card', () => {
    for (const preset of ['aurora', 'sunrise', 'night', 'space', 'arcade', 'chalk', 'editor', 'blueprint', 'paper', 'terminal', 'glow', 'plain'] as Preset[]) {
      for (const variant of ['dark', 'light'] as const) {
        const svg = renderCityCard({ ...opts(), style: style(preset, variant) });
        const doc = parse(svg);
        for (const p of Array.from(doc.getElementsByTagName('path'))) {
          for (const n of (p.getAttribute('d') ?? '').match(/-?\d+(\.\d+)?/g) ?? []) expect(Number.isFinite(Number(n))).toBe(true);
        }
      }
    }
  });

  it('escapes the login', () => {
    expect(parse(renderCityCard(opts({ login: '<script>x</script>' }))).getElementsByTagName('script')).toHaveLength(0);
  });
});

describe('the snake card', () => {
  it('draws one cell for every day', () => {
    const svg = renderSnakeCard(opts({ motion: false }));
    const cells = (svg.match(/<(rect|circle|path)[^>]* fill="[^"]*"( fill-opacity="[^"]*")?\/>/g) ?? []).length;
    expect(cells).toBeGreaterThanOrEqual(contributions.days.length);
  });

  it('lets only active days be eaten, each at a moment inside the run', () => {
    const svg = renderSnakeCard(opts());
    const eaten = (svg.match(/class="snk-c snk-e\d+"/g) ?? []).length;
    expect(eaten).toBe(contributions.days.filter((d) => d.count > 0).length);
    const buckets = [...svg.matchAll(/@keyframes snk-k(\d+)\{0%,([\d.]+)%/g)];
    expect(buckets.length).toBeGreaterThan(1);
    for (const m of buckets) expect(Number(m[2])).toBeLessThanOrEqual(100);
  });

  it('keeps the snake’s head and body moving along one looping route', () => {
    const svg = renderSnakeCard(opts());
    expect((svg.match(/class="snk-s"/g) ?? []).length).toBe(BODY + 1);
    expect(svg).toContain('@keyframes snk-slither');
    expect(svg).toContain('infinite');
    expect(STEP_SECONDS).toBeGreaterThan(0);
    expect(BUCKET).toBeGreaterThan(0);
  });

  it('is fully still without motion', () => {
    const svg = renderSnakeCard(opts({ motion: false }));
    expect(svg).not.toContain('@keyframes');
    expect(svg).not.toContain('snk-c');
  });

  it('is honest when there is no data', () => {
    const svg = renderSnakeCard(opts({ contributions: undefined }));
    expect(svg).toContain('Your snake appears here');
    expect(svg).not.toContain('snk-s');
    parse(svg);
  });

  it('is well-formed in every preset', () => {
    for (const preset of ['aurora', 'sunrise', 'night', 'space', 'arcade', 'chalk', 'editor', 'blueprint', 'paper', 'terminal', 'glow', 'plain'] as Preset[]) {
      parse(renderSnakeCard({ ...opts(), style: style(preset) }));
    }
  });
});

describe('every template carries the live panels', () => {
  const base: Profile = {
    login: 'octo',
    name: 'Octo Cat',
    avatarUrl: 'https://avatars.example/octo',
    bio: null,
    company: null,
    location: null,
    website: null,
    url: 'https://github.com/octo',
    followers: 10,
    following: 2,
    publicRepos: 5,
    totalStars: 7,
    createdAt: '2023-01-15T00:00:00Z',
    languages: [{ name: 'Go', percent: 100 }],
    topRepos: [],
    contributions,
    fetchedAt: '2026-06-10T08:00:00Z',
  };
  const config = (template: string, over: Partial<Config> = {}): Config => ({ ...defaultConfig('octo', template), ...over });
  const kinds = (template: string, over: Partial<Config> = {}) =>
    new Set(renderProfile(base, config(template, over)).assets.map((a) => /-(city|snake|chess)-(dark|light)\.svg$/.exec(a.path)?.[1]).filter(Boolean));

  it.each(templates.map((t) => t.id))('%s has a live city and a snake or a chess game', (id) => {
    const found = kinds(id);
    const own = id === 'city' ? ['city'] : [];
    const hasCity = found.has('city') || id === 'city';
    expect(hasCity).toBe(true);
    expect(found.has('snake') || found.has('chess') || id === 'snake').toBe(true);
    void own;
  });

  it.each(templates.map((t) => t.id))('%s lists every image it writes in the README, once', (id) => {
    const out = renderProfile(base, config(id));
    for (const asset of out.assets.filter((a) => a.path.endsWith('-dark.svg'))) {
      const file = asset.path.replace('-dark.svg', '');
      expect(out.readme.split(`${file}-dark.svg`).length - 1).toBe(1);
    }
  });

  it('keeps the credit line last', () => {
    const out = renderProfile(base, config('showcase'));
    const credit = out.readme.indexOf('Made with <a');
    expect(credit).toBeGreaterThan(out.readme.lastIndexOf('showcase-city'));
    expect(credit).toBeGreaterThan(out.readme.lastIndexOf('showcase-chess'));
  });

  it('lets the user switch the panels off', () => {
    expect(kinds('showcase', { blocks: ['stats'] }).size).toBe(0);
    expect(kinds('showcase', { blocks: ['stats', 'city'] })).toEqual(new Set(['city']));
    expect(kinds('showcase', { blocks: ['stats', 'game'] })).toEqual(new Set(['chess']));
  });

  it('draws a different panel look for each template', () => {
    const svgs = templates.map((t) => renderProfile(base, config(t.id)).assets.find((a) => /-city-dark\.svg$/.test(a.path))?.content).filter(Boolean);
    expect(new Set(svgs).size).toBe(svgs.length);
  });
});
