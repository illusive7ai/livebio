import { describe, expect, it } from 'vitest';
import { buildContributions } from './contributions';
import { arcPath, barcode, clockOf, coverLines, darkness, frameWidth, monthFrames, notices, tornEdge } from './templates/print';
import { bare, profile, svgOf, wellFormed, year } from './testkit';
import type { ContributionDay, Profile } from './types';

const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
const withPicture: Profile = { ...profile, avatar: { dataUri: PNG, grid: { width: 1, height: 1, luma: [128], alpha: [255] } } };
const ALL = new Set(['stats', 'activity', 'languages', 'projects', 'city', 'game']);
const only = (...keep: string[]) => new Set(keep);
const day = (date: string, count: number): ContributionDay => ({ date, count, level: (count === 0 ? 0 : Math.min(4, Math.ceil(count / 3))) as 0 | 1 | 2 | 3 | 4 });

describe('zine cover lines', () => {
  it('are real facts, the most starred project first', () => {
    const lines = coverLines(profile, ALL);
    expect(lines).toContain('777 STARS AND COUNTING');
    expect(lines).toContain('1,234 PEOPLE ARE FOLLOWING');
    expect(lines).toContain('INSIDE: ALPHA (★ 500)');
    expect(lines).toContain('PLUS: GO, RUST, ZIG');
    expect(lines).toContain('23 PROJECTS, ALL PUBLIC');
  });

  it('leave out whatever is switched off or missing', () => {
    expect(coverLines(profile, only('languages', 'projects')).join('|')).not.toMatch(/STARS|FOLLOWING|PROJECTS, ALL/);
    expect(coverLines(profile, only('stats', 'languages')).join('|')).not.toContain('INSIDE');
    expect(coverLines(profile, only('stats', 'projects')).join('|')).not.toContain('PLUS');
    expect(coverLines({ ...profile, publicRepos: 0 }, ALL).join('|')).not.toContain('PROJECTS, ALL');
    expect(coverLines({ ...profile, topRepos: [] }, ALL).join('|')).not.toContain('INSIDE');
    expect(coverLines(profile, only())).toEqual([]);
  });

  it('writes no star count after a project nobody has starred', () => {
    const lines = coverLines({ ...profile, topRepos: [{ ...profile.topRepos[0]!, stars: 0 }] }, only('projects'));
    expect(lines).toEqual(['INSIDE: ALPHA']);
  });
});

describe('barcode', () => {
  it('is the same for the same login and differs for another', () => {
    expect(barcode('octo')).toEqual(barcode('octo'));
    expect(barcode('octo')).not.toEqual(barcode('hubot'));
  });
  it('has the number of bars asked for, each 1 to 4 wide', () => {
    expect(barcode('octo')).toHaveLength(38);
    expect(barcode('octo', 10)).toHaveLength(10);
    for (const b of barcode('octo', 200)) {
      expect(b).toBeGreaterThanOrEqual(1);
      expect(b).toBeLessThanOrEqual(4);
    }
  });
});

describe('torn edge', () => {
  it('runs evenly across the width and wanders only as far as asked', () => {
    const points = tornEdge('octo', 100, 50, 200, 5, 10);
    expect(points).toHaveLength(11);
    expect(points[0]![0]).toBe(100);
    expect(points[10]![0]).toBe(300);
    points.forEach(([x, y], i) => {
      expect(x).toBeCloseTo(100 + 20 * i, 6);
      expect(Math.abs(y - 50)).toBeLessThanOrEqual(5);
    });
  });
  it('is repeatable, and different from another edge', () => {
    expect(tornEdge('octo', 0, 0, 100, 4)).toEqual(tornEdge('octo', 0, 0, 100, 4));
    expect(tornEdge('octo', 0, 0, 100, 4)).not.toEqual(tornEdge('octo', 0, 90, 100, 4));
  });
});

describe('zine cover', () => {
  it('names the real person, the real dates and says it is free', () => {
    const svg = svgOf('zine', withPicture);
    expect(svg).toContain('OCTO CAT');
    expect(svg).toContain('ON GITHUB SINCE 2019');
    expect(svg).toContain('EDITION OF JUN 2026');
    expect(svg).toContain('PRICE: FREE');
    expect([...svg.matchAll(/height="38" fill="#111"/g)]).toHaveLength(38);
  });
  it('writes no date it does not have', () => {
    const svg = svgOf('zine', { ...withPicture, createdAt: 'nonsense', fetchedAt: undefined });
    expect(svg).not.toContain('SINCE');
    expect(svg).not.toContain('EDITION');
    // A real account age is no stand-in for the date the data was read.
    const noRead = svgOf('zine', { ...withPicture, fetchedAt: undefined });
    expect(noRead).toContain('SINCE 2019');
    expect(noRead).not.toContain('EDITION');
  });
});

