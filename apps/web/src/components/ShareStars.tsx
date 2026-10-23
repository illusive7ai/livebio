import { useEffect, useRef, useState } from 'react';
import { REPO_URL, SITE_URL, telegramLink, whatsappLink } from '@livebio/core';
import { starsLabel, useStars } from '../lib/stars';

/** Puts a link on the clipboard. Falls back to the old way for browsers that will not let a page use the new one. */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const box = document.createElement('textarea');
    box.value = text;
    box.setAttribute('readonly', '');
    box.style.position = 'fixed';
    box.style.opacity = '0';
    document.body.appendChild(box);
    box.select();
    try {
      return document.execCommand('copy');
    } catch {
      return false;
    } finally {
      document.body.removeChild(box);
    }
  }
}

/**
 * Under the username box: how many people have starred the project, with a link to star it, and ways to send the
 * website to a friend. Sharing opens WhatsApp or Telegram in a new tab with the message ready; nothing is sent
 * from here, and nothing is tracked.
 */
export function ShareStars() {
  const stars = useStars();
  const [copy, setCopy] = useState<'idle' | 'done' | 'failed'>('idle');
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copyLink = async () => {
    setCopy((await copyText(SITE_URL)) ? 'done' : 'failed');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopy('idle'), 2500);
  };

  return (
    <div className="support">
      <a className="star-call" href={REPO_URL} target="_blank" rel="noreferrer">
        <span className="star-mark" aria-hidden="true">
          ★
        </span>
        <span>
          {stars === null && 'Star livebio on GitHub'}
          {stars === 0 && 'Be the first to star livebio'}
          {stars !== null && stars > 0 && (
            <>
              <strong>{starsLabel(stars)}</strong> on GitHub
            </>
          )}
        </span>
      </a>
      <p className="support-note">Like it? A star helps other people find it.</p>

      <div className="share" role="group" aria-label="Share livebio with a friend">
        <span className="share-label">Share with a friend</span>
        <a className="share-link whatsapp" href={whatsappLink()} target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
            <path
              fill="currentColor"
              d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 1.8a8.2 8.2 0 1 1-4.2 15.3l-.3-.2-2.9.8.8-2.8-.2-.3A8.2 8.2 0 0 1 12 3.8Zm-3 3.6c-.2 0-.5.1-.7.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.2 5 4.4 2.5 1 3 .8 3.5.7.6 0 1.7-.7 2-1.4.2-.7.2-1.3.2-1.4l-.5-.3-1.8-.9c-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1-.8-.4-1.6-.8-2.4-1.7a9 9 0 0 1-1.6-2c-.1-.3 0-.4.1-.5l.4-.5.3-.4c.1-.2 0-.4 0-.5l-.9-2.1c-.2-.5-.4-.4-.6-.4Z"
            />
          </svg>
          WhatsApp
        </a>
        <a className="share-link telegram" href={telegramLink()} target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
            <path fill="currentColor" d="M21.5 3.3 2.7 10.6c-.9.3-.9 1.5 0 1.8l4.6 1.5 1.8 5.6c.2.6 1 .8 1.4.3l2.6-2.6 4.8 3.5c.6.4 1.3.1 1.5-.6l3.1-15.2c.2-.9-.6-1.5-1.5-1.2ZM9.2 13.6l8.5-5.3-6.6 6.4-.3 3.1-1.6-4.2Z" />
          </svg>
          Telegram
        </a>
        <button type="button" className="share-link" onClick={copyLink}>
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 15 15 9M10.5 6.5l1.2-1.2a4 4 0 0 1 5.7 5.7l-1.2 1.2M13.5 17.5l-1.2 1.2a4 4 0 0 1-5.7-5.7l1.2-1.2"
            />
          </svg>
          {copy === 'done' ? 'Link copied' : copy === 'failed' ? 'Copy failed' : 'Copy link'}
        </button>
        <span className="visually-hidden" role="status">
          {copy === 'done' ? 'Link copied to the clipboard' : copy === 'failed' ? `Could not copy. The link is ${SITE_URL}` : ''}
        </span>
      </div>
    </div>
  );
}
