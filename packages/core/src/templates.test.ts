import { DOMParser } from '@xmldom/xmldom';
import { describe, expect, it } from 'vitest';
import { defaultConfig } from './config';
import { previewMarkdown } from './preview';
import { renderProfile } from './render';
import { AUTHOR, MARKER_END, MARKER_START, applyToReadme } from './readme';
import { templates } from './templates';
import type { Config, Profile } from './types';

const profile: Profile = {
  login: 'octo',
  name: 'Octo Cat',
  avatarUrl: 'https://avatars.example/octo',
  bio: 'Builds <b>things</b> & breaks others',
  company: 'Acme',
  location: 'Lagos',
  website: 'octo.dev',
  url: 'https://github.com/octo',
  followers: 1154,
  following: 20,
  publicRepos: 51,
  totalStars: 330,
  createdAt: '2020-01-01T00:00:00Z',
  languages: [
    { name: 'TypeScript', percent: 60 },
    { name: 'Go', percent: 40 },
  ],
  topRepos: [{ name: 'tool', description: 'A tool', stars: 12, forks: 1, language: 'Go', url: 'https://github.com/octo/tool' }],
};

const bare: Profile = {
  ...profile,
  name: null,
  bio: null,
  company: null,
  location: null,
  website: null,
  languages: [],
  topRepos: [],
};

function config(template: string, over: Partial<Config> = {}): Config {
  return { ...defaultConfig('octo', template), ...over };
}

function parseSvg(svg: string) {
  const errors: string[] = [];
  const doc = new DOMParser({ onError: (_level, message) => errors.push(message) }).parseFromString(svg, 'image/svg+xml');
  expect(errors).toEqual([]);
  return doc;
}

function assertWellFormed(svg: string): void {
  parseSvg(svg);
}

/** Tags in Markdown/HTML that are not backslash-escaped, so a renderer would treat them as markup. */
function liveTags(markup: string, name: string): string[] {
  return [...markup.matchAll(new RegExp(`(?<!\\\\)<${name}\\b[^>]*>`, 'gi'))].map((m) => m[0]);
}

describe.each(templates.map((t) => t.id))('%s template', (id) => {
  it('produces well-formed SVG for every variant', () => {
    for (const asset of renderProfile(profile, config(id)).assets) assertWellFormed(asset.content);
  });

  it('shows the credit footer by default and drops it when switched off', () => {
    expect(renderProfile(profile, config(id)).readme).toContain(AUTHOR);
    expect(renderProfile(profile, config(id, { credit: false })).readme).not.toContain(AUTHOR);
  });

  it('never invents values for fields GitHub left empty', () => {
    const everything = (out: ReturnType<typeof renderProfile>) =>
      [out.readme, ...out.assets.map((a) => a.content)].join('\n');
    const text = everything(renderProfile(bare, config(id)));
    for (const invented of ['Nowhere', 'Unknown', 'undefined', 'null', 'Frontend', 'engineer', 'N/A']) {
      expect(text).not.toContain(invented);
    }
  });

  it('cannot be used to inject markup through profile text', () => {
    const hostile: Profile = {
      ...profile,
      name: '<script>alert(1)</script>',
      bio: '"><img src=x onerror=alert(1)>',
      company: '</text><script>x</script>',
      website: 'javascript:alert(1)',
    };
    const out = renderProfile(hostile, config(id));
    for (const asset of out.assets) {
      // Hostile text may appear as visible text, but must never become an element or attribute.
      const doc = parseSvg(asset.content);
      expect(doc.getElementsByTagName('script').length).toBe(0);
      expect(doc.getElementsByTagName('img').length).toBe(0);
      for (const el of Array.from(doc.getElementsByTagName('*'))) {
        for (const attr of Array.from(el.attributes)) expect(attr.name.toLowerCase()).not.toMatch(/^on/);
      }
    }
    expect(liveTags(out.readme, 'script')).toEqual([]);
    expect(liveTags(out.readme, 'iframe')).toEqual([]);
    // The only images in the README are the generated ones.
    for (const img of liveTags(out.readme, 'img')) expect(img).toMatch(/^<img alt="[^"]*" src="livebio\//);
    expect(out.readme).not.toContain('(<javascript:');
    expect(out.readme).not.toContain('href="javascript:');
  });

  it('respects the blocks the user turned off', () => {
    const out = renderProfile(profile, config(id, { blocks: [] }));
    const text = [out.readme, ...out.assets.map((a) => a.content)].join('\n');
    expect(text).not.toContain('1,154');
    expect(text).not.toContain('TypeScript');
  });
});

describe('terminal template', () => {
  it('makes a dark and a light image for the auto theme, and one image otherwise', () => {
    // The template's own card. Its live city and snake are separate images, tested elsewhere.
    const card = (c: Config) =>
      renderProfile(profile, c).assets.map((a) => a.path).filter((p) => /terminal-(dark|light)\.svg$/.test(p));
    expect(card(config('terminal'))).toEqual(['livebio/terminal-dark.svg', 'livebio/terminal-light.svg']);
    expect(card(config('terminal', { theme: 'dark' }))).toEqual(['livebio/terminal-dark.svg']);
  });

  it('only animates when motion is on, and honours reduced motion', () => {
    const [animated] = renderProfile(profile, config('terminal')).assets;
    expect(animated!.content).toContain('@keyframes');
    expect(animated!.content).toContain('prefers-reduced-motion');
    const [still] = renderProfile(profile, config('terminal', { motion: false })).assets;
    expect(still!.content).not.toContain('@keyframes');
  });

  it('gives the image meaningful alt text', () => {
    const { readme } = renderProfile(profile, config('terminal'));
    expect(readme).toContain('alt="Octo Cat on GitHub, 51 repositories, 330 stars, 1,154 followers, mostly TypeScript, Go"');
  });
});

describe('applyToReadme', () => {
  const generated = `${MARKER_START}\n\nNEW\n\n${MARKER_END}\n`;

  it('replaces only the livebio block of an existing README', () => {
    const existing = `# Mine\n\nintro\n\n${MARKER_START}\nOLD\n${MARKER_END}\n\nfooter\n`;
    const result = applyToReadme(existing, generated);
    expect(result).toContain('intro');
    expect(result).toContain('footer');
    expect(result).toContain('NEW');
    expect(result).not.toContain('OLD');
  });

  it('uses the generated README when there are no markers or no README', () => {
    expect(applyToReadme('# plain', generated)).toBe(generated);
    expect(applyToReadme(null, generated)).toBe(generated);
  });
});

describe('previewMarkdown', () => {
  it('inlines images and picks the variant for the chosen mode', () => {
    const output = renderProfile(profile, config('terminal'));
    for (const mode of ['dark', 'light'] as const) {
      const md = previewMarkdown(output, mode);
      expect(md).not.toContain('<picture>');
      expect(md).not.toContain('livebio/terminal');
      expect(md).toContain('data:image/svg+xml;base64,');
    }
    const dark = previewMarkdown(output, 'dark');
    const light = previewMarkdown(output, 'light');
    expect(dark).not.toBe(light);
  });

  it('keeps the only available variant when the theme is fixed', () => {
    const output = renderProfile(profile, config('terminal', { theme: 'light' }));
    expect(previewMarkdown(output, 'dark')).toContain('data:image/svg+xml;base64,');
  });
});
