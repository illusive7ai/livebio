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
  return template.render(profile, config);
}
