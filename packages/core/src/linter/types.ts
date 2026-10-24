import type { Doc } from './scan';

export type Severity = 'error' | 'warning' | 'tip';

/** One problem a rule found. `line` counts from 0 in the text the rule was given. */
export interface Finding {
  line: number;
  message: string;
  /** True when only the author can fix it. Otherwise the rule's `fix` repairs it. */
  manual?: boolean;
}

export interface Rule {
  id: string;
  title: string;
  severity: Severity;
  check(doc: Doc): Finding[];
  /** The document with every fixable finding of this rule repaired. Leave out for rules that only report. */
  fix?(doc: Doc): string[];
}
