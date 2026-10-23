import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { useMemo, useState } from 'react';
import { hostedReadme, previewMarkdown, type Config, type Output, type Profile } from '@livebio/core';
import { buildFiles, downloadReadme, downloadZip } from '../lib/export';
import { SERVICE_URL } from '../lib/service';

interface Props {
  output: Output;
  config: Config;
  profile: Profile;
  /** True when the preview uses stand-in data, so there is nothing of the user's to export yet. */
  sample?: boolean;
}

type Tab = 'preview' | 'code';
type Mode = 'dark' | 'light';
/** How the person publishes: pictures drawn live by livebio's server, or files they host themselves. */
type Way = 'live' | 'files';

export function PreviewPane({ output, config, profile, sample = false }: Props) {
  const [tab, setTab] = useState<Tab>('preview');
  const [mode, setMode] = useState<Mode>('dark');
  const [copied, setCopied] = useState(false);
  const [way, setWay] = useState<Way>(SERVICE_URL ? 'live' : 'files');

  // Profile text comes from other people's GitHub accounts, so the HTML is always sanitised.
  const html = useMemo(() => {
    const rendered = marked.parse(previewMarkdown(output, mode), { async: false });
    return DOMPurify.sanitize(rendered);
  }, [output, mode]);

  // The README for each way. Live: its pictures are addresses on livebio's server, so pasting it is enough.
  // Files: its pictures are files in the repository, so they have to be uploaded with it.
  const liveReadme = useMemo(
    () => (SERVICE_URL ? hostedReadme(output.readme, output.assets, profile.login, config, SERVICE_URL) : null),
    [output, profile.login, config],
  );
  const readme = way === 'live' && liveReadme ? liveReadme : output.readme;
  const firstPicture = useMemo(() => {
    const match = liveReadme ? /(?:src|srcset)="([^"]+)"/.exec(liveReadme) : null;
    return match ? match[1]!.replace(/&amp;/g, '&') : null;
  }, [liveReadme]);

  const files = useMemo(() => Object.keys(buildFiles(output, config)), [output, config]);
  const images = files.filter((path) => path.endsWith('.svg')).length;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(readme);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 4000);
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
          <span className="window-path">{profile.login} / README.md</span>
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
            <code>{readme}</code>
          </pre>
        )}
      </div>

      {!sample && (
        <div className="export">
          {liveReadme && (
            <fieldset className="plain way">
              <legend>How do you want to publish it?</legend>
              <div className="segmented">
                <label className={way === 'live' ? 'on' : ''}>
                  <input type="radio" name="way" checked={way === 'live'} onChange={() => setWay('live')} />
                  Copy and paste (live)
                </label>
                <label className={way === 'files' ? 'on' : ''}>
                  <input type="radio" name="way" checked={way === 'files'} onChange={() => setWay('files')} />
                  Host the files myself
                </label>
              </div>
            </fieldset>
          )}

          {way === 'live' && liveReadme ? (
            <>
              <div className="callout" role="note">
                <strong>Just copy and paste.</strong> Your pictures are drawn by livebio from your public GitHub data
                each time your profile is viewed, so they stay up to date on their own, about once an hour. There is
                nothing to upload and nothing to set up. livebio keeps only a one-hour copy of your public data.
              </div>
              <div className="export-actions">
                <button type="button" className="primary" onClick={copy}>
                  {copied ? 'Copied. Now paste it' : 'Copy README'}
                </button>
                <button type="button" onClick={() => downloadReadme(readme)}>
                  Download README.md
                </button>
              </div>
              {copied && (
                <p className="hint" role="status">
                  Copied. Now paste it into your profile README on GitHub, as in step 2 below.
                </p>
              )}
              <ol className="steps">
                <li>
                  <a href={`https://github.com/new?name=${encodeURIComponent(profile.login)}`} target="_blank" rel="noreferrer">
                    Create a public repository
                  </a>{' '}
                  named <code>{profile.login}</code> (the same as your username), and tick <em>Add a README file</em>.
                </li>
                <li>
                  Open its <code>README.md</code>, click the pencil to edit, select everything, paste, and press{' '}
                  <strong>Commit changes</strong>.
                </li>
                <li>
                  Open <a href={`https://github.com/${profile.login}`} target="_blank" rel="noreferrer">github.com/{profile.login}</a>.
                  Your profile is live.
                </li>
              </ol>
              {firstPicture && (
                <p className="hint">
                  Want to check first? <a href={firstPicture} target="_blank" rel="noreferrer">Open your first picture</a>{' '}
                  in a new tab.
                </p>
              )}
            </>
          ) : (
            <>
              <div className="callout" role="note">
                <strong>The pictures are separate files.</strong> Your README shows {images}{' '}
                {images === 1 ? 'picture' : 'pictures'}, and each one is saved as a file in a folder called{' '}
                <code>livebio/</code>. Copying only the README text leaves them behind, and GitHub then shows broken
                images. Use the zip and upload <em>everything</em> in it. The files do not depend on livebio's server;
                to keep them current, the included GitHub Action refreshes them every day.
              </div>
              <div className="export-actions">
                <button type="button" className="primary" onClick={() => downloadZip(buildFiles(output, config), profile.login)}>
                  Download everything (.zip)
                </button>
                <button type="button" onClick={copy}>
                  {copied ? 'Copied the text' : 'Copy README text only'}
                </button>
                <button type="button" onClick={() => downloadReadme(readme)}>
                  Download README.md only
                </button>
              </div>
              {copied && (
                <p className="hint" role="status">
                  Copied the text. Remember to upload the <code>livebio/</code> folder from the zip too, or the images
                  will not show.
                </p>
              )}
              <ol className="steps">
                <li>
                  Create a public repository named <code>{profile.login}</code> (the same as your username).
                </li>
                <li>
                  Unzip the download, then upload <strong>everything inside it</strong> to that repository, including
                  the <code>livebio</code> and <code>.github</code> folders. On GitHub: <em>Add file</em>, then{' '}
                  <em>Upload files</em>, then drag the unzipped files in. (On a Mac, press Cmd+Shift+. in the folder to
                  show <code>.github</code>, which is hidden.)
                </li>
                <li>
                  Open the <strong>Actions</strong> tab and enable workflows. Your profile then refreshes itself every
                  day.
                </li>
              </ol>
              <details className="files">
                <summary>The {files.length} files that should end up in your repository</summary>
                <ul>
                  {files.map((path) => (
                    <li key={path}>
                      <code>{path}</code>
                    </li>
                  ))}
                </ul>
              </details>
            </>
          )}
        </div>
      )}
    </section>
  );
}
