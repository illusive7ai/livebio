import { hueOf } from '../color';
import { assetPath, insertBlocks, pictureTag } from '../readme';
import { variantsFor } from '../themes';
import type { Asset, Template } from '../types';
import { CARD_WIDTH } from './frame';
import { liveState, renderChess, statusText } from './chess';
import { renderCityCard } from './cityCard';
import { renderSnakeCard } from './snakeCard';
import { styleFor, type Preset } from './style';

export interface LiveSpec {
  preset: Preset;
  /** Which automated game goes with the template, or null when the template is itself the game. */
  companion: 'snake' | 'chess' | null;
  /** False when the template already is the contribution city. */
  city: boolean;
  /** Degrees added to the preset's hue, so designs that share a preset still look different. */
  shift?: number;
}

/** The hue used when the user has no profile picture colour to draw from. */
const DEFAULT_HUE: Record<Preset, number> = {
  aurora: 170,
  sunrise: 22,
  night: 215,
  space: 262,
  arcade: 135,
  chalk: 160,
  editor: 142,
  blueprint: 205,
  paper: 30,
  terminal: 125,
  glow: 175,
  plain: 220,
};

/**
 * Gives a template a live contribution city and an automated snake or chess game, each drawn in the
 * template's own preset. They are separate images below the template's card, like stacked panels.
 * Each is a block the user can switch off: "city" and "game".
 */
export function withLive(base: Template, spec: LiveSpec): Template {
  return {
    ...base,
    needsAvatar: true,
    render(profile, config) {
      const out = base.render(profile, config);
      const preset = config.custom?.look ?? spec.preset;
      const chosen = config.custom?.companion;
      const companion = chosen === undefined ? spec.companion : chosen === 'none' ? null : chosen;
      const wantCity = spec.city && config.blocks.includes('city');
      const wantGame = companion !== null && config.blocks.includes('game');
      if (!wantCity && !wantGame) return out;

      const hue = hueOf(profile.avatar?.grid.tint) ?? DEFAULT_HUE[preset];
      const nowIso = profile.fetchedAt ?? profile.createdAt;
      const login = profile.login;
      const assets: Asset[] = [];
      const pictures: string[] = [];
      const picture = (kind: string, alt: string) =>
        pictures.push(`<div align="center">\n${pictureTag(`${base.id}-${kind}`, config.theme, alt, CARD_WIDTH)}\n</div>`);

      if (wantCity) {
        const days = profile.contributions?.days ?? [];
        const peak = days.reduce((best, d) => Math.max(best, d.count), 0);
        picture(
          'city',
          profile.contributions
            ? `Contribution city: ${profile.contributions.total} contributions in the past year across ${profile.contributions.activeDays} active days${peak > 0 ? `, busiest day ${peak}` : ''}, one building for each active day`
            : 'Contribution city, shown once contribution data is available',
        );
      }
      if (wantGame && companion === 'snake') {
        picture(
          'snake',
          profile.contributions
            ? `An animated snake crossing the contribution graph and eating the active days, among ${profile.contributions.total} contributions in the past year`
            : 'A contribution snake, shown once contribution data is available',
        );
      }
      if (wantGame && companion === 'chess') {
        const { state, replay } = liveState(login, nowIso);
        picture('chess', `A live chess game: ${state.game.title}, ${state.game.white} against ${state.game.black}. ${statusText(state, replay)}`);
      }

      for (const variant of variantsFor(config.theme)) {
        const style = styleFor(preset, variant, hue, spec.shift ?? 0);
        if (wantCity) {
          assets.push({
            path: assetPath(`${base.id}-city`, variant),
            content: renderCityCard({ login, contributions: profile.contributions, style, motion: config.motion, timelapse: config.custom?.timelapse === true }),
          });
        }
        if (wantGame && companion === 'snake') {
          assets.push({
            path: assetPath(`${base.id}-snake`, variant),
            content: renderSnakeCard({ login, contributions: profile.contributions, style, motion: config.motion }),
          });
        }
        if (wantGame && companion === 'chess') {
          assets.push({
            path: assetPath(`${base.id}-chess`, variant),
            content: renderChess({ login, nowIso, style, motion: config.motion }),
          });
        }
      }

      return { readme: insertBlocks(out.readme, pictures, config.theme), assets: [...out.assets, ...assets] };
    },
  };
}
