const XML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Escape text for use inside SVG/HTML text and attribute values. */
export function xmlEscape(text: string): string {
  return text.replace(/[&<>"']/g, (c) => XML_ENTITIES[c] ?? c);
}

/** Escape text so Markdown renders it literally. */
export function escapeMarkdown(text: string): string {
  return text.replace(/[\\`*_{}[\]()#+\-.!|<>&~]/g, '\\$&');
}

/** Collapse whitespace and cut to at most `max` characters, ending in an ellipsis. */
export function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

/** Breaks text into lines of at most `width` characters, ending the last line with an ellipsis if cut. */
export function wrap(text: string, width: number, maxLines: number): string[] {
  const words = text.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const raw of words) {
    const word = raw.length > width ? `${raw.slice(0, width - 1)}…` : raw;
    if (current && current.length + 1 + word.length > width) {
      lines.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) lines.push(current);
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  kept[maxLines - 1] = truncate(`${kept[maxLines - 1]} …`, width);
  return kept;
}

export function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

/** GitHub usernames: 1-39 alphanumerics or single hyphens, not starting or ending with one. */
const USERNAME = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

export function isValidUsername(name: string): boolean {
  return USERNAME.test(name);
}

/** Returns an absolute http(s) URL, or null when the value is empty or unsafe. */
export function safeUrl(value: string | null | undefined): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  try {
    const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(raw) ? raw : `https://${raw}`);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}
