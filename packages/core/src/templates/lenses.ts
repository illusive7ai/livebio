import { ACTIVE_WINDOW_DAYS } from '../github';
import type { Profile, RepoSummary } from '../types';
import { formatNumber } from '../util';
import { reposIn, shareIn } from './kit';
import { lensTemplate, type Fact, type LensSpec, type Plan } from './lens';
import { plural } from './shared';

/** Main languages that suggest each kind of work. A repository counts by its main language only. */
export const WEB = ['TypeScript', 'JavaScript', 'CSS', 'SCSS', 'Less', 'HTML', 'Vue', 'Svelte', 'Astro', 'Elm', 'CoffeeScript'];
export const SERVICES = ['Go', 'Rust', 'Java', 'Kotlin', 'Scala', 'C#', 'Elixir', 'Erlang', 'Ruby', 'PHP', 'Python', 'C', 'C++', 'Haskell', 'Clojure', 'Zig'];
export const INFRA = ['Shell', 'HCL', 'Dockerfile', 'Makefile', 'Nix', 'PowerShell', 'Jsonnet', 'Starlark', 'Bicep'];
export const DATA = ['Python', 'Jupyter Notebook', 'R', 'Julia', 'SQL', 'MATLAB', 'TeX', 'Stata'];

const stars = (repos: RepoSummary[]): number => repos.reduce((sum, r) => sum + r.stars, 0);
const fact = (label: string, value: number | string | undefined, show = true): Fact[] =>
  show && value !== undefined && value !== '' ? [{ label, value: typeof value === 'number' ? formatNumber(value) : value }] : [];

/**
 * A plan for a language-based lens. It reports how many of the user's top repositories, and how much of their
 * language mix, falls in the lens. With no match it says nothing about the lens and shows plain totals.
 */
function languagePlan(profile: Profile, languages: string[], kicker: string, matchedTitle: string, matchedCaption: string): Plan {
  const matched = reposIn(profile, languages);
  const share = shareIn(profile, languages);
  const hasMatch = matched.length > 0;
  return {
    ...(hasMatch ? { kicker } : {}),
    hero: hasMatch
      ? { value: formatNumber(stars(matched)), label: matchedCaption }
      : { value: formatNumber(profile.totalStars), label: 'STARS EARNED' },
    facts: [
      ...fact('TOP REPOS IN THIS AREA', matched.length, hasMatch),
      ...fact('SHARE OF REPOS IN THIS AREA', `${share}%`, share > 0),
      ...fact('FOLLOWERS', profile.followers),
    ].slice(0, 3),
    sections: [{ title: hasMatch ? matchedTitle : 'TOP PROJECTS', repos: (hasMatch ? matched : profile.topRepos).slice(0, 4) }],
  };
}

const frontend: LensSpec = {
  id: 'frontend',
  name: 'Frontend',
  description: 'Interface craft and shipped work: your web-language projects up front, with stars and your stack.',
  tags: ['dark', 'web', 'projects'],
  hue: 205,
  layout: 'dash',
  motif: 'swatches',
  plan: (p) => languagePlan(p, WEB, 'WEB INTERFACE WORK', 'WEB PROJECTS', 'STARS ON WEB PROJECTS'),
};

const backend: LensSpec = {
  id: 'backend',
  name: 'Backend',
  description: 'Systems thinking, made clear: your service and systems projects, their reach, and the rhythm behind them.',
  tags: ['dark', 'systems', 'projects'],
  hue: 28,
  layout: 'dash',
  motif: 'racks',
  plan: (p) => languagePlan(p, SERVICES, 'SERVICES AND SYSTEMS', 'SERVICE PROJECTS', 'STARS ON THESE PROJECTS'),
};

const devops: LensSpec = {
  id: 'devops',
  name: 'DevOps',
  description: 'Reliable systems and delivery: infrastructure and automation repos, plus how recently you have been shipping.',
  tags: ['dark', 'infrastructure', 'projects'],
  hue: 150,
  layout: 'dash',
  motif: 'pipeline',
  plan(p) {
    const base = languagePlan(p, INFRA, 'INFRASTRUCTURE AND DELIVERY', 'INFRASTRUCTURE PROJECTS', 'STARS ON THESE PROJECTS');
    const active = p.activeRepos;
    if (active !== undefined && active > 0) {
      base.facts = [...fact(`REPOS ACTIVE, LAST ${ACTIVE_WINDOW_DAYS} DAYS`, active), ...base.facts].slice(0, 3);
    }
    return base;
  },
};

