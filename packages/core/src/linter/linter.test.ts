import { describe, expect, it } from 'vitest';
import { altFromAddress, linkRules } from './rules-links';
import { lintReadme, type LintIssue } from './index';
import { headingsOf, maskLine, parseDoc } from './scan';
import { textRules } from './rules-text';

const ids = (text: string): string[] => [...new Set(lintReadme(text).issues.map((i) => i.rule))];
const fixedOf = (text: string): string => lintReadme(text).corrected;
const issue = (text: string, rule: string): LintIssue | undefined => lintReadme(text).issues.find((i) => i.rule === rule);

/** A tidy README that should draw no complaints at all. */
const CLEAN = `# Ada Lovelace

Hi, I write compilers and tiny tools.

## What I use

- Go
- Rust

[My site](https://example.com/about)

![Portrait of Ada](https://example.com/ada.png)
`;

describe('a tidy README', () => {
  it('draws no issues and is returned unchanged', () => {
    const result = lintReadme(CLEAN);
    expect(result.issues).toEqual([]);
    expect(result.corrected).toBe(CLEAN);
    expect(result.changed).toBe(false);
  });
});

describe('scanning', () => {
  it('marks fenced code, including the fences, and finds an unclosed one', () => {
    const doc = parseDoc(['a', '```js', '#x', '```', 'b', '~~~', 'open']);
    expect(doc.code).toEqual([false, true, true, true, false, true, true]);
    expect(doc.unclosedFence).toBe(5);
  });

  it('only closes a fence with the same mark and at least the same length', () => {
    expect(parseDoc(['````', '```', 'x', '````']).code).toEqual([true, true, true, true]);
    expect(parseDoc(['```', '~~~', 'x']).unclosedFence).toBe(0);
  });

  it('marks multi-line HTML comments', () => {
    expect(parseDoc(['a', '<!--', 'b', '-->', 'c']).comment).toEqual([false, true, true, true, false]);
  });

  it('hides code, tags, addresses and definitions from wording rules, keeping the length', () => {
    const line = 'use `github` and <b>x</b> at https://github.com/a [t](http://github.com)';
    const masked = maskLine(line);
    expect(masked).toHaveLength(line.length);
    expect(masked).not.toMatch(/github/);
    expect(masked).toContain('use');
  });

  it('gives headings the anchors GitHub gives them, with -1 for repeats', () => {
    const doc = parseDoc(['# Hello, World!', '## Hello, World!', '### Café ☕ time']);
    expect(headingsOf(doc).map((h) => h.slug)).toEqual(['hello-world', 'hello-world-1', 'café--time']);
  });
});

describe('file-level problems', () => {
  it('removes a byte-order mark', () => {
    expect(issue(`\uFEFF${CLEAN}`, 'byte-order-mark')?.fixed).toBe(true);
    expect(fixedOf(`\uFEFF${CLEAN}`)).toBe(CLEAN);
  });

  it('turns Windows line endings into plain ones', () => {
    expect(issue(CLEAN.replace(/\n/g, '\r\n'), 'line-endings')?.fixed).toBe(true);
    expect(fixedOf(CLEAN.replace(/\n/g, '\r\n'))).toBe(CLEAN);
  });

  it('adds the final new line and removes extra ones at the end', () => {
    expect(issue(CLEAN.trimEnd(), 'final-newline')?.fixed).toBe(true);
    expect(fixedOf(CLEAN.trimEnd())).toBe(CLEAN);
    expect(fixedOf(`${CLEAN}\n\n\n`)).toBe(CLEAN);
  });

  it('calls an empty file empty, and corrects it to nothing', () => {
    expect(ids('')).toContain('empty');
    expect(ids('   \n\n')).toContain('empty');
    expect(fixedOf('  \n')).toBe('');
  });
});

