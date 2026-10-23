import type { PieceType } from './replay';

/** Pieces are drawn in a 45 by 45 box with the base at the bottom, then scaled to the square. */
export const PIECE_BOX = 45;

const BASE = '<path d="M11 38.500v-3.500h23v3.500z"/>';

/** The shapes of each piece. They are original artwork, drawn for this project. */
const SHAPES: Record<PieceType, string> = {
  p:
    '<circle cx="22.5" cy="13" r="5.200"/>' +
    '<path d="M16.800 35c.3-6.500 2-9.800 5.700-13 3.700 3.200 5.400 6.500 5.700 13z"/>' +
    '<path d="M13.500 38.500v-3.500h18v3.500z"/>',
  r:
    BASE +
    '<path d="M14 35V20h17v15z"/>' +
    '<path d="M12.500 20v-9.500h4.200v3h3.800v-3h4v3h3.800v-3h4.200V20z"/>',
  n:
    BASE +
    '<path d="M13 35c0-8.500 3.500-14 8.500-17.500-2.400-.2-4.500.4-6.200 2l-2.800-3.200c1.600-4.800 5.400-7.800 9.800-9l.9-3.100 3.300 2.900c6.200 1.100 10 6.500 10 15.400V35z"/>',
  b:
    '<circle cx="22.500" cy="7.500" r="2.800"/>' +
    '<path d="M22.500 11c-5.200 3.800-8.200 8-8.200 12.500 0 3 1.500 5.200 4.200 6.800-.6 1.800-.9 3.500-.9 4.700h9.800c0-1.200-.3-2.900-.9-4.700 2.700-1.600 4.200-3.800 4.200-6.800 0-4.500-3-8.700-8.200-12.500z"/>' +
    '<path d="M11 38.500v-3.500h23v3.500z"/>',
  q:
    BASE +
    '<path d="M12 35l-3-17.500 6.500 7 3.500-12 3.500 12 3.500-12 3.500 12 6.500-7-3 17.500z"/>' +
    '<circle cx="9" cy="16" r="2.200"/><circle cx="16" cy="10.500" r="2.200"/><circle cx="22.500" cy="8.500" r="2.200"/><circle cx="29" cy="10.500" r="2.200"/><circle cx="36" cy="16" r="2.200"/>',
  k:
    BASE +
    '<path d="M13.500 35c0-8.500 3-12.500 9-15.500 6 3 9 7 9 15.500z"/>' +
    '<path d="M22.500 4v9M18.200 8.200h8.600" fill="none" stroke-width="2.600" stroke-linecap="round"/>' +
    '<path d="M15 21h15v4H15z"/>',
};

/** Details cut out of a piece, drawn in the colour of its outline. */
const DETAILS: Partial<Record<PieceType, string>> = {
  n: '<circle cx="20.500" cy="14.500" r="1.500" stroke="none"/>',
  b: '<path d="M19.300 18.800h6.400M22.500 15.600v6.400" fill="none" stroke-width="1.600" stroke-linecap="round"/>',
};

export interface PieceLook {
  fill: string;
  stroke: string;
  /** 'outline' draws the line only; 'glow' adds a soft halo; 'solid' is plain. */
  mode: 'solid' | 'outline' | 'glow';
}

/** One piece, at the origin of its square, scaled to `size` pixels. */
export function pieceMarkup(type: PieceType, look: PieceLook, size: number): string {
  const scale = size / PIECE_BOX;
  const halo = look.mode === 'glow' ? ` filter="url(#chs-glow)"` : '';
  const fill = look.mode === 'outline' ? look.fill : look.fill;
  return (
    `<g transform="scale(${Math.round(scale * 1000) / 1000})"${halo} fill="${fill}" stroke="${look.stroke}" stroke-width="1.500" stroke-linejoin="round">` +
    SHAPES[type] +
    `<g fill="${look.stroke}" stroke="${look.stroke}">${DETAILS[type] ?? ''}</g></g>`
  );
}
