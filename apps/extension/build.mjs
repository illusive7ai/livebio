import { build } from 'esbuild';
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

export const DEFAULT_SERVICE_URL = 'https://livebio-contributions.livebio.workers.dev';
export const DEFAULT_SITE_URL = 'https://illusive7ai.github.io/livebio/';

/**
 * Builds the extension into `outDir`, ready to load unpacked. The server address and the website address are written
 * in at build time, and the server's address is also the only site besides GitHub that the extension may talk to.
 */
export async function buildExtension({ outDir = join(here, 'dist'), serviceUrl = process.env.LIVEBIO_SERVICE_URL || DEFAULT_SERVICE_URL, siteUrl = process.env.LIVEBIO_SITE_URL || DEFAULT_SITE_URL } = {}) {
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  await build({
    entryPoints: { background: join(here, 'src/background.ts'), content: join(here, 'src/content.ts'), popup: join(here, 'src/popup.ts'), wrapped: join(here, 'src/wrapped.ts') },
    outdir: outDir,
    bundle: true,
    format: 'iife',
    target: 'chrome110',
    platform: 'browser',
    legalComments: 'none',
    loader: { '.css': 'text' },
    define: { __SERVICE_URL__: JSON.stringify(serviceUrl), __SITE_URL__: JSON.stringify(siteUrl) },
    logLevel: 'warning',
  });

  for (const file of ['popup.html', 'wrapped.html', 'components.css', 'pages.css']) cpSync(join(here, 'src', file), join(outDir, file));
  mkdirSync(join(outDir, 'icons'), { recursive: true });
  for (const file of readdirSync(join(here, 'icons'))) if (file.endsWith('.png')) cpSync(join(here, 'icons', file), join(outDir, 'icons', file));

  const manifest = JSON.parse(readFileSync(join(here, 'manifest.json'), 'utf8'));
  const pkg = JSON.parse(readFileSync(join(here, 'package.json'), 'utf8'));
  manifest.version = pkg.version;
  manifest.homepage_url = siteUrl;
  manifest.host_permissions = [...manifest.host_permissions, `${new URL(serviceUrl).origin}/*`];
  writeFileSync(join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  return { outDir, manifest };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { outDir, manifest } = await buildExtension();
  console.log(`Built ${manifest.name} ${manifest.version} in ${outDir}`);
}
