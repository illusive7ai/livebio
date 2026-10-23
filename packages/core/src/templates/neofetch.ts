import { asciiPortrait } from '../avatar';
import { assetPath } from '../readme';
import { palettes, variantsFor, type Palette, type Variant } from '../themes';
import type { Config, Output, Profile, Template } from '../types';
import { formatNumber, safeUrl, truncate, wrap, xmlEscape } from '../util';
import { FONT, describeProfile, imageReadme, motionCss, stagger } from './shared';

const WIDTH = 900;
const PAD = 28;
const TOP = 70;

const ART_COLS = 56;
const ART_SIZE = 10;
const ART_LINE = 10;
/** Space reserved for the portrait: monospace fonts are at most about 0.62em wide. */
const ART_WIDTH = Math.ceil(ART_COLS * ART_SIZE * 0.62);
const GAP = 36;

const INFO_SIZE = 13;
const INFO_LINE = 21;
const LABEL_WIDTH = 11;
const VALUE_MAX = 44;
const CHAR_WIDTH = 7.9;

const ART_STEP = 0.025;
const INFO_STEP = 0.11;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** The eight swatches neofetch prints under its output. They are decoration, not data. */
const SWATCHES: Record<Variant, string[]> = {
  dark: ['#f85149', '#e3b341', '#3fb950', '#58a6ff', '#bc8cff', '#39c5cf', '#e6edf3', '#9198a1'],
  light: ['#cf222e', '#9a6700', '#1a7f37', '#0969da', '#8250df', '#1b7c83', '#1f2328', '#59636e'],
};

type Info =
  | { kind: 'title' }
  | { kind: 'field'; label: string; value: string }
  | { kind: 'blank' };

