import { GitHubError, fetchProfile, fetchProfileViaService, type Contributions, type Profile } from '@livebio/core';
import { loadContributions } from './contributions';
import { SERVICE_URL } from './service';

/**
 * Loads a person's profile and contribution calendar for the preview.
 *
 * It asks the livebio server first. The server has a token and shares each person's data for an hour, while a
 * browser asking GitHub directly may only make 60 anonymous requests an hour, which a few lookups use up. If the
 * server cannot help, the browser asks GitHub itself, so the site still works when the server is down.
 */
export async function loadProfile(username: string): Promise<{ profile: Profile; contributions: Contributions | null }> {
  if (SERVICE_URL) {
    try {
      return await fetchProfileViaService(SERVICE_URL, username);
    } catch (error) {
      // "No such user" and "not a username" are answers, not failures: asking GitHub again would say the same.
      if (error instanceof GitHubError && (error.kind === 'not-found' || error.kind === 'invalid-username')) throw error;
    }
  }
  const profile = await fetchProfile(username);
  return { profile, contributions: await loadContributions(profile.login) };
}
