import { hslToHex } from '../color';
import type { Variant } from '../themes';

/** Each preset is a complete look for the live city, snake and chess board, matched to a template. */
export type Preset =
  | 'aurora'
  | 'sunrise'
  | 'night'
  | 'space'
  | 'arcade'
  | 'chalk'
  | 'editor'
  | 'blueprint'
  | 'paper'
  | 'terminal'
  | 'glow'
  | 'plain';

export type CellShape = 'square' | 'round' | 'diamond';
export type BoardFrame = 'glass' | 'wood' | 'flat' | 'blueprint' | 'chalk' | 'terminal';
export type PieceStyle = 'solid' | 'outline' | 'glow';

export interface Side {
  fill: string;
  stroke: string;
}

export interface LiveStyle {
  preset: Preset;
  variant: Variant;
  font: 'sans' | 'mono' | 'serif';
  bgTop: string;
  bgBottom: string;
  border: string;
  fg: string;
  muted: string;
  accent: string;
  accent2: string;
  radius: number;
  texture: 'none' | 'grid' | 'stars' | 'lines';
  snake: { cell: CellShape; gap: number; track: string; cellColor: string; body: string; head: string; glow: boolean };
  city: { top: string; left: string; right: string; slab: string; slabSide: string; line: string; levels: Array<[string, string, string]>; peak: [string, string, string] };
  chess: {
    frame: BoardFrame;
    light: string;
    dark: string;
    frameFill: string;
    frameStroke: string;
    coord: string;
    highlight: string;
    pieces: PieceStyle;
    white: Side;
    black: Side;
  };
}

const c = (hue: number, s: number, l: number): string => hslToHex(((hue % 360) + 360) % 360, s, l);

interface Recipe {
  font: LiveStyle['font'];
  radius: number;
  texture: LiveStyle['texture'];
  cell: CellShape;
  gap: number;
  glow: boolean;
  frame: BoardFrame;
  pieces: PieceStyle;
  /** Added to the picture's hue, so presets with a fixed mood stay recognisable. */
  hueShift: number;
  /** Replaces the picture's hue entirely when set. */
  fixedHue?: number;
  /** Background lightness for dark and light, and how far the lower colour drifts in hue. */
  bg: { dark: [number, number]; light: [number, number]; drift: number; sat: number };
  ink: { dark: [string, string]; light: [string, string] };
}

