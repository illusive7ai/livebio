import { hslToHex, hueOf } from '../color';
import { weeklyTotals } from '../contributions';
import type { Variant } from '../themes';
import type { ContributionDay, LanguageShare, Profile, RepoSummary } from '../types';
import { formatNumber, timeAgo, truncate, wrap, xmlEscape } from '../util';
import { FONT, FONT_SANS, SAFE_DATA_URI } from './shared';

/** Parts shared by the designs added in the second collection. Each draws its own look from these. */

export const W = 900;
export const PAD = 36;

export interface Look {
  bg: string;
  panel: string;
  border: string;
  fg: string;
  muted: string;
  track: string;
  accent: string;
  accent2: string;
}

/**
 * A palette built around one hue. The second accent follows the profile picture's own colour, so the
 * design keeps its identity and still looks like it belongs to the person.
 */
export function lookOf(hue: number, variant: Variant, profile: Profile): Look {
  const picture = hueOf(profile.avatar?.grid.tint);
  const second = picture ?? (hue + 40) % 360;
  if (variant === 'dark') {
    return {
      bg: hslToHex(hue, 0.4, 0.07),
      panel: hslToHex(hue, 0.32, 0.115),
      border: hslToHex(hue, 0.28, 0.21),
      track: hslToHex(hue, 0.26, 0.17),
      fg: hslToHex(hue, 0.2, 0.93),
      muted: hslToHex(hue, 0.14, 0.67),
      accent: hslToHex(hue, 0.85, 0.6),
      accent2: hslToHex(second, 0.8, 0.64),
    };
  }
  return {
    bg: hslToHex(hue, 0.3, 0.97),
    panel: '#ffffff',
    border: hslToHex(hue, 0.25, 0.87),
    track: hslToHex(hue, 0.25, 0.92),
    fg: hslToHex(hue, 0.4, 0.14),
    muted: hslToHex(hue, 0.14, 0.38),
    accent: hslToHex(hue, 0.75, 0.38),
    accent2: hslToHex(second, 0.7, 0.4),
  };
}

export const mono = (text: string, x: number, y: number, fill: string, extra = ''): string =>
  `<text class="mono" x="${x}" y="${y}" fill="${fill}" ${extra}>${xmlEscape(text)}</text>`;

export const sans = (text: string, x: number, y: number, fill: string, extra = ''): string =>
  `<text x="${x}" y="${y}" fill="${fill}" ${extra}>${xmlEscape(text)}</text>`;

/** A small, letter-spaced section label. */
export const label = (look: Look, text: string, x: number, y: number): string =>
  mono(text, x, y, look.accent, 'font-size="11.5" font-weight="700" letter-spacing="2"');

export const num = (n: number): string => String(Math.round(n * 100) / 100);

export interface Shell {
  height: number;
  look: Look;
  variant: Variant;
  title: string;
  body: string;
  css?: string;
  defs?: string;
  /** Where the soft glow sits, as fractions of the card. */
  glow?: [number, number];
  radius?: number;
  grid?: boolean;
}

