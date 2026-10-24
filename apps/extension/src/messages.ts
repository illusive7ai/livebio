import type { WrappedData } from '@livebio/core';

/** What the page widget asks the background worker to do for it. The worker is the one that may talk to other sites. */
export type Request =
  | { type: 'wrapped'; login: string }
  | { type: 'raw'; urls: string[] }
  | { type: 'openWrapped'; login: string | null };

export type Reply<T> = { ok: true; data: T } | { ok: false; message: string };

export interface RequestMap {
  wrapped: WrappedData;
  raw: string;
  openWrapped: null;
}

export async function ask<K extends Request['type']>(request: Extract<Request, { type: K }>): Promise<Reply<RequestMap[K]>> {
  try {
    const reply = (await chrome.runtime.sendMessage(request)) as Reply<RequestMap[K]> | undefined;
    return reply ?? { ok: false, message: 'The livebio extension did not answer. Reload the page and try again.' };
  } catch {
    return { ok: false, message: 'The livebio extension was updated or reloaded. Reload this page and try again.' };
  }
}
