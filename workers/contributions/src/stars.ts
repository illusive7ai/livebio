import { GitHubError } from '@livebio/core/src/github';
import { withUserAgent } from './http';

const REPO = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

/**
 * How many stars a repository has. The token goes only to GitHub, and only the count comes back: a whole number
 * of zero or more, or an error. It never guesses a number.
 */
export async function fetchStars(repo: string, token: string, fetcher: typeof fetch = fetch): Promise<number> {
  fetcher = withUserAgent(fetcher);
  if (!REPO.test(repo)) throw new GitHubError('The repository is not set up correctly.', 'unauthorized');

  let response: Response;
  try {
    response = await fetcher(`https://api.github.com/repos/${repo}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'livebio' },
    });
  } catch {
    throw new GitHubError('Could not reach GitHub.', 'network');
  }
  if (response.status === 401) throw new GitHubError('GitHub did not accept the token.', 'unauthorized');
  if (response.status === 404) throw new GitHubError('The repository was not found.', 'not-found');
  if (response.status === 429 || (response.status === 403 && response.headers.get('x-ratelimit-remaining') === '0')) {
    const reset = Number(response.headers.get('x-ratelimit-reset'));
    throw new GitHubError('GitHub rate limit reached.', 'rate-limit', Number.isFinite(reset) && reset > 0 ? new Date(reset * 1000) : undefined);
  }
  if (!response.ok) throw new GitHubError(`GitHub returned an unexpected error (${response.status}).`, 'unknown');

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new GitHubError('GitHub sent something that was not JSON.', 'unknown');
  }
  const stars = (data as { stargazers_count?: unknown } | null)?.stargazers_count;
  if (typeof stars !== 'number' || !Number.isInteger(stars) || stars < 0) throw new GitHubError('GitHub sent something unexpected.', 'unknown');
  return stars;
}
