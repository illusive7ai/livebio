import { describe, expect, it } from 'vitest';
import { diffLines } from './diff';

const kinds = (a: string, b: string) => diffLines(a, b).map((r) => `${r.kind === 'same' ? ' ' : r.kind === 'add' ? '+' : '-'}${r.text}`);

describe('diffLines', () => {
  it('shows nothing changed for equal texts', () => {
    expect(kinds('a\nb\n', 'a\nb\n')).toEqual([' a', ' b']);
    expect(kinds('', '')).toEqual([]);
  });

  it('shows added and removed lines in place', () => {
    expect(kinds('a\nb\nc\n', 'a\nx\nb\nc\n')).toEqual([' a', '+x', ' b', ' c']);
    expect(kinds('a\nb\nc\n', 'a\nc\n')).toEqual([' a', '-b', ' c']);
    expect(kinds('a\nb\n', 'a\nB\n')).toEqual([' a', '-b', '+B']);
  });

  it('handles texts that are entirely new or entirely gone', () => {
    expect(kinds('', 'a\nb\n')).toEqual(['+a', '+b']);
    expect(kinds('a\nb\n', '')).toEqual(['-a', '-b']);
  });

  it('numbers lines from 1 in each text', () => {
    const rows = diffLines('a\nb\nc\n', 'a\nx\nc\n');
    expect(rows).toEqual([
      { kind: 'same', text: 'a', oldLine: 1, newLine: 1 },
      { kind: 'remove', text: 'b', oldLine: 2 },
      { kind: 'add', text: 'x', newLine: 2 },
      { kind: 'same', text: 'c', oldLine: 3, newLine: 3 },
    ]);
  });

  it('keeps the shared lines when text moves', () => {
    const rows = diffLines('1\n2\n3\n4\n', '1\n3\n4\n5\n');
    expect(rows.filter((r) => r.kind === 'same').map((r) => r.text)).toEqual(['1', '3', '4']);
  });

  it('rebuilds both texts from its rows', () => {
    const cases: Array<[string, string]> = [
      ['a\nb\nc\nd\n', 'a\nc\nd\ne\n'],
      ['x\n\n\ny\n', 'x\n\ny\n'],
      ['one\n', 'two\nthree\n'],
      ['a\na\na\n', 'a\na\n'],
    ];
    for (const [before, after] of cases) {
      const rows = diffLines(before, after);
      expect(rows.filter((r) => r.kind !== 'add').map((r) => r.text)).toEqual(before.replace(/\n$/, '').split('\n'));
      expect(rows.filter((r) => r.kind !== 'remove').map((r) => r.text)).toEqual(after.replace(/\n$/, '').split('\n'));
    }
  });

  it('copes with very large changes without building a huge table', () => {
    const a = Array.from({ length: 3000 }, (_v, i) => `old ${i}`).join('\n');
    const b = Array.from({ length: 3000 }, (_v, i) => `new ${i}`).join('\n');
    const started = Date.now();
    const rows = diffLines(a, b);
    expect(rows).toHaveLength(6000);
    expect(Date.now() - started).toBeLessThan(2000);
  });
});
