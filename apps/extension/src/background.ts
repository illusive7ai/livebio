import { MAX_README_CHARS, isAllowedRawUrl, loginForMenu } from './lib/github';
import { loadWrapped } from './lib/load';
import { describeFailure } from './lib/summary';
import type { Reply, Request } from './messages';

const wrappedPage = (login: string | null): string => chrome.runtime.getURL(`wrapped.html${login ? `?user=${encodeURIComponent(login)}` : ''}`);

chrome.runtime.onInstalled.addListener(() => {
  void chrome.contextMenus.removeAll().then(() => {
    chrome.contextMenus.create({ id: 'livebio-link', title: 'livebio: Wrapped card for this GitHub user', contexts: ['link'], targetUrlPatterns: ['https://github.com/*'] });
    chrome.contextMenus.create({ id: 'livebio-selection', title: 'livebio: Wrapped card for “%s”', contexts: ['selection'] });
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  void chrome.tabs.create({ url: wrappedPage(loginForMenu(info)) });
});

/** Reads the first README address that answers. Only files on GitHub are ever fetched, so a page cannot use the extension to read anywhere else. */
async function fetchReadme(urls: string[]): Promise<string> {
  for (const url of urls) {
    if (!isAllowedRawUrl(url)) continue;
    try {
      // GitHub's own page loads its raw files with the person's session, which is what lets a private README be read.
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) continue;
      const text = await response.text();
      if (text.length > MAX_README_CHARS) throw new Error('too big');
      return text;
    } catch (error) {
      if (error instanceof Error && error.message === 'too big') throw error;
    }
  }
  throw new Error('missing');
}

async function handle(request: Request): Promise<Reply<unknown>> {
  try {
    if (request.type === 'wrapped') return { ok: true, data: await loadWrapped(request.login) };
    if (request.type === 'raw') return { ok: true, data: await fetchReadme(request.urls) };
    if (request.type === 'openWrapped') {
      await chrome.tabs.create({ url: wrappedPage(request.login) });
      return { ok: true, data: null };
    }
    return { ok: false, message: 'The extension did not understand that.' };
  } catch (error) {
    if (request.type === 'raw') {
      const tooBig = error instanceof Error && error.message === 'too big';
      return { ok: false, message: tooBig ? 'That file is far bigger than any README. GitHub would not show all of it either.' : 'Could not read that README from GitHub. It may be private, or the page may have changed.' };
    }
    return { ok: false, message: describeFailure(error, request.type === 'wrapped' ? request.login : '') };
  }
}

const isRequest = (value: unknown): value is Request => typeof value === 'object' && value !== null && typeof (value as { type?: unknown }).type === 'string';

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!isRequest(message)) return false;
  void handle(message).then(sendResponse);
  // The answer comes later, so the channel stays open.
  return true;
});
