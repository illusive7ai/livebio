import { hueOf } from './color';
import { renderCityCard } from './live/cityCard';
import { styleFor } from './live/style';
import { palettes, type Variant } from './themes';
import type { Profile } from './types';
import { FONT, FONT_SANS } from './templates/shared';
import { formatNumber, truncate, xmlEscape } from './util';
import type { WrappedData } from './wrapped';

const W = 900;
const H = 560;
const PAD = 44;
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const num = (value: number): string => String(Math.round(value * 100) / 100 || 0);

/** "Mar 4, 2026" from 2026-03-04, without involving the reader's time zone. */
export function longDate(date: string): string {
  const [y, m, d] = date.split('-');
  return `${MONTH_SHORT[Number(m) - 1] ?? ''} ${Number(d)}, ${y}`;
}

/** The first and last months of the window hold only part of a month, which the chart says so it is read fairly. */
function hasPartialEnds(data: WrappedData): boolean {
  const last = new Date(Date.UTC(Number(data.to.slice(0, 4)), Number(data.to.slice(5, 7)), 0)).getUTCDate();
  return Number(data.from.slice(8, 10)) !== 1 || Number(data.to.slice(8, 10)) !== last;
}

export function wrappedAlt(data: WrappedData): string {
  const parts = [`${formatNumber(data.total)} contributions from ${longDate(data.from)} to ${longDate(data.to)}`, `${data.activeDays} active days`];
  if (data.longestStreak) parts.push(`longest streak ${data.longestStreak.length} days`);
  if (data.busiestDay) parts.push(`busiest day ${longDate(data.busiestDay.date)} with ${data.busiestDay.count}`);
  return `Year in review for @${data.login}: ${parts.join(', ')}.`;
}

