import { useMemo, useRef, useState } from 'react';
import { ConfigError, configToYaml, parseConfigYaml, renderProfile, templates, type Config, type Profile } from '@livebio/core';
import { Customizer } from '../components/Customizer';
import { PreviewPane } from '../components/PreviewPane';
import { StyleControls } from '../components/StyleControls';
import { sampleProfile } from '../lib/catalog';
import { downloadText } from '../lib/export';
import { designFields, type SavedDesign } from '../lib/saved';

interface Props {
  profile: Profile | null;
  config: Config;
  onChange: (config: Config) => void;
  designs: SavedDesign[];
  onSave: (name: string, config: Config) => boolean;
}

/** Where a design is made: choose a base, change its colour, panels and game, then save or export it. */
export function StudioPage({ profile, config, onChange, designs, onSave }: Props) {
  const shown = profile ?? sampleProfile();
  const sample = profile === null;
  const [name, setName] = useState('');
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const output = useMemo(() => renderProfile(shown, config), [shown, config]);
  const base = templates.find((t) => t.id === config.template);

  const save = () => {
    const title = name.trim() || `My ${base?.name ?? 'design'}`;
    const stored = onSave(title, config);
    setMessage(
      stored
        ? { kind: 'ok', text: `Saved as “${title}”. Find it under My designs on the Templates page.` }
        : { kind: 'error', text: 'Your browser would not store it, for example in a private window. Use Export instead.' },
    );
    if (stored) setName('');
  };

  const importFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const imported = parseConfigYaml(await file.text());
      onChange({ ...config, ...designFields(imported), text: imported.text, username: config.username });
      setMessage({ kind: 'ok', text: 'Imported. Your design is in the preview.' });
    } catch (error) {
      setMessage({
        kind: 'error',
        text: error instanceof ConfigError ? error.message : 'That file could not be read as a livebio.yml.',
      });
    }
    if (fileInput.current) fileInput.current.value = '';
  };

  return (
    <div className="page">
      <header className="page-head">
        <h1>Studio</h1>
        <p>
          Start from any design and make it yours: its colour, the look of the city and game panels, and which game
          plays. The preview updates as you go.
        </p>
      </header>

      {sample && (
        <p className="notice">
          Previewing with sample data. Enter your username on the <a href="#/">home page</a> to see your own profile
          here.
        </p>
      )}

      <div className="workspace">
        <aside className="controls">
          <section className="panel">
            <h2>Start from</h2>
            <label className="stack">
              <span className="visually-hidden">Base design</span>
              <select value={config.template} onChange={(event) => onChange({ ...config, template: event.target.value })}>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </label>
            {base && <p className="hint">{base.description}</p>}
          </section>

          <StyleControls config={config} onChange={onChange} />
          <Customizer config={config} onChange={onChange} hasActivity={Boolean(shown.contributions)} />

          <section className="panel">
            <h2>Keep it</h2>
            <label className="stack">
              <span>Name</span>
              <input
                value={name}
                maxLength={60}
                placeholder={`My ${base?.name ?? 'design'}`}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
            <div className="row">
              <button type="button" className="primary" onClick={save}>
                Save to this browser
              </button>
              <button type="button" onClick={() => downloadText('livebio.yml', configToYaml(config))}>
                Export livebio.yml
              </button>
              <button type="button" onClick={() => fileInput.current?.click()}>
                Import
              </button>
              <input
                ref={fileInput}
                type="file"
                accept=".yml,.yaml,text/yaml"
                hidden
                onChange={(event) => void importFile(event.target.files?.[0])}
              />
            </div>
            {message && (
              <p className={message.kind === 'error' ? 'error' : 'hint'} role={message.kind === 'error' ? 'alert' : 'status'}>
                {message.text}
              </p>
            )}
            <p className="hint">
              {designs.length === 0 ? 'Nothing saved yet.' : `${designs.length} saved in this browser.`} Saved designs stay
              on this device only. To use one on GitHub, export <code>livebio.yml</code>, or download the whole
              profile from the home page.
            </p>
          </section>
        </aside>

        <PreviewPane output={output} config={config} profile={shown} sample={sample} />
      </div>
    </div>
  );
}
