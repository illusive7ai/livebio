/** A picture as an address an <img> can show. */
export const svgDataUri = (svg: string): string => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

/** Draws an SVG picture on a canvas and returns it as a PNG, `scale` times its own size. */
export async function svgToPng(svg: string, scale = 2): Promise<Blob> {
  const img = new Image();
  img.src = svgDataUri(svg);
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('This browser cannot draw the picture.');
  context.drawImage(img, 0, 0, canvas.width, canvas.height);
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('The picture could not be saved.'))), 'image/png'));
}

/** Saves a file by clicking a temporary link to it. */
export function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const downloadText = (filename: string, text: string): void => download(new Blob([text], { type: 'text/plain;charset=utf-8' }), filename);
