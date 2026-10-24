import { describe, expect, it } from 'vitest';
import { MAX_README_CHARS, isAllowedRawUrl, isMarkdownFile, isPersonName, loginForMenu, loginFromText, ownerLoginFromUrl, pageInfo, readmeCandidates } from './github';

describe('isPersonName', () => {
  it('accepts a username and refuses GitHub’s own pages, in any case', () => {
    for (const name of ['octocat', 'a', 'illusive7ai', 'my-name', 'Octocat']) expect(isPersonName(name), name).toBe(true);
    for (const name of ['settings', 'Settings', 'login', 'marketplace', 'notifications', 'orgs', 'explore', 'new', 'sponsors', 'about']) expect(isPersonName(name), name).toBe(false);
  });
  it('refuses what is not a valid username', () => {
    for (const name of ['', '-a', 'a-', 'a--b', 'a b', 'a/b', 'x'.repeat(40), 'ä', '.github']) expect(isPersonName(name), name).toBe(false);
  });
});

describe('ownerLoginFromUrl', () => {
  it('finds the person at the front of any github.com address', () => {
    expect(ownerLoginFromUrl('https://github.com/octocat')).toBe('octocat');
    expect(ownerLoginFromUrl('https://github.com/octocat/Hello-World')).toBe('octocat');
    expect(ownerLoginFromUrl('https://github.com/octocat/Hello-World/issues/1?x=y#top')).toBe('octocat');
    expect(ownerLoginFromUrl('https://www.github.com/octocat')).toBe('octocat');
  });
  it('finds nobody in GitHub’s own pages or other sites', () => {
    expect(ownerLoginFromUrl('https://github.com/settings/profile')).toBeNull();
    expect(ownerLoginFromUrl('https://github.com/')).toBeNull();
    expect(ownerLoginFromUrl('https://gist.github.com/octocat')).toBeNull();
    expect(ownerLoginFromUrl('https://github.com.evil.example/octocat')).toBeNull();
    expect(ownerLoginFromUrl('https://evil.example/github.com/octocat')).toBeNull();
    expect(ownerLoginFromUrl('http://github.com/octocat')).toBeNull();
    expect(ownerLoginFromUrl('javascript:alert(1)')).toBeNull();
    expect(ownerLoginFromUrl('not a url')).toBeNull();
  });
});

describe('loginFromText', () => {
  it('reads a name, an @name and an address', () => {
    expect(loginFromText('octocat')).toBe('octocat');
    expect(loginFromText('  @octocat  ')).toBe('octocat');
    expect(loginFromText('https://github.com/octocat/Hello-World')).toBe('octocat');
  });
  it('reads nobody from words, other sites or GitHub’s own pages', () => {
    expect(loginFromText('hello world')).toBeNull();
    expect(loginFromText('the octocat')).toBeNull();
    expect(loginFromText('')).toBeNull();
    expect(loginFromText(undefined)).toBeNull();
    expect(loginFromText(null)).toBeNull();
    expect(loginFromText('@settings')).toBeNull();
    expect(loginFromText('https://example.com/octocat')).toBeNull();
    expect(loginFromText('@@octocat')).toBeNull();
    // An address followed by more words is a sentence, not a name.
    expect(loginFromText('https://github.com/octocat and more')).toBeNull();
    expect(loginFromText('see https://github.com/octocat')).toBeNull();
    // The words can start after the person's name has already been read.
    expect(loginFromText('https://github.com/octocat/ and more')).toBeNull();
    expect(loginFromText('https://github.com/octocat/Hello-World')).toBe('octocat');
  });
});

