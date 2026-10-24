import { useMemo, useState } from 'react';
import { getTemplate, isFavourite, templates, type Config, type Prefs, type Profile } from '@livebio/core';
import { DesignCard } from '../components/DesignCard';
import { GROUPS, groupOf, sampleProfile, type Group } from '../lib/catalog';
import type { SavedDesign } from '../lib/saved';
import { thumbnailFor, thumbnails } from '../lib/thumbs';

interface Props {
  profile: Profile | null;
  config: Config;
  designs: SavedDesign[];
  prefs: Prefs;
  onUse: (templateId: string) => void;
  onUseSaved: (design: SavedDesign) => void;
  onDeleteSaved: (id: string) => void;
  onToggleFavourite: (templateId: string) => void;
}

type Filter = Group | 'All' | 'Favourites';

/** Every design in a grid, in the manner of a gallery, with the user's own saved designs above it. */
export function TemplatesPage({ profile, config, designs, prefs, onUse, onUseSaved, onDeleteSaved, onToggleFavourite }: Props) {
  const [filter, setFilter] = useState<Filter>('All');
  const shown = profile ?? sampleProfile();
  const sample = profile === null;

  const thumbs = useMemo(
    () => {
      // A design in the grid is shown as it is, without the changes being tried in the Studio.
      const { custom: _custom, ...plain } = config;
      return thumbnails(shown, plain);
    },
    [shown, config.blocks, config.text],
  );
  const savedThumbs = useMemo(
    () => designs.map((d) => thumbnailFor(shown, { ...d.config, username: shown.login, text: {} })),
    [designs, shown],
  );

  const visible = templates.filter((t) => (filter === 'All' ? true : filter === 'Favourites' ? isFavourite(prefs, t.id) : groupOf(t.id) === filter));
  const favourites = prefs.favourites.flatMap((id) => getTemplate(id) ?? []);
  const recent = prefs.recent.flatMap((id) => getTemplate(id) ?? []);

  const card = (template: (typeof templates)[number], keyPrefix = '') => (
    <DesignCard
      key={`${keyPrefix}${template.id}`}
      name={template.name}
      tag={groupOf(template.id)}
      description={template.description}
      thumb={thumbs.get(template.id) ?? null}
      selected={config.template === template.id}
      onUse={() => onUse(template.id)}
      favourite={{ on: isFavourite(prefs, template.id), onToggle: () => onToggleFavourite(template.id) }}
    />
  );

  return (
    <div className="page">
      <header className="page-head">
        <h1>Templates</h1>
        <p>
          Every design, ready to use. Pick one to open it with your profile, then make it yours. Press the heart on a
          design to keep it handy.
          {sample && ' Shown here with sample data until you enter your username on the home page.'}
        </p>
      </header>

      {favourites.length > 0 && filter !== 'Favourites' && (
        <section aria-labelledby="favourites">
          <h2 id="favourites" className="section-title">
            Favourites <span>{favourites.length} saved in this browser</span>
          </h2>
          <ul className="design-grid">{favourites.map((t) => card(t, 'fav-'))}</ul>
        </section>
      )}

      {recent.length > 0 && (
        <section aria-labelledby="recent">
          <h2 id="recent" className="section-title">
            Recently used <span>your last {recent.length === 1 ? 'design' : `${recent.length} designs`}</span>
          </h2>
          <ul className="design-grid">{recent.map((t) => card(t, 'recent-'))}</ul>
        </section>
      )}

      {designs.length > 0 && (
        <section aria-labelledby="mine">
          <h2 id="mine" className="section-title">
            My designs <span>saved in this browser</span>
          </h2>
          <ul className="design-grid">
            {designs.map((design, i) => (
              <DesignCard
                key={design.id}
                name={design.name}
                tag={`Based on ${getTemplate(design.config.template)?.name ?? design.config.template}`}
                description="Your saved design."
                thumb={savedThumbs[i] ?? null}
                onUse={() => onUseSaved(design)}
                actionLabel="Open"
                extra={
                  <button type="button" className="link danger" onClick={() => onDeleteSaved(design.id)}>
                    Delete
                  </button>
                }
              />
            ))}
          </ul>
        </section>
      )}

      <h2 className="section-title">All designs</h2>
      <div className="filters" role="group" aria-label="Filter designs">
        {(['All', 'Favourites', ...GROUPS] as Filter[]).map((group) => (
          <button key={group} type="button" aria-pressed={filter === group} onClick={() => setFilter(group)}>
            {group === 'Favourites' ? `Favourites (${prefs.favourites.length})` : group}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="notice">No favourites yet. Press the heart on any design and it will appear here.</p>
      ) : (
        <ul className="design-grid">{visible.map((t) => card(t))}</ul>
      )}
      <p className="hint">
        Want your own? Open the <a href="#/studio">Studio</a> to change the colours, fonts, panels and game of any design.
      </p>
    </div>
  );
}