/** The card itself: background, a faint grid, a glow, a hairline border, then the content. */
export function shell(o: Shell): string {
  const { look, height, variant } = o;
  const r = o.radius ?? 18;
  const [gx, gy] = o.glow ?? [0.92, 0];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${height}" viewBox="0 0 ${W} ${height}" role="img" aria-labelledby="t">
<title id="t">${xmlEscape(o.title)}</title>
<defs>
<pattern id="kg" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="${look.accent}" stroke-opacity="${variant === 'dark' ? 0.07 : 0.07}"/></pattern>
<radialGradient id="kglow" cx="${gx}" cy="${gy}" r="0.85"><stop offset="0" stop-color="${look.accent}" stop-opacity="${variant === 'dark' ? 0.22 : 0.13}"/><stop offset="1" stop-color="${look.accent}" stop-opacity="0"/></radialGradient>
${o.defs ?? ''}
</defs>
<style>
text{font-family:${FONT_SANS}}
.mono{font-family:${FONT}}
${o.css ?? ''}
</style>
<rect width="${W}" height="${height}" rx="${r}" fill="${look.bg}"/>
${o.grid === false ? '' : `<rect width="${W}" height="${height}" rx="${r}" fill="url(#kg)"/>`}
<rect width="${W}" height="${height}" rx="${r}" fill="url(#kglow)"/>
<rect x="0.5" y="0.5" width="${W - 1}" height="${height - 1}" rx="${r}" fill="none" stroke="${look.border}"/>
${o.body}
</svg>
`;
}

/** CSS for the "rise" and "grow" entrances used across these designs. */
export function riseCss(motion: boolean): string {
  if (!motion) return '';
  return `.rise{animation:rise .6s ease both}
@keyframes rise{from{opacity:0;transform:translateY(6px)}}
.bar{transform-box:fill-box;transform-origin:50% 100%;animation:grow .7s cubic-bezier(.2,.7,.2,1) both}
@keyframes grow{from{transform:scaleY(0)}}
@media (prefers-reduced-motion:reduce){.rise,.bar{animation:none}}`;
}

export function enter(markup: string, motion: boolean, delay: number): string {
  if (!markup || !motion) return markup;
  return `<g class="rise" style="animation-delay:${delay.toFixed(2)}s">${markup}</g>`;
}

/** The profile picture in a ring, or the first letter of the name when there is no picture. */
export function portrait(profile: Profile, look: Look, cx: number, cy: number, r: number): string {
  const uri = profile.avatar?.dataUri;
  if (uri && SAFE_DATA_URI.test(uri)) {
    return (
      `<clipPath id="pt"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>` +
      `<image href="${uri}" x="${cx - r}" y="${cy - r}" width="${r * 2}" height="${r * 2}" preserveAspectRatio="xMidYMid slice" clip-path="url(#pt)"/>` +
      `<circle cx="${cx}" cy="${cy}" r="${r + 4}" fill="none" stroke="${look.accent}" stroke-width="2"/>`
    );
  }
  const initial = [...(profile.name ?? profile.login)][0]?.toUpperCase() ?? '?';
  return (
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${look.accent}"/>` +
    `<text x="${cx}" y="${cy + r * 0.34}" text-anchor="middle" font-size="${Math.round(r * 0.95)}" font-weight="800" fill="${look.bg}">${xmlEscape(initial)}</text>`
  );
}

export function panel(look: Look, x: number, y: number, w: number, h: number, accent = true): string {
  return (
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${look.panel}" stroke="${look.border}"/>` +
    (accent ? `<rect x="${x + 18}" y="${y}" width="36" height="3" rx="1.5" fill="${look.accent}"/>` : '')
  );
}

/** Language bars, one per row. */
export function langBars(look: Look, languages: ReadonlyArray<LanguageShare>, x: number, y: number, w: number, rows = 4): { markup: string; height: number } {
  const shown = languages.slice(0, rows);
  const markup = shown
    .map((language, index) => {
      const top = y + index * 26;
      const fill = index % 2 === 0 ? look.accent : look.accent2;
      return (
        sans(truncate(language.name, 18), x, top + 10, look.fg, 'font-size="12.5"') +
        mono(`${language.percent}%`, x + w, top + 10, look.muted, 'font-size="11.5" text-anchor="end"') +
        `<rect x="${x}" y="${top + 16}" width="${w}" height="5" rx="2.5" fill="${look.track}"/>` +
        `<rect x="${x}" y="${top + 16}" width="${num(Math.max(4, (w * language.percent) / 100))}" height="5" rx="2.5" fill="${fill}"/>`
      );
    })
    .join('');
  return { markup, height: shown.length * 26 };
}

