import { destinationsOf, excerpt, headingsOf, isProse, maskLine, rewriteUrls, rewriteVisible, stripCode, type Doc } from './scan';
import type { Finding, Rule } from './types';

function edit(doc: Doc, change: (line: string, index: number) => string): string[] {
  return doc.lines.map((line, index) => (isProse(doc, index) ? change(line, index) : line));
}

const URLISH = String.raw`(?:https?:\/\/|mailto:|#|\.{0,2}\/|[\w-]+(?:\.[\w-]+)+(?:\/|\b))`;

const linkSpace: Rule = {
  id: 'link-space',
  title: 'Space between the link text and its address',
  severity: 'error',
  check: (doc) =>
    doc.lines.flatMap((line, i) => {
      if (!isProse(doc, i)) return [];
      const found: Finding[] = [];
      rewriteVisible(line, new RegExp(String.raw`(!?\[[^\]\n]*\])[ \t]+(\(${URLISH}[^)\s]*\))`, 'g'), (m) => (found.push({ line: i, message: `“${excerpt(m[0])}” is not a link because of the space between ] and (.` }), m[0]));
      return found;
    }),
  fix: (doc) => edit(doc, (line) => rewriteVisible(line, new RegExp(String.raw`(!?\[[^\]\n]*\])[ \t]+(\(${URLISH}[^)\s]*\))`, 'g'), (m) => `${m[1]}${m[2]}`)),
};

const REVERSED = new RegExp(String.raw`(?<![\]\w)])\(([^()[\]\n]+)\)\[((?:https?:\/\/|#|\/)[^\]\s]*)\]`, 'g');

const linkReversed: Rule = {
  id: 'link-reversed',
  title: 'Link written the wrong way round',
  severity: 'error',
  check: (doc) =>
    doc.lines.flatMap((line, i) => {
      if (!isProse(doc, i)) return [];
      const found: Finding[] = [];
      rewriteVisible(line, REVERSED, (m) => (found.push({ line: i, message: `“${excerpt(m[0])}” has the round and square brackets swapped. A link is [text](address).` }), m[0]));
      return found;
    }),
  fix: (doc) => edit(doc, (line) => rewriteVisible(line, REVERSED, (m) => `[${m[1]}](${m[2]})`)),
};