describe('pageInfo: profiles', () => {
  it('knows a profile page, with or without its tab, a slash or a fragment', () => {
    for (const url of ['https://github.com/octocat', 'https://github.com/octocat/', 'https://github.com/octocat?tab=repositories', 'https://github.com/octocat#top']) {
      expect(pageInfo(url), url).toEqual({ kind: 'profile', login: 'octocat' });
    }
  });
  it('does not take GitHub’s own one-part pages for profiles', () => {
    for (const url of ['https://github.com/', 'https://github.com/settings', 'https://github.com/login', 'https://github.com/explore', 'https://github.com/notifications']) {
      expect(pageInfo(url).kind, url).toBe('other');
    }
  });
});

describe('pageInfo: READMEs', () => {
  it('takes the front page of a repository to show its README', () => {
    expect(pageInfo('https://github.com/octocat/Hello-World')).toEqual({ kind: 'readme', rawUrl: 'https://github.com/octocat/Hello-World/raw/HEAD/README.md', name: 'README.md' });
    expect(pageInfo('https://github.com/octocat/octocat')).toMatchObject({ kind: 'readme' });
  });
  it('finds the raw text of a markdown file, whatever the branch is called', () => {
    expect(pageInfo('https://github.com/o/r/blob/main/docs/guide.md')).toEqual({ kind: 'readme', rawUrl: 'https://github.com/o/r/raw/main/docs/guide.md', name: 'guide.md' });
    expect(pageInfo('https://github.com/o/r/blob/feature/new-thing/README.markdown')).toEqual({ kind: 'readme', rawUrl: 'https://github.com/o/r/raw/feature/new-thing/README.markdown', name: 'README.markdown' });
    // A space in a folder or file name stays encoded once, not twice, and the file's name is shown as written.
    expect(pageInfo('https://github.com/o/r/blob/main/a%20b/c.MD')).toEqual({ kind: 'readme', rawUrl: 'https://github.com/o/r/raw/main/a%20b/c.MD', name: 'c.MD' });
    expect(pageInfo('https://github.com/o/r/blob/main/my%20notes.md')).toMatchObject({ name: 'my notes.md', rawUrl: 'https://github.com/o/r/raw/main/my%20notes.md' });
    expect(pageInfo('https://github.com/o/r/blob/main/bad%E0%A4%A.md')).toMatchObject({ kind: 'readme' });
  });
  it('finds the README inside a folder', () => {
    expect(pageInfo('https://github.com/o/r/tree/main/packages/core')).toEqual({ kind: 'readme', rawUrl: 'https://github.com/o/r/raw/main/packages/core/README.md', name: 'README.md' });
  });
  it('leaves other files and pages of a repository alone', () => {
    for (const url of ['https://github.com/o/r/blob/main/src/index.ts', 'https://github.com/o/r/issues', 'https://github.com/o/r/pull/3', 'https://github.com/o/r/blob/main/README', 'https://github.com/o/r/commits/main', 'https://github.com/o/r/actions']) {
      expect(pageInfo(url).kind, url).toBe('other');
    }
  });
  it('does not treat a reserved owner as one', () => {
    expect(pageInfo('https://github.com/settings/keys').kind).toBe('other');
    expect(pageInfo('https://github.com/orgs/acme/people').kind).toBe('other');
  });
});

describe('pageInfo: the editor', () => {
  it('knows an edit page for a markdown file, and a new file', () => {
    expect(pageInfo('https://github.com/o/r/edit/main/README.md')).toEqual({ kind: 'edit', name: 'README.md', rawUrl: 'https://github.com/o/r/raw/main/README.md' });
    expect(pageInfo('https://github.com/o/r/edit/main/my%20docs/notes.md')).toEqual({ kind: 'edit', name: 'notes.md', rawUrl: 'https://github.com/o/r/raw/main/my%20docs/notes.md' });
    expect(pageInfo('https://github.com/o/r/new/main?filename=docs/a.md')).toEqual({ kind: 'edit', name: 'docs/a.md' });
    expect(pageInfo('https://github.com/o/r/new/main')).toEqual({ kind: 'edit', name: null });
    expect(pageInfo('https://github.com/o/r/new/main?filename=index.js')).toEqual({ kind: 'edit', name: null });
  });
  it('ignores the editor for a file that is not markdown', () => {
    expect(pageInfo('https://github.com/o/r/edit/main/src/index.ts').kind).toBe('other');
  });
});

