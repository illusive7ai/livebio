import { renderProfile, templates, type Config, type Profile } from '@livebio/core';

interface Props {
  profile: Profile;
  config: Config;
  onPick: (templateId: string) => void;
}

function dataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function Gallery({ profile, config, onPick }: Props) {
  return (
    <section className="panel">
      <h2>Choose a design</h2>
      <ul className="gallery">
        {templates.map((template) => {
          // Thumbnails show the finished design, so animation is off here.
          const output = renderProfile(profile, { ...config, template: template.id, motion: false });
          const asset = output.assets.find((a) => a.path.endsWith('-dark.svg')) ?? output.assets[0];
          const selected = config.template === template.id;
          return (
            <li key={template.id}>
              <button
                type="button"
                className={selected ? 'card selected' : 'card'}
                aria-pressed={selected}
                onClick={() => onPick(template.id)}
              >
                <span className="thumb">
                  {asset ? (
                    <img src={dataUri(asset.content)} alt="" />
                  ) : (
                    <span className="paper" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                      <i />
                    </span>
                  )}
                </span>
                <span className="card-name">{template.name}</span>
                <span className="card-desc">{template.description}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="hint">More designs are on the way. Templates are plain files, so anyone can add one.</p>
    </section>
  );
}