describe('headings', () => {
  it('fixes a missing space after the #, but leaves a list of hashtags alone', () => {
    expect(fixedOf('#Title\n')).toBe('# Title\n');
    expect(fixedOf('###Small\n')).toBe('### Small\n');
    expect(ids('#Title\n')).toContain('heading-space');
    expect(ids('#opensource #coding #rust\n')).not.toContain('heading-space');
    expect(fixedOf('#opensource #coding\n')).toBe('#opensource #coding\n');
  });

  it('removes closing hashes', () => {
    expect(fixedOf('## Title ##\n')).toBe('## Title\n');
  });

  it('puts a blank line above and below headings', () => {
    expect(fixedOf('# A\ntext\n## B\nmore\n')).toBe('# A\n\ntext\n\n## B\n\nmore\n');
  });

  it('does not touch a # inside a code block', () => {
    const code = '```sh\n#Title\n# a comment\n```\n';
    expect(fixedOf(code)).toBe(code);
  });

  it('warns about structure without changing it', () => {
    const text = '## Only a subtitle\n\n#### Skipped\n\n# One\n\n# Two\n\n## Done:\n';
    const found = lintReadme(text).issues.filter((i) => i.rule === 'heading-structure').map((i) => i.message);
    expect(found.some((m) => /no top-level heading|second top-level/.test(m))).toBe(true);
    expect(found.some((m) => /jumps from level 2 to level 4/.test(m))).toBe(true);
    expect(found.some((m) => /ends with punctuation/.test(m))).toBe(true);
    expect(lintReadme(text).issues.filter((i) => i.rule === 'heading-structure').every((i) => !i.fixed)).toBe(true);
  });

  it('does not ask for a top-level heading when the page opens with an HTML one', () => {
    expect(ids('<h1 align="center">Hi</h1>\n\n## About\n')).not.toContain('heading-structure');
  });

  it('flags a repeated heading, pointing at the first', () => {
    expect(issue('# A\n\n## Stats\n\n## Stats\n', 'heading-duplicate')?.message).toMatch(/line 3/);
  });

  it('turns text over dashes into a divider instead of a heading', () => {
    expect(issue('Some text\n---\nmore\n', 'setext-trap')?.fixed).toBe(true);
    expect(fixedOf('Some text\n---\nmore\n')).toBe('Some text\n\n---\nmore\n');
    expect(ids('Some text\n\n---\n\nmore\n')).not.toContain('setext-trap');
    expect(ids('---\ntitle: x\n---\n')).not.toContain('setext-trap');
    expect(ids('- item\n---\n')).not.toContain('setext-trap');
  });
});

describe('whitespace', () => {
  it('strips trailing spaces but keeps a deliberate two-space line break', () => {
    expect(fixedOf('one   \ntwo\n')).toBe('one\ntwo\n');
    expect(fixedOf('one  \ntwo\n')).toBe('one  \ntwo\n');
    expect(fixedOf('last  \n')).toBe('last\n');
    expect(ids('one  \ntwo\n')).not.toContain('trailing-space');
  });

  it('collapses runs of blank lines and a leading blank line', () => {
    expect(fixedOf('\na\n\n\n\nb\n')).toBe('a\n\nb\n');
  });

  it('keeps blank lines inside code', () => {
    const code = '```\na\n\n\n\nb\n```\n';
    expect(fixedOf(code)).toBe(code);
  });

  it('replaces tabs used to indent with spaces', () => {
    expect(fixedOf('- a\n\t- b\n')).toBe('- a\n    - b\n');
  });

  it('removes zero-width characters and turns non-breaking spaces into spaces', () => {
    expect(fixedOf('a\u200Bb\u00A0c\n')).toBe('ab c\n');
    expect(issue('a\u200Bb\n', 'invisible-characters')?.fixed).toBe(true);
  });
});

describe('lists', () => {
  it('uses one bullet character throughout', () => {
    expect(fixedOf('- a\n* b\n+ c\n- d\n')).toBe('- a\n- b\n- c\n- d\n');
    expect(fixedOf('* a\n* b\n- c\n')).toBe('* a\n* b\n* c\n');
  });

  it('leaves dividers and bold text alone', () => {
    expect(fixedOf('- a\n\n***\n\n**bold** text\n')).toBe('- a\n\n***\n\n**bold** text\n');
  });
});

