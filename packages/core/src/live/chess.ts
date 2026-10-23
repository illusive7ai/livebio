import { truncate, wrap, xmlEscape } from '../util';
import { CARD_WIDTH, LIVE_BADGE_CSS, cardBackground, label, liveBadge, num, svgDocument } from './frame';
import { pieceMarkup } from './pieces';
import { replayGame, squareIndex, type PieceTrack, type Replay } from './replay';
import { scheduleGame, type LiveState } from './schedule';
import type { LiveStyle } from './style';

const PAD = 44;
const SQ = 48;
const BOARD = SQ * 8;
const FRAME = 16;
const OUTER = BOARD + FRAME * 2;
const HEIGHT = OUTER + 68;
/** How many of the latest moves are replayed each time the picture loops. */
export const ANIMATED_PLIES = 4;
/** Seconds each replayed move takes, and how long the final position is held before the loop restarts. */
export const MOVE_SECONDS = 1.6;
export const HOLD_SECONDS = 4.2;

const FILE_NAMES = 'abcdefgh';

/** Lines such as "12. O-O-O Rd8" for the latest moves, newest last. */
export function recentMoveLines(sans: ReadonlyArray<string>, ply: number, plies = 6): string[] {
  const upTo = Math.max(0, Math.min(ply, sans.length));
  const from = Math.max(0, upTo - plies);
  const lines: string[] = [];
  for (let i = from; i < upTo; i++) {
    const number = Math.floor(i / 2) + 1;
    const white = i % 2 === 0;
    if (white) lines.push(`${number}. ${sans[i]}`);
    else if (lines.length > 0 && lines[lines.length - 1]!.startsWith(`${number}. `)) lines[lines.length - 1] += ` ${sans[i]}`;
    else lines.push(`${number}... ${sans[i]}`);
  }
  return lines;
}

/** The one-line status under the title. */
export function statusText(state: LiveState, replay: Replay): string {
  const { game, ply, finished } = state;
  if (finished) {
    const winner = game.result === '1-0' ? 'White' : 'Black';
    return `Checkmate. ${winner} wins, ${game.result.replace('-', '–')}`;
  }
  if (ply === 0) return 'A new game is about to begin';
  const number = Math.floor(ply / 2) + 1;
  const side = replay.turn === 'w' ? 'White' : 'Black';
  return `Move ${number}, ${side} to play${replay.check ? ', check' : ''}`;
}

interface Stop {
  t: number;
  x: number;
  y: number;
  o: number;
}

/** Where a square sits on the card. */
function squareXY(square: string, bx: number, by: number): { x: number; y: number } {
  const { file, rank } = squareIndex(square);
  return { x: bx + file * SQ, y: by + (7 - rank) * SQ };
}

/**
 * The timeline of one piece through the replay: where it is at each moment and whether it can be seen.
 * Moves glide, and captures and promotions switch at the moment the mover arrives.
 */
export function pieceTimeline(track: PieceTrack, bx: number, by: number, moveSeconds = MOVE_SECONDS): Stop[] {
  const eps = 0.02;
  const first = track.start ? squareXY(track.start, bx, by) : squareXY(track.steps[0]?.square ?? 'a1', bx, by);
  let at = { x: first.x, y: first.y };
  let seen = track.start ? 1 : 0;
  const stops: Stop[] = [{ t: 0, ...at, o: seen }];
  for (const step of track.steps) {
    const leave = step.at * moveSeconds + moveSeconds * 0.1;
    const arrive = step.at * moveSeconds + moveSeconds * 0.75;
    if (step.appears && step.square) {
      at = squareXY(step.square, bx, by);
      stops.push({ t: arrive - eps, ...at, o: 0 }, { t: arrive, ...at, o: 1 });
      seen = 1;
    } else if (step.square) {
      const next = squareXY(step.square, bx, by);
      stops.push({ t: leave, ...at, o: seen }, { t: arrive, ...next, o: seen });
      at = next;
    } else {
      stops.push({ t: arrive, ...at, o: seen }, { t: arrive + eps, ...at, o: 0 });
      seen = 0;
    }
  }
  return stops;
}

export interface ChessOptions {
  login: string;
  /** When the data was read. The position on the board follows the date. */
  nowIso: string;
  style: LiveStyle;
  motion: boolean;
  /** Pins an exact game and move, instead of working them out from the date. Used by tests and previews. */
  state?: LiveState;
}

/** The state of the game on a given day, for anyone who wants to describe it. */
export function liveState(login: string, nowIso: string, pinned?: LiveState): { state: LiveState; replay: Replay } {
  const state = pinned ?? scheduleGame(login, nowIso);
  const replay = replayGame(state.game.moves, state.ply, ANIMATED_PLIES);
  return { state, replay };
}

