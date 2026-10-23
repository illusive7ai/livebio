import { describe, expect, it } from 'vitest';
import { arcPath, blipRadius, mosaicLevels, placeWords, spreadLabels, splitCircle, timelinePositions, wordBox, yearTicks, type Word } from './templates/charts';
import { bare, hostile, profile, repo, svgOf, wellFormed } from './testkit';
import type { PixelGrid, Profile } from './types';

const DAY = 86_400_000;

/** A repeatable list of made-up words, for testing the layout without depending on any one profile. */
const sample = (n: number, seed = 1): Word[] => {
  let s = seed;
  const next = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
  return Array.from({ length: n }, (_v, i) => ({ text: `word${i}${'x'.repeat(Math.floor(next() * 8))}`, size: Math.round(14 + next() * 50) }));
};

describe('blipRadius', () => {
  it('puts a very starred repository near the centre and an unstarred one near the edge', () => {
    expect(blipRadius(0, 200)).toBeCloseTo(200 * 0.84, 6);
    expect(blipRadius(1_000_000, 200)).toBeCloseTo(200 * 0.12, 6);
  });
  it('moves inwards as stars grow, and stays inside the screen', () => {
    let last = Infinity;
    for (const stars of [0, 1, 10, 100, 1000, 10_000]) {
      const r = blipRadius(stars, 200);
      expect(r).toBeLessThanOrEqual(last);
      expect(r).toBeGreaterThanOrEqual(200 * 0.12 - 1e-9);
      expect(r).toBeLessThanOrEqual(200 * 0.84 + 1e-9);
      last = r;
    }
  });
});

