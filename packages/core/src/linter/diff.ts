export interface DiffRow {
  kind: 'same' | 'add' | 'remove';
  text: string;
  /** Line number in the original (counting from 1), for rows that exist there. */
  oldLine?: number;
  /** Line number in the corrected text (counting from 1), for rows that exist there. */
  newLine?: number;
}

/** The biggest comparison table worth building. Past this, the changed middle is shown as one removal and one addition. */
const MAX_CELLS = 4_000_000;

const linesOf = (text: string): string[] => (text === '' ? [] : (text.endsWith('\n') ? text.slice(0, -1) : text).split('\n'));

/** Line by line differences between two texts: what was kept, what was taken out and what was put in. */
export function diffLines(before: string, after: string): DiffRow[] {
  const a = linesOf(before);
  const b = linesOf(after);
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start++;
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--;
    endB--;
  }

  const rows: DiffRow[] = [];
  for (let i = 0; i < start; i++) rows.push({ kind: 'same', text: a[i]!, oldLine: i + 1, newLine: i + 1 });

  const n = endA - start;
  const m = endB - start;
  if (n * m > MAX_CELLS) {
    for (let i = start; i < endA; i++) rows.push({ kind: 'remove', text: a[i]!, oldLine: i + 1 });
    for (let j = start; j < endB; j++) rows.push({ kind: 'add', text: b[j]!, newLine: j + 1 });
  } else {
    // table[i][j] is the length of the longest run of lines the two middles share, from line i and j onwards.
    const width = m + 1;
    const table = new Uint32Array((n + 1) * width);
    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        table[i * width + j] = a[start + i] === b[start + j] ? table[(i + 1) * width + j + 1]! + 1 : Math.max(table[(i + 1) * width + j]!, table[i * width + j + 1]!);
      }
    }
    let i = 0;
    let j = 0;
    while (i < n || j < m) {
      if (i < n && j < m && a[start + i] === b[start + j]) {
        rows.push({ kind: 'same', text: a[start + i]!, oldLine: start + i + 1, newLine: start + j + 1 });
        i++;
        j++;
      } else if (i < n && (j === m || table[(i + 1) * width + j]! >= table[i * width + j + 1]!)) {
        rows.push({ kind: 'remove', text: a[start + i]!, oldLine: start + i + 1 });
        i++;
      } else {
        rows.push({ kind: 'add', text: b[start + j]!, newLine: start + j + 1 });
        j++;
      }
    }
  }

  for (let i = 0; i < a.length - endA; i++) rows.push({ kind: 'same', text: a[endA + i]!, oldLine: endA + i + 1, newLine: endB + i + 1 });
  return rows;
}
