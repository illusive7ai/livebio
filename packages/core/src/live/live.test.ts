import { Chess } from 'chess.js';
import { describe, expect, it } from 'vitest';
import { GAMES } from './games';
import { replayGame, squareIndex } from './replay';
import { PAUSE_PLIES, PLIES_PER_DAY, dayNumber, playlistFor, scheduleGame, startOffset } from './schedule';

describe('the historical games', () => {
  it('includes five distinct games', () => {
    expect(GAMES).toHaveLength(5);
    expect(new Set(GAMES.map((g) => g.id)).size).toBe(5);
  });

  it.each(GAMES.map((g) => [g.title, g] as const))('%s replays legally to the stated result', (_title, game) => {
    const chess = new Chess();
    for (const san of game.moves) chess.move(san); // throws on any illegal move
    expect(chess.isCheckmate()).toBe(true);
    const winner = chess.turn() === 'w' ? '0-1' : '1-0'; // the side to move has been mated
    expect(winner).toBe(game.result);
  });

  it('gives every game real names, a place and a year', () => {
    for (const game of GAMES) {
      for (const text of [game.title, game.white, game.black, game.place, game.year]) expect(text.trim().length).toBeGreaterThan(2);
    }
  });

  it('records moves in a form the rules engine reads without extra characters', () => {
    for (const game of GAMES) for (const san of game.moves) expect(san).toMatch(/^[KQRBNa-hO0-9x=+#-]+$/);
  });
});

describe('dayNumber', () => {
  it('counts whole UTC days since 1970', () => {
    expect(dayNumber('1970-01-01T00:00:00Z')).toBe(0);
    expect(dayNumber('1970-01-02T00:00:00Z')).toBe(1);
    expect(dayNumber('2026-06-15T23:59:59Z')).toBe(dayNumber('2026-06-15T00:00:00Z'));
  });

  it('is zero for a date it cannot read, rather than failing', () => {
    expect(dayNumber('nonsense')).toBe(0);
  });
});

describe('playlistFor', () => {
  it('contains every game exactly once', () => {
    expect(playlistFor('octo').map((g) => g.id).sort()).toEqual(GAMES.map((g) => g.id).sort());
  });

  it('is the same for the same user, whatever the capitalisation, and does not change the source list', () => {
    expect(playlistFor('Octo').map((g) => g.id)).toEqual(playlistFor('octo').map((g) => g.id));
    const before = GAMES.map((g) => g.id);
    playlistFor('someone');
    expect(GAMES.map((g) => g.id)).toEqual(before);
  });

  it('differs between users', () => {
    const orders = new Set(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((u) => playlistFor(u).map((g) => g.id).join()));
    expect(orders.size).toBeGreaterThan(2);
  });
});

describe('startOffset', () => {
  it('stays inside the cycle and does not change for a user', () => {
    for (const user of ['a', 'octo', 'Illusive7ai']) {
      const offset = startOffset(user, 200);
      expect(offset).toBeGreaterThanOrEqual(0);
      expect(offset).toBeLessThan(200);
      expect(startOffset(user, 200)).toBe(offset);
    }
  });

  it('ignores capitalisation, as GitHub does', () => {
    expect(startOffset('Octo', 300)).toBe(startOffset('octo', 300));
  });

  it('starts different users at different points', () => {
    const offsets = new Set(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'].map((u) => startOffset(u, 1000)));
    expect(offsets.size).toBeGreaterThanOrEqual(8);
  });
});

describe('scheduleGame', () => {
  const day = (n: number) => new Date(n * 86_400_000).toISOString();
  const cycle = GAMES.reduce((sum, g) => sum + g.moves.length + PAUSE_PLIES, 0);

  it('is a pure function of the username and the date', () => {
    expect(scheduleGame('octo', '2026-06-15T10:00:00Z')).toEqual(scheduleGame('octo', '2026-06-15T10:00:00Z'));
  });

  it('shows the same position all day, and moves on at midnight', () => {
    const morning = scheduleGame('octo', '2026-06-15T00:00:01Z');
    const night = scheduleGame('octo', '2026-06-15T23:59:59Z');
    expect(night).toEqual(morning);
  });

  it('plays exactly two half-moves a day: one for White and one for Black', () => {
    expect(PLIES_PER_DAY).toBe(2);
    let checked = 0;
    for (let d = 20_000; d < 20_000 + 60; d++) {
      const a = scheduleGame('octo', day(d));
      const b = scheduleGame('octo', day(d + 1));
      if (a.index === b.index && !a.finished && !b.finished) {
        expect(b.ply - a.ply).toBe(2); // the literal number, not the constant under test
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(20);
  });

  it('keeps every position inside the game it belongs to', () => {
    for (let d = 20_000; d < 20_000 + cycle; d++) {
      const s = scheduleGame('octo', day(d));
      expect(s.ply).toBeGreaterThanOrEqual(0);
      expect(s.ply).toBeLessThanOrEqual(s.game.moves.length);
    }
  });

  it('shows each finished game for a few days before the next begins', () => {
    const states = Array.from({ length: cycle }, (_v, i) => scheduleGame('octo', day(20_000 + i / PLIES_PER_DAY)));
    expect(states.some((s) => s.finished)).toBe(true);
    for (const s of states) if (s.finished) expect(s.ply).toBe(s.game.moves.length);
  });

  it('visits every game over a full cycle, then starts again', () => {
    const seen = new Set<string>();
    for (let i = 0; i < cycle; i++) seen.add(scheduleGame('octo', day(20_000 + i / PLIES_PER_DAY)).game.id);
    expect(seen.size).toBe(GAMES.length);
    const cycleDays = cycle / PLIES_PER_DAY;
    expect(scheduleGame('octo', day(20_000))).toEqual(scheduleGame('octo', day(20_000 + cycleDays)));
  });

  it('starts different users at different points', () => {
    const at = new Set(['a', 'b', 'c', 'd', 'e', 'f'].map((u) => { const s = scheduleGame(u, '2026-06-15T00:00:00Z'); return `${s.game.id}:${s.ply}`; }));
    expect(at.size).toBeGreaterThan(2);
  });

  it('copes with a date it cannot read', () => {
    expect(() => scheduleGame('octo', 'nonsense')).not.toThrow();
  });
});

describe('replayGame', () => {
  const opera = GAMES.find((g) => g.id === 'opera')!.moves;
  const byId = (r: ReturnType<typeof replayGame>) => Object.fromEntries(r.pieces.map((p) => [p.id, p]));

  it('shows the start of a game as the standard position with nothing moving', () => {
    const r = replayGame(opera, 0, 4);
    expect(r.pieces).toHaveLength(32);
    expect(r.moves).toEqual([]);
    expect(r.pieces.every((p) => p.steps.length === 0)).toBe(true);
    expect(r.fen).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  });

  it('follows each piece through the replayed moves', () => {
    const r = replayGame(opera, 3, 3); // 1.e4 e5 2.Nf3
    expect(r.moves.map((m) => m.san)).toEqual(['e4', 'e5', 'Nf3']);
    const pieces = byId(r);
    expect(pieces.wpe2!.steps).toEqual([{ at: 0, square: 'e4' }]);
    expect(pieces.wpe2!.start).toBe('e2');
    expect(pieces.wpe2!.end).toBe('e4');
    expect(pieces.bpe7!.end).toBe('e5');
    expect(pieces.wng1!.end).toBe('f3');
  });

  it('starts from the position before the replay, not the beginning of the game', () => {
    const r = replayGame(opera, 6, 2); // replays plies 5 and 6: 3.d4 and 3...Bg4
    expect(r.moves.map((m) => m.san)).toEqual(['d4', 'Bg4']);
    const pieces = byId(r);
    // Pieces are named by where they stand when the replay begins, so the e-pawn is "wpe4" here.
    expect(pieces.wpe4).toMatchObject({ start: 'e4', end: 'e4', steps: [] }); // it did not move during the replay
    expect(pieces.wpe2).toBeUndefined();
    expect(pieces.wpd2).toMatchObject({ start: 'd2', end: 'd4' });
  });

  it('numbers moves the way chess notation does', () => {
    const r = replayGame(opera, 6, 4);
    expect(r.moves.map((m) => [m.number, m.color])).toEqual([[2, 'w'], [2, 'b'], [3, 'w'], [3, 'b']]);
  });

  it('removes a captured piece at the moment of capture', () => {
    const r = replayGame(opera, 9, 2); // 4...Bxf3 5.Qxf3
    const pieces = byId(r);
    const knight = Object.values(pieces).find((p) => p.type === 'n' && p.color === 'w' && p.start === 'f3')!;
    expect(knight.end).toBeNull();
    expect(knight.steps).toEqual([{ at: 0, square: null }]);
  });

  it('tracks a king and a rook through castling', () => {
    const r = replayGame(opera, 23, 1); // 12.O-O-O
    expect(r.moves[0]!.san).toBe('O-O-O');
    const pieces = byId(r);
    const king = Object.values(pieces).find((p) => p.type === 'k' && p.color === 'w')!;
    const rook = Object.values(pieces).find((p) => p.type === 'r' && p.color === 'w' && p.start === 'a1')!;
    expect(king.end).toBe('c1');
    expect(rook.end).toBe('d1');
  });

  it('tracks kingside castling too', () => {
    const evergreen = GAMES.find((g) => g.id === 'evergreen')!.moves;
    const r = replayGame(evergreen, 13, 1); // 7.O-O
    const rook = r.pieces.find((p) => p.type === 'r' && p.color === 'w' && p.start === 'h1')!;
    expect(r.moves[0]!.san).toBe('O-O');
    expect(rook.end).toBe('f1');
  });

  it('removes the captured pawn on its own square in an en passant capture', () => {
    const r = replayGame('e4 a6 e5 d5 exd6'.split(' '), 5, 1);
    expect(r.moves[0]!.san).toBe('exd6');
    const pawn = r.pieces.find((p) => p.type === 'p' && p.color === 'b' && p.start === 'd5')!;
    expect(pawn.end).toBeNull(); // taken from d5, not from the square the capturer landed on (d6)
    expect(r.pieces.find((p) => p.type === 'p' && p.color === 'w' && p.start === 'e5')!.end).toBe('d6');
  });

  it('replaces a promoted pawn with the new piece when it arrives', () => {
    const r = replayGame('e4 d5 exd5 c6 dxc6 e6 cxb7 Nf6 bxa8=Q'.split(' '), 9, 1);
    expect(r.moves[0]!.san).toBe('bxa8=Q');
    const pawn = r.pieces.find((p) => p.type === 'p' && p.color === 'w' && p.start === 'b7')!;
    expect(pawn.end).toBeNull();
    expect(pawn.steps).toEqual([{ at: 0, square: 'a8' }, { at: 0, square: null }]);
    const queen = r.pieces.find((p) => p.start === null)!;
    expect(queen).toMatchObject({ type: 'q', color: 'w', end: 'a8' });
    expect(queen.steps[0]).toMatchObject({ appears: true, square: 'a8' });
    const rook = r.pieces.find((p) => p.type === 'r' && p.color === 'b' && p.start === 'a8')!;
    expect(rook.end).toBeNull(); // the rook that was taken
  });

  it('always ends with exactly the pieces that are really on the board', () => {
    for (const game of GAMES) {
      for (const ply of [1, 7, Math.floor(game.moves.length / 2), game.moves.length]) {
        const r = replayGame(game.moves, ply, 4);
        const real = new Chess(r.fen).board().flat().filter(Boolean).map((c) => `${c!.color}${c!.type}${c!.square}`).sort();
        const tracked = r.pieces.filter((p) => p.end).map((p) => `${p.color}${p.type}${p.end}`).sort();
        expect(tracked).toEqual(real);
      }
    }
  });

  it('reports check and checkmate at the end of a game', () => {
    const legal = GAMES.find((g) => g.id === 'legal')!.moves;
    expect(replayGame(legal, 11, 1).check).toBe(true); // 6.Bxf7+
    const done = replayGame(legal, legal.length, 4);
    expect(done.checkmate).toBe(true);
    expect(done.turn).toBe('b');
  });

  it('copes with out-of-range requests', () => {
    expect(replayGame(opera, -5, 4).moves).toEqual([]);
    expect(replayGame(opera, 9999, 4).moves).toHaveLength(4);
    expect(replayGame(opera, 3, 99).moves).toHaveLength(3);
    expect(replayGame(opera, 3, 0).moves).toEqual([]);
  });

  it('turns squares into board positions', () => {
    expect(squareIndex('a1')).toEqual({ file: 0, rank: 0 });
    expect(squareIndex('h8')).toEqual({ file: 7, rank: 7 });
    expect(squareIndex('e4')).toEqual({ file: 4, rank: 3 });
  });
});
