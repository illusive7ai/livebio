import { seeded } from '../templates/shared';
import { GAMES, type LiveGame } from './games';

/** Each daily update plays one move for White and one for Black. */
export const PLIES_PER_DAY = 2;
/** After a game ends its final position stays up for this many plies (three days). */
export const PAUSE_PLIES = 6;

export interface LiveState {
  game: LiveGame;
  /** How many half-moves of the game have been played, from 0 (the starting position) to its full length. */
  ply: number;
  /** True once the game is over and the final position is being shown. */
  finished: boolean;
  /** Which game of the user's playlist this is, counting from zero. */
  index: number;
}

/** The UTC day number: how many whole days after 1 January 1970. */
export function dayNumber(iso: string): number {
  const time = Date.parse(iso);
  return Number.isFinite(time) ? Math.floor(time / 86_400_000) : 0;
}

/** A playlist of the games in an order that belongs to this user. */
export function playlistFor(login: string, games: ReadonlyArray<LiveGame> = GAMES): LiveGame[] {
  const random = seeded(`chess:${login.toLowerCase()}`);
  const order = [...games];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j]!, order[i]!];
  }
  return order;
}

/** Where in the cycle this user starts, so that not every profile shows the same move on the same day. */
export function startOffset(login: string, cycle: number): number {
  return Math.floor(seeded(`start:${login.toLowerCase()}`)() * cycle);
}

/**
 * Works out which game is on the board and how far it has got, from the username and the date alone.
 * Nothing is stored, so the web preview and the real profile always agree, and each daily update
 * moves the game on by two half-moves. When the playlist runs out it starts again.
 */
export function scheduleGame(login: string, nowIso: string, games: ReadonlyArray<LiveGame> = GAMES): LiveState {
  const order = playlistFor(login, games);
  const lengths = order.map((game) => game.moves.length + PAUSE_PLIES);
  const cycle = lengths.reduce((sum, n) => sum + n, 0);

  const tick = dayNumber(nowIso) * PLIES_PER_DAY + startOffset(login, cycle);
  let position = ((tick % cycle) + cycle) % cycle;

  for (let index = 0; index < order.length; index++) {
    const game = order[index]!;
    const length = lengths[index]!;
    if (position < length) {
      const ply = Math.min(position, game.moves.length);
      return { game, ply, finished: position >= game.moves.length, index };
    }
    position -= length;
  }
  // Unreachable: position is always below the cycle length.
  return { game: order[0]!, ply: 0, finished: false, index: 0 };
}
