import { buildContributions, computeWrapped, lintReadme, type ContributionDay, type Profile } from '@livebio/core';
import { describe, expect, it } from 'vitest';
import { describeFailure, lintActions, lintSummary, wrappedFacts } from './summary';

const day = (date: string, count: number): ContributionDay => ({ date, count, level: (count === 0 ? 0 : Math.min(4, Math.ceil(count / 3))) as 0 | 1 | 2 | 3 | 4 });
const profile = (days: ContributionDay[]): Profile => ({
  login: 'octo',
  name: 'Octo Cat',
  avatarUrl: 'https://avatars.example/octo',
  bio: null,
  company: null,
  location: null,
  website: null,
  url: 'https://github.com/octo',
  followers: 3,
  following: 1,
  publicRepos: 2,
  totalStars: 5,
  createdAt: '2020-01-01T00:00:00Z',
  languages: [],
  topRepos: [],
  contributions: buildContributions(days),
});

describe('lintSummary', () => {
  it('says a clean README is clean', () => {
    expect(lintSummary(lintReadme('# Title\n\nHello.\n'))).toBe('Nothing to fix. This README looks clean.');
  });
  it('counts what it found and how much is fixed', () => {
    const result = lintReadme('#Title\n\n[x]()\n');
    const line = lintSummary(result);
    expect(line).toContain('error');
    expect(line).toMatch(/fixed in the corrected version, \d+ need/);
    expect(line.endsWith('.')).toBe(true);
  });
  it('uses singular and plural correctly, and "and" before the last', () => {
    const base = { issues: [{}] as never };
    expect(lintSummary({ ...base, counts: { error: 1, warning: 0, tip: 0, fixed: 1, manual: 0 } })).toBe('1 error: all fixed in the corrected version.');
    expect(lintSummary({ ...base, counts: { error: 2, warning: 1, tip: 10, fixed: 12, manual: 1 } })).toBe('2 errors, 1 warning and 10 tips: 12 fixed in the corrected version, 1 needs you.');
    expect(lintSummary({ ...base, counts: { error: 0, warning: 2, tip: 0, fixed: 0, manual: 2 } })).toBe('2 warnings: 2 need you.');
    expect(lintSummary({ ...base, counts: { error: 0, warning: 1, tip: 1, fixed: 0, manual: 2 } })).toBe('1 warning and 1 tip: 2 need you.');
  });
});

describe('wrappedFacts', () => {
  it('states the real headline numbers', () => {
    const data = computeWrapped(profile([day('2026-03-01', 2), day('2026-03-02', 9), day('2026-03-03', 0), day('2026-03-04', 1)]))!;
    const facts = new Map(wrappedFacts(data));
    expect(facts.get('Contributions')).toBe('12');
    expect(facts.get('Active days')).toBe('3 (75%)');
    expect(facts.get('Longest streak')).toBe('2 days');
    expect(facts.get('Busiest day')).toBe('9 on Mar 2, 2026');
    expect(facts.get('Busiest month')).toBe('March');
  });
  it('leaves out a streak, a busiest day and a busiest month the data does not have', () => {
    const data = computeWrapped(profile([day('2026-03-01', 0), day('2026-03-02', 0)]))!;
    const labels = wrappedFacts(data).map(([l]) => l);
    expect(labels).toEqual(['Contributions', 'Active days']);
  });
  it('says 1 day, not 1 days', () => {
    const data = computeWrapped(profile([day('2026-03-01', 4), day('2026-03-02', 0)]))!;
    expect(new Map(wrappedFacts(data)).get('Longest streak')).toBe('1 day');
  });
});

describe('describeFailure', () => {
  it('turns each kind of failure into something a person can act on', () => {
    expect(describeFailure({ kind: 'not-found' }, 'ghost')).toBe('There is no GitHub user called @ghost.');
    expect(describeFailure({ kind: 'invalid-username' }, 'x')).toBe('That is not a GitHub username.');
    expect(describeFailure({ kind: 'rate-limit' }, 'x')).toContain('busy');
    expect(describeFailure({ kind: 'network' }, 'x')).toContain('Could not reach');
  });
  it('has a plain answer for anything else, and never shows internals', () => {
    for (const e of [new Error('ECONNRESET at 10.0.0.1'), 'boom', null, undefined, { kind: 'weird' }]) {
      const text = describeFailure(e, 'x');
      expect(text).toContain('Something went wrong');
      expect(text).not.toMatch(/ECONNRESET|10\.0|boom/);
    }
  });
});

describe('lintActions', () => {
  it('switches nothing off when there is corrected text to use', () => {
    expect(lintActions(true, false).map((a) => [a.id, a.disabled])).toEqual([['copy', false], ['download', false]]);
    expect(lintActions(true, true).map((a) => [a.id, a.disabled])).toEqual([['copy', false], ['download', false], ['replace', false]]);
  });
  it('switches every button off when the check found nothing it could correct', () => {
    for (const canReplace of [false, true]) for (const action of lintActions(false, canReplace)) expect(action.disabled, action.id).toBe(true);
  });
  it('offers to replace the editor text only where there is an editor', () => {
    expect(lintActions(true, false).map((a) => a.id)).not.toContain('replace');
    expect(lintActions(true, true).map((a) => a.id)).toContain('replace');
  });
  it('says what each button does', () => {
    expect(lintActions(true, true).map((a) => a.label)).toEqual(['Copy corrected text', 'Download', 'Replace the editor text']);
  });
});

describe('describeFailure: no calendar', () => {
  it('says what happened and what to do', () => {
    const text = describeFailure({ kind: 'no-calendar' }, 'octo');
    expect(text).toContain('@octo');
    expect(text).toContain('contribution calendar');
    expect(text).toContain('Try again');
  });
});
