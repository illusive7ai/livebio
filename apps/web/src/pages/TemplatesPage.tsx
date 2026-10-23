import { useMemo, useState } from 'react';
import { getTemplate, templates, type Config, type Profile } from '@livebio/core';
import { DesignCard } from '../components/DesignCard';
import { GROUPS, groupOf, sampleProfile, type Group } from '../lib/catalog';
import type { SavedDesign } from '../lib/saved';
import { thumbnailFor, thumbnails } from '../lib/thumbs';

interface Props {
  profile: Profile | null;
  config: Config;
  designs: SavedDesign[];
  onUse: (templateId: string) => void;
  onUseSaved: (design: SavedDesign) => void;
  onDeleteSaved: (id: string) => void;
}

/** Every design in a grid, in the manner of a gallery, with the user's own saved designs above it. */
export function TemplatesPage({ profile, config, designs, onUse, onUseSaved, onDeleteSaved }: Props) {
  const [filter, setFilter] = useState<Group | 'All'>('All');
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

  const visible = templates.filter((t) => filter === 'All' || groupOf(t.id) === filter);

  return (
    <div className="page">
      <header className="page-head">
        <h1>Templates</h1>
        <p>
          Every design, ready to use. Pick one to open it with your profile, then make it yours.
          {sample && ' Shown here with sample data until you enter your username on the home page.'}
        </p>
      </header>

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

      <div className="filters" role="group" aria-label="Filter designs">
        {(['All', ...GROUPS] as Array<Group | 'All'>).map((group) => (
          <button key={group} type="button" aria-pressed={filter === group} onClick={() => setFilter(group)}>
            {group}
          </button>
        ))}
      </div>

      <ul className="design-grid">
        {visible.map((template) => (
          <DesignCard
            key={template.id}
            name={template.name}
            tag={groupOf(template.id)}
            description={template.description}
            thumb={thumbs.get(template.id) ?? null}
            selected={config.template === template.id}
            onUse={() => onUse(template.id)}
          />
        ))}
      </ul>
      <p className="hint">
        Want your own? Open the <a href="#/studio">Studio</a> to change the colours, panels and game of any design.
      </p>
    </div>
  );
}
