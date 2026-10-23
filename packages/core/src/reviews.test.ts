import { describe, expect, it } from 'vitest';
import { MAX_QUOTE, cleanQuote, parseReviews, reviewFromIssue } from './reviews';

const form = (rating: string, text: string, ticked = true) =>
  `### How would you rate it?\n\n${rating}\n\n### What was it like?\n\n${text}\n\n### Showing it on the website\n\n- [${ticked ? 'x' : ' '}] You may show this review, with my GitHub username, on the livebio website.`;

const issue = (over: Record<string, unknown> = {}) => ({
  number: 1,
  title: 'Review: ',
  body: form('5 - Loved it', 'It kept my profile fresh without any work.'),
  user: { login: 'octocat' },
  labels: [],
  author_association: 'OWNER',
  ...over,
});

describe('reviewFromIssue', () => {
  it('reads a rating, the text and the author', () => {
    expect(reviewFromIssue(issue())).toEqual({ login: 'octocat', rating: 5, quote: 'It kept my profile fresh without any work.' });
  });

  it.each([
    ['5 - Loved it', 5],
    ['4 - Good', 4],
    ['3 - Okay', 3],
    ['2 - Needs work', 2],
    ['1 - Did not work for me', 1],
  ])('reads the rating "%s" as %i', (text, rating) => {
    expect(reviewFromIssue(issue({ body: form(text, 'fine') }))?.rating).toBe(rating);
  });

  it('refuses ratings it cannot read, rather than guessing', () => {
    for (const rating of ['', '0 - none', '6 - great', 'five stars', '_No response_']) {
      expect(reviewFromIssue(issue({ body: form(rating, 'fine') })), rating).toBeNull();
    }
  });

  it('needs the permission box ticked', () => {
    expect(reviewFromIssue(issue({ body: form('5 - Loved it', 'fine', false) }))).toBeNull();
  });

  it('needs some text', () => {
    expect(reviewFromIssue(issue({ body: form('5 - Loved it', '') }))).toBeNull();
    expect(reviewFromIssue(issue({ body: form('5 - Loved it', '_No response_') }))).toBeNull();
    expect(reviewFromIssue(issue({ body: form('5 - Loved it', '   \n  ') }))).toBeNull();
  });

  it('shows the repository owner’s review, and others only once approved', () => {
    const stranger = { author_association: 'NONE', user: { login: 'someone' } };
    expect(reviewFromIssue(issue(stranger))).toBeNull();
    expect(reviewFromIssue(issue({ ...stranger, labels: [{ name: 'review' }] }))).toBeNull();
    expect(reviewFromIssue(issue({ ...stranger, labels: [{ name: 'approved' }] }))?.login).toBe('someone');
    expect(reviewFromIssue(issue({ ...stranger, labels: ['Approved'] }))?.login).toBe('someone');
    // Contributors and members are not enough: only the owner or the label.
    expect(reviewFromIssue(issue({ ...stranger, author_association: 'CONTRIBUTOR' }))).toBeNull();
    expect(reviewFromIssue(issue({ ...stranger, author_association: 'MEMBER' }))).toBeNull();
  });

  it('ignores pull requests and anything that is not a review form', () => {
    expect(reviewFromIssue(issue({ pull_request: { url: 'x' } }))).toBeNull();
    expect(reviewFromIssue(issue({ body: 'Just a bug report, 5 stars.' }))).toBeNull();
    expect(reviewFromIssue(issue({ body: null }))).toBeNull();
  });

  it('takes the name from GitHub, never from the text', () => {
    const text = 'I am @someone-else and this is great';
    expect(reviewFromIssue(issue({ body: form('5 - Loved it', text) }))?.login).toBe('octocat');
    expect(reviewFromIssue(issue({ user: { login: 'not a valid name!' } }))).toBeNull();
    expect(reviewFromIssue(issue({ user: null }))).toBeNull();
  });

  it('copes with anything that is not an issue', () => {
    for (const junk of [null, undefined, 5, 'x', [], {}]) expect(reviewFromIssue(junk)).toBeNull();
  });

  it('reads Windows line endings', () => {
    expect(reviewFromIssue(issue({ body: form('4 - Good', 'ok').replace(/\n/g, '\r\n') }))?.rating).toBe(4);
  });
});

describe('cleanQuote', () => {
  it('makes one plain line', () => {
    expect(cleanQuote('one\n\ntwo\t three\u0000four')).toBe('one two three four');
  });

  it('keeps markup as harmless text and does not interpret it', () => {
    expect(cleanQuote('<script>alert(1)</script> **bold**')).toBe('<script>alert(1)</script> **bold**');
  });

  it(`stops at ${MAX_QUOTE} characters with an ellipsis`, () => {
    const long = cleanQuote('word '.repeat(300));
    expect(long.length).toBeLessThanOrEqual(MAX_QUOTE);
    expect(long.endsWith('…')).toBe(true);
    expect(cleanQuote('short')).toBe('short');
    expect(cleanQuote('x'.repeat(MAX_QUOTE))).toHaveLength(MAX_QUOTE);
  });
});

describe('parseReviews', () => {
  it('keeps only the reviews that qualify, in the order given', () => {
    const list = [
      issue({ number: 3, user: { login: 'zed' }, body: form('4 - Good', 'third') }),
      issue({ number: 2, author_association: 'NONE', user: { login: 'nope' } }),
      issue({ number: 1, user: { login: 'amy' }, body: form('3 - Okay', 'first') }),
    ];
    expect(parseReviews(list).map((r) => r.login)).toEqual(['zed', 'amy']);
  });

  it('shows one review per person, their latest', () => {
    const list = [
      issue({ number: 5, body: form('5 - Loved it', 'newer') }),
      issue({ number: 2, body: form('1 - Did not work for me', 'older') }),
    ];
    const reviews = parseReviews(list);
    expect(reviews).toHaveLength(1);
    expect(reviews[0]!.quote).toBe('newer');
  });

  it('is empty for anything that is not a list', () => {
    expect(parseReviews(null)).toEqual([]);
    expect(parseReviews({ message: 'Not Found' })).toEqual([]);
  });
});
