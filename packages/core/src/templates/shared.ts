import { pictureTag, wrapReadme } from '../readme';
import type { Config, Profile } from '../types';
import { formatNumber, safeUrl } from '../util';

export const FONT = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";
export const FONT_SANS = "'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif";
export const FONT_SERIF = "Georgia, 'Iowan Old Style', 'Palatino Linotype', 'Times New Roman', serif";

/** Only embed pictures that are plain base64 PNG or JPEG, so nothing else can reach an SVG. */
export const SAFE_DATA_URI = /^data:image\/(?:png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/;

/** Wraps markup so it rises into place after `delay` seconds. The template supplies the .rise CSS. */
export function rise(markup: string, motion: boolean, delay: number): string {
  if (!markup || !motion) return markup;
  return `<g class="rise" style="animation-delay:${delay.toFixed(2)}s">${markup}</g>`;
}

/**
 * CSS for lines that appear one after another. Lines are visible by default and only hidden
 * while their animation waits to start, so a viewer that cannot animate still shows everything.
 */
export function motionCss(motion: boolean): string {
  if (!motion) return '';
  return `.ln{animation:in .01s steps(1) both}
@keyframes in{from{opacity:0}to{opacity:1}}
.cursor{animation:blink 1.1s steps(1) infinite}
@keyframes blink{50%{opacity:0}}
@media (prefers-reduced-motion:reduce){.ln,.cursor{animation:none}}`;
}

/** Wraps markup so it appears after `delay` seconds. Returns it untouched when motion is off. */
export function stagger(markup: string, motion: boolean, delay: number): string {
  if (!markup || !motion) return markup;
  return `<g class="ln" style="animation-delay:${delay.toFixed(2)}s">${markup}</g>`;
}

/** "1 day" or "7 days". */
export function plural(count: number, noun: string): string {
  return `${formatNumber(count)} ${noun}${count === 1 ? '' : 's'}`;
}

/**
 * Alt text for a template image. It only mentions what the image actually shows, so pass
 * `activity: true` only from a template that draws the activity section.
 */
export function describeProfile(
  profile: Profile,
  config: Config,
  extra?: string,
  options: { activity?: boolean } = {},
): string {
  const parts = [`${profile.name ?? profile.login} on GitHub`];
  if (extra) parts.push(extra);
  if (config.blocks.includes('stats')) {
    parts.push(
      `${formatNumber(profile.publicRepos)} repositories`,
      `${formatNumber(profile.totalStars)} stars`,
      `${formatNumber(profile.followers)} followers`,
    );
  }
  const activity = profile.contributions;
  if (options.activity && config.blocks.includes('activity') && activity) {
    parts.push(
      `${formatNumber(activity.total)} contributions in the past year`,
      `a ${plural(activity.currentStreak, 'day')} current streak`,
    );
  }
  const languages = profile.languages.slice(0, 3).map((l) => l.name);
  if (config.blocks.includes('languages') && languages.length > 0) parts.push(`mostly ${languages.join(', ')}`);
  return parts.join(', ');
}

/** README for a template that is one centred image followed by profile links. */
export function imageReadme(profile: Profile, config: Config, base: string, width: number, alt: string): string {
  const website = safeUrl(profile.website);
  const links = [`[GitHub](<${profile.url}>)`];
  if (website) links.push(`[Website](<${website}>)`);
  const body = [
    `<div align="center">\n${pictureTag(base, config.theme, alt, width)}\n</div>`,
    `<div align="center">\n\n${links.join(' · ')}\n\n</div>`,
  ];
  return wrapReadme(body.join('\n\n'), config);
}
