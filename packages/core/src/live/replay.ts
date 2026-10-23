import { Chess, type Move } from 'chess.js';

export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type Side = 'w' | 'b';

/** One change to a piece during the replay. */
export interface Step {
  /** Which move of the replay this happened in, counting from zero. */
  at: number;
  /** The square it moved to, or null when it left the board. */
  square: string | null;
  /** True for the moment a promoted piece appears: it has no earlier square. */
  appears?: boolean;
}

export interface PieceTrack {
  id: string;
  type: PieceType;
  color: Side;
  /** Square before the first replayed move, or null if the piece only appears during the replay. */
  start: string | null;
  /** Square after the last replayed move, or null if the piece was captured or promoted away. */
  end: string | null;
  steps: Step[];
}

export interface ReplayMove {
  san: string;
  from: string;
  to: string;
  color: Side;
  /** The full move number, such as 12 for "12. Rxd7". */
  number: number;
}

export interface Replay {
  pieces: PieceTrack[];
  moves: ReplayMove[];
  /** Whose turn it is after the last move. */
  turn: Side;
  check: boolean;
  checkmate: boolean;
  fen: string;
}

const FILES = 'abcdefgh';

/**
 * Plays `ply` half-moves of a game and follows every piece through the last `animate` of them,
 * so a picture can show those moves happening. Handles captures, castling, en passant and promotion.
 */
export function replayGame(sans: ReadonlyArray<string>, ply: number, animate: number): Replay {
  const total = Math.max(0, Math.min(ply, sans.length));
  const shown = Math.max(0, Math.min(animate, total));
  const chess = new Chess();

  for (let i = 0; i < total - shown; i++) chess.move(sans[i]!);

  const pieces: PieceTrack[] = [];
  const onSquare = new Map<string, PieceTrack>();
  for (const row of chess.board()) {
    for (const cell of row) {
      if (!cell) continue;
      const track: PieceTrack = {
        id: `${cell.color}${cell.type}${cell.square}`,
        type: cell.type as PieceType,
        color: cell.color as Side,
        start: cell.square,
        end: cell.square,
        steps: [],
      };
      pieces.push(track);
      onSquare.set(cell.square, track);
    }
  }

  const moves: ReplayMove[] = [];
  for (let i = 0; i < shown; i++) {
    const halfMove = total - shown + i; // zero-based index into the whole game
    const move: Move = chess.move(sans[halfMove]!);
    moves.push({ san: move.san, from: move.from, to: move.to, color: move.color as Side, number: Math.floor(halfMove / 2) + 1 });

    const mover = onSquare.get(move.from);
    if (!mover) throw new Error(`No piece on ${move.from} for ${move.san}`);

    // The piece that is taken: on the destination, or beside it for en passant.
    if (move.captured) {
      const takenSquare = move.flags.includes('e') ? `${move.to[0]}${move.from[1]}` : move.to;
      const taken = onSquare.get(takenSquare);
      if (taken) {
        taken.end = null;
        taken.steps.push({ at: i, square: null });
        onSquare.delete(takenSquare);
      }
    }

    onSquare.delete(move.from);
    mover.end = move.to;
    mover.steps.push({ at: i, square: move.to });
    onSquare.set(move.to, mover);

    // Castling also moves a rook.
    if (move.flags.includes('k') || move.flags.includes('q')) {
      const rank = move.from[1]!;
      const rookFrom = `${move.flags.includes('k') ? 'h' : 'a'}${rank}`;
      const rookTo = `${move.flags.includes('k') ? 'f' : 'd'}${rank}`;
      const rook = onSquare.get(rookFrom);
      if (rook) {
        onSquare.delete(rookFrom);
        rook.end = rookTo;
        rook.steps.push({ at: i, square: rookTo });
        onSquare.set(rookTo, rook);
      }
    }

    // A promoted pawn is replaced by the new piece the moment it arrives.
    if (move.promotion) {
      mover.end = null;
      mover.steps.push({ at: i, square: null });
      const promoted: PieceTrack = {
        id: `${move.color}${move.promotion}${move.to}-promoted-${i}`,
        type: move.promotion as PieceType,
        color: move.color as Side,
        start: null,
        end: move.to,
        steps: [{ at: i, square: move.to, appears: true }],
      };
      pieces.push(promoted);
      onSquare.set(move.to, promoted);
    }
  }

  return {
    pieces,
    moves,
    turn: chess.turn() as Side,
    check: chess.isCheck(),
    checkmate: chess.isCheckmate(),
    fen: chess.fen(),
  };
}

/** Column and row of a square, with a1 at (0, 0): files run 0 to 7 left to right, ranks 0 to 7 bottom to top. */
export function squareIndex(square: string): { file: number; rank: number } {
  return { file: FILES.indexOf(square[0]!), rank: Number(square[1]) - 1 };
}