/** One picture that sums up the year, to download or share. Draws only what WrappedData holds. */
export function renderWrappedCard(data: WrappedData, variant: Variant, credit = true): string {
  const p = palettes[variant];
  const chartX = 470;
  const chartW = W - PAD - chartX;
  const chartTop = 150;
  const chartH = 150;
  const peak = Math.max(1, ...data.months.map((m) => m.total));
  const slot = chartW / Math.max(1, data.months.length);
  const bar = Math.min(34, slot * 0.66);

  const bars = data.months
    .map((m, i) => {
      const h = m.total > 0 ? Math.max(3, (m.total / peak) * chartH) : 2;
      const x = chartX + i * slot + (slot - bar) / 2;
      const best = data.busiestMonth?.key === m.key;
      return (
        `<rect x="${num(x)}" y="${num(chartTop + chartH - h)}" width="${num(bar)}" height="${num(h)}" rx="3" fill="${best ? p.accent : p.accent2}" fill-opacity="${best ? 1 : 0.55}"/>` +
        `<text class="mono" x="${num(x + bar / 2)}" y="${chartTop + chartH + 18}" text-anchor="middle" font-size="10.5" fill="${p.muted}">${MONTH_SHORT[Number(m.key.slice(5, 7)) - 1] ?? ''}</text>`
      );
    })
    .join('');

  const weekPeak = Math.max(1, ...data.weekdays.map((w) => w.total));
  const wx = PAD;
  const wy = 392;
  const ww = 330;
  const wslot = ww / 7;
  const weekBars = data.weekdays
    .map((w, i) => {
      const h = w.total > 0 ? Math.max(3, (w.total / weekPeak) * 60) : 2;
      const x = wx + i * wslot + 5;
      return (
        `<rect x="${num(x)}" y="${num(wy + 60 - h)}" width="${num(wslot - 10)}" height="${num(h)}" rx="3" fill="${p.accent}" fill-opacity="${data.busiestWeekday?.name === w.name ? 1 : 0.5}"/>` +
        `<text class="mono" x="${num(x + (wslot - 10) / 2)}" y="${wy + 78}" text-anchor="middle" font-size="10.5" fill="${p.muted}">${w.name.slice(0, 3)}</text>`
      );
    })
    .join('');

  const stat = (x: number, y: number, value: string, label: string) =>
    `<text x="${x}" y="${y}" font-size="22" font-weight="800" fill="${p.fg}">${xmlEscape(value)}</text>` +
    `<text x="${x}" y="${y + 18}" font-size="11.5" fill="${p.muted}">${xmlEscape(label)}</text>`;

  const stats =
    stat(PAD, 232, formatNumber(data.activeDays), `active days (${data.activePercent}%)`) +
    stat(PAD + 150, 232, data.longestStreak ? `${data.longestStreak.length} days` : 'none', 'longest streak') +
    stat(PAD + 300, 232, data.busiestDay ? formatNumber(data.busiestDay.count) : 'none', data.busiestDay ? `busiest day, ${longDate(data.busiestDay.date).replace(/, \d{4}$/, '')}` : 'busiest day');

  const traits = data.traits.slice(0, 3);
  let chips = '';
  let cx = chartX;
  traits.forEach((t, i) => {
    const w = 22 + t.title.length * 7.4;
    const y = 372 + Math.floor(i / 2) * 36;
    if (i % 2 === 0) cx = chartX;
    chips += `<rect x="${num(cx)}" y="${y}" width="${num(w)}" height="26" rx="13" fill="${p.panel}" stroke="${p.border}"/><text x="${num(cx + w / 2)}" y="${y + 17.5}" text-anchor="middle" font-size="12.5" font-weight="700" fill="${p.fg}">${xmlEscape(t.title)}</text>`;
    cx += w + 10;
  });

  const lang = data.languages[0];
  const summary = [
    data.busiestMonth ? `Busiest month: ${data.busiestMonth.label}` : null,
    data.busiestWeekday ? `Busiest weekday: ${data.busiestWeekday.name}` : null,
    lang ? `Top language: ${truncate(lang.name, 18)}` : null,
  ].filter((v): v is string => v !== null);

  const title = wrappedAlt(data);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t">
<title id="t">${xmlEscape(title)}</title>
<style>
text{font-family:${FONT_SANS}}
.mono{font-family:${FONT}}
</style>
<rect width="${W}" height="${H}" rx="16" fill="${p.bg}"/>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="16" fill="none" stroke="${p.border}"/>
<text class="mono" x="${PAD}" y="52" font-size="12" font-weight="700" letter-spacing="2.4" fill="${p.accent}">YEAR IN REVIEW</text>
<text class="mono" x="${W - PAD}" y="52" text-anchor="end" font-size="12" fill="${p.muted}">${xmlEscape(longDate(data.from))} to ${xmlEscape(longDate(data.to))}</text>
<text x="${PAD}" y="84" font-size="20" font-weight="700" fill="${p.fg}">${xmlEscape(truncate(data.name ?? `@${data.login}`, 34))}</text>
<text x="${PAD}" y="${data.name ? 104 : 84}" font-size="13" fill="${p.muted}">${data.name ? `@${xmlEscape(data.login)}` : ''}</text>
<text x="${PAD}" y="196" font-size="64" font-weight="800" fill="${p.accent}">${xmlEscape(formatNumber(data.total))}</text>
<text x="${PAD + 4}" y="136" font-size="13.5" font-weight="600" fill="${p.fg}">contributions</text>
${stats}
<text class="mono" x="${PAD}" y="${wy - 14}" font-size="11" font-weight="700" letter-spacing="1.8" fill="${p.muted}">CONTRIBUTIONS BY WEEKDAY</text>
${weekBars}
<text class="mono" x="${chartX}" y="${chartTop - 18}" font-size="11" font-weight="700" letter-spacing="1.8" fill="${p.muted}">CONTRIBUTIONS BY MONTH</text>
${bars}
${chips}
${summary.map((line, i) => `<text x="${chartX}" y="${468 + i * 20}" font-size="12.5" fill="${p.muted}">${xmlEscape(line)}</text>`).join('')}
${hasPartialEnds(data) ? `<text class="mono" x="${chartX}" y="${chartTop + chartH + 36}" font-size="10" fill="${p.muted}">first and last months are partial</text>` : ''}
${credit ? `<text class="mono" x="${W - PAD}" y="${H - 22}" text-anchor="end" font-size="10.5" fill="${p.muted}">Made with livebio by illusivehacks</text>` : ''}
</svg>
`;
}

/** The year as a time-lapse city, for the first slide. Buildings are the real active days, raised in calendar order. */
export function renderWrappedCity(profile: Profile, variant: Variant, motion = true): string {
  const hue = hueOf(profile.avatar?.grid.tint) ?? 215;
  return renderCityCard({ login: profile.login, contributions: profile.contributions, style: styleFor('night', variant, hue, 0), motion, timelapse: true });
}
