import { emptyPrefs, getTemplate, parsePrefs, type Prefs } from '@livebio/core';

const KEY = 'livebio.prefs.v1';

/** The liked and recently used designs, read back from this browser. Anything damaged or out of date is dropped. */
export function loadPrefs(): Prefs {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? parsePrefs(JSON.parse(raw), (id) => getTemplate(id) !== undefined) : emptyPrefs();
  } catch {
    return emptyPrefs();
  }
}

/** Returns false when the browser would not store it, for example in a private window. */
export function storePrefs(prefs: Prefs): boolean {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(prefs));
    return true;
  } catch {
    return false;
  }
}