export function renderChess(opts: ChessOptions): string {
  const { style, motion } = opts;
  const { state, replay } = liveState(opts.login, opts.nowIso, opts.state);
  const { game } = state;
  const chess = style.chess;

  const bx = CARD_WIDTH - PAD - OUTER + FRAME;
  const by = (HEIGHT - OUTER) / 2 + FRAME;
  const bg = cardBackground(style, HEIGHT, opts.login);

  // The board: frame, squares, the last move, and the coordinates around it.
  let board = `<rect x="${bx - FRAME}" y="${by - FRAME}" width="${OUTER}" height="${OUTER}" rx="${chess.frame === 'terminal' || chess.frame === 'blueprint' ? 4 : 14}" fill="${chess.frameFill}" stroke="${chess.frameStroke}" stroke-width="${chess.frame === 'wood' ? 2.500 : 1.500}"${chess.frame === 'chalk' ? ' stroke-dasharray="7 5"' : ''}/>`;
  if (chess.frame === 'glass') {
    board += `<rect x="${bx - FRAME + 5}" y="${by - FRAME + 5}" width="${OUTER - 10}" height="${OUTER - 10}" rx="10" fill="none" stroke="${chess.frameStroke}" stroke-opacity="0.45"/>`;
  }
  for (let file = 0; file < 8; file++) {
    for (let rank = 0; rank < 8; rank++) {
      const dark = (file + rank) % 2 === 0; // a1 is a dark square
      board += `<rect x="${bx + file * SQ}" y="${by + (7 - rank) * SQ}" width="${SQ}" height="${SQ}" fill="${dark ? chess.dark : chess.light}"/>`;
    }
  }
  const last = replay.moves[replay.moves.length - 1];
  if (last) {
    for (const square of [last.from, last.to]) {
      const p = squareXY(square, bx, by);
      board += `<rect x="${p.x}" y="${p.y}" width="${SQ}" height="${SQ}" fill="${chess.highlight}" fill-opacity="0.32"/>`;
    }
  }
  for (let i = 0; i < 8; i++) {
    board +=
      `<text class="mono" x="${bx + i * SQ + SQ / 2}" y="${by + BOARD + 12}" text-anchor="middle" font-size="10" font-weight="700" fill="${chess.coord}">${FILE_NAMES[i]}</text>` +
      `<text class="mono" x="${bx - 8}" y="${by + (7 - i) * SQ + SQ / 2 + 3.500}" text-anchor="middle" font-size="10" font-weight="700" fill="${chess.coord}">${i + 1}</text>`;
  }

  // The pieces. Each rests where it ends up; the ones that move are given a timeline.
  const animate = motion && replay.moves.length > 0;
  const total = replay.moves.length * MOVE_SECONDS + HOLD_SECONDS;
  let keyframes = '';
  let pieces = '';
  replay.pieces.forEach((track, index) => {
    const rest = track.end ?? track.steps.filter((s) => s.square).pop()?.square ?? track.start;
    if (!rest) return;
    const p = squareXY(rest, bx, by);
    const look = { ...(track.color === 'w' ? chess.white : chess.black), mode: chess.pieces };
    const body = pieceMarkup(track.type, look, SQ);
    const visible = track.end ? '' : ' opacity="0"';
    const moves = track.steps.length > 0 && animate;
    let style_ = '';
    let cls = '';
    if (moves) {
      const stops = pieceTimeline(track, bx, by);
      stops.push({ ...stops[stops.length - 1]!, t: total });
      const frames = stops
        .map((s) => `${num((s.t / total) * 100)}%{transform:translate(${num(s.x)}px,${num(s.y)}px);opacity:${s.o}}`)
        .join('');
      keyframes += `@keyframes chs-m${index}{${frames}}`;
      cls = ' class="chs-a"';
      style_ = ` style="animation:chs-m${index} ${num(total)}s linear infinite"`;
    }
    pieces += `<g${cls}${style_} transform="translate(${p.x} ${p.y})"${visible}>${body}</g>`;
  });

  const loopFade = animate ? ` class="chs-pieces" style="animation:chs-loop ${num(total)}s linear infinite"` : '';
  board += `<g${loopFade}>${pieces}</g>`;

  const css =
    (motion ? LIVE_BADGE_CSS : '') +
    (animate
      ? `@keyframes chs-loop{0%{opacity:0}4%,93%{opacity:1}100%{opacity:0}}${keyframes}@media (prefers-reduced-motion:reduce){.lv-live,.chs-pieces,.chs-a{animation:none!important}}`
      : '');

  // The text beside the board.
  const lines = recentMoveLines(game.moves, state.ply, 6);
  let text = liveBadge(style, PAD, 52, motion) + label(style, state.finished ? 'CHESS, FINAL POSITION' : 'CHESS, A GAME IN PROGRESS', PAD, 92);
  text += `<text x="${PAD}" y="134" font-size="28" font-weight="800" fill="${style.fg}">${xmlEscape(truncate(game.title, 26))}</text>`;
  const players = [`White: ${game.white}`, `Black: ${game.black}`].flatMap((line) => wrap(line, 40, 2));
  players.forEach((line, i) => {
    text += `<text x="${PAD}" y="${164 + i * 20}" font-size="14" fill="${style.muted}">${xmlEscape(line)}</text>`;
  });
  const afterPlayers = 164 + players.length * 20;
  text += `<text class="mono" x="${PAD}" y="${afterPlayers + 6}" font-size="12.500" fill="${style.muted}">${xmlEscape(`${game.place}, ${game.year}`)}</text>`;
  text += `<text x="${PAD}" y="${afterPlayers + 42}" font-size="16.500" font-weight="700" fill="${style.fg}">${xmlEscape(statusText(state, replay))}</text>`;
  const movesY = afterPlayers + 84;
  if (lines.length > 0) {
    text += label(style, 'LATEST MOVES', PAD, movesY);
    lines.slice(-3).forEach((line, i) => {
      text += `<text class="mono" x="${PAD}" y="${movesY + 24 + i * 22}" font-size="14" fill="${style.fg}">${xmlEscape(line)}</text>`;
    });
  }
  text += `<text class="mono" x="${PAD}" y="${HEIGHT - 30}" font-size="11.500" fill="${style.muted}">two moves a day, played automatically</text>`;

  const glow =
    chess.pieces === 'glow'
      ? `<filter id="chs-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.800" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`
      : '';

  const title = `A live chess game: ${game.title}, ${game.white} against ${game.black}, ${game.place} ${game.year}. ${statusText(state, replay)}.`;
  return svgDocument(style, HEIGHT, title, bg.defs + glow, css, bg.markup + text + board);
}

export const CHESS_HEIGHT = HEIGHT;
