import { busiestMonth, weeklyTotals } from '../contributions';
import { assetPath, pictureTag, wrapReadme } from '../readme';
import { variantsFor, type Variant } from '../themes';
import type { Config, Output, Profile, RepoSummary, Template } from '../types';
import { escapeMarkdown, formatNumber, safeUrl, truncate, wrap, xmlEscape } from '../util';
import { PAD, W, enter, label, lookOf, mono, num, panel, portrait, riseCss, sans, shell, type Look } from './kit';
import { FONT_SERIF, describeProfile, imageReadme, plural } from './shared';

/** Designs that read like something printed or written: a newspaper front page, and folding sections. */

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** "Wednesday, 10 June 2026" for an ISO date, or null when there is no usable date. Never guesses. */
export function longDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return `${DAYS[date.getUTCDay()]}, ${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/**
 * Breaks a repository name over lines for a headline, after a hyphen or underscore where possible. The name itself
 * is never changed, only where it wraps. Anything past the last line is cut with an ellipsis.
 */
export function breakName(name: string, width: number, maxLines: number): string[] {
  const parts = name.match(/[^-_]+[-_]?|[-_]/g) ?? [name];
  const lines: string[] = [];
  let line = '';
  for (const part of parts) {
    if (line && (line + part).length > width) {
      lines.push(line);
      line = '';
    }
    line += part;
  }
  if (line) lines.push(line);
  const kept = lines.slice(0, maxLines).map((l) => (l.length > width ? l.slice(0, width - 1) + '…' : l));
  if (lines.length > maxLines) kept[maxLines - 1] = kept[maxLines - 1]!.replace(/.?$/, '…');
  return kept;
}

/* ------------------------------------------------------------------------------------------------ */
/* Front page                                                                                        */
/* ------------------------------------------------------------------------------------------------ */

/** Newsprint in light mode, a night edition in dark mode. Ink is one colour; a red is used sparingly. */
function paperLook(variant: Variant): Look {
  return variant === 'dark'
    ? { bg: '#1a1814', panel: '#221f1a', border: '#4a443a', fg: '#ece6d6', muted: '#a79f8d', track: '#2c2822', accent: '#e0634f', accent2: '#c9a45c' }
    : { bg: '#f6f1e4', panel: '#fbf8ef', border: '#bdb39c', fg: '#1d1a14', muted: '#665e4e', track: '#e6dfcd', accent: '#b3331f', accent2: '#8a6a1f' };
}

function frontPageSvg(profile: Profile, config: Config, variant: Variant): string {
  const look = paperLook(variant);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const serif = (text: string, x: number, y: number, size: number, extra = '', fill = look.fg): string =>
    `<text x="${x}" y="${y}" font-family="${FONT_SERIF}" font-size="${size}" fill="${fill}" ${extra}>${xmlEscape(text)}</text>`;
  let step = 0;
  const next = () => step++ * 0.1;

  // Masthead.
  const title = `THE ${truncate(profile.login.toUpperCase(), 18)} GAZETTE`;
  const size = Math.max(26, Math.min(46, Math.floor(780 / (title.length * 0.68))));
  const rule = (y: number, h = 1) => `<rect x="${PAD}" y="${y}" width="${W - PAD * 2}" height="${h}" fill="${look.fg}" fill-opacity="0.75"/>`;
  const created = Number(profile.createdAt.slice(0, 4));
  const date = longDate(profile.fetchedAt);
  let head =
    serif(title, W / 2, PAD + size, size, 'font-weight="700" text-anchor="middle" letter-spacing="2"') +
    rule(PAD + size + 14, 3) +
    rule(PAD + size + 20) +
    (Number.isFinite(created) && created > 1970 ? serif(`Established ${created}`, PAD, PAD + size + 42, 12.5, 'font-style="italic"', look.muted) : '') +
    (date ? serif(date, W / 2, PAD + size + 42, 12.5, 'text-anchor="middle"', look.muted) : '') +
    serif(`github.com/${profile.login}`, W - PAD, PAD + size + 42, 12.5, 'text-anchor="end" font-style="italic"', look.muted) +
    rule(PAD + size + 52);
  let y = PAD + size + 82;

  // Columns.
  const lead = blocks.has('projects') ? profile.topRepos[0] : undefined;
  const colTop = y;
  const colGap = 26;
  const leadW = 396;
  const midX = PAD + leadW + colGap;
  const midW = 190;
  const lastX = midX + midW + colGap;
  const lastW = W - PAD - lastX;
  let body = '';
  let colBottom = colTop;

  const byline = profile.name ?? profile.login;
  if (lead) {
    const headline = breakName(lead.name, 20, 3);
    body += label(look, 'LEAD STORY', PAD, colTop + 4);
    headline.forEach((line, i) => (body += serif(line, PAD, colTop + 38 + i * 32, 29, 'font-weight="700"')));
    let by = colTop + 38 + headline.length * 32 + 4;
    body += serif(`By ${truncate(byline, 30)}`, PAD, by + 4, 12, 'font-style="italic"', look.muted);
    by += 28;
    const text = lead.description ?? `A project by ${byline}.`;
    wrap(text, 52, 5).forEach((line) => { body += serif(line, PAD, by, 14.5); by += 21; });
    by += 6;
    body += serif(`★ ${formatNumber(lead.stars)} stars  ·  ${formatNumber(lead.forks)} forks${lead.language ? `  ·  ${truncate(lead.language, 16)}` : ''}`, PAD, by, 12.5, 'font-weight="700"', look.accent);
    colBottom = Math.max(colBottom, by + 10);
  } else if (blocks.has('stats') || blocks.has('languages')) {
    body += label(look, 'ABOUT', PAD, colTop + 4);
    const bio = config.text.bio ?? profile.bio;
    const intro = bio ? wrap(bio, 44, 6) : [];
    intro.forEach((line, i) => (body += serif(line, PAD, colTop + 36 + i * 24, 17)));
    colBottom = Math.max(colBottom, colTop + 36 + intro.length * 24);
  }

  if (blocks.has('stats')) {
    body += label(look, 'BY THE NUMBERS', midX, colTop + 4);
    const rows: Array<[string, string]> = [['Repositories', formatNumber(profile.publicRepos)], ['Stars', formatNumber(profile.totalStars)], ['Followers', formatNumber(profile.followers)], ['Following', formatNumber(profile.following)]];
    if (profile.totalForks !== undefined) rows.splice(2, 0, ['Forks', formatNumber(profile.totalForks)]);
    rows.forEach(([k, v], i) => {
      const ry = colTop + 34 + i * 30;
      body += serif(k, midX, ry, 14) + serif(v, midX + midW, ry, 15, 'font-weight="700" text-anchor="end"') + `<rect x="${midX}" y="${ry + 8}" width="${midW}" height="1" fill="${look.border}"/>`;
    });
    colBottom = Math.max(colBottom, colTop + 34 + rows.length * 30);
  }
  if (blocks.has('languages') && profile.languages.length > 0) {
    body += label(look, 'LANGUAGES', lastX, colTop + 4);
    profile.languages.slice(0, 5).forEach((l, i) => {
      const ry = colTop + 34 + i * 30;
      body += serif(truncate(l.name, 14), lastX, ry, 14) + serif(`${l.percent}%`, lastX + lastW, ry, 14, 'text-anchor="end"', look.muted) +
        `<rect x="${lastX}" y="${ry + 8}" width="${lastW}" height="3" fill="${look.track}"/><rect x="${lastX}" y="${ry + 8}" width="${num(Math.max(2, (lastW * l.percent) / 100))}" height="3" fill="${look.accent}"/>`;
    });
    colBottom = Math.max(colBottom, colTop + 34 + Math.min(5, profile.languages.length) * 30);
  }
  // A vertical rule between columns, as in print.
  const colHeight = colBottom - colTop + 6;
  body += `<rect x="${PAD + leadW + colGap / 2}" y="${colTop - 12}" width="1" height="${colHeight}" fill="${look.border}"/><rect x="${midX + midW + colGap / 2}" y="${colTop - 12}" width="1" height="${colHeight}" fill="${look.border}"/>`;
  y = colBottom + 22;

  // The year's activity, as a strip of small bars.
  let strip = '';
  if (blocks.has('activity') && profile.contributions) {
    const a = profile.contributions;
    const weeks = weeklyTotals(a.days);
    const peak = Math.max(...weeks, 1);
    const w = W - PAD * 2;
    const bar = w / weeks.length;
    const h = 46;
    const month = busiestMonth(a.days);
    strip =
      rule(y - 8) +
      label(look, 'THE YEAR IN BRIEF', PAD, y + 16) +
      weeks.map((total, i) => `<rect class="bar" x="${num(PAD + i * bar + 0.5)}" y="${num(y + 28 + h - Math.max(1, (total / peak) * h))}" width="${num(Math.max(1, bar - 1.5))}" height="${num(Math.max(1, (total / peak) * h))}" fill="${look.fg}" fill-opacity="${total === 0 ? 0.15 : 0.8}"/>`).join('') +
      serif(`${formatNumber(a.total)} contributions in the past year; a ${a.currentStreak}-day streak at press time, ${a.longestStreak} at best${month ? `; busiest in ${month.name}` : ''}.`, PAD, y + 28 + h + 22, 13, 'font-style="italic"', look.muted);
    y += 28 + h + 40;
  }
  const height = Math.max(y + PAD - 10, 300);
  const css = riseCss(motion);
  return shell({ height, look, variant, title: `${title.toLowerCase()}: ${profile.name ?? profile.login} (@${profile.login}) on GitHub`, css, body: enter(head, motion, next()) + enter(body, motion, next()) + enter(strip, motion, next()), grid: false, radius: 6, glow: [0.5, 0] });
}

export const frontpage: Template = {
  id: 'frontpage',
  name: 'Front Page',
  description: 'Your profile as a newspaper: a masthead, your lead project as the headline, the numbers in a column and the year in brief.',
  tags: ['paper', 'serif', 'editorial'],
  needsAvatar: false,
  render(profile, config): Output {
    const assets = variantsFor(config.theme).map((variant) => ({ path: assetPath('frontpage', variant), content: frontPageSvg(profile, config, variant) }));
    const lead = config.blocks.includes('projects') ? profile.topRepos[0] : undefined;
    return { readme: imageReadme(profile, config, 'frontpage', W, describeProfile(profile, config, lead ? `lead story ${lead.name}` : undefined, { activity: true })), assets };
  },
};

/* ------------------------------------------------------------------------------------------------ */
/* Everything hub: a small banner, then every section folds away so the page stays short.            */
/* ------------------------------------------------------------------------------------------------ */

function hubSvg(profile: Profile, config: Config, variant: Variant): string {
  const look = lookOf(200, variant, profile);
  const motion = config.motion;
  const r = 38;
  const textX = PAD + r * 2 + 28;
  const bio = config.text.bio ?? profile.bio;
  const sub = [`<tspan fill="${look.muted}">@${xmlEscape(profile.login)}</tspan>`];
  if (config.text.headline) sub.push(`<tspan fill="${look.accent}" font-weight="600">${xmlEscape(truncate(config.text.headline, 46))}</tspan>`);
  const body =
    panel(look, PAD - 14, PAD - 14, W - PAD * 2 + 28, r * 2 + 28, true) +
    portrait(profile, look, PAD + r, PAD + r, r) +
    sans(truncate(profile.name ?? profile.login, 28), textX, PAD + 30, look.fg, 'font-size="28" font-weight="800"') +
    `<text x="${textX}" y="${PAD + 54}" font-size="14" xml:space="preserve">${sub.join(`<tspan fill="${look.muted}">  ·  </tspan>`)}</text>` +
    (bio ? sans(truncate(bio, 76), textX, PAD + 76, look.fg, 'font-size="13" fill-opacity="0.78"') : '') +
    mono('OPEN A SECTION BELOW', W - PAD - 6, PAD + 22, look.accent, 'font-size="10.5" font-weight="700" letter-spacing="2" text-anchor="end"') +
    [0, 1, 2].map((i) => `<path d="M${W - PAD - 24 - i * 22} ${PAD + 40}l6 6l6 -6" fill="none" stroke="${look.accent}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"${motion ? ` class="nudge" style="animation-delay:${(i * 0.2).toFixed(1)}s"` : ''}/>`).join('');
  const css = motion ? `.nudge{animation:nudge 1.6s ease-in-out infinite}@keyframes nudge{50%{transform:translateY(4px)}}@media (prefers-reduced-motion:reduce){.nudge{animation:none}}` : '';
  return shell({ height: r * 2 + PAD * 2 - 4, look, variant, title: `${profile.name ?? profile.login} (@${profile.login}) on GitHub`, css, body, glow: [0.9, 0.2] });
}

/** One table cell. escapeMarkdown already escapes the pipe, so only line breaks need handling here. */
const cell = (text: string): string => escapeMarkdown(text).replace(/\r?\n/g, ' ');

function section(title: string, body: string, open: boolean): string {
  return `<details${open ? ' open' : ''}>\n<summary><b>${title}</b></summary>\n\n${body}\n\n</details>`;
}

function projectRow(repo: RepoSummary): string {
  // A pipe inside a link would still end the table cell, so it is encoded.
  const url = safeUrl(repo.url)?.replace(/\|/g, '%7C');
  const name = url ? `[${cell(truncate(repo.name, 40))}](<${url}>)` : cell(truncate(repo.name, 40));
  return `| ${name} | ${formatNumber(repo.stars)} | ${formatNumber(repo.forks)} | ${repo.description ? cell(truncate(repo.description, 90)) : ''} |`;
}

/** The README's sections: each is plain Markdown inside a <details>, so nothing here needs an image. */
export function hubSections(profile: Profile, config: Config): string[] {
  const blocks = new Set(config.blocks);
  const sections: string[] = [];
  if (blocks.has('stats')) {
    const rows = [['Repositories', formatNumber(profile.publicRepos)], ['Stars earned', formatNumber(profile.totalStars)]];
    if (profile.totalForks !== undefined) rows.push(['Forks', formatNumber(profile.totalForks)]);
    rows.push(['Followers', formatNumber(profile.followers)], ['Following', formatNumber(profile.following)]);
    const year = profile.createdAt.slice(0, 4);
    if (/^\d{4}$/.test(year)) rows.push(['On GitHub since', year]);
    sections.push(section('Numbers', `| | |\n|---|---:|\n${rows.map(([k, v]) => `| ${k} | ${v} |`).join('\n')}`, true));
  }
  if (blocks.has('languages') && profile.languages.length > 0) {
    const rows = profile.languages.slice(0, 6).map((l) => `| ${cell(l.name)} | ${'█'.repeat(Math.max(1, Math.round(l.percent / 5)))} ${l.percent}% |`);
    sections.push(section('Languages', `| Language | Share of repositories |\n|---|---|\n${rows.join('\n')}`, false));
  }
  if (blocks.has('projects') && profile.topRepos.length > 0) {
    sections.push(section('Projects', `| Project | Stars | Forks | About |\n|---|---:|---:|---|\n${profile.topRepos.slice(0, 6).map(projectRow).join('\n')}`, false));
  }
  if (blocks.has('activity') && profile.contributions) {
    const a = profile.contributions;
    const month = busiestMonth(a.days);
    const lines = [`- **${formatNumber(a.total)}** contributions in the past year, on ${plural(a.activeDays, 'active day')}`, `- Current streak: **${plural(a.currentStreak, 'day')}**`, `- Longest streak: **${plural(a.longestStreak, 'day')}**`];
    if (month) lines.push(`- Busiest month: **${month.name}**`);
    sections.push(section('Activity', lines.join('\n'), false));
  }
  return sections;
}

export const hub: Template = {
  id: 'hub',
  name: 'Everything Hub',
  description: 'Every section folds away, so nothing is too long: a small banner and then Numbers, Languages, Projects and Activity.',
  tags: ['collapsible', 'markdown', 'compact'],
  needsAvatar: true,
  render(profile, config): Output {
    const assets = variantsFor(config.theme).map((variant) => ({ path: assetPath('hub', variant), content: hubSvg(profile, config, variant) }));
    const website = safeUrl(profile.website);
    const links = [`[GitHub](<${profile.url}>)`];
    if (website) links.push(`[Website](<${website}>)`);
    const alt = describeProfile(profile, { ...config, blocks: [] }, undefined);
    const body = [
      `<div align="center">\n${pictureTag('hub', config.theme, alt, W)}\n</div>`,
      `<div align="center">\n\n${links.join(' · ')}\n\n</div>`,
      ...hubSections(profile, config),
    ];
    return { readme: wrapReadme(body.join('\n\n'), config), assets };
  },
};
