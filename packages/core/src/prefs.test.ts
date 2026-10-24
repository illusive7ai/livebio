import { describe, expect, it } from 'vitest';
import { MAX_FAVOURITES, MAX_RECENT, emptyPrefs, isFavourite, noteUsed, parsePrefs, toggleFavourite } from './prefs';
import { templates } from './templates';

const known = (id: string) => ['a', 'b', 'c', 'd'].includes(id);

describe('favourites', () => {
  it('adds a design at the front and removes it on a second press', () => {
    const one = toggleFavourite(emptyPrefs(), 'a');
    const two = toggleFavourite(one, 'b');
    expect(two.favourites).toEqual(['b', 'a']);
    expect(isFavourite(two, 'a')).toBe(true);
    const gone = toggleFavourite(two, 'a');
    expect(gone.favourites).toEqual(['b']);
    expect(isFavourite(gone, 'a')).toBe(false);
  });

  it('never changes the object it was given', () => {
    const start = emptyPrefs();
    toggleFavourite(start, 'a');
    noteUsed(start, 'a');
    expect(start).toEqual({ favourites: [], recent: [] });
  });

  it('keeps no more than the limit, dropping the oldest', () => {
    let prefs = emptyPrefs();
    for (let i = 0; i < MAX_FAVOURITES + 5; i++) prefs = toggleFavourite(prefs, `d${i}`);
    expect(prefs.favourites).toHaveLength(MAX_FAVOURITES);
    expect(prefs.favourites[0]).toBe(`d${MAX_FAVOURITES + 4}`);
    expect(prefs.favourites).not.toContain('d0');
  });
});

describe('recent designs', () => {
  it('puts the latest first and lists each design once', () => {
    let prefs = emptyPrefs();
    for (const id of ['a', 'b', 'c', 'a']) prefs = noteUsed(prefs, id);
    expect(prefs.recent).toEqual(['a', 'c', 'b']);
  });

  it('returns the same object when the design already leads', () => {
    const prefs = noteUsed(emptyPrefs(), 'a');
    expect(noteUsed(prefs, 'a')).toBe(prefs);
  });

  it('keeps no more than the limit', () => {
    let prefs = emptyPrefs();
    for (let i = 0; i < MAX_RECENT + 4; i++) prefs = noteUsed(prefs, `d${i}`);
    expect(prefs.recent).toHaveLength(MAX_RECENT);
    expect(prefs.recent[0]).toBe(`d${MAX_RECENT + 3}`);
  });
});

describe('reading stored preferences', () => {
  it('keeps good entries and drops unknown, repeated and non-text ones', () => {
    const prefs = parsePrefs({ favourites: ['a', 'zzz', 'a', 3, null, 'b'], recent: ['c', 'c', {}, 'd'] }, known);
    expect(prefs).toEqual({ favourites: ['a', 'b'], recent: ['c', 'd'] });
  });

  it.each([null, undefined, 'text', 7, [], { favourites: 'a', recent: 5 }])('gives empty preferences for %j', (raw) => {
    expect(parsePrefs(raw, known)).toEqual(emptyPrefs());
  });

  it('applies the limits to stored lists too', () => {
    const ids = Array.from({ length: 200 }, (_v, i) => `d${i}`);
    const prefs = parsePrefs({ favourites: ids, recent: ids }, () => true);
    expect(prefs.favourites).toHaveLength(MAX_FAVOURITES);
    expect(prefs.recent).toHaveLength(MAX_RECENT);
  });

  it('forgets a design that has since been removed', () => {
    const real = templates[0]!.id;
    const prefs = parsePrefs({ favourites: [real, 'gone-design'] }, (id) => templates.some((t) => t.id === id));
    expect(prefs.favourites).toEqual([real]);
  });
});
