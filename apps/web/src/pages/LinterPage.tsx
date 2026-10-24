import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { diffLines, isValidUsername, lintReadme, type LintIssue, type Profile } from '@livebio/core';
import { ReadmeWindow } from '../components/ReadmeWindow';
import { downloadReadme } from '../lib/export';

interface Props {
  profile: Profile | null;
}

/** Past this many characters the check runs only when asked, so typing stays smooth. */
const AUTO_LIMIT = 120_000;

const EXAMPLE = `#My Profile
Hi, I am **  Ada ** and I love github and javascript.
I recieve alot of mail at ada@example.com
* Go
- Rust
+ Zig



<div align="center">
![](./assets/hero-banner.png)
[click here] (http://github.com/ada)
</div>

| Language | Years |
| Go | 5 |

![Stats](https://github-readme-stats.vercel.app/api?username=ada)

\`\`\`js
console.log("never closed")
`;

type Level = 'all' | 'error' | 'warning' | 'tip';
type View = 'corrected' | 'changes' | 'preview';

const LEVELS: Array<[Level, string]> = [
  ['all', 'Everything'],
  ['error', 'Errors'],
  ['warning', 'Warnings'],
  ['tip', 'Tips'],
];

const SEVERITY_LABEL: Record<LintIssue['severity'], string> = { error: 'Error', warning: 'Warning', tip: 'Tip' };

