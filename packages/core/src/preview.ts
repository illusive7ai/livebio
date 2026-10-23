import type { Output } from './types';

function toDataUri(svg: string): string {
  const bytes = new TextEncoder().encode(svg);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return `data:image/svg+xml;base64,${btoa(binary)}`;
}

/**
 * Turns generated output into Markdown that can be shown without the profile repository:
 * the <picture> is reduced to the image for the chosen colour mode and every generated
 * image is inlined as a data URI.
 */
export function previewMarkdown(output: Output, mode: 'dark' | 'light'): string {
  const paths = new Set(output.assets.map((asset) => asset.path));

  let markdown = output.readme.replace(
    /<picture>[\s\S]*?(<img [^>]*>)\s*<\/picture>/g,
    (_whole, img: string) => {
      const dark = img.replace(/-light\.svg/g, '-dark.svg');
      const wanted = mode === 'dark' && [...paths].some((p) => dark.includes(p)) ? dark : img;
      return wanted;
    },
  );

  for (const asset of output.assets) {
    markdown = markdown.split(asset.path).join(toDataUri(asset.content));
  }
  return markdown;
}
