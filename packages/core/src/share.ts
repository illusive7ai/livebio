/** Where the website lives, and the words and links for sharing it. Nothing here contacts anyone. */

export const SITE_URL = 'https://illusive7ai.github.io/livebio/';

export const SHARE_TEXT = 'livebio builds a GitHub profile README that keeps itself up to date. Free, open source, no sign-in.';

/** WhatsApp opens its own share sheet with the message ready. The link goes inside the message. */
export function whatsappLink(url: string = SITE_URL, text: string = SHARE_TEXT): string {
  return `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
}

/** Telegram's share page takes the link and the message as separate parts. */
export function telegramLink(url: string = SITE_URL, text: string = SHARE_TEXT): string {
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}
