import { useEffect, useState } from 'react';
import { SERVICE_URL } from './service';

const CACHE_KEY = 'livebio.stars.v1';
const CACHE_MS = 10 * 60 * 1000;

/** A star count from the service, or null when what arrived is not a whole number of zero or more. */
export function parseStars(value: unknown): number | null {
  const stars = (value as { stars?: unknown } | null)?.stars;
  return typeof stars === 'number' && Number.isInteger(stars) && stars >= 0 ? stars : null;
}

/** "1 star" or "1,234 stars". */
export function starsLabel(count: number): string {
  return `${count.toLocaleString('en-US')} ${count === 1 ? 'star' : 'stars'}`;
}

function readCache(): number | null {
  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { at, stars } = JSON.parse(raw) as { at: number; stars: unknown };
    return Date.now() - at < CACHE_MS ? parseStars({ stars }) : null;
  } catch {
    return null;
  }
}

function writeCache(stars: number): void {
  try {
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), stars }));
  } catch {
    // A private window or full storage is fine: the next visit simply asks again.
  }
}

/**
 * How many stars the project has on GitHub, from the livebio service, which shares one answer between everyone
 * for ten minutes. It is null until the number is known, and stays null if the service cannot say: the page then
 * invites a star without a number, and never shows one it did not receive.
 */
export function useStars(): number | null {
  const [stars, setStars] = useState<number | null>(() => (SERVICE_URL ? readCache() : null));

  useEffect(() => {
    if (!SERVICE_URL || stars !== null) return;
    const controller = new AbortController();
    fetch(new URL('/stars', SERVICE_URL), { headers: { Accept: 'application/json' }, signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((body: unknown) => {
        const count = parseStars(body);
        if (count !== null) {
          writeCache(count);
          setStars(count);
        }
      })
      .catch(() => {
        // Not knowing the number is fine: the page just does not show it.
      });
    return () => controller.abort();
    // Only the first render asks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return stars;
}
