/** The designs a person liked and the ones they used lately. Kept in their own browser, never sent anywhere. */
export interface Prefs {
  /** Most recently liked first. */
  favourites: string[];
  /** Most recently used first, without repeats. */
  recent: string[];
}

export const MAX_FAVOURITES = 60;
export const MAX_RECENT = 12;

export const emptyPrefs = (): Prefs => ({ favourites: [], recent: [] });

const cleanList = (value: unknown, known: (id: string) => boolean, max: number): string[] => {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  for (const entry of value) {
    if (typeof entry === 'string' && known(entry) && !seen.has(entry)) seen.add(entry);
    if (seen.size >= max) break;
  }
  return [...seen];
};

/** Reads stored preferences back safely: anything damaged, repeated or no longer a design is dropped. */
export function parsePrefs(raw: unknown, known: (id: string) => boolean): Prefs {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return emptyPrefs();
  const { favourites, recent } = raw as Record<string, unknown>;
  return { favourites: cleanList(favourites, known, MAX_FAVOURITES), recent: cleanList(recent, known, MAX_RECENT) };
}

export const isFavourite = (prefs: Prefs, id: string): boolean => prefs.favourites.includes(id);

/** Likes a design, or takes the like away. */
export function toggleFavourite(prefs: Prefs, id: string): Prefs {
  return isFavourite(prefs, id)
    ? { ...prefs, favourites: prefs.favourites.filter((f) => f !== id) }
    : { ...prefs, favourites: [id, ...prefs.favourites].slice(0, MAX_FAVOURITES) };
}

/** Records that a design was used, moving it to the front of the recent list. */
export function noteUsed(prefs: Prefs, id: string): Prefs {
  if (prefs.recent[0] === id) return prefs;
  return { ...prefs, recent: [id, ...prefs.recent.filter((r) => r !== id)].slice(0, MAX_RECENT) };
}