/** Contributions per week as bars. The busiest week is marked in the second accent. */
export function weekBars(look: Look, days: ReadonlyArray<ContributionDay>, x: number, y: number, w: number, h: number, motion: boolean): string {
  const weeks = weeklyTotals(days);
  if (weeks.length === 0) return '';
  const peak = Math.max(...weeks, 1);
  const peakIndex = weeks.indexOf(Math.max(...weeks));
  const gap = 2;
  const bar = (w - gap * (weeks.length - 1)) / weeks.length;
  return (
    weeks
      .map((total, index) => {
        const height = Math.max(2, (total / peak) * h);
        const fill = total === 0 ? look.track : index === peakIndex ? look.accent2 : look.accent;
        const delay = motion ? ` style="animation-delay:${(0.2 + index * 0.012).toFixed(3)}s"` : '';
        return `<rect class="bar" x="${num(x + index * (bar + gap))}" y="${num(y + h - height)}" width="${num(bar)}" height="${num(height)}" rx="1.5" fill="${fill}"${total === 0 ? '' : ' fill-opacity="0.9"'}${delay}/>`;
      })
      .join('') + `<rect x="${x}" y="${y + h + 1}" width="${w}" height="1" fill="${look.border}"/>`
  );
}

/** A small calendar of the past year: seven rows, one column per week. Colours follow GitHub's own levels. */
export function heatStrip(look: Look, days: ReadonlyArray<ContributionDay>, x: number, y: number, w: number): { markup: string; height: number } {
  if (days.length === 0) return { markup: '', height: 0 };
  const first = new Date(`${days[0]?.date}T00:00:00Z`).getUTCDay();
  const cols = Math.ceil((first + days.length) / 7);
  const gap = 2;
  const cell = Math.max(2, (w - gap * (cols - 1)) / cols);
  const opacities = [0, 0.3, 0.5, 0.75, 1];
  const markup = days
    .map((day, index) => {
      const col = Math.floor((first + index) / 7);
      const row = (first + index) % 7;
      const attrs = day.level === 0 ? `fill="${look.track}"` : `fill="${look.accent}" fill-opacity="${opacities[day.level]}"`;
      return `<rect x="${num(x + col * (cell + gap))}" y="${num(y + row * (cell + gap))}" width="${num(cell)}" height="${num(cell)}" rx="1.5" ${attrs}/>`;
    })
    .join('');
  return { markup, height: 7 * cell + 6 * gap };
}

export const REPO_ROW = 58;

/** One repository as a row: name and description on the left, numbers on the right. */
export function repoRow(look: Look, repo: RepoSummary, profile: Profile, x: number, y: number, w: number): string {
  const updated = repo.pushedAt && profile.fetchedAt ? timeAgo(repo.pushedAt, profile.fetchedAt) : null;
  const meta = [repo.language, repo.license, updated ? `updated ${updated}` : null].filter((v): v is string => Boolean(v));
  const desc = repo.description ? wrap(repo.description, Math.max(24, Math.floor((w - 190) / 6.3)), 1)[0] : null;
  return (
    `<rect x="${x}" y="${y}" width="${w}" height="${REPO_ROW - 8}" rx="12" fill="${look.panel}" stroke="${look.border}"/>` +
    sans(truncate(repo.name, 28), x + 16, y + 22, look.accent, 'font-size="14.5" font-weight="700"') +
    (desc ? sans(desc, x + 16, y + 40, look.muted, 'font-size="12"') : meta.length > 0 ? mono(truncate(meta.join('  ·  '), 60), x + 16, y + 40, look.muted, 'font-size="11"') : '') +
    mono(`★ ${formatNumber(repo.stars)}`, x + w - 16, y + 22, look.fg, 'font-size="12.5" font-weight="700" text-anchor="end"') +
    mono(`forks ${formatNumber(repo.forks)}`, x + w - 16, y + 40, look.muted, 'font-size="11" text-anchor="end"')
  );
}

/** Repositories whose main language is in the list, most starred first. */
export function reposIn(profile: Profile, languages: ReadonlyArray<string>): RepoSummary[] {
  const wanted = new Set(languages.map((l) => l.toLowerCase()));
  return profile.topRepos.filter((r) => r.language && wanted.has(r.language.toLowerCase())).sort((a, b) => b.stars - a.stars);
}

/** The share of the user's repositories, as GitHub counts languages, that fall in the list. */
export function shareIn(profile: Profile, languages: ReadonlyArray<string>): number {
  const wanted = new Set(languages.map((l) => l.toLowerCase()));
  return profile.languages.filter((l) => wanted.has(l.name.toLowerCase())).reduce((sum, l) => sum + l.percent, 0);
}
