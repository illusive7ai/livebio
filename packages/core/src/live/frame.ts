import { FONT, FONT_SANS, FONT_SERIF, seeded } from '../templates/shared';
import { xmlEscape } from '../util';
import type { LiveStyle } from './style';

export const CARD_WIDTH = 900;

export const num = (value: number): string => String(Math.round(value * 100) / 100 || 0);

export function fontFamily(style: LiveStyle): string {
  return style.font === 'mono' ? FONT : style.font === 'serif' ? FONT_SERIF : FONT_SANS;
}

/** The base stylesheet every live card shares. Components add their own rules after it. */
export function baseCss(style: LiveStyle): string {
  return `text{font-family:${fontFamily(style)}}.mono{font-family:${FONT}}`;
}

/**
 * Background, texture and border for a card, as SVG markup, plus the gradient definition it needs.
 * `seed` makes the stars of a night sky belong to one user and stay the same between runs.
 */
export function cardBackground(style: LiveStyle, height: number, seed: string): { defs: string; markup: string } {
  const w = CARD_WIDTH;
  const id = 'lv-bg';
  const defs = `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${style.bgTop}"/><stop offset="1" stop-color="${style.bgBottom}"/></linearGradient>`;
  let texture = '';
  if (style.texture === 'stars' && style.variant === 'dark') {
    const random = seeded(`sky:${seed}`);
    texture = Array.from({ length: 60 }, () => {
      const x = random() * w;
      const y = random() * height;
      const r = 0.4 + random() * 1.1;
      return `<circle cx="${num(x)}" cy="${num(y)}" r="${num(r)}" fill="#ffffff" fill-opacity="${num(0.2 + random() * 0.55)}"/>`;
    }).join('');
  } else if (style.texture === 'grid') {
    texture =
      `<pattern id="lv-grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="${style.accent}" stroke-opacity="0.12"/></pattern>` +
      `<rect width="${w}" height="${height}" rx="${style.radius}" fill="url(#lv-grid)"/>`;
  } else if (style.texture === 'lines') {
    texture =
      `<pattern id="lv-lines" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 5.500H6" stroke="${style.fg}" stroke-opacity="${style.variant === 'dark' ? 0.05 : 0.06}"/></pattern>` +
      `<rect width="${w}" height="${height}" rx="${style.radius}" fill="url(#lv-lines)"/>`;
  }
  const markup =
    `<rect width="${w}" height="${height}" rx="${style.radius}" fill="url(#${id})"/>` +
    texture +
    `<rect x="0.5" y="0.5" width="${w - 1}" height="${height - 1}" rx="${style.radius}" fill="none" stroke="${style.border}"/>`;
  return { defs, markup };
}

/** A small pulsing dot and the word LIVE, which tells the reader the picture keeps moving. */
export function liveBadge(style: LiveStyle, x: number, y: number, motion: boolean): string {
  const dot = `<circle class="${motion ? 'lv-live' : ''}" cx="${x}" cy="${y - 4}" r="3.500" fill="${style.accent}"/>`;
  return (
    dot +
    `<text class="mono" x="${x + 10}" y="${y}" font-size="11" font-weight="700" letter-spacing="2" fill="${style.accent}">LIVE</text>`
  );
}

export const LIVE_BADGE_CSS = `.lv-live{animation:lv-pulse 1.6s ease-in-out infinite}@keyframes lv-pulse{50%{opacity:.3}}`;

/** Small-caps label, such as "SNAKE TRAIL". */
export function label(style: LiveStyle, text: string, x: number, y: number, anchor: 'start' | 'end' = 'start'): string {
  return `<text class="mono" x="${x}" y="${y}" text-anchor="${anchor}" font-size="11.500" font-weight="700" letter-spacing="2.400" fill="${style.accent}">${xmlEscape(text)}</text>`;
}

/** Wraps an SVG document around card contents. */
export function svgDocument(style: LiveStyle, height: number, title: string, defs: string, css: string, body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${height}" viewBox="0 0 ${CARD_WIDTH} ${height}" role="img" aria-labelledby="t">
<title id="t">${xmlEscape(title)}</title>
<defs>${defs}</defs>
<style>
${baseCss(style)}
${css}
</style>
${body}
</svg>
`;
}
