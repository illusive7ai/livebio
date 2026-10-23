import { hslToHex, hueOf } from '../color';
import { recentWeeks } from '../contributions';
import { assetPath } from '../readme';
import { variantsFor, type Variant } from '../themes';
import type { Config, Output, Profile, RepoSummary, Template } from '../types';
import { formatNumber, timeAgo, truncate, wrap, xmlEscape } from '../util';
import { FONT, FONT_SANS, describeProfile, imageReadme, plural, rise } from './shared';

const WIDTH = 900;
const PAD = 44;
const AXIS_X = 168;
const CONTENT_X = 196;
const SPARK_WEEKS = 26;
const MAX_ENTRIES = 6;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export interface MonthGroup {
  /** For example "October 2026". */
  label: string;
  items: RepoSummary[];
}

/** "Oct 22", from the repository's last push, in UTC so it reads the same everywhere. */
export function shortDay(pushedAt: string): string | null {
  const time = Date.parse(pushedAt);
  if (!Number.isFinite(time)) return null;
  const d = new Date(time);
  return `${MONTHS[d.getUTCMonth()]!.slice(0, 3)} ${d.getUTCDate()}`;
}

/**
 * Groups repositories by the month of their last push, newest month first and newest push first
 * within it. Repositories with no readable date are left out, since a timeline needs a date.
 */
