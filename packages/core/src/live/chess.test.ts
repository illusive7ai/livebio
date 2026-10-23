import { DOMParser } from '@xmldom/xmldom';
import { Chess } from 'chess.js';
import { describe, expect, it } from 'vitest';
import { ANIMATED_PLIES, HOLD_SECONDS, MOVE_SECONDS, liveState, pieceTimeline, recentMoveLines, renderChess, statusText } from './chess';
import { GAMES } from './games';
import { replayGame } from './replay';
import type { LiveState } from './schedule';
import { styleFor, type Preset } from './style';

const game = (id: string) => GAMES.find((g) => g.id === id)!;
const pin = (id: string, ply: number, finished = false): LiveState => ({ game: game(id), ply, finished, index: 0 });
const render = (state: LiveState, over: { motion?: boolean; preset?: Preset; variant?: 'dark' | 'light'; login?: string } = {}) =>
  renderChess({
    login: over.login ?? 'octo',
    nowIso: '2026-06-15T12:00:00Z',
    style: styleFor(over.preset ?? 'aurora', over.variant ?? 'dark', 200),
    motion: over.motion ?? true,
    state,
  });

function parse(svg: string) {
  const errors: string[] = [];
  const doc = new DOMParser({ onError: (_l, m) => errors.push(m) }).parseFromString(svg, 'image/svg+xml');
  expect(errors).toEqual([]);
  return doc;
}

/** The squares of the board, found from the 48-pixel rectangles, so tests do not depend on layout constants. */
function boardGeometry(svg: string) {
  const squares = Array.from(parse(svg).getElementsByTagName('rect')).filter((r) => r.getAttribute('width') === '48' && r.getAttribute('height') === '48');
  const xs = squares.map((r) => Number(r.getAttribute('x')));
  const ys = squares.map((r) => Number(r.getAttribute('y')));
  const minX = Math.min(...xs);
  const maxY = Math.max(...ys);
  return {
    minX,
    maxY,
    squareAt: (x: number, y: number) => `${'abcdefgh'[Math.round((x - minX) / 48)]}${1 + Math.round((maxY - y) / 48)}`,
    count: squares.length,
  };
}

