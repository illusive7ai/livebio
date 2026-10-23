import { fetchContributions } from '@livebio/core/src/contributions';
import { GitHubError } from '@livebio/core/src/github';
import { isValidUsername } from '@livebio/core/src/util';
import { serveCard, serveCredit } from './card';
import { DEFAULT_REPO, fetchReviews } from './reviews';

export interface Env {
  /** Read-only GitHub token. Set as a secret, never in wrangler.toml. */
  GITHUB_TOKEN?: string;
  /** Comma-separated list of origins whose pages may read the data. */
  ALLOWED_ORIGINS?: string;
  /** The repository whose issues hold the reviews, as owner/name. */
  REVIEWS_REPO?: string;
}

/** The part of the Workers Cache API this handler uses. */
export interface CacheLike {
  match(request: Request): Promise<Response | undefined>;
  put(request: Request, response: Response): Promise<void>;
}

export interface Deps {
  fetch?: typeof fetch;
  cache?: CacheLike;
  waitUntil?: (promise: Promise<unknown>) => void;
}

const FOUND_TTL = 3600;
const REVIEWS_TTL = 600;
const MISSING_TTL = 600;
const DEFAULT_RETRY = 60;

function corsHeaders(origin: string | null, env: Env): Record<string, string> {
  const allowed = (env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  const headers: Record<string, string> = { Vary: 'Origin' };
  if (origin && allowed.includes(origin)) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}

function respond(body: unknown, status: number, extra: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...extra },
  });
}

/** Adds this request's CORS headers. Cached copies never carry them, because they depend on the caller. */
function withCors(response: Response, cors: Record<string, string>, cache: 'HIT' | 'MISS'): Response {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(cors)) headers.set(name, value);
  headers.set('X-Livebio-Cache', cache);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function failure(error: unknown, cors: Record<string, string>): Response {
  const noStore = { ...cors, 'Cache-Control': 'no-store' };
  if (error instanceof GitHubError) {
    // For whoever runs the service: the kind and message only. Never the token, never the username.
    console.error(`livebio: ${error.kind}: ${error.message}`);
    switch (error.kind) {
      case 'rate-limit': {
        const wait = error.resetAt ? Math.ceil((error.resetAt.getTime() - Date.now()) / 1000) : DEFAULT_RETRY;
        const retry = String(Math.min(3600, Math.max(1, wait)));
        return respond({ error: 'The service is busy. Try again shortly.' }, 503, { ...noStore, 'Retry-After': retry });
      }
      case 'network':
        return respond({ error: 'Could not reach GitHub.' }, 502, noStore);
      case 'unauthorized':
        // A bad or expired token is our problem, not the caller's, and details stay out of the reply.
        return respond({ error: 'The service is not configured correctly.' }, 500, noStore);
      default:
        return respond({ error: 'GitHub returned something unexpected.' }, 502, noStore);
    }
  }
  return respond({ error: 'Something went wrong.' }, 500, noStore);
}

/** Serves GET /reviews: the approved reviews from the repository's issues, cached for ten minutes. */
async function serveReviews(env: Env, deps: Deps, cors: Record<string, string>): Promise<Response> {
  const noStore = { ...cors, 'Cache-Control': 'no-store' };
  if (!env.GITHUB_TOKEN) return respond({ error: 'The service is not configured.' }, 500, noStore);

  const key = new Request('https://livebio.invalid/reviews');
  const cached = await deps.cache?.match(key);
  if (cached) return withCors(cached, cors, 'HIT');

  try {
    const { reviews, seen } = await fetchReviews(env.REVIEWS_REPO || DEFAULT_REPO, env.GITHUB_TOKEN, deps.fetch);
    // For whoever runs the service: how many issues were read and how many qualified. No names, no text.
    console.log(`livebio: reviews, ${seen} issues read, ${reviews.length} shown`);
    const bare = respond({ reviews }, 200, { 'Cache-Control': `public, max-age=${REVIEWS_TTL}` });
    if (deps.cache) {
      const write = deps.cache.put(key, bare.clone());
      if (deps.waitUntil) deps.waitUntil(write);
      else void write;
    }
    return withCors(bare, cors, 'MISS');
  } catch (error) {
    return failure(error, cors);
  }
}

/** Serves GET /?user=<login> as JSON contribution data. Pure and testable: no globals are touched. */
export async function handle(request: Request, env: Env, deps: Deps = {}): Promise<Response> {
  const cors = corsHeaders(request.headers.get('Origin'), env);

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: { ...cors, 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Max-Age': '86400' },
    });
  }
  if (request.method !== 'GET') {
    return respond({ error: 'Method not allowed.' }, 405, { ...cors, Allow: 'GET, OPTIONS', 'Cache-Control': 'no-store' });
  }

  const url = new URL(request.url);
  if (url.pathname === '/reviews') return serveReviews(env, deps, cors);
  // The pictures a hosted README points at. These are images, so they carry their own headers.
  if (url.pathname.startsWith('/u/')) return serveCard(request, env, deps);
  if (/^\/credit-(dark|light)\.svg$/.test(url.pathname)) return serveCredit(url);
  if (url.pathname !== '/' && url.pathname !== '/contributions') {
    return respond({ error: 'Not found.' }, 404, { ...cors, 'Cache-Control': 'no-store' });
  }

  const user = url.searchParams.get('user') ?? '';
  if (!isValidUsername(user)) {
    return respond({ error: 'Give a valid GitHub username as ?user=name.' }, 400, { ...cors, 'Cache-Control': 'no-store' });
  }
  if (!env.GITHUB_TOKEN) {
    return respond({ error: 'The service is not configured.' }, 500, { ...cors, 'Cache-Control': 'no-store' });
  }

  const key = new Request(`https://livebio.invalid/contributions/${user.toLowerCase()}`);
  const cached = await deps.cache?.match(key);
  if (cached) return withCors(cached, cors, 'HIT');

  const store = (bare: Response) => {
    if (!deps.cache) return;
    const write = deps.cache.put(key, bare.clone());
    if (deps.waitUntil) deps.waitUntil(write);
    else void write;
  };

  try {
    const data = await fetchContributions(user, { token: env.GITHUB_TOKEN, fetch: deps.fetch });
    const bare = respond(data, 200, { 'Cache-Control': `public, max-age=${FOUND_TTL}` });
    store(bare);
    return withCors(bare, cors, 'MISS');
  } catch (error) {
    if (error instanceof GitHubError && error.kind === 'not-found') {
      // Remember that this user does not exist, so repeated lookups do not spend the token's quota.
      const bare = respond({ error: 'That GitHub user was not found.' }, 404, {
        'Cache-Control': `public, max-age=${MISSING_TTL}`,
      });
      store(bare);
      return withCors(bare, cors, 'MISS');
    }
    return failure(error, cors);
  }
}
