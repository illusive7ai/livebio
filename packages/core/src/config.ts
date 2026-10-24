import { parse, stringify } from 'yaml';
import { PRESETS } from './live/style';
import { BLOCK_IDS, COMPANIONS, FONT_CHOICES, TEXT_SIZE_MAX, TEXT_SIZE_MIN, THEME_MODES, type FontChoice, type BlockId, type Companion, type Config, type CustomStyle, type ThemeMode } from './types';
import { isValidUsername } from './util';

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

const MAX_TEXT = 200;

export function defaultConfig(username: string, template = 'showcase'): Config {
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

function parseCustom(value: unknown): CustomStyle | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'object' || Array.isArray(value)) throw new ConfigError('"custom" must be a set of key: value settings.');
  const raw = value as Record<string, unknown>;
  const custom: CustomStyle = {};
  if (raw.hue !== undefined) {
    if (typeof raw.hue !== 'number' || !Number.isInteger(raw.hue) || raw.hue < 0 || raw.hue > 359) {
      throw new ConfigError('"custom.hue" must be a whole number from 0 to 359.');
    }
    custom.hue = raw.hue;
  }
  if (raw.look !== undefined) {
    if (!PRESETS.includes(raw.look as never)) throw new ConfigError(`"custom.look" must be one of: ${PRESETS.join(', ')}.`);
    custom.look = raw.look as CustomStyle['look'];
  }
  if (raw.companion !== undefined) {
    if (!COMPANIONS.includes(raw.companion as Companion)) {
      throw new ConfigError(`"custom.companion" must be one of: ${COMPANIONS.join(', ')}.`);
    }
    custom.companion = raw.companion as Companion;
  }
  if (raw.font !== undefined) {
    if (!FONT_CHOICES.includes(raw.font as FontChoice)) throw new ConfigError(`"custom.font" must be one of: ${FONT_CHOICES.join(', ')}.`);
    custom.font = raw.font as FontChoice;
  }
  if (raw.textColor !== undefined) {
    if (typeof raw.textColor !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(raw.textColor)) {
      throw new ConfigError('"custom.textColor" must be a colour written as #rrggbb.');
    }
    custom.textColor = raw.textColor.toLowerCase();
  }
  if (raw.textSize !== undefined) {
    if (typeof raw.textSize !== 'number' || !Number.isInteger(raw.textSize) || raw.textSize < TEXT_SIZE_MIN || raw.textSize > TEXT_SIZE_MAX) {
      throw new ConfigError(`"custom.textSize" must be a whole number from ${TEXT_SIZE_MIN} to ${TEXT_SIZE_MAX} (a percentage).`);
    }
    custom.textSize = raw.textSize;
  }
  if (raw.timelapse !== undefined) {
    if (typeof raw.timelapse !== 'boolean') throw new ConfigError('"custom.timelapse" must be true or false.');
    custom.timelapse = raw.timelapse;
  }
  return Object.keys(custom).length > 0 ? custom : undefined;
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

  const template = raw.template ?? 'showcase';
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

  const custom = parseCustom(raw.custom);
  return {
    username,
    template,
    theme: theme as ThemeMode,
    motion: expectBoolean(raw.motion, 'motion', true),
    credit: expectBoolean(raw.credit, 'credit', true),
    blocks,
    text,
    ...(custom ? { custom } : {}),
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

/**
 * Whether a config needs the contribution calendar. The activity section, the live city and the live game all
 * draw it, so the calendar is worth fetching when any of them is on.
 */
export function needsContributions(config: Config): boolean {
  return config.blocks.some((block) => block === 'activity' || block === 'city' || block === 'game');
}
