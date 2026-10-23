import { hslToHex, hueOf } from '../color';
import { recentWeeks } from '../contributions';
import { assetPath } from '../readme';
import { variantsFor, type Variant } from '../themes';
import type { Config, Output, Profile, RepoSummary, Template } from '../types';
import { formatNumber, timeAgo, truncate, wrap, xmlEscape } from '../util';
import { FONT, FONT_SANS, SAFE_DATA_URI, describeProfile, imageReadme, plural, rise } from './shared';

const WIDTH = 900;
const PAD = 40;
const PHOTO = 112;
const WEEKS = 12;
const GAP = 16;

/** The featured project is the most-starred one; the next two sit beside each other under it. */
export function pickProjects(repos: ReadonlyArray<RepoSummary>): { featured: RepoSummary | null; others: RepoSummary[] } {
  const ranked = [...repos].sort((a, b) => b.stars - a.stars || a.name.localeCompare(b.name));
  return { featured: ranked[0] ?? null, others: ranked.slice(1, 3) };
}

const num = (value: number): string => String(Math.round(value * 10) / 10 || 0);

interface Look {
  skyTop: string;
  skyBottom: string;
  panel: string;
  border: string;
  fg: string;
  muted: string;
  accent: string;
  accent2: string;
  track: string;
}

/** A sunrise: warm by default, and shifted toward the picture's own colour when there is one. */
function lookFor(variant: Variant, hue: number): Look {
  const dark = variant === 'dark';
  return {
    skyTop: dark ? hslToHex(hue, 0.55, 0.09) : hslToHex(hue, 0.7, 0.96),
    skyBottom: dark ? hslToHex((hue + 38) % 360, 0.6, 0.2) : hslToHex((hue + 38) % 360, 0.8, 0.88),
    panel: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.7)',
    border: dark ? 'rgba(255,255,255,0.14)' : 'rgba(20,24,60,0.12)',
    fg: dark ? '#fff7ee' : '#2a1b14',
    muted: dark ? '#d6bfb0' : '#7a5a4a',
    accent: hslToHex(hue, 0.95, dark ? 0.62 : 0.46),
    accent2: hslToHex((hue + 38) % 360, 0.95, dark ? 0.66 : 0.5),
    track: dark ? 'rgba(255,255,255,0.1)' : 'rgba(20,24,60,0.08)',
  };
}

function chips(repo: RepoSummary, profile: Profile): string[] {
  const updated = repo.pushedAt && profile.fetchedAt ? timeAgo(repo.pushedAt, profile.fetchedAt) : null;
  return [repo.language, repo.forks > 0 ? `${formatNumber(repo.forks)} forks` : null, repo.license, updated ? `updated ${updated}` : null].filter(
    (v): v is string => Boolean(v),
  );
}

