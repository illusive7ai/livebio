import { useEffect, useState } from 'react';
import { REPO_URL } from '@livebio/core';
import { SERVICE_URL } from '../lib/service';

interface Info {
  name: string;
  version: string;
  bytes: number;
}

/** The size of a file in words a person can use. */
export function readableSize(bytes: number): string {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Reads what the build says about the zip, so the page never claims a version or a size it has not checked. */
function useInfo(): Info | null | 'missing' {
  const [info, setInfo] = useState<Info | null | 'missing'>(null);
  useEffect(() => {
    let live = true;
    fetch('./extension.json')
      .then((r) => (r.ok ? (r.json() as Promise<Info>) : Promise.reject(new Error('missing'))))
      .then((data) => live && typeof data.version === 'string' && setInfo(data))
      .catch(() => live && setInfo('missing'));
    return () => {
      live = false;
    };
  }, []);
  return info;
}

const STEPS: Array<[string, string]> = [
  ['Download and unzip', 'Download the zip below and unzip it somewhere you will keep it. Chrome reads the extension from that folder, so do not delete it.'],
  ['Open the extensions page', 'In Chrome, type chrome://extensions in the address bar and press Enter. (In Edge it is edge://extensions, in Brave brave://extensions.)'],
  ['Switch on Developer mode', 'It is the switch at the top right of that page. It is what lets Chrome load an extension that is not from the store.'],
  ['Press Load unpacked', 'Choose the unzipped folder, the one that holds a file called manifest.json. The livebio icon appears. Pin it from the puzzle-piece menu if you like.'],
];

const FEATURES: Array<[string, string]> = [
  ['Wrapped for anyone', 'Click the icon, type a GitHub username, and get their last twelve months as a card you can download. The box fills itself in when you are on a GitHub page.'],
  ['A helper on profile pages', 'On any github.com profile a small livebio pill offers that person’s Wrapped. It does nothing until you press it.'],
  ['A README checker', 'On any README, and in GitHub’s editor, the pill checks the text for broken links and images, HTML GitHub removes, leaked secrets and more, and gives you a corrected copy. It runs in your browser.'],
  ['A right-click shortcut', 'Right-click a link to a GitHub profile or repository, or a username you have selected, and open their Wrapped card.'],
];

const ALLOWED: Array<[string, string]> = [
  ['Pages on github.com', 'To show the pill on profiles, READMEs and the editor. It does not run on any other site.'],
  ['Raw files on GitHub', 'To read the README you ask it to check. If you are signed in, it reads with your own session, so a private README of yours can be checked too.'],
  [SERVICE_URL ? new URL(SERVICE_URL).host : 'The livebio server', 'To get a person’s public GitHub data for Wrapped. It is asked only when you press a button or choose the menu item, and it is told the username you asked about.'],
  ['The right-click menu', 'To add “Wrapped card for this GitHub user”.'],
  ['The tab you are on, when you open the popup', 'To read its address, so the username box can start with that profile. It does not see tabs on other sites.'],
];

const NEVER: string[] = [
  'It has no accounts, no analytics and no tracking.',
  'The text of a README you check is never sent anywhere. The check runs inside your browser.',
  'It does not read or change pages outside github.com. On GitHub it only adds its pill, and it reads the text of a page only when you ask it to check something.',
  'It does not download code and run it. Everything it runs is in the zip, and you can read it all.',
  'Nothing on a web page can talk to it, and it draws its panel in a part of the page that GitHub’s own scripts cannot reach.',
];

/** Where to get the Chrome extension, what it does, how to install it, and what it can and cannot see. */
export function ExtensionPage() {
  const info = useInfo();
  const ready = info !== null && info !== 'missing';
  return (
    <div className="page">
      <header className="page-head">
        <h1>livebio for Chrome</h1>
        <p>GitHub Wrapped, a helper on profile pages and a README checker, right inside GitHub. Free and open source.</p>
      </header>

      <section className="panel ext-download">
        <div>
          <h2>Download</h2>
          {ready ? (
            <p className="hint">
              Version {info.version}, {readableSize(info.bytes)}. Works in Chrome, Edge, Brave and other Chromium browsers.
            </p>
          ) : info === 'missing' ? (
            <p className="hint">The download is not part of this copy of the site. Build it yourself with <code>npm run package -w @livebio/extension</code>; see the steps in the repository.</p>
          ) : (
            <p className="hint">Checking the latest version…</p>
          )}
          <p className="hint">It is not on the Chrome Web Store yet. You load it yourself, which takes about a minute (steps below).</p>
        </div>
        {info !== 'missing' && (
          <a className="button" href="./livebio-extension.zip" download>
            Download the extension (.zip)
          </a>
        )}
      </section>

      <h2 className="section-title ext-title">What it does</h2>
      <ul className="ext-grid">
        {FEATURES.map(([title, text]) => (
          <li key={title} className="panel">
            <h3>{title}</h3>
            <p>{text}</p>
          </li>
        ))}
      </ul>

      <h2 className="section-title ext-title">Install it in four steps</h2>
      <ol className="steps ext-steps">
        {STEPS.map(([title, text]) => (
          <li key={title}>
            <strong>{title}.</strong> {text}
          </li>
        ))}
      </ol>
      <p className="hint">To update later, download the new zip, replace the files in the same folder, and press the reload arrow on the extension’s card.</p>

      <h2 className="section-title ext-title">What it can see and do</h2>
      <p className="hint">Chrome asks for these when you install it. Each one is here for one reason.</p>
      <dl className="ext-perms">
        {ALLOWED.map(([what, why]) => (
          <div key={what}>
            <dt>{what}</dt>
            <dd>{why}</dd>
          </div>
        ))}
      </dl>

      <h2 className="section-title ext-title">What it never does</h2>
      <ul className="ext-never">
        {NEVER.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      <p className="hint">
        The whole extension is in the <a href={`${REPO_URL}/tree/main/apps/extension`} target="_blank" rel="noreferrer">apps/extension</a> folder of the repository, under the MIT license.
        If something does not work, <a href={`${REPO_URL}/issues`} target="_blank" rel="noreferrer">tell us</a>.
      </p>
    </div>
  );
}