describe('code blocks', () => {
  it('closes a block that is never closed', () => {
    expect(issue('```js\nconst a = 1;\n', 'unclosed-code-fence')?.fixed).toBe(true);
    expect(fixedOf('```js\nconst a = 1;\n')).toBe('```js\nconst a = 1;\n```\n');
    expect(fixedOf('~~~\nx\n')).toBe('~~~\nx\n~~~\n');
  });

  it('suggests a language, without changing anything', () => {
    const result = lintReadme('```\nx\n```\n');
    expect(result.issues.map((i) => i.rule)).toEqual(['code-language']);
    expect(result.issues[0]!.fixed).toBe(false);
    expect(ids('```js\nx\n```\n')).toEqual([]);
  });
});

describe('bold and wording', () => {
  it('trims spaces inside bold marks', () => {
    expect(fixedOf('This is ** bold ** text and __ this __ too\n')).toBe('This is **bold** text and __this__ too\n');
    expect(fixedOf('**fine** and **also fine**\n')).toBe('**fine** and **also fine**\n');
    expect(fixedOf('__init__ is a name\n')).toBe('__init__ is a name\n');
  });

  it('fixes product names, but not inside code, addresses or handles', () => {
    expect(fixedOf('I love github and javascript and Linkedin.\n')).toBe('I love GitHub and JavaScript and LinkedIn.\n');
    const safe = 'See `github` and https://github.com/me and @github and github-readme and #github and github.io and [github.com/me](https://github.com/me)\n';
    expect(fixedOf(safe)).toBe(safe);
  });

  it('leaves an all-capitals line alone', () => {
    expect(fixedOf('MY GITHUB STATS\n')).toBe('MY GITHUB STATS\n');
  });

  it('fixes common spelling mistakes and keeps the capital', () => {
    expect(fixedOf('Teh developement enviroment, definately.\n')).toBe('The development environment, definitely.\n');
    expect(fixedOf('Recieve it\n')).toBe('Receive it\n');
    expect(fixedOf('`teh` stays\n')).toBe('`teh` stays\n');
  });

  it('removes a word typed twice', () => {
    expect(fixedOf('I like the the web and and more.\n')).toBe('I like the web and more.\n');
    expect(fixedOf('That is what it is.\n')).toBe('That is what it is.\n');
  });
});

