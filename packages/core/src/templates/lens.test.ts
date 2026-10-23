import { DOMParser } from '@xmldom/xmldom';
import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../config';
import { buildContributions } from '../contributions';
import { renderProfile } from '../render';
import type { Config, ContributionDay, Profile, RepoSummary } from '../types';
import { reposIn, shareIn } from './kit';
import { DATA, INFRA, SERVICES, WEB } from './lenses';

const repo = (name: string, language: string | null, stars: number, forks = 0, over: Partial<RepoSummary> = {}): RepoSummary => ({
  name,
  description: `${name} description`,
  stars,
  forks,
  language,
  url: `https://github.com/octo/${name}`,
  ...over,
});

const days: ContributionDay[] = Array.from({ length: 70 }, (_v, i) => ({
  date: new Date(Date.UTC(2026, 3, 1 + i)).toISOString().slice(0, 10),
  count: i % 4,
  level: (i % 4 === 0 ? 0 : 2) as 0 | 2,
}));

const base: Profile = {
  login: 'octo',
  name: 'Octo Cat',
  avatarUrl: 'https://avatars.example/octo',
  bio: 'Makes things',
  company: null,
  location: null,
  website: null,
  url: 'https://github.com/octo',
  followers: 4321,
  following: 17,
  publicRepos: 33,
  totalStars: 777,
  totalForks: 88,
  activeRepos: 5,
  createdAt: '2020-01-01T00:00:00Z',
  languages: [
    { name: 'TypeScript', percent: 50 },
    { name: 'Go', percent: 30 },
    { name: 'Shell', percent: 20 },
  ],
  topRepos: [
    repo('ui-kit', 'TypeScript', 300, 20, { license: 'MIT', pushedAt: '2026-05-30T00:00:00Z' }),
    repo('svc', 'Go', 200, 40, { pushedAt: '2026-04-01T00:00:00Z' }),
    repo('deploy', 'Shell', 50, 3),
  ],
  contributions: buildContributions(days),
  fetchedAt: '2026-06-10T08:00:00Z',
};

const config = (template: string, over: Partial<Config> = {}): Config => ({ ...defaultConfig('octo', template), ...over });
const svgOf = (p: Profile, template: string, over: Partial<Config> = {}) =>
  renderProfile(p, config(template, over)).assets.find((a) => a.path.endsWith(`${template}-dark.svg`))!.content;
const texts = (svg: string) =>
  Array.from(new DOMParser().parseFromString(svg, 'image/svg+xml').getElementsByTagName('text')).map((t) => t.textContent ?? '');

describe('language helpers', () => {
  it('pick repositories by main language, most starred first, ignoring case and repos with no language', () => {
    const repos = [repo('a', 'go', 1), repo('b', 'Go', 9), repo('c', null, 99), repo('d', 'Python', 5)];
    expect(reposIn({ ...base, topRepos: repos }, ['Go']).map((r) => r.name)).toEqual(['b', 'a']);
  });

  it('add up the language shares that fall in a list', () => {
    expect(shareIn(base, WEB)).toBe(50);
    expect(shareIn(base, [...WEB, ...INFRA])).toBe(70);
    expect(shareIn({ ...base, languages: [] }, WEB)).toBe(0);
  });

  it('keep the lists distinct where they should be', () => {
    expect(WEB).toContain('TypeScript');
    expect(SERVICES).toContain('Go');
    expect(INFRA).toContain('Shell');
    expect(DATA).toContain('Jupyter Notebook');
    expect(WEB.filter((l) => INFRA.includes(l))).toEqual([]);
  });
});

describe.each(['frontend', 'backend', 'devops', 'datalab', 'animatedfrontend'])('%s lens', (id) => {
  const area = { frontend: ['ui-kit', 'TypeScript'], animatedfrontend: ['ui-kit', 'TypeScript'], backend: ['svc', 'Go'], devops: ['deploy', 'Shell'], datalab: ['', ''] }[id]!;

  it('only claims its area when a top repository is really in it', () => {
    const none: Profile = { ...base, topRepos: [repo('thing', 'Brainfuck', 3)], languages: [{ name: 'Brainfuck', percent: 100 }] };
    const text = texts(svgOf(none, id)).join('\n');
    expect(text).not.toMatch(/TOP REPOS IN THIS AREA|WEB INTERFACE|SERVICES AND SYSTEMS|INFRASTRUCTURE AND|DATA AND ANALYSIS/);
    expect(text).toContain('TOP PROJECTS');
    expect(text).toContain('thing');
  });

  it('shows plain totals, not area figures, when nothing matches', () => {
    const none: Profile = { ...base, topRepos: [repo('thing', 'Brainfuck', 3)], languages: [{ name: 'Brainfuck', percent: 100 }] };
    expect(texts(svgOf(none, id))).toContain('777'); // stars earned
  });

  if (area[0]) {
    it('puts the matching repositories first and totals only their stars', () => {
      const text = texts(svgOf(base, id));
      expect(text).toContain(area[0]!);
      expect(text).toContain('TOP REPOS IN THIS AREA');
      const stars = base.topRepos.filter((r) => r.language === area[1]).reduce((s, r) => s + r.stars, 0);
      expect(text).toContain(stars.toLocaleString('en-US'));
    });
  }

  it('leaves out a panel when its block is off', () => {
    expect(texts(svgOf(base, id, { blocks: ['languages'] })).join('\n')).not.toContain('RHYTHM');
    expect(texts(svgOf(base, id, { blocks: ['activity'] })).join('\n')).not.toContain('STACK');
    expect(texts(svgOf(base, id, { blocks: ['stats'] })).join('\n')).not.toContain('STACK');
  });
});

