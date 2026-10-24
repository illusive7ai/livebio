import { renderWrappedCard, wrappedAlt, type WrappedData } from '@livebio/core';
import { siteLink } from '../config';
import { clear, h } from './dom';
import { download, downloadText, svgDataUri, svgToPng } from './image';
import { wrappedFacts } from './summary';

/** Shows a person's Wrapped: the shareable card, the headline numbers, any labels their numbers earned and where to go next. */
export function renderWrapped(root: HTMLElement, data: WrappedData): void {
  clear(root);
  let variant: 'dark' | 'light' = window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const img = h('img', { class: 'card', attrs: { alt: wrappedAlt(data), width: '900', height: '560' } });
  const draw = () => {
    img.src = svgDataUri(renderWrappedCard(data, variant));
  };
  draw();

  const note = h('p', { class: 'note', attrs: { role: 'status', 'aria-live': 'polite' } });
  const say = (text: string) => {
    note.textContent = text;
  };
  const stem = `${data.login}-year-in-review`;

  const buttons = h(
    'div',
    { class: 'row' },
    h('button', {
      class: 'primary',
      text: 'Download PNG',
      on: {
        click: () => {
          svgToPng(renderWrappedCard(data, variant), 2)
            .then((blob) => {
              download(blob, `${stem}.png`);
              say('Saved the picture.');
            })
            .catch(() => say('This browser could not make a PNG. Save the SVG instead.'));
        },
      },
    }),
    h('button', { text: 'Download SVG', on: { click: () => (downloadText(`${stem}.svg`, renderWrappedCard(data, variant)), say('Saved the picture.')) } }),
    h('button', {
      text: 'Switch card',
      attrs: { title: 'Show the card on a light or a dark background' },
      on: {
        click: () => {
          variant = variant === 'dark' ? 'light' : 'dark';
          draw();
        },
      },
    }),
  );

  const facts = h('dl', { class: 'facts' });
  for (const [label, value] of wrappedFacts(data)) facts.append(h('div', {}, h('dt', { text: label }), h('dd', { text: value })));

  const labels = data.traits.length
    ? h('ul', { class: 'labels' }, ...data.traits.map((t) => h('li', {}, h('strong', { text: t.title }), h('span', { text: t.reason }))))
    : null;

  root.append(img, buttons, note, facts);
  if (labels) root.append(labels);
  root.append(
    h(
      'p',
      { class: 'links' },
      h('a', { text: 'Open the full Wrapped on livebio', attrs: { href: siteLink('wrapped', data.login), target: '_blank', rel: 'noreferrer' } }),
      ' · ',
      h('a', { text: 'Try designs for @' + data.login, attrs: { href: siteLink('', data.login), target: '_blank', rel: 'noreferrer' } }),
    ),
    h('p', { class: 'fine', text: 'Worked out from public GitHub data for the last twelve months. A label appears only when the numbers earn it.' }),
  );
}
