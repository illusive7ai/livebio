import { useMemo } from 'react';
import { getTemplate, isFavourite, templates, type Config, type Prefs, type Profile } from '@livebio/core';
import { GROUPS, groupOf } from '../lib/catalog';
import { thumbnails } from '../lib/thumbs';
import { HeartButton } from './HeartButton';

interface Props {
  profile: Profile;
  config: Config;
  prefs: Prefs;
  onPick: (templateId: string) => void;
  onToggleFavourite: (templateId: string) => void;
}

/** All designs in one compact area, grouped, so the preview can stay in view beside it. */
export function TemplatePicker({ profile, config, prefs, onPick, onToggleFavourite }: Props) {
  const thumbs = useMemo(
    () => thumbnails(profile, config),
    // Thumbnails follow the profile and the user's own choices, not which design is selected.
    [profile, config.blocks, config.custom, config.text],
  );
  const current = templates.find((t) => t.id === config.template);
  const favourites = prefs.favourites.flatMap((id) => getTemplate(id) ?? []);
  const recent = prefs.recent.flatMap((id) => getTemplate(id) ?? []).slice(0, 6);

  const mini = (template: (typeof templates)[number], keyPrefix = '') => {
    const src = thumbs.get(template.id);
    const selected = config.template === template.id;
    return (
      <li key={`${keyPrefix}${template.id}`} className="mini-item">
        <button type="button" className={selected ? 'mini selected' : 'mini'} aria-pressed={selected} onClick={() => onPick(template.id)}>
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
        <HeartButton on={isFavourite(prefs, template.id)} name={template.name} onToggle={() => onToggleFavourite(template.id)} className="on-mini" />
      </li>
    );
  };

  return (
    <section className="panel picker">
      <div className="panel-head">
        <h2>Design</h2>
        <a href="#/templates">See them all</a>
      </div>

      {favourites.length > 0 && (
        <div className="picker-group">
          <h3>Favourites</h3>
          <ul className="picker-grid">{favourites.map((t) => mini(t, 'fav-'))}</ul>
        </div>
      )}
      {recent.length > 0 && (
        <div className="picker-group">
          <h3>Recently used</h3>
          <ul className="picker-grid">{recent.map((t) => mini(t, 'recent-'))}</ul>
        </div>
      )}

      {GROUPS.map((group) => {
        const inGroup = templates.filter((t) => groupOf(t.id) === group);
        if (inGroup.length === 0) return null;
        return (
          <div key={group} className="picker-group">
            <h3>{group}</h3>
            <ul className="picker-grid">{inGroup.map((t) => mini(t))}</ul>
          </div>
        );
      })}
      {current && <p className="picker-note">{current.description}</p>}
    </section>
  );
}