function renderSvg(profile: Profile, config: Config, variant: Variant): string {
  const look = lookFor(variant, hueOf(profile.avatar?.grid.tint) ?? 22);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const parts: string[] = [];
  let step = 0;
  const next = () => step++ * 0.1;

  // Hero: a big name, the headline, and the picture.
  const uri = profile.avatar?.dataUri;
  const hasPhoto = Boolean(uri && SAFE_DATA_URI.test(uri));
  const textWidth = hasPhoto ? WIDTH - PAD * 2 - PHOTO - 24 : WIDTH - PAD * 2;
  const bio = config.text.bio ?? profile.bio;
  let hero = `<text class="mono" x="${PAD}" y="${PAD + 12}" font-size="13" letter-spacing="2" fill="${look.accent}">@${xmlEscape(profile.login.toUpperCase())}</text>`;
  hero += `<text x="${PAD}" y="${PAD + 62}" font-size="48" font-weight="800" fill="${look.fg}">${xmlEscape(truncate(profile.name ?? profile.login, Math.floor(textWidth / 28)))}</text>`;
  let y = PAD + 62;
  if (config.text.headline) {
    y += 36;
    hero += `<text x="${PAD}" y="${y}" font-size="21" font-weight="600" fill="${look.accent2}">${xmlEscape(truncate(config.text.headline, Math.floor(textWidth / 11)))}</text>`;
  }
  if (bio) {
    wrap(bio, Math.floor(textWidth / 7.8), 2).forEach((line, index) => {
      y += index === 0 ? 30 : 22;
      hero += `<text x="${PAD}" y="${y}" font-size="15" fill="${look.muted}">${xmlEscape(line)}</text>`;
    });
  }
  if (hasPhoto && uri) {
    const x = WIDTH - PAD - PHOTO;
    hero +=
      `<clipPath id="photo"><rect x="${x}" y="${PAD - 6}" width="${PHOTO}" height="${PHOTO}" rx="28"/></clipPath>` +
      `<image href="${uri}" x="${x}" y="${PAD - 6}" width="${PHOTO}" height="${PHOTO}" preserveAspectRatio="xMidYMid slice" clip-path="url(#photo)"/>` +
      `<rect x="${x}" y="${PAD - 6}" width="${PHOTO}" height="${PHOTO}" rx="28" fill="none" stroke="${look.accent}" stroke-width="2.5"/>`;
  }
  parts.push(rise(hero, motion, next()));
  const heroBottom = Math.max(y, hasPhoto ? PAD + PHOTO : 0);
  let cursor = heroBottom + 40;

  // The headline numbers, big and plain.
  if (blocks.has('stats')) {
    const stats: Array<[string, string]> = [[formatNumber(profile.totalStars), 'STARS EARNED']];
    if (profile.activeRepos !== undefined) stats.push([formatNumber(profile.activeRepos), 'PROJECTS ACTIVE, LAST 90 DAYS']);
    stats.push([formatNumber(profile.followers), 'FOLLOWERS']);
    const width = (WIDTH - PAD * 2) / stats.length;
    const markup = stats
      .map(([value, caption], index) => {
        const x = PAD + index * width;
        return (
          `<text x="${num(x)}" y="${cursor + 38}" font-size="46" font-weight="800" fill="${look.fg}">${xmlEscape(value)}</text>` +
          `<text class="mono" x="${num(x)}" y="${cursor + 62}" font-size="10.5" letter-spacing="1.2" fill="${look.muted}">${xmlEscape(caption)}</text>`
        );
      })
      .join('');
    parts.push(rise(markup, motion, next()));
    cursor += 62 + 34;
  }

  // Projects: one featured, two beside each other under it.
  const { featured, others } = blocks.has('projects') ? pickProjects(profile.topRepos) : { featured: null, others: [] };
  if (featured) {
    const w = WIDTH - PAD * 2;
    const desc = featured.description ? wrap(featured.description, Math.floor((w - 250) / 8), 2) : [];
    let card =
      `<rect x="${PAD}" y="${cursor}" width="${w}" height="160" rx="22" fill="${look.panel}" stroke="${look.border}"/>` +
      `<rect x="${PAD + 24}" y="${cursor}" width="64" height="4" rx="2" fill="${look.accent}"/>` +
      `<text x="${PAD + 28}" y="${cursor + 52}" font-size="28" font-weight="800" fill="${look.fg}">${xmlEscape(truncate(featured.name, Math.floor((w - 250) / 15)))}</text>` +
      `<text class="mono" x="${PAD + w - 28}" y="${cursor + 56}" text-anchor="end" font-size="44" font-weight="800" fill="${look.accent}">★ ${xmlEscape(formatNumber(featured.stars))}</text>`;
    desc.forEach((line, index) => {
      card += `<text x="${PAD + 28}" y="${cursor + 84 + index * 21}" font-size="14.5" fill="${look.muted}">${xmlEscape(line)}</text>`;
    });
    card += `<text class="mono" x="${PAD + 28}" y="${cursor + 142}" font-size="12.5" fill="${look.muted}">${xmlEscape(truncate(chips(featured, profile).join('  ·  '), 96))}</text>`;
    parts.push(rise(card, motion, next()));
    cursor += 160 + GAP;
  }
  if (others.length > 0) {
    const w = others.length === 1 ? WIDTH - PAD * 2 : Math.floor((WIDTH - PAD * 2 - GAP) / 2);
    const cards = others
      .map((repo, index) => {
        const x = PAD + index * (w + GAP);
        return (
          `<rect x="${x}" y="${cursor}" width="${w}" height="92" rx="18" fill="${look.panel}" stroke="${look.border}"/>` +
          `<text x="${x + 22}" y="${cursor + 36}" font-size="17" font-weight="700" fill="${look.fg}">${xmlEscape(truncate(repo.name, Math.floor((w - 150) / 9.5)))}</text>` +
          `<text class="mono" x="${x + w - 22}" y="${cursor + 37}" text-anchor="end" font-size="18" font-weight="700" fill="${look.accent2}">★ ${xmlEscape(formatNumber(repo.stars))}</text>` +
          `<text class="mono" x="${x + 22}" y="${cursor + 66}" font-size="12" fill="${look.muted}">${xmlEscape(truncate(chips(repo, profile).join('  ·  '), Math.floor((w - 44) / 7)))}</text>`
        );
      })
      .join('');
    parts.push(rise(cards, motion, next()));
    cursor += 92;
  }
  if (featured) cursor += 34;

  // Momentum: the last twelve weeks, so what is happening now is easy to see.
  const activity = profile.contributions;
  if (blocks.has('activity') && activity) {
    const weeks = recentWeeks(activity.days, WEEKS);
    const peak = Math.max(...weeks, 1);
    const barW = 22;
    const bars = weeks
      .map((total, index) => {
        const h = Math.max(3, (total / peak) * 56);
        const x = PAD + index * (barW + 7);
        const fill = index === weeks.length - 1 ? look.accent2 : look.accent;
        return `<rect x="${x}" y="${num(cursor + 56 - h)}" width="${barW}" height="${num(h)}" rx="4" fill="${total === 0 ? look.track : fill}"/>`;
      })
      .join('');
    const sum = weeks.reduce((a, b) => a + b, 0);
    const textX = PAD + weeks.length * (barW + 7) + 22;
    const markup =
      bars +
      `<text x="${textX}" y="${cursor + 22}" font-size="26" font-weight="800" fill="${look.fg}">${xmlEscape(formatNumber(sum))}</text>` +
      `<text class="mono" x="${textX}" y="${cursor + 42}" font-size="11.5" fill="${look.muted}">contributions in the last ${weeks.length} weeks</text>` +
      `<text class="mono" x="${textX}" y="${cursor + 60}" font-size="11.5" fill="${look.muted}">current streak ${xmlEscape(plural(activity.currentStreak, 'day'))}</text>`;
    parts.push(rise(markup, motion, next()));
    cursor += 56 + 34;
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
    ? `.rise{animation:rise .6s ease both}@keyframes rise{from{opacity:0;transform:translateY(8px)}}.trail{stroke-dashoffset:0;animation:draw 2.4s ease-out both}@keyframes draw{from{stroke-dashoffset:900}}@media (prefers-reduced-motion:reduce){.rise,.trail{animation:none}}`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}" role="img" aria-labelledby="t">
<title id="t">${xmlEscape(title)}</title>
<defs>
<linearGradient id="sky" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${look.skyTop}"/><stop offset="1" stop-color="${look.skyBottom}"/></linearGradient>
<radialGradient id="sun" cx="0.92" cy="0.05" r="0.7"><stop offset="0" stop-color="${look.accent}" stop-opacity="${variant === 'dark' ? 0.4 : 0.3}"/><stop offset="1" stop-color="${look.accent}" stop-opacity="0"/></radialGradient>
</defs>
<style>
text{font-family:${FONT_SANS}}
.mono{font-family:${FONT}}
${css}
</style>
<rect width="${WIDTH}" height="${height}" rx="24" fill="url(#sky)"/>
<rect width="${WIDTH}" height="${height}" rx="24" fill="url(#sun)"/>
<path class="trail" d="M${Math.round(WIDTH * 0.42)} ${heroBottom + 24} C ${Math.round(WIDTH * 0.62)} ${heroBottom + 20}, ${Math.round(WIDTH * 0.8)} ${Math.round(heroBottom * 0.55)}, ${WIDTH + 20} 14" fill="none" stroke="${look.accent}" stroke-opacity="0.22" stroke-width="2" stroke-dasharray="3 9" stroke-dashoffset="0"/>
${parts.filter(Boolean).join('\n')}
</svg>
`;
}

export const launchpad: Template = {
  id: 'launchpad',
  name: 'Launchpad',
  description: 'A bold, hero-first page for people shipping products: one featured project, big numbers and recent momentum.',
  tags: ['bold', 'warm', 'products', 'animated'],
  needsAvatar: true,
  render(profile, config): Output {
    const assets = variantsFor(config.theme).map((variant) => ({
      path: assetPath('launchpad', variant),
      content: renderSvg(profile, config, variant),
    }));
    const { featured } = config.blocks.includes('projects') ? pickProjects(profile.topRepos) : { featured: null };
    const extra = featured ? `featuring ${featured.name}` : undefined;
    return { readme: imageReadme(profile, config, 'launchpad', WIDTH, describeProfile(profile, config, extra)), assets };
  },
};
