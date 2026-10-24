type Child = Node | string | null | undefined | false;

interface Props {
  class?: string;
  text?: string;
  attrs?: Record<string, string>;
  on?: Partial<Record<'click' | 'input' | 'submit' | 'keydown' | 'change', (event: Event) => void>>;
}

/**
 * Makes an element. Text always goes in as text, never as markup, so nothing taken from a web page or a profile
 * can become part of the extension's own pages.
 */
export function h<K extends keyof HTMLElementTagNameMap>(tag: K, props: Props = {}, ...children: Child[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (props.class) el.className = props.class;
  if (props.text !== undefined) el.textContent = props.text;
  for (const [name, value] of Object.entries(props.attrs ?? {})) el.setAttribute(name, value);
  for (const [name, handler] of Object.entries(props.on ?? {})) el.addEventListener(name, handler as EventListener);
  for (const child of children) if (child) el.append(child);
  return el;
}

export const clear = (el: Element): void => {
  while (el.firstChild) el.removeChild(el.firstChild);
};
