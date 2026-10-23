import type { PixelGrid } from './types';

/** Characters from empty to dense. None of them are special in XML or Markdown. */
export const RAMP = ' .:-=+*#%@';

/** Width of a monospace character divided by its line height, used to keep portraits in proportion. */
const CELL_ASPECT = 0.6;
/** Cells less opaque than this (out of 255) are left empty, so transparent corners stay blank. */
const OPAQUE_AT = 64;
/** How strongly a cell is pushed away from the average of its neighbours. */
const SHARPEN = 1.1;

/** Builds a PixelGrid from RGBA bytes, as produced by a canvas or an image decoder. */
export function gridFromRgba(rgba: ArrayLike<number>, width: number, height: number): PixelGrid {
  const count = width * height;
  const luma = new Array<number>(count);
  const alpha = new Array<number>(count);
  for (let i = 0; i < count; i++) {
    const r = rgba[i * 4] ?? 0;
    const g = rgba[i * 4 + 1] ?? 0;
    const b = rgba[i * 4 + 2] ?? 0;
    luma[i] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    alpha[i] = rgba[i * 4 + 3] ?? 255;
  }
  return { width, height, luma, alpha };
}

function percentile(sorted: number[], p: number): number {
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.round(p * (sorted.length - 1))))] ?? 0;
}

/**
 * Turns a picture into rows of text. On a dark background bright pixels get dense
 * characters; on a light one dark pixels do, so the portrait always reads as ink.
 * Contrast is stretched so photos with a narrow tonal range still use the whole ramp.
 */
export function asciiPortrait(grid: PixelGrid, cols: number, tone: 'dark' | 'light'): string[] {
  const rows = Math.max(1, Math.round(cols * (grid.height / grid.width) * CELL_ASPECT));

  const cells: Array<{ luma: number; opaque: boolean }> = [];
  for (let row = 0; row < rows; row++) {
    const y0 = Math.floor((row * grid.height) / rows);
    const y1 = Math.max(y0 + 1, Math.floor(((row + 1) * grid.height) / rows));
    for (let col = 0; col < cols; col++) {
      const x0 = Math.floor((col * grid.width) / cols);
      const x1 = Math.max(x0 + 1, Math.floor(((col + 1) * grid.width) / cols));
      let weighted = 0;
      let alphaSum = 0;
      let samples = 0;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const index = y * grid.width + x;
          const a = grid.alpha[index] ?? 0;
          weighted += (grid.luma[index] ?? 0) * a;
          alphaSum += a;
          samples++;
        }
      }
      cells.push({
        luma: alphaSum > 0 ? weighted / alphaSum : 0,
        opaque: samples > 0 && alphaSum / samples >= OPAQUE_AT,
      });
    }
  }

  // Sharpen so edges (eyes, hair, outlines) survive the drop to a few dozen characters.
  const sharpened = cells.map((cell, index) => {
    if (!cell.opaque) return cell.luma;
    const row = Math.floor(index / cols);
    const col = index % cols;
    let sum = 0;
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const r = row + dy;
        const c = col + dx;
        if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
        const neighbour = cells[r * cols + c];
        if (neighbour?.opaque) {
          sum += neighbour.luma;
          count++;
        }
      }
    }
    return cell.luma + SHARPEN * (cell.luma - sum / count);
  });

  const sorted = sharpened.filter((_luma, index) => cells[index]?.opaque).sort((a, b) => a - b);
  const low = percentile(sorted, 0.02);
  const high = percentile(sorted, 0.98);
  const span = high - low;
  const last = RAMP.length - 1;

  const lines: string[] = [];
  for (let row = 0; row < rows; row++) {
    let line = '';
    for (let col = 0; col < cols; col++) {
      const index = row * cols + col;
      if (!cells[index]?.opaque) {
        line += ' ';
        continue;
      }
      const level = span < 8 ? 0.5 : Math.min(1, Math.max(0, ((sharpened[index] ?? 0) - low) / span)) ** 0.9;
      line += RAMP[Math.round((tone === 'dark' ? level : 1 - level) * last)] ?? ' ';
    }
    lines.push(line.trimEnd());
  }
  return lines;
}
