import { describe, expect, it } from 'vitest';
import { SHARE_TEXT, SITE_URL, telegramLink, whatsappLink } from './share';

describe('share links', () => {
  it('points at the real website, over https', () => {
    expect(SITE_URL).toBe('https://illusive7ai.github.io/livebio/');
  });

  it('opens WhatsApp with the message and the link together, encoded once', () => {
    const link = new URL(whatsappLink());
    expect(link.origin + link.pathname).toBe('https://wa.me/');
    expect(link.searchParams.get('text')).toBe(`${SHARE_TEXT} ${SITE_URL}`);
  });

  it('opens Telegram with the link and the message as separate parts', () => {
    const link = new URL(telegramLink());
    expect(link.origin + link.pathname).toBe('https://t.me/share/url');
    expect(link.searchParams.get('url')).toBe(SITE_URL);
    expect(link.searchParams.get('text')).toBe(SHARE_TEXT);
  });

  it('keeps awkward characters from breaking the address', () => {
    const url = 'https://example.com/a?b=1&c=2#x y';
    const text = 'Tom & Jerry: 100% "great"? #yes';
    expect(new URL(whatsappLink(url, text)).searchParams.get('text')).toBe(`${text} ${url}`);
    const telegram = new URL(telegramLink(url, text));
    expect(telegram.searchParams.get('url')).toBe(url);
    expect(telegram.searchParams.get('text')).toBe(text);
    expect([...telegram.searchParams.keys()]).toEqual(['url', 'text']);
  });

  it('says nothing that is not true of the project', () => {
    expect(SHARE_TEXT).toMatch(/free/i);
    expect(SHARE_TEXT).toMatch(/open source/i);
    expect(SHARE_TEXT).not.toMatch(/\d+ (stars|users|downloads)/i);
  });
});
