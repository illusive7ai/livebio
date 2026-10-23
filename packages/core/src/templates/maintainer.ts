import { FALLBACK_ACCENTS, accentColors } from '../color';
import { busiestMonth, weeklyTotals } from '../contributions';
import { ACTIVE_WINDOW_DAYS } from '../github';
import { assetPath } from '../readme';
import { variantsFor, type Variant } from '../themes';
import type { Config, Output, Profile, RepoSummary, Template } from '../types';
import { formatNumber, timeAgo, truncate, wrap, xmlEscape } from '../util';
import { FONT, FONT_SANS, SAFE_DATA_URI, describeProfile, imageReadme, plural, rise } from './shared';

const WIDTH = 900;
const PAD = 36;
const AVATAR = 76;
const TILE_GAP = 16;
const TILE_HEIGHT = 140;
const SECTION_GAP = 30;
const CHART_HEIGHT = 70;
const BAR_GAP = 3;

/** An engineer's blueprint: deep navy in dark mode, cool drafting paper in light mode. */
const PALETTE: Record<Variant, { bg: string; panel: string; border: string; fg: string; muted: string; track: string; grid: string }> = {
  dark: { bg: '#0b1220', panel: '#111a2e', border: '#22304d', fg: '#e7ecf6', muted: '#93a0ba', track: '#1a2540', grid: '#7c93c4' },
  light: { bg: '#f4f7fc', panel: '#ffffff', border: '#d6dfee', fg: '#0f1b33', muted: '#5a6987', track: '#e6ecf6', grid: '#3b5bb0' },
};

const mono = (text: string, x: number, y: number, fill: string, extra = ''): string =>
  `<text class="mono" x="${x}" y="${y}" fill="${fill}" ${extra}>${xmlEscape(text)}</text>`;

function sectionLabel(text: string, y: number, color: string): string {
  return mono(text, PAD, y, color, 'font-size="12" font-weight="700" letter-spacing="2"');
}

function repoTile(
  repo: RepoSummary,
  x: number,
  y: number,
  width: number,
  profile: Profile,
  t: (typeof PALETTE)[Variant],
  accent: string,
): string {
  const parts: string[] = [
    `<rect x="${x}" y="${y}" width="${width}" height="${TILE_HEIGHT}" rx="14" fill="${t.panel}" stroke="${t.border}"/>`,
  ];

  // Name on the left, main language on the right.
  const nameRoom = Math.floor((width - 36) / 9.4) - (repo.language ? Math.ceil(repo.language.length * 0.8) + 2 : 0);
  parts.push(
    `<text x="${x + 18}" y="${y + 32}" font-size="15.5" font-weight="700" fill="${accent}">${xmlEscape(truncate(repo.name, Math.max(10, nameRoom)))}</text>`,
  );
  if (repo.language) {
    const label = truncate(repo.language, 16);
    const right = x + width - 18;
    parts.push(
      `<circle cx="${right - label.length * 7.2 - 12}" cy="${y + 27.5}" r="4" fill="${accent}"/>` +
        mono(label, right, y + 32, t.muted, 'font-size="12" text-anchor="end"'),
    );
  }

  if (repo.description) {
    wrap(repo.description, Math.max(20, Math.floor((width - 36) / 6.5)), 2).forEach((line, index) => {
      parts.push(
        `<text x="${x + 18}" y="${y + 56 + index * 19}" font-size="13" fill="${t.muted}">${xmlEscape(line)}</text>`,
      );
    });
  }

  // Impact on one row, licence and freshness on the next.
  parts.push(
    `<text class="mono" x="${x + 18}" y="${y + 106}" font-size="12" fill="${t.muted}" xml:space="preserve">` +
      `<tspan fill="${t.fg}" font-weight="700">★ ${xmlEscape(formatNumber(repo.stars))}</tspan>   ` +
      `forks <tspan fill="${t.fg}" font-weight="700">${xmlEscape(formatNumber(repo.forks))}</tspan></text>`,
  );
  const updated = repo.pushedAt && profile.fetchedAt ? timeAgo(repo.pushedAt, profile.fetchedAt) : null;
  const facts = [repo.license, updated ? `updated ${updated}` : null].filter((v): v is string => Boolean(v));
  if (facts.length > 0) {
    parts.push(mono(facts.join('  ·  '), x + 18, y + 127, t.muted, 'font-size="11.5"'));
  }
  return parts.join('');
}

