import { existsSync, mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { unzipSync, strFromU8 } from 'fflate';
import { beforeAll, describe, expect, it } from 'vitest';
// @ts-expect-error the build scripts are plain JavaScript modules
import { buildExtension } from '../build.mjs';
// @ts-expect-error the build scripts are plain JavaScript modules
import { packageExtension } from '../package.mjs';

/** These build the extension for real and check what a person would be installing, not how it is written. */

const SERVICE = 'https://service.example';
const SITE = 'https://site.example/livebio/';
let dist = '';
let manifest: Record<string, unknown> & { permissions: string[]; host_permissions: string[]; content_scripts: Array<{ matches: string[]; js: string[] }> };

beforeAll(async () => {
  const out = mkdtempSync(join(tmpdir(), 'livebio-ext-'));
  const built = await buildExtension({ outDir: join(out, 'dist'), serviceUrl: SERVICE, siteUrl: SITE });
  dist = built.outDir;
  manifest = built.manifest;
}, 60_000);

const read = (name: string) => readFileSync(join(dist, name), 'utf8');

describe('what the extension asks to be allowed to do', () => {
  it('is a Manifest V3 extension', () => {
    expect(manifest.manifest_version).toBe(3);
  });

  it('asks for the two permissions it needs and no more', () => {
    expect([...manifest.permissions].sort()).toEqual(['activeTab', 'contextMenus']);
    for (const never of ['tabs', 'cookies', 'history', 'webRequest', 'webNavigation', 'scripting', 'storage', 'downloads', 'clipboardRead', 'declarativeNetRequest', 'management', 'bookmarks']) {
      expect(manifest.permissions).not.toContain(never);
    }
    expect(manifest).not.toHaveProperty('optional_permissions');
  });

  it('may talk to GitHub, to raw files on GitHub and to the livebio server, and to nowhere else', () => {
    expect([...manifest.host_permissions].sort()).toEqual(['https://github.com/*', 'https://raw.githubusercontent.com/*', `${SERVICE}/*`].sort());
    for (const host of manifest.host_permissions) {
      expect(host.startsWith('https://')).toBe(true);
      expect(host).not.toMatch(/\*:\/\/|<all_urls>|https:\/\/\*\//);
    }
  });

  it('adds its page widget to github.com only, and to no other site', () => {
    expect(manifest.content_scripts).toHaveLength(1);
    expect(manifest.content_scripts[0]!.matches).toEqual(['https://github.com/*']);
    expect(manifest.content_scripts[0]!.js).toEqual(['content.js']);
    expect(manifest.content_scripts[0]).not.toHaveProperty('all_frames');
    expect(manifest.content_scripts[0]).not.toHaveProperty('world');
  });

  it('does not let any web page talk to it', () => {
    expect(manifest).not.toHaveProperty('externally_connectable');
    expect(manifest).not.toHaveProperty('web_accessible_resources');
    expect(manifest).not.toHaveProperty('content_security_policy');
  });

  it('carries the version of the package and the address of the website', () => {
    expect(manifest.version).toBe(JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8')).version);
    expect(manifest.homepage_url).toBe(SITE);
    expect(manifest.version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

describe('what is in the build', () => {
  it('has every file the manifest names', () => {
    const named = [
      ...Object.values(manifest.icons as Record<string, string>),
      ...Object.values((manifest.action as { default_icon: Record<string, string> }).default_icon),
      (manifest.action as { default_popup: string }).default_popup,
      (manifest.background as { service_worker: string }).service_worker,
      ...manifest.content_scripts.flatMap((c) => c.js),
    ];
    for (const file of named) expect(existsSync(join(dist, file)), file).toBe(true);
  });

  it('has icons at the four sizes, drawn at those sizes', () => {
    for (const size of [16, 32, 48, 128]) {
      const png = readFileSync(join(dist, 'icons', `icon${size}.png`));
      expect(png.subarray(1, 4).toString()).toBe('PNG');
      expect(png.readUInt32BE(16)).toBe(size);
      expect(png.readUInt32BE(20)).toBe(size);
    }
  });

  it('has pages that load only their own files, with no script written into the page', () => {
    for (const page of ['popup.html', 'wrapped.html']) {
      const html = read(page);
      for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
        const target = match[1]!;
        if (target.startsWith('http') || target.startsWith('#')) continue;
        expect(existsSync(join(dist, target)), `${page} -> ${target}`).toBe(true);
      }
      expect(html).not.toMatch(/<script(?![^>]*\ssrc=)/i);
      expect(html).not.toMatch(/\son[a-z]+\s*=/i);
      expect(html).not.toMatch(/(?:src|href)="https?:/i);
    }
  });

  it('runs no code it did not ship with', () => {
    for (const file of readdirSync(dist).filter((f) => f.endsWith('.js'))) {
      const js = read(file);
      expect(js, file).not.toMatch(/\beval\s*\(/);
      expect(js, file).not.toMatch(/new Function\s*\(/);
      expect(js, file).not.toMatch(/importScripts\s*\(/);
      expect(js, file).not.toMatch(/document\.write\s*\(/);
      expect(js, file).not.toMatch(/\.innerHTML\s*=/);
    }
  });

  it('is small', () => {
    for (const file of readdirSync(dist).filter((f) => f.endsWith('.js'))) expect(readFileSync(join(dist, file)).length, file).toBeLessThan(250_000);
  });

  it('writes the two addresses in, and nothing is left to fill in', () => {
    const all = readdirSync(dist).filter((f) => f.endsWith('.js')).map(read).join('\n');
    expect(all).toContain(SERVICE);
    expect(all).toContain(SITE);
    expect(all).not.toContain('__SERVICE_URL__');
    expect(all).not.toContain('__SITE_URL__');
  });

  it('keeps the page widget off GitHub’s own scripts: it is drawn in a closed shadow root', () => {
    expect(read('content.js')).toContain('attachShadow');
    expect(read('content.js')).toMatch(/mode:\s*"closed"/);
  });
});

describe('the download', () => {
  it('is a zip with the extension at its root and install notes, the same every time', () => {
    const publicDir = join(mkdtempSync(join(tmpdir(), 'livebio-pub-')), 'public');
    const first = packageExtension({ dist, publicDir });
    const second = packageExtension({ dist, publicDir });
    expect(Buffer.from(first.zip).equals(Buffer.from(second.zip))).toBe(true);
    const files = unzipSync(first.zip);
    expect(Object.keys(files)).toContain('manifest.json');
    expect(Object.keys(files)).toContain('INSTALL.txt');
    expect(Object.keys(files)).toContain('icons/icon128.png');
    expect(Object.keys(files).filter((n) => n.includes('\\'))).toEqual([]);
    expect(strFromU8(files['INSTALL.txt']!)).toContain('Load unpacked');
    expect(JSON.parse(strFromU8(files['manifest.json']!)).version).toBe(manifest.version);
    expect(first.zip.length).toBeLessThan(500_000);
  });

  it('is described in a small file the website can read', () => {
    const publicDir = join(mkdtempSync(join(tmpdir(), 'livebio-pub-')), 'public');
    const { zip, info } = packageExtension({ dist, publicDir });
    const described = JSON.parse(readFileSync(join(publicDir, 'extension.json'), 'utf8'));
    expect(described).toEqual({ name: 'livebio for GitHub', version: manifest.version, bytes: zip.length });
    expect(info).toEqual(described);
  });
});
