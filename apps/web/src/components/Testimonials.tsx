import { useEffect, useMemo, useState } from 'react';
import { REPO_URL } from '@livebio/core';
import type { Testimonial } from '../data/testimonials';
import { useReviews } from '../lib/reviews';

const REVIEW_URL = `${REPO_URL}/issues/new?template=review.yml`;
const AUTOPLAY_MS = 6500;

function useMatch(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const list = window.matchMedia(query);
    const onChange = () => setMatches(list.matches);
    list.addEventListener('change', onChange);
    return () => list.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="stars" role="img" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= rating ? 'on' : ''} aria-hidden="true">
          ★
        </span>
      ))}
    </span>
  );
}

/**
 * What real users say about livebio. The reviews come from the project's GitHub issues, through the same service
 * that supplies contribution data. While they load it says so, and without reviews it says that plainly and invites
 * one: it never shows praise nobody wrote, and never claims there are none before it has looked.
 */
export function Testimonials({ items }: { items?: Testimonial[] }) {
  const loaded = useReviews(items === undefined);
  const source = items ?? (loaded.status === 'ready' ? loaded.reviews : null);
  if (source === null) {
    return (
      <section className="reviews" aria-labelledby="reviews-title" aria-busy="true">
        <h2 id="reviews-title">What people say</h2>
        <div className="reviews-loading" role="status">
          Loading reviews…
        </div>
      </section>
    );
  }
  return <ReviewCarousel items={source} />;
}

function ReviewCarousel({ items }: { items: Testimonial[] }) {
  const wide = useMatch('(min-width: 900px)');
  const medium = useMatch('(min-width: 600px)');
  const reduced = useMatch('(prefers-reduced-motion: reduce)');
  const perView = wide ? 3 : medium ? 2 : 1;
  const last = Math.max(0, items.length - perView);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const position = Math.min(index, last);

  const average = useMemo(
    () => (items.length ? Math.round((items.reduce((sum, t) => sum + t.rating, 0) / items.length) * 10) / 10 : 0),
    [items],
  );

  useEffect(() => {
    if (reduced || paused || last === 0) return;
    const timer = window.setInterval(() => setIndex((i) => (i >= last ? 0 : i + 1)), AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [reduced, paused, last]);

  if (items.length === 0) {
    return (
      <section className="reviews" aria-labelledby="reviews-title">
        <h2 id="reviews-title">What people say</h2>
        <div className="reviews-empty">
          <p>
            <strong>No reviews yet.</strong> livebio is new, and we only show words from people who really used it.
            If it helped you, tell us how it went. Tick the box on the form to let it appear here.
          </p>
          <a className="button" href={REVIEW_URL} target="_blank" rel="noreferrer">
            Share your experience
          </a>
        </div>
      </section>
    );
  }

  return (
    <section
      className="reviews"
      aria-roledescription="carousel"
      aria-labelledby="reviews-title"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="reviews-head">
        <h2 id="reviews-title">What people say</h2>
        <p className="reviews-score">
          <Stars rating={Math.round(average)} /> <strong>{average.toFixed(1)}</strong> from {items.length}{' '}
          {items.length === 1 ? 'review' : 'reviews'}
        </p>
      </div>
      <div className="reviews-window">
        <ul
          className="reviews-track"
          style={{ transform: `translateX(-${(position * 100) / perView}%)` }}
          aria-live={paused ? 'polite' : 'off'}
        >
          {items.map((item, i) => (
            <li
              key={item.login}
              className="review"
              style={{ flexBasis: `${100 / perView}%` }}
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${items.length}`}
              aria-hidden={i < position || i >= position + perView}
            >
              <figure>
                <Stars rating={item.rating} />
                <blockquote>{item.quote}</blockquote>
                <figcaption>
                  <img src={`https://github.com/${item.login}.png?size=64`} alt="" width={32} height={32} loading="lazy" />
                  <a href={`https://github.com/${item.login}`} target="_blank" rel="noreferrer">
                    @{item.login}
                  </a>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
      {last > 0 && (
        <div className="reviews-nav">
          <button type="button" onClick={() => setIndex(position <= 0 ? last : position - 1)} aria-label="Previous reviews">
            ‹
          </button>
          <span className="dots-nav">
            {Array.from({ length: last + 1 }, (_v, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Show reviews from number ${i + 1}`}
                aria-current={i === position}
                onClick={() => setIndex(i)}
              />
            ))}
          </span>
          <button type="button" onClick={() => setIndex(position >= last ? 0 : position + 1)} aria-label="Next reviews">
            ›
          </button>
        </div>
      )}
      <p className="reviews-more">
        Used livebio? <a href={REVIEW_URL} target="_blank" rel="noreferrer">Share your experience</a>
      </p>
    </section>
  );
}