/** Looks for mistakes in a README, explains each one, and writes out a corrected copy. All in the browser. */
export function LinterPage({ profile }: Props) {
  const [text, setText] = useState('');
  const [level, setLevel] = useState<Level>('all');
  const [onlyMine, setOnlyMine] = useState(false);
  const [view, setView] = useState<View>('corrected');
  const [mode, setMode] = useState<'dark' | 'light'>('dark');
  const [copied, setCopied] = useState(false);
  const [user, setUser] = useState(profile?.login ?? '');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [manualRun, setManualRun] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);
  const file = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile && !user) setUser(profile.login);
  }, [profile, user]);

  const deferred = useDeferredValue(text);
  const tooBig = text.length > AUTO_LIMIT;
  const [checked, setChecked] = useState('');
  useEffect(() => {
    if (!tooBig) setChecked(deferred);
  }, [deferred, tooBig]);
  const source = tooBig ? (manualRun ? checked : '') : checked;
  const result = useMemo(() => (source.trim() === '' ? null : lintReadme(source)), [source]);

  const issues = useMemo(() => {
    if (!result) return [];
    return result.issues.filter((i) => (level === 'all' || i.severity === level) && (!onlyMine || !i.fixed));
  }, [result, level, onlyMine]);

  const rows = useMemo(() => (result && view === 'changes' ? diffLines(source.replace(/\r\n?/g, '\n'), result.corrected) : []), [result, view, source]);
  const changedLines = rows.filter((r) => r.kind !== 'same').length;

  const loadMine = async () => {
    const name = user.trim().replace(/^@/, '');
    if (!isValidUsername(name)) {
      setNotice({ kind: 'error', text: 'That is not a GitHub username.' });
      return;
    }
    setLoading(true);
    setNotice(null);
    try {
      const response = await fetch(`https://raw.githubusercontent.com/${encodeURIComponent(name)}/${encodeURIComponent(name)}/HEAD/README.md`);
      if (response.status === 404) {
        setNotice({ kind: 'error', text: `@${name} has no profile README yet. Make a repository named ${name} with a README.md, or paste text here.` });
      } else if (!response.ok) {
        setNotice({ kind: 'error', text: 'GitHub would not share that file just now. Paste the text instead.' });
      } else {
        setText(await response.text());
        setManualRun(false);
        setNotice({ kind: 'ok', text: `Loaded the profile README of @${name}.` });
      }
    } catch {
      setNotice({ kind: 'error', text: 'Could not reach GitHub. Check your connection, or paste the text instead.' });
    } finally {
      setLoading(false);
    }
  };

  const readFile = async (picked: File | undefined) => {
    if (!picked) return;
    if (picked.size > 2_000_000) {
      setNotice({ kind: 'error', text: 'That file is over 2 MB, which is far too big for a README.' });
    } else {
      setText(await picked.text());
      setManualRun(false);
      setNotice({ kind: 'ok', text: `Loaded ${picked.name}.` });
    }
    if (file.current) file.current.value = '';
  };

  const jumpTo = (line: number) => {
    const el = area.current;
    if (!el || line < 1) return;
    const lines = text.replace(/\r\n?/g, '\n').split('\n');
    const start = lines.slice(0, line - 1).reduce((sum, l) => sum + l.length + 1, 0);
    el.focus();
    el.setSelectionRange(start, start + (lines[line - 1]?.length ?? 0));
    const lineHeight = Number.parseFloat(getComputedStyle(el).lineHeight) || 20;
    el.scrollTop = Math.max(0, (line - 4) * lineHeight);
  };

  const copy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.corrected);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 3000);
    } catch {
      setView('corrected');
    }
  };

  return (
    <div className="page">
      <header className="page-head">
        <h1>README linter</h1>
        <p>
          Paste a README and see everything wrong with it: broken headings, links and images that will not show, HTML GitHub
          removes, leaked secrets, accessibility gaps and more. You get a corrected version with the safe fixes already
          made. It all runs in your browser; your text is never sent anywhere.
        </p>
      </header>

      <div className="linter">
        <section className="panel linter-input">
          <div className="panel-head">
            <h2>Your README</h2>
            <span className="muted-line">{text.length === 0 ? 'Empty' : `${text.split('\n').length} lines`}</span>
          </div>
          <label className="visually-hidden" htmlFor="readme-text">
            README text to check
          </label>
          <textarea
            id="readme-text"
            ref={area}
            value={text}
            spellCheck={false}
            placeholder="Paste your README.md here…"
            onChange={(event) => {
              setText(event.target.value);
              setManualRun(false);
            }}
          />
          <div className="row">
            <button type="button" onClick={() => { setText(EXAMPLE); setManualRun(false); setNotice(null); }}>
              Try an example with mistakes
            </button>
            <button type="button" onClick={() => file.current?.click()}>
              Open a .md file
            </button>
            <input ref={file} type="file" accept=".md,.markdown,.txt,text/markdown,text/plain" hidden onChange={(event) => void readFile(event.target.files?.[0])} />
            <button type="button" onClick={() => { setText(''); setNotice(null); setManualRun(false); }} disabled={text === ''}>
              Clear
            </button>
          </div>
          <form
            className="row load-row"
            onSubmit={(event) => {
              event.preventDefault();
              void loadMine();
            }}
          >
            <label className="visually-hidden" htmlFor="linter-user">
              GitHub username
            </label>
            <span className="at" aria-hidden="true">
              @
            </span>
            <input id="linter-user" value={user} onChange={(event) => setUser(event.target.value)} placeholder="username" autoComplete="off" autoCapitalize="off" spellCheck={false} />
            <button type="submit" disabled={loading || !user.trim()}>
              {loading ? 'Loading…' : 'Load a profile README'}
            </button>
          </form>
          {notice && (
            <p className={notice.kind === 'error' ? 'error' : 'hint'} role={notice.kind === 'error' ? 'alert' : 'status'}>
              {notice.text}
            </p>
          )}
          {tooBig && (
            <p className="hint">
              This is a very large file, so it is checked only when you ask.{' '}
              <button type="button" className="link" onClick={() => { setChecked(text); setManualRun(true); }}>
                Check it now
              </button>
            </p>
          )}
        </section>

        <section className="linter-output" aria-live="polite">
          {!result ? (
            <div className="panel linter-empty">
              <h2>What it checks</h2>
              <ul className="checks">
                <li>Headings, lists, tables and code blocks that do not render</li>
                <li>Broken or insecure links, images without alt text, addresses that only work on your computer</li>
                <li>HTML that GitHub removes, tags left open, markdown that sits inside HTML and shows as plain text</li>
                <li>Secrets such as tokens and keys, plus template text you forgot to fill in</li>
                <li>Pictures that depend on someone else’s free server, spelling, product names and spacing</li>
              </ul>
              <p className="hint">Paste a README on the left, or press <b>Try an example with mistakes</b>.</p>
            </div>
          ) : (
            <>
              <div className="panel linter-summary">
                <div className="counts" role="group" aria-label="Summary">
                  <span className="count error">
                    <b>{result.counts.error}</b> {result.counts.error === 1 ? 'error' : 'errors'}
                  </span>
                  <span className="count warning">
                    <b>{result.counts.warning}</b> {result.counts.warning === 1 ? 'warning' : 'warnings'}
                  </span>
                  <span className="count tip">
                    <b>{result.counts.tip}</b> {result.counts.tip === 1 ? 'tip' : 'tips'}
                  </span>
                </div>
                {result.issues.length === 0 ? (
                  <p className="good">Nothing to fix. This README looks clean.</p>
                ) : (
                  <p className="hint">
                    <b>{result.counts.fixed}</b> fixed in the corrected version, <b>{result.counts.manual}</b>{' '}
                    {result.counts.manual === 1 ? 'needs' : 'need'} you, because only you know what they should say.
                  </p>
                )}
              </div>

              {result.issues.length > 0 && (
                <div className="panel">
                  <div className="filters" role="group" aria-label="Filter issues">
                    {LEVELS.map(([value, label]) => (
                      <button key={value} type="button" aria-pressed={level === value} onClick={() => setLevel(value)}>
                        {label}
                      </button>
                    ))}
                    <button type="button" aria-pressed={onlyMine} onClick={() => setOnlyMine(!onlyMine)}>
                      Needs me
                    </button>
                  </div>
                  {issues.length === 0 ? (
                    <p className="hint">Nothing matches this filter.</p>
                  ) : (
                    <ul className="issues">
                      {issues.map((issue, i) => (
                        <li key={`${issue.rule}-${issue.line}-${i}`} className={`issue ${issue.severity}`}>
                          <div className="issue-head">
                            <span className={`badge ${issue.severity}`}>{SEVERITY_LABEL[issue.severity]}</span>
                            <span className="issue-title">{issue.title}</span>
                            {issue.line > 0 ? (
                              <button type="button" className="link" onClick={() => jumpTo(issue.line)} aria-label={`Show line ${issue.line} in the text`}>
                                Line {issue.line}
                              </button>
                            ) : (
                              <span className="muted-line">Whole file</span>
                            )}
                            <span className={issue.fixed ? 'fix yes' : 'fix no'}>{issue.fixed ? 'Fixed below' : 'Needs you'}</span>
                          </div>
                          <p>{issue.message}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div className="panel">
                <div className="panel-head">
                  <h2>Corrected README</h2>
                  <div className="tabs" role="tablist">
                    {(['corrected', 'changes', 'preview'] as View[]).map((v) => (
                      <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)}>
                        {v === 'corrected' ? 'Text' : v === 'changes' ? 'Changes' : 'Preview'}
                      </button>
                    ))}
                  </div>
                </div>
                {!result.changed && <p className="hint">Nothing could be changed automatically, so this is your text as it is.</p>}

                {view === 'corrected' && (
                  <pre className="code linter-code">
                    <code>{result.corrected || '(empty)'}</code>
                  </pre>
                )}
                {view === 'changes' && (
                  <div className="diff" role="table" aria-label="Changes">
                    <p className="hint">{changedLines === 0 ? 'No lines changed.' : `${changedLines} ${changedLines === 1 ? 'line' : 'lines'} changed. Red lines were taken out, green lines were put in.`}</p>
                    {rows.map((row, i) => {
                      if (row.kind === 'same' && changedLines > 0) {
                        // Show unchanged lines only next to a change, so a long README stays readable.
                        const near = rows.slice(Math.max(0, i - 2), i + 3).some((r) => r.kind !== 'same');
                        if (!near) return null;
                      }
                      if (row.kind === 'same' && changedLines === 0) return null;
                      return (
                        <div key={i} className={`diff-row ${row.kind}`} role="row">
                          <span className="ln">{row.oldLine ?? ''}</span>
                          <span className="ln">{row.newLine ?? ''}</span>
                          <span className="sign" aria-label={row.kind === 'add' ? 'added' : row.kind === 'remove' ? 'removed' : 'unchanged'}>
                            {row.kind === 'add' ? '+' : row.kind === 'remove' ? '−' : ' '}
                          </span>
                          <code>{row.text || ' '}</code>
                        </div>
                      );
                    })}
                  </div>
                )}
                {view === 'preview' && (
                  <>
                    <ReadmeWindow
                      output={{ readme: result.corrected, assets: [] }}
                      mode={mode}
                      title="Corrected README.md"
                      actions={
                        <button type="button" className="mode" onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}>
                          {mode === 'dark' ? 'Light' : 'Dark'}
                        </button>
                      }
                    />
                    <p className="hint">Pictures load from their own addresses, as they would on GitHub.</p>
                  </>
                )}

                <div className="export-actions">
                  <button type="button" className="primary" onClick={() => void copy()}>
                    {copied ? 'Copied' : 'Copy corrected README'}
                  </button>
                  <button type="button" onClick={() => downloadReadme(result.corrected)}>
                    Download README.md
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setText(result.corrected);
                      setManualRun(false);
                    }}
                    disabled={!result.changed}
                  >
                    Use it as my text
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
