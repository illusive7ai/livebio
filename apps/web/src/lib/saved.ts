import { ConfigError, parseConfig, type Config } from '@livebio/core';

/** The design choices of a config, without who it is for. A saved design can be used on any profile. */
export interface SavedDesign {
  id: string;
  name: string;
  config: Omit<Config, 'username' | 'text'>;
}

const KEY = 'livebio.designs.v1';
const MAX = 30;

export function designFields(config: Config): SavedDesign['config'] {
  const { username: _username, text: _text, ...rest } = config;
  return rest;
}

/** Checks a design with the same rules as livebio.yml, so a damaged or edited entry can't cause trouble. */
function validate(entry: unknown): SavedDesign | null {
  if (typeof entry !== 'object' || entry === null) return null;
  const { id, name, config } = entry as Record<string, unknown>;
  if (typeof id !== 'string' || typeof name !== 'string' || typeof config !== 'object' || config === null) return null;
  try {
    const parsed = parseConfig({ username: 'sample-user', ...(config as object) });
    return { id, name: name.slice(0, 60), config: designFields(parsed) };
  } catch (error) {
    if (error instanceof ConfigError) return null;
    throw error;
  }
}

export function loadDesigns(): SavedDesign[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const list: unknown = JSON.parse(raw);
    return Array.isArray(list) ? list.map(validate).filter((d): d is SavedDesign => d !== null) : [];
  } catch {
    return [];
  }
}

/** Returns false when the browser would not store it, for example in a private window. */
export function storeDesigns(designs: SavedDesign[]): boolean {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(designs.slice(0, MAX)));
    return true;
  } catch {
    return false;
  }
}

export function newId(): string {
  return `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