function joined(createdAt: string): string | null {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return null;
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

function infoLines(profile: Profile, config: Config): Info[] {
  const lines: Info[] = [{ kind: 'title' }, { kind: 'blank' }];
  const field = (label: string, value: string | null | undefined) => {
    if (value) lines.push({ kind: 'field', label, value: truncate(value, VALUE_MAX) });
  };
  const gap = () => {
    if (lines.length > 2 && lines[lines.length - 1]?.kind !== 'blank') lines.push({ kind: 'blank' });
  };

  field('Name', profile.name);
  field('Role', config.text.headline);
  const bio = config.text.bio ?? profile.bio;
  if (bio) {
    wrap(bio, VALUE_MAX, 3).forEach((part, index) => {
      lines.push({ kind: 'field', label: index === 0 ? 'About' : '', value: part });
    });
  }
  field('Company', profile.company);
  field('Location', profile.location);
  field('Website', safeUrl(profile.website)?.replace(/^https?:\/\//, '').replace(/\/$/, ''));
  field('Joined', joined(profile.createdAt));

  for (const block of config.blocks) {
    if (block === 'stats') {
      gap();
      field('Repos', formatNumber(profile.publicRepos));
      field('Stars', formatNumber(profile.totalStars));
      field('Followers', formatNumber(profile.followers));
      field('Following', formatNumber(profile.following));
    } else if (block === 'languages' && profile.languages.length > 0) {
      gap();
      field('Languages', profile.languages.slice(0, 3).map((l) => l.name).join(', '));
    } else if (block === 'projects' && profile.topRepos.length > 0) {
      gap();
      profile.topRepos.slice(0, 2).forEach((repo, index) => {
        field(index === 0 ? 'Projects' : '', `★ ${formatNumber(repo.stars)}  ${repo.name}`);
      });
    }
  }

  while (lines[lines.length - 1]?.kind === 'blank') lines.pop();
  return lines;
}

function renderInfo(line: Info, y: number, x: number, p: Palette, login: string): string {
  const base = `x="${x}" y="${y}" xml:space="preserve"`;
  switch (line.kind) {
    case 'blank':
      return '';
    case 'title': {
      const ruleWidth = Math.round((login.length + 7) * CHAR_WIDTH);
      return (
        `<text ${base} fill="${p.accent}" font-weight="700">${xmlEscape(login)}<tspan fill="${p.muted}">@</tspan>github</text>` +
        `<rect x="${x}" y="${y + 8}" width="${ruleWidth}" height="1" fill="${p.border}"/>`
      );
    }
    case 'field':
      return (
        `<text ${base} fill="${p.accent2}" font-weight="700">${xmlEscape(line.label.padEnd(LABEL_WIDTH))}` +
        `<tspan fill="${p.fg}" font-weight="400">${xmlEscape(line.value)}</tspan></text>`
      );
  }
}

function renderSvg(profile: Profile, config: Config, variant: Variant): string {
  const p = palettes[variant];
  const art = profile.avatar ? asciiPortrait(profile.avatar.grid, ART_COLS, variant) : [];
  const info = infoLines(profile, config);

  const infoX = art.length > 0 ? PAD + ART_WIDTH + GAP : PAD;
  const infoHeight = info.length * INFO_LINE;
  const swatchY = TOP + infoHeight + 14;
  const contentHeight = Math.max(art.length * ART_LINE, infoHeight + 14 + 16);
  const height = TOP + contentHeight + PAD;
  const label = `${profile.name ?? profile.login} (@${profile.login}) on GitHub`;
  const motion = config.motion;

  const prompt = stagger(
    `<text x="${PAD}" y="42" xml:space="preserve" fill="${p.fg}"><tspan fill="${p.accent}">${xmlEscape(profile.login)}@github</tspan>` +
      `<tspan fill="${p.muted}">:~$</tspan> neofetch</text>`,
    motion,
    0,
  );

  const portrait = art
    .map((row, index) => {
      if (!row) return '';
      const y = TOP + (index + 1) * ART_LINE - 2;
      return stagger(
        `<text class="art" x="${PAD}" y="${y}" xml:space="preserve" fill="url(#art)">${xmlEscape(row)}</text>`,
        motion,
        0.3 + index * ART_STEP,
      );
    })
    .filter(Boolean)
    .join('\n');

  const details = info
    .map((line, index) => {
      const y = TOP + (index + 1) * INFO_LINE - 6;
      return stagger(renderInfo(line, y, infoX, p, profile.login), motion, 0.3 + index * INFO_STEP);
    })
    .filter(Boolean)
    .join('\n');

  const swatches = SWATCHES[variant]
    .map((color, index) => `<rect x="${infoX + index * 28}" y="${swatchY}" width="24" height="14" rx="3" fill="${color}"/>`)
    .join('');
  const swatchRow = stagger(swatches, motion, 0.3 + info.length * INFO_STEP);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}" role="img" aria-labelledby="t">
<title id="t">${xmlEscape(label)}</title>
<defs>
<linearGradient id="art" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" stop-color="${p.accent2}"/><stop offset="1" stop-color="${p.accent}"/></linearGradient>
<linearGradient id="edge" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${p.accent}"/><stop offset="1" stop-color="${p.accent2}"/></linearGradient>
<radialGradient id="glow" cx="0.12" cy="0.1" r="0.9"><stop offset="0" stop-color="${p.accent}" stop-opacity="${variant === 'dark' ? 0.16 : 0.1}"/><stop offset="1" stop-color="${p.accent}" stop-opacity="0"/></radialGradient>
</defs>
<style>
text{font-family:${FONT};font-size:${INFO_SIZE}px}
.art{font-size:${ART_SIZE}px;font-weight:700}
${motionCss(motion)}
</style>
<rect x="0.5" y="0.5" width="${WIDTH - 1}" height="${height - 1}" rx="14" fill="${p.bg}" stroke="${p.border}"/>
<rect x="0.5" y="0.5" width="${WIDTH - 1}" height="${height - 1}" rx="14" fill="url(#glow)"/>
<rect x="14" y="1" width="${WIDTH - 28}" height="2" rx="1" fill="url(#edge)"/>
${prompt}
${portrait}
${details}
${swatchRow}
</svg>
`;
}

export const neofetch: Template = {
  id: 'neofetch',
  name: 'Neofetch',
  description: 'Your profile picture as ASCII art beside a system-info style summary.',
  tags: ['dark', 'terminal', 'ascii', 'portrait', 'animated'],
  needsAvatar: true,
  render(profile, config): Output {
    const assets = variantsFor(config.theme).map((variant) => ({
      path: assetPath('neofetch', variant),
      content: renderSvg(profile, config, variant),
    }));
    const extra = profile.avatar ? 'with an ASCII portrait of the profile picture' : undefined;
    const alt = describeProfile(profile, config, extra);
    return { readme: imageReadme(profile, config, 'neofetch', WIDTH, alt), assets };
  },
};
