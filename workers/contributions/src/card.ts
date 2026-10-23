import { ConfigError, needsContributions } from '@livebio/core/src/config';
import { creditSvg } from '@livebio/core/src/credit';
import { GitHubError } from '@livebio/core/src/github';
import { assetName, configFromParams, parseCardPath } from '@livebio/core/src/hosted';
import { renderProfile } from '@livebio/core/src/render';
import { getTemplate } from '@livebio/core/src/templates';
import { xmlEscape } from '@livebio/core/src/util';
import { loadAvatarCached, loadData } from './data';
import type { Deps, Env } from './handler';

/**
 * Draws a person's pictures on request. A README that points here shows live data, and its pictures stay current
 * without anything being stored in the person's repository: the only thing kept is a one-hour copy of public data.
 */

/** How long a finished picture is cached, by this server and by GitHub's image proxy. */
const CARD_TTL = 3600;
const CREDIT_TTL = 86_400;
const ERROR_TTL = 60;
const MAX_QUERY = 1500;

const IMAGE_HEADERS: Record<string, string> = {
  'Content-Type': 'image/svg+xml; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
  // If anyone opens the address directly, nothing in it can run or load anything.
  'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; img-src data:",
  'Access-Control-Allow-Origin': '*',
};

function svgResponse(svg: string, maxAge: number, extra: Record<string, string> = {}): Response {
  return new Response(svg, { headers: { ...IMAGE_HEADERS, 'Cache-Control': `public, max-age=${maxAge}`, ...extra } });
}

/**
 * A small picture that says what went wrong. It is an image with a normal status, because a README image that
 * answers with an error status shows as a broken icon, and the person reading it learns nothing.
 */
export function errorSvg(message: string): string {
  const text = xmlEscape(message);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="72" viewBox="0 0 900 72" role="img" aria-labelledby="t">
<title id="t">${text}</title>
<style>.b{fill:#f6f8fa;stroke:#d1d9e0}.t{fill:#59636e;font:14px ui-monospace,Menlo,Consolas,monospace}.h{fill:#cf222e;font:700 12px ui-monospace,Menlo,Consolas,monospace;letter-spacing:2px}@media (prefers-color-scheme:dark){.b{fill:#161b22;stroke:#30363d}.t{fill:#9198a1}.h{fill:#ff7b72}}</style>
<rect class="b" x="0.5" y="0.5" width="899" height="71" rx="12"/>
<text class="h" x="24" y="29">LIVEBIO</text>
<text class="t" x="24" y="50">${text}</text>
</svg>
`;
}

const problem = (message: string): Response => svgResponse(errorSvg(message), ERROR_TTL);

/** Serves GET /u/{login}/{picture}.svg?{settings}. */
export async function serveCard(request: Request, env: Env, deps: Deps): Promise<Response> {
  const url = new URL(request.url);
  if (url.search.length > MAX_QUERY) return problem('That address is too long.');
  const card = parseCardPath(url.pathname);
  if (!card) return problem('That picture address is not valid.');
  if (!env.GITHUB_TOKEN) return problem('The picture service is not set up yet.');

  let config;
  try {
    config = configFromParams(card.login, url.searchParams);
  } catch (error) {
    return problem(error instanceof ConfigError ? error.message : 'Those settings are not valid.');
  }

  // An unknown design is refused before anything is fetched, so it costs no GitHub calls.
  if (!getTemplate(config.template)) return problem(`There is no design called "${config.template}".`);

  // A finished picture is kept for an hour, so a busy profile costs one render an hour.
  const key = new Request(`https://livebio.invalid/card${url.pathname}${url.search}`);
  const cached = await deps.cache?.match(key);
  if (cached) return new Response(cached.body, { headers: { ...IMAGE_HEADERS, 'Cache-Control': `public, max-age=${CARD_TTL}`, 'X-Livebio-Cache': 'HIT' } });

  let svg: string;
  try {
    const { profile, contributions } = await loadData(card.login, env, deps);
    const avatar = await loadAvatarCached(card.login, profile.avatarUrl, deps);
    const wanted = needsContributions(config) ? contributions : null;
    const output = renderProfile({ ...profile, ...(avatar ? { avatar } : {}), ...(wanted ? { contributions: wanted } : {}) }, config);
    const asset = output.assets.find((a) => assetName(a.path) === card.name);
    if (!asset) return problem('That design does not have this picture.');
    svg = asset.content;
  } catch (error) {
    if (error instanceof GitHubError) {
      console.error(`livebio: card ${error.kind}: ${error.message}`);
      if (error.kind === 'not-found') return problem(`There is no GitHub user called ${card.login}.`);
      if (error.kind === 'rate-limit') return problem('livebio is busy right now. Reload in a minute.');
    } else {
      console.error(`livebio: card failed: ${(error as Error).message}`);
    }
    return problem('livebio could not draw this picture right now. Reload in a minute.');
  }

  if (deps.cache) {
    const write = deps.cache.put(key, new Response(svg, { headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': `public, max-age=${CARD_TTL}` } }));
    if (deps.waitUntil) deps.waitUntil(write);
    else void write;
  }
  return svgResponse(svg, CARD_TTL, { 'X-Livebio-Cache': 'MISS' });
}

/** Serves GET /credit-{dark|light}.svg: the same for everyone, so it needs no data and is kept for a day. */
export function serveCredit(url: URL): Response {
  const variant = /^\/credit-(dark|light)\.svg$/.exec(url.pathname)?.[1] as 'dark' | 'light' | undefined;
  if (!variant) return problem('That picture address is not valid.');
  return svgResponse(creditSvg(variant, url.searchParams.get('m') !== '0'), CREDIT_TTL);
}