describe('the dashboard layout', () => {
  it('draws the numbers it states', () => {
    const text = texts(svgOf(base, 'indie'));
    expect(text).toContain('5'); // active repos, the big number
    expect(text.join('\n')).toContain(`REPOS ACTIVE, LAST`);
    expect(text).toContain('33');
  });

  it('is taller with projects than without', () => {
    const height = (svg: string) => Number(/height="(\d+)" viewBox/.exec(svg)![1]);
    expect(height(svgOf(base, 'frontend'))).toBeGreaterThan(height(svgOf(base, 'frontend', { blocks: ['stats', 'languages', 'activity'] })));
  });

  it('orders recent work by when it was pushed, and says so only when dates exist', () => {
    const recent = texts(svgOf(base, 'indie'));
    expect(recent).toContain('UPDATED MOST RECENTLY');
    expect(recent.indexOf('ui-kit')).toBeLessThan(recent.indexOf('svc'));
    const undated = { ...base, topRepos: base.topRepos.map((r) => ({ ...r, pushedAt: null })) };
    expect(texts(svgOf(undated, 'indie'))).toContain('TOP PROJECTS');
  });
});

describe('the board layout', () => {
  it('ranks the framework list by forks', () => {
    const text = texts(svgOf(base, 'framework'));
    expect(text).toContain('MOST FORKED');
    expect(text.indexOf('svc')).toBeLessThan(text.indexOf('ui-kit'));
  });

  it('only states a fork total GitHub gave us', () => {
    const { totalForks: _forks, ...without } = base;
    const text = texts(svgOf(without as Profile, 'framework'));
    expect(text).not.toContain('FORKS OF YOUR REPOS');
    expect(text).toContain('STARS EARNED');
  });

  it('lists only proof points the data backs up', () => {
    const all = texts(svgOf(base, 'ossproof')).join('\n');
    expect(all).toContain('777 stars earned');
    expect(all).toContain('88 forks by other people');
    expect(all).toContain('1 of the top 3 repositories declare a licence');
    expect(all).toContain('5 repositories pushed to in the last');
    const bare: Profile = { ...base, totalStars: 0, totalForks: 0, activeRepos: 0, followers: 0, topRepos: [], contributions: undefined as never };
    const none = texts(svgOf(bare, 'ossproof')).join('\n');
    expect(none).not.toMatch(/stars earned across|forks by other|declare a licence|pushed to in the last|streak|follow the work/);
  });

  it('shows a founder’s own words as the vision, and omits it when there are none', () => {
    expect(texts(svgOf(base, 'founder', { text: { headline: 'Making tools people keep' } }))).toContain('Making tools people keep');
    expect(texts(svgOf({ ...base, bio: null }, 'founder')).join('\n')).not.toContain('VISION');
  });

  it('draws a year of activity as a calendar, one square per day', () => {
    const doc = new DOMParser().parseFromString(svgOf(base, 'product'), 'image/svg+xml');
    const squares = Array.from(doc.getElementsByTagName('rect')).filter((r) => r.getAttribute('rx') === '1.5');
    expect(squares).toHaveLength(days.length);
  });
});

describe('all lens designs', () => {
  const ids = ['frontend', 'backend', 'devops', 'datalab', 'indie', 'animatedfrontend', 'product', 'advocate', 'framework', 'ossbuilder', 'ossproof', 'founder'];

  it('show no number from the stats block when it is turned off', () => {
    for (const id of ids) {
      const text = texts(svgOf(base, id, { blocks: ['languages'] })).join(String.fromCharCode(10));
      for (const hidden of ['777', '4,321', '33', '88']) expect(text, id + ' leaked ' + hidden).not.toContain(hidden);
    }
  });

  it('look different from one another', () => {
    expect(new Set(ids.map((id) => svgOf(base, id))).size).toBe(ids.length);
  });

  it('only sweep and pulse when motion is on, and honour reduced motion', () => {
    expect(svgOf(base, 'animatedfrontend', { motion: false })).not.toContain('@keyframes');
    expect(svgOf(base, 'animatedfrontend')).toContain('class="sweep"');
    expect(svgOf(base, 'animatedfrontend')).toContain('prefers-reduced-motion');
    expect(svgOf(base, 'frontend')).not.toContain('class="sweep"');
  });

  it('never print a job title', () => {
    for (const id of ids) {
      const text = texts(svgOf(base, id)).join('\n');
      expect(text).not.toMatch(/engineer|developer|founder of|creator of|maintainer of/i);
    }
  });

  it('describe their image in the README, and mention the year of activity only when drawn', () => {
    for (const id of ids) {
      const out = renderProfile(base, config(id));
      expect(out.readme).toContain(`livebio/${id}-dark.svg`);
      expect(out.readme).toContain('4,321 followers');
    }
  });
});
