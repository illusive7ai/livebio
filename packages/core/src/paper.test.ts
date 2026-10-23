import { describe, expect, it } from 'vitest';
import { cutout, listWords } from './templates/paper';
import { bare, hostile, profile, svgOf, wellFormed } from './testkit';

describe('listWords', () => {
  it('writes a list in plain words', () => {
    expect(listWords([])).toBe('');
    expect(listWords(['Go'])).toBe('Go');
    expect(listWords(['Go', 'Rust'])).toBe('Go and Rust');
    expect(listWords(['Go', 'Rust', 'Zig'])).toBe('Go, Rust and Zig');
  });
});

describe('wanted poster', () => {
  it('names the real languages as the crime and the real stars as the reward', () => {
    const svg = svgOf('wanted');
    expect(svg).toContain('FOR WRITING GO, RUST AND ZIG');
    expect(svg).toContain('★ 777 STARS');
    expect(svg).toContain('LAST SEEN IN LISBON');
    expect(svg).toContain('ON GITHUB SINCE 2019');
  });
  it('leaves out each line whose data is missing or switched off', () => {
    expect(svgOf('wanted', { ...profile, location: null })).not.toContain('LAST SEEN');
    expect(svgOf('wanted', { ...profile, createdAt: 'nonsense' })).not.toContain('SINCE');
    expect(svgOf('wanted', profile, ['languages'])).not.toContain('REWARD');
    expect(svgOf('wanted', profile, ['stats'])).not.toContain('FOR WRITING');
  });
});

describe('recipe card', () => {
  it('lists the real languages as ingredients and at most four repositories as steps', () => {
    const svg = svgOf('recipe');
    expect(svg).toContain('>60%<');
    expect(svg).toContain('>Rust<');
    expect(svg).toContain('>delta<');
    expect(svg).not.toContain('>epsilon<');
  });
  it('gives a repository with no description no description, and counts the years from the real dates', () => {
    const svg = svgOf('recipe');
    expect(svg).toContain('Prep time: 7 years on GitHub');
    expect(svg).toContain('Serves: 1,234 followers');
    expect(svg).not.toContain('untold');
  });
  it('writes no prep time when the dates cannot be read', () => {
    expect(svgOf('recipe', { ...profile, createdAt: 'nonsense' })).not.toContain('Prep time');
    expect(svgOf('recipe', profile, ['languages', 'projects'])).not.toContain('Serves');
  });
});

describe('nutrition label', () => {
  it('prints the real numbers', () => {
    const svg = svgOf('nutrition');
    for (const value of ['>23<', '>777<', '>1,234<', '>48<', '>40<']) expect(svg).toContain(value);
    // The list wraps onto more than one line, so each ingredient is looked for on its own.
    for (const part of ['INGREDIENTS:', 'Go (60%)', 'Rust (30%)', 'Zig', '(10%).']) expect(svg).toContain(part);
  });
  it('lists forks only when they are known, and contributions only with data and the section on', () => {
    expect(svgOf('nutrition', { ...profile, totalForks: undefined })).not.toContain('>Forks<');
    expect(svgOf('nutrition')).toContain('Contributions this year');
    expect(svgOf('nutrition', { ...profile, contributions: undefined })).not.toContain('Contributions this year');
    expect(svgOf('nutrition', profile, ['stats', 'languages'])).not.toContain('Contributions this year');
  });
  it('says when the data was read, and only when it was', () => {
    expect(svgOf('nutrition')).toContain('read 2026-06-10');
    expect(svgOf('nutrition', { ...profile, fetchedAt: undefined })).not.toContain('read ');
  });
  it('fits a long name on the box', () => {
    const svg = svgOf('nutrition', { ...profile, name: 'Bartholomew Montgomery-Featherstonehaugh' });
    expect(wellFormed(svg)).toEqual([]);
    expect(svg).toContain('MONTGOMERY-');
    const sizeOf = (s: string, word: string) => Number(new RegExp(`font-size="(\\d+)" fill="#ffffff" font-weight="800">${word}`).exec(s)?.[1]);
    expect(sizeOf(svg, 'BARTHOLOMEW')).toBeLessThan(50);
    expect(sizeOf(svgOf('nutrition'), 'OCTO')).toBe(50);
  });
});

describe('postcard', () => {
  it('greets from the real location, and from GitHub when there is none', () => {
    expect(svgOf('postcard')).toContain('Greetings from Lisbon!');
    expect(svgOf('postcard', { ...profile, location: null })).toContain('Greetings from GitHub!');
  });
  it('postmarks with the date the data was read, and not at all without one', () => {
    expect(svgOf('postcard')).toContain('2026-06-10');
    expect(svgOf('postcard', { ...profile, fetchedAt: undefined })).not.toContain('POSTED');
  });
  it('writes no message when there is no bio, and says so', () => {
    expect(svgOf('postcard', { ...profile, bio: null })).toContain('(no message written yet)');
  });
  it('shows the address lines it has and no more', () => {
    expect(svgOf('postcard', { ...profile, location: null }).match(/font-style="italic">/g)?.length).toBeLessThan(svgOf('postcard').match(/font-style="italic">/g)!.length);
  });
});

describe('ransom note', () => {
  it('cuts one letter for each letter of the name, and none for spaces', () => {
    expect(svgOf('ransom').match(/class="cut"/g)?.length).toBe('OCTOCAT'.length + 3 + 3); // letters, three numbers, three languages
  });
  it('is the same every time', () => {
    expect(svgOf('ransom')).toBe(svgOf('ransom'));
  });
  it('shrinks a long name to fit rather than running off the sheet', () => {
    const svg = svgOf('ransom', { ...profile, name: 'Abcdefghijklmn' });
    expect(svg).toMatch(/scale\(0\.\d+\)/);
    expect(svgOf('ransom')).not.toMatch(/scale\(0\.\d+\)/);
  });
  it('shows the real numbers on its scraps', () => {
    const svg = svgOf('ransom');
    expect(svg).toContain('777 STARS');
    expect(svg).toContain('GO 60%');
  });
  it('cutout styles repeat for the same seed and vary across seeds', () => {
    expect(cutout('a', true)).toEqual(cutout('a', true));
    expect(new Set(Array.from({ length: 30 }, (_v, i) => cutout(`s${i}`, false).bg)).size).toBeGreaterThan(2);
    for (let i = 0; i < 50; i++) expect(Math.abs(cutout(`x${i}`, true).rot)).toBeLessThanOrEqual(6);
  });
});

describe.each(['wanted', 'recipe', 'nutrition', 'postcard', 'ransom'])('%s', (id) => {
  it('escapes everything it is given', () => {
    const svg = svgOf(id, hostile);
    expect(svg).not.toContain('<script');
    expect(wellFormed(svg)).toEqual([]);
  });
  it('draws for an account with almost nothing in it', () => {
    const svg = svgOf(id, bare);
    expect(wellFormed(svg)).toEqual([]);
    expect(svg).not.toMatch(/NaN|undefined|Infinity/);
  });
});
