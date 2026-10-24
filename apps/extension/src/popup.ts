import { siteLink } from './config';
import { ownerLoginFromUrl } from './lib/github';
import { mountWrappedPage } from './lib/wrapped-page';

/** The toolbar popup. The username box is filled from the open tab when it is a GitHub page, but nothing is loaded until it is asked. */
async function start(): Promise<void> {
  let prefill: string | null = null;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    prefill = tab?.url ? ownerLoginFromUrl(tab.url) : null;
  } catch {
    prefill = null;
  }
  mountWrappedPage({ prefill, autoLoad: false });
  for (const [id, route] of [['link-site', ''], ['link-linter', 'linter'], ['link-studio', 'studio']] as const) {
    (document.getElementById(id) as HTMLAnchorElement).href = siteLink(route);
  }
}

void start();
