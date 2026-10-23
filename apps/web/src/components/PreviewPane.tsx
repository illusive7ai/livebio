import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { useMemo, useState } from 'react';
import { previewMarkdown, type Config, type Output, type Profile } from '@livebio/core';
import { buildFiles, downloadReadme, downloadZip } from '../lib/export';

interface Props {
  output: Output;
  config: Config;
  profile: Profile;
  /** True when the preview uses stand-in data, so there is nothing of the user's to export yet. */
  sample?: boolean;
}

type Tab = 'preview' | 'code';
type Mode = 'dark' | 'light';

export function PreviewPane({ output, config, profile, sample = false }: Props) {
  const [tab, setTab] = useState<Tab>('preview');
  const [mode, setMode] = useState<Mode>('dark');
  const [copied, setCopied] = useState(false);

  // Profile text comes from other people's GitHub accounts, so the HTML is always sanitised.
  const html = useMemo(() => {
    const rendered = marked.parse(previewMarkdown(output, mode), { async: false });
    return DOMPurify.sanitize(rendered);
  }, [output, mode]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(output.readme);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setTab('code');
    }
  };

  return (
    <section className="preview">
      <div className={`window ${mode}`}>
        <div className="window-bar">
          <span className="dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="window-path">
            {profile.login} / README.md
          </span>
          <div className="tabs" role="tablist">
            <button role="tab" aria-selected={tab === 'preview'} onClick={() => setTab('preview')}>
              Preview
            </button>
            <button role="tab" aria-selected={tab === 'code'} onClick={() => setTab('code')}>
              Code
            </button>
          </div>
          <button
            className="mode"
            type="button"
            onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
            aria-label={`Preview in ${mode === 'dark' ? 'light' : 'dark'} mode`}
          >
            {mode === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>
        {tab === 'preview' ? (
          <article className="readme" dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <pre className="code">
            <code>{output.readme}</code>
          </pre>
        )}
      </div>

      {!sample && (
      <div className="export">
        <div className="export-actions">
          <button type="button" onClick={copy}>
            {copied ? 'Copied' : 'Copy README'}
          </button>
          <button type="button" onClick={() => downloadReadme(output.readme)}>
            Download README.md
          </button>
          <button type="button" className="primary" onClick={() => downloadZip(buildFiles(output, config), profile.login)}>
            Download everything (.zip)
          </button>
        </div>
        <ol className="steps">
          <li>
            Create a public repository named <code>{profile.login}</code> (the same as your username).
          </li>
          <li>Unzip the download and upload all of its files to that repository.</li>
          <li>
            Open the <strong>Actions</strong> tab and enable workflows. Your profile then refreshes itself every day.
          </li>
        </ol>
      </div>
      )}
    </section>
  );
}
