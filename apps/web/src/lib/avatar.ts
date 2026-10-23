import { gridFromRgba, type Avatar } from '@livebio/core';

function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * Loads the profile picture and reads its pixels through a canvas. GitHub serves avatars with
 * open CORS headers, so this works without a server. Returns null if anything fails, and
 * templates then render without the picture.
 */
export async function loadAvatar(url: string): Promise<Avatar | null> {
  try {
    const sized = new URL(url);
    sized.searchParams.set('s', '128');
    const response = await fetch(sized);
    if (!response.ok) return null;
    const blob = await response.blob();

    const [dataUri, bitmap] = await Promise.all([blobToDataUri(blob), createImageBitmap(blob)]);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.drawImage(bitmap, 0, 0);
    const { data } = context.getImageData(0, 0, bitmap.width, bitmap.height);
    return { dataUri, grid: gridFromRgba(data, bitmap.width, bitmap.height) };
  } catch {
    return null;
  }
}
