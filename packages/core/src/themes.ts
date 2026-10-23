export type Variant = 'dark' | 'light';

export interface Palette {
  bg: string;
  panel: string;
  fg: string;
  muted: string;
  accent: string;
  accent2: string;
  border: string;
  track: string;
}

/** Colours follow GitHub's own dark and light themes so cards sit naturally on a profile. */
export const palettes: Record<Variant, Palette> = {
  dark: {
    bg: '#0d1117',
    panel: '#161b22',
    fg: '#e6edf3',
    muted: '#9198a1',
    accent: '#3fb950',
    accent2: '#58a6ff',
    border: '#30363d',
    track: '#21262d',
  },
  light: {
    bg: '#ffffff',
    panel: '#f6f8fa',
    fg: '#1f2328',
    muted: '#59636e',
    accent: '#1a7f37',
    accent2: '#0969da',
    border: '#d1d9e0',
    track: '#e6eaef',
  },
};

/** Which colour variants a theme setting needs to produce. */
export function variantsFor(theme: 'auto' | 'dark' | 'light'): Variant[] {
  return theme === 'auto' ? ['dark', 'light'] : [theme];
}
