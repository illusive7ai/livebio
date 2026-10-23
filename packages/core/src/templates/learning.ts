import { hslToHex, hueOf } from '../color';
import { assetPath } from '../readme';
import { variantsFor, type Variant } from '../themes';
import type { Config, ContributionDay, Output, Profile, Template } from '../types';
import { formatNumber, timeAgo, truncate, wrap, xmlEscape } from '../util';
import { FONT, FONT_SANS, FONT_SERIF, describeProfile, imageReadme, plural, rise } from './shared';

const WIDTH = 900;
const PAD = 48;
const HABIT_WEEKS = 12;
const DOT = 7;
const DOT_STEP = 22;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export interface HabitDay {
  date: string;
  count: number;
}

/**
 * The last `weeks` calendar weeks as columns of seven rows, Sunday first, like a habit tracker.
 * A slot is null where the week has no data, such as the days before the history begins or after today.
 */
export function habitGrid(days: ReadonlyArray<ContributionDay>, weeks: number): Array<Array<HabitDay | null>> {
  if (days.length === 0 || weeks <= 0) return [];
  const first = new Date(`${days[0]?.date}T00:00:00Z`).getUTCDay();
  const cols = Math.ceil((first + days.length) / 7);
  const grid: Array<Array<HabitDay | null>> = Array.from({ length: cols }, () => Array<HabitDay | null>(7).fill(null));
  days.forEach((day, index) => {
    const slot = first + index;
    grid[Math.floor(slot / 7)]![slot % 7] = { date: day.date, count: day.count };
  });
  return grid.slice(-weeks);
}

/** Blocks of an ink bar to fill out of ten. Any language at all shows at least one block. */
export function blocksFor(percent: number): number {
  if (percent <= 0) return 0;
  return Math.min(10, Math.max(1, Math.round(percent / 10)));
}

