/** What a README is made of, worked out once per pass so every rule reads the same picture of it. */

export interface Doc {
  lines: string[];
  /** True for lines inside a fenced code block, including its fence lines. */
  code: boolean[];
  /** True for lines inside an HTML comment, which tools such as profile generators use as markers. */
  comment: boolean[];
  /** Index of a fence line that is never closed, or -1. */
  unclosedFence: number;
}

const FENCE = /^ {0,3}(`{3,}|~{3,})(.*)$/;
const MARKER_START = /<!--[^>]*(?<![A-Za-z])(?:start|begin)(?![A-Za-z])[^>]*-->/i;
const MARKER_END = /<!--[^>]*(?<![A-Za-z])end(?![A-Za-z])[^>]*-->/i;

export function parseDoc(lines: string[]): Doc {
  const code: boolean[] = [];
  const comment: boolean[] = [];
  let open: { char: string; size: number; at: number } | null = null;
  let inComment = false;
  let inMarkers = false;
  lines.forEach((line, index) => {
    if (open) {
      code[index] = true;
      comment[index] = false;
      const m = FENCE.exec(line);
      if (m && m[1]![0] === open.char && m[1]!.length >= open.size && m[2]!.trim() === '') open = null;
      return;
    }
    if (inComment) {
      comment[index] = true;
      code[index] = false;
      if (line.includes('-->')) inComment = false;
      return;
    }
    // Profile generators fill the space between <!--START_SECTION--> and <!--END_SECTION--> themselves. A start
    // marker with no end marker after it is only a comment, so it never hides the rest of the file.
    if (inMarkers) {
      comment[index] = true;
      code[index] = false;
      if (MARKER_END.test(line)) inMarkers = false;
      return;
    }
    if (MARKER_START.test(line) && lines.some((later, j) => j > index && MARKER_END.test(later))) {
      comment[index] = true;
      code[index] = false;
      inMarkers = true;
      return;
    }
    const m = FENCE.exec(line);
    if (m && !(m[1]![0] === '`' && m[2]!.includes('`'))) {
      open = { char: m[1]![0]!, size: m[1]!.length, at: index };
      code[index] = true;
      comment[index] = false;
      return;
    }
    code[index] = false;
    const start = line.indexOf('<!--');
    if (start >= 0 && !line.slice(start).includes('-->')) {
      inComment = true;
      comment[index] = true;
      return;
    }
    comment[index] = false;
  });
  return { lines, code, comment, unclosedFence: open ? (open as { at: number }).at : -1 };
}

/** Whether a rule should look at this line as ordinary text. Code and comments are left alone. */
export const isProse = (doc: Doc, index: number): boolean => !doc.code[index] && !doc.comment[index];

const HOLE = '\u0000';
const blank = (text: string): string => HOLE.repeat(text.length);

/**
 * The line with every part that is not the author's own wording blanked out, keeping its length so positions
 * still line up: code spans, HTML tags and comments, link addresses, bare addresses and reference definitions.
 */
export function maskLine(line: string): string {
  let out = line;
  const hide = (re: RegExp) => {
    out = out.replace(re, (m) => blank(m));
  };
  hide(/<!--.*?-->/g);
  hide(/(`+)(?:(?!\1).)+?\1/g);
  hide(/<\/?[A-Za-z][^<>]*>/g);
  hide(/<(?:https?:|mailto:)[^<>\s]*>/g);
  hide(/\]\([^)]*\)/g);
  hide(/^\s*\[[^\]]+\]:\s*\S+.*$/);
  hide(/\b(?:https?:\/\/|www\.)[^\s<>)\]]+/g);
  hide(/:[a-z0-9_+-]+:/g);
  return out;
}

