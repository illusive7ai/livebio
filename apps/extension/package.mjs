import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { strToU8, zipSync } from 'fflate';

const here = dirname(fileURLToPath(import.meta.url));

export const INSTALL_NOTES = `livebio for GitHub: how to install

1. Unzip this folder somewhere you will keep it (Chrome reads the extension from there).
2. In Chrome, open chrome://extensions (in Edge: edge://extensions, in Brave: brave://extensions).
3. Switch on Developer mode, at the top right.
4. Press "Load unpacked" and choose the unzipped folder, the one that holds manifest.json.
5. Pin the livebio icon from the puzzle-piece menu if you like.

To update, download the new zip, replace the folder's files, and press the reload arrow on the extension's card.

What it does, and what it can see, is explained at the livebio website, on the Extension page.
`;

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

/** Zips a built extension, with the files in a fixed order and a fixed date so the same build always gives the same zip. */
export function zipExtension(dist) {
  const stamp = { mtime: new Date(1980, 0, 1) };
  const files = {};
  for (const path of walk(dist).sort()) files[relative(dist, path).split('\\').join('/')] = [new Uint8Array(readFileSync(path)), stamp];
  files['INSTALL.txt'] = [strToU8(INSTALL_NOTES), stamp];
  return zipSync(files, { level: 9 });
}

/** Writes the zip and a small description of it into the website's public folder, so the site can offer it for download. */
export function packageExtension({ dist = join(here, 'dist'), publicDir = join(here, '..', 'web', 'public') } = {}) {
  const manifest = JSON.parse(readFileSync(join(dist, 'manifest.json'), 'utf8'));
  const zip = zipExtension(dist);
  mkdirSync(publicDir, { recursive: true });
  writeFileSync(join(publicDir, 'livebio-extension.zip'), zip);
  const info = { name: manifest.name, version: manifest.version, bytes: zip.length };
  writeFileSync(join(publicDir, 'extension.json'), `${JSON.stringify(info)}\n`);
  return { zip, info };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { info } = packageExtension();
  console.log(`Packaged ${info.name} ${info.version}: ${info.bytes} bytes`);
}
