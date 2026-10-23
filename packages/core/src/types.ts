export const BLOCK_IDS = ['stats', 'activity', 'languages', 'projects'] as const;
export type BlockId = (typeof BLOCK_IDS)[number];

export const THEME_MODES = ['auto', 'dark', 'light'] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

export interface RepoSummary {
  name: string;
  description: string | null;
  stars: number;
  forks: number;
  language: string | null;
  url: string;
  /** When the repository was last pushed to, if GitHub said. */
  pushedAt?: string | null;
  /** SPDX licence id such as "MIT", if the repository declares a recognised licence. */
  license?: string | null;
}

/** Share of the user's own (non-fork) repositories whose main language this is. */
export interface LanguageShare {
  name: string;
  percent: number;
}

export interface ContributionDay {
  /** Calendar date, YYYY-MM-DD. */
  date: string;
  count: number;
  /** How busy the day was, 0 (none) to 4, as GitHub colours its own graph. */
  level: 0 | 1 | 2 | 3 | 4;
}

/**
 * What GitHub's contribution calendar shows for roughly the past year. The streak figures are
 * always worked out from `days`, never taken on trust from another service.
 */
export interface Contributions {
  from: string;
  to: string;
  total: number;
  activeDays: number;
  /** Consecutive active days ending today, or yesterday if today has no activity yet. */
  currentStreak: number;
  /** Longest run of active days within this window. */
  longestStreak: number;
  /** Oldest first, one entry per calendar day. */
  days: ContributionDay[];
}

/** Decoded picture, one value per pixel, row by row. Both arrays hold 0-255. */
export interface PixelGrid {
  width: number;
  height: number;
  luma: number[];
  alpha: number[];
  /** Average [r, g, b] of the picture's colourful pixels. Missing for greyscale pictures. */
  tint?: [number, number, number];
}

/**
 * The profile picture, loaded by the host (the browser or the Action). `dataUri` lets a
 * template embed the picture in an SVG, which cannot load outside images itself.
 */
export interface Avatar {
  dataUri: string;
  grid: PixelGrid;
}

/**
 * Public data about a user. Fields GitHub leaves empty are null, never filled in
 * with a guess: templates must leave them out instead of inventing a value.
 */
export interface Profile {
  login: string;
  name: string | null;
  avatarUrl: string;
  bio: string | null;
  company: string | null;
  location: string | null;
  website: string | null;
  url: string;
  followers: number;
  following: number;
  publicRepos: number;
  totalStars: number;
  createdAt: string;
  languages: LanguageShare[];
  topRepos: RepoSummary[];
  /** The most recently pushed-to own repositories, newest first. Archived and undated ones are left out. */
  recentRepos?: RepoSummary[];
  /** Forks of the user's own (non-fork) repositories, added together. */
  totalForks?: number;
  /** Own repositories that are not archived and were pushed to within ACTIVE_WINDOW_DAYS of `fetchedAt`. */
  activeRepos?: number;
  /** When this data was read. Relative times such as "3 days ago" are measured from here. */
  fetchedAt?: string;
  /** Present only when the host loaded the picture. Templates must cope without it. */
  avatar?: Avatar;
  /** Present only when contribution data was available. Templates must cope without it. */
  contributions?: Contributions;
}

export interface Config {
  username: string;
  template: string;
  theme: ThemeMode;
  motion: boolean;
  /** Show the small "Made with livebio by illusivehacks" line. On by default. */
  credit: boolean;
  blocks: BlockId[];
  text: {
    headline?: string;
    bio?: string;
  };
}

export interface Asset {
  /** Path relative to the root of the profile repository. */
  path: string;
  content: string;
}

export interface Output {
  readme: string;
  assets: Asset[];
}

export interface Template {
  id: string;
  name: string;
  description: string;
  tags: string[];
  /** Tells the host to load the profile picture before rendering. */
  needsAvatar?: boolean;
  render(profile: Profile, config: Config): Output;
}