const datalab: LensSpec = {
  id: 'datalab',
  name: 'Data Lab',
  description: 'Evidence, experiments, insight: notebooks and data projects up front, with the numbers behind them.',
  tags: ['dark', 'data', 'projects'],
  hue: 268,
  layout: 'dash',
  motif: 'scatter',
  plan: (p) => languagePlan(p, DATA, 'DATA AND ANALYSIS', 'DATA PROJECTS', 'STARS ON DATA PROJECTS'),
};

const indie: LensSpec = {
  id: 'indie',
  name: 'Indie Hacker',
  description: 'Builds, launches and momentum: what you updated lately, your streak, and how many projects are moving.',
  tags: ['dark', 'momentum', 'projects'],
  hue: 350,
  layout: 'dash',
  motif: 'rocket',
  plan(p) {
    const dated = p.topRepos.filter((r) => r.pushedAt).sort((a, b) => (b.pushedAt ?? '').localeCompare(a.pushedAt ?? ''));
    const streak = p.contributions?.currentStreak;
    return {
      ...(p.activeRepos !== undefined || streak !== undefined ? { kicker: 'BUILDS AND MOMENTUM' } : {}),
      hero:
        p.activeRepos !== undefined
          ? { value: formatNumber(p.activeRepos), label: `REPOS ACTIVE, LAST ${ACTIVE_WINDOW_DAYS} DAYS` }
          : { value: formatNumber(p.totalStars), label: 'STARS EARNED' },
      facts: [
        ...fact('CURRENT STREAK', streak !== undefined ? plural(streak, 'day') : undefined),
        ...fact('CONTRIBUTIONS, PAST YEAR', p.contributions?.total),
        ...fact('PUBLIC REPOSITORIES', p.publicRepos),
      ].slice(0, 3),
      sections: [{ title: dated.length > 0 ? 'UPDATED MOST RECENTLY' : 'TOP PROJECTS', repos: (dated.length > 0 ? dated : p.topRepos).slice(0, 4) }],
    };
  },
};

const animated: LensSpec = {
  id: 'animatedfrontend',
  name: 'Animated Frontend',
  description: 'Web craft with a technical visual system: a sweeping light and pulsing marks over your interface projects.',
  tags: ['animated', 'web', 'teal'],
  hue: 172,
  layout: 'dash',
  motif: 'sweep',
  animated: true,
  plan: (p) => languagePlan(p, WEB, 'WEB INTERFACE WORK', 'WEB PROJECTS', 'STARS ON WEB PROJECTS'),
};

const product: LensSpec = {
  id: 'product',
  name: 'Product Engineer',
  description: 'Outcomes, highlights and shipped work: your most-starred projects as a short, confident list.',
  tags: ['dark', 'highlights', 'projects'],
  hue: 222,
  layout: 'board',
  motif: 'spot',
  plan: (p) => ({
    hero: { value: formatNumber(p.totalStars), label: 'STARS ACROSS PROJECTS' },
    facts: [...fact('PUBLIC REPOSITORIES', p.publicRepos), ...fact('FOLLOWERS', p.followers), ...fact(`REPOS ACTIVE, LAST ${ACTIVE_WINDOW_DAYS} DAYS`, p.activeRepos)].slice(0, 3),
    sections: [{ title: 'HIGHLIGHTS', repos: p.topRepos.slice(0, 4) }],
  }),
};

const advocate: LensSpec = {
  id: 'advocate',
  name: 'Advocate',
  description: 'A memorable identity for community-facing work: your audience, your reach and your most-starred projects.',
  tags: ['dark', 'community', 'reach'],
  hue: 330,
  layout: 'board',
  motif: 'rings',
  plan: (p) => ({
    hero: { value: formatNumber(p.followers), label: 'FOLLOWERS' },
    facts: [...fact('STARS EARNED', p.totalStars), ...fact('FORKS OF YOUR REPOS', p.totalForks), ...fact('FOLLOWING', p.following)].slice(0, 3),
    sections: [{ title: 'MOST STARRED', repos: p.topRepos.slice(0, 4) }],
  }),
};

