import { renderProfile, templates, type Config, type Profile } from '@livebio/core';

function dataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * One small picture of each design: the template's own card, finished and still. The live city and game
 * panels are left out because they would be drawn below the card, out of the thumbnail's view.
 * A design with no picture of its own (plain Markdown) maps to null.
 */
export function thumbnails(profile: Profile, config: Config): Map<string, string | null> {
  const blocks = config.blocks.filter((b) => b !== 'city' && b !== 'game');
  const result = new Map<string, string | null>();
  for (const template of templates) {
    const output = renderProfile(profile, { ...config, template: template.id, motion: false, blocks });
    const asset = output.assets.find((a) => a.path.endsWith(`${template.id}-dark.svg`));
    result.set(template.id, asset ? dataUri(asset.content) : null);
  }
  return result;
}

/** Thumbnail of one design with its own settings, for a saved design. */
export function thumbnailFor(profile: Profile, config: Config): string | null {
  const blocks = config.blocks.filter((b) => b !== 'city' && b !== 'game');
  const output = renderProfile(profile, { ...config, motion: false, blocks });
  const asset = output.assets.find((a) => a.path.endsWith(`${config.template}-dark.svg`));
  return asset ? dataUri(asset.content) : null;
}