const RECIPES: Record<Preset, Recipe> = {
  aurora: { font: 'sans', radius: 22, texture: 'none', cell: 'round', gap: 3, glow: true, frame: 'glass', pieces: 'glow', hueShift: 0, bg: { dark: [0.07, 0.14], light: [0.96, 0.9], drift: 30, sat: 0.5 }, ink: { dark: ['#eaf6f3', '#8fb5ae'], light: ['#10302c', '#4b6f69'] } },
  sunrise: { font: 'sans', radius: 24, texture: 'none', cell: 'round', gap: 3, glow: false, frame: 'flat', pieces: 'solid', hueShift: 0, fixedHue: undefined, bg: { dark: [0.09, 0.2], light: [0.96, 0.88], drift: 38, sat: 0.6 }, ink: { dark: ['#fff7ee', '#d6bfb0'], light: ['#2a1b14', '#7a5a4a'] } },
  night: { font: 'sans', radius: 20, texture: 'stars', cell: 'square', gap: 3, glow: false, frame: 'glass', pieces: 'solid', hueShift: 0, bg: { dark: [0.07, 0.17], light: [0.95, 0.86], drift: 22, sat: 0.5 }, ink: { dark: ['#eef0ff', '#9aa0c8'], light: ['#1d2140', '#5b6190'] } },
  space: { font: 'sans', radius: 20, texture: 'stars', cell: 'round', gap: 4, glow: true, frame: 'glass', pieces: 'glow', hueShift: 25, bg: { dark: [0.05, 0.13], light: [0.96, 0.88], drift: 25, sat: 0.5 }, ink: { dark: ['#eef0ff', '#9aa0c8'], light: ['#1d2140', '#5b6190'] } },
  arcade: { font: 'mono', radius: 14, texture: 'grid', cell: 'square', gap: 2, glow: true, frame: 'terminal', pieces: 'glow', hueShift: 0, fixedHue: 135, bg: { dark: [0.05, 0.09], light: [0.95, 0.9], drift: 10, sat: 0.4 }, ink: { dark: ['#d9ffe6', '#79b78f'], light: ['#0d3a1f', '#3f7a58'] } },
  chalk: { font: 'serif', radius: 16, texture: 'lines', cell: 'round', gap: 3, glow: false, frame: 'chalk', pieces: 'outline', hueShift: 0, bg: { dark: [0.14, 0.16], light: [0.98, 0.96], drift: 0, sat: 0.2 }, ink: { dark: ['#f2efe4', '#a9bdb6'], light: ['#27304d', '#6a7191'] } },
  editor: { font: 'mono', radius: 14, texture: 'none', cell: 'square', gap: 3, glow: false, frame: 'flat', pieces: 'solid', hueShift: 0, fixedHue: 142, bg: { dark: [0.07, 0.09], light: [1, 0.97], drift: 0, sat: 0.2 }, ink: { dark: ['#e6edf3', '#8b98a9'], light: ['#1b2430', '#5f6c7d'] } },
  blueprint: { font: 'mono', radius: 10, texture: 'grid', cell: 'diamond', gap: 3, glow: false, frame: 'blueprint', pieces: 'outline', hueShift: 0, fixedHue: 205, bg: { dark: [0.1, 0.14], light: [0.96, 0.92], drift: 8, sat: 0.55 }, ink: { dark: ['#dbeeff', '#86a9c9'], light: ['#0f2a45', '#4a6d8c'] } },
  paper: { font: 'serif', radius: 8, texture: 'none', cell: 'square', gap: 3, glow: false, frame: 'wood', pieces: 'solid', hueShift: 0, bg: { dark: [0.09, 0.11], light: [0.97, 0.94], drift: 0, sat: 0.12 }, ink: { dark: ['#ecebe6', '#9a978f'], light: ['#1c1b19', '#68655d'] } },
  terminal: { font: 'mono', radius: 12, texture: 'lines', cell: 'square', gap: 2, glow: true, frame: 'terminal', pieces: 'glow', hueShift: 0, fixedHue: 125, bg: { dark: [0.04, 0.07], light: [0.94, 0.9], drift: 6, sat: 0.35 }, ink: { dark: ['#b9ffc9', '#5fa874'], light: ['#0f3d1d', '#3d7a52'] } },
  glow: { font: 'mono', radius: 18, texture: 'grid', cell: 'round', gap: 3, glow: true, frame: 'glass', pieces: 'glow', hueShift: 150, bg: { dark: [0.06, 0.12], light: [0.96, 0.9], drift: 30, sat: 0.5 }, ink: { dark: ['#e6fff9', '#86b8ae'], light: ['#0d3b34', '#3f7a70'] } },
  plain: { font: 'sans', radius: 8, texture: 'none', cell: 'square', gap: 2, glow: false, frame: 'flat', pieces: 'solid', hueShift: 0, fixedHue: 220, bg: { dark: [0.1, 0.12], light: [1, 0.97], drift: 0, sat: 0.08 }, ink: { dark: ['#e7e9ee', '#8d93a1'], light: ['#1f232b', '#6b7280'] } },
};

