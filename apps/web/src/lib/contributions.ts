import { fetchContributionsViaProxy, type Contributions } from '@livebio/core';

/**
 * Address of the livebio contribution service, set when the site is built
 * (VITE_CONTRIBUTIONS_URL). Without it the preview simply has no activity data.
 */
const SERVICE_URL = import.meta.env.VITE_CONTRIBUTIONS_URL as string | undefined;

/** Loads contribution data for the preview, or null when the service is not set up or fails. */
export async function loadContributions(login: string): Promise<Contributions | null> {
  if (!SERVICE_URL) return null;
  try {
    return await fetchContributionsViaProxy(SERVICE_URL, login);
  } catch {
    return null;
  }
}
