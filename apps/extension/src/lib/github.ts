import { isValidUsername } from '@livebio/core';

/** The first part of an address on github.com that is a page of GitHub's own and not a person or an organisation. */
const RESERVED = new Set([
  'about', 'account', 'apps', 'assets', 'blog', 'codespaces', 'collections', 'contact', 'copilot', 'customer-stories', 'dashboard', 'discussions',
  'education', 'enterprise', 'events', 'explore', 'features', 'git-guides', 'github', 'home', 'issues', 'join', 'login', 'logout', 'marketplace',
  'mobile', 'new', 'nonprofit', 'notifications', 'organizations', 'orgs', 'partners', 'personal', 'premium-support', 'pricing', 'pulls', 'readme',
  'resources', 'search', 'security', 'sessions', 'settings', 'signup', 'site', 'solutions', 'sponsors', 'stars', 'team', 'teams', 'terms', 'topics',
  'trending', 'users', 'watching',
]);

/** What a page on github.com is, as far as the extension cares. */
export type PageInfo =
  | { kind: 'profile'; login: string }
  | { kind: 'readme'; rawUrl: string; name: string }
  | { kind: 'edit'; name: string | null; rawUrl?: string }
  | { kind: 'other' };

const MARKDOWN = /\.(?:md|markdown|mdown|mkd)$/i;

export const isMarkdownFile = (name: string): boolean => MARKDOWN.test(name);

function safeDecode(text: string): string {
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
}

function parse(url: string): URL | null {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && (parsed.hostname === 'github.com' || parsed.hostname === 'www.github.com') ? parsed : null;
  } catch {
    return null;
  }
}

/** A name that could be a person or an organisation: a valid username that is not one of GitHub's own pages. */
export const isPersonName = (segment: string): boolean => isValidUsername(segment) && !RESERVED.has(segment.toLowerCase());

/** The owner at the front of any address on github.com, such as the person in a link to one of their repositories. */
export function ownerLoginFromUrl(url: string): string | null {
  const parsed = parse(url);
  const first = parsed?.pathname.split('/').filter(Boolean)[0];
  return first && isPersonName(first) ? first : null;
}

/** Who a piece of text names: "@octocat", "octocat" or a github.com address. Anything with spaces or other words is nobody. */
export function loginFromText(text: string | undefined | null): string | null {
  const trimmed = (text ?? '').trim();
  if (trimmed === '' || /\s/.test(trimmed)) return null;
  if (/^https?:\/\//i.test(trimmed)) return ownerLoginFromUrl(trimmed);
  const bare = trimmed.replace(/^@/, '');
  return isPersonName(bare) ? bare : null;
}

/** Works out what kind of page an address is, and for a README page where its raw text lives. */
export function pageInfo(url: string): PageInfo {
  const parsed = parse(url);
  if (!parsed) return { kind: 'other' };
  const parts = parsed.pathname.split('/').filter(Boolean);
  const [owner, repo, view, ...rest] = parts;
  if (!owner || !isPersonName(owner)) return { kind: 'other' };

  if (parts.length === 1) return { kind: 'profile', login: owner };
  if (!repo) return { kind: 'other' };
  const base = `https://github.com/${owner}/${repo}`;

  // The front page of a repository shows its README.
  if (parts.length === 2) return { kind: 'readme', rawUrl: `${base}/raw/HEAD/README.md`, name: 'README.md' };
  if (view === 'blob' && rest.length >= 2 && isMarkdownFile(rest[rest.length - 1]!)) {
    // The parts of a path are already percent-encoded, so they are used as they are.
    return { kind: 'readme', rawUrl: `${base}/raw/${rest.join('/')}`, name: safeDecode(rest[rest.length - 1]!) };
  }
  // A folder shows the README inside it.
  if (view === 'tree' && rest.length >= 2) return { kind: 'readme', rawUrl: `${base}/raw/${rest.join('/')}/README.md`, name: 'README.md' };
  if (view === 'edit' && rest.length >= 2 && isMarkdownFile(rest[rest.length - 1]!)) return { kind: 'edit', name: safeDecode(rest[rest.length - 1]!), rawUrl: `${base}/raw/${rest.join('/')}` };
  if (view === 'new') {
    const filename = parsed.searchParams.get('filename');
    return { kind: 'edit', name: filename && isMarkdownFile(filename) ? filename : null };
  }
  return { kind: 'other' };
}

/**
 * The addresses to try for a README, in order. A repository's front page does not say what its README is called, so the usual
 * names are tried; any other file has exactly one address.
 */
export function readmeCandidates(rawUrl: string): string[] {
  const match = /^(.*\/)README\.md$/.exec(rawUrl);
  if (!match) return [rawUrl];
  return ['README.md', 'readme.md', 'Readme.md', 'README.markdown', 'README.MD'].map((name) => `${match[1]}${name}`);
}

/** Whether the extension may fetch an address for the README checker: a file on github.com or raw.githubusercontent.com, nothing else. */
export function isAllowedRawUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    if (parsed.hostname === 'raw.githubusercontent.com') return true;
    return parsed.hostname === 'github.com' && /^\/[^/]+\/[^/]+\/raw\//.test(parsed.pathname);
  } catch {
    return false;
  }
}

/** Who a right-click was on: the owner in a link to GitHub, or else a username in the selected text. Null when it was neither. */
export function loginForMenu(info: { linkUrl?: string; selectionText?: string }): string | null {
  return (info.linkUrl ? ownerLoginFromUrl(info.linkUrl) : null) ?? loginFromText(info.selectionText);
}

/** The biggest README the checker will read, in characters. GitHub itself stops showing a README at about 500 KB. */
export const MAX_README_CHARS = 600_000;
