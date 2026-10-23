import type { Output, Template } from '../types';
import { wrapReadme } from '../readme';
import { escapeMarkdown, formatNumber, safeUrl } from '../util';

export const minimal: Template = {
  id: 'minimal',
  name: 'Minimal',
  description: 'Plain Markdown with no images. Loads instantly and works everywhere.',
  tags: ['light', 'text', 'fast'],
  render(profile, config): Output {
    const sections: string[] = [`# ${escapeMarkdown(profile.name ?? profile.login)}`];

    if (config.text.headline) sections.push(`**${escapeMarkdown(config.text.headline)}**`);

    const bio = config.text.bio ?? profile.bio;
    if (bio) sections.push(escapeMarkdown(bio));

    const website = safeUrl(profile.website);
    const facts = [
      profile.company && `Works at ${escapeMarkdown(profile.company)}`,
      profile.location && `Based in ${escapeMarkdown(profile.location)}`,
      website && `[${escapeMarkdown(website.replace(/^https?:\/\//, '').replace(/\/$/, ''))}](<${website}>)`,
    ].filter((fact): fact is string => Boolean(fact));
    if (facts.length > 0) sections.push(facts.map((fact) => `- ${fact}`).join('\n'));

    for (const block of config.blocks) {
      if (block === 'stats') {
        sections.push(
          [
            '| Repositories | Stars | Followers | Following |',
            '| ---: | ---: | ---: | ---: |',
            `| ${formatNumber(profile.publicRepos)} | ${formatNumber(profile.totalStars)} | ${formatNumber(profile.followers)} | ${formatNumber(profile.following)} |`,
          ].join('\n'),
        );
      } else if (block === 'languages' && profile.languages.length > 0) {
        const items = profile.languages.map((l) => `${escapeMarkdown(l.name)} ${l.percent}%`);
        sections.push(`**Languages:** ${items.join(' · ')}`);
      } else if (block === 'projects' && profile.topRepos.length > 0) {
        const items = profile.topRepos.map((repo) => {
          const description = repo.description ? ` — ${escapeMarkdown(repo.description)}` : '';
          return `- [${escapeMarkdown(repo.name)}](<${repo.url}>) (★ ${formatNumber(repo.stars)})${description}`;
        });
        sections.push(['**Projects**', '', ...items].join('\n'));
      }
    }

    return { readme: wrapReadme(sections.join('\n\n'), config), assets: [] };
  },
};
