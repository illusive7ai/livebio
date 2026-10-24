import { clear, h } from './dom';
import { loginFromText } from './github';
import { loadWrapped } from './load';
import { describeFailure } from './summary';
import { renderWrapped } from './wrapped-view';

/** Wires up the username box, the loading state and the result on the popup and on the full-page card. */
export function mountWrappedPage(opts: { prefill: string | null; autoLoad: boolean }): void {
  const form = document.getElementById('form') as HTMLFormElement;
  const input = document.getElementById('user') as HTMLInputElement;
  const button = document.getElementById('go') as HTMLButtonElement;
  const out = document.getElementById('out') as HTMLElement;

  const show = async (raw: string) => {
    const login = loginFromText(raw);
    clear(out);
    if (!login) {
      out.append(h('p', { class: 'error', text: 'That is not a GitHub username.', attrs: { role: 'alert' } }));
      return;
    }
    button.disabled = true;
    out.append(h('p', { class: 'note', text: `Loading @${login}…`, attrs: { role: 'status' } }));
    try {
      const data = await loadWrapped(login);
      clear(out);
      renderWrapped(out, data);
    } catch (error) {
      clear(out);
      out.append(h('p', { class: 'error', text: describeFailure(error, login), attrs: { role: 'alert' } }));
    } finally {
      button.disabled = false;
    }
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    void show(input.value);
  });
  if (opts.prefill) {
    input.value = opts.prefill;
    if (opts.autoLoad) void show(opts.prefill);
  }
  input.focus();
}