const spacesInAddress = (url: string): boolean => /\s/.test(url);
const FILE_LIKE = /\/|\.[A-Za-z0-9]{2,5}$/;
const SPACED = /\]\(([^)"'<>\n]*\S[ \t]+[^)"'<>\n]*\S)\)/g;

const addressSpaces: Rule = {
  id: 'link-address-spaces',
  title: 'Spaces inside a link address',
  severity: 'warning',
  check: (doc) =>
    doc.lines.flatMap((line, i) => {
      if (!isProse(doc, i)) return [];
      const found: Finding[] = [];
      for (const m of stripCode(line).matchAll(SPACED)) {
        if (!spacesInAddress(m[1]!)) continue;
        found.push(FILE_LIKE.test(m[1]!.trim()) ? { line: i, message: `The address “${excerpt(m[1]!)}” has spaces in it, so the link breaks.` } : { line: i, message: `“${excerpt(m[0])}” has spaces in the parentheses, so it is not a link.`, manual: true });
      }
      return found;
    }),
  fix: (doc) => edit(doc, (line) => rewriteVisible(line, SPACED, (m) => (FILE_LIKE.test(m[1]!.trim()) ? `](${m[1]!.trim().replace(/[ \t]+/g, '%20')})` : m[0]))),
};

const GENERIC_TEXT = new Set(['here', 'click here', 'link', 'this link', 'this', 'read more', 'more', 'click', 'link here', 'url', 'website', 'this website', 'page']);

const linkText: Rule = {
  id: 'link-text',
  title: 'Link text that says nothing',
  severity: 'tip',
  check: (doc) => destinationsOf(doc).flatMap((d) => (d.kind === 'link' && !d.html && GENERIC_TEXT.has(d.text.trim().toLowerCase()) ? [{ line: d.line, message: `The link text “${d.text.trim()}” does not say where the link goes. Screen readers read links out of context.`, manual: true }] : [])),
};

const emptyLink: Rule = {
  id: 'link-empty',
  title: 'Link or image with no address',
  severity: 'error',
  check: (doc) =>
    destinationsOf(doc).flatMap((d) =>
      d.url.trim() === '' ? [{ line: d.line, message: `This ${d.kind} has no address, so it ${d.kind === 'image' ? 'shows nothing' : 'goes nowhere'}.`, manual: true }] : [],
    ),
};

const LOCAL = /^(?:file:|[A-Za-z]:[\\/]|\\\\|~\/|\/Users\/|\/home\/)|(?:^|\/\/)(?:localhost|127\.\d+\.\d+\.\d+|0\.0\.0\.0|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(?=[:/]|$)/i;

const localAddress: Rule = {
  id: 'local-address',
  title: 'Address that only works on your computer',
  severity: 'error',
  check: (doc) => destinationsOf(doc).flatMap((d) => (LOCAL.test(d.url.trim()) ? [{ line: d.line, message: `“${excerpt(d.url)}” points at your own computer, so nobody else can open it.`, manual: true }] : [])),
};

const unsafeAddress: Rule = {
  id: 'unsafe-address',
  title: 'Address that GitHub blocks',
  severity: 'error',
  check: (doc) =>
    destinationsOf(doc).flatMap((d) => {
      if (/^\s*javascript:/i.test(d.url)) return [{ line: d.line, message: 'javascript: addresses are removed by GitHub, so this does nothing.', manual: true }];
      if (d.kind === 'image' && /^\s*data:/i.test(d.url)) return [{ line: d.line, message: 'GitHub does not show images embedded as data: addresses. Upload the picture and link to it instead.', manual: true }];
      return [];
    }),
};

const KNOWN_HTTPS = new Set([
  'github.com', 'www.github.com', 'raw.githubusercontent.com', 'gist.github.com', 'img.shields.io', 'shields.io', 'linkedin.com', 'www.linkedin.com', 'twitter.com', 'www.twitter.com', 'x.com',
  'youtube.com', 'www.youtube.com', 'youtu.be', 'medium.com', 'dev.to', 'stackoverflow.com', 'npmjs.com', 'www.npmjs.com', 'pypi.org', 'gitlab.com', 'google.com', 'www.google.com',
  'instagram.com', 'www.instagram.com', 'facebook.com', 'www.facebook.com', 'reddit.com', 'www.reddit.com', 'twitch.tv', 'www.twitch.tv', 'discord.gg', 'discord.com', 'codepen.io',
  'kaggle.com', 'www.kaggle.com', 'leetcode.com', 'komarev.com', 'readme-typing-svg.demolab.com', 'streak-stats.demolab.com', 'hashnode.com', 'wikipedia.org', 'en.wikipedia.org',
  'bsky.app', 'mastodon.social', 'codeforces.com', 'hackerrank.com', 'www.hackerrank.com', 'producthunt.com', 'www.producthunt.com',
]);
const HTTP = /\bhttp:\/\/([A-Za-z0-9.-]+)/g;

function httpFindings(doc: Doc): Finding[] {
  return doc.lines.flatMap((line, i) => {
    if (!isProse(doc, i)) return [];
    const found: Finding[] = [];
    for (const m of stripCode(line).matchAll(HTTP)) {
      const host = m[1]!.toLowerCase();
      if (LOCAL.test(`http://${host}`) || host === 'www.w3.org') continue;
      found.push(KNOWN_HTTPS.has(host) ? { line: i, message: `http://${host} is not secure. ${host} supports https, which the corrected version uses.` } : { line: i, message: `http://${host} is not secure, and the browser may block it on a page served over https. Use https if ${host} supports it.`, manual: true });
    }
    return found;
  });
}

const insecure: Rule = {
  id: 'insecure-http',
  title: 'Address that starts with http://',
  severity: 'warning',
  check: httpFindings,
  fix: (doc) => edit(doc, (line) => rewriteVisible(line, HTTP, (m) => (KNOWN_HTTPS.has(m[1]!.toLowerCase()) ? `https://${m[1]}` : m[0]))),
};

const BLOB = /^(https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/blob\/[^?#\s]+)(\?[^#\s]*)?(#.*)?$/;
const blobImage = (url: string): boolean => BLOB.test(url) && !/[?&]raw=true\b/.test(url);

const blob: Rule = {
  id: 'image-blob-address',
  title: 'Image linked through a GitHub page address',
  severity: 'warning',
  check: (doc) => destinationsOf(doc).flatMap((d) => (d.kind === 'image' && blobImage(d.url) ? [{ line: d.line, message: `“${excerpt(d.url)}” is the page that shows the file, not the file. Add ?raw=true so the picture itself loads.` }] : [])),
  fix: (doc) =>
    edit(doc, (line, i) =>
      rewriteUrls(line, i, (d) => {
        if (d.kind !== 'image' || !blobImage(d.url)) return d.url;
        const m = BLOB.exec(d.url)!;
        return `${m[1]}${m[2] ? `${m[2]}&raw=true` : '?raw=true'}${m[3] ?? ''}`;
      }),
    ),
};

/** A plain-words description from a picture's file name, or '' when the name says nothing. */
export function altFromAddress(url: string): string {
  const shield = /img\.shields\.io\/badge\/([^/?]+)/i.exec(url);
  let name = shield ? (decodeURIComponent(shield[1]!).split(/(?<!-)-(?!-)/)[0] ?? '').replace(/--/g, '-').replace(/__/g, '_') : '';
  if (!name) {
    const path = url.split(/[?#]/)[0]!.replace(/^[A-Za-z][A-Za-z0-9+.-]*:\/\/[^/]*/, '');
    const last = path.split('/').filter(Boolean).pop() ?? '';
    try {
      name = decodeURIComponent(last).replace(/\.[A-Za-z0-9]{2,5}$/, '');
    } catch {
      name = last.replace(/\.[A-Za-z0-9]{2,5}$/, '');
    }
  }
  const words = name.replace(/[-_.+]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (words.length < 2 || !/\p{L}{2}/u.test(words) || /^[0-9a-f]{12,}$/i.test(words.replace(/ /g, '')) || /^https?:/i.test(words)) return '';
  return shield ? `${words} badge` : words;
}

const MD_NO_ALT = /!\[[ \t]*\](\([ \t]*)(<[^>]*>|[^()\s]*)/g;
const HTML_NO_ALT = /<img\b(?![^<>]*\balt\s*=)([^<>]*?)(\/?)>/gi;
const srcOf = (tag: string): string => /\ssrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(tag)?.slice(1).find((v) => v !== undefined) ?? '';
const quoteAttr = (text: string): string => text.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

const imgAlt: Rule = {
  id: 'image-alt',
  title: 'Image without alt text',
  severity: 'warning',
  check: (doc) =>
    doc.lines.flatMap((line, i) => {
      if (!isProse(doc, i)) return [];
      const found: Finding[] = [];
      rewriteVisible(line, MD_NO_ALT, (m) => {
        const alt = altFromAddress(m[2]!.replace(/^<|>$/g, ''));
        found.push(alt ? { line: i, message: `This image has no alt text. The corrected version uses “${alt}”, taken from its file name; replace it with a real description.` } : { line: i, message: 'This image has no alt text. People using screen readers, and anyone whose image fails to load, get nothing. Describe what it shows.', manual: true });
        return m[0];
      });
      rewriteVisible(line, HTML_NO_ALT, (m) => {
        const alt = altFromAddress(srcOf(m[0]));
        found.push(alt ? { line: i, message: `This <img> has no alt attribute. The corrected version uses “${alt}”, taken from its file name; replace it with a real description.` } : { line: i, message: 'This <img> has no alt attribute. Describe what it shows.', manual: true });
        return m[0];
      });
      return found;
    }),
  fix: (doc) =>
    edit(doc, (line) => {
      const first = rewriteVisible(line, MD_NO_ALT, (m) => {
        const alt = altFromAddress(m[2]!.replace(/^<|>$/g, ''));
        return alt ? `![${alt.replace(/[[\]]/g, '')}]${m[1]}${m[2]}` : m[0];
      });
      return rewriteVisible(first, HTML_NO_ALT, (m) => {
        const alt = altFromAddress(srcOf(m[0]));
        return alt ? `<img${m[1]} alt="${quoteAttr(alt)}"${m[2] ? ' /' : ''}>` : m[0];
      });
    }),
};

const GENERIC_ALT = new Set(['image', 'img', 'picture', 'photo', 'pic', 'screenshot', 'screen shot', 'banner', 'graphic', 'icon', 'untitled', 'alt text', 'alt']);

const genericAlt: Rule = {
  id: 'image-alt-generic',
  title: 'Alt text that describes nothing',
  severity: 'tip',
  check: (doc) =>
    destinationsOf(doc).flatMap((d) => {
      const alt = d.text.trim().toLowerCase();
      if (d.kind !== 'image' || d.html || alt === '') return [];
      if (GENERIC_ALT.has(alt) || /\.(png|jpe?g|gif|svg|webp)$/i.test(alt)) return [{ line: d.line, message: `The alt text “${d.text.trim()}” does not say what the picture shows.`, manual: true }];
      return [];
    }),
};

const imgWidth: Rule = {
  id: 'image-width',
  title: 'Image wider than the README column',
  severity: 'tip',
  check: (doc) =>
    doc.lines.flatMap((line, i) => {
      if (!isProse(doc, i)) return [];
      return [...stripCode(line).matchAll(/<img\b[^<>]*\swidth\s*=\s*["']?(\d+)(?!%)/gi)]
        .filter((m) => Number(m[1]) > 830)
        .map((m) => ({ line: i, message: `This image is ${m[1]} pixels wide, but the README column is about 830. GitHub shrinks it, so it is sharper to export it at that size.`, manual: true }));
    }),
};

const imgCount: Rule = {
  id: 'image-count',
  title: 'A lot of images',
  severity: 'warning',
  check: (doc) => {
    const images = destinationsOf(doc).filter((d) => d.kind === 'image');
    return images.length > 25 ? [{ line: images[25]!.line, message: `${images.length} images on one page is slow to load, and any one of them can fail. Consider trimming the badges.`, manual: true }] : [];
  },
};

// ---- references ----

const DEF = /^\s*\[([^\]]+)\]:\s*\S+/;
const norm = (label: string): string => label.trim().replace(/\s+/g, ' ').toLowerCase();

const references: Rule = {
  id: 'link-reference',
  title: 'Reference links that point nowhere',
  severity: 'error',
  check: (doc) => {
    const defined = new Set<string>();
    doc.lines.forEach((line, i) => {
      const m = isProse(doc, i) ? DEF.exec(line) : null;
      if (m) defined.add(norm(m[1]!));
    });
    const out: Finding[] = [];
    doc.lines.forEach((line, i) => {
      if (!isProse(doc, i) || DEF.test(line)) return;
      for (const m of stripCode(line).matchAll(/\[([^\]\n]+)\]\[([^\]\n]*)\]/g)) {
        const label = norm(m[2] || m[1]!);
        if (!defined.has(label)) out.push({ line: i, message: `The link “${excerpt(m[0])}” refers to “${label}”, which is never defined.`, manual: true });
      }
    });
    return out;
  },
};

const unusedReferences: Rule = {
  id: 'link-reference-unused',
  title: 'Reference definitions nobody uses',
  severity: 'tip',
  check: (doc) => {
    const text = doc.lines.filter((l, i) => isProse(doc, i) && !DEF.test(l)).join('\n').toLowerCase();
    return doc.lines.flatMap((line, i) => {
      const m = isProse(doc, i) ? DEF.exec(line) : null;
      return m && !text.includes(`[${norm(m[1]!)}]`) ? [{ line: i, message: `The definition “${norm(m[1]!)}” is never used.`, manual: true }] : [];
    });
  },
};

const anchors: Rule = {
  id: 'link-anchor',
  title: 'Link to a section that does not exist',
  severity: 'warning',
  check: (doc) => {
    const slugs = new Set(headingsOf(doc).map((h) => h.slug));
    const text = doc.lines.filter((_l, i) => isProse(doc, i)).join('\n');
    for (const m of text.matchAll(/\b(?:id|name)\s*=\s*["']([^"']+)["']/gi)) slugs.add(m[1]!.toLowerCase());
    return destinationsOf(doc).flatMap((d) => {
      if (!d.url.startsWith('#') || d.url.length < 2 || /^#L\d/.test(d.url)) return [];
      let target = d.url.slice(1);
      try {
        target = decodeURIComponent(target);
      } catch {
        // keep the raw text
      }
      const wanted = target.toLowerCase().replace(/^user-content-/, '');
      if (slugs.has(wanted)) return [];
      const near = [...slugs].find((s) => s.startsWith(wanted) || wanted.startsWith(s));
      return [{ line: d.line, message: `No section matches #${target}.${near ? ` Did you mean #${near}?` : ''}`, manual: true }];
    });
  },
};

// ---- HTML ----

interface Tag {
  name: string;
  closing: boolean;
  line: number;
  self: boolean;
}

/** The HTML tags in ordinary text, with the line each starts on. */
function tagsOf(doc: Doc): Tag[] {
  const out: Tag[] = [];
  const text = doc.lines.map((l, i) => (isProse(doc, i) ? stripCode(l) : '')).join('\n');
  const starts: number[] = [];
  let at = 0;
  for (const l of text.split('\n')) {
    starts.push(at);
    at += l.length + 1;
  }
  const lineAt = (offset: number): number => {
    let lo = 0;
    let hi = starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (starts[mid]! <= offset) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  };
  for (const m of text.matchAll(/<(\/?)([A-Za-z][A-Za-z0-9-]*)((?:"[^"]*"|'[^']*'|[^<>"'])*)>/g)) {
    out.push({ name: m[2]!.toLowerCase(), closing: m[1] === '/', line: lineAt(m.index), self: m[3]!.trimEnd().endsWith('/') });
  }
  return out;
}

const TRACKED = new Set(['div', 'details', 'summary', 'a', 'b', 'i', 'strong', 'em', 'span', 'center', 'table', 'picture', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'sup', 'sub', 'kbd', 'pre', 'blockquote', 'font', 'ul', 'ol']);

const unclosedHtml: Rule = {
  id: 'html-unclosed',
  title: 'HTML tag that is not closed',
  severity: 'error',
  check: (doc) => {
    const out: Finding[] = [];
    const stack: Tag[] = [];
    for (const tag of tagsOf(doc)) {
      if (!TRACKED.has(tag.name) || tag.self) continue;
      if (!tag.closing) {
        stack.push(tag);
        continue;
      }
      const at = stack.map((t) => t.name).lastIndexOf(tag.name);
      if (at < 0) {
        out.push({ line: tag.line, message: `</${tag.name}> closes a tag that was never opened.`, manual: true });
        continue;
      }
      for (const lost of stack.splice(at)) if (lost.name !== tag.name) out.push({ line: lost.line, message: `<${lost.name}> is never closed.`, manual: true });
    }
    for (const lost of stack) out.push({ line: lost.line, message: `<${lost.name}> is never closed.`, manual: true });
    return out;
  },
};

const BLOCKED = /<(script|iframe|style|form|input|button|object|embed|textarea|select|link|meta|base|marquee|blink|applet|frame|frameset)\b/gi;

const blockedHtml: Rule = {
  id: 'html-blocked',
  title: 'HTML that GitHub removes',
  severity: 'error',
  check: (doc) =>
    doc.lines.flatMap((line, i) => {
      if (!isProse(doc, i)) return [];
      const visible = stripCode(line);
      const out: Finding[] = [...visible.matchAll(BLOCKED)].map((m) => ({ line: i, message: `<${m[1]!.toLowerCase()}> is removed by GitHub, so it will not appear or run.`, manual: true }));
      for (const m of visible.matchAll(/<[A-Za-z][^<>]*\s(on[a-z]+)\s*=/gi)) out.push({ line: i, message: `The ${m[1]!.toLowerCase()} attribute is removed by GitHub, so it will not run.`, manual: true });
      return out;
    }),
};

const styleAttr: Rule = {
  id: 'html-style',
  title: 'Styling that GitHub ignores',
  severity: 'warning',
  check: (doc) =>
    doc.lines.flatMap((line, i) =>
      isProse(doc, i) && /<(?!svg|path|g\b)[A-Za-z][^<>]*\sstyle\s*=/i.test(stripCode(line))
        ? [{ line: i, message: 'GitHub removes style="…" attributes, so this styling is lost. Use align="center", width and height instead.', manual: true }]
        : [],
    ),
};

const CENTER = /<(\/?)center\b[^<>]*>/gi;

const deprecated: Rule = {
  id: 'html-deprecated',
  title: 'Old HTML tags',
  severity: 'warning',
  check: (doc) =>
    doc.lines.flatMap((line, i) => {
      if (!isProse(doc, i)) return [];
      const visible = stripCode(line);
      const out: Finding[] = [...visible.matchAll(CENTER)].map(() => ({ line: i, message: '<center> is an old tag. <div align="center"> does the same and is the usual way now.' }));
      for (const m of visible.matchAll(/<font\b/gi)) out.push({ line: i, message: '<font> is an old tag and GitHub ignores its colours and sizes.', manual: true });
      return out;
    }),
  fix: (doc) => edit(doc, (line) => rewriteVisible(line, CENTER, (m) => (m[1] ? '</div>' : '<div align="center">'))),
};

const detailsSummary: Rule = {
  id: 'details-summary',
  title: 'Collapsible section without a title',
  severity: 'warning',
  check: (doc) => {
    const out: Finding[] = [];
    let open: { line: number; summary: boolean } | null = null;
    for (const tag of tagsOf(doc)) {
      if (tag.name === 'details' && !tag.closing) open = { line: tag.line, summary: false };
      else if (tag.name === 'summary' && !tag.closing && open) open.summary = true;
      else if (tag.name === 'details' && tag.closing && open) {
        if (!open.summary) out.push({ line: open.line, message: 'This <details> has no <summary>, so the reader sees a bare “Details” arrow.', manual: true });
        open = null;
      }
    }
    return out;
  },
};

// ---- content ----

const PLACEHOLDERS: Array<[RegExp, string]> = [
  [/\blorem ipsum\b/i, 'Lorem ipsum filler text'],
  [/\bYour (?:Name|Username|User Name|Email|Project|Company|Title|Bio)\b/, 'A “Your …” template placeholder'],
  [/\bYOUR[_-][A-Z_-]{2,}\b/, 'A YOUR_… template placeholder'],
  [/<\s*your[\s_-][^<>]*>/i, 'A <your …> template placeholder'],
  [/\[(?:Your|Insert|Add)\b[^\]]*\](?!\()/i, 'A [Your …] template placeholder'],
  [/\b(?:TODO|FIXME|TBD)\b/, 'An unfinished TODO note'],
  [/\binsert [a-z ]{2,30} here\b/i, 'An “insert … here” placeholder'],
  [/github\.com\/(?:username|your-?username|user-?name)(?=[/\s)"']|$)/i, 'A github.com/username placeholder address'],
];

const placeholders: Rule = {
  id: 'placeholder',
  title: 'Leftover template text',
  severity: 'warning',
  check: (doc) =>
    doc.lines.flatMap((line, i) => {
      if (!isProse(doc, i)) return [];
      const visible = stripCode(line);
      return PLACEHOLDERS.filter(([re]) => re.test(visible)).map(([, what]) => ({ line: i, message: `${what} is still here: “${excerpt(line)}”.`, manual: true }));
    }),
};

const SECRETS: Array<[RegExp, string, boolean]> = [
  [/\bghp_[A-Za-z0-9]{30,}\b/, 'GitHub personal access token', true],
  [/\bgithub_pat_[A-Za-z0-9_]{40,}\b/, 'GitHub access token', true],
  [/\bgh[ousr]_[A-Za-z0-9]{30,}\b/, 'GitHub token', true],
  [/\bAKIA[0-9A-Z]{16}\b/, 'AWS access key', true],
  [/\bAIza[0-9A-Za-z_-]{35}\b/, 'Google API key', true],
  [/\bxox[baprs]-[0-9A-Za-z-]{10,}\b/, 'Slack token', true],
  [/\bsk-(?:ant-|proj-)?[A-Za-z0-9_-]{32,}\b/, 'API secret key', true],
  [/-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY(?: BLOCK)?-----/, 'private key', true],
  [/\b(?:password|passwd|secret|api[_-]?key|access[_-]?token|auth[_-]?token)\b\s*[:=]\s*['"]?[A-Za-z0-9/+_-]{16,}/i, 'password or key assignment', false],
];

const secrets: Rule = {
  id: 'secret',
  title: 'Something that looks like a secret',
  severity: 'error',
  check: (doc) =>
    doc.lines.flatMap((line, i) =>
      SECRETS.filter(([re]) => re.test(line)).map(([re, what, sure]) => {
        const value = re.exec(line)![0];
        return { line: i, message: `This looks like a ${what} (${value.slice(0, 4)}…). ${sure ? 'Treat it as leaked: revoke it where it was issued, then remove it. Deleting the line does not undo the leak, because it stays in the history.' : 'If it is real, revoke it and remove it.'}`, manual: true };
      }),
    ),
};

const SERVICES: Array<[RegExp, string]> = [
  [/github-readme-stats\.[\w.-]*vercel\.app/i, 'The public github-readme-stats address is shared by a very large number of profiles and often runs into GitHub’s rate limits, so the picture can turn into an error message.'],
  [/\.herokuapp\.com/i, 'Heroku ended its free plans in November 2022, and many hobby services on herokuapp.com stopped loading.'],
  [/\.vercel\.app/i, 'Pictures served from a free vercel.app address can stop loading when the service reaches its usage limit.'],
  [/\.glitch\.me/i, 'Free glitch.me projects sleep or disappear, so the picture may not load.'],
];

const thirdParty: Rule = {
  id: 'third-party',
  title: 'Picture that depends on someone else’s free server',
  severity: 'tip',
  check: (doc) => {
    const seen = new Set<string>();
    const out: Finding[] = [];
    for (const d of destinationsOf(doc)) {
      if (d.kind !== 'image') continue;
      for (const [re, why] of SERVICES) {
        const host = /\/\/([^/\s]+)/.exec(d.url)?.[1] ?? '';
        if (re.test(d.url) && !seen.has(host)) {
          seen.add(host);
          out.push({ line: d.line, message: `${host}: ${why} If it matters, host the picture yourself.`, manual: true });
        }
      }
    }
    return out;
  },
};

const email: Rule = {
  id: 'email',
  title: 'Email address in plain text',
  severity: 'tip',
  check: (doc) =>
    doc.lines.flatMap((line, i) => {
      if (!isProse(doc, i)) return [];
      return [...maskLine(line).matchAll(/(?<![\w.+-])[\w.+-]+@[\w-]+\.[\w.-]*[A-Za-z]/g)]
        .filter((m) => !/@users\.noreply\.github\.com$/i.test(m[0]))
        .map(() => ({ line: i, message: 'A plain email address is easy for spam programs to collect. A contact link or a profile form is safer.', manual: true }));
    }),
};

const emptyFile: Rule = {
  id: 'empty',
  title: 'Nothing written yet',
  severity: 'warning',
  check: (doc) => (doc.lines.every((l) => l.trim() === '') ? [{ line: 0, message: 'The README is empty.', manual: true }] : []),
};

const BYTES = (doc: Doc): number => new TextEncoder().encode(doc.lines.join('\n')).length;

const size: Rule = {
  id: 'size',
  title: 'README that is very long',
  severity: 'warning',
  check: (doc) => {
    const bytes = BYTES(doc);
    if (bytes > 500 * 1024) return [{ line: 0, message: `At ${Math.round(bytes / 1024)} KB this is over GitHub’s 500 KB limit; the rest is cut off and not shown.`, manual: true }];
    if (bytes > 100 * 1024) return [{ line: 0, message: `At ${Math.round(bytes / 1024)} KB this is very large and slow to open.`, manual: true }];
    return doc.lines.length > 400 ? [{ line: 0, message: `${doc.lines.length} lines is a lot for a profile. Most visitors stop reading well before the end.`, manual: true }] : [];
  },
};

export const linkRules: Rule[] = [
  emptyFile,
  linkSpace,
  linkReversed,
  addressSpaces,
  insecure,
  blob,
  imgAlt,
  deprecated,
  linkText,
  emptyLink,
  localAddress,
  unsafeAddress,
  genericAlt,
  imgWidth,
  imgCount,
  references,
  unusedReferences,
  anchors,
  unclosedHtml,
  blockedHtml,
  styleAttr,
  detailsSummary,
  placeholders,
  secrets,
  thirdParty,
  email,
  size,
];
