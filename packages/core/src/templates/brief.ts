import { FALLBACK_ACCENTS, accentColors } from '../color';
import { assetPath } from '../readme';
import { variantsFor, type Variant } from '../themes';
import type { Config, Output, Profile, Template } from '../types';
import { formatNumber, safeUrl, truncate, wrap, xmlEscape } from '../util';
import { FONT_SANS, FONT_SERIF, SAFE_DATA_URI, describeProfile, imageReadme, rise } from './shared';

const WIDTH = 900;
const PAD = 44;
const PHOTO = 96;
const PHOTO_GAP = 28;
const COL_GAP = 40;
const WORK_WIDTH = 540;

/** Warm paper in light mode and charcoal in dark mode. Quiet on purpose, so the content leads. */
const PAPER: Record<Variant, { bg: string; fg: string; muted: string; rule: string; track: string }> = {
  light: { bg: '#fbfaf6', fg: '#1c1b19', muted: '#68655d', rule: '#dedad0', track: '#ebe7dc' },
  dark: { bg: '#14161a', fg: '#ecebe6', muted: '#9a978f', rule: '#2c2f35', track: '#23262c' },
};

function label(text: string, x: number, y: number, color: string): string {
  return `<text x="${x}" y="${y}" font-size="12" font-weight="700" letter-spacing="1.8" fill="${color}">${xmlEscape(text)}</text>`;
}

