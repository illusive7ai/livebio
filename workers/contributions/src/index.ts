import { handle, type CacheLike, type Env } from './handler';

interface Context {
  waitUntil(promise: Promise<unknown>): void;
}

export default {
  async fetch(request: Request, env: Env, ctx: Context): Promise<Response> {
    // Workers expose a per-site cache as caches.default.
    const cache = (globalThis as unknown as { caches?: { default?: CacheLike } }).caches?.default;
    return handle(request, env, { cache, waitUntil: (promise) => ctx.waitUntil(promise) });
  },
};
