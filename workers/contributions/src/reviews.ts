import { GitHubError } from '@livebio/core/src/github';
import { parseReviews, type Review } from '@livebio/core/src/reviews';
import { withUserAgent } from './http';

/** The repository whose issues hold the reviews. Change it with REVIEWS_REPO if you host your own copy. */
export const DEFAULT_REPO = 'illusive7ai/livebio';

const REPO = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const PAGE = 50;

/**
 * Reads the latest issues of a repository and keeps the ones that are approved reviews. It sends the token only
 * to GitHub, and returns only the fields a review has: a name, a rating and a line of text.
 */
export async function fetchReviews(
  repo: string,
  token: string,
  fetcher: typeof fetch = fetch,
): Promise<{ reviews: Review[]; seen: number }> {
  fetcher = withUserAgent(fetcher);
  if (!REPO.test(repo)) throw new GitHubError('The reviews repository is not set up correctly.', 'unauthorized');

  let response: Response;
  try {
    response = await fetcher(`https://api.github.com/repos/${repo}/issues?state=all&sort=created&direction=desc&per_page=${PAGE}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'livebio' },
    });
  } catch {
    throw new GitHubError('Could not reach GitHub.', 'network');
  }
  if (response.status === 401) throw new GitHubError('GitHub did not accept the token.', 'unauthorized');
  if (response.status === 429 || (response.status === 403 && response.headers.get('x-ratelimit-remaining') === '0')) {
    const reset = Number(response.headers.get('x-ratelimit-reset'));
    throw new GitHubError('GitHub rate limit reached.', 'rate-limit', Number.isFinite(reset) && reset > 0 ? new Date(reset * 1000) : undefined);
  }
  if (!response.ok) throw new GitHubError(`GitHub returned an unexpected error (${response.status}).`, 'unknown');

  let issues: unknown;
  try {
    issues = await response.json();
  } catch {
    throw new GitHubError('GitHub sent something that was not JSON.', 'unknown');
  }
  if (!Array.isArray(issues)) throw new GitHubError('GitHub sent something unexpected.', 'unknown');
  return { reviews: parseReviews(issues), seen: issues.length };
}