/** Replaces matches in the author's own wording only, never in the parts maskLine hides. */
export function replaceInProse(line: string, re: RegExp, replacement: (m: RegExpExecArray) => string): string {
  const masked = maskLine(line);
  let out = '';
  let last = 0;
  const pattern = new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`);
  for (let m = pattern.exec(masked); m; m = pattern.exec(masked)) {
    if (m[0] === '') {
      pattern.lastIndex++;
      continue;
    }
    out += line.slice(last, m.index) + replacement(m);
    last = m.index + m[0].length;
  }
  return out + line.slice(last);
}

export interface Heading {
  line: number;
  level: number;
  text: string;
  /** The anchor GitHub gives this heading, including the -1, -2 suffix for repeats. */
  slug: string;
}

export function slugOf(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]*>/g, '')
    .replace(/[^\p{L}\p{N}\p{M}_\s-]/gu, '')
    .trim()
    .replace(/\s/g, '-');
}

const ATX = /^ {0,3}(#{1,6})(?:[ \t]+(.*?))?(?:[ \t]+#+)?[ \t]*$/;

export function headingsOf(doc: Doc): Heading[] {
  const seen = new Map<string, number>();
  const found: Heading[] = [];
  doc.lines.forEach((line, index) => {
    if (!isProse(doc, index)) return;
    const m = ATX.exec(line);
    if (!m) return;
    const text = (m[2] ?? '').trim();
    const base = slugOf(text);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    found.push({ line: index, level: m[1]!.length, text, slug: count === 0 ? base : `${base}-${count}` });
  });
  return found;
}

/** The text of a line without its markdown wrapping, for messages. */
export function excerpt(line: string, max = 70): string {
  const text = line.trim().replace(/\s+/g, ' ');
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/** The line with inline code and comments blanked out, so addresses and tags in it are still readable. */
export function stripCode(line: string): string {
  return line.replace(/<!--.*?-->/g, (m) => blank(m)).replace(/(`+)(?:(?!\1).)+?\1/g, (m) => blank(m));
}

export interface Destination {
  line: number;
  kind: 'image' | 'link';
  /** Alt text of an image, or the words of a link. Empty for an HTML tag. */
  text: string;
  url: string;
  /** Where the address begins and ends in the line, for markdown. -1 for an HTML tag. */
  start: number;
  end: number;
  html: boolean;
}

const MD_LINK = /(!?)\[((?:[^[\]]|\[[^\]]*\])*)\]\(\s*(<[^>]*>|[^()\s]*(?:\([^()\s]*\)[^()\s]*)*)((?:\s+(?:"[^"]*"|'[^']*'|\([^)]*\)))?\s*)\)/g;

export function destinationsInLine(line: string, index: number): Destination[] {
  const found: Destination[] = [];
  const visible = stripCode(line);
  for (const m of visible.matchAll(MD_LINK)) {
    const raw = m[3] ?? '';
    const wrapped = raw.startsWith('<');
    const url = wrapped ? raw.slice(1, -1) : raw;
    const start = m.index + (m[0].length - (m[4]?.length ?? 0) - 1 - raw.length) + (wrapped ? 1 : 0);
    found.push({ line: index, kind: m[1] ? 'image' : 'link', text: m[2] ?? '', url, start, end: start + url.length, html: false });
  }
  for (const m of visible.matchAll(/<(img|a)\b[^<>]*>/gi)) {
    const attr = /\s(?:src|href)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(m[0]);
    if (!attr) continue;
    const url = attr[1] ?? attr[2] ?? attr[3] ?? '';
    const start = m.index + attr.index + attr[0].lastIndexOf(url);
    found.push({ line: index, kind: m[1]!.toLowerCase() === 'img' ? 'image' : 'link', text: '', url, start, end: start + url.length, html: true });
  }
  return found;
}

/** Every link and image address in the text, from markdown and from HTML tags. */
const destinationCache = new WeakMap<Doc, Destination[]>();

export function destinationsOf(doc: Doc): Destination[] {
  let found = destinationCache.get(doc);
  if (!found) {
    found = doc.lines.flatMap((line, index) => (isProse(doc, index) ? destinationsInLine(line, index) : []));
    destinationCache.set(doc, found);
  }
  return found;
}

/** Rewrites the addresses on one line. Return the same text to leave one alone. */
export function rewriteUrls(line: string, index: number, change: (dest: Destination) => string): string {
  let out = line;
  for (const dest of destinationsInLine(line, index).sort((x, y) => y.start - x.start)) {
    const next = change(dest);
    if (next !== dest.url) out = out.slice(0, dest.start) + next + out.slice(dest.end);
  }
  return out;
}

/** Applies a replacement to the visible part of a line (outside code spans), using positions from that part. */
export function rewriteVisible(line: string, re: RegExp, replacement: (m: RegExpMatchArray) => string): string {
  const visible = stripCode(line);
  let out = '';
  let last = 0;
  for (const m of visible.matchAll(new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g'))) {
    out += line.slice(last, m.index) + replacement(m);
    last = m.index + m[0].length;
  }
  return out + line.slice(last);
}
