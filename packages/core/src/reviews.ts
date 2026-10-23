import { isValidUsername } from './util';

/** A review from a real user, taken from a GitHub issue they opened with the "Share your experience" form. */
export interface Review {
  /** GitHub username of whoever opened the issue. GitHub sets this, so it cannot be made up in the text. */
  login: string;
  rating: 1 | 2 | 3 | 4 | 5;
  quote: string;
}

export const MAX_QUOTE = 400;

/** A web address, written with or without its scheme. A review that has one is left out. */
const HAS_LINK = /\b(?:https?:\/\/|www\.)|\b[a-z0-9-]+\.(?:com|net|org|io|dev|app|xyz|ru|cn|top|shop|site|online|link|info)\b/i;

/** The headings the issue form writes. A review that was not written with the form has none of them. */
const RATING = 'how would you rate it?';
const EXPERIENCE = 'what was it like?';
const PERMISSION = 'showing it on the website';

/** Splits an issue form's Markdown into its sections, keyed by lower-case heading. */
function sections(body: string): Map<string, string> {
  const found = new Map<string, string>();
  for (const part of body.replace(/\r\n/g, '\n').split(/^###\s+/m).slice(1)) {
    const newline = part.indexOf('\n');
    const heading = (newline === -1 ? part : part.slice(0, newline)).trim().toLowerCase();
    found.set(heading, newline === -1 ? '' : part.slice(newline + 1).trim());
  }
  return found;
}

/** One plain line of text: no control characters, no line breaks, no more than MAX_QUOTE characters. */
export function cleanQuote(text: string): string {
  const flat = text.replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (flat === '' || flat === '_No response_') return '';
  return flat.length > MAX_QUOTE ? `${flat.slice(0, MAX_QUOTE - 1).trimEnd()}…` : flat;
}

interface IssueLike {
  body?: unknown;
  user?: { login?: unknown; type?: unknown } | null;
  labels?: unknown;
  pull_request?: unknown;
}

function labelNames(labels: unknown): string[] {
  if (!Array.isArray(labels)) return [];
  return labels.map((l) => (typeof l === 'string' ? l : typeof l === 'object' && l !== null ? String((l as { name?: unknown }).name ?? '') : '')).map((n) => n.toLowerCase());
}

/**
 * Turns one GitHub issue into a review, or null when it should not be shown. It is shown only when it:
 * - was written with the review form (it has the form's headings), and is an issue, not a pull request;
 * - has a rating from 1 to 5 and some text;
 * - has its permission box ticked, so the person agreed to have it shown;
 * - comes from a person's account rather than a bot, and does not carry the "hidden" label that only maintainers can add;
 * - holds no web address, which is how advertising gets onto a page that shows other people's words.
 * Any GitHub user's review is shown, with no approval step. Anything it cannot read confidently is left out.
 */
export function reviewFromIssue(issue: unknown): Review | null {
  if (typeof issue !== 'object' || issue === null) return null;
  const { body, user, labels, pull_request: pullRequest } = issue as IssueLike;
  if (pullRequest) return null;
  if (typeof body !== 'string') return null;
  const login = user?.login;
  if (typeof login !== 'string' || !isValidUsername(login)) return null;
  if (user?.type === 'Bot') return null;

  const parts = sections(body);
  const rating = /^([1-5])\b/.exec(parts.get(RATING) ?? '')?.[1];
  const quote = cleanQuote(parts.get(EXPERIENCE) ?? '');
  const agreed = /^\s*-\s*\[[xX]\]/m.test(parts.get(PERMISSION) ?? '');
  if (!rating || !quote || !agreed) return null;

  if (labelNames(labels).includes('hidden')) return null;
  if (HAS_LINK.test(quote)) return null;

  return { login, rating: Number(rating) as Review['rating'], quote };
}

/** Reads a list of issues, newest first as GitHub sends them, and keeps one review per person: their latest. */
export function parseReviews(issues: unknown): Review[] {
  if (!Array.isArray(issues)) return [];
  const seen = new Set<string>();
  const reviews: Review[] = [];
  for (const issue of issues) {
    const review = reviewFromIssue(issue);
    if (!review || seen.has(review.login.toLowerCase())) continue;
    seen.add(review.login.toLowerCase());
    reviews.push(review);
  }
  return reviews;
}
