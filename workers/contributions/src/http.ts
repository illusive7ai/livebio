/**
 * GitHub's API refuses any request that has no User-Agent header. Browsers and Node add one themselves, but a
 * Cloudflare Worker does not, so every call the worker makes goes through this.
 */
export function withUserAgent(fetcher: typeof fetch = (...args) => fetch(...args)): typeof fetch {
  return ((input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    if (!headers.has('User-Agent')) headers.set('User-Agent', 'livebio');
    return fetcher(input, { ...init, headers });
  }) as typeof fetch;
}
