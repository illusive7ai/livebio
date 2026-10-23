import { describe, expect, it } from 'vitest';
import { fetchContributions } from './contributions';

const reply = (status: number, body: string) => (async () => new Response(body, { status })) as unknown as typeof fetch;

describe('fetchContributions error details', () => {
  it('adds a short piece of GitHub’s own explanation to an unexpected status', async () => {
    const error = await fetchContributions('octo', { token: 't', fetch: reply(400, '{"message":"Problems parsing JSON"}') }).catch((e) => e);
    expect(error.kind).toBe('unknown');
    expect(error.message).toContain('(400)');
    expect(error.message).toContain('Problems parsing JSON');
  });

  it('keeps that piece short and on one line', async () => {
    const error = await fetchContributions('octo', { token: 't', fetch: reply(418, `a\n\n${'b '.repeat(500)}`) }).catch((e) => e);
    expect(error.message).not.toContain('\n');
    expect(error.message.length).toBeLessThan(260);
  });

  it('adds nothing when GitHub sends no explanation', async () => {
    const error = await fetchContributions('octo', { token: 't', fetch: reply(400, '') }).catch((e) => e);
    expect(error.message).toBe('GitHub returned an unexpected error (400).');
  });

  it('leaves the well-understood statuses exactly as they were', async () => {
    expect((await fetchContributions('octo', { token: 't', fetch: reply(401, 'secret detail') }).catch((e) => e)).message).toBe('GitHub did not accept the token.');
    expect((await fetchContributions('octo', { token: 't', fetch: reply(404, 'secret detail') }).catch((e) => e)).kind).toBe('not-found');
  });
});
