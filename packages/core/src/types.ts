export const BLOCK_IDS = ['stats', 'languages', 'projects'] as const;
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
}

/** Share of the user's own (non-fork) repositories whose main language this is. */
export interface LanguageShare {
  name: string;
  percent: number;
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
  render(profile: Profile, config: Config): Output;
}