/** Builds a preset's colours for one theme variant, around the picture's hue. */
export function styleFor(preset: Preset, variant: Variant, pictureHue: number): LiveStyle {
  const r = RECIPES[preset];
  const dark = variant === 'dark';
  const hue = r.fixedHue ?? pictureHue + r.hueShift;
  const [bgA, bgB] = dark ? r.bg.dark : r.bg.light;
  const [fg, muted] = dark ? r.ink.dark : r.ink.light;
  const accent = c(hue, 0.78, dark ? 0.6 : 0.4);
  const accent2 = c(hue + 40, 0.82, dark ? 0.64 : 0.42);

  // City towers: lighter and brighter with activity on dark, deeper and stronger on light.
  const levels = [1, 2, 3, 4].map((level): [string, string, string] => {
    const t = level / 4;
    const l = dark ? 0.3 + 0.34 * t : 0.72 - 0.34 * t;
    return [c(hue, 0.74, l), c(hue, 0.7, l - 0.08), c(hue, 0.66, l - 0.17)];
  });
  const peakHue = hue + 42;
  const peakL = dark ? 0.68 : 0.46;

  const tint = (l: number, s = 0.4) => c(hue, s, l);
  const chess = ((): LiveStyle['chess'] => {
    const base = { highlight: c(hue + 20, 0.9, dark ? 0.55 : 0.55) };
    switch (r.frame) {
      case 'wood':
        return { ...base, frame: 'wood', light: dark ? '#c9b280' : '#ecdcb4', dark: dark ? '#7a5535' : '#b08a5e', frameFill: dark ? '#3a2616' : '#7a5535', frameStroke: dark ? '#6d4a2c' : '#4e3420', coord: dark ? '#b9a074' : '#e8d8b0', pieces: 'solid', white: { fill: '#fbf6e8', stroke: '#2b2118' }, black: { fill: '#2e2a26', stroke: '#e9dcc0' } };
      case 'flat':
        return { ...base, frame: 'flat', light: tint(dark ? 0.3 : 0.9, 0.15), dark: tint(dark ? 0.18 : 0.74, 0.2), frameFill: tint(dark ? 0.12 : 0.82, 0.18), frameStroke: tint(dark ? 0.3 : 0.65, 0.2), coord: muted, pieces: 'solid', white: { fill: dark ? '#f5f5f5' : '#ffffff', stroke: dark ? '#12141a' : '#1a1d24' }, black: { fill: dark ? '#20232c' : '#2a2e38', stroke: dark ? '#e8e8ee' : '#ffffff' } };
      case 'blueprint':
        return { ...base, frame: 'blueprint', light: dark ? 'rgba(120,190,255,0.10)' : 'rgba(30,100,190,0.10)', dark: 'rgba(0,0,0,0)', frameFill: 'rgba(0,0,0,0)', frameStroke: accent, coord: muted, pieces: 'outline', white: { fill: 'rgba(0,0,0,0)', stroke: dark ? '#bfe3ff' : '#0f3a66' }, black: { fill: dark ? 'rgba(120,190,255,0.28)' : 'rgba(30,100,190,0.3)', stroke: dark ? '#7fb8f0' : '#1c5a9e' } };
      case 'chalk':
        return { ...base, frame: 'chalk', light: dark ? 'rgba(255,255,255,0.09)' : 'rgba(90,110,170,0.12)', dark: 'rgba(0,0,0,0)', frameFill: 'rgba(0,0,0,0)', frameStroke: dark ? '#e9e5d6' : '#27304d', coord: muted, pieces: 'outline', white: { fill: 'rgba(0,0,0,0)', stroke: dark ? '#f4f0e2' : '#27304d' }, black: { fill: dark ? 'rgba(244,240,226,0.5)' : 'rgba(39,48,77,0.55)', stroke: dark ? '#f4f0e2' : '#27304d' } };
      case 'terminal':
        return { ...base, frame: 'terminal', light: tint(dark ? 0.14 : 0.82, 0.45), dark: tint(dark ? 0.07 : 0.7, 0.4), frameFill: tint(dark ? 0.05 : 0.88, 0.35), frameStroke: accent, coord: muted, pieces: 'glow', white: { fill: tint(dark ? 0.78 : 0.9, 0.8), stroke: tint(dark ? 0.9 : 0.3, 0.9) }, black: { fill: tint(dark ? 0.3 : 0.28, 0.7), stroke: tint(dark ? 0.6 : 0.15, 0.85) } };
      default:
        return { ...base, frame: 'glass', light: tint(dark ? 0.24 : 0.84, 0.35), dark: tint(dark ? 0.14 : 0.7, 0.4), frameFill: tint(dark ? 0.08 : 0.9, 0.35), frameStroke: accent, coord: muted, pieces: r.pieces, white: { fill: c(hue, 0.7, dark ? 0.84 : 0.97), stroke: c(hue, 0.7, dark ? 0.5 : 0.25) }, black: { fill: c(hue, 0.5, dark ? 0.32 : 0.28), stroke: c(hue, 0.6, dark ? 0.7 : 0.15) } };
    }
  })();

  return {
    preset,
    variant,
    font: r.font,
    bgTop: c(hue, r.bg.sat, bgA),
    bgBottom: c(hue + r.bg.drift, r.bg.sat + 0.05, bgB),
    border: c(hue, 0.4, dark ? 0.26 : 0.78),
    fg,
    muted,
    accent,
    accent2,
    radius: r.radius,
    texture: r.texture,
    snake: {
      cell: r.cell,
      gap: r.gap,
      track: c(hue, 0.25, dark ? 0.16 : 0.86),
      cellColor: c(hue, 0.78, dark ? 0.58 : 0.42),
      body: c(hue + 55, 0.8, dark ? 0.6 : 0.42),
      head: c(hue + 55, 0.9, dark ? 0.74 : 0.34),
      glow: r.glow,
    },
    city: {
      top: levels[3]![0],
      left: levels[3]![1],
      right: levels[3]![2],
      slab: c(hue, 0.3, dark ? 0.15 : 0.93),
      slabSide: c(hue, 0.3, dark ? 0.09 : 0.8),
      line: c(hue, 0.4, dark ? 0.32 : 0.7),
      levels,
      peak: [c(peakHue, 0.85, peakL), c(peakHue, 0.8, peakL - 0.08), c(peakHue, 0.75, peakL - 0.17)],
    },
    chess,
  };
}