describe('links', () => {
  it('removes the space between the text and the address', () => {
    expect(fixedOf('[site] (https://example.com)\n')).toBe('[site](https://example.com)\n');
    expect(fixedOf('![logo] (./logo.png)\n')).toBe('![logo](./logo.png)\n');
    expect(fixedOf('I said [note] (not a link)\n')).toBe('I said [note] (not a link)\n');
  });

  it('puts swapped brackets the right way round', () => {
    expect(fixedOf('(my site)[https://example.com]\n')).toBe('[my site](https://example.com)\n');
    expect(issue('(my site)[https://example.com]\n', 'link-reversed')?.fixed).toBe(true);
  });

  it('encodes spaces in a file address, and only warns about other parentheses', () => {
    expect(fixedOf('![x](my pics/a b.png)\n')).toContain('(my%20pics/a%20b.png)');
    expect(issue('[see](the docs)\n', 'link-address-spaces')?.fixed).toBe(false);
    expect(fixedOf('[a](b.html "A title")\n')).toBe('[a](b.html "A title")\n');
  });

  it('upgrades http to https for sites known to support it, and warns about the rest', () => {
    expect(fixedOf('[me](http://github.com/me) http://www.linkedin.com/in/me\n')).toBe('[me](https://github.com/me) https://www.linkedin.com/in/me\n');
    const other = lintReadme('[x](http://unknown-site.example/page)\n');
    expect(other.issues[0]?.fixed).toBe(false);
    expect(other.corrected).toBe('[x](http://unknown-site.example/page)\n');
  });

  it('does not call local addresses insecure, but flags them as local', () => {
    const result = lintReadme('[x](http://localhost:3000/a) ![y](C:\\Users\\me\\a.png) [z](file:///a/b)\n');
    expect(result.issues.filter((i) => i.rule === 'local-address')).toHaveLength(3);
    expect(result.issues.some((i) => i.rule === 'insecure-http')).toBe(false);
  });

  it('flags empty and blocked addresses', () => {
    expect(ids('[x]()\n')).toContain('link-empty');
    expect(ids('![]()\n')).toContain('link-empty');
    expect(ids('[x](javascript:alert(1))\n')).toContain('unsafe-address');
    expect(ids('![x](data:image/png;base64,AAAA)\n')).toContain('unsafe-address');
  });

  it('flags link text that says nothing', () => {
    expect(ids('[click here](https://example.com)\n')).toContain('link-text');
    expect(ids('[the docs](https://example.com)\n')).not.toContain('link-text');
  });

  it('checks links to sections against the real headings', () => {
    const text = '# Top\n\n## My Skills\n\n[a](#my-skills) [b](#nope) [c](#my-skil) <a name="here"></a> [d](#here)\n';
    const found = lintReadme(text).issues.filter((i) => i.rule === 'link-anchor');
    expect(found).toHaveLength(2);
    expect(found[0]!.message + found[1]!.message).toMatch(/Did you mean #my-skills/);
  });

  it('checks reference-style links', () => {
    const text = 'See [a][one] and [b][missing] and [two][].\n\n[one]: https://example.com\n[two]: https://example.com\n[unused]: https://example.com\n';
    const result = lintReadme(text);
    expect(result.issues.filter((i) => i.rule === 'link-reference').map((i) => i.message)).toEqual([expect.stringContaining('“missing”')]);
    expect(result.issues.filter((i) => i.rule === 'link-reference-unused').map((i) => i.message)).toEqual([expect.stringContaining('“unused”')]);
  });
});

describe('images', () => {
  it('adds alt text taken from the file name where there is one', () => {
    expect(fixedOf('![](./assets/my-photo.png)\n')).toBe('![my photo](./assets/my-photo.png)\n');
    expect(fixedOf('<img src="a/team_logo.svg" width="100">\n')).toBe('<img src="a/team_logo.svg" width="100" alt="team logo">\n');
  });

  it('leaves a deliberately empty alt on an HTML image alone', () => {
    expect(ids('<img src="a/logo.png" alt="">\n')).not.toContain('image-alt');
  });

  it('only warns when the file name says nothing', () => {
    const result = lintReadme('![](https://example.com/a1b2c3d4e5f60718293a.png)\n');
    expect(result.issues[0]).toMatchObject({ rule: 'image-alt', fixed: false });
    expect(result.corrected).toBe('![](https://example.com/a1b2c3d4e5f60718293a.png)\n');
  });

  it('describes shields.io badges by their label', () => {
    expect(altFromAddress('https://img.shields.io/badge/Python-3776AB?logo=python')).toBe('Python badge');
    expect(altFromAddress('https://img.shields.io/badge/Open--Source-yes-green')).toBe('Open Source badge');
    expect(altFromAddress('https://example.com/?id=42')).toBe('');
    expect(altFromAddress('https://example.com/Profile%20Picture.JPG')).toBe('Profile Picture');
  });

  it('flags useless alt text and over-wide images', () => {
    expect(ids('![image](a/b.png) ![photo.png](c.png)\n')).toContain('image-alt-generic');
    expect(issue('<img src="a.png" alt="x" width="1200">\n', 'image-width')).toBeDefined();
    expect(ids('<img src="a.png" alt="x" width="100%">\n')).not.toContain('image-width');
  });

  it('turns a GitHub page address into one that shows the picture', () => {
    expect(fixedOf('![x](https://github.com/me/repo/blob/main/img/a.png)\n')).toBe('![x](https://github.com/me/repo/blob/main/img/a.png?raw=true)\n');
    expect(fixedOf('<img src="https://github.com/me/repo/blob/main/a.png?x=1" alt="x">\n')).toBe('<img src="https://github.com/me/repo/blob/main/a.png?x=1&raw=true" alt="x">\n');
    expect(ids('![x](https://github.com/me/repo/blob/main/a.png?raw=true)\n')).not.toContain('image-blob-address');
    expect(ids('[x](https://github.com/me/repo/blob/main/a.md)\n')).not.toContain('image-blob-address');
  });

  it('warns about a very large number of images', () => {
    const many = Array.from({ length: 26 }, (_v, n) => `![badge ${n}](https://example.com/${n}.svg)`).join('\n');
    expect(ids(`${many}\n`)).toContain('image-count');
    expect(ids(`${many.split('\n').slice(0, 25).join('\n')}\n`)).not.toContain('image-count');
  });

  it('does not look inside code', () => {
    expect(ids('Write `![](a.png)` and `[x]()`.\n')).toEqual([]);
    expect(ids('```md\n![](a.png)\n[x]()\n```\n')).toEqual(expect.not.arrayContaining(['image-alt', 'link-empty']));
  });
});

describe('HTML', () => {
  it('finds tags that are never closed, and closers with no opener', () => {
    const found = lintReadme('<div align="center">\n\n<details>\n<summary>x</summary>\n\n</div>\n</span>\n').issues.filter((i) => i.rule === 'html-unclosed');
    expect(found.map((i) => i.message).sort()).toEqual(['</span> closes a tag that was never opened.', '<details> is never closed.'].sort());
  });

  it('accepts balanced HTML, self-closing tags and the tags that may stay open', () => {
    expect(ids('<p align="center">\n<img src="a.png" alt="a" />\n<br>\n<a href="https://example.com">x</a>\n</p>\n')).not.toContain('html-unclosed');
  });

  it('does not count tags inside code', () => {
    expect(ids('Use `<div>` like this:\n\n```html\n<div>\n```\n')).not.toContain('html-unclosed');
  });

  it('flags what GitHub removes', () => {
    const result = lintReadme('<script>x()</script>\n<iframe src="a"></iframe>\n<a href="#" onclick="go()">x</a>\n<style>a{}</style>\n');
    expect(result.issues.filter((i) => i.rule === 'html-blocked')).toHaveLength(4);
    expect(result.issues.filter((i) => i.rule === 'html-blocked').every((i) => i.severity === 'error')).toBe(true);
  });

  it('flags style attributes', () => {
    expect(ids('<p style="color:red">x</p>\n')).toContain('html-style');
    expect(ids('<p align="center">x</p>\n')).not.toContain('html-style');
  });

  it('replaces <center> and warns about <font>', () => {
    expect(fixedOf('<center>\n\n# Hi\n\n</center>\n')).toBe('<div align="center">\n\n# Hi\n\n</div>\n');
    expect(issue('<font color="red">x</font>\n', 'html-deprecated')?.fixed).toBe(false);
  });

  it('asks for a summary in a collapsible section', () => {
    expect(ids('<details>\n\nbody\n\n</details>\n')).toContain('details-summary');
    expect(ids('<details>\n<summary>More</summary>\n\nbody\n\n</details>\n')).not.toContain('details-summary');
  });

  it('adds the blank lines markdown needs inside an HTML block', () => {
    const text = '<div align="center">\n![logo](a/logo.png)\n**Hello**\n</div>\n';
    expect(issue(text, 'html-markdown-block')?.fixed).toBe(true);
    expect(fixedOf(text)).toBe('<div align="center">\n\n![logo](a/logo.png)\n**Hello**\n\n</div>\n');
    const ok = '<div align="center">\n\n![logo](a/logo.png)\n\n</div>\n';
    expect(ids(ok)).not.toContain('html-markdown-block');
    const details = '<details>\n<summary>More</summary>\n- one\n- two\n</details>\n';
    expect(fixedOf(details)).toBe('<details>\n<summary>More</summary>\n\n- one\n- two\n\n</details>\n');
  });

  it('leaves HTML comments, such as generator markers, alone', () => {
    const text = '<!--START_SECTION:waka-->\n#Not touched  \n<!--END_SECTION:waka-->\n';
    expect(fixedOf(text)).toBe(text);
    const multi = '<!--\n#Hidden  \n-->\n';
    expect(fixedOf(multi)).toBe(multi);
  });
});

describe('tables', () => {
  it('adds a missing divider row', () => {
    expect(fixedOf('| Name | Role |\n| Ada | Dev |\n')).toBe('| Name | Role |\n| --- | --- |\n| Ada | Dev |\n');
    expect(issue('| Name | Role |\n| Ada | Dev |\n', 'table')?.fixed).toBe(true);
  });

  it('repairs a divider with the wrong number of columns, keeping alignment', () => {
    expect(fixedOf('| a | b | c |\n| :-- | --: |\n| 1 | 2 | 3 |\n')).toBe('| a | b | c |\n| :-- | --: | --- |\n| 1 | 2 | 3 |\n');
  });

  it('pads short rows and only warns about long ones', () => {
    expect(fixedOf('| a | b |\n| --- | --- |\n| 1 |\n')).toBe('| a | b |\n| --- | --- |\n| 1 |  |\n');
    const long = lintReadme('| a | b |\n| --- | --- |\n| 1 | 2 | 3 |\n');
    expect(long.issues[0]).toMatchObject({ rule: 'table', fixed: false });
  });

  it('leaves a good table, and a table in code, alone', () => {
    const good = '| a | b |\n| --- | --- |\n| 1 | 2 |\n';
    expect(fixedOf(good)).toBe(good);
    const code = '```\n| a | b |\n| 1 | 2 |\n```\n';
    expect(fixedOf(code)).toBe(code);
  });

  it('does not take a line with one pipe in prose for a table', () => {
    expect(ids('Pick a | b\n')).not.toContain('table');
  });
});

describe('safety and content', () => {
  it('flags secrets without printing them, in code as well as text', () => {
    const token = `ghp_${'a1B2c3D4e5'.repeat(4)}`;
    const result = lintReadme(`Use this:\n\n\`\`\`\nexport T=${token}\n\`\`\`\n`);
    const found = result.issues.find((i) => i.rule === 'secret')!;
    expect(found.severity).toBe('error');
    expect(found.fixed).toBe(false);
    expect(found.message).not.toContain(token);
    expect(found.message).toContain('ghp_');
    expect(found.line).toBe(4);
    expect(result.corrected).toContain(token);
  });

  it.each([
    ['AKIAIOSFODNN7EXAMPLE', 'AWS'],
    ['-----BEGIN RSA PRIVATE KEY-----', 'private key'],
    [`xoxb-${'1234567890'}-abcdef`, 'Slack'],
    ['password = "hunter2hunter2hunter2"', 'password'],
  ])('recognises %s', (secret, label) => {
    expect(issue(`${secret}\n`, 'secret')?.message).toContain(label);
  });

  it('does not mistake ordinary words for secrets', () => {
    expect(ids('My password manager is great and I like skills.\n')).not.toContain('secret');
  });

  it('flags placeholders left from a template', () => {
    const text = '# Hi, I am Your Name\n\nTODO: write this\n\n[Your bio here]\n\nSee github.com/username/repo and YOUR_USERNAME.\n\nLorem ipsum dolor.\n';
    expect(lintReadme(text).issues.filter((i) => i.rule === 'placeholder').length).toBeGreaterThanOrEqual(5);
    expect(ids('# Ada\n\nI wrote a todo app.\n')).not.toContain('placeholder');
  });

  it('warns about pictures that depend on someone else’s free server, once per host', () => {
    const text = '![a](https://github-readme-stats.vercel.app/api?username=x)\n![b](https://github-readme-stats.vercel.app/api/top-langs)\n![c](https://old.herokuapp.com/x.svg)\n![d](https://img.shields.io/badge/a-b-c)\n';
    const found = lintReadme(text).issues.filter((i) => i.rule === 'third-party');
    expect(found).toHaveLength(2);
    expect(found.every((i) => i.severity === 'tip')).toBe(true);
  });

  it('flags a plain email address but not a mailto link or a noreply address', () => {
    expect(ids('Mail me: ada@example.com\n')).toContain('email');
    expect(ids('[mail](mailto:ada@example.com) 123+ada@users.noreply.github.com\n')).not.toContain('email');
  });

  it('flags a file that is over GitHub’s limit and one that is very long', () => {
    expect(issue(`# x\n\n${'a'.repeat(520 * 1024)}\n`, 'size')?.message).toMatch(/500 KB/);
    expect(issue(`${Array.from({ length: 450 }, () => 'line').join('\n\n')}\n`, 'size')).toBeDefined();
    expect(ids(CLEAN)).not.toContain('size');
  });
});

describe('the corrected version', () => {
  const MESSY = [
    '\uFEFF#Hello I am Ada\r',
    'I love github and javascript.  \r',
    '**Bold ** text and teh developement.\r',
    '* one\r',
    '- two\r',
    '\r',
    '\r',
    '\r',
    '<div align="center">\r',
    '![](./assets/hero-banner.png)\r',
    '</div>\r',
    '[my site] (http://github.com/ada)\r',
    '| a | b |\r',
    '| 1 | 2 |\r',
    '```js\r',
    'const a = 1;',
  ].join('\n');

  it('repairs a messy README in one pass', () => {
    const { corrected } = lintReadme(MESSY);
    expect(corrected).toBe(
      [
        '# Hello I am Ada',
        '',
        'I love GitHub and JavaScript.  ',
        '**Bold** text and the development.',
        '- one',
        '- two',
        '',
        '<div align="center">',
        '',
        '![hero banner](./assets/hero-banner.png)',
        '',
        '</div>',
        '',
        '[my site](https://github.com/ada)',
        '| a | b |',
        '| --- | --- |',
        '| 1 | 2 |',
        '```js',
        'const a = 1;',
        '```',
        '',
      ].join('\n'),
    );
  });

  it('marks every repaired issue as fixed and leaves the rest for the author', () => {
    const result = lintReadme(MESSY);
    expect(result.counts.fixed).toBeGreaterThan(8);
    expect(result.counts.fixed + result.counts.manual).toBe(result.issues.length);
    expect(result.counts.error + result.counts.warning + result.counts.tip).toBe(result.issues.length);
  });

  it('is stable: correcting a corrected README changes nothing and finds nothing fixable', () => {
    for (const text of [MESSY, CLEAN, '#a\n\n\n* b\n+ c\n```\nx', '<center>\n![](a/b-c.png)\n</center>\n', '| a | b |\n| 1 | 2 |\n| 3 |\n']) {
      const once = lintReadme(text).corrected;
      const again = lintReadme(once);
      expect(again.corrected).toBe(once);
      expect(again.issues.filter((i) => i.fixed)).toEqual([]);
    }
  });

  it('never loses a link, an image or a code block', () => {
    const text = 'a [one](https://example.com/1) b ![two](./two.png) c\n\n```js\nlet x = "[three](#)";\n```\n';
    const out = lintReadme(text).corrected;
    expect(out).toContain('[one](https://example.com/1)');
    expect(out).toContain('![two](./two.png)');
    expect(out).toContain('let x = "[three](#)";');
  });

  it('sorts the most serious issues first and numbers lines from 1', () => {
    const { issues } = lintReadme('#Title\n\ntext   \n\n[x]()\n');
    const order = issues.map((i) => i.severity);
    expect(order).toEqual([...order].sort((a, b) => ['error', 'warning', 'tip'].indexOf(a) - ['error', 'warning', 'tip'].indexOf(b)));
    expect(issues.find((i) => i.rule === 'heading-space')!.line).toBe(1);
    expect(issues.find((i) => i.rule === 'link-empty')!.line).toBe(5);
  });
});

describe('the rules themselves', () => {
  const all = [...linkRules, ...textRules];

  it('have unique ids, titles and a severity', () => {
    expect(new Set(all.map((r) => r.id)).size).toBe(all.length);
    for (const rule of all) {
      expect(rule.title.length).toBeGreaterThan(5);
      expect(['error', 'warning', 'tip']).toContain(rule.severity);
    }
  });

  it('never throw on odd input', () => {
    const odd = ['', '\n', '```', '<', '<<<>>>', '[](', '![', '|', '#', '\u0000', '`', '<!--', '[a][', '](', '*'.repeat(500), '[a](b'.repeat(200), '😀'.repeat(100)];
    for (const text of odd) expect(() => lintReadme(text), JSON.stringify(text.slice(0, 20))).not.toThrow();
  });

  it('finish quickly on a large input', () => {
    const big = `${Array.from({ length: 4000 }, (_v, n) => `Line ${n} with [a link](https://example.com/${n}) and **bold** and \`code\``).join('\n')}\n`;
    const start = Date.now();
    lintReadme(big);
    expect(Date.now() - start).toBeLessThan(5000);
  });
});

describe('fixing is stable on any mix of fragments', () => {
  const PIECES = [
    '#Heading', '# Title', '## Section ##', '###### deep', 'Plain text with github and teh typo.', 'Two  ', 'Trailing   ', '', '', '\t- tabbed item',
    '- dash', '* star', '+ plus', '1. one', '> quote', '---', '***', '```js', '```', '~~~', '    indented code', '<div align="center">', '</div>', '<p align="center">',
    '</p>', '<details>', '<summary>More</summary>', '</details>', '<center>', '</center>', '![](a/b-c.png)', '![alt](https://github.com/o/r/blob/main/x.png)',
    '<img src="a/logo.svg" width="100">', '[text] (https://example.com)', '(text)[https://example.com]', '[x](http://github.com/me)', '[ref][one]', '[one]: https://example.com',
    '| a | b |', '| --- | --- |', '| 1 |', '| 1 | 2 | 3 |', '**bold **', '** bold**', 'the the', '<!--START_SECTION:x-->', '<!--END_SECTION:x-->', '<!-- note -->',
    'Visit https://github.com/me', '#opensource #coding', 'nbsp here', '[a](my file.png)',
  ];

  const rng = (seed: number) => () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };

  it('corrects the same way twice, for 400 random READMEs', () => {
    const random = rng(7);
    for (let n = 0; n < 400; n++) {
      const text = Array.from({ length: 3 + Math.floor(random() * 14) }, () => PIECES[Math.floor(random() * PIECES.length)]!).join('\n');
      const once = lintReadme(text).corrected;
      const again = lintReadme(once);
      expect(again.corrected, JSON.stringify(text)).toBe(once);
      expect(again.issues.filter((i) => i.fixed), JSON.stringify(text)).toEqual([]);
    }
  });

  it('never drops a link or an image address that was in the text', () => {
    const random = rng(11);
    for (let n = 0; n < 200; n++) {
      const text = Array.from({ length: 4 + Math.floor(random() * 10) }, () => PIECES[Math.floor(random() * PIECES.length)]!).join('\n');
      const out = lintReadme(text).corrected;
      for (const host of text.match(/github\.com\/me|example\.com|a\/b-c\.png|a\/logo\.svg/g) ?? []) expect(out, JSON.stringify(text)).toContain(host);
    }
  });
});
