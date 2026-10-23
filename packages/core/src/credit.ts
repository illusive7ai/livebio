import type { Variant } from './themes';
import { xmlEscape } from './util';

/** The words in the credit. It reads "livebio by illusivehacks". */
export const CREDIT_TEXT = 'livebio by illusivehacks';

const FONT = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";
const SIZE = 15;
/** Width of one character cell. A monospace font at this size is a little under 9px wide. */
const CELL = 9.2;
const HEIGHT = 34;
const BASELINE = 22;
const PERIOD = 4.6;
/** Glyphs a letter briefly turns into while it glitches. */
const NOISE = ['#', '%', '@', '$', '&', '/', '\\', '<', '>', '0', '1', '*', '?', '+', '=', '~'];

export const CREDIT_WIDTH = Math.ceil(CREDIT_TEXT.length * CELL) + 8;
export const CREDIT_HEIGHT = HEIGHT;

const COLORS: Record<Variant, { fg: string; red: string; cyan: string }> = {
  dark: { fg: '#e6edf3', red: '#ff3b6b', cyan: '#27e1f0' },
  light: { fg: '#1f2328', red: '#e11d48', cyan: '#0891b2' },
};

/** A small repeatable number generator, so the glitch looks the same every time the credit is drawn. */
function seeded(seed: string): () => number {
  let state = 2166136261;
  for (const char of seed) state = Math.imul(state ^ char.charCodeAt(0), 16777619) >>> 0;
  return () => {
    state = Math.imul(state ^ (state >>> 15), 2246822507) >>> 0;
    state = Math.imul(state ^ (state >>> 13), 3266489909) >>> 0;
    return ((state ^= state >>> 16) >>> 0) / 4294967296;
  };
}

/**
 * The credit as an image: "livebio by illusivehacks" with each character glitching on its own, in short bursts
 * that ripple across the text. Every letter is drawn four times: a red copy, a cyan copy, the letter itself,
 * and a stand-in glyph that shows for a moment during a burst.
 *
 * Without motion, and for anyone who asks for reduced motion, it is still: the letters keep a faint
 * red and cyan fringe, and nothing moves.
 */
export function creditSvg(variant: Variant, motion: boolean): string {
  const { fg, red, cyan } = COLORS[variant];
  const rand = seeded('livebio-credit');
  const chars = [...CREDIT_TEXT];
  const layer = (cls: string, x: number, glyph: string, fill: string, extra = '') =>
    `<text class="${cls}" x="${x.toFixed(1)}" y="${BASELINE}" fill="${fill}"${extra}>${xmlEscape(glyph)}</text>`;

  const groups = chars
    .map((char, index) => {
      if (char === ' ') return '';
      const x = 4 + index * CELL;
      const delay = (rand() * 2.4).toFixed(2);
      const noise = NOISE[Math.floor(rand() * NOISE.length)]!;
      // One delay per letter, inherited by all four of its layers so they glitch together, and apart from other letters.
      const style = motion ? ` style="--d:${delay}s"` : '';
      return (
        `<g class="g"${style}>` +
        layer('r', x, char, red) +
        layer('b', x, char, cyan) +
        layer('w', x, char, fg) +
        (motion ? layer('a', x, noise, fg) : '') +
        `</g>`
      );
    })
    .join('');

  const css = motion
    ? `text{font-family:${FONT};font-size:${SIZE}px;font-weight:700}
.r{transform:translate(-1px,0);opacity:.75}.b{transform:translate(1px,0);opacity:.75}.a{opacity:0}
.g,.r,.b,.w,.a{animation-duration:${PERIOD}s;animation-delay:var(--d);animation-iteration-count:infinite;animation-timing-function:steps(1,end)}
.g{animation-name:g}.r{animation-name:r}.b{animation-name:b}.w{animation-name:w}.a{animation-name:a}
@keyframes g{0%,84%{transform:none}86%{transform:translate(2px,-1px) skewX(-10deg)}88%{transform:translate(-2px,1px) skewX(8deg)}90%{transform:translate(1px,0)}92%,100%{transform:none}}
@keyframes r{0%,84%{transform:translate(-1px,0)}86%{transform:translate(-5px,1px)}88%{transform:translate(-3px,-1px)}90%{transform:translate(4px,0)}92%,100%{transform:translate(-1px,0)}}
@keyframes b{0%,84%{transform:translate(1px,0)}86%{transform:translate(5px,-1px)}88%{transform:translate(3px,1px)}90%{transform:translate(-4px,0)}92%,100%{transform:translate(1px,0)}}
@keyframes w{0%,85%{opacity:1}86%,89%{opacity:0}90%,100%{opacity:1}}
@keyframes a{0%,85%{opacity:0}86%,89%{opacity:1}90%,100%{opacity:0}}
@media (prefers-reduced-motion:reduce){.g,.r,.b,.w,.a{animation:none}.a{opacity:0}.w{opacity:1}}`
    : `text{font-family:${FONT};font-size:${SIZE}px;font-weight:700}
.r{transform:translate(-1px,0);opacity:.75}.b{transform:translate(1px,0);opacity:.75}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CREDIT_WIDTH}" height="${HEIGHT}" viewBox="0 0 ${CREDIT_WIDTH} ${HEIGHT}" role="img" aria-labelledby="t">
<title id="t">${xmlEscape(CREDIT_TEXT)}</title>
<style>
${css}
</style>
${groups}
</svg>
`;
}
