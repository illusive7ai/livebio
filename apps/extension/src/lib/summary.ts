import { formatNumber, longDate, type LintResult, type WrappedData } from '@livebio/core';

const plural = (n: number, one: string, many: string): string => `${formatNumber(n)} ${n === 1 ? one : many}`;

/** One line that says what a check found: "2 errors, 4 warnings and 10 tips: 16 fixed below, 2 need you." */
export function lintSummary(result: Pick<LintResult, 'counts' | 'issues'>): string {
  if (result.issues.length === 0) return 'Nothing to fix. This README looks clean.';
  const { error, warning, tip, fixed, manual } = result.counts;
  const found = [error > 0 ? plural(error, 'error', 'errors') : null, warning > 0 ? plural(warning, 'warning', 'warnings') : null, tip > 0 ? plural(tip, 'tip', 'tips') : null].filter((v): v is string => v !== null);
  const list = found.length > 1 ? `${found.slice(0, -1).join(', ')} and ${found[found.length - 1]}` : found[0]!;
  const rest = manual === 0 ? 'all fixed in the corrected version' : fixed === 0 ? `${manual} need${manual === 1 ? 's' : ''} you` : `${fixed} fixed in the corrected version, ${manual} need${manual === 1 ? 's' : ''} you`;
  return `${list}: ${rest}.`;
}

/** The headline numbers of a Wrapped card as label and value pairs, leaving out any the data cannot back up. */
export function wrappedFacts(data: WrappedData): Array<[string, string]> {
  const facts: Array<[string, string]> = [['Contributions', formatNumber(data.total)], ['Active days', `${formatNumber(data.activeDays)} (${data.activePercent}%)`]];
  if (data.longestStreak) facts.push(['Longest streak', plural(data.longestStreak.length, 'day', 'days')]);
  if (data.busiestDay) facts.push(['Busiest day', `${formatNumber(data.busiestDay.count)} on ${longDate(data.busiestDay.date)}`]);
  if (data.busiestMonth) facts.push(['Busiest month', data.busiestMonth.label]);
  return facts;
}

export interface LintAction {
  id: 'copy' | 'download' | 'replace';
  label: string;
  /** True when there is nothing to do: the check found nothing it could correct. */
  disabled: boolean;
}

/** The buttons under a check, and which of them are switched off. Every one needs corrected text, so all go quiet when there is none. */
export function lintActions(changed: boolean, canReplace: boolean): LintAction[] {
  const actions: LintAction[] = [
    { id: 'copy', label: 'Copy corrected text', disabled: !changed },
    { id: 'download', label: 'Download', disabled: !changed },
  ];
  if (canReplace) actions.push({ id: 'replace', label: 'Replace the editor text', disabled: !changed });
  return actions;
}

/** A message a person can act on, for a failure to load someone's Wrapped. */
export function describeFailure(error: unknown, login: string): string {
  const kind = typeof error === 'object' && error !== null && 'kind' in error ? String((error as { kind: unknown }).kind) : '';
  if (kind === 'not-found') return `There is no GitHub user called @${login}.`;
  if (kind === 'invalid-username') return 'That is not a GitHub username.';
  if (kind === 'no-calendar') return `GitHub did not share the contribution calendar for @${login} just now, so there is nothing to look back on. Try again in a few minutes.`;
  if (kind === 'rate-limit') return 'livebio is busy right now. Try again in a minute.';
  if (kind === 'network') return 'Could not reach the livebio server. Check your connection and try again.';
  return 'Something went wrong while loading that profile. Try again in a moment.';
}
