import { tintForHue } from './color';
import { ConfigError } from './config';
import { getTemplate, templates } from './templates';
import type { Config, Output, Profile } from './types';

/** Renders a profile with the template named in the config. */
export function renderProfile(profile: Profile, config: Config): Output {
  const template = getTemplate(config.template);
  if (!template) {
    const known = templates.map((t) => t.id).join(', ');
    throw new ConfigError(`Unknown template "${config.template}". Choose from: ${known}.`);
  }
  return template.render(withHue(profile, config), config);
}

/** A custom accent hue replaces the colour taken from the profile picture, in every template at once. */
function withHue(profile: Profile, config: Config): Profile {
  const hue = config.custom?.hue;
  if (hue === undefined || !profile.avatar) return profile;
  return { ...profile, avatar: { ...profile.avatar, grid: { ...profile.avatar.grid, tint: tintForHue(hue) } } };
}
