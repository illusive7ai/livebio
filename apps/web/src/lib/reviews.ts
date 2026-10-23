import { useEffect, useState } from 'react';
import { MAX_QUOTE, type Review } from '@livebio/core';
import { TESTIMONIALS } from '../data/testimonials';

/** The same service that supplies contribution data also serves the reviews, from /reviews. */
const SERVICE_URL = import.meta.env.VITE_CONTRIBUTIONS_URL as string | undefined;

const CACHE_KEY = 'livebio.reviews.v1';
const CACHE_MS = 10 * 60 * 1000;

/** What a visitor's browser may hold on to, so a page reload does not ask again. Never required. */
function readCache(): Review[] | null {
  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { at, reviews } = JSON.parse(raw) as { at: number; reviews: unknown };
    return Date.now() - at < CACHE_MS ? sanitise(reviews) : null;
  } catch {
    return null;
  }
}

function writeCache(reviews: Review[]): void {
  try {
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), reviews }));
  } catch {
    // A private window or full storage is fine: the next visit simply asks again.
  }
}

/**
 * Keeps only well-formed reviews. The service already checks them, but this is what actually reaches the page, so
 * it checks again: whatever arrives is treated as untrusted text, never as markup.
 */
export function sanitise(value: unknown): Review[] {
  if (!Array.isArray(value)) return [];
  const reviews: Review[] = [];
  for (const item of value) {
    if (typeof item !== 'object' || item === null) continue;
    const { login, rating, quote } = item as Record<string, unknown>;
    if (typeof login !== 'string' || !/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/.test(login)) continue;
    if (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5) continue;
    if (typeof quote !== 'string' || quote.trim() === '') continue;
    reviews.push({ login, rating: rating as Review['rating'], quote: quote.slice(0, MAX_QUOTE) });
  }
  return reviews;
}

export async function fetchReviews(signal?: AbortSignal): Promise<Review[]> {
  if (!SERVICE_URL) throw new Error('The review service is not set up.');
  const response = await fetch(new URL('/reviews', SERVICE_URL), { headers: { Accept: 'application/json' }, signal });
  if (!response.ok) throw new Error(`The review service answered ${response.status}.`);
  const body: unknown = await response.json();
  return sanitise((body as { reviews?: unknown } | null)?.reviews);
}

export type ReviewsState =
  | { status: 'loading' }
  | { status: 'ready'; reviews: Review[] };

/**
 * Reviews for the home page. While they load it says so, so the page never claims "no reviews" before it has
 * looked. If the service cannot be reached it falls back to the reviews added by hand in the repository.
 */
export function useReviews(enabled = true): ReviewsState {
  const [state, setState] = useState<ReviewsState>(() => {
    const cached = readCache();
    return cached ? { status: 'ready', reviews: cached } : { status: 'loading' };
  });

  useEffect(() => {
    if (!enabled || state.status === 'ready') return;
    const controller = new AbortController();
    fetchReviews(controller.signal)
      .then((reviews) => {
        writeCache(reviews);
        setState({ status: 'ready', reviews });
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: 'ready', reviews: sanitise(TESTIMONIALS) });
      });
    return () => controller.abort();
    // Only the first load asks. A later render should not ask again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
}
