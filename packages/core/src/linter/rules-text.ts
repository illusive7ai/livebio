import { excerpt, headingsOf, isProse, maskLine, parseDoc, replaceInProse, type Doc } from './scan';
import type { Rule } from './types';

const isBlank = (line: string | undefined): boolean => line === undefined || line.trim() === '';
const ATX_LINE = /^ {0,3}#{1,6}(?:\s|$)/;
/** A line that is only #hashtags, which is a list of tags and not a mistyped heading. */
const hashtagLine = (line: string): boolean => {
  const words = line.trim().split(/\s+/);
  return words.length > 1 && words.every((word) => /^#[\p{L}\p{N}_-]+$/u.test(word));
};

/** Edits some lines and keeps the rest, so a rule can say what to change without rebuilding the document. */
function edit(doc: Doc, change: (line: string, index: number) => string | string[] | null): string[] {
  const out: string[] = [];
  doc.lines.forEach((line, index) => {
    const next = change(line, index);
    if (next === null) out.push(line);
    else if (Array.isArray(next)) out.push(...next);
    else out.push(next);
  });
  return out;
}

const INVISIBLE = /[​⁠﻿    ]/g;

const headingSpace: Rule = {
  id: 'heading-space',
  title: 'Heading without a space after the #',
  severity: 'error',
  check: (doc) =>
    doc.lines.flatMap((line, i) =>
      isProse(doc, i) && /^ {0,3}#{1,6}[^\s#]/.test(line) && !hashtagLine(line)
        ? [{ line: i, message: `“${excerpt(line)}” is not shown as a heading because there is no space after the #.` }]
        : [],
    ),
  fix: (doc) => edit(doc, (line, i) => (isProse(doc, i) && /^ {0,3}#{1,6}[^\s#]/.test(line) && !hashtagLine(line) ? line.replace(/^( {0,3}#{1,6})/, '$1 ') : null)),
};

const closingHashes: Rule = {
  id: 'heading-closing-hashes',
  title: 'Heading ends with extra # marks',
  severity: 'tip',
  check: (doc) =>
    doc.lines.flatMap((line, i) => (isProse(doc, i) && /^ {0,3}#{1,6}[ \t]+\S.*[ \t]#+[ \t]*$/.test(line) ? [{ line: i, message: `“${excerpt(line)}” ends with # marks that are not needed.` }] : [])),
  fix: (doc) => edit(doc, (line, i) => (isProse(doc, i) && /^ {0,3}#{1,6}[ \t]+\S.*[ \t]#+[ \t]*$/.test(line) ? line.replace(/[ \t]+#+[ \t]*$/, '') : null)),
};

const isParagraphLine = (doc: Doc, i: number): boolean => {
  const line = doc.lines[i];
  return line !== undefined && isProse(doc, i) && !isBlank(line) && !/^\s*(?:#|>|[-*+]\s|\d+[.)]\s|\||<|-{3,}\s*$|={3,}\s*$|\[[^\]]+\]:)/.test(line);
};

/** The last line of a leading --- block (front matter), or -1 when the file does not start with one. */
const frontMatterEnd = (doc: Doc): number => (/^---\s*$/.test(doc.lines[0] ?? '') ? doc.lines.findIndex((l, i) => i > 0 && /^(?:---|\.\.\.)\s*$/.test(l)) : -1);

const trapped = (doc: Doc, i: number): boolean =>
  i > 0 && i > frontMatterEnd(doc) && isProse(doc, i) && /^ {0,3}-{3,}\s*$/.test(doc.lines[i]!) && isParagraphLine(doc, i - 1);

const setextTrap: Rule = {
  id: 'setext-trap',
  title: 'Line of dashes turns the text above into a heading',
  severity: 'warning',
  check: (doc) =>
    doc.lines.flatMap((_line, i) =>
      trapped(doc, i)
        ? [{ line: i, message: `“${excerpt(doc.lines[i - 1]!)}” becomes a heading because the dashes under it have no blank line before them. A divider needs a blank line above.` }]
        : [],
    ),
  fix: (doc) => edit(doc, (line, i) => (trapped(doc, i) ? ['', line] : null)),
};

const BLOCK_OPEN = /^\s*<(div|p|details|center|section|header|footer|article|aside)\b[^<>]*>\s*$/i;
const BLOCK_CLOSE = /^\s*<\/(div|p|details|center|section|header|footer|article|aside)>\s*$/i;
const MARKDOWN = /(!?\[[^\]]*\]\([^)]*\)|\*\*|__|`|^\s*#{1,6}\s|^\s*[-*+]\s|^\s*\d+\.\s)/;
const plainMarkdown = (doc: Doc, i: number): boolean => {
  const line = doc.lines[i];
  return line !== undefined && isProse(doc, i) && !isBlank(line) && !/^\s*</.test(line) && MARKDOWN.test(line);
};

/** Lines that need a blank line next to them for the markdown on the other side to be turned into formatting. */
function htmlBreaks(doc: Doc): Array<{ line: number; before: boolean; message: string }> {
  const out: Array<{ line: number; before: boolean; message: string }> = [];
  doc.lines.forEach((line, i) => {
    if (!isProse(doc, i)) return;
    if ((BLOCK_OPEN.test(line) || BLOCK_CLOSE.test(line) || /<\/summary>\s*$/i.test(line)) && plainMarkdown(doc, i + 1)) {
      out.push({ line: i + 1, before: true, message: `Markdown right after “${excerpt(line)}” is shown as plain text. Leave a blank line between the tag and the markdown.` });
    }
    if (BLOCK_CLOSE.test(line) && i > 0 && plainMarkdown(doc, i - 1)) {
      out.push({ line: i - 1, before: false, message: `Markdown right before “${excerpt(line)}” is shown as plain text. Leave a blank line between the markdown and the tag.` });
    }
  });
  return out;
}

const htmlMarkdown: Rule = {
  id: 'html-markdown-block',
  title: 'Markdown inside an HTML block is not rendered',
  severity: 'warning',
  check: (doc) => htmlBreaks(doc).map((b) => ({ line: b.line, message: b.message })),
  fix: (doc) => {
    const before = new Set(htmlBreaks(doc).filter((b) => b.before).map((b) => b.line));
    const after = new Set(htmlBreaks(doc).filter((b) => !b.before).map((b) => b.line));
    return edit(doc, (line, i) => {
      const parts = [line];
      if (before.has(i)) parts.unshift('');
      if (after.has(i)) parts.push('');
      return parts.length === 1 ? null : parts;
    });
  },
};

const BOLD = /(\*\*|__)([ \t]*)([^*_\n]*?[^*_\s])([ \t]*)\1/g;

const boldSpaces: Rule = {
  id: 'bold-spaces',
  title: 'Bold text with spaces inside the asterisks',
  severity: 'warning',
  check: (doc) =>
    doc.lines.flatMap((line, i) => {
      if (!isProse(doc, i)) return [];
      const found: string[] = [];
      replaceInProse(line, BOLD, (m) => (m[2] || m[4] ? (found.push(m[0]), m[0]) : m[0]));
      return found.map((text) => ({ line: i, message: `“${text}” is not shown in bold because of the spaces next to the marks.` }));
    }),
  fix: (doc) => edit(doc, (line, i) => (isProse(doc, i) ? replaceInProse(line, BOLD, (m) => (m[2] || m[4] ? `${m[1]}${m[3]}${m[1]}` : m[0])) : null)),
};

const invisible: Rule = {
  id: 'invisible-characters',
  title: 'Hidden or non-breaking space characters',
  severity: 'warning',
  check: (doc) =>
    doc.lines.flatMap((line, i) => {
      if (!isProse(doc, i)) return [];
      const count = (line.match(INVISIBLE) ?? []).length;
      return count > 0 ? [{ line: i, message: `${count} invisible character${count === 1 ? '' : 's'} (non-breaking or zero-width spaces), often left by copy and paste. They can break links and headings.` }] : [];
    }),
  fix: (doc) => edit(doc, (line, i) => (isProse(doc, i) && INVISIBLE.test(line) ? line.replace(/[​⁠﻿]/g, '').replace(/[    ]/g, ' ') : null)),
};

const tabs: Rule = {
  id: 'tabs',
  title: 'Tab characters used for indenting',
  severity: 'tip',
  check: (doc) => doc.lines.flatMap((line, i) => (isProse(doc, i) && /^\t/.test(line) ? [{ line: i, message: 'This line is indented with a tab. Tabs show at different widths, so nested lists can break; spaces are safer.' }] : [])),
  fix: (doc) => edit(doc, (line, i) => (isProse(doc, i) && /^\t/.test(line) ? line.replace(/^\t+/, (t) => '    '.repeat(t.length)) : null)),
};

/** Exactly two trailing spaces at the end of a paragraph line is a deliberate line break, so it is kept. */
const deliberateBreak = (doc: Doc, i: number): boolean => {
  const line = doc.lines[i]!;
  return / {2}$/.test(line) && !/ {3}$/.test(line) && !isBlank(line) && !isBlank(doc.lines[i + 1]) && !ATX_LINE.test(line);
};

const trailing: Rule = {
  id: 'trailing-space',
  title: 'Spaces at the end of a line',
  severity: 'tip',
  check: (doc) =>
    doc.lines.flatMap((line, i) => (isProse(doc, i) && /[ \t]+$/.test(line) && !deliberateBreak(doc, i) ? [{ line: i, message: 'This line ends with spaces that do nothing. (Two spaces at the end of a paragraph line are kept, as they make a line break.)' }] : [])),
  fix: (doc) => edit(doc, (line, i) => (isProse(doc, i) && /[ \t]+$/.test(line) && !deliberateBreak(doc, i) ? line.replace(/[ \t]+$/, '') : null)),
};

const blankLines: Rule = {
  id: 'blank-lines',
  title: 'Several blank lines in a row',
  severity: 'tip',
  check: (doc) => doc.lines.flatMap((line, i) => (!doc.code[i] && isBlank(line) && (i === 0 || (isBlank(doc.lines[i - 1]) && !doc.code[i - 1])) ? [{ line: i, message: i === 0 ? 'The file starts with a blank line.' : 'More than one blank line in a row; one is enough.' }] : [])),
  fix: (doc) => edit(doc, (line, i) => (!doc.code[i] && isBlank(line) && (i === 0 || (isBlank(doc.lines[i - 1]) && !doc.code[i - 1])) ? [] : null)),
};

const aroundHeadings: Rule = {
  id: 'blank-around-headings',
  title: 'Headings without a blank line around them',
  severity: 'tip',
  check: (doc) => headingsOf(doc).flatMap((h) => {
    const out = [];
    if (h.line > 0 && !isBlank(doc.lines[h.line - 1])) out.push({ line: h.line, message: `“${excerpt(doc.lines[h.line]!)}” has no blank line above it.` });
    if (h.line < doc.lines.length - 1 && !isBlank(doc.lines[h.line + 1])) out.push({ line: h.line, message: `“${excerpt(doc.lines[h.line]!)}” has no blank line below it.` });
    return out;
  }),
  fix: (doc) => {
    const heads = new Set(headingsOf(doc).map((h) => h.line));
    return edit(doc, (line, i) => {
      if (!heads.has(i)) return null;
      const parts = [line];
      if (i > 0 && !isBlank(doc.lines[i - 1])) parts.unshift('');
      if (i < doc.lines.length - 1 && !isBlank(doc.lines[i + 1])) parts.push('');
      return parts.length === 1 ? null : parts;
    });
  },
};

const BULLET = /^(\s*)([-*+])(\s+)\S/;
const isDivider = (line: string): boolean => /^\s*([-*_])(\s*\1){2,}\s*$/.test(line);

function dominantBullet(doc: Doc): { marker: string; counts: Map<string, number> } {
  const counts = new Map<string, number>();
  doc.lines.forEach((line, i) => {
    const m = isProse(doc, i) && !isDivider(line) ? BULLET.exec(line) : null;
    if (m) counts.set(m[2]!, (counts.get(m[2]!) ?? 0) + 1);
  });
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1] || (a[0] === '-' ? -1 : b[0] === '-' ? 1 : 0));
  return { marker: ranked[0]?.[0] ?? '-', counts };
}

const bulletStyle: Rule = {
  id: 'list-marker',
  title: 'Mixed bullet characters',
  severity: 'tip',
  check: (doc) => {
    const { marker, counts } = dominantBullet(doc);
    if (counts.size < 2) return [];
    return doc.lines.flatMap((line, i) => {
      const m = isProse(doc, i) && !isDivider(line) ? BULLET.exec(line) : null;
      return m && m[2] !== marker ? [{ line: i, message: `This bullet uses “${m[2]}” while most of the list uses “${marker}”.` }] : [];
    });
  },
  fix: (doc) => {
    const { marker, counts } = dominantBullet(doc);
    if (counts.size < 2) return doc.lines;
    return edit(doc, (line, i) => {
      const m = isProse(doc, i) && !isDivider(line) ? BULLET.exec(line) : null;
      return m && m[2] !== marker ? `${m[1]}${marker}${line.slice(m[1]!.length + 1)}` : null;
    });
  },
};

const unclosedFence: Rule = {
  id: 'unclosed-code-fence',
  title: 'Code block that is never closed',
  severity: 'error',
  check: (doc) => (doc.unclosedFence >= 0 ? [{ line: doc.unclosedFence, message: 'This code block is opened but never closed, so everything after it is shown as code.' }] : []),
  fix: (doc) => {
    if (doc.unclosedFence < 0) return doc.lines;
    const fence = /^ {0,3}(`{3,}|~{3,})/.exec(doc.lines[doc.unclosedFence]!)![1]!;
    return [...doc.lines, fence];
  },
};

const codeLanguage: Rule = {
  id: 'code-language',
  title: 'Code block without a language',
  severity: 'tip',
  check: (doc) => {
    const out = [];
    let open = false;
    for (let i = 0; i < doc.lines.length; i++) {
      const m = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(doc.lines[i]!);
      if (!doc.code[i] || !m) continue;
      if (!open) {
        open = true;
        if (m[2]!.trim() === '') out.push({ line: i, message: 'Add a language after the opening fence, such as ```js, so the code is coloured.', manual: true });
      } else open = false;
    }
    return out;
  },
};

const headingStructure: Rule = {
  id: 'heading-structure',
  title: 'Heading order and titles',
  severity: 'tip',
  check: (doc) => {
    const heads = headingsOf(doc);
    const out: Array<{ line: number; message: string; manual?: boolean }> = [];
    const h1 = heads.filter((h) => h.level === 1);
    const htmlH1 = doc.lines.some((l, i) => isProse(doc, i) && /<h1\b/i.test(l));
    if (heads.length > 0 && h1.length === 0 && !htmlH1) out.push({ line: heads[0]!.line, message: 'There is no top-level heading (# Title). It helps screen readers and search engines.', manual: true });
    for (const extra of h1.slice(1)) out.push({ line: extra.line, message: `A second top-level heading, “${excerpt(extra.text)}”. A page reads best with one title.`, manual: true });
    heads.forEach((h, i) => {
      const prev = heads[i - 1];
      if (prev && h.level > prev.level + 1) out.push({ line: h.line, message: `“${excerpt(h.text)}” jumps from level ${prev.level} to level ${h.level}. Do not skip levels.`, manual: true });
      if (h.text === '') out.push({ line: h.line, message: 'This heading has no text.', manual: true });
      else if (/[:.]$/.test(h.text)) out.push({ line: h.line, message: `“${excerpt(h.text)}” ends with punctuation, which is not needed in a heading.`, manual: true });
    });
    return out;
  },
};

const duplicateHeadings: Rule = {
  id: 'heading-duplicate',
  title: 'Two headings with the same text',
  severity: 'warning',
  check: (doc) => {
    const seen = new Map<string, number>();
    return headingsOf(doc).flatMap((h) => {
      if (h.text === '') return [];
      const key = h.text.toLowerCase();
      const first = seen.get(key);
      seen.set(key, first ?? h.line);
      return first === undefined ? [] : [{ line: h.line, message: `“${excerpt(h.text)}” already is a heading on line ${first + 1}. Links to it will reach the first one unless you rename it.`, manual: true }];
    });
  },
};

// ---- tables ----

interface Block {
  start: number;
  end: number;
}

function tableBlocks(doc: Doc): Block[] {
  const blocks: Block[] = [];
  let start = -1;
  const close = (end: number) => {
    if (start >= 0 && end - start >= 2) blocks.push({ start, end });
    start = -1;
  };
  doc.lines.forEach((line, i) => {
    const piped = isProse(doc, i) && /(^|[^\\])\|/.test(maskLine(line)) && !/^\s*</.test(line);
    if (piped) {
      if (start < 0) start = i;
    } else close(i);
  });
  close(doc.lines.length);
  return blocks;
}

const cellsOf = (line: string): string[] => {
  const inner = line.trim().replace(/^\|/, '').replace(/(?<!\\)\|$/, '');
  return inner.split(/(?<!\\)\|/).map((c) => c.trim());
};
const isSeparator = (line: string): boolean => {
  const cells = cellsOf(line);
  return cells.length > 0 && cells.every((c) => /^:?-+:?$/.test(c));
};
const rowOf = (cells: string[]): string => `| ${cells.join(' | ')} |`;

interface TableProblem {
  line: number;
  message: string;
  manual?: boolean;
}

function tableProblems(doc: Doc): { problems: TableProblem[]; replace: Map<number, string[]> } {
  const problems: TableProblem[] = [];
  const replace = new Map<number, string[]>();
  for (const { start, end } of tableBlocks(doc)) {
    const rows = doc.lines.slice(start, end);
    const width = cellsOf(rows[0]!).length;
    if (!isSeparator(rows[1]!)) {
      const sameWidth = rows.every((r) => cellsOf(r).length === width);
      if (width >= 2 && sameWidth && !rows.some(isSeparator)) {
        problems.push({ line: start, message: 'This table has no divider row (| --- | --- |) under its first row, so it is shown as plain text.' });
        replace.set(start, [doc.lines[start]!, rowOf(Array.from({ length: width }, () => '---'))]);
      }
      continue;
    }
    const sepWidth = cellsOf(rows[1]!).length;
    if (sepWidth !== width) {
      problems.push({ line: start + 1, message: `The divider row has ${sepWidth} column${sepWidth === 1 ? '' : 's'} but the header has ${width}, so the table is not drawn.` });
      const aligns = cellsOf(rows[1]!);
      replace.set(start + 1, [rowOf(Array.from({ length: width }, (_v, c) => aligns[c] ?? '---'))]);
    }
    rows.slice(2).forEach((row, r) => {
      const n = cellsOf(row).length;
      const index = start + 2 + r;
      if (n < width) {
        problems.push({ line: index, message: `This row has ${n} of ${width} cells.` });
        replace.set(index, [rowOf([...cellsOf(row), ...Array.from({ length: width - n }, () => '')])]);
      } else if (n > width) {
        problems.push({ line: index, message: `This row has ${n} cells but the table has ${width} columns. The extra cells are dropped.`, manual: true });
      }
    });
  }
  return { problems, replace };
}

const tables: Rule = {
  id: 'table',
  title: 'Table that will not render correctly',
  severity: 'error',
  check: (doc) => tableProblems(doc).problems,
  fix: (doc) => {
    const { replace } = tableProblems(doc);
    return edit(doc, (_line, i) => replace.get(i) ?? null);
  },
};

// ---- wording ----

const BRANDS: Array<[string, string]> = [
  ['github', 'GitHub'],
  ['gitlab', 'GitLab'],
  ['javascript', 'JavaScript'],
  ['typescript', 'TypeScript'],
  ['linkedin', 'LinkedIn'],
  ['youtube', 'YouTube'],
  ['tensorflow', 'TensorFlow'],
  ['pytorch', 'PyTorch'],
  ['graphql', 'GraphQL'],
  ['mongodb', 'MongoDB'],
  ['mysql', 'MySQL'],
  ['postgresql', 'PostgreSQL'],
  ['wordpress', 'WordPress'],
  ['stackoverflow', 'Stack Overflow'],
  ['nodejs', 'Node.js'],
];
const BRAND_BY_KEY = new Map(BRANDS);
const BRAND_RE = new RegExp(`(?<![\\w@/.#:-])(?:${BRANDS.map(([k]) => k).join('|')})(?![\\w/@-]|\\.\\w)`, 'gi');
const hasLowercase = (line: string): boolean => /\p{Ll}/u.test(maskLine(line));

const brandCase: Rule = {
  id: 'brand-names',
  title: 'Product names written the wrong way',
  severity: 'tip',
  check: (doc) =>
    doc.lines.flatMap((line, i) => {
      if (!isProse(doc, i) || !hasLowercase(line)) return [];
      const found: string[] = [];
      replaceInProse(line, BRAND_RE, (m) => {
        const right = BRAND_BY_KEY.get(m[0].toLowerCase())!;
        if (m[0] !== right) found.push(`“${m[0]}” should be “${right}”.`);
        return m[0];
      });
      return found.map((message) => ({ line: i, message }));
    }),
  fix: (doc) => edit(doc, (line, i) => (isProse(doc, i) && hasLowercase(line) ? replaceInProse(line, BRAND_RE, (m) => BRAND_BY_KEY.get(m[0].toLowerCase())!) : null)),
};

const TYPOS: Record<string, string> = {
  teh: 'the',
  recieve: 'receive',
  recieved: 'received',
  seperate: 'separate',
  definately: 'definitely',
  occured: 'occurred',
  wich: 'which',
  adress: 'address',
  enviroment: 'environment',
  begining: 'beginning',
  sucess: 'success',
  sucessful: 'successful',
  developper: 'developer',
  developement: 'development',
  langauge: 'language',
  langauges: 'languages',
  accomodate: 'accommodate',
  untill: 'until',
  tommorow: 'tomorrow',
  experiance: 'experience',
  knowlege: 'knowledge',
  libary: 'library',
  freind: 'friend',
  beleive: 'believe',
  alot: 'a lot',
  becuase: 'because',
  progamming: 'programming',
  programing: 'programming',
};
/** Not inside a hashtag, handle, address or file name: those are spelled the way their owner spelled them. */
const TYPO_RE = new RegExp(`(?<![\\w@/.#:-])(?:${Object.keys(TYPOS).join('|')})(?![\\w/@-]|\\.\\w)`, 'gi');
const matchCase = (found: string, right: string): string => (found === found.toUpperCase() && found.length > 1 ? right.toUpperCase() : found[0] === found[0]!.toUpperCase() ? right[0]!.toUpperCase() + right.slice(1) : right);

const typos: Rule = {
  id: 'spelling',
  title: 'Common spelling mistakes',
  severity: 'tip',
  check: (doc) =>
    doc.lines.flatMap((line, i) => {
      if (!isProse(doc, i)) return [];
      const found: string[] = [];
      replaceInProse(line, TYPO_RE, (m) => (found.push(`“${m[0]}” should be “${matchCase(m[0], TYPOS[m[0].toLowerCase()]!)}”.`), m[0]));
      return found.map((message) => ({ line: i, message }));
    }),
  fix: (doc) => edit(doc, (line, i) => (isProse(doc, i) ? replaceInProse(line, TYPO_RE, (m) => matchCase(m[0], TYPOS[m[0].toLowerCase()]!)) : null)),
};

const REPEAT = /\b(the|a|an|and|to|of|in|is|for|on|with|my|it)([ \t]+)\1\b/gi;

const repeated: Rule = {
  id: 'repeated-word',
  title: 'A word typed twice',
  severity: 'tip',
  check: (doc) =>
    doc.lines.flatMap((line, i) => {
      if (!isProse(doc, i)) return [];
      const found: string[] = [];
      replaceInProse(line, REPEAT, (m) => (found.push(`“${m[0]}” repeats a word.`), m[0]));
      return found.map((message) => ({ line: i, message }));
    }),
  fix: (doc) => edit(doc, (line, i) => (isProse(doc, i) ? replaceInProse(line, REPEAT, (m) => m[1]!) : null)),
};

export const textRules: Rule[] = [
  invisible,
  tabs,
  boldSpaces,
  brandCase,
  typos,
  repeated,
  htmlMarkdown,
  setextTrap,
  headingSpace,
  closingHashes,
  tables,
  bulletStyle,
  unclosedFence,
  trailing,
  aroundHeadings,
  blankLines,
  codeLanguage,
  headingStructure,
  duplicateHeadings,
];

export { parseDoc };