describe('pageInfo: other sites', () => {
  it('knows nothing outside github.com over https', () => {
    for (const url of ['https://example.com/octocat', 'http://github.com/octocat', 'https://github.com.evil.example/octocat', 'https://gist.github.com/octocat', '', 'nonsense', 'file:///etc/passwd']) {
      expect(pageInfo(url).kind, url).toBe('other');
    }
  });
});

describe('isAllowedRawUrl', () => {
  it('allows a raw file on GitHub and nothing else', () => {
    expect(isAllowedRawUrl('https://github.com/o/r/raw/main/README.md')).toBe(true);
    expect(isAllowedRawUrl('https://raw.githubusercontent.com/o/r/main/README.md')).toBe(true);
  });
  it('refuses pages, other hosts, plain http and tricks', () => {
    for (const url of ['https://github.com/o/r', 'https://github.com/o/r/blob/main/README.md', 'http://github.com/o/r/raw/main/a.md', 'https://evil.example/o/r/raw/main/a.md', 'https://github.com.evil.example/o/r/raw/main/a.md', 'https://evil.example/?https://raw.githubusercontent.com/a', 'https://github.com/raw/x', 'file:///etc/passwd', 'javascript:alert(1)', '', 'nonsense']) {
      expect(isAllowedRawUrl(url), url).toBe(false);
    }
  });
});

describe('small facts', () => {
  it('knows markdown files by their ending, in any case', () => {
    for (const name of ['a.md', 'A.MD', 'x.markdown', 'x.mdown', 'x.mkd', 'dir/README.md']) expect(isMarkdownFile(name), name).toBe(true);
    for (const name of ['a.mdx', 'a.txt', 'README', 'a.md.bak', 'md']) expect(isMarkdownFile(name), name).toBe(false);
  });
  it('has a sensible limit on the size of a README', () => {
    expect(MAX_README_CHARS).toBeGreaterThan(500_000);
  });
});

describe('readmeCandidates', () => {
  it('tries the usual names for a README, the one it was given first', () => {
    const list = readmeCandidates('https://github.com/o/r/raw/HEAD/README.md');
    expect(list[0]).toBe('https://github.com/o/r/raw/HEAD/README.md');
    expect(list).toContain('https://github.com/o/r/raw/HEAD/readme.md');
    expect(list).toContain('https://github.com/o/r/raw/HEAD/README.markdown');
    expect(new Set(list).size).toBe(list.length);
    for (const url of list) expect(isAllowedRawUrl(url), url).toBe(true);
  });
  it('has one address for any other file', () => {
    expect(readmeCandidates('https://github.com/o/r/raw/main/docs/guide.md')).toEqual(['https://github.com/o/r/raw/main/docs/guide.md']);
    expect(readmeCandidates('https://github.com/o/r/raw/main/NOT-README.md')).toHaveLength(1);
  });
});

describe('loginForMenu', () => {
  it('prefers the person in a link over the selected text', () => {
    expect(loginForMenu({ linkUrl: 'https://github.com/octocat/Hello-World', selectionText: 'someone' })).toBe('octocat');
  });
  it('falls back to the selected text when the link names nobody', () => {
    expect(loginForMenu({ linkUrl: 'https://github.com/settings', selectionText: '@someone' })).toBe('someone');
    expect(loginForMenu({ selectionText: 'octocat' })).toBe('octocat');
  });
  it('is nobody when neither names a person', () => {
    expect(loginForMenu({})).toBeNull();
    expect(loginForMenu({ linkUrl: 'https://example.com/octocat', selectionText: 'a whole sentence here' })).toBeNull();
  });
});
