import { DOMParser } from '@xmldom/xmldom';
import { describe, expect, it } from 'vitest';
import { defaultConfig } from './config';
import { buildContributions } from './contributions';
import { renderProfile } from './render';
import { calendarMonth, mrzLine } from './templates/documents';
import type { BlockId, ContributionDay, Profile } from './types';

const days = (from: string, counts: number[]): ContributionDay[] =>
  counts.map((count, i) => ({ date: new Date(Date.parse(from) + i * 86_400_000).toISOString().slice(0, 10), count, level: (count === 0 ? 0 : Math.min(4, Math.ceil(count / 3))) as 0 | 1 | 2 | 3 | 4 }));

const profile: Profile = {
  login: 'octo',
  name: 'Octo Cat',
  avatarUrl: 'https://avatars.example/octo',
  bio: 'Makes things',
  company: null,
  location: 'Lisbon',
  website: null,
  url: 'https://github.com/octo',
  followers: 1234,
  following: 2,
  publicRepos: 5,
  totalStars: 777,
  createdAt: '2019-02-03T00:00:00Z',
  languages: [{ name: 'Go', percent: 70 }, { name: 'Rust', percent: 30 }],
  topRepos: [
    { name: 'alpha', description: 'The first one', stars: 10, forks: 1, language: 'Go', url: 'u' },
    { name: 'beta', description: null, stars: 5, forks: 0, language: 'Rust', url: 'u' },
  ],
  fetchedAt: '2026-06-10T08:00:00Z',
  contributions: buildContributions(days('2025-06-11', [...Array.from({ length: 360 }, () => 0), 4, 0, 7, 0, 1])),
};

const svgOf = (id: string, p: Profile = profile, blocks?: BlockId[]): string => {
  const config = { ...defaultConfig('octo', id), motion: false, theme: 'dark' as const, ...(blocks ? { blocks } : {}) };
  return renderProfile(p, config).assets.find((a) => a.path.endsWith(`${id}-dark.svg`))!.content;
};

const wellFormed = (svg: string): string[] => {
  const errors: string[] = [];
  new DOMParser({ onError: (_l, m) => errors.push(m) }).parseFromString(svg, 'image/svg+xml');
  return errors;
};

describe('passport', () => {
  it('has one stamp for each real language and no others', () => {
    const svg = svgOf('passport');
    expect(svg).toContain('>GO<');
    expect(svg).toContain('>RUST<');
    expect(svg).toContain('>70%<');
    expect(svg.match(/class="stamp"/g)?.length).toBe(2);
  });

  it('shows the real sign-up date and leaves out a place nobody gave', () => {
    expect(svgOf('passport')).toContain('2019-02-03');
    expect(svgOf('passport')).toContain('Lisbon');
    const none = svgOf('passport', { ...profile, location: null });
    expect(none).not.toContain('PLACE OF RESIDENCE');
  });

  it('draws no stamps when languages are switched off, and says so', () => {
    const svg = svgOf('passport', profile, ['stats']);
    expect(svg).not.toContain('class="stamp"');
    expect(svg).toContain('switched off');
  });

  it('builds a strip of exactly 44 characters from capitals, digits and filler', () => {
    expect(mrzLine('P<GHBOcto Cat')).toHaveLength(44);
    expect(mrzLine('a-b c')).toMatch(/^[A-Z0-9<]{44}$/);
    expect(mrzLine('x'.repeat(80))).toHaveLength(44);
  });
});

describe('receipt', () => {
  it('lists the real repositories with their real stars, and adds them up honestly', () => {
    const svg = svgOf('receipt');
    expect(svg).toContain('>alpha<');
    expect(svg).toContain('>beta<');
    expect(svg).toContain('SUBTOTAL (2 items)');
    expect(svg).toContain('>15<');
    expect(svg).toContain('>777<');
  });

  it('prints no description line for a repository that has none', () => {
    const svg = svgOf('receipt');
    expect(svg).toContain('The first one');
    expect(svg.match(/The first one/g)).toHaveLength(1);
  });

  it('is the same every time for the same login, bar code included', () => {
    expect(svgOf('receipt')).toBe(svgOf('receipt'));
  });

  it('lists no items when projects are switched off', () => {
    const svg = svgOf('receipt', profile, ['stats']);
    expect(svg).not.toContain('>alpha<');
    expect(svg).not.toContain('SUBTOTAL');
  });
});

describe('character sheet', () => {
  it('shows real numbers, and years from the real dates', () => {
    const svg = svgOf('sheet');
    expect(svg).toContain('>1,234<');
    expect(svg).toContain('>777<');
    expect(svg).toContain('>7<'); // 2019-02-03 to 2026-06-10 is seven full years
    expect(svg).toContain('Adventuring since 2019');
  });

  it('gives a quest with no description no invented one', () => {
    const svg = svgOf('sheet');
    expect(svg).toContain('The first one');
    expect(svg).not.toContain('untold');
  });

  it('writes nothing about years when the dates are unusable', () => {
    const svg = svgOf('sheet', { ...profile, createdAt: 'nonsense', fetchedAt: undefined });
    expect(svg).not.toContain('Adventuring since');
    expect(svg).not.toContain('>YEARS<');
    expect(wellFormed(svg)).toEqual([]);
  });
});

describe('wall calendar', () => {
  it('shows the month the contribution data ends in', () => {
    expect(calendarMonth(profile)).toMatchObject({ year: 2026, month: 5 });
    expect(svgOf('calendar')).toContain('>JUNE<');
  });

  it('shows each real count on its own day, and nothing on a quiet one', () => {
    const svg = svgOf('calendar');
    // The last five days of data are 4, 0, 7, 0, 1 and end on 2026-06-10.
    const counts = [...svg.matchAll(/class="mono"[^>]*text-anchor="end" font-weight="700">(\d+)<\/text>/g)].map((m) => Number(m[1]));
    expect(counts.sort()).toEqual([1, 4, 7]);
  });

  it('adds up the month from the real days', () => {
    expect(svgOf('calendar')).toContain('12 contributions this month');
    expect(svgOf('calendar')).toContain('3 active days this month');
  });

  it('draws a plain calendar, with no colours and no totals, when activity is switched off', () => {
    const svg = svgOf('calendar', profile, ['stats']);
    expect(svg).not.toContain('contributions this month');
    expect(svg.match(/class="mono"[^>]*text-anchor="end"/g)).toBeNull();
  });

  it('says it is waiting for data, and draws no month, when there is no date at all', () => {
    const bare = { ...profile, fetchedAt: undefined, contributions: undefined };
    const svg = svgOf('calendar', bare);
    expect(svg).toContain('after the first automatic update');
    expect(wellFormed(svg)).toEqual([]);
  });

  it('marks days before the data begins as unknown rather than as empty', () => {
    const early = { ...profile, contributions: buildContributions(days('2026-06-05', [1, 2, 3, 4, 5, 6])) };
    expect(svgOf('calendar', early)).toContain('stroke-dasharray="3 3"');
  });
});

describe('hostile text', () => {
  const evil = '</text><script>alert(1)</script>"&';
  const hostile = { ...profile, name: evil, login: 'octo', location: evil, bio: evil, topRepos: [{ ...profile.topRepos[0]!, name: evil, description: evil }] };
  it.each(['passport', 'receipt', 'sheet', 'calendar'])('%s escapes everything it is given', (id) => {
    const svg = svgOf(id, hostile);
    expect(svg).not.toContain('<script');
    expect(wellFormed(svg)).toEqual([]);
  });
});