describe('contact sheet months', () => {
  const days = (...months: Array<[string, number]>) => months.flatMap(([m, n]) => [day(`${m}-01`, n), day(`${m}-02`, 0)]);

  it('keeps the last twelve months, oldest first, with real totals', () => {
    const many = Array.from({ length: 15 }, (_v, i) => [`${2025 + Math.floor((i + 3) / 12)}-${String(((i + 3) % 12) + 1).padStart(2, '0')}`, i] as [string, number]);
    const frames = monthFrames(days(...many));
    expect(frames).toHaveLength(12);
    expect(frames[0]!.key).toBe(many[3]![0]);
    expect(frames[11]!.key).toBe(many[14]![0]);
    expect(frames.map((f) => f.total)).toEqual(many.slice(3).map(([, n]) => n));
  });

  it('exposes the busiest month fully and the others in proportion', () => {
    const frames = monthFrames(days(['2026-01', 10], ['2026-02', 5], ['2026-03', 0]));
    expect(frames.map((f) => f.exposure)).toEqual([1, 0.5, 0]);
    expect(frames.map((f) => f.label)).toEqual(['JAN', 'FEB', 'MAR']);
  });

  it('exposes nothing when no month had anything, and copes with no days', () => {
    expect(monthFrames(days(['2026-01', 0], ['2026-02', 0])).map((f) => f.exposure)).toEqual([0, 0]);
    expect(monthFrames([])).toEqual([]);
  });

  it('covers a frame with less black the busier the month', () => {
    expect(darkness(1)).toBe(0);
    expect(darkness(0)).toBe(0.7);
    const values = [0, 0.1, 0.4, 0.8, 1].map(darkness);
    expect(values).toEqual([...values].sort((a, b) => b - a));
    expect(darkness(-3)).toBe(0.7);
    expect(darkness(9)).toBe(0);
    expect(darkness(0.25)).toBeCloseTo(0.35, 3);
  });

  it('circles only the busiest month, and none when there was nothing', () => {
    const busy = { ...withPicture, contributions: buildContributions(days(['2026-01', 4], ['2026-02', 9], ['2026-03', 2])) };
    expect([...svgOf('contact', busy).matchAll(/<ellipse/g)]).toHaveLength(1);
    expect(svgOf('contact', busy)).toContain('>1  JAN<');
    expect(svgOf('contact', busy)).toContain('>9 contributions<');
    expect(svgOf('contact', busy)).toContain('>2 contributions<');
    expect(svgOf('contact', { ...withPicture, contributions: buildContributions([day('2026-01-01', 1), day('2026-02-01', 0)]) })).toContain('>1 contribution<');
    const quiet = { ...withPicture, contributions: buildContributions(days(['2026-01', 0], ['2026-02', 0])) };
    expect(svgOf('contact', quiet)).not.toContain('<ellipse');
  });

  it('waits, and says why, with no calendar or with the section off', () => {
    expect(svgOf('contact', { ...withPicture, contributions: undefined })).toContain('after the first automatic update');
    expect(svgOf('contact', withPicture, ['stats'])).toContain('switched off');
    expect([...svgOf('contact', { ...withPicture, contributions: undefined }).matchAll(/<ellipse/g)]).toHaveLength(0);
  });
});

describe('museum frames', () => {
  it('grow with stars on a log scale and stay within their limits', () => {
    expect(frameWidth(0, 500)).toBe(84);
    expect(frameWidth(500, 500)).toBe(116);
    expect(frameWidth(900, 500)).toBe(116);
    expect(frameWidth(5, 0)).toBe(84);
    const widths = [1, 5, 20, 100, 500].map((s) => frameWidth(s, 500));
    expect(widths).toEqual([...widths].sort((a, b) => a - b));
    expect(frameWidth(50, 500)).toBeGreaterThan(frameWidth(50, 5000));
    // On a log scale 50 of 500 stars is already most of the way up; on a straight line it would be near the bottom.
    expect(frameWidth(50, 500)).toBe(104);
    expect(frameWidth(5, 500)).toBe(93);
  });

  it('hangs the self-portrait and up to four real works, with labels', () => {
    const svg = svgOf('museum', withPicture);
    expect(svg).toContain('Self-portrait');
    expect(svg).toContain('On GitHub since 2019');
    for (const name of ['alpha', 'beta', 'gamma', 'delta']) expect(svg).toContain(`>${name}<`);
    expect(svg).not.toContain('>epsilon<');
    expect(svg).toContain('Mixed media');
    expect(svg).toContain('Rust  ·  ★ 200');
  });

  it('stays inside the wall however many stars one project has', () => {
    const big: Profile = { ...withPicture, topRepos: profile.topRepos.map((r) => ({ ...r, stars: 90_000 })) };
    const xs = [...svgOf('museum', big).matchAll(/<rect x="(-?[\d.]+)" y="[\d.]+" width="([\d.]+)" height="[\d.]+" fill="#(?:b89a5e|7a5a24)"/g)].map((m) => [Number(m[1]), Number(m[2])] as const);
    expect(xs).toHaveLength(5);
    for (const [x, w] of xs) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x + w).toBeLessThanOrEqual(900);
    }
  });

  it('hangs only the portrait when projects are off', () => {
    const svg = svgOf('museum', withPicture, ['stats']);
    expect(svg).toContain('Self-portrait');
    expect(svg).not.toContain('>alpha<');
    expect(svg).toContain('Switch on Top projects');
  });
});

