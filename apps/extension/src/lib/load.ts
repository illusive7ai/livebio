import { computeWrapped, fetchProfileViaService, isValidUsername, GitHubError, type WrappedData } from '@livebio/core';
import { SERVICE_URL } from '../config';

/** Raised when the profile came back without its contribution calendar, so there is nothing to look back on. */
export class NoCalendarError extends Error {
  readonly kind = 'no-calendar';
}

/** Loads a person's public data from the livebio server and works out their Wrapped. */
export async function loadWrapped(login: string): Promise<WrappedData> {
  const name = login.trim().replace(/^@/, '');
  if (!isValidUsername(name)) throw new GitHubError('That is not a valid GitHub username.', 'invalid-username');
  const { profile, contributions } = await fetchProfileViaService(SERVICE_URL, name);
  const data = contributions ? computeWrapped({ ...profile, contributions }) : null;
  if (!data) throw new NoCalendarError('no calendar');
  return data;
}
