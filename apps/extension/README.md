# livebio for GitHub (the browser extension)

A Chrome (Manifest V3) extension that brings three parts of livebio into GitHub itself. It also works in Edge, Brave and other Chromium browsers.

- **Popup.** Click the toolbar icon, type any GitHub username and get their [GitHub Wrapped](../../README.md#github-wrapped): a card to download as PNG or SVG, the headline numbers, and any labels their numbers earned. The box starts with the profile you are looking at.
- **Profile helper.** On a github.com profile, a small pill offers that person's Wrapped. It asks for nothing until you press it.
- **README checker.** On a README, and in GitHub's editor, the pill runs the same [README linter](../../README.md#readme-linter) as the website and offers the corrected text to copy, download, or put into the editor.
- **Right-click.** On a link to a GitHub profile or repository, or a selected username, "livebio: Wrapped card" opens their card in a tab.

Everything uses the same code as the website (`@livebio/core`), so the checker and the card give the same answers.

## Install it

For people who just want it, the livebio website has an **Extension** page with a zip and four install steps. To build it yourself:

```
npm install
npm run build -w @livebio/extension      # builds apps/extension/dist
```

Then open `chrome://extensions`, switch on **Developer mode**, press **Load unpacked** and choose `apps/extension/dist`.

To make the zip the website offers:

```
npm run package -w @livebio/extension    # writes apps/web/public/livebio-extension.zip and extension.json
```

The site's deploy workflow does this before it builds the site, so the download is always the current build. Both files are ignored by git.

### Settings

Two addresses are written in when it is built, and both can be changed with environment variables:

| Variable | Default | What it is |
|---|---|---|
| `LIVEBIO_SERVICE_URL` | the livebio server (the Cloudflare Worker in `workers/contributions`) | Where public GitHub data comes from. It is also the only address, apart from GitHub, that the extension may talk to, because the build writes it into the manifest's host permissions. |
| `LIVEBIO_SITE_URL` | the livebio website | Where the "open on livebio" links go. |

## What it asks Chrome for, and why

| In the manifest | Why |
|---|---|
| `host_permissions`: `github.com`, `raw.githubusercontent.com` | To read the README you ask it to check, with your own GitHub session so your private READMEs work. |
| `host_permissions`: the livebio server | To get a person's public data for Wrapped, when you ask. |
| Content script on `https://github.com/*` | To show the pill. It runs on no other site. |
| `contextMenus` | The right-click item. |
| `activeTab` | To read the address of the current tab when the popup opens, so the username box can start with that profile. |

It has no `tabs`, `cookies`, `history`, `storage`, `scripting` or `webRequest` permission, no analytics and no remote code. A test builds the extension and checks all of this, so a change that widens it fails the tests.

## How it is put together

```
src/
  background.ts      service worker: the right-click menu, reading README files, fetching Wrapped data
  content.ts         the pill on github.com, drawn in a closed shadow root
  popup.ts / .html   the toolbar popup
  wrapped.ts / .html the full-page card, opened from the right-click menu
  lib/github.ts      what a GitHub address is: profile, README, editor; who a link or selection names
  lib/summary.ts     the wording of results, and which buttons are on or off
  lib/*-view.ts      the Wrapped and lint-result views, built with text only, never with markup
  build.test.ts      builds the extension and checks the manifest, the files and the zip
build.mjs            esbuild bundle into dist/
package.mjs          the zip for the website
```

Only the background worker talks to other sites. The page widget asks it for README text and Wrapped data, and only for files on GitHub, so a page cannot use the extension to read anywhere else. All text from profiles and READMEs is put on screen as text, never as markup.

## Tests

```
npm test -w @livebio/extension
```

The tests cover the address logic (what counts as a profile, a README or an editor, and who a link names), the wording and buttons, and the built extension (permissions, files, no `eval`, no `innerHTML`, a closed shadow root, a reproducible zip).

It has also been run in a real browser with the built extension loaded: the popup and card with live data, the pill on live GitHub profile and repository pages including GitHub's in-page navigation, and the editor checker against stand-in editor pages. Those browser runs are done by hand and are not part of `npm test`. Two things are not covered by any test: the right-click item (a browser's menu cannot be driven from outside), and GitHub's own signed-in editor page, which needs a login. The editor code handles both a plain text box and a CodeMirror editor, and has been tried against stand-ins for both.

## Putting it on the Chrome Web Store later

Nothing has to change in the extension. Zip the contents of `dist/` (the zip from `npm run package` is already laid out that way), then in the Chrome developer dashboard:

1. Create the item and upload the zip. It needs a one-time developer registration fee.
2. Use the description from this file, and screenshots of the popup, the pill on a profile and the README check.
3. For the privacy answers: it collects no personal data, sells nothing, and the only thing it sends anywhere is the GitHub username a person asks about, to the livebio server, to get public data for a Wrapped card. README text is never sent.
4. Explain each permission from the table above. Reviewers read them.