describe('mission patch', () => {
  it('lays text along the upper arc and the lower arc', () => {
    expect(arcPath(450, 260, 100, true)).toBe('M350 260A100 100 0 0 1 550 260');
    expect(arcPath(450, 260, 100, false)).toBe('M350 260A100 100 0 0 0 550 260');
  });

  it('puts the handle, the year and the followers around the rim', () => {
    const svg = svgOf('patch', withPicture);
    expect(svg).toContain('>@OCTO<');
    expect(svg).toContain('ON GITHUB SINCE 2019  ·  1,234 CREW');
    expect(svg).toContain('>GO<');
    expect(svg).toContain('>Go 60%, Rust 30%, Zig</text>');
    expect(svg).toContain('>10%</text>');
  });

  it('leaves off what is missing or switched off', () => {
    expect(svgOf('patch', withPicture, ['languages'])).not.toContain('CREW');
    expect(svgOf('patch', { ...withPicture, createdAt: 'nonsense' }, ['languages'])).not.toContain('SINCE');
    expect(svgOf('patch', withPicture, ['stats'])).not.toContain('Go 60%');
  });
});

describe('lock screen', () => {
  it('lists the latest pushes first, with how long ago, from the real dates', () => {
    expect(notices(profile, ALL)).toEqual([
      { title: 'epsilon', body: 'Pushed to yesterday' },
      { title: 'alpha', body: 'Pushed to 1 week ago' },
      { title: 'gamma', body: 'Pushed to 3 weeks ago' },
      { title: '@octo', body: '777 stars · 1,234 followers' },
    ]);
  });

  it('skips a repository with no push date and never invents one', () => {
    const titles = notices(profile, only('projects'), 10).map((n) => n.title);
    expect(titles).toEqual(['epsilon', 'alpha', 'gamma', 'beta']);
    expect(titles).not.toContain('delta');
  });

  it('prefers the recently pushed list, and falls back to the top projects', () => {
    const recent: Profile = { ...profile, recentRepos: [{ ...profile.topRepos[3]!, name: 'fresh', pushedAt: '2026-06-10T07:00:00Z' }] };
    expect(notices(recent, only('projects'))).toEqual([{ title: 'fresh', body: 'Pushed to today' }]);
  });

  it('respects the limit and the switches', () => {
    expect(notices(profile, ALL, 2)).toHaveLength(2);
    expect(notices(profile, ALL, 2).at(-1)!.title).toBe('@octo');
    expect(notices(profile, only('stats'))).toHaveLength(1);
    expect(notices(profile, only('projects'), 2)).toHaveLength(2);
    expect(notices(profile, only())).toEqual([]);
  });

  it('has no repository notices when the time of the data is unknown', () => {
    expect(notices({ ...profile, fetchedAt: undefined }, only('projects'))).toEqual([]);
  });

  it('reads the clock from the data, in UTC, and refuses what it cannot read', () => {
    expect(clockOf('2026-06-10T08:05:00Z')).toEqual({ time: '08:05', date: 'Wednesday 10 June' });
    expect(clockOf('2026-06-10T23:59:59+02:00')).toEqual({ time: '21:59', date: 'Wednesday 10 June' });
    expect(clockOf(undefined)).toBeNull();
    expect(clockOf('2026-06-10')).toBeNull();
    expect(clockOf('2026-13-45T99:99:00Z')).toBeNull();
  });

  it('shows that clock, and the handle instead when there is none', () => {
    expect(svgOf('lock', withPicture)).toContain('>08:00<');
    expect(svgOf('lock', withPicture)).toContain('Wednesday 10 June');
    const none = svgOf('lock', { ...withPicture, fetchedAt: undefined });
    expect(none).not.toContain('UTC)');
    expect(none).toContain('>@octo<');
  });
});

describe('every print design', () => {
  const ids = ['zine', 'contact', 'museum', 'patch', 'lock'];
  it.each(ids)('%s draws for hostile, bare and picture-less profiles in both modes', (id) => {
    const hostile: Profile = { ...withPicture, name: '</text><script>x</script>"&', bio: '</text>', location: '"><b>', languages: [{ name: '"><b>', percent: 100 }], topRepos: [{ ...profile.topRepos[0]!, name: '</text><script>', description: '"><img src=x onerror=1>', language: '&' }] };
    const calendars = [undefined, buildContributions(year([])), buildContributions(year([5])), buildContributions(year(Array.from({ length: 300 }, (_v, i) => i % 7)))];
    for (const variant of ['dark', 'light'] as const) {
      for (const p of [hostile, withPicture, profile, bare]) {
        for (const contributions of calendars) {
          const svg = svgOf(id, { ...p, contributions }, undefined, variant);
          expect(wellFormed(svg), id).toEqual([]);
          expect(svg).not.toContain('<script>');
          expect(svg).not.toMatch(/NaN|undefined|Infinity/);
        }
      }
    }
  });
});