export function groupByMonth(repos: ReadonlyArray<RepoSummary>, limit = MAX_ENTRIES): MonthGroup[] {
  const dated = repos
    .map((repo) => ({ repo, time: Date.parse(repo.pushedAt ?? '') }))
    .filter((entry) => Number.isFinite(entry.time))
    .sort((a, b) => b.time - a.time || a.repo.name.localeCompare(b.repo.name))
    .slice(0, limit);

  const groups: MonthGroup[] = [];
  for (const { repo, time } of dated) {
    const d = new Date(time);
    const label = `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(repo);
    else groups.push({ label, items: [repo] });
  }
  return groups;
}

const num = (value: number): string => String(Math.round(value * 10) / 10 || 0);

interface Look {
  bg: string;
  panel: string;
  fg: string;
  muted: string;
  line: string;
  accent: string;
  accent2: string;
}

function lookFor(variant: Variant, hue: number): Look {
  const dark = variant === 'dark';
  return {
    bg: dark ? '#0d1117' : '#ffffff',
    panel: dark ? '#141b26' : '#f3f6fa',
    fg: dark ? '#e6edf3' : '#1b2430',
    muted: dark ? '#8b98a9' : '#5f6c7d',
    line: dark ? '#2a3546' : '#d3dbe6',
    accent: hslToHex(hue, 0.7, dark ? 0.58 : 0.4),
    accent2: hslToHex((hue + 40) % 360, 0.75, dark ? 0.62 : 0.42),
  };
}

function renderSvg(profile: Profile, config: Config, variant: Variant): string {
  const look = lookFor(variant, hueOf(profile.avatar?.grid.tint) ?? 165);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const parts: string[] = [];
  let step = 0;
  const next = () => step++ * 0.09;

  // Header: the name, what this page is, and the freshest push.
  const recent = profile.recentRepos ?? [];
  const latest = recent.find((r) => r.pushedAt && Number.isFinite(Date.parse(r.pushedAt)));
  const latestAgo = latest?.pushedAt && profile.fetchedAt ? timeAgo(latest.pushedAt, profile.fetchedAt) : null;
  let header =
    `<text class="mono" x="${PAD}" y="${PAD + 4}" font-size="12.5" letter-spacing="2" fill="${look.accent}">BUILD LOG</text>` +
    `<text x="${PAD}" y="${PAD + 44}" font-size="36" font-weight="800" fill="${look.fg}">${xmlEscape(truncate(profile.name ?? profile.login, 28))}</text>`;
  const sub = [profile.name ? `@${profile.login}` : '', config.text.headline ? truncate(config.text.headline, 56) : ''].filter(Boolean).join('  ·  ');
  if (sub) header += `<text x="${PAD}" y="${PAD + 70}" font-size="14.5" fill="${look.muted}">${xmlEscape(sub)}</text>`;
  if (blocks.has('stats')) {
    const facts: Array<[string, string]> = [];
    if (latestAgo) facts.push([latestAgo, 'LAST PUSH']);
    if (profile.activeRepos !== undefined) facts.push([formatNumber(profile.activeRepos), 'ACTIVE, 90 DAYS']);
    facts.push([formatNumber(profile.publicRepos), 'REPOSITORIES']);
    facts.forEach(([value, caption], index) => {
      const x = WIDTH - PAD - (facts.length - 1 - index) * 150;
      header +=
        `<text x="${x}" y="${PAD + 26}" text-anchor="end" font-size="21" font-weight="800" fill="${look.fg}">${xmlEscape(value)}</text>` +
        `<text class="mono" x="${x}" y="${PAD + 44}" text-anchor="end" font-size="10" letter-spacing="1.2" fill="${look.muted}">${xmlEscape(caption)}</text>`;
    });
  }
  parts.push(rise(header, motion, next()));
  let cursor = PAD + 96;

  // A thin strip of weekly activity, so the pace is visible at a glance.
  const activity = profile.contributions;
  if (blocks.has('activity') && activity) {
    const weeks = recentWeeks(activity.days, SPARK_WEEKS);
    const peak = Math.max(...weeks, 1);
    const width = WIDTH - PAD * 2;
    const barW = (width - 4 * (weeks.length - 1)) / weeks.length;
    const bars = weeks
      .map((total, index) => {
        const h = Math.max(2, (total / peak) * 38);
        return `<rect x="${num(PAD + index * (barW + 4))}" y="${num(cursor + 38 - h)}" width="${num(barW)}" height="${num(h)}" rx="2" fill="${index === weeks.length - 1 ? look.accent2 : look.accent}" fill-opacity="${total === 0 ? 0.25 : 0.9}"/>`;
      })
      .join('');
    const sum = weeks.reduce((a, b) => a + b, 0);
    parts.push(
      rise(
        bars +
          `<text class="mono" x="${PAD}" y="${cursor + 58}" font-size="11.5" fill="${look.muted}">${xmlEscape(`${formatNumber(sum)} contributions in the last ${weeks.length} weeks  ·  current streak ${plural(activity.currentStreak, 'day')}`)}</text>`,
        motion,
        next(),
      ),
    );
    cursor += 58 + 36;
  }

  // The timeline.
  if (blocks.has('projects')) {
    const groups = groupByMonth(recent);
    if (groups.length > 0) {
      const dots: number[] = [];
      let markup = '';
      let y = cursor;
      for (const group of groups) {
        markup += `<text class="mono" x="${CONTENT_X}" y="${y}" font-size="12" font-weight="700" letter-spacing="1.6" fill="${look.accent}">${xmlEscape(group.label.toUpperCase())}</text>`;
        y += 30;
        for (const repo of group.items) {
          const lines = repo.description ? wrap(repo.description, 78, 2) : [];
          const day = repo.pushedAt ? shortDay(repo.pushedAt) : null;
          const ago = repo.pushedAt && profile.fetchedAt ? timeAgo(repo.pushedAt, profile.fetchedAt) : null;
          dots.push(y - 5);
          markup +=
            (day ? `<text class="mono" x="${AXIS_X - 22}" y="${y}" text-anchor="end" font-size="13" font-weight="700" fill="${look.fg}">${xmlEscape(day)}</text>` : '') +
            (ago ? `<text class="mono" x="${AXIS_X - 22}" y="${y + 17}" text-anchor="end" font-size="10.5" fill="${look.muted}">${xmlEscape(ago)}</text>` : '') +
            `<circle class="dot" cx="${AXIS_X}" cy="${y - 5}" r="6" fill="${look.bg}" stroke="${look.accent}" stroke-width="2.5"/>` +
            `<text x="${CONTENT_X}" y="${y}" font-size="17" font-weight="700" fill="${look.fg}">${xmlEscape(truncate(repo.name, 52))}</text>`;
          const tags = [repo.language, repo.stars > 0 ? `★ ${formatNumber(repo.stars)}` : null, repo.license].filter((v): v is string => Boolean(v));
          let ly = y;
          if (tags.length > 0) {
            ly += 19;
            markup += `<text class="mono" x="${CONTENT_X}" y="${ly}" font-size="11.5" fill="${look.accent2}">${xmlEscape(tags.join('  ·  '))}</text>`;
          }
          for (const line of lines) {
            ly += 19;
            markup += `<text x="${CONTENT_X}" y="${ly}" font-size="13.5" fill="${look.muted}">${xmlEscape(line)}</text>`;
          }
          y = Math.max(ly, y + 17) + 30;
        }
        y += 4;
      }
      const first = dots[0] ?? cursor;
      const last = dots[dots.length - 1] ?? first;
      const axis = `<rect class="axis" x="${AXIS_X - 1}" y="${num(first)}" width="2" height="${num(Math.max(0, last - first))}" fill="url(#axis)"/>`;
      parts.push(rise(axis + markup, motion, next()));
      cursor = y;
    } else {
      // Say so plainly rather than draw an empty timeline.
      parts.push(
        rise(
          `<text x="${WIDTH / 2}" y="${cursor + 40}" text-anchor="middle" font-size="16" font-weight="700" fill="${look.fg}">Your build log appears here</text>` +
            `<text x="${WIDTH / 2}" y="${cursor + 66}" text-anchor="middle" font-size="13" fill="${look.muted}">It lists the repositories you pushed to most recently.</text>`,
          motion,
          next(),
        ),
      );
      cursor += 110;
    }
  }

  if (blocks.has('languages') && profile.languages.length > 0) {
    const text = profile.languages.slice(0, 4).map((l) => `${truncate(l.name, 14)} ${l.percent}%`).join('   ');
    parts.push(
      rise(
        `<text class="mono" x="${PAD}" y="${num(cursor)}" font-size="12.5" fill="${look.muted}">built with  <tspan fill="${look.fg}">${xmlEscape(text)}</tspan></text>`,
        motion,
        next(),
      ),
    );
    cursor += 24;
  }

  const height = Math.ceil(cursor + PAD - 22);
  const title = `${profile.name ?? profile.login} (@${profile.login}) on GitHub`;
  const css = motion
    ? `.rise{animation:rise .6s ease both}@keyframes rise{from{opacity:0;transform:translateX(-6px)}}` +
      `.dot{transform-box:fill-box;transform-origin:center;animation:pop .45s cubic-bezier(.3,1.6,.5,1) .3s both}@keyframes pop{from{transform:scale(0)}}` +
      `@media (prefers-reduced-motion:reduce){.rise,.dot{animation:none}}`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}" role="img" aria-labelledby="t">
<title id="t">${xmlEscape(title)}</title>
<defs>
<linearGradient id="axis" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${look.accent}"/><stop offset="1" stop-color="${look.line}"/></linearGradient>
</defs>
<style>
text{font-family:${FONT_SANS}}
.mono{font-family:${FONT}}
${css}
</style>
<rect width="${WIDTH}" height="${height}" rx="14" fill="${look.bg}"/>
<rect x="0.5" y="0.5" width="${WIDTH - 1}" height="${height - 1}" rx="14" fill="none" stroke="${look.line}"/>
${parts.filter(Boolean).join('\n')}
</svg>
`;
}

export const buildlog: Template = {
  id: 'buildlog',
  name: 'Build log',
  description: 'A release-notes style timeline of what you updated most recently, grouped by month.',
  tags: ['timeline', 'changelog', 'recent', 'animated'],
  needsAvatar: false,
  render(profile, config): Output {
    const assets = variantsFor(config.theme).map((variant) => ({
      path: assetPath('buildlog', variant),
      content: renderSvg(profile, config, variant),
    }));
    const entries = config.blocks.includes('projects') ? groupByMonth(profile.recentRepos ?? []).flatMap((g) => g.items) : [];
    const extra = entries.length > 0 ? `a timeline of recent work: ${entries.map((r) => r.name).join(', ')}` : undefined;
    return { readme: imageReadme(profile, config, 'buildlog', WIDTH, describeProfile(profile, config, extra, { activity: false })), assets };
  },
};
