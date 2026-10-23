import { CREDIT_TEXT, CREDIT_WIDTH } from './credit';
import type { Config, ThemeMode } from './types';
import { xmlEscape } from './util';

export const REPO_URL = 'https://github.com/illusive7ai/livebio';
export const AUTHOR = 'illusivehacks';
export const AUTHOR_URL = 'https://github.com/illusive7ai';

/** Folder in the profile repository that holds generated images. */
export const ASSET_DIR = 'livebio';

export const MARKER_START = '<!-- livebio:start -->';
export const MARKER_END = '<!-- livebio:end -->';

/**
 * The credit line, "livebio by illusivehacks", as a small glitching image that links to the project. It is an
 * image because a profile README cannot run CSS. The words are also in its alt text.
 */
export function creditFooter(theme: ThemeMode = 'auto'): string {
  return ['<div align="center">', `<a href="${REPO_URL}">`, pictureTag('credit', theme, CREDIT_TEXT, CREDIT_WIDTH), '</a>', '</div>'].join('\n');
}

/** Wraps generated Markdown in markers so later runs only replace this block. */
export function wrapReadme(body: string, config: Config): string {
  const parts = [MARKER_START, body.trim()];
  if (config.credit) parts.push(creditFooter(config.theme));
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

/**
 * Adds more blocks to a generated README, after the template's own content and before the credit line,
 * so the credit stays at the very end.
 */
export function insertBlocks(readme: string, blocks: string[], theme: ThemeMode = 'auto'): string {
  if (blocks.length === 0) return readme;
  const extra = blocks.join('\n\n');
  const credit = creditFooter(theme);
  const at = readme.indexOf(credit);
  if (at !== -1) return `${readme.slice(0, at)}${extra}\n\n${readme.slice(at)}`;
  const end = readme.lastIndexOf(MARKER_END);
  if (end !== -1) return `${readme.slice(0, end)}${extra}\n\n${readme.slice(end)}`;
  return `${readme.trimEnd()}\n\n${extra}\n`;
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

/**
 * Image files left over from an earlier run: the .svg files directly inside the livebio folder that this run did
 * not write. Changing design, theme or switches changes which files are needed, and without this the old ones
 * would pile up in a person's repository. Nothing outside that folder, and nothing that is not an .svg, is ever
 * named here, so a file someone put there for another reason is safe.
 */
export function staleAssets(existing: ReadonlyArray<string>, written: ReadonlyArray<string>): string[] {
  const keep = new Set(written.map((path) => path.replace(/\\/g, '/')));
  const inFolder = new RegExp(`^${ASSET_DIR}/[^/]+\\.svg$`);
  return existing.map((path) => path.replace(/\\/g, '/')).filter((path) => inFolder.test(path) && !keep.has(path));
}
