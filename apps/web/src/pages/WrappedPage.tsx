import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { computeWrapped, formatNumber, longDate, renderWrappedCard, renderWrappedCity, wrappedAlt, type Profile, type WrappedData } from '@livebio/core';
import { UsernameForm } from '../components/UsernameForm';
import { download, downloadText } from '../lib/export';
import { svgDataUri, svgToPng } from '../lib/image';

interface Props {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  onLoad: (username: string) => void;
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => (typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false));
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(query.matches);
    query.addEventListener('change', on);
    return () => query.removeEventListener('change', on);
  }, []);
  return reduced;
}

/** Counts up to a number, or shows it at once for someone who prefers less movement. */
function useCountUp(target: number, reduced: boolean): number {
  const [value, setValue] = useState(reduced ? target : 0);
  useEffect(() => {
    if (reduced || target === 0) {
      setValue(target);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 1400);
      setValue(Math.round(target * (1 - (1 - t) ** 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, reduced]);
  return value;
}

const plural = (n: number, word: string): string => `${formatNumber(n)} ${word}${n === 1 ? '' : 's'}`;

function Bars({ items, highlight }: { items: Array<{ key: string; label: string; value: number }>; highlight: string | undefined }) {
  const peak = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="wbars" aria-hidden="true">
      {items.map((item) => (
        <li key={item.key} className={item.key === highlight ? 'best' : ''}>
          <i style={{ height: `${Math.max(item.value > 0 ? 4 : 1, (item.value / peak) * 100)}%` }} />
          <span>{item.label}</span>
        </li>
      ))}
    </ul>
  );
}

interface Slide {
  id: string;
  eyebrow: string;
  body: ReactNode;
}

function buildSlides(data: WrappedData, city: string, total: number): Slide[] {
  const slides: Slide[] = [];

  slides.push({
    id: 'total',
    eyebrow: 'Your year',
    body: (
      <>
        <img className="wrapped-city" src={city} alt={`A time-lapse of the contribution city: one building for each of your ${data.activeDays} active days, raised in calendar order.`} />
        <p className="wbig">{formatNumber(total)}</p>
        <p className="wline">
          {data.total === 1 ? 'contribution' : 'contributions'} between {longDate(data.from)} and {longDate(data.to)}.
        </p>
        <p className="wsmall">That is what GitHub counted: commits, pull requests, issues and reviews on the public record.</p>
      </>
    ),
  });

  slides.push({
    id: 'showing-up',
    eyebrow: 'Showing up',
    body: (
      <>
        <div className="wring" role="img" aria-label={`${data.activePercent} percent of days`}>
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <circle cx="60" cy="60" r="52" className="track" />
            <circle cx="60" cy="60" r="52" className="fill" strokeDasharray={`${(data.activePercent / 100) * 326.7} 326.7`} transform="rotate(-90 60 60)" />
          </svg>
          <strong>{data.activePercent}%</strong>
        </div>
        <p className="wline">
          You contributed on <b>{data.activeDays}</b> of <b>{data.days}</b> days.
        </p>
        {data.longestBreak && data.longestBreak.length > 1 && (
          <p className="wsmall">
            Your longest quiet stretch was {plural(data.longestBreak.length, 'day')}, {longDate(data.longestBreak.from)} to {longDate(data.longestBreak.to)}. Everyone has them.
          </p>
        )}
      </>
    ),
  });

  slides.push({
    id: 'streaks',
    eyebrow: 'Streaks',
    body: data.longestStreak ? (
      <>
        <p className="wbig">{data.longestStreak.length}</p>
        <p className="wline">{data.longestStreak.length === 1 ? 'day' : 'days'} in a row was your longest streak.</p>
        <p className="wsmall">
          {data.longestStreak.length > 1 ? `${longDate(data.longestStreak.from)} to ${longDate(data.longestStreak.to)}.` : `On ${longDate(data.longestStreak.from)}.`}{' '}
          {data.currentStreak > 0 ? `Your current streak is ${plural(data.currentStreak, 'day')}.` : 'No streak is running today.'}
        </p>
      </>
    ) : (
      <p className="wline">There were no contributions to make a streak from in this window.</p>
    ),
  });

  slides.push({
    id: 'rhythm',
    eyebrow: 'Your rhythm',
    body: (
      <>
        <Bars items={data.months.map((m) => ({ key: m.key, label: m.label.slice(0, 3), value: m.total }))} highlight={data.busiestMonth?.key} />
        <p className="wline">
          {data.busiestMonth ? (
            <>
              <b>{data.busiestMonth.label}</b> was your biggest month, with {plural(data.busiestMonth.total, 'contribution')}.
            </>
          ) : (
            'No month stands out.'
          )}
        </p>
        <Bars items={data.weekdays.map((w) => ({ key: w.name, label: w.name.slice(0, 3), value: w.total }))} highlight={data.busiestWeekday?.name} />
        <p className="wline">
          {data.busiestWeekday ? (
            <>
              <b>{data.busiestWeekday.name}s</b> were your busiest.
              {data.weekendShare !== null && <> {data.weekendShare}% of your contributions landed on a weekend.</>}
            </>
          ) : (
            'No weekday stands out.'
          )}
        </p>
        <p className="wsmall">The first and last months cover only part of a month.</p>
      </>
    ),
  });

  slides.push({
    id: 'peak',
    eyebrow: 'Peak moments',
    body: data.busiestDay ? (
      <>
        <p className="wbig">{formatNumber(data.busiestDay.count)}</p>
        <p className="wline">
          contributions on <b>{longDate(data.busiestDay.date)}</b>, your busiest day.
        </p>
        {data.bestWeek && (
          <p className="wsmall">
            Your best week began {longDate(data.bestWeek.from)}, with {plural(data.bestWeek.total, 'contribution')}.
          </p>
        )}
      </>
    ) : (
      <p className="wline">No single day stands out.</p>
    ),
  });

  slides.push({
    id: 'build',
    eyebrow: 'What you build',
    body: (
      <>
        {data.languages.length > 0 ? (
          <ul className="wlist">
            {data.languages.map((l) => (
              <li key={l.name}>
                <span>{l.name}</span>
                <i style={{ width: `${Math.max(4, l.percent)}%` }} />
                <b>{l.percent}%</b>
              </li>
            ))}
          </ul>
        ) : (
          <p className="wline">No main languages are listed on your public repositories.</p>
        )}
        <p className="wsmall">Share of your own, non-fork repositories by main language.</p>
        <p className="wline">
          {plural(data.publicRepos, 'public repository')}, {plural(data.stars, 'star')}, {plural(data.followers, 'follower')}
          {data.yearsOnGitHub !== null && data.yearsOnGitHub >= 1 && <>, and {plural(data.yearsOnGitHub, 'year')} on GitHub</>}.
        </p>
        {data.topRepos.length > 0 && data.topRepos[0]!.stars > 0 && (
          <p className="wsmall">
            Most starred: {data.topRepos.filter((r) => r.stars > 0).map((r) => `${r.name} (${formatNumber(r.stars)})`).join(', ')}.
          </p>
        )}
      </>
    ),
  });

  slides.push({
    id: 'labels',
    eyebrow: 'Your labels',
    body:
      data.traits.length > 0 ? (
        <>
          <ul className="wtraits">
            {data.traits.map((t) => (
              <li key={t.id}>
                <strong>{t.title}</strong>
                <span>{t.reason}</span>
              </li>
            ))}
          </ul>
          <p className="wsmall">A label only appears when your numbers earn it, and it shows which numbers did.</p>
        </>
      ) : (
        <p className="wline">No label fits your numbers yet. livebio only hands out a label your data backs up.</p>
      ),
  });

  return slides;
}

function ShareCard({ data }: { data: WrappedData }) {
  const [variant, setVariant] = useState<'dark' | 'light'>('dark');
  const [credit, setCredit] = useState(true);
  const [note, setNote] = useState<string | null>(null);
  const svg = useMemo(() => renderWrappedCard(data, variant, credit), [data, variant, credit]);
  const alt = wrappedAlt(data);

  const savePng = async () => {
    try {
      download(await svgToPng(svg, 2), `${data.login}-year-in-review.png`);
      setNote('Saved the picture.');
    } catch {
      setNote('This browser could not make a PNG. Save the SVG instead.');
    }
  };
  const copyAlt = async () => {
    try {
      await navigator.clipboard.writeText(alt);
      setNote('Copied the description. Paste it as the picture’s alt text.');
    } catch {
      setNote(alt);
    }
  };

  return (
    <div className="share-card">
      <img src={svgDataUri(svg)} alt={alt} />
      <div className="row">
        <button type="button" className="primary" onClick={() => void savePng()}>
          Download PNG
        </button>
        <button type="button" onClick={() => downloadText(`${data.login}-year-in-review.svg`, svg)}>
          Download SVG
        </button>
        <button type="button" onClick={() => void copyAlt()}>
          Copy description
        </button>
        <button type="button" onClick={() => setVariant(variant === 'dark' ? 'light' : 'dark')}>
          {variant === 'dark' ? 'Light card' : 'Dark card'}
        </button>
      </div>
      <label className="check">
        <input type="checkbox" checked={credit} onChange={() => setCredit(!credit)} />
        Add “Made with livebio by illusivehacks” to the card
      </label>
      {note && (
        <p className="hint" role="status">
          {note}
        </p>
      )}
      <p className="hint">The card is drawn in your browser from your public GitHub data. Nothing is uploaded or stored.</p>
    </div>
  );
}

/** A look back over the last twelve months, built only from what GitHub's public data shows. */
export function WrappedPage({ profile, loading, error, onLoad }: Props) {
  const reduced = useReducedMotion();
  const data = useMemo(() => (profile ? computeWrapped(profile) : null), [profile]);
  const [index, setIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const total = useCountUp(data?.total ?? 0, reduced);

  useEffect(() => setIndex(0), [profile?.login]);

  // The picture is made once, so the count going up does not make it start its animation again.
  const city = useMemo(() => (profile ? svgDataUri(renderWrappedCity(profile, 'dark', !reduced)) : ''), [profile, reduced]);
  const slides = useMemo(() => (data ? buildSlides(data, city, index === 0 ? total : data.total) : []), [data, city, total, index]);
  const last = slides.length; // the share card is the slide after the story
  const count = last + 1;

  const go = (next: number) => setIndex(Math.min(count - 1, Math.max(0, next)));
  const onKey = (event: KeyboardEvent) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown' || event.key === 'PageDown') {
      event.preventDefault();
      go(index + 1);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp' || event.key === 'PageUp') {
      event.preventDefault();
      go(index - 1);
    }
  };

  return (
    <div className="page">
      <header className="page-head">
        <h1>GitHub Wrapped</h1>
        <p>
          Your last twelve months on GitHub, told from the real numbers: contributions, streaks, your busiest days and what
          you build. Nothing is invented, and nothing leaves your browser except the request for your public data.
        </p>
      </header>

      {!profile && (
        <section className="wrapped-start">
          <UsernameForm busy={loading} button="Show my year" onSubmit={onLoad} />
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </section>
      )}

      {profile && !data && (
        <p className="notice">
          GitHub did not share the contribution calendar for @{profile.login} just now, so there is nothing to look back on.
          Try again in a few minutes, or check that the profile is public.
        </p>
      )}

      {profile && data && (
        <>
          <p className="hint wrapped-who">
            For <b>@{profile.login}</b>. <a href="#/">Change user on the home page</a>.
          </p>
          <div className="wrapped-bar">
            <button type="button" className="link" onClick={() => setShowAll(!showAll)} aria-pressed={showAll}>
              {showAll ? 'Back to the slideshow' : 'Show everything at once'}
            </button>
          </div>

          {showAll ? (
            <div className="wrapped-all">
              {slides.map((slide) => (
                <section key={slide.id} className="wslide" aria-label={slide.eyebrow}>
                  <p className="weyebrow">{slide.eyebrow}</p>
                  {slide.body}
                </section>
              ))}
              <section className="wslide" aria-label="Share">
                <p className="weyebrow">Share it</p>
                <ShareCard data={data} />
              </section>
            </div>
          ) : (
            <div className="wrapped-stage" ref={stage} tabIndex={0} onKeyDown={onKey} aria-label="Your year, one slide at a time. Use the arrow keys or the buttons.">
              <section className={`wslide current s-${index}`} key={index === 0 ? 'first' : index} aria-live="polite">
                <p className="weyebrow">{index < last ? slides[index]!.eyebrow : 'Share it'}</p>
                {index < last ? slides[index]!.body : <ShareCard data={data} />}
              </section>
              <div className="wrapped-nav">
                <button type="button" onClick={() => go(index - 1)} disabled={index === 0}>
                  Back
                </button>
                <ol className="dots" aria-label="Slides">
                  {Array.from({ length: count }, (_v, i) => (
                    <li key={i}>
                      <button type="button" aria-label={`Slide ${i + 1} of ${count}`} aria-current={i === index ? 'step' : undefined} onClick={() => go(i)} />
                    </li>
                  ))}
                </ol>
                <button type="button" className="primary" onClick={() => go(index + 1)} disabled={index === count - 1}>
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