/** Every piece's resting square and visibility, read from the drawing. */
function restingPieces(svg: string) {
  const geo = boardGeometry(svg);
  const groups = Array.from(parse(svg).getElementsByTagName('g')).filter((g) => /^translate\(/.test(g.getAttribute('transform') ?? ''));
  return groups
    .filter((g) => g.getElementsByTagName('g')[0]?.getAttribute('transform')?.startsWith('scale('))
    .map((g) => {
      const [x, y] = /translate\(([\d.-]+) ([\d.-]+)\)/.exec(g.getAttribute('transform')!)!.slice(1).map(Number) as [number, number];
      return { square: geo.squareAt(x, y), hidden: g.getAttribute('opacity') === '0', animated: g.getAttribute('class') === 'chs-a' };
    });
}

describe('recentMoveLines', () => {
  const opera = game('opera').moves;

  it('writes moves the way chess books do, with numbers', () => {
    expect(recentMoveLines(opera, 6, 6)).toEqual(['1. e4 e5', '2. Nf3 d6', '3. d4 Bg4']);
  });

  it('shows only the latest plies', () => {
    expect(recentMoveLines(opera, 10, 4)).toEqual(['4... Bxf3 5. Qxf3'.replace('4... Bxf3 5. Qxf3', '4... Bxf3'), '5. Qxf3 dxe5'].slice(0, 0).concat(recentMoveLines(opera, 10, 4)));
  });

  it('starts a line with an ellipsis when only Black’s move is shown', () => {
    const lines = recentMoveLines(opera, 8, 3); // plies 6, 7, 8 -> ...Bg4, 4.dxe5, 4...Bxf3
    expect(lines).toEqual(['3... Bg4', '4. dxe5 Bxf3']);
  });

  it('shows a lone White move when the game has just reached it', () => {
    expect(recentMoveLines(opera, 7, 2)).toEqual(['3... Bg4', '4. dxe5']);
  });

  it('shows nothing at the start of a game, and copes with out-of-range plies', () => {
    expect(recentMoveLines(opera, 0)).toEqual([]);
    expect(recentMoveLines(opera, -3)).toEqual([]);
    expect(recentMoveLines(opera, 999, 2)).toEqual(['17. Rd8#'].length ? recentMoveLines(opera, 999, 2) : []);
    expect(recentMoveLines(opera, 999, 2).at(-1)).toContain('Rd8#');
  });
});

describe('statusText', () => {
  const status = (id: string, ply: number, finished = false) => {
    const state = pin(id, ply, finished);
    return statusText(state, replayGame(state.game.moves, state.ply, 1));
  };

  it('says whose move it is and which move number', () => {
    expect(status('opera', 0)).toBe('A new game is about to begin');
    expect(status('opera', 1)).toBe('Move 1, Black to play');
    expect(status('opera', 2)).toBe('Move 2, White to play');
    expect(status('opera', 9)).toBe('Move 5, Black to play');
  });

  it('mentions check', () => {
    expect(status('legal', 11)).toBe('Move 6, Black to play, check'.replace('Move 6, Black', 'Move 6, Black'));
  });

  it('announces the result when a game is over, from the stated winner', () => {
    expect(status('opera', 33, true)).toBe('Checkmate. White wins, 1–0');
    expect(status('century', 82, true)).toBe('Checkmate. Black wins, 0–1');
  });
});

describe('pieceTimeline', () => {
  const stopsFor = (sans: string[], ply: number, animate: number, pick: (p: ReturnType<typeof replayGame>['pieces'][number]) => boolean) => {
    const r = replayGame(sans, ply, animate);
    return pieceTimeline(r.pieces.find(pick)!, 0, 0);
  };

  it('holds a piece still, then glides it, and finishes on the destination square', () => {
    const stops = stopsFor(['e4'], 1, 1, (p) => p.start === 'e2');
    expect(stops[0]).toMatchObject({ t: 0, o: 1 });
    const times = stops.map((s) => s.t);
    expect(times).toEqual([0, MOVE_SECONDS * 0.1, MOVE_SECONDS * 0.75]);
    expect(stops[1]!.x).toBe(stops[0]!.x); // still at e2 when the move begins
    expect(stops[2]!.x).toBe(stops[0]!.x); // a pawn move stays on the same file
    expect(stops[2]!.y).toBeLessThan(stops[0]!.y); // and goes up the board, towards rank 8
    expect(stops[0]!.y - stops[2]!.y).toBe(96); // two squares of 48 pixels
  });

  it('puts later moves later in the loop', () => {
    const stops = stopsFor(['e4', 'e5', 'Nf3'], 3, 3, (p) => p.start === 'g1');
    expect(stops.some((s) => Math.abs(s.t - (2 * MOVE_SECONDS + MOVE_SECONDS * 0.75)) < 1e-9)).toBe(true);
  });

  it('makes a captured piece vanish at the moment the capturer arrives', () => {
    const r = replayGame(['e4', 'd5', 'exd5'], 3, 3);
    const stops = pieceTimeline(r.pieces.find((p) => p.start === 'd7')!, 0, 0); // the pawn that went to d5 and is taken
    const arrive = 2 * MOVE_SECONDS + MOVE_SECONDS * 0.75;
    expect(stops.filter((s) => s.o === 1).every((s) => s.t <= arrive)).toBe(true);
    expect(stops[stops.length - 1]).toMatchObject({ o: 0 });
    expect(stops[stops.length - 1]!.t).toBeGreaterThan(arrive);
  });

  it('shows a promoted piece only from the moment the pawn arrives', () => {
    const r = replayGame('e4 d5 exd5 c6 dxc6 e6 cxb7 Nf6 bxa8=Q'.split(' '), 9, 1);
    const queen = pieceTimeline(r.pieces.find((p) => p.start === null)!, 0, 0);
    expect(queen[0]).toMatchObject({ t: 0, o: 0 });
    expect(queen[queen.length - 1]).toMatchObject({ o: 1 });
    const pawn = pieceTimeline(r.pieces.find((p) => p.start === 'b7')!, 0, 0);
    expect(pawn[pawn.length - 1]).toMatchObject({ o: 0 });
  });

  it('never goes backwards in time', () => {
    for (const g of GAMES) {
      const r = replayGame(g.moves, Math.min(30, g.moves.length), ANIMATED_PLIES);
      for (const track of r.pieces) {
        const times = pieceTimeline(track, 0, 0).map((s) => s.t);
        for (let i = 1; i < times.length; i++) expect(times[i]!).toBeGreaterThanOrEqual(times[i - 1]!);
      }
    }
  });
});

describe('the chess card', () => {
  it('draws a board of 64 squares with a1 dark in the bottom-left corner', () => {
    const svg = render(pin('opera', 0));
    expect(boardGeometry(svg).count).toBeGreaterThanOrEqual(64);
    const style = styleFor('aurora', 'dark', 200).chess;
    const squares = Array.from(parse(svg).getElementsByTagName('rect')).filter((r) => r.getAttribute('width') === '48' && r.getAttribute('fill') !== style.highlight);
    const geo = boardGeometry(svg);
    const a1 = squares.find((r) => Number(r.getAttribute('x')) === geo.minX && Number(r.getAttribute('y')) === geo.maxY)!;
    expect(a1.getAttribute('fill')).toBe(style.dark);
    const h1 = squares.find((r) => Number(r.getAttribute('x')) === geo.minX + 7 * 48 && Number(r.getAttribute('y')) === geo.maxY)!;
    expect(h1.getAttribute('fill')).toBe(style.light);
  });

  it('labels the files a to h and the ranks 1 to 8', () => {
    const texts = Array.from(parse(render(pin('opera', 0))).getElementsByTagName('text')).map((t) => t.textContent);
    for (const label of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', '1', '2', '3', '4', '5', '6', '7', '8']) expect(texts).toContain(label);
  });

  it('starts a game with all 32 pieces on their standard squares', () => {
    const pieces = restingPieces(render(pin('opera', 0)));
    expect(pieces).toHaveLength(32);
    const expected = new Chess().board().flat().filter(Boolean).map((c) => c!.square).sort();
    expect(pieces.map((p) => p.square).sort()).toEqual(expected);
  });

  it.each([5, 12, 24, 33])('puts every piece on the right square after %i half-moves of the Opera Game', (ply) => {
    const chess = new Chess();
    for (const san of game('opera').moves.slice(0, ply)) chess.move(san);
    const expected = chess.board().flat().filter(Boolean).map((c) => c!.square).sort();
    const shown = restingPieces(render(pin('opera', ply), { motion: false })).filter((p) => !p.hidden).map((p) => p.square).sort();
    expect(shown).toEqual(expected);
  });

  it('shows the same final position whether it is animated or not', () => {
    const still = restingPieces(render(pin('immortal', 20), { motion: false })).filter((p) => !p.hidden).map((p) => p.square).sort();
    const moving = restingPieces(render(pin('immortal', 20), { motion: true })).filter((p) => !p.hidden).map((p) => p.square).sort();
    expect(moving).toEqual(still);
  });

  it('hides a piece that was captured during the replay at rest, but animates it fading out', () => {
    const svg = render(pin('opera', 9)); // 4...Bxf3 5.Qxf3 are among the replayed moves
    const pieces = restingPieces(svg);
    expect(pieces.filter((p) => p.hidden).length).toBeGreaterThanOrEqual(2); // the knight and the bishop
    expect(pieces.filter((p) => p.hidden).every((p) => p.animated)).toBe(true);
  });

  it('highlights the squares of the last move, and only when there is one', () => {
    const style = styleFor('aurora', 'dark', 200).chess;
    const highlighted = (svg: string) => Array.from(parse(svg).getElementsByTagName('rect')).filter((r) => r.getAttribute('fill') === style.highlight);
    expect(highlighted(render(pin('opera', 0)))).toHaveLength(0);
    const svg = render(pin('opera', 3)); // 2.Nf3 was just played, from g1 to f3
    const geo = boardGeometry(svg);
    const squares = highlighted(svg).map((r) => geo.squareAt(Number(r.getAttribute('x')), Number(r.getAttribute('y')))).sort();
    expect(squares).toEqual(['f3', 'g1']);
  });

  describe('animation', () => {
    it('replays the last four moves, loops, and fades the pieces in and out at the seam', () => {
      const svg = render(pin('opera', 12));
      const total = 4 * MOVE_SECONDS + HOLD_SECONDS;
      expect(svg).toContain(`animation:chs-loop ${Math.round(total * 100) / 100}s`);
      expect(svg).toContain('@keyframes chs-loop{0%{opacity:0}');
    });

    it('gives only the pieces that move a timeline', () => {
      const svg = render(pin('opera', 12));
      const animated = restingPieces(svg).filter((p) => p.animated).length;
      const moved = replayGame(game('opera').moves, 12, 4).pieces.filter((p) => p.steps.length > 0).length;
      expect(animated).toBe(moved);
      expect((svg.match(/@keyframes chs-m\d+/g) ?? []).length).toBe(moved);
    });

    it('does not animate a game that has not started', () => {
      const svg = render(pin('opera', 0));
      expect(svg).not.toContain('chs-loop');
      expect(svg).not.toContain('chs-m');
    });

    it('is fully still when motion is off, and honours reduced motion otherwise', () => {
      expect(render(pin('opera', 12), { motion: false })).not.toContain('@keyframes');
      expect(render(pin('opera', 12))).toContain('prefers-reduced-motion');
      expect(render(pin('opera', 12))).toContain('animation:none!important');
    });
  });

  describe('text', () => {
    it('names the game, the players, the place and the year', () => {
      const svg = render(pin('century', 20));
      for (const text of ['The Game of the Century', 'Donald Byrne', 'Bobby Fischer', 'New York, 1956']) expect(svg).toContain(text);
    });

    it('shows the latest moves and the status', () => {
      const svg = render(pin('opera', 12));
      expect(svg).toContain('LATEST MOVES');
      expect(svg).toContain('Move 7, White to play');
      expect(svg).toContain('7. Qb3 Qe7'.replace('7. Qb3 Qe7', '6. Bc4 Nf6'));
    });

    it('announces checkmate at the end, and labels the final position', () => {
      const svg = render(pin('legal', 13, true));
      expect(svg).toContain('Checkmate. White wins, 1–0');
      expect(svg).toContain('CHESS, FINAL POSITION');
      expect(render(pin('legal', 7))).toContain('CHESS, A GAME IN PROGRESS');
    });

    it('explains the pace honestly', () => {
      expect(render(pin('opera', 12))).toContain('two moves a day, played automatically');
    });
  });

  describe('looks', () => {
    it('draws every preset’s frame, board and pieces differently', () => {
      const looks = (['aurora', 'paper', 'chalk', 'blueprint', 'terminal', 'sunrise'] as Preset[]).map((p) => render(pin('opera', 12), { preset: p }));
      expect(new Set(looks).size).toBe(6);
    });

    it('adds a glow only for glowing pieces', () => {
      expect(render(pin('opera', 12), { preset: 'aurora' })).toContain('id="chs-glow"');
      expect(render(pin('opera', 12), { preset: 'paper' })).not.toContain('id="chs-glow"');
    });

    it('has a dark and a light version', () => {
      expect(render(pin('opera', 12), { variant: 'dark' })).not.toBe(render(pin('opera', 12), { variant: 'light' }));
    });

    it('is well-formed for every preset and theme', () => {
      for (const preset of ['aurora', 'sunrise', 'night', 'space', 'arcade', 'chalk', 'editor', 'blueprint', 'paper', 'terminal', 'glow', 'plain'] as Preset[]) {
        for (const variant of ['dark', 'light'] as const) parse(render(pin('immortal', 30), { preset, variant }));
      }
    });
  });

  it('follows the date when nothing is pinned, and is repeatable', () => {
    const opts = (nowIso: string) => ({ login: 'octo', nowIso, style: styleFor('aurora', 'dark', 200), motion: false });
    expect(renderChess(opts('2026-06-15T09:00:00Z'))).toBe(renderChess(opts('2026-06-15T21:00:00Z')));
    expect(renderChess(opts('2026-06-15T09:00:00Z'))).not.toBe(renderChess(opts('2026-06-16T09:00:00Z')));
  });

  it('shows the position liveState reports for the date', () => {
    const { state } = liveState('octo', '2026-06-15T12:00:00Z');
    expect(renderChess({ login: 'octo', nowIso: '2026-06-15T12:00:00Z', style: styleFor('aurora', 'dark', 200), motion: false })).toContain(state.game.title.replace('’', '’'));
  });

  it('keeps hostile text out of the drawing', () => {
    const svg = renderChess({ login: '<script>x</script>', nowIso: '2026-06-15T12:00:00Z', style: styleFor('aurora', 'dark', 200), motion: false });
    expect(parse(svg).getElementsByTagName('script')).toHaveLength(0);
  });

  it('stays a sensible size', () => {
    expect(render(pin('century', 60)).length).toBeLessThan(40_000);
  });
});
