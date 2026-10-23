import { parse, stringify } from 'yaml';
import { BLOCK_IDS, THEME_MODES, type BlockId, type Config, type ThemeMode } from './types';
import { isValidUsername } from './util';

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

const MAX_TEXT = 200;

export function defaultConfig(username: string, template = 'terminal'): Config {
  return {
    username,
    template,
    theme: 'auto',
    motion: true,
    credit: true,
    blocks: [...BLOCK_IDS],
    text: {},
  };
}

function expectBoolean(value: unknown, field: string, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  if (typeof value !== 'boolean') throw new ConfigError(`"${field}" must be true or false.`);
  return value;
}

function optionalText(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') throw new ConfigError(`"${field}" must be text.`);
  const trimmed = value.trim();
  if (trimmed.length > MAX_TEXT) throw new ConfigError(`"${field}" must be at most ${MAX_TEXT} characters.`);
  return trimmed || undefined;
}

/** Validates untrusted input (a parsed livebio.yml) and fills in defaults. */
export function parseConfig(input: unknown): Config {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new ConfigError('The config must be a set of key: value settings.');
  }
  const raw = input as Record<string, unknown>;

  const username = raw.username;
  if (typeof username !== 'string' || !isValidUsername(username)) {
    throw new ConfigError('"username" must be a valid GitHub username.');
  }

  const template = raw.template ?? 'terminal';
  if (typeof template !== 'string' || !template) throw new ConfigError('"template" must be a template id.');

  const theme = raw.theme ?? 'auto';
  if (!THEME_MODES.includes(theme as ThemeMode)) {
    throw new ConfigError(`"theme" must be one of: ${THEME_MODES.join(', ')}.`);
  }

  let blocks: BlockId[] = [...BLOCK_IDS];
  if (raw.blocks !== undefined) {
    if (!Array.isArray(raw.blocks)) throw new ConfigError('"blocks" must be a list.');
    const unknown = raw.blocks.filter((b) => !BLOCK_IDS.includes(b as BlockId));
    if (unknown.length > 0) {
      throw new ConfigError(`Unknown block: ${String(unknown[0])}. Choose from: ${BLOCK_IDS.join(', ')}.`);
    }
    blocks = [...new Set(raw.blocks as BlockId[])];
  }

  const textRaw = raw.text ?? {};
  if (typeof textRaw !== 'object' || textRaw === null || Array.isArray(textRaw)) {
    throw new ConfigError('"text" must be a set of key: value settings.');
  }
  const text: Config['text'] = {};
  const headline = optionalText((textRaw as Record<string, unknown>).headline, 'text.headline');
  const bio = optionalText((textRaw as Record<string, unknown>).bio, 'text.bio');
  if (headline) text.headline = headline;
  if (bio) text.bio = bio;

  return {
    username,
    template,
    theme: theme as ThemeMode,
    motion: expectBoolean(raw.motion, 'motion', true),
    credit: expectBoolean(raw.credit, 'credit', true),
    blocks,
    text,
  };
}

export function parseConfigYaml(source: string): Config {
  let data: unknown;
  try {
    data = parse(source);
  } catch (error) {
    throw new ConfigError(`The config is not valid YAML: ${(error as Error).message}`);
  }
  return parseConfig(data);
}

export function configToYaml(config: Config): string {
  return stringify(config);
}
