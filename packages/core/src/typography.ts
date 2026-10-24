import type { Asset, CustomStyle, FontChoice } from './types';

/**
 * Typefaces a picture can name. GitHub shows a picture without loading web fonts, so each choice is a stack of
 * fonts that ship with the reader's device, ending in a generic family. It looks a little different from one
 * device to the next, which is why the choices are described by feel and not by font name.
 */
export const FONT_STACKS: Record<FontChoice, string> = {
  sans: "'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif",
  serif: "Georgia, 'Iowan Old Style', 'Palatino Linotype', 'Times New Roman', serif",
  mono: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
  rounded: "ui-rounded, 'SF Pro Rounded', 'Arial Rounded MT Bold', 'Trebuchet MS', Verdana, sans-serif",
  humanist: "Candara, 'Gill Sans', 'Gill Sans MT', Optima, Calibri, 'Segoe UI', sans-serif",
  classic: "'Palatino Linotype', Palatino, 'Book Antiqua', 'Iowan Old Style', Georgia, serif",
  typewriter: "'Courier New', Courier, 'Nimbus Mono PS', 'Liberation Mono', monospace",
  handwriting: "'Segoe Print', 'Bradley Hand', 'Chalkboard SE', 'Comic Sans MS', 'Comic Neue', cursive",
  impact: "Impact, Haettenschweiler, 'Franklin Gothic Bold', 'Arial Narrow Bold', 'Arial Black', sans-serif",
};

export const FONT_LABELS: Record<FontChoice, string> = {
  sans: 'Clean sans',
  serif: 'Serif',
  mono: 'Code',
  rounded: 'Rounded',
  humanist: 'Friendly sans',
  classic: 'Classic book',
  typewriter: 'Typewriter',
  handwriting: 'Handwriting',
  impact: 'Bold headline',
};

/** Whether a picture is one the user's typography applies to. The credit line keeps its own look. */
function isDesignPicture(asset: Asset): boolean {
  return asset.path.endsWith('.svg') && !/(^|\/)credit-/.test(asset.path);
}

/** Matches a size written as an attribute, font-size="12.5", or in a stylesheet, font-size:12.5px. */
const SIZE_ATTRIBUTE = /font-size="(\d+(?:\.\d+)?)"/g;
const SIZE_RULE = /font-size:(\d+(?:\.\d+)?)(px)?/g;
const FAMILY_ATTRIBUTE = /font-family="[^"]*"/g;
const FAMILY_RULE = /font-family:[^;}"]+/g;

const scaled = (value: string, factor: number): string => String(Math.round(Number(value) * factor * 100) / 100);

/** Rewrites one picture so its text uses the chosen typeface, colour and size. Pictures without text pass through. */
export function styleText(svg: string, custom: Pick<CustomStyle, 'font' | 'textColor' | 'textSize'>): string {
  let out = svg;
  if (custom.font) {
    const stack = FONT_STACKS[custom.font];
    out = out.replace(FAMILY_ATTRIBUTE, () => `font-family="${stack}"`).replace(FAMILY_RULE, () => `font-family:${stack}`);
  }
  if (custom.textSize !== undefined && custom.textSize !== 100) {
    const factor = custom.textSize / 100;
    out = out
      .replace(SIZE_ATTRIBUTE, (_all, value: string) => `font-size="${scaled(value, factor)}"`)
      .replace(SIZE_RULE, (_all, value: string, unit: string | undefined) => `font-size:${scaled(value, factor)}${unit ?? ''}`);
  }
  if (custom.textColor) {
    // :not(#x) raises the rule above any class selector in the design, and a stylesheet rule beats a fill attribute.
    const rule = `svg text:not(#x),svg tspan:not(#x){fill:${custom.textColor}}`;
    out = out.includes('</style>') ? out.replace('</style>', () => `${rule}\n</style>`) : out.replace(/(<svg[^>]*>)/, (tag) => `${tag}<style>${rule}</style>`);
  }
  return out;
}

/** Applies the user's typography to every picture of a design. */
export function styleAssets(assets: Asset[], custom: CustomStyle | undefined): Asset[] {
  if (!custom || (custom.font === undefined && custom.textColor === undefined && (custom.textSize === undefined || custom.textSize === 100))) return assets;
  return assets.map((asset) => (isDesignPicture(asset) ? { ...asset, content: styleText(asset.content, custom) } : asset));
}

const channel = (value: number): number => {
  const v = value / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};

/** How readable one #rrggbb colour is on another, from 1 (identical) to 21 (black on white), by the WCAG formula. */
export function contrastRatio(a: string, b: string): number {
  const luminance = (hex: string): number => {
    const n = Number.parseInt(hex.slice(1), 16);
    return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
  };
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (light + 0.05) / (dark + 0.05);
}
