import { accentColors } from '../color';
import { assetPath } from '../readme';
import { palettes, variantsFor, type Palette, type Variant } from '../themes';
import type { Config, Output, Profile, Template } from '../types';
import { formatNumber, safeUrl, truncate, wrap, xmlEscape } from '../util';
import { FONT_SANS, SAFE_DATA_URI, describeProfile, imageReadme, plural, rise } from './shared';

const WIDTH = 900;
const PAD = 36;
const AVATAR = 128;
const AVATAR_GAP = 36;
const TEXT_X = PAD + 8 + AVATAR + AVATAR_GAP;
const SECTION_GAP = 30;
const TILE_GAP = 14;
const HEAT_CELL = 12;
const HEAT_STEP = 15;
/** How strongly the accent colour shows for busy-ness levels 0 to 4. Level 0 uses the track colour. */
const HEAT_OPACITY = [0, 0.3, 0.55, 0.78, 1];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function joined(createdAt: string): string | null {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return null;
  return `Joined ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

function chips(profile: Profile): string[] {
  const website = safeUrl(profile.website)?.replace(/^https?:\/\//, '').replace(/\/$/, '');
  return [profile.company, profile.location, website, joined(profile.createdAt)]
    .filter((text): text is string => Boolean(text))
    .map((text) => truncate(text, 30));
}

interface Context {
  p: Palette;
  accents: string[];
  motion: boolean;
}

const accent = (c: Context, index: number): string => c.accents[index % c.accents.length] ?? c.p.accent;

function avatarMarkup(profile: Profile, c: Context, cx: number, cy: number): string {
  const r = AVATAR / 2;
  const uri = profile.avatar?.dataUri;
  const ring =
    `<circle class="ring" cx="${cx}" cy="${cy}" r="${r + 6}" fill="none" stroke="url(#ring)" stroke-width="3"/>`;
  if (uri && SAFE_DATA_URI.test(uri)) {
    return (
      `<clipPath id="avatar"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>` +
      `<image href="${uri}" x="${cx - r}" y="${cy - r}" width="${AVATAR}" height="${AVATAR}" ` +
      `preserveAspectRatio="xMidYMid slice" clip-path="url(#avatar)"/>${ring}`
    );
  }
  // No usable picture: show an initial on the accent gradient.
  const initial = [...(profile.name ?? profile.login)][0]?.toUpperCase() ?? '?';
  return (
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#ring)"/>` +
    `<text x="${cx}" y="${cy + 20}" text-anchor="middle" font-size="56" font-weight="800" fill="#ffffff">${xmlEscape(initial)}</text>${ring}`
  );
}

