import { parseConfig } from './config';
import { BLOCK_IDS, type Asset, type Config } from './types';
import { isValidUsername, xmlEscape } from './util';

/**
 * Hosted images: instead of files in the person's repository, the README points at URLs on a livebio server,
 * which draws each picture on request from live GitHub data. The settings that shape the picture travel in the
 * URL, so a README that is only copied and pasted still works, and its pictures stay current.
 *
 *   {base}/u/{login}/{name}.svg?t=showcase&b=stats,city&m=0   one picture of a design
 *   {base}/credit-{dark|light}.svg                            the credit line, the same for everyone
 */

const CARD = /^\/u\/([A-Za-z0-9-]{1,39})\/([a-z0-9-]{1,80})\.svg$/;
const NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*-(?:dark|light)$/;

/** The server's address without a trailing slash. Throws for anything that is not an http or https address. */
export function normaliseBase(base: string): string {
  const url = new URL(base);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('The server address must be http or https.');
  return `${url.origin}${url.pathname.replace(/\/+$/, '')}`;
}

/**
 * The settings that differ from the defaults, as URL parameters in a fixed order. The same settings always give
 * the same URL, so a picture can be cached. The theme is not here: each picture is the dark or the light one,
 * named in the path.
 */
export function configToParams(config: Config): URLSearchParams {
  const params = new URLSearchParams();
  params.set('t', config.template);
  if (BLOCK_IDS.some((block) => !config.blocks.includes(block)) || config.blocks.length !== BLOCK_IDS.length) {
    params.set('b', config.blocks.join(','));
  }
  if (!config.motion) params.set('m', '0');
  if (!config.credit) params.set('c', '0');
  if (config.text.headline) params.set('h', config.text.headline);
  if (config.text.bio) params.set('bio', config.text.bio);
  if (config.custom?.hue !== undefined) params.set('hue', String(config.custom.hue));
  if (config.custom?.look) params.set('look', config.custom.look);
  if (config.custom?.companion) params.set('game', config.custom.companion);
  if (config.custom?.font) params.set('font', config.custom.font);
  if (config.custom?.textColor) params.set('tc', config.custom.textColor.slice(1));
  if (config.custom?.textSize !== undefined) params.set('ts', String(config.custom.textSize));
  if (config.custom?.timelapse) params.set('tl', '1');
  return params;
}

/** The inverse of configToParams, with the same checks as a livebio.yml. Throws a ConfigError for anything invalid. */
export function configFromParams(login: string, params: URLSearchParams): Config {
  const raw: Record<string, unknown> = { username: login, template: params.get('t') ?? 'showcase', theme: 'auto' };
  if (params.get('m') === '0') raw.motion = false;
  if (params.get('c') === '0') raw.credit = false;
  if (params.has('b')) raw.blocks = (params.get('b') ?? '').split(',').filter(Boolean);

  const text: Record<string, string> = {};
  if (params.has('h')) text.headline = params.get('h') ?? '';
  if (params.has('bio')) text.bio = params.get('bio') ?? '';
  if (Object.keys(text).length > 0) raw.text = text;

  const custom: Record<string, unknown> = {};
  if (params.has('hue')) custom.hue = Number(params.get('hue'));
  if (params.has('look')) custom.look = params.get('look');
  if (params.has('game')) custom.companion = params.get('game');
  if (params.has('font')) custom.font = params.get('font');
  if (params.has('tc')) custom.textColor = `#${params.get('tc')}`;
  if (params.has('ts')) custom.textSize = Number(params.get('ts'));
  if (params.get('tl') === '1') custom.timelapse = true;
  if (Object.keys(custom).length > 0) raw.custom = custom;
  return parseConfig(raw);
}

/** Which picture a request is for, from its path, or null when the path is not one of ours. */
export function parseCardPath(pathname: string): { login: string; name: string } | null {
  const match = CARD.exec(pathname);
  if (!match) return null;
  const [, login, name] = match as unknown as [string, string, string];
  return isValidUsername(login) && NAME.test(name) ? { login, name } : null;
}

/** A picture's file name without its folder and extension: "livebio/showcase-dark.svg" is "showcase-dark". */
export function assetName(path: string): string {
  return path.replace(/^livebio\//, '').replace(/\.svg$/, '');
}

export function cardUrl(base: string, login: string, name: string, config: Config): string {
  return `${normaliseBase(base)}/u/${login}/${name}.svg?${configToParams(config).toString()}`;
}

export function creditUrl(base: string, name: string, config: Config): string {
  return `${normaliseBase(base)}/${name}.svg${config.motion ? '' : '?m=0'}`;
}

/**
 * Rewrites a generated README so that each picture is a hosted address instead of a file in the repository.
 * Everything else in the README is left exactly as it was.
 */
export function hostedReadme(readme: string, assets: ReadonlyArray<Asset>, login: string, config: Config, base: string): string {
  let out = readme;
  for (const asset of assets) {
    const name = assetName(asset.path);
    const url = name.startsWith('credit-') ? creditUrl(base, name, config) : cardUrl(base, login, name, config);
    // The address goes inside an HTML attribute, so its ampersands are written as entities.
    out = out.split(asset.path).join(xmlEscape(url));
  }
  return out;
}
