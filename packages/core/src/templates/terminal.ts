import type { Config, Output, Profile, Template } from '../types';
import { palettes, variantsFor, type Palette, type Variant } from '../themes';
import { assetPath, pictureTag, wrapReadme } from '../readme';
import { formatNumber, safeUrl, truncate, xmlEscape } from '../util';

const FONT = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";
const WIDTH = 800;
const PAD = 24;
const TITLE_BAR = 40;
const LINE_HEIGHT = 24;
const FONT_SIZE = 14;
const MAX_CHARS = 84;
const LABEL_WIDTH = 12;
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
    } else if (block === 'languages' && profile.languages.length > 0) {
      lines.push({ kind: 'blank' }, { kind: 'prompt', command: 'languages' });
      for (const language of profile.languages) {
        lines.push({ kind: 'bar', name: language.name, percent: language.percent });
      }
    } else if (block === 'projects' && profile.topRepos.length > 0) {
      lines.push({ kind: 'blank' }, { kind: 'prompt', command: 'projects --top' });
      for (const repo of profile.topRepos) {
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
      const head = `★ ${formatNumber(line.stars)}`.padEnd(7) + line.name;
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

  const css = config.motion
    ? `.ln{animation:in .01s steps(1) both}
@keyframes in{from{opacity:0}to{opacity:1}}
.cursor{animation:blink 1.1s steps(1) infinite}
@keyframes blink{50%{opacity:0}}
@media (prefers-reduced-motion:reduce){.ln,.cursor{animation:none}}`
    : '';

  const body = lines
    .map((line, index) => {
      const y = TITLE_BAR + PAD + (index + 1) * LINE_HEIGHT - 7;
      const markup = renderLine(line, y, p, profile.login);
      if (!markup || !config.motion) return markup;
      return `<g class="ln" style="animation-delay:${(index * STEP_SECONDS).toFixed(2)}s">${markup}</g>`;
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

/** Alt text for the image. It only mentions what the image actually shows. */
function describe(profile: Profile, config: Config): string {
  const parts = [`${profile.name ?? profile.login} on GitHub`];
  if (config.blocks.includes('stats')) {
    parts.push(
      `${formatNumber(profile.publicRepos)} repositories`,
      `${formatNumber(profile.totalStars)} stars`,
      `${formatNumber(profile.followers)} followers`,
    );
  }
  const languages = profile.languages.slice(0, 3).map((l) => l.name);
  if (config.blocks.includes('languages') && languages.length > 0) parts.push(`mostly ${languages.join(', ')}`);
  return parts.join(', ');
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

    const body = [`<div align="center">\n${pictureTag('terminal', config.theme, describe(profile, config), WIDTH)}\n</div>`];
    const website = safeUrl(profile.website);
    const links = [`[GitHub](<${profile.url}>)`];
    if (website) links.push(`[Website](<${website}>)`);
    body.push(`<div align="center">\n\n${links.join(' · ')}\n\n</div>`);

    return { readme: wrapReadme(body.join('\n\n'), config), assets };
  },
};
