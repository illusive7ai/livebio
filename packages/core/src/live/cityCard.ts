import { busiestMonth } from '../contributions';
import type { Contributions } from '../types';
import { formatNumber, xmlEscape } from '../util';
import { plural } from '../templates/shared';
import { COS, GAP, MAX_CELL, MAX_HEIGHT, ROWS, SIN, SLAB_DEPTH, SLAB_MARGIN, layoutCity } from '../templates/city';
import { CARD_WIDTH, LIVE_BADGE_CSS, cardBackground, label, liveBadge, num, svgDocument } from './frame';
import type { LiveStyle } from './style';

const PAD = 44;
const TEXT_WIDTH = 230;
const FLAG_ROOM = 40;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function shortDate(date: string): string {
  const [, month, day] = date.split('-');
  return `${MONTHS[Number(month) - 1] ?? ''} ${Number(day)}`.trim();
}

export interface CityCardOptions {
  login: string;
  contributions: Contributions | undefined;
  style: LiveStyle;
  motion: boolean;
}

/**
 * The contribution city as its own card: the headline numbers on the left and the city beside them.
 * Every building is one real day from the account's contribution calendar, taller on busier days.
 */
export function renderCityCard(opts: CityCardOptions): string {
  const { style, motion, contributions } = opts;
  const title = contributions
    ? `Contribution city for @${opts.login}: ${contributions.total} contributions in the past year, one building for each day`
    : `Contribution city for @${opts.login}, shown once contribution data is available`;

  if (!contributions || contributions.days.length === 0) {
    const height = 220;
    const bg = cardBackground(style, height, opts.login);
    const body =
      bg.markup +
      label(style, 'CONTRIBUTION CITY', PAD, 52) +
      `<text x="${CARD_WIDTH / 2}" y="${height / 2 + 4}" text-anchor="middle" font-size="16" font-weight="700" fill="${style.fg}">Your contribution city appears here</text>` +
      `<text x="${CARD_WIDTH / 2}" y="${height / 2 + 30}" text-anchor="middle" font-size="13" fill="${style.muted}">It is built from your GitHub activity, which is added at your first automatic update.</text>`;
    return svgDocument(style, height, title, bg.defs, '', body);
  }

  const { cols, buildings } = layoutCity(contributions.days);
  const regionX = PAD + TEXT_WIDTH + 24;
  const regionW = CARD_WIDTH - PAD - regionX;
  const m = SLAB_MARGIN;
  const size = Math.min(MAX_CELL, regionW / ((cols + ROWS + 2 * m) * COS));
  const k = size / MAX_CELL; // heights were planned for the largest cell, so scale them to this one
  const ox = regionX + regionW / 2 - ((cols - ROWS) / 2) * COS * size;
  const peak = buildings.reduce((best, b) => (b.count > best.count || (b.count === best.count && b.date > best.date) ? b : best), buildings[0]!);

  const rawY = (u: number, v: number, z = 0): number => (u + v) * SIN * size - z;
  let reach = rawY(-m, -m);
  for (const b of buildings) reach = Math.min(reach, rawY(b.col + GAP, b.row + GAP, b.height * k));
  reach = Math.min(reach, rawY(peak.col + 0.5, peak.row + 0.5, peak.height * k) - FLAG_ROOM);
  const top = 40;
  const oy = top - reach;
  const at = (u: number, v: number, z = 0): [number, number] => [ox + (u - v) * COS * size, oy + rawY(u, v, z)];
  const poly = (points: Array<[number, number]>): string => `M${points.map(([x, y]) => `${num(x)} ${num(y)}`).join('L')}Z`;

  const slabBottom = at(cols + m, ROWS + m, -SLAB_DEPTH)[1];
  const height = Math.max(Math.ceil(slabBottom + 40), 330);
  const bg = cardBackground(style, height, opts.login);
  const city = style.city;

  const slabTop = poly([at(-m, -m), at(cols + m, -m), at(cols + m, ROWS + m), at(-m, ROWS + m)]);
  const leftSide = poly([at(-m, ROWS + m), at(cols + m, ROWS + m), at(cols + m, ROWS + m, -SLAB_DEPTH), at(-m, ROWS + m, -SLAB_DEPTH)]);
  const rightSide = poly([at(cols + m, -m), at(cols + m, ROWS + m), at(cols + m, ROWS + m, -SLAB_DEPTH), at(cols + m, -m, -SLAB_DEPTH)]);
  const streets: string[] = [];
  for (let u = 0; u <= cols; u++) streets.push(`M${num(at(u, 0)[0])} ${num(at(u, 0)[1])}L${num(at(u, ROWS)[0])} ${num(at(u, ROWS)[1])}`);
  for (let v = 0; v <= ROWS; v++) streets.push(`M${num(at(0, v)[0])} ${num(at(0, v)[1])}L${num(at(cols, v)[0])} ${num(at(cols, v)[1])}`);

  const towers = buildings
    .map((b) => {
      const u0 = b.col + GAP;
      const u1 = b.col + 1 - GAP;
      const v0 = b.row + GAP;
      const v1 = b.row + 1 - GAP;
      const h = b.height * k;
      const isPeak = b === peak;
      const colors = isPeak ? city.peak : city.levels[Math.min(3, Math.max(0, (b.level || 1) - 1))]!;
      const delay = motion ? ` style="animation-delay:${(0.2 + (b.col + b.row) * 0.011).toFixed(3)}s"` : '';
      return (
        `<g class="cty-b"${delay}>` +
        `<path d="${poly([at(u0, v1), at(u1, v1), at(u1, v1, h), at(u0, v1, h)])}" fill="${colors[1]}"/>` +
        `<path d="${poly([at(u1, v0), at(u1, v1), at(u1, v1, h), at(u1, v0, h)])}" fill="${colors[2]}"/>` +
        `<path d="${poly([at(u0, v0, h), at(u1, v0, h), at(u1, v1, h), at(u0, v1, h)])}" fill="${colors[0]}"/>` +
        `</g>`
      );
    })
    .join('');

  const [px, py] = at(peak.col + 0.5, peak.row + 0.5, peak.height * k);
  const labelX = Math.min(CARD_WIDTH - PAD - 60, Math.max(regionX + 40, px));
  const flag =
    `<path d="M${num(px)} ${num(py - 3)}L${num(px)} ${num(py - 22)}" stroke="${style.fg}" stroke-opacity="0.6"/>` +
    `<text class="mono" x="${num(labelX)}" y="${num(py - 28)}" text-anchor="middle" font-size="11.500" font-weight="700" fill="${style.fg}">${xmlEscape(shortDate(peak.date))}: ${xmlEscape(formatNumber(peak.count))}</text>`;

  const month = busiestMonth(contributions.days);
  let text = liveBadge(style, PAD, 52, motion) + label(style, 'CONTRIBUTION CITY', PAD, 90);
  text += `<text x="${PAD}" y="146" font-size="52" font-weight="800" fill="${style.accent}">${xmlEscape(formatNumber(contributions.total))}</text>`;
  text += `<text x="${PAD}" y="172" font-size="14.500" font-weight="600" fill="${style.fg}">contributions in the last year</text>`;
  const facts = [
    plural(contributions.activeDays, 'active day'),
    `Busiest day: ${formatNumber(peak.count)}`,
    `Current streak: ${plural(contributions.currentStreak, 'day')}`,
    `Longest streak: ${plural(contributions.longestStreak, 'day')}`,
    month ? `Busiest month: ${month.name}` : null,
  ].filter((v): v is string => Boolean(v));
  facts.forEach((fact, i) => {
    text += `<text x="${PAD}" y="${204 + i * 24}" font-size="13.500" font-weight="600" fill="${style.muted}">${xmlEscape(fact)}</text>`;
  });
  text += `<text class="mono" x="${PAD}" y="${height - 36}" font-size="12" font-weight="700" fill="${style.fg}">@${xmlEscape(opts.login)}</text>`;
  text += `<text class="mono" x="${PAD}" y="${height - 18}" font-size="10.500" fill="${style.muted}">one building for every day</text>`;

  const css =
    (motion ? LIVE_BADGE_CSS : '') +
    (motion
      ? `.cty-b{transform-box:fill-box;transform-origin:50% 100%;animation:cty-grow .8s cubic-bezier(.2,.8,.2,1) both}@keyframes cty-grow{from{transform:scaleY(0)}}@media (prefers-reduced-motion:reduce){.cty-b,.lv-live{animation:none}}`
      : '');

  const scene =
    `<path d="${slabTop}" fill="${city.slab}"/>` +
    `<path d="${leftSide}" fill="${city.slabSide}"/>` +
    `<path d="${rightSide}" fill="${city.slabSide}" fill-opacity="0.75"/>` +
    `<path d="${streets.join('')}" fill="none" stroke="${city.line}" stroke-opacity="0.35" stroke-width="0.6"/>` +
    towers +
    flag;

  return svgDocument(style, height, title, bg.defs, css, bg.markup + scene + text);
}

export const CITY_MAX_HEIGHT = MAX_HEIGHT;
