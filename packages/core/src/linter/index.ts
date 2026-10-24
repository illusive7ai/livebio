import { linkRules } from './rules-links';
import { textRules } from './rules-text';
import { parseDoc } from './scan';
import type { Rule, Severity } from './types';

export type { Severity } from './types';

export interface LintIssue {
  rule: string;
  title: string;
  severity: Severity;
  /** Counts from 1. 0 for a problem with the file as a whole. */
  line: number;
  message: string;
  /** True when the corrected version already repairs this. False when only the author can. */
  fixed: boolean;
}

export interface LintResult {
  issues: LintIssue[];
  /** The README with every automatic repair applied. The same text when nothing could be repaired. */
  corrected: string;
  changed: boolean;
  counts: { error: number; warning: number; tip: number; fixed: number; manual: number };
}

const RULES: Rule[] = [...linkRules, ...textRules];

/** The order repairs run in. Earlier ones can create work for later ones, such as a blank line a heading then needs. */
const FIX_ORDER = [
  'invisible-characters',
  'tabs',
  'link-space',
  'link-reversed',
  'link-address-spaces',
  'insecure-http',
  'image-blob-address',
  'image-alt',
  'html-deprecated',
  'bold-spaces',
  'brand-names',
  'spelling',
  'repeated-word',
  'html-markdown-block',
  'setext-trap',
  'heading-space',
  'heading-closing-hashes',
  'table',
  'list-marker',
  'unclosed-code-fence',
  'trailing-space',
  'blank-around-headings',
  'blank-lines',
];

const FIXERS = FIX_ORDER.map((id) => RULES.find((r) => r.id === id)).filter((r): r is Rule & Required<Pick<Rule, 'fix'>> => r?.fix !== undefined);

const RANK: Record<Severity, number> = { error: 0, warning: 1, tip: 2 };

export const RULE_TITLES: Record<string, string> = Object.fromEntries([...RULES.map((r) => [r.id, r.title] as const), ['line-endings', 'Mixed or Windows line endings'], ['byte-order-mark', 'Hidden mark at the start of the file'], ['final-newline', 'No new line at the end']]);

/** Reads a README, reports everything wrong with it, and returns a corrected copy. Nothing is sent anywhere. */
export function lintReadme(input: string): LintResult {
  const issues: LintIssue[] = [];
  let text = input;

  if (text.charCodeAt(0) === 0xfeff) {
    issues.push({ rule: 'byte-order-mark', title: RULE_TITLES['byte-order-mark']!, severity: 'warning', line: 1, message: 'The file starts with a hidden byte-order mark, which can show as a stray character or stop the first heading from rendering.', fixed: true });
    text = text.slice(1);
  }
  if (/\r/.test(text)) {
    issues.push({ rule: 'line-endings', title: RULE_TITLES['line-endings']!, severity: 'tip', line: 0, message: 'The file uses Windows (CRLF) or old Mac line endings. The corrected version uses plain new lines, which GitHub and git prefer.', fixed: true });
    text = text.replace(/\r\n?/g, '\n');
  }
  const hasFinalNewline = text.endsWith('\n');
  const lines = (hasFinalNewline ? text.slice(0, -1) : text).split('\n');
  if (!hasFinalNewline && text.trim() !== '') {
    issues.push({ rule: 'final-newline', title: RULE_TITLES['final-newline']!, severity: 'tip', line: lines.length, message: 'The file does not end with a new line.', fixed: true });
  }

  const doc = parseDoc(lines);
  for (const rule of RULES) {
    for (const finding of rule.check(doc)) {
      issues.push({ rule: rule.id, title: rule.title, severity: rule.severity, line: finding.line + 1, message: finding.message, fixed: !finding.manual && rule.fix !== undefined });
    }
  }
  issues.sort((a, b) => RANK[a.severity] - RANK[b.severity] || a.line - b.line || a.rule.localeCompare(b.rule));

  let current = lines;
  for (let pass = 0; pass < 4; pass++) {
    const before = current.join('\n');
    for (const rule of FIXERS) current = rule.fix(parseDoc(current));
    if (current.join('\n') === before) break;
  }
  while (current.length > 0 && current[current.length - 1]!.trim() === '') current = current.slice(0, -1);
  const corrected = current.length === 0 ? '' : `${current.join('\n')}\n`;

  const counts = { error: 0, warning: 0, tip: 0, fixed: 0, manual: 0 };
  for (const issue of issues) {
    counts[issue.severity]++;
    counts[issue.fixed ? 'fixed' : 'manual']++;
  }
  return { issues, corrected, changed: corrected !== input, counts };
}