function renderSvg(profile: Profile, config: Config, variant: Variant): string {
  const t = PALETTE[variant];
  const tint = profile.avatar?.grid.tint;
  const palette = tint ? accentColors(tint, variant) : FALLBACK_ACCENTS[variant];
  const accent = (tint ? palette[0] : palette[1]) ?? t.fg;
  const accent2 = (tint ? palette[1] : palette[0]) ?? accent;
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const parts: string[] = [];
  let step = 0;
  const next = () => step++ * 0.09;

  // Header: portrait, name and a short line about who this is.
  const uri = profile.avatar?.dataUri;
  const hasPhoto = Boolean(uri && SAFE_DATA_URI.test(uri));
  const cx = PAD + AVATAR / 2;
  const cy = PAD + AVATAR / 2;
  const initial = [...(profile.name ?? profile.login)][0]?.toUpperCase() ?? '?';
  const portrait =
    hasPhoto && uri
      ? `<clipPath id="portrait"><circle cx="${cx}" cy="${cy}" r="${AVATAR / 2}"/></clipPath>` +
        `<image href="${uri}" x="${PAD}" y="${PAD}" width="${AVATAR}" height="${AVATAR}" preserveAspectRatio="xMidYMid slice" clip-path="url(#portrait)"/>` +
        `<circle cx="${cx}" cy="${cy}" r="${AVATAR / 2 + 4}" fill="none" stroke="${accent}" stroke-width="2"/>`
      : `<circle cx="${cx}" cy="${cy}" r="${AVATAR / 2}" fill="${accent}"/>` +
        `<text x="${cx}" y="${cy + 12}" text-anchor="middle" font-size="34" font-weight="800" fill="${t.bg}">${xmlEscape(initial)}</text>`;

  const textX = PAD + AVATAR + 24;
  const bio = config.text.bio ?? profile.bio;
  const subline = [
    profile.name ? `<tspan fill="${t.muted}">@${xmlEscape(profile.login)}</tspan>` : '',
    config.text.headline ? `<tspan fill="${accent}" font-weight="600">${xmlEscape(truncate(config.text.headline, 50))}</tspan>` : '',
  ].filter(Boolean);
  const header =
    portrait +
    `<text x="${textX}" y="${PAD + 30}" font-size="30" font-weight="800" fill="${t.fg}">${xmlEscape(truncate(profile.name ?? profile.login, 30))}</text>` +
    (subline.length > 0
      ? `<text x="${textX}" y="${PAD + 54}" font-size="14.5" xml:space="preserve">${subline.join('<tspan fill="' + t.muted + '">  ·  </tspan>')}</text>`
      : '') +
    (bio ? `<text x="${textX}" y="${PAD + 76}" font-size="13.5" fill="${t.fg}" fill-opacity="0.8">${xmlEscape(truncate(bio, 88))}</text>` : '') +
    mono(`github.com/${profile.login}`, WIDTH - PAD, PAD + 22, t.muted, 'font-size="12.5" text-anchor="end"');
  parts.push(rise(header, motion, next()));
  let cursor = PAD + AVATAR + 32;

  // Impact: the four numbers that matter most when judging open-source work.
  if (blocks.has('stats')) {
    const cells: Array<[string, string]> = [[formatNumber(profile.totalStars), 'STARS EARNED']];
    if (profile.totalForks !== undefined) cells.push([formatNumber(profile.totalForks), 'FORKS']);
    cells.push([formatNumber(profile.publicRepos), 'REPOSITORIES']);
    if (profile.activeRepos !== undefined) cells.push([formatNumber(profile.activeRepos), `ACTIVE, LAST ${ACTIVE_WINDOW_DAYS} DAYS`]);
    if (cells.length < 4) cells.push([formatNumber(profile.followers), 'FOLLOWERS']);
    const shown = cells.slice(0, 4);
    const cellWidth = (WIDTH - PAD * 2) / shown.length;
    const markup =
      `<rect x="${PAD}" y="${cursor}" width="${WIDTH - PAD * 2}" height="88" rx="16" fill="${t.panel}" stroke="${t.border}"/>` +
      `<rect x="${PAD + 20}" y="${cursor}" width="44" height="3" rx="1.5" fill="${accent}"/>` +
      shown
        .map(([value, caption], index) => {
          const x = PAD + index * cellWidth + 24;
          const divider =
            index > 0 ? `<rect x="${(PAD + index * cellWidth).toFixed(1)}" y="${cursor + 18}" width="1" height="52" fill="${t.border}"/>` : '';
          return (
            divider +
            `<text x="${x.toFixed(1)}" y="${cursor + 47}" font-size="30" font-weight="800" fill="${t.fg}">${xmlEscape(value)}</text>` +
            mono(caption, Number(x.toFixed(1)), cursor + 68, t.muted, 'font-size="10.5" letter-spacing="1"')
          );
        })
        .join('');
    parts.push(rise(markup, motion, next()));
    cursor += 88 + SECTION_GAP;
  }

  // Projects: repository tiles, two across.
  if (blocks.has('projects') && profile.topRepos.length > 0) {
    const repos = profile.topRepos.slice(0, 4);
    const half = Math.floor((WIDTH - PAD * 2 - TILE_GAP) / 2);
    const top = cursor + 24;
    const tiles = repos
      .map((repo, index) => {
        const alone = index === repos.length - 1 && repos.length % 2 === 1;
        const width = alone ? WIDTH - PAD * 2 : half;
        const x = PAD + (index % 2) * (half + TILE_GAP);
        const y = top + Math.floor(index / 2) * (TILE_HEIGHT + TILE_GAP);
        return repoTile(repo, x, y, width, profile, t, accent);
      })
      .join('');
    parts.push(rise(sectionLabel('PROJECTS', cursor + 10, accent) + tiles, motion, next()));
    const rows = Math.ceil(repos.length / 2);
    cursor = top + rows * TILE_HEIGHT + (rows - 1) * TILE_GAP + SECTION_GAP;
  }

  // Pulse: contributions per week across the past year.
  if (blocks.has('activity') && profile.contributions) {
    const activity = profile.contributions;
    const weeks = weeklyTotals(activity.days);
    const peak = Math.max(...weeks, 1);
    const peakIndex = weeks.indexOf(Math.max(...weeks));
    const width = WIDTH - PAD * 2;
    const barWidth = (width - BAR_GAP * (weeks.length - 1)) / weeks.length;
    const top = cursor + 24;
    const bars = weeks
      .map((total, index) => {
        const height = Math.max(2, (total / peak) * CHART_HEIGHT);
        const x = PAD + index * (barWidth + BAR_GAP);
        const fill = total === 0 ? t.track : index === peakIndex ? accent2 : accent;
        const delay = motion ? ` style="animation-delay:${(0.25 + index * 0.012).toFixed(3)}s"` : '';
        return `<rect class="bar" x="${x.toFixed(2)}" y="${(top + CHART_HEIGHT - height).toFixed(2)}" width="${barWidth.toFixed(2)}" height="${height.toFixed(2)}" rx="1.5" fill="${fill}"${total === 0 ? '' : ' fill-opacity="0.9"'}${delay}/>`;
      })
      .join('');
    const month = busiestMonth(activity.days);
    const caption = [
      `${formatNumber(activity.total)} contributions`,
      `current streak ${plural(activity.currentStreak, 'day')}`,
      `longest streak ${plural(activity.longestStreak, 'day')}`,
      month ? `busiest month ${month.name} (${formatNumber(month.total)})` : null,
    ]
      .filter((v): v is string => Boolean(v))
      .join('  ·  ');
    const markup =
      sectionLabel('PULSE, PAST YEAR', cursor + 10, accent) +
      `<rect x="${PAD}" y="${top + CHART_HEIGHT + 1}" width="${width}" height="1" fill="${t.border}"/>` +
      bars +
      mono(truncate(caption, 120), PAD, top + CHART_HEIGHT + 26, t.muted, 'font-size="12"');
    parts.push(rise(markup, motion, next()));
    cursor = top + CHART_HEIGHT + 26 + 8 + SECTION_GAP;
  }

  // Languages: one quiet line.
  if (blocks.has('languages') && profile.languages.length > 0) {
    let x = PAD + 112;
    const items: string[] = [];
    profile.languages.forEach((language, index) => {
      const label = `${truncate(language.name, 14)} ${language.percent}%`;
      const width = 16 + Math.ceil(label.length * 7) + 22;
      if (x + width > WIDTH - PAD) return;
      const shade = (tint ? palette : [accent, accent2])[index % (tint ? palette.length : 2)] ?? accent;
      items.push(
        `<circle cx="${x + 4}" cy="${cursor - 4}" r="4" fill="${shade}"/>` +
          `<text x="${x + 16}" y="${cursor}" font-size="13" fill="${t.fg}" fill-opacity="0.85">${xmlEscape(label)}</text>`,
      );
      x += width;
    });
    parts.push(rise(sectionLabel('WRITTEN IN', cursor, accent) + items.join(''), motion, next()));
    cursor += 10 + SECTION_GAP;
  }

  const height = cursor - SECTION_GAP + PAD;
  const title = `${profile.name ?? profile.login} (@${profile.login}) on GitHub`;
  const css = motion
    ? `.rise{animation:rise .6s ease both}
@keyframes rise{from{opacity:0;transform:translateY(6px)}}
.bar{transform-box:fill-box;transform-origin:50% 100%;animation:grow .7s cubic-bezier(.2,.7,.2,1) both}
@keyframes grow{from{transform:scaleY(0)}}
@media (prefers-reduced-motion:reduce){.rise,.bar{animation:none}}`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}" role="img" aria-labelledby="t">
<title id="t">${xmlEscape(title)}</title>
<defs>
<pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="${t.grid}" stroke-opacity="${variant === 'dark' ? 0.09 : 0.08}"/></pattern>
<radialGradient id="glow" cx="0.92" cy="0" r="0.8"><stop offset="0" stop-color="${accent}" stop-opacity="${variant === 'dark' ? 0.2 : 0.12}"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient>
</defs>
<style>
text{font-family:${FONT_SANS}}
.mono{font-family:${FONT}}
${css}
</style>
<rect width="${WIDTH}" height="${height}" rx="18" fill="${t.bg}"/>
<rect width="${WIDTH}" height="${height}" rx="18" fill="url(#grid)"/>
<rect width="${WIDTH}" height="${height}" rx="18" fill="url(#glow)"/>
<rect x="0.5" y="0.5" width="${WIDTH - 1}" height="${height - 1}" rx="18" fill="none" stroke="${t.border}"/>
${parts.filter(Boolean).join('\n')}
</svg>
`;
}

export const maintainer: Template = {
  id: 'maintainer',
  name: 'Open-source maintainer',
  description: 'A project board for your open-source work: impact, repository tiles with licences and freshness, and a weekly pulse.',
  tags: ['dark', 'blueprint', 'open source', 'projects'],
  needsAvatar: true,
  render(profile, config): Output {
    const assets = variantsFor(config.theme).map((variant) => ({
      path: assetPath('maintainer', variant),
      content: renderSvg(profile, config, variant),
    }));
    const projects =
      config.blocks.includes('projects') && profile.topRepos.length > 0
        ? `top projects ${profile.topRepos.slice(0, 4).map((r) => r.name).join(', ')}`
        : undefined;
    const alt = describeProfile(profile, config, projects, { activity: true });
    return { readme: imageReadme(profile, config, 'maintainer', WIDTH, alt), assets };
  },
};