function formatDate(iso: string | undefined): string | null {
  const time = iso ? Date.parse(iso) : NaN;
  if (!Number.isFinite(time)) return null;
  const date = new Date(time);
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

const num = (value: number): string => String(Math.round(value * 10) / 10 || 0);

interface Look {
  paper: string;
  grid: string;
  gridOpacity: number;
  margin: string;
  ink: string;
  muted: string;
  marker: string;
  highlight: string;
  highlightOpacity: number;
  ring: string;
}

/** Cream notebook paper in light mode, a chalkboard in dark mode. */
function lookFor(variant: Variant, hue: number): Look {
  const dark = variant === 'dark';
  return {
    paper: dark ? '#1c2a29' : '#fffdf5',
    grid: dark ? '#cfe3dc' : '#6b8cc7',
    gridOpacity: dark ? 0.07 : 0.16,
    margin: dark ? '#e8a09a' : '#e0645c',
    ink: dark ? '#f2efe4' : '#27304d',
    muted: dark ? '#a9bdb6' : '#6a7191',
    marker: hslToHex(hue, 0.75, dark ? 0.66 : 0.45),
    highlight: dark ? '#f2d96b' : '#ffe45e',
    highlightOpacity: dark ? 0.32 : 0.7,
    ring: dark ? '#7f9b93' : '#9aa3c4',
  };
}

function renderSvg(profile: Profile, config: Config, variant: Variant): string {
  const look = lookFor(variant, hueOf(profile.avatar?.grid.tint) ?? 215);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const parts: string[] = [];
  let step = 0;
  const next = () => step++ * 0.1;
  const left = PAD + 36; // room for the margin line

  const heading = (text: string, x: number, y: number): string => {
    const width = text.length * 9.2 + 16;
    return (
      `<rect x="${x - 6}" y="${y - 14}" width="${num(width)}" height="19" rx="3" fill="${look.highlight}" fill-opacity="${look.highlightOpacity}"/>` +
      `<text class="mono" x="${x}" y="${y}" font-size="13" font-weight="700" letter-spacing="1.8" fill="${look.ink}">${xmlEscape(text)}</text>`
    );
  };

  // Title: the name in a bookish serif, with the date the data was read.
  const updated = formatDate(profile.fetchedAt);
  let title = `<text class="serif" x="${left}" y="${PAD + 38}" font-size="40" font-weight="700" font-style="italic" fill="${look.ink}">${xmlEscape(truncate(profile.name ?? profile.login, 28))}</text>`;
  const sub = ['learning log', `@${profile.login}`, updated ? `updated ${updated}` : null].filter(Boolean).join('  ·  ');
  title += `<text class="mono" x="${left}" y="${PAD + 64}" font-size="12.5" fill="${look.muted}">${xmlEscape(sub)}</text>`;
  if (config.text.headline) {
    title += `<text x="${left}" y="${PAD + 92}" font-size="17" fill="${look.ink}">${xmlEscape(truncate(config.text.headline, 80))}</text>`;
  }
  parts.push(rise(title, motion, next()));
  let cursor = PAD + (config.text.headline ? 128 : 100);

  // A few facts on sticky notes.
  if (blocks.has('stats')) {
    const year = new Date(profile.createdAt).getUTCFullYear();
    const facts = [
      `${formatNumber(profile.publicRepos)} repositories`,
      `${formatNumber(profile.totalStars)} stars`,
      Number.isFinite(year) ? `on GitHub since ${year}` : null,
    ].filter((v): v is string => Boolean(v));
    let x = left;
    const notes = facts
      .map((fact, index) => {
        const width = Math.ceil(fact.length * 7.6) + 28;
        const tilt = index % 2 === 0 ? -1.2 : 1;
        const markup =
          `<g transform="rotate(${tilt} ${num(x + width / 2)} ${cursor + 16})">` +
          `<rect x="${num(x)}" y="${cursor}" width="${width}" height="32" rx="3" fill="${look.highlight}" fill-opacity="${look.highlightOpacity * 0.85}"/>` +
          `<text x="${num(x + 14)}" y="${cursor + 21}" font-size="14" font-weight="600" fill="${look.ink}">${xmlEscape(fact)}</text></g>`;
        x += width + 14;
        return markup;
      })
      .join('');
    parts.push(rise(notes, motion, next()));
    cursor += 32 + 40;
  }

  // Two columns: languages on the left, the habit tracker on the right.
  const colTop = cursor;
  let bottom = cursor;
  const rightX = left + 440;

  if (blocks.has('languages') && profile.languages.length > 0) {
    let y = colTop;
    let markup = heading('LANGUAGES I WRITE IN', left, y);
    y += 32;
    profile.languages.slice(0, 5).forEach((language, row) => {
      const filled = blocksFor(language.percent);
      const cells = Array.from({ length: 10 }, (_v, i) => {
        const on = i < filled;
        const delay = motion ? ` style="animation-delay:${(0.3 + row * 0.12 + i * 0.03).toFixed(2)}s"` : '';
        return `<rect class="${on ? 'blk' : ''}" x="${left + 150 + i * 17}" y="${y - 12}" width="13" height="16" rx="2" fill="${on ? look.marker : 'none'}" ${on ? '' : `stroke="${look.ring}" stroke-opacity="0.6"`}${on ? delay : ''}/>`;
      }).join('');
      markup +=
        `<text x="${left}" y="${y}" font-size="15" font-weight="600" fill="${look.ink}">${xmlEscape(truncate(language.name, 14))}</text>` +
        cells +
        `<text class="mono" x="${left + 150 + 10 * 17 + 6}" y="${y}" font-size="12.5" fill="${look.muted}">${language.percent}%</text>`;
      y += 30;
    });
    markup += `<text class="mono" x="${left}" y="${y + 4}" font-size="11.5" fill="${look.muted}">${xmlEscape(`${plural(profile.languages.length, 'language')} across my repositories, by number of repositories`)}</text>`;
    parts.push(rise(markup, motion, next()));
    bottom = Math.max(bottom, y + 4);
  }

  const activity = profile.contributions;
  if (blocks.has('activity') && activity) {
    const grid = habitGrid(activity.days, HABIT_WEEKS);
    const gx = rightX + 8;
    const gy = colTop + 40;
    let markup = heading('HABIT TRACKER', rightX, colTop);
    let real = 0;
    let busy = 0;
    grid.forEach((week, col) => {
      week.forEach((day, row) => {
        if (!day) return;
        real++;
        const x = gx + col * DOT_STEP;
        const y = gy + row * DOT_STEP;
        const delay = motion ? ` style="animation-delay:${(0.3 + col * 0.05 + row * 0.01).toFixed(2)}s"` : '';
        if (day.count > 0) {
          busy++;
          markup += `<circle class="dot" cx="${x}" cy="${y}" r="${DOT}" fill="${look.marker}"${delay}/>`;
        } else {
          markup += `<circle cx="${x}" cy="${y}" r="${DOT - 1.5}" fill="none" stroke="${look.ring}" stroke-opacity="0.7" stroke-width="1.5"/>`;
        }
      });
    });
    const captionY = gy + 7 * DOT_STEP + 10;
    markup +=
      `<text class="mono" x="${rightX}" y="${captionY}" font-size="12.5" fill="${look.ink}">${busy} of the last ${real} days had activity</text>` +
      `<text class="mono" x="${rightX}" y="${captionY + 20}" font-size="12.5" fill="${look.muted}">current streak ${xmlEscape(plural(activity.currentStreak, 'day'))}</text>`;
    parts.push(rise(markup, motion, next()));
    bottom = Math.max(bottom, captionY + 20);
  }
  cursor = bottom + 44;

  // A checklist of what was worked on most recently.
  const recent = (profile.recentRepos ?? []).slice(0, 3);
  if (blocks.has('projects') && recent.length > 0) {
    let y = cursor;
    let markup = heading('RECENTLY WORKED ON', left, y);
    y += 34;
    for (const repo of recent) {
      const ago = repo.pushedAt && profile.fetchedAt ? timeAgo(repo.pushedAt, profile.fetchedAt) : null;
      markup +=
        `<rect x="${left}" y="${y - 15}" width="18" height="18" rx="3" fill="none" stroke="${look.ink}" stroke-width="1.6"/>` +
        `<path d="M${left + 4} ${y - 6} l4 4 l7 -10" fill="none" stroke="${look.marker}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>` +
        `<text x="${left + 32}" y="${y}" font-size="16" font-weight="700" fill="${look.ink}">${xmlEscape(truncate(repo.name, 34))}</text>`;
      const detail = [ago ? `updated ${ago}` : null, repo.language].filter(Boolean).join('  ·  ');
      if (detail) markup += `<text class="mono" x="${WIDTH - PAD}" y="${y}" text-anchor="end" font-size="12" fill="${look.muted}">${xmlEscape(detail)}</text>`;
      if (repo.description) {
        const [line] = wrap(repo.description, 96, 1);
        markup += `<text x="${left + 32}" y="${y + 20}" font-size="13" fill="${look.muted}">${xmlEscape(line ?? '')}</text>`;
        y += 52;
      } else {
        y += 34;
      }
    }
    parts.push(rise(markup, motion, next()));
    cursor = y;
  }

  const height = Math.ceil(cursor + PAD - 12);
  const title2 = `${profile.name ?? profile.login} (@${profile.login}) on GitHub`;
  const css = motion
    ? `.rise{animation:rise .6s ease both}@keyframes rise{from{opacity:0}}` +
      `.dot,.blk{transform-box:fill-box;transform-origin:center;animation:pop .4s cubic-bezier(.3,1.6,.5,1) both}` +
      `@keyframes pop{from{transform:scale(0)}}` +
      `@media (prefers-reduced-motion:reduce){.rise,.dot,.blk{animation:none}}`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}" role="img" aria-labelledby="t">
<title id="t">${xmlEscape(title2)}</title>
<defs>
<pattern id="paper" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="${look.grid}" stroke-opacity="${look.gridOpacity}"/></pattern>
</defs>
<style>
text{font-family:${FONT_SANS}}
.mono{font-family:${FONT}}
.serif{font-family:${FONT_SERIF}}
${css}
</style>
<rect width="${WIDTH}" height="${height}" rx="16" fill="${look.paper}"/>
<rect width="${WIDTH}" height="${height}" rx="16" fill="url(#paper)"/>
<rect x="${PAD + 18}" y="0" width="2" height="${height}" fill="${look.margin}" fill-opacity="0.55"/>
${parts.filter(Boolean).join('\n')}
</svg>
`;
}

export const learning: Template = {
  id: 'learning',
  name: 'Learning log',
  description: 'A notebook page: the languages you write in, a habit tracker of the last twelve weeks, and what you worked on lately.',
  tags: ['notebook', 'chalkboard', 'habits', 'animated'],
  needsAvatar: false,
  render(profile, config): Output {
    const assets = variantsFor(config.theme).map((variant) => ({
      path: assetPath('learning', variant),
      content: renderSvg(profile, config, variant),
    }));
    const extra = config.blocks.includes('activity') && profile.contributions ? 'with a twelve-week habit tracker' : undefined;
    return { readme: imageReadme(profile, config, 'learning', WIDTH, describeProfile(profile, config, extra)), assets };
  },
};