const framework: LensSpec = {
  id: 'framework',
  name: 'Framework Creator',
  description: 'Ecosystem-scale work with technical proof: your projects ranked by how many people forked them.',
  tags: ['dark', 'ecosystem', 'projects'],
  hue: 190,
  layout: 'board',
  motif: 'tree',
  plan(p) {
    const forked = [...p.topRepos].sort((a, b) => b.forks - a.forks);
    const forks = p.totalForks;
    return {
      hero: forks !== undefined ? { value: formatNumber(forks), label: 'FORKS OF YOUR REPOS' } : { value: formatNumber(p.totalStars), label: 'STARS EARNED' },
      facts: [...fact('STARS EARNED', p.totalStars, forks !== undefined), ...fact('PUBLIC REPOSITORIES', p.publicRepos), ...fact('FOLLOWERS', p.followers)].slice(0, 3),
      sections: [{ title: 'MOST FORKED', repos: forked.slice(0, 4) }],
    };
  },
};

const ossbuilder: LensSpec = {
  id: 'ossbuilder',
  name: 'OSS Builder',
  description: 'A deep open-source catalogue with contribution rhythm: every top project, its licence and its freshness.',
  tags: ['dark', 'open source', 'catalogue'],
  hue: 138,
  layout: 'board',
  motif: 'rhythm',
  plan(p) {
    const licensed = p.topRepos.filter((r) => r.license).length;
    return {
      hero: { value: formatNumber(p.publicRepos), label: 'PUBLIC REPOSITORIES' },
      facts: [
        ...fact('STARS EARNED', p.totalStars),
        ...fact('TOP REPOS WITH A LICENCE', licensed, licensed > 0),
        ...fact('CONTRIBUTIONS, PAST YEAR', p.contributions?.total),
      ].slice(0, 3),
      sections: [{ title: 'CATALOGUE', repos: p.topRepos.slice(0, 5) }],
    };
  },
};

const ossproof: LensSpec = {
  id: 'ossproof',
  name: 'Open-Source Proof',
  description: 'Open-source credibility in plain checks: only the things your public data can back up, each with its number.',
  tags: ['dark', 'open source', 'proof'],
  hue: 236,
  layout: 'board',
  motif: 'checks',
  plan(p) {
    const licensed = p.topRepos.filter((r) => r.license).length;
    const checks = [
      p.totalStars > 0 ? `${formatNumber(p.totalStars)} stars earned across public repositories` : '',
      p.totalForks !== undefined && p.totalForks > 0 ? `${formatNumber(p.totalForks)} forks by other people` : '',
      licensed > 0 ? `${licensed} of the top ${p.topRepos.length} repositories declare a licence` : '',
      p.activeRepos !== undefined && p.activeRepos > 0 ? `${formatNumber(p.activeRepos)} ${p.activeRepos === 1 ? 'repository' : 'repositories'} pushed to in the last ${ACTIVE_WINDOW_DAYS} days` : '',
      p.contributions && p.contributions.currentStreak > 0 ? `A ${p.contributions.currentStreak}-day contribution streak right now` : '',
      p.followers > 0 ? `${formatNumber(p.followers)} people follow the work` : '',
    ].filter(Boolean);
    return {
      hero: { value: formatNumber(p.totalStars), label: 'STARS EARNED' },
      facts: [...fact('PUBLIC REPOSITORIES', p.publicRepos), ...fact('FOLLOWERS', p.followers)],
      sections: [{ title: 'PROOF POINTS', checks }, { title: 'PROJECTS', repos: p.topRepos.slice(0, 3) }],
    };
  },
};

const founder: LensSpec = {
  id: 'founder',
  name: 'Founder',
  description: 'Vision, product and proof: your own words, your lead project, and the numbers that stand behind it.',
  tags: ['dark', 'product', 'proof'],
  hue: 40,
  layout: 'board',
  motif: 'columns',
  plan(p, config) {
    const vision = config.text.headline ?? config.text.bio ?? p.bio ?? undefined;
    const lead = p.topRepos[0];
    return {
      hero: { value: formatNumber(p.totalStars), label: 'STARS EARNED' },
      facts: [...fact('FOLLOWERS', p.followers), ...fact('PUBLIC REPOSITORIES', p.publicRepos), ...fact('CONTRIBUTIONS, PAST YEAR', p.contributions?.total)].slice(0, 3),
      sections: [
        ...(vision ? [{ title: 'VISION', text: vision }] : []),
        ...(lead ? [{ title: 'PRODUCT', repos: [lead] }] : []),
      ],
    };
  },
};

export const lensTemplates = [frontend, backend, devops, datalab, indie, animated, product, advocate, framework, ossbuilder, ossproof, founder].map(lensTemplate);