function renderSvg(profile: Profile, config: Config, variant: Variant): string {
  const t = PAPER[variant];
  const accent = profile.avatar?.grid.tint
    ? (accentColors(profile.avatar.grid.tint, variant)[0] ?? t.fg)
    : (FALLBACK_ACCENTS[variant][1] ?? t.fg);
  const motion = config.motion;
  const parts: string[] = [];
  let step = 0;
  const next = () => step++ * 0.1;

  // Header: name, role, contact line and bio on the left, a small portrait on the right.
  const uri = profile.avatar?.dataUri;
  const hasPhoto = Boolean(uri && SAFE_DATA_URI.test(uri));
  const textWidth = hasPhoto ? WIDTH - PAD * 2 - PHOTO - PHOTO_GAP : WIDTH - PAD * 2;

  let y = PAD + 38;
  const header: string[] = [
    `<text x="${PAD}" y="${y}" class="serif" font-size="42" font-weight="700" fill="${t.fg}">${xmlEscape(truncate(profile.name ?? profile.login, Math.floor(textWidth / 22)))}</text>`,
  ];
  if (config.text.headline) {
    y += 34;
    header.push(
      `<text x="${PAD}" y="${y}" font-size="19" font-weight="600" fill="${accent}">${xmlEscape(truncate(config.text.headline, Math.floor(textWidth / 10)))}</text>`,
    );
  }
  const website = safeUrl(profile.website)?.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const contact = [profile.company, profile.location, website].filter((v): v is string => Boolean(v));
  if (contact.length > 0) {
    y += 28;
    header.push(
      `<text x="${PAD}" y="${y}" font-size="14" fill="${t.muted}">${xmlEscape(truncate(contact.join('  ·  '), Math.floor(textWidth / 7.4)))}</text>`,
    );
  }
  const bio = config.text.bio ?? profile.bio;
  if (bio) {
    wrap(bio, Math.floor(textWidth / 7.6), 3).forEach((line, index) => {
      y += index === 0 ? 32 : 22;
      header.push(`<text x="${PAD}" y="${y}" font-size="15" fill="${t.fg}" fill-opacity="0.85">${xmlEscape(line)}</text>`);
    });
  }
  if (hasPhoto && uri) {
    const x = WIDTH - PAD - PHOTO;
    header.push(
      `<clipPath id="photo"><rect x="${x}" y="${PAD}" width="${PHOTO}" height="${PHOTO}" rx="16"/></clipPath>` +
        `<image href="${uri}" x="${x}" y="${PAD}" width="${PHOTO}" height="${PHOTO}" preserveAspectRatio="xMidYMid slice" clip-path="url(#photo)"/>` +
        `<rect x="${x + 0.5}" y="${PAD + 0.5}" width="${PHOTO - 1}" height="${PHOTO - 1}" rx="16" fill="none" stroke="${t.rule}"/>`,
    );
  }
  const headerBottom = Math.max(y, hasPhoto ? PAD + PHOTO : 0) + 28;
  parts.push(rise(header.join(''), motion, next()));
  parts.push(
    `<rect x="${PAD}" y="${headerBottom}" width="${WIDTH - PAD * 2}" height="1" fill="${t.rule}"/>` +
      `<rect x="${PAD}" y="${headerBottom - 1}" width="56" height="3" fill="${accent}"/>`,
  );
  let cursor = headerBottom + 32;

  // At a glance: the numbers a reader checks first.
  if (config.blocks.includes('stats')) {
    const since = new Date(profile.createdAt).getUTCFullYear();
    const cells: Array<[string, string]> = [
      [formatNumber(profile.publicRepos), 'REPOSITORIES'],
      [formatNumber(profile.totalStars), 'STARS EARNED'],
      [formatNumber(profile.followers), 'FOLLOWERS'],
    ];
    if (Number.isFinite(since)) cells.push([String(since), 'MEMBER SINCE']);
    const cellWidth = (WIDTH - PAD * 2) / cells.length;
    const markup = cells
      .map(([value, caption], index) => {
        const x = PAD + index * cellWidth + (index > 0 ? 22 : 0);
        const divider =
          index > 0
            ? `<rect x="${(PAD + index * cellWidth).toFixed(1)}" y="${cursor}" width="1" height="54" fill="${t.rule}"/>`
            : '';
        return (
          divider +
          `<text x="${x.toFixed(1)}" y="${cursor + 34}" class="serif" font-size="34" font-weight="700" fill="${t.fg}">${xmlEscape(value)}</text>` +
          `<text x="${x.toFixed(1)}" y="${cursor + 54}" font-size="11" letter-spacing="1.3" fill="${t.muted}">${caption}</text>`
        );
      })
      .join('');
    parts.push(rise(markup, motion, next()));
    cursor += 54 + 22;
    parts.push(`<rect x="${PAD}" y="${cursor}" width="${WIDTH - PAD * 2}" height="1" fill="${t.rule}"/>`);
    cursor += 32;
  }

  // Two columns: selected work, and stack.
  const showWork = config.blocks.includes('projects') && profile.topRepos.length > 0;
  const showStack = config.blocks.includes('languages') && profile.languages.length > 0;
  const workWidth = showStack ? WORK_WIDTH : WIDTH - PAD * 2;
  const stackX = showWork ? PAD + WORK_WIDTH + COL_GAP : PAD;
  const stackWidth = showWork ? WIDTH - PAD - stackX : 360;
  let bottom = cursor;

  if (showWork) {
    let iy = cursor + 36;
    const work: string[] = [label('SELECTED WORK', PAD, cursor + 8, accent)];
    for (const repo of profile.topRepos.slice(0, 4)) {
      work.push(
        `<text x="${PAD}" y="${iy}" font-size="16" font-weight="700" fill="${t.fg}">${xmlEscape(truncate(repo.name, Math.floor((workWidth - 80) / 9)))}</text>` +
          `<text x="${PAD + workWidth}" y="${iy}" text-anchor="end" font-size="13" fill="${t.muted}">★ ${xmlEscape(formatNumber(repo.stars))}</text>`,
      );
      let ly = iy;
      if (repo.description) {
        for (const line of wrap(repo.description, Math.floor(workWidth / 6.9), 2)) {
          ly += 20;
          work.push(`<text x="${PAD}" y="${ly}" font-size="13.5" fill="${t.muted}">${xmlEscape(line)}</text>`);
        }
      }
      if (repo.language) {
        ly += 20;
        work.push(`<text x="${PAD}" y="${ly}" font-size="12.5" fill="${accent}">${xmlEscape(repo.language)}</text>`);
      }
      work.push(`<rect x="${PAD}" y="${ly + 14}" width="${workWidth}" height="1" fill="${t.rule}"/>`);
      iy = ly + 14 + 30;
    }
    parts.push(rise(work.join(''), motion, next()));
    bottom = Math.max(bottom, iy - 30);
  }

  if (showStack) {
    const stack: string[] = [label('STACK', stackX, cursor + 8, accent)];
    let sy = cursor + 38;
    for (const language of profile.languages) {
      const filled = Math.max(3, (language.percent / 100) * stackWidth);
      stack.push(
        `<text x="${stackX}" y="${sy}" font-size="14" fill="${t.fg}">${xmlEscape(truncate(language.name, 22))}</text>` +
          `<text x="${stackX + stackWidth}" y="${sy}" text-anchor="end" font-size="14" fill="${t.muted}">${language.percent}%</text>` +
          `<rect x="${stackX}" y="${sy + 9}" width="${stackWidth}" height="4" rx="2" fill="${t.track}"/>` +
          `<rect x="${stackX}" y="${sy + 9}" width="${filled.toFixed(1)}" height="4" rx="2" fill="${accent}"/>`,
      );
      sy += 38;
    }
    stack.push(`<text x="${stackX}" y="${sy + 2}" font-size="11.5" fill="${t.muted}">By number of repositories</text>`);
    parts.push(rise(stack.join(''), motion, next()));
    bottom = Math.max(bottom, sy + 8);
  }

  // Footer: where to find the work.
  const footerY = bottom + 18;
  parts.push(
    rise(
      `<rect x="${PAD}" y="${footerY}" width="${WIDTH - PAD * 2}" height="1" fill="${t.rule}"/>` +
        `<text x="${PAD}" y="${footerY + 28}" font-size="13" fill="${t.muted}">github.com/${xmlEscape(profile.login)}</text>`,
      motion,
      next(),
    ),
  );
  const height = footerY + 28 + PAD - 12;
  const title = `${profile.name ?? profile.login} (@${profile.login}) on GitHub`;

  const css = motion
    ? `.rise{animation:rise .6s ease both}
@keyframes rise{from{opacity:0;transform:translateY(6px)}}
@media (prefers-reduced-motion:reduce){.rise{animation:none}}`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}" role="img" aria-labelledby="t">
<title id="t">${xmlEscape(title)}</title>
<style>
text{font-family:${FONT_SANS}}
.serif{font-family:${FONT_SERIF}}
${css}
</style>
<rect width="${WIDTH}" height="${height}" rx="6" fill="${t.bg}"/>
<rect x="0.5" y="0.5" width="${WIDTH - 1}" height="${height - 1}" rx="6" fill="none" stroke="${t.rule}"/>
${parts.filter(Boolean).join('\n')}
</svg>
`;
}

export const brief: Template = {
  id: 'brief',
  name: 'Recruiter brief',
  description: 'A calm, paper-style one-page brief you can scan in ten seconds: who you are, proof of work, your stack.',
  tags: ['light', 'clean', 'professional', 'resume'],
  needsAvatar: true,
  render(profile, config): Output {
    const assets = variantsFor(config.theme).map((variant) => ({
      path: assetPath('brief', variant),
      content: renderSvg(profile, config, variant),
    }));
    return { readme: imageReadme(profile, config, 'brief', WIDTH, describeProfile(profile, config)), assets };
  },
};