function renderSvg(profile: Profile, config: Config, variant: Variant): string {
  const p = palettes[variant];
  const c: Context = { p, accents: accentColors(profile.avatar?.grid.tint, variant), motion: config.motion };
  const motion = config.motion;
  const body: string[] = [];
  let step = 0;
  const next = () => 0.1 + step++ * 0.12;

  // Hero: picture on the left, words on the right.
  const avatarCy = PAD + 14 + AVATAR / 2;
  body.push(rise(avatarMarkup(profile, c, PAD + 8 + AVATAR / 2, avatarCy), motion, 0));

  let y = PAD + 46;
  const text: string[] = [];
  text.push(
    `<text x="${TEXT_X}" y="${y}" font-size="40" font-weight="800" fill="${p.fg}">${xmlEscape(truncate(profile.name ?? profile.login, 26))}</text>`,
  );
  if (profile.name) {
    y += 30;
    text.push(`<text x="${TEXT_X}" y="${y}" font-size="17" fill="${p.muted}">@${xmlEscape(profile.login)}</text>`);
  }
  if (config.text.headline) {
    y += 36;
    text.push(
      `<text x="${TEXT_X}" y="${y}" font-size="20" font-weight="600" fill="${accent(c, 0)}">${xmlEscape(truncate(config.text.headline, 56))}</text>`,
    );
  }
  const bio = config.text.bio ?? profile.bio;
  if (bio) {
    wrap(bio, 62, 2).forEach((line, index) => {
      y += index === 0 ? 32 : 24;
      text.push(`<text x="${TEXT_X}" y="${y}" font-size="16" fill="${p.fg}" fill-opacity="0.82">${xmlEscape(line)}</text>`);
    });
  }
  body.push(rise(text.join(''), motion, next()));

  // Chips for company, location, website and join date.
  let chipX = TEXT_X;
  let chipY = y + 22;
  const chipMarkup: string[] = [];
  for (const label of chips(profile)) {
    const width = Math.ceil(label.length * 7.2) + 28;
    if (chipX + width > WIDTH - PAD) {
      chipX = TEXT_X;
      chipY += 36;
    }
    chipMarkup.push(
      `<rect x="${chipX}" y="${chipY}" width="${width}" height="28" rx="14" fill="${p.fg}" fill-opacity="0.07" stroke="${p.border}"/>` +
        `<text x="${chipX + 14}" y="${chipY + 19}" font-size="13" fill="${p.fg}" fill-opacity="0.85">${xmlEscape(label)}</text>`,
    );
    chipX += width + 8;
  }
  const heroBottom = Math.max(PAD + 14 + AVATAR + 12, chipMarkup.length > 0 ? chipY + 28 : y);
  body.push(rise(chipMarkup.join(''), motion, next()));

  let cursor = heroBottom + SECTION_GAP;

  for (const block of config.blocks) {
    if (block === 'stats') {
      const tiles: Array<[string, number]> = [
        ['Repositories', profile.publicRepos],
        ['Stars', profile.totalStars],
        ['Followers', profile.followers],
        ['Following', profile.following],
      ];
      const width = Math.floor((WIDTH - PAD * 2 - TILE_GAP * 3) / 4);
      const markup = tiles
        .map(([label, value], index) => {
          const x = PAD + index * (width + TILE_GAP);
          return (
            `<rect x="${x}" y="${cursor}" width="${width}" height="84" rx="16" fill="${p.fg}" fill-opacity="0.06" stroke="${p.border}"/>` +
            `<rect x="${x + 18}" y="${cursor}" width="34" height="3" rx="1.5" fill="${accent(c, index)}"/>` +
            `<text x="${x + 18}" y="${cursor + 46}" font-size="30" font-weight="800" fill="${p.fg}">${xmlEscape(formatNumber(value))}</text>` +
            `<text x="${x + 18}" y="${cursor + 68}" font-size="12" letter-spacing="0.6" fill="${p.muted}">${xmlEscape(label.toUpperCase())}</text>`
          );
        })
        .join('');
      body.push(rise(markup, motion, next()));
      cursor += 84 + SECTION_GAP;
    } else if (block === 'activity' && profile.contributions) {
      const activity = profile.contributions;
      const first = new Date(`${activity.days[0]?.date}T00:00:00Z`).getUTCDay(); // weeks start on Sunday
      const top = cursor + 24;
      const cells = activity.days
        .map((day, index) => {
          const slot = first + index;
          const x = PAD + Math.floor(slot / 7) * HEAT_STEP;
          const y = top + (slot % 7) * HEAT_STEP;
          const fill =
            day.level === 0
              ? `fill="${p.track}"`
              : `fill="${accent(c, 0)}" fill-opacity="${HEAT_OPACITY[day.level]}"`;
          return `<rect x="${x}" y="${y}" width="${HEAT_CELL}" height="${HEAT_CELL}" rx="2.5" ${fill}/>`;
        })
        .join('');
      const summaryY = top + 7 * HEAT_STEP + 20;
      const strong = (text: string) => `<tspan fill="${p.fg}" font-weight="700">${xmlEscape(text)}</tspan>`;
      const summary =
        `<text x="${PAD}" y="${summaryY}" font-size="13" fill="${p.muted}" xml:space="preserve">` +
        `${strong(formatNumber(activity.total))} contributions in the past year    ·    ` +
        `current streak ${strong(plural(activity.currentStreak, 'day'))}    ·    ` +
        `longest streak ${strong(plural(activity.longestStreak, 'day'))}</text>`;
      const markup =
        `<text x="${PAD}" y="${cursor + 10}" font-size="12" letter-spacing="1" fill="${p.muted}">ACTIVITY</text>` +
        cells +
        summary;
      body.push(rise(markup, motion, next()));
      cursor += summaryY - cursor + 6 + SECTION_GAP;
    } else if (block === 'languages' && profile.languages.length > 0) {
      const barWidth = WIDTH - PAD * 2;
      const total = profile.languages.reduce((sum, l) => sum + l.percent, 0) || 1;
      let x = PAD;
      const segments = profile.languages
        .map((language, index) => {
          const width = (language.percent / total) * barWidth;
          const rect = `<rect x="${x.toFixed(1)}" y="${cursor + 22}" width="${Math.max(width, 3).toFixed(1)}" height="10" fill="${accent(c, index)}"/>`;
          x += width;
          return rect;
        })
        .join('');
      let legendX = PAD;
      const legend = profile.languages
        .map((language, index) => {
          const label = `${truncate(language.name, 16)} ${language.percent}%`;
          const item =
            `<circle cx="${legendX + 5}" cy="${cursor + 56}" r="5" fill="${accent(c, index)}"/>` +
            `<text x="${legendX + 16}" y="${cursor + 61}" font-size="13" fill="${p.fg}" fill-opacity="0.85">${xmlEscape(label)}</text>`;
          legendX += 16 + Math.ceil(label.length * 7) + 22;
          return item;
        })
        .join('');
      const markup =
        `<text x="${PAD}" y="${cursor + 10}" font-size="12" letter-spacing="1" fill="${p.muted}">LANGUAGES, BY NUMBER OF REPOSITORIES</text>` +
        `<clipPath id="bar"><rect x="${PAD}" y="${cursor + 22}" width="${barWidth}" height="10" rx="5"/></clipPath>` +
        `<rect x="${PAD}" y="${cursor + 22}" width="${barWidth}" height="10" rx="5" fill="${p.track}"/>` +
        `<g clip-path="url(#bar)">${segments}</g>${legend}`;
      body.push(rise(markup, motion, next()));
      cursor += 70 + SECTION_GAP;
    } else if (block === 'projects' && profile.topRepos.length > 0) {
      const repos = profile.topRepos.slice(0, 3);
      const width = Math.floor((WIDTH - PAD * 2 - TILE_GAP * (repos.length - 1)) / repos.length);
      const cards = repos
        .map((repo, index) => {
          const x = PAD + index * (width + TILE_GAP);
          const top = cursor + 22;
          const description = repo.description
            ? wrap(repo.description, Math.max(18, Math.floor((width - 36) / 6.6)), 2)
                .map(
                  (line, i) =>
                    `<text x="${x + 18}" y="${top + 52 + i * 17}" font-size="12.5" fill="${p.muted}">${xmlEscape(line)}</text>`,
                )
                .join('')
            : '';
          const meta = [`★ ${formatNumber(repo.stars)}`, repo.language].filter(Boolean).join('  ·  ');
          return (
            `<rect x="${x}" y="${top}" width="${width}" height="104" rx="16" fill="${p.fg}" fill-opacity="0.06" stroke="${p.border}"/>` +
            `<text x="${x + 18}" y="${top + 30}" font-size="15" font-weight="700" fill="${p.fg}">${xmlEscape(truncate(repo.name, Math.floor((width - 36) / 8.4)))}</text>` +
            description +
            `<text x="${x + 18}" y="${top + 92}" font-size="12.5" font-weight="600" fill="${accent(c, index + 1)}">${xmlEscape(meta)}</text>`
          );
        })
        .join('');
      const markup =
        `<text x="${PAD}" y="${cursor + 10}" font-size="12" letter-spacing="1" fill="${p.muted}">TOP PROJECTS</text>${cards}`;
      body.push(rise(markup, motion, next()));
      cursor += 22 + 104 + SECTION_GAP;
    }
  }

  const height = Math.max(cursor - SECTION_GAP + PAD, heroBottom + PAD);
  const label = `${profile.name ?? profile.login} (@${profile.login}) on GitHub`;
  const glow = variant === 'dark' ? 0.5 : 0.3;

  const css = motion
    ? `.drift{animation:drift 16s ease-in-out infinite alternate}
.d2{animation-duration:21s;animation-direction:alternate-reverse}
.d3{animation-duration:26s}
@keyframes drift{from{transform:translate(0,0)}to{transform:translate(42px,-26px)}}
.rise{animation:rise .7s cubic-bezier(.2,.7,.2,1) both}
@keyframes rise{from{opacity:0;transform:translateY(10px)}}
.ring{animation:pulse 4s ease-in-out infinite}
@keyframes pulse{50%{opacity:.5}}
@media (prefers-reduced-motion:reduce){.drift,.rise,.ring{animation:none}}`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}" role="img" aria-labelledby="t">
<title id="t">${xmlEscape(label)}</title>
<defs>
<clipPath id="card"><rect width="${WIDTH}" height="${height}" rx="22"/></clipPath>
<filter id="blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="64"/></filter>
<linearGradient id="ring" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${accent(c, 0)}"/><stop offset="1" stop-color="${accent(c, 1)}"/></linearGradient>
</defs>
<style>
text{font-family:${FONT_SANS}}
${css}
</style>
<rect width="${WIDTH}" height="${height}" rx="22" fill="${p.bg}"/>
<g clip-path="url(#card)">
<g filter="url(#blur)">
<circle class="drift" cx="150" cy="40" r="190" fill="${accent(c, 0)}" fill-opacity="${glow}"/>
<circle class="drift d2" cx="780" cy="110" r="210" fill="${accent(c, 1)}" fill-opacity="${glow * 0.85}"/>
<circle class="drift d3" cx="470" cy="${height}" r="230" fill="${accent(c, 2)}" fill-opacity="${glow * 0.7}"/>
</g>
<rect width="${WIDTH}" height="${height}" fill="${p.bg}" fill-opacity="0.38"/>
</g>
<rect x="0.5" y="0.5" width="${WIDTH - 1}" height="${height - 1}" rx="22" fill="none" stroke="${p.border}"/>
${body.filter(Boolean).join('\n')}
</svg>
`;
}

export const showcase: Template = {
  id: 'showcase',
  name: 'Showcase',
  description: 'A banner coloured by your own profile picture, with stat tiles, a language bar and top projects.',
  tags: ['image', 'banner', 'colourful', 'animated'],
  needsAvatar: true,
  render(profile, config): Output {
    const assets = variantsFor(config.theme).map((variant) => ({
      path: assetPath('showcase', variant),
      content: renderSvg(profile, config, variant),
    }));
    const alt = describeProfile(profile, config, undefined, { activity: true });
    return { readme: imageReadme(profile, config, 'showcase', WIDTH, alt), assets };
  },
};
