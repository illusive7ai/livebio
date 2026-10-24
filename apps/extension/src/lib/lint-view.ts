import type { LintIssue, LintResult } from '@livebio/core';
import { clear, h } from './dom';
import { downloadText } from './image';
import { lintActions, lintSummary, type LintAction } from './summary';

const LABEL: Record<LintIssue['severity'], string> = { error: 'Error', warning: 'Warning', tip: 'Tip' };
const SHOWN = 40;

export interface LintViewOptions {
  /** The name to save the corrected text under. */
  fileName: string;
  /** Puts the corrected text into the editor on the page, and says whether it worked. Left out where there is no editor. */
  replace?: (text: string) => boolean;
}

/** Shows what a README check found, issue by issue, and what to do with the corrected text. */
export function renderLint(root: HTMLElement, result: LintResult, options: LintViewOptions): void {
  clear(root);
  const note = h('p', { class: 'note', attrs: { role: 'status', 'aria-live': 'polite' } });
  const say = (text: string) => {
    note.textContent = text;
  };

  root.append(h('p', { class: result.issues.length === 0 ? 'good' : 'summary', text: lintSummary(result) }));

  if (result.issues.length > 0) {
    const list = h('ul', { class: 'issues' });
    const draw = (all: boolean) => {
      clear(list);
      for (const issue of all ? result.issues : result.issues.slice(0, SHOWN)) {
        list.append(
          h(
            'li',
            { class: `issue sev-${issue.severity}` },
            h('div', { class: 'issue-head' }, h('span', { class: `badge sev-${issue.severity}`, text: LABEL[issue.severity] }), h('strong', { text: issue.title }), h('span', { class: 'where', text: issue.line > 0 ? `Line ${issue.line}` : 'Whole file' }), h('span', { class: issue.fixed ? 'fix yes' : 'fix no', text: issue.fixed ? 'Fixed in the corrected text' : 'Needs you' })),
            h('p', { text: issue.message }),
          ),
        );
      }
      if (!all && result.issues.length > SHOWN) {
        list.append(h('li', { class: 'more' }, h('button', { class: 'link', text: `Show all ${result.issues.length} issues`, on: { click: () => draw(true) } })));
      }
    };
    draw(false);
    root.append(list);
  }

  const actions = h('div', { class: 'row' });
  const replace = options.replace;
  const run: Record<LintAction['id'], () => void> = {
    copy: () => {
      navigator.clipboard
        .writeText(result.corrected)
        .then(() => say('Copied. Paste it where you want it.'))
        .catch(() => say('Could not copy. Use Download instead.'));
    },
    download: () => {
      downloadText(options.fileName, result.corrected);
      say('Saved.');
    },
    replace: () => say(replace?.(result.corrected) ? 'Done. Look it over, then commit.' : 'The editor would not take it. Use Copy corrected text instead.'),
  };
  for (const action of lintActions(result.changed, replace !== undefined)) {
    // A button is switched off by having the attribute at all, even an empty one, so it is added only when it should be off.
    const button = h('button', { class: action.id === 'copy' ? 'primary' : '', text: action.label, on: { click: run[action.id] } });
    if (action.disabled) button.setAttribute('disabled', '');
    if (action.id === 'replace') button.title = 'Puts the corrected text into the editor. You can still undo, and nothing is saved until you commit.';
    actions.append(button);
  }
  root.append(actions, note, h('p', { class: 'fine', text: result.changed ? 'Nothing is uploaded: this check ran in your browser.' : 'There was nothing to correct automatically. This check ran in your browser.' }));
}