describe('placeWords', () => {
  it('places every word inside the box without any two overlapping', () => {
    for (const seed of [1, 2, 3]) {
      const { placed } = placeWords(sample(24, seed), 828, 360);
      for (const p of placed) {
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.x + p.w).toBeLessThanOrEqual(828);
        expect(p.y + p.h).toBeLessThanOrEqual(360);
      }
      for (let i = 0; i < placed.length; i++) {
        for (let j = i + 1; j < placed.length; j++) {
          const a = placed[i]!;
          const b = placed[j]!;
          expect(a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h, `${a.text} / ${b.text}`).toBe(false);
        }
      }
    }
  });
  it('accounts for every word: placed or dropped, never lost', () => {
    const words = sample(40, 7);
    const { placed, dropped } = placeWords(words, 400, 200);
    expect(placed.length + dropped.length).toBe(words.length);
    expect(dropped.length).toBeGreaterThan(0);
  });
  it('drops a word that is bigger than the box instead of squeezing it in', () => {
    const { placed, dropped } = placeWords([{ text: 'enormous', size: 200 }, { text: 'tiny', size: 12 }], 300, 100);
    expect(dropped.map((w) => w.text)).toEqual(['enormous']);
    expect(placed.map((w) => w.text)).toEqual(['tiny']);
  });
  it('puts the biggest word nearest the middle', () => {
    const { placed } = placeWords(sample(12, 4), 828, 360);
    const centre = (p: { x: number; y: number; w: number; h: number }) => Math.hypot(p.x + p.w / 2 - 414, p.y + p.h / 2 - 180);
    const biggest = [...placed].sort((a, b) => b.size - a.size)[0]!;
    expect(centre(biggest)).toBeLessThan(40);
  });
  it('is the same every time, whatever order the words arrive in', () => {
    const words = sample(15, 9);
    const a = placeWords(words, 828, 360);
    const b = placeWords([...words].reverse(), 828, 360);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
  it('breaks a tie between equally big words by their text, so the order they arrive in never matters', () => {
    const same: Word[] = [{ text: 'banana', size: 30 }, { text: 'apple', size: 30 }, { text: 'cherry', size: 30 }];
    expect(JSON.stringify(placeWords(same, 400, 200))).toBe(JSON.stringify(placeWords([...same].reverse(), 400, 200)));
    expect(placeWords(same, 400, 200).placed[0]!.text).toBe('apple');
  });
  it('handles nothing at all', () => {
    expect(placeWords([], 828, 360)).toEqual({ placed: [], dropped: [] });
  });
  it('gives a longer word a wider box', () => {
    expect(wordBox({ text: 'abcdefgh', size: 20 }).w).toBeGreaterThan(wordBox({ text: 'abc', size: 20 }).w);
    expect(wordBox({ text: 'abc', size: 40 }).h).toBeGreaterThan(wordBox({ text: 'abc', size: 20 }).h);
  });
});

describe('word cloud', () => {
  it('shows the repository names and the languages in capitals', () => {
    const svg = svgOf('cloud');
    for (const part of ['>alpha<', '>beta<', '>GO<', '>RUST<']) expect(svg).toContain(part);
  });
  it('sizes a repository by stars and a language by share', () => {
    const size = (svg: string, word: string) => Number(new RegExp(`font-size="(\\d+)" font-weight="\\d+" (?:letter-spacing="1" )?fill="#[0-9a-f]+">${word}<`).exec(svg)?.[1]);
    const svg = svgOf('cloud');
    expect(size(svg, 'alpha')).toBeGreaterThan(size(svg, 'epsilon'));
    expect(size(svg, 'GO')).toBeGreaterThan(size(svg, 'ZIG'));
  });
  it('says how many words did not fit, and counts every word', () => {
    const big = { ...profile, topRepos: Array.from({ length: 12 }, (_v, i) => repo(`very-long-repository-name-${i}`, 100_000 + i)), languages: Array.from({ length: 8 }, (_v, i) => ({ name: `Language${i}`, percent: 12 })) };
    const svg = svgOf('cloud', big);
    const shown = svg.match(/class="w"/g)?.length ?? 0;
    const missing = Number(/(\d+) more did not fit/.exec(svg)?.[1] ?? 0);
    expect(missing).toBeGreaterThan(0);
    expect(shown + missing).toBe(20);
  });
  it('says there are no words when both sections are off', () => {
    expect(svgOf('cloud', profile, ['stats'])).toContain('switched off');
  });
});

describe('timelinePositions and yearTicks', () => {
  const start = Date.UTC(2021, 2, 14);
  const end = Date.UTC(2026, 5, 10);
  it('places dates between 0 and 1, and gives nothing to a date outside the span or unreadable', () => {
    const [a, b, c, d, e] = timelinePositions(start, end, [start, end, start + (end - start) / 2, start - DAY, NaN]);
    expect(a).toBe(0);
    expect(b).toBe(1);
    expect(c).toBeCloseTo(0.5, 10);
    expect(d).toBeNull();
    expect(e).toBeNull();
    expect(timelinePositions(end, start, [start])).toEqual([null]);
    expect(timelinePositions(start, start, [start])).toEqual([null]);
  });
  it('finds each new year inside the span, in order', () => {
    const ticks = yearTicks(start, end);
    expect(ticks.map((t) => t.year)).toEqual([2022, 2023, 2024, 2025, 2026]);
    for (const t of ticks) {
      expect(t.at).toBeGreaterThan(0);
      expect(t.at).toBeLessThan(1);
    }
    expect(ticks.map((t) => t.at)).toEqual([...ticks.map((t) => t.at)].sort((x, y) => x - y));
    expect(yearTicks(end, start)).toEqual([]);
    expect(yearTicks(Date.UTC(2026, 1, 1), Date.UTC(2026, 5, 1))).toEqual([]);
  });
});

describe('spreadLabels', () => {
  const clear = (xs: number[], ws: number[], gap = 8) => xs.every((x, i) => i === 0 || x - xs[i - 1]! >= (ws[i]! + ws[i - 1]!) / 2 + gap - 1e-6);
  it('leaves labels that already have room exactly where they are', () => {
    expect(spreadLabels([100, 300, 500], [60, 60, 60], 0, 900)).toEqual([100, 300, 500]);
  });
  it('pushes crowded labels apart, keeping their order and leaving none overlapping', () => {
    for (const xs of [[700, 705, 710, 715], [20, 22, 24], [100, 100, 100, 100, 100], [850, 855, 860]]) {
      const ws = xs.map(() => 70);
      const out = spreadLabels(xs, ws, 40, 860);
      expect(out).toHaveLength(xs.length);
      expect(clear(out, ws), JSON.stringify(xs)).toBe(true);
      expect([...out].sort((a, b) => a - b)).toEqual(out);
    }
  });
  it('keeps crowded labels inside the bounds at the left edge and at the right edge', () => {
    const left = spreadLabels([20, 22, 24], [70, 70, 70], 40, 860);
    expect(left[0]! - 35).toBeGreaterThanOrEqual(40 - 1e-6);
    const right = spreadLabels([850, 855, 860], [70, 70, 70], 40, 860);
    expect(right[2]! + 35).toBeLessThanOrEqual(860 + 1e-6);
    expect(right[0]! - 35).toBeGreaterThanOrEqual(40 - 1e-6);
  });
  it('keeps every label inside the bounds when there is room', () => {
    const ws = [70, 70, 70];
    const out = spreadLabels([5, 400, 899], ws, 40, 860);
    expect(out[0]! - 35).toBeGreaterThanOrEqual(40 - 1e-6);
    expect(out[2]! + 35).toBeLessThanOrEqual(860 + 1e-6);
  });
  it('handles none and one', () => {
    expect(spreadLabels([], [], 0, 100)).toEqual([]);
    expect(spreadLabels([5], [40], 0, 100)).toEqual([20]);
  });
});

describe('timeline', () => {
  it('shows the real joining date and the date the data was read', () => {
    const svg = svgOf('timeline');
    expect(svg).toContain('Joined GitHub');
    expect(svg).toContain('2019-02-03');
    expect(svg).toContain('Data read');
    expect(svg).toContain('2026-06-10');
  });
  it('has a dot for each repository with a push date inside the span, and none for the others', () => {
    const svg = svgOf('timeline');
    for (const part of ['>alpha<', '>beta<', '>gamma<', '>epsilon<', '2026-06-01', '2024-01-01']) expect(svg).toContain(part);
    expect(svg).not.toContain('>delta<');
    const early = { ...profile, topRepos: [repo('ancient', 1, 'Go', null, '2015-01-01T00:00:00Z'), ...profile.topRepos] };
    expect(svgOf('timeline', early)).not.toContain('>ancient<');
  });
  it('ends on the last push when the data has no read date, and says so', () => {
    const svg = svgOf('timeline', { ...profile, fetchedAt: undefined });
    expect(svg).toContain('Last push');
    expect(svg).not.toContain('Data read');
  });
  it('says what it needs when the dates cannot be read', () => {
    expect(svgOf('timeline', { ...profile, createdAt: 'nonsense' })).toContain('needs the date the account was created');
    expect(svgOf('timeline', { ...profile, fetchedAt: undefined, topRepos: [] })).toContain('needs the date');
  });
  it('marks the years in between', () => {
    expect(svgOf('timeline')).toContain('>2023<');
  });
});

describe('splitCircle and arcPath', () => {
  it('divides the whole circle in proportion to the shares, in order', () => {
    const spans = splitCircle([{ name: 'a', share: 1 }, { name: 'b', share: 3 }]);
    expect(spans[0]).toMatchObject({ name: 'a', from: 0 });
    expect(spans[0]!.to).toBeCloseTo(Math.PI / 2, 10);
    expect(spans[1]!.to).toBeCloseTo(Math.PI * 2, 10);
    expect(spans[1]!.from).toBeCloseTo(spans[0]!.to, 10);
  });
  it('gives no arc to a share of zero, a negative or something that is not a number', () => {
    const spans = splitCircle([{ name: 'a', share: 0 }, { name: 'b', share: -4 }, { name: 'c', share: NaN }, { name: 'd', share: 2 }]);
    expect(spans.map((s) => s.name)).toEqual(['d']);
    expect(spans[0]!.to).toBeCloseTo(Math.PI * 2, 10);
    expect(splitCircle([])).toEqual([]);
    expect(splitCircle([{ name: 'a', share: 0 }])).toEqual([]);
  });
  it('draws a closed ring segment, and flags a wide one as a large arc', () => {
    const small = arcPath(0, 0, 50, 100, 0, 1);
    expect(small.startsWith('M')).toBe(true);
    expect(small.endsWith('Z')).toBe(true);
    expect(small).toContain('A100 100 0 0 1');
    expect(small).toContain('A50 50 0 0 0');
    expect(arcPath(0, 0, 50, 100, 0, 4)).toContain('A100 100 0 1 1');
  });
  it('starts straight up and runs clockwise', () => {
    expect(arcPath(0, 0, 50, 100, 0, Math.PI / 2).startsWith('M0 -100')).toBe(true);
    // From the top, a quarter turn clockwise ends on the right of the centre, not the left.
    expect(arcPath(0, 0, 50, 100, 0, Math.PI / 2)).toContain('A100 100 0 0 1 100 0L50 0');
  });
  it('copes with a full circle without producing nonsense', () => {
    const full = arcPath(0, 0, 50, 100, 0, Math.PI * 2);
    expect(full).not.toMatch(/NaN|Infinity/);
    // A full circle stops a hair short of its start, so the arc has a direction and still draws.
    expect(full).toContain('-0.01 -100');
  });
});

describe('sunburst', () => {
  it('has an inner segment for each language and an outer one for each repository on a language ring', () => {
    // Three languages, and four repositories that have one of them.
    expect(svgOf('sunburst').match(/class="seg"/g)).toHaveLength(3 + 4);
  });
  it('says how many repositories are not on a ring, and names the real languages and shares', () => {
    const svg = svgOf('sunburst');
    expect(svg).toContain('1 not on a language ring');
    for (const part of ['>Go<', '>60%<', '>30%<', '>10%<']) expect(svg).toContain(part);
  });
  it('draws no language ring, and says so, when languages are switched off', () => {
    const svg = svgOf('sunburst', profile, ['projects']);
    expect(svg).toContain('switched off');
    expect(svg.match(/class="seg"/g)).toBeNull();
  });
});

const grid = (width: number, height: number, luma: (x: number, y: number) => number, alpha: (x: number, y: number) => number = () => 255): PixelGrid => ({
  width,
  height,
  luma: Array.from({ length: width * height }, (_v, i) => luma(i % width, Math.floor(i / width))),
  alpha: Array.from({ length: width * height }, (_v, i) => alpha(i % width, Math.floor(i / width))),
});

describe('mosaicLevels', () => {
  it('averages a block of pixels into one brick and buckets its brightness', () => {
    // Left half black, right half white, shrunk to two bricks across.
    const levels = mosaicLevels(grid(4, 4, (x) => (x < 2 ? 0 : 255)), 2, 6);
    expect(levels).toEqual([[0, 5], [0, 5]]);
  });
  it('keeps every level between 0 and the highest', () => {
    for (const luma of [0, 1, 127, 128, 254, 255]) {
      const level = mosaicLevels(grid(2, 2, () => luma), 1, 6)[0]![0]!;
      expect(level).toBeGreaterThanOrEqual(0);
      expect(level).toBeLessThanOrEqual(5);
    }
    expect(mosaicLevels(grid(2, 2, () => 255), 1, 4)).toEqual([[3]]);
    expect(mosaicLevels(grid(2, 2, () => 0), 1, 4)).toEqual([[0]]);
  });
  it('buckets mid brightness into the middle level, and reads each row of the picture for its own brick row', () => {
    expect(mosaicLevels(grid(2, 2, () => 128), 1, 6)).toEqual([[3]]);
    expect(mosaicLevels(grid(4, 4, (_x, y) => (y < 2 ? 0 : 255)), 2, 6)).toEqual([[0, 0], [5, 5]]);
  });
  it('leaves a brick empty where the picture is mostly see-through', () => {
    const levels = mosaicLevels(grid(4, 4, () => 200, (x) => (x < 2 ? 255 : 0)), 2, 6);
    expect(levels).toEqual([[expect.any(Number), null], [expect.any(Number), null]]);
  });
  it('has the size asked for, even from a picture smaller than that', () => {
    const levels = mosaicLevels(grid(3, 3, () => 100), 8, 6);
    expect(levels).toHaveLength(8);
    for (const row of levels) expect(row).toHaveLength(8);
  });
});

describe('brick mosaic', () => {
  const photo = grid(32, 32, (x, y) => Math.round(255 - Math.hypot(x - 16, y - 16) * 12), (x, y) => (Math.hypot(x - 16, y - 16) < 15 ? 255 : 0));
  const withPhoto: Profile = { ...profile, avatar: { dataUri: 'data:image/png;base64,AAAA', grid: photo } };
  it('draws a brick for each part of the photo that is not see-through', () => {
    const bricks = mosaicLevels(photo, 28, 6).flat().filter((l) => l !== null).length;
    const svg = svgOf('mosaic', withPhoto);
    // Each photo brick has one stud; the stat bricks have four studs each, and are not counted here.
    expect(svg.match(/rx="2" fill="#[0-9a-f]{6}"\/><circle/g)).toHaveLength(bricks);
    expect(bricks).toBeGreaterThan(300);
  });
  it('says the photo is still to come, and draws no bricks, without one', () => {
    const svg = svgOf('mosaic');
    expect(svg).toContain('Your photo appears here once it has loaded.');
    expect(svg.match(/rx="2" fill="#[0-9a-f]{6}"\/><circle/g)).toBeNull();
  });
  it('shows the real numbers on its bricks, and none when stats are off', () => {
    const svg = svgOf('mosaic', withPhoto);
    for (const part of ['>777<', '>1,234<', '>23<']) expect(svg).toContain(part);
    expect(svgOf('mosaic', withPhoto, ['languages'])).not.toContain('>777<');
  });
  it('is the same every time', () => {
    expect(svgOf('mosaic', withPhoto)).toBe(svgOf('mosaic', withPhoto));
  });
});

describe('sonar', () => {
  it('has a blip and a row for each repository, up to six', () => {
    expect(svgOf('sonar').match(/class="blip"/g)).toHaveLength(5);
    const many = { ...profile, topRepos: Array.from({ length: 9 }, (_v, i) => repo(`r${i}`, i * 10)) };
    expect(svgOf('sonar', many).match(/class="blip"/g)).toHaveLength(6);
  });
  it('says what distance and angle mean', () => {
    expect(svgOf('sonar')).toContain('closer to the centre = more stars');
    expect(svgOf('sonar')).toContain('the angle of a blip means nothing');
  });
  it('lists the languages, wrapped so none runs off the screen', () => {
    const many = { ...profile, languages: Array.from({ length: 5 }, (_v, i) => ({ name: `Language${i}`, percent: 20 })) };
    expect(svgOf('sonar', many)).toContain('Language4 20%');
  });
  it('shows nothing on the screen, and says why, when the section is off', () => {
    expect(svgOf('sonar', profile, ['stats'])).toContain('switched off');
  });
});

describe.each(['sonar', 'cloud', 'timeline', 'sunburst', 'mosaic'])('%s', (id) => {
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
