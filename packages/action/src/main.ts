import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import {
  applyToReadme,
  defaultConfig,
  fetchProfile,
  getTemplate,
  parseConfigYaml,
  renderProfile,
  type Config,
} from '@livebio/core';
import { loadAvatar } from './avatar';

/** Reads an Action input. The runner exposes `with:` values as INPUT_* variables. */
function input(name: string, fallback = ''): string {
  return process.env[`INPUT_${name.toUpperCase()}`]?.trim() || fallback;
}

async function readIfExists(path: string): Promise<string | null> {
  try {
    return await readFile(path, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}

async function loadConfig(path: string): Promise<Config> {
  const source = await readIfExists(path);
  if (source !== null) return parseConfigYaml(source);

  // No livebio.yml: fall back to the repository owner, which is the profile owner.
  const owner = process.env.GITHUB_REPOSITORY_OWNER;
  if (!owner) throw new Error(`No ${path} found and GITHUB_REPOSITORY_OWNER is not set.`);
  console.log(`No ${path} found, using defaults for ${owner}.`);
  return defaultConfig(owner);
}

async function main(): Promise<void> {
  const config = await loadConfig(input('config', 'livebio.yml'));
  const readmePath = input('readme', 'README.md');

  const profile = await fetchProfile(config.username, { token: input('token') || undefined });

  if (getTemplate(config.template)?.needsAvatar) {
    try {
      const avatar = await loadAvatar(profile.avatarUrl);
      if (avatar) profile.avatar = avatar;
      else console.log('The profile picture is in a format livebio cannot read, so it is left out.');
    } catch (error) {
      console.log(`Could not load the profile picture, so it is left out: ${(error as Error).message}`);
    }
  }

  const output = renderProfile(profile, config);

  for (const asset of output.assets) {
    await mkdir(dirname(asset.path), { recursive: true });
    await writeFile(asset.path, asset.content);
  }

  const existing = await readIfExists(readmePath);
  await writeFile(readmePath, applyToReadme(existing, output.readme));

  console.log(
    `Updated ${readmePath} and ${output.assets.length} image(s) for @${profile.login} with the "${config.template}" template.`,
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`::error::${message}`);
  process.exit(1);
});
