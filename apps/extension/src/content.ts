import { lintReadme } from '@livebio/core';
import { siteLink } from './config';
import { clear, h } from './lib/dom';
import { MAX_README_CHARS, pageInfo, readmeCandidates, type PageInfo } from './lib/github';
import { renderLint } from './lib/lint-view';
import { wrappedFacts } from './lib/summary';
import { ask } from './messages';
import components from './components.css';
import widget from './widget.css';

/**
 * A small pill at the corner of GitHub pages. On a profile it offers that person's Wrapped, and on a README or in the editor
 * it offers to check the README. It is a floating pill, not something spliced into GitHub's own layout, so a redesign of
 * GitHub's pages cannot break it. Everything is drawn inside a closed shadow root, so neither side can restyle the other.
 */

const HOST_ID = 'livebio-extension-host';

type Active = Exclude<PageInfo, { kind: 'other' }>;

function isDark(): boolean {
  const mode = document.documentElement.getAttribute('data-color-mode');
  if (mode === 'dark') return true;
  if (mode === 'light') return false;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

/** The text in GitHub's editor, and a way to put new text in, where the editor allows it. */
interface Editor {
  read(): string;
  write?(text: string): boolean;
  /** True when the editor may show only part of a long file, so what it holds cannot be trusted to be all of it. */
  partial: boolean;
}

function findEditor(): Editor | null {
  const area = document.querySelector<HTMLTextAreaElement>('textarea[name="value"], textarea.js-blob-contents, form.js-blob-form textarea');
  if (area) {
    return {
      partial: false,
      read: () => area.value,
      write: (text) => {
        area.value = text;
        area.dispatchEvent(new Event('input', { bubbles: true }));
        area.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      },
    };
  }
  const cm = document.querySelector<HTMLElement>('.cm-content[contenteditable="true"]');
  if (cm) {
    return {
      // CodeMirror draws only the lines near the screen, so a long file may be only partly in the page.
      partial: true,
      read: () => Array.from(cm.querySelectorAll('.cm-line')).map((line) => line.textContent ?? '').join('\n'),
      write: (text) => {
        cm.focus();
        document.execCommand('selectAll');
        return document.execCommand('insertText', false, text);
      },
    };
  }
  return null;
}

function button(label: string, onClick: () => void, primary = false): HTMLButtonElement {
  return h('button', { class: primary ? 'primary' : '', text: label, on: { click: onClick } });
}

const status = (text: string, kind: 'note' | 'error' = 'note'): HTMLElement => h('p', { class: kind, text, attrs: { role: kind === 'error' ? 'alert' : 'status' } });

function profileBody(login: string): HTMLElement {
  const out = h('div', { class: 'out' });
  const own = document.querySelector('meta[name="user-login"]')?.getAttribute('content')?.toLowerCase() === login.toLowerCase();
  const show = () => {
    clear(out);
    out.append(status(`Loading @${login}…`));
    void ask({ type: 'wrapped', login }).then((reply) => {
      clear(out);
      if (!reply.ok) {
        out.append(status(reply.message, 'error'));
        return;
      }
      const data = reply.data;
      const facts = h('dl', { class: 'facts' });
      for (const [label, value] of wrappedFacts(data)) facts.append(h('div', {}, h('dt', { text: label }), h('dd', { text: value })));
      out.append(facts);
      if (data.traits.length) out.append(h('ul', { class: 'labels' }, ...data.traits.slice(0, 3).map((t) => h('li', {}, h('strong', { text: t.title }), h('span', { text: t.reason })))));
      out.append(h('div', { class: 'row' }, button('Open the card', () => void ask({ type: 'openWrapped', login }), true)));
    });
  };
  return h(
    'div',
    {},
    h('p', { class: 'hint', text: `See the last twelve months of @${login} as a Wrapped card. This asks the livebio server for their public data, and only when you press the button.` }),
    h('div', { class: 'row' }, button('Show Wrapped', show, true)),
    out,
    h(
      'p',
      { class: 'links' },
      h('a', { text: `Try designs for @${login}`, attrs: { href: siteLink('', login), target: '_blank', rel: 'noreferrer' } }),
      own ? ' · ' : null,
      own ? h('a', { text: 'Make my profile README', attrs: { href: siteLink('', login), target: '_blank', rel: 'noreferrer' } }) : null,
    ),
  );
}

/** Checks text and shows the result. `replace` is given only where there is an editor to put the corrected text into. */
function checkInto(out: HTMLElement, text: string, fileName: string, replace?: (text: string) => boolean): void {
  clear(out);
  if (text.trim() === '') {
    out.append(status('There is no text to check yet.', 'error'));
    return;
  }
  if (text.length > MAX_README_CHARS) {
    out.append(status('That is far bigger than any README. GitHub would not show all of it either.', 'error'));
    return;
  }
  renderLint(out, lintReadme(text), { fileName, ...(replace ? { replace } : {}) });
}

function readmeBody(info: Extract<Active, { kind: 'readme' }>): HTMLElement {
  const out = h('div', { class: 'out' });
  const run = () => {
    clear(out);
    out.append(status('Reading the README…'));
    void ask({ type: 'raw', urls: readmeCandidates(info.rawUrl) }).then((reply) => {
      if (!reply.ok) {
        clear(out);
        out.append(status(reply.message, 'error'));
        return;
      }
      checkInto(out, reply.data, info.name);
    });
  };
  return h('div', {}, h('p', { class: 'hint', text: 'Looks for broken headings, links and images, HTML GitHub removes, leaked secrets and more, and writes a corrected copy. It runs in your browser; the README is not sent anywhere.' }), h('div', { class: 'row' }, button('Check this README', run, true)), out);
}

function editBody(info: Extract<Active, { kind: 'edit' }>): HTMLElement {
  const out = h('div', { class: 'out' });
  const name = info.name ?? 'README.md';
  const checkEditor = () => {
    const editor = findEditor();
    if (!editor) {
      clear(out);
      out.append(status('Could not find the editor on this page. Open the editor first, or check the saved file instead.', 'error'));
      return;
    }
    checkInto(out, editor.read(), name, editor.write);
    if (editor.partial) out.prepend(status('This editor shows only the part of a long file near the screen. For a long README, use “Check the saved file” as well.'));
  };
  const checkSaved = () => {
    if (!info.rawUrl) return;
    clear(out);
    out.append(status('Reading the saved file…'));
    void ask({ type: 'raw', urls: [info.rawUrl] }).then((reply) => {
      if (!reply.ok) {
        clear(out);
        out.append(status(reply.message, 'error'));
        return;
      }
      checkInto(out, reply.data, name);
    });
  };
  const row = h('div', { class: 'row' }, button('Check the text in the editor', checkEditor, true));
  if (info.rawUrl) row.append(button('Check the saved file', checkSaved));
  return h('div', {}, h('p', { class: 'hint', text: 'Checks what is in the editor now, so you can fix a README before you commit it. It runs in your browser.' }), row, out);
}

function build(info: Active): void {
  document.getElementById(HOST_ID)?.remove();
  const host = h('div', { attrs: { id: HOST_ID } });
  host.style.cssText = 'all: initial; position: fixed; right: 16px; bottom: 16px; z-index: 2147483000;';
  const shadow = host.attachShadow({ mode: 'closed' });
  const root = h('div', { class: 'root', attrs: { 'data-theme': isDark() ? 'dark' : 'light' } });
  const title = info.kind === 'profile' ? 'Wrapped' : 'README check';
  const panel = h('section', { class: 'panel', attrs: { hidden: '', role: 'dialog', 'aria-label': `livebio: ${title}` } });
  const fab = h('button', { class: 'fab', attrs: { 'aria-expanded': 'false', 'aria-label': `livebio: ${title}` } }, h('span', { class: 'dot', attrs: { 'aria-hidden': 'true' } }), h('span', { text: 'livebio' }));

  const setOpen = (open: boolean) => {
    if (open) panel.removeAttribute('hidden');
    else panel.setAttribute('hidden', '');
    fab.setAttribute('aria-expanded', String(open));
    if (open) panel.querySelector<HTMLElement>('button')?.focus();
    else fab.focus();
  };
  fab.addEventListener('click', () => setOpen(panel.hasAttribute('hidden')));
  panel.addEventListener('keydown', (event) => {
    if ((event as KeyboardEvent).key === 'Escape') setOpen(false);
  });

  const body = info.kind === 'profile' ? profileBody(info.login) : info.kind === 'readme' ? readmeBody(info) : editBody(info);
  panel.append(
    h('header', { class: 'panel-head' }, h('strong', { text: `livebio · ${title}` }), h('button', { class: 'close', text: '×', attrs: { 'aria-label': 'Close' }, on: { click: () => setOpen(false) } })),
    h('div', { class: 'panel-body' }, body),
    h('footer', { class: 'panel-foot' }, h('a', { text: 'livebio by illusivehacks', attrs: { href: siteLink(''), target: '_blank', rel: 'noreferrer' } })),
  );
  root.append(panel, fab);
  shadow.append(h('style', { text: `${components}\n${widget}` }), root);
  document.documentElement.append(host);
}

let lastKey = '';

/** Shows the pill the page calls for, or takes it away. It does nothing when it is already right. */
function sync(): void {
  const info = pageInfo(location.href);
  if (info.kind === 'other') {
    document.getElementById(HOST_ID)?.remove();
    lastKey = '';
    return;
  }
  const key = `${location.href}|${isDark()}`;
  if (key === lastKey && document.getElementById(HOST_ID)) return;
  lastKey = key;
  build(info);
}

sync();
// GitHub changes page without reloading, so look again when it says it has, and now and then in case it did not say.
for (const event of ['turbo:load', 'turbo:render', 'pjax:end', 'popstate']) document.addEventListener(event, () => window.setTimeout(sync, 50));
window.setInterval(sync, 800);
