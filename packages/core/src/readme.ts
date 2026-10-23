import type { Config, ThemeMode } from './types';
import { xmlEscape } from './util';

export const REPO_URL = 'https://github.com/illusive7ai/livebio';
export const AUTHOR = 'illusivehacks';
export const AUTHOR_URL = 'https://github.com/illusive7ai';

/** Folder in the profile repository that holds generated images. */
export const ASSET_DIR = 'livebio';

export const MARKER_START = '<!-- livebio:start -->';
export const MARKER_END = '<!-- livebio:end -->';

export function creditFooter(): string {
  return [
    '<div align="center">',
    `<sub>Made with <a href="${REPO_URL}">livebio</a> by <a href="${AUTHOR_URL}">${AUTHOR}</a></sub>`,
    '</div>',
  ].join('\n');
}

/** Wraps generated Markdown in markers so later runs only replace this block. */
export function wrapReadme(body: string, config: Config): string {
  const parts = [MARKER_START, body.trim()];
  if (config.credit) parts.push(creditFooter());
  parts.push(MARKER_END);
  return `${parts.join('\n\n')}\n`;
}

/**
 * Puts a generated block into an existing README. If the README already has livebio
 * markers only that block is replaced; otherwise the generated README is used as is.
 */
export function applyToReadme(existing: string | null, generated: string): string {
  if (existing) {
    const start = existing.indexOf(MARKER_START);
    const end = existing.indexOf(MARKER_END);
    if (start !== -1 && end > start) {
      const block = generated.trim();
      return `${existing.slice(0, start)}${block}${existing.slice(end + MARKER_END.length)}`;
    }
  }
  return generated;
}

export function assetPath(base: string, variant: 'dark' | 'light'): string {
  return `${ASSET_DIR}/${base}-${variant}.svg`;
}

/** An image that follows the viewer's GitHub theme when the theme is "auto". */
export function pictureTag(base: string, theme: ThemeMode, alt: string, width: number): string {
  const altText = xmlEscape(alt);
  if (theme === 'auto') {
    return [
      '<picture>',
      `  <source media="(prefers-color-scheme: dark)" srcset="${assetPath(base, 'dark')}">`,
      `  <img alt="${altText}" src="${assetPath(base, 'light')}" width="${width}">`,
      '</picture>',
    ].join('\n');
  }
  return `<img alt="${altText}" src="${assetPath(base, theme)}" width="${width}">`;
}
