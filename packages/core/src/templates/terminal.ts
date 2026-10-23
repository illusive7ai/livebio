import type { Config, Output, Profile, Template } from '../types';
import { palettes, variantsFor, type Palette, type Variant } from '../themes';
import { assetPath } from '../readme';
import { formatNumber, safeUrl, truncate, xmlEscape } from '../util';
import { FONT, describeProfile, imageReadme, motionCss, plural, stagger } from './shared';

const WIDTH = 800;
const PAD = 24;
const TITLE_BAR = 40;
const LINE_HEIGHT = 24;
const FONT_SIZE = 14;
const MAX_CHARS = 84;
const LABEL_WIDTH = 12;
/** Wide enough for "★ 999,999" plus two spaces, so project names always start in one column. */
const STAR_COLUMN = 11;
const BAR_CELLS = 24;
const STEP_SECONDS = 0.15;

type Line =
  | { kind: 'prompt'; command: string; cursor?: boolean }
  | { kind: 'text'; text: string; tone: 'strong' | 'accent' | 'muted' }
  | { kind: 'stat'; label: string; value: string }
  | { kind: 'bar'; name: string; percent: number }
  | { kind: 'repo'; stars: number; name: string; description: string | null }
  | { kind: 'blank' };

function buildLines(profile: Profile, config: Config): Line[] {
  const lines: Line[] = [
    { kind: 'prompt', command: 'whoami' },
    { kind: 'text', text: profile.name ?? profile.login, tone: 'strong' },
  ];

  if (config.text.headline) lines.push({ kind: 'text', text: config.text.headline, tone: 'accent' });

  const bio = config.text.bio ?? profile.bio;
  if (bio) lines.push({ kind: 'text', text: bio, tone: 'muted' });

  const website = safeUrl(profile.website);
  const meta = [profile.company, profile.location, website?.replace(/^https?:\/\//, '').replace(/\/$/, '')].filter(
    (part): part is string => Boolean(part),
  );
  if (meta.length > 0) lines.push({ kind: 'text', text: meta.join(' · '), tone: 'muted' });

  for (const block of config.blocks) {
    if (block === 'stats') {
      lines.push({ kind: 'blank' }, { kind: 'prompt', command: 'stats' });
      lines.push({ kind: 'stat', label: 'repos', value: formatNumber(profile.publicRepos) });
      lines.push({ kind: 'stat', label: 'stars', value: formatNumber(profile.totalStars) });
      lines.push({ kind: 'stat', label: 'followers', value: formatNumber(profile.followers) });
      lines.push({ kind: 'stat', label: 'following', value: formatNumber(profile.following) });
    } else if (block === 'activity' && profile.contributions) {
      const activity = profile.contributions;
      lines.push({ kind: 'blank' }, { kind: 'prompt', command: 'streak' });
      lines.push({ kind: 'stat', label: 'current', value: plural(activity.currentStreak, 'day') });
      lines.push({ kind: 'stat', label: 'longest', value: plural(activity.longestStreak, 'day') });
      lines.push({ kind: 'stat', label: 'past year', value: `${formatNumber(activity.total)} contributions` });
    } else if (block === 'languages' && profile.languages.length > 0) {
      lines.push({ kind: 'blank' }, { kind: 'prompt', command: 'languages' });
      for (const language of profile.languages) {
        lines.push({ kind: 'bar', name: language.name, percent: language.percent });
      }
    } else if (block === 'projects' && profile.topRepos.length > 0) {
      lines.push({ kind: 'blank' }, { kind: 'prompt', command: 'projects --top' });
      for (const repo of profile.topRepos.slice(0, 4)) {
        lines.push({ kind: 'repo', stars: repo.stars, name: repo.name, description: repo.description });
      }
    }
  }

  lines.push({ kind: 'blank' }, { kind: 'prompt', command: '', cursor: true });
  return lines;
}

function renderLine(line: Line, y: number, p: Palette, login: string): string {
  const base = `x="${PAD}" y="${y}" xml:space="preserve"`;
  switch (line.kind) {
    case 'blank':
      return '';
    case 'prompt': {
      const prompt =
        `<tspan fill="${p.accent}">${xmlEscape(login)}@github</tspan>` +
        `<tspan fill="${p.muted}">:~$</tspan>`;
      const command = line.command ? ` ${xmlEscape(line.command)}` : ' ';
      const cursor = line.cursor ? `<tspan class="cursor" fill="${p.fg}">▌</tspan>` : '';
      return `<text ${base} fill="${p.fg}">${prompt}${command}${cursor}</text>`;
    }
    case 'text': {
      const fill = line.tone === 'strong' ? p.fg : line.tone === 'accent' ? p.accent2 : p.muted;
      const weight = line.tone === 'strong' ? ' font-weight="700"' : '';
      return `<text ${base} fill="${fill}"${weight}>${xmlEscape(truncate(line.text, MAX_CHARS))}</text>`;
    }
    case 'stat':
      return (
        `<text ${base} fill="${p.muted}">${xmlEscape(line.label.padEnd(LABEL_WIDTH))}` +
        `<tspan fill="${p.fg}" font-weight="700">${xmlEscape(line.value)}</tspan></text>`
      );
    case 'bar': {
      const filled = Math.round((line.percent / 100) * BAR_CELLS);
      const bar = '█'.repeat(filled);
      const rest = '░'.repeat(BAR_CELLS - filled);
      return (
        `<text ${base} fill="${p.fg}">${xmlEscape(truncate(line.name, LABEL_WIDTH - 1).padEnd(LABEL_WIDTH))}` +
        `<tspan fill="${p.accent}">${bar}</tspan><tspan fill="${p.track}">${rest}</tspan>` +
        `<tspan fill="${p.muted}"> ${line.percent}%</tspan></text>`
      );
    }
    case 'repo': {
      const head = `★ ${formatNumber(line.stars)}`.padEnd(STAR_COLUMN) + line.name;
      const room = Math.max(0, MAX_CHARS - head.length - 3);
      const tail = line.description && room > 10 ? ` — ${truncate(line.description, room)}` : '';
      return (
        `<text ${base} fill="${p.fg}"><tspan fill="${p.accent2}">${xmlEscape(head)}</tspan>` +
        `<tspan fill="${p.muted}">${xmlEscape(tail)}</tspan></text>`
      );
    }
  }
}

function renderSvg(profile: Profile, config: Config, variant: Variant): string {
  const p = palettes[variant];
  const lines = buildLines(profile, config);
  const height = TITLE_BAR + PAD * 2 + lines.length * LINE_HEIGHT;
  const label = `${profile.name ?? profile.login} (@${profile.login}) on GitHub`;

  const css = motionCss(config.motion);

  const body = lines
    .map((line, index) => {
      const y = TITLE_BAR + PAD + (index + 1) * LINE_HEIGHT - 7;
      return stagger(renderLine(line, y, p, profile.login), config.motion, index * STEP_SECONDS);
    })
    .filter(Boolean)
    .join('\n');

  const w = WIDTH;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${height}" viewBox="0 0 ${w} ${height}" role="img" aria-labelledby="t">
<title id="t">${xmlEscape(label)}</title>
<style>
text{font-family:${FONT};font-size:${FONT_SIZE}px}
${css}
</style>
<rect x="0.5" y="0.5" width="${w - 1}" height="${height - 1}" rx="10" fill="${p.bg}" stroke="${p.border}"/>
<path d="M1 ${TITLE_BAR}V11a10 10 0 0 1 10-10h${w - 22}a10 10 0 0 1 10 10v${TITLE_BAR - 11}z" fill="${p.panel}"/>
<line x1="1" y1="${TITLE_BAR}" x2="${w - 1}" y2="${TITLE_BAR}" stroke="${p.border}"/>
<circle cx="24" cy="20" r="6" fill="#ff5f56"/><circle cx="44" cy="20" r="6" fill="#ffbd2e"/><circle cx="64" cy="20" r="6" fill="#27c93f"/>
<text x="${w / 2}" y="25" text-anchor="middle" fill="${p.muted}">${xmlEscape(profile.login)}@github: ~</text>
${body}
</svg>
`;
}

export const terminal: Template = {
  id: 'terminal',
  name: 'Terminal',
  description: 'A terminal window that types out your profile line by line.',
  tags: ['dark', 'terminal', 'animated'],
  render(profile, config): Output {
    const assets = variantsFor(config.theme).map((variant) => ({
      path: assetPath('terminal', variant),
      content: renderSvg(profile, config, variant),
    }));

    const alt = describeProfile(profile, config, undefined, { activity: true });
    return { readme: imageReadme(profile, config, 'terminal', WIDTH, alt), assets };
  },
};
