import { GitHubError } from '@livebio/core';

/** Plain-language message for anything that goes wrong while loading a profile. */
export function describeError(error: unknown, username: string): string {
  if (!(error instanceof GitHubError)) return 'Something went wrong. Please try again.';
  switch (error.kind) {
    case 'invalid-username':
      return 'That does not look like a GitHub username. Use letters, numbers and single hyphens.';
    case 'not-found':
      return `There is no GitHub user called "${username}". Check the spelling and try again.`;
    case 'rate-limit': {
      const when = error.resetAt
        ? ` You can try again around ${error.resetAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
        : '';
      return `GitHub limits how many requests can be made each hour, and that limit was reached. livebio avoids it where it can, but a lot of people are looking right now.${when}`;
    }
    case 'network':
      return 'Could not reach GitHub. Check your connection and try again.';
    default:
      return error.message;
  }
}
