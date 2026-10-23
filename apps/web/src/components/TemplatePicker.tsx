import { useMemo } from 'react';
import { templates, type Config, type Profile } from '@livebio/core';
import { GROUPS, groupOf } from '../lib/catalog';
import { thumbnails } from '../lib/thumbs';

interface Props {
  profile: Profile;
  config: Config;
  onPick: (templateId: string) => void;
}

/** All designs in one compact area, grouped, so the preview can stay in view beside it. */
export function TemplatePicker({ profile, config, onPick }: Props) {
  const thumbs = useMemo(
    () => thumbnails(profile, config),
    // Thumbnails follow the profile and the user's own choices, not which design is selected.
    [profile, config.blocks, config.custom, config.text],
  );
  const current = templates.find((t) => t.id === config.template);

  return (
    <section className="panel picker">
      <div className="panel-head">
        <h2>Design</h2>
        <a href="#/templates">See them all</a>
      </div>
      {GROUPS.map((group) => {
        const inGroup = templates.filter((t) => groupOf(t.id) === group);
        if (inGroup.length === 0) return null;
        return (
          <div key={group} className="picker-group">
            <h3>{group}</h3>
            <ul className="picker-grid">
              {inGroup.map((template) => {
                const src = thumbs.get(template.id);
                const selected = config.template === template.id;
                return (
                  <li key={template.id}>
                    <button
                      type="button"
                      className={selected ? 'mini selected' : 'mini'}
                      aria-pressed={selected}
                      onClick={() => onPick(template.id)}
                    >
                      <span className="mini-thumb">
                        {src ? (
                          <img src={src} alt="" loading="lazy" />
                        ) : (
                          <span className="paper" aria-hidden="true">
                            <i />
                            <i />
                            <i />
                          </span>
                        )}
                      </span>
                      <span className="mini-name">{template.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
      {current && <p className="picker-note">{current.description}</p>}
    </section>
  );
}
