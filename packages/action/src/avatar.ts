import { gridFromRgba, type Avatar } from '@livebio/core';
import jpeg from 'jpeg-js';
import { PNG } from 'pngjs';

const MAX_BYTES = 2_000_000;

interface Decoded {
  mime: string;
  width: number;
  height: number;
  data: ArrayLike<number>;
}

function decode(bytes: Uint8Array): Decoded | null {
  const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  if (isPng) {
    const png = PNG.sync.read(Buffer.from(bytes));
    return { mime: 'image/png', width: png.width, height: png.height, data: png.data };
  }
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8;
  if (isJpeg) {
    const image = jpeg.decode(bytes, { useTArray: true });
    return { mime: 'image/jpeg', width: image.width, height: image.height, data: image.data };
  }
  return null;
}

/**
 * Downloads the profile picture at a small size and decodes it. Returns null for formats
 * that cannot be read (such as GIF or WebP), so templates fall back to rendering without it.
 */
export async function loadAvatar(url: string): Promise<Avatar | null> {
  const sized = new URL(url);
  sized.searchParams.set('s', '128');

  const response = await fetch(sized);
  if (!response.ok) return null;
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length > MAX_BYTES) return null;

  const decoded = decode(bytes);
  if (!decoded) return null;
  return {
    dataUri: `data:${decoded.mime};base64,${Buffer.from(bytes).toString('base64')}`,
    grid: gridFromRgba(decoded.data, decoded.width, decoded.height),
  };
}
