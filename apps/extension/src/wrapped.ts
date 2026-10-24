import { siteLink } from './config';
import { loginFromText } from './lib/github';
import { mountWrappedPage } from './lib/wrapped-page';

/** The full-page card, opened from the right-click menu. It loads straight away, because the person asked for that user. */
const asked = loginFromText(new URLSearchParams(location.search).get('user'));
mountWrappedPage({ prefill: asked, autoLoad: asked !== null });
(document.getElementById('link-site') as HTMLAnchorElement).href = siteLink('');
