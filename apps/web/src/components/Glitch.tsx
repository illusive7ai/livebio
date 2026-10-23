/** Glyphs a letter briefly turns into while it glitches. */
const NOISE = '#%@$&/\\<>01*?+=~';

/** A small repeatable pseudo-random number from a letter's position, so the effect never changes between renders. */
function hash(index: number, salt: number): number {
  let h = Math.imul(index + 1, 2654435761) ^ Math.imul(salt + 1, 40503);
  h = Math.imul(h ^ (h >>> 15), 2246822507);
  return ((h ^ (h >>> 13)) >>> 0) / 4294967296;
}

interface Props {
  text: string;
  /** Position of this word in the larger phrase, so every letter in the phrase keeps its own timing. */
  offset?: number;
}

/**
 * Text whose letters glitch one at a time, in short bursts that ripple along the line: a red and a cyan copy
 * split away, and the letter flickers into a stray symbol. The stray symbols are drawn with CSS, so they are never
 * selected or copied: only the real words are. The words stay readable for assistive technology, and with reduced
 * motion the letters only keep a faint colour fringe.
 */
export function Glitch({ text, offset = 0 }: Props) {
  return (
    <span className="glitch">
      <span className="visually-hidden">{text}</span>
      <span aria-hidden="true">
        {[...text].map((char, i) => {
          const n = offset + i;
          const delay = (hash(n, 1) * 2.4).toFixed(2);
          const noise = NOISE[Math.floor(hash(n, 2) * NOISE.length)]!;
          return (
            <span key={i} className="gc" data-c={char} style={{ ['--d' as string]: `${delay}s` }}>
              <span className="gm">{char}</span>
              <span className="gn" data-n={noise} />
            </span>
          );
        })}
      </span>
    </span>
  );
}
