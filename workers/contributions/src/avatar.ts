import { gridFromRgba } from '@livebio/core/src/avatar';
import type { Avatar } from '@livebio/core/src/types';
import jpeg from 'jpeg-js';
import UPNG from 'upng-js';

/**
 * Reads a profile picture inside the worker. The same job as the Action's, with decoders that run in Cloudflare's
 * runtime: pure JavaScript, with no Node-only parts. (The Action's decoder cannot run here.)
 */

const MAX_BYTES = 2_000_000;
const MAX_PIXELS = 512 * 512;

interface Decoded {
  mime: 'image/png' | 'image/jpeg';
  width: number;
  height: number;
  data: ArrayLike<number>;
}

function decode(bytes: Uint8Array): Decoded | null {
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    const whole = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    const image = UPNG.decode(whole);
    if (image.width * image.height > MAX_PIXELS) return null;
    return { mime: 'image/png', width: image.width, height: image.height, data: new Uint8Array(UPNG.toRGBA8(image)[0]!) };
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    const image = jpeg.decode(bytes, { useTArray: true, maxResolutionInMP: 1 });
    return { mime: 'image/jpeg', width: image.width, height: image.height, data: image.data };
  }
  return null;
}

function base64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

/** Pictures are only fetched from GitHub's own picture hosts, whatever address an API reply names. */
export function isGitHubPicture(address: string): boolean {
  try {
    const url = new URL(address);
    return url.protocol === 'https:' && /^avatars\d*\.githubusercontent\.com$/.test(url.hostname) && url.username === '' && url.password === '';
  } catch {
    return false;
  }
}

/** Downloads the picture at a small size and decodes it. Null for anything it cannot read, such as a GIF or WebP. */
export async function loadAvatar(address: string, fetcher: typeof fetch = fetch): Promise<Avatar | null> {
  if (!isGitHubPicture(address)) return null;
  try {
    const sized = new URL(address);
    sized.searchParams.set('s', '128');
    const response = await fetcher(sized);
    if (!response.ok) return null;
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.length === 0 || bytes.length > MAX_BYTES) return null;
    const decoded = decode(bytes);
    if (!decoded) return null;
    return { dataUri: `data:${decoded.mime};base64,${base64(bytes)}`, grid: gridFromRgba(decoded.data, decoded.width, decoded.height) };
  } catch {
    return null;
  }
}
