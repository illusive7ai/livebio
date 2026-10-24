import { useMemo, useRef, useState } from 'react';
import { ConfigError, configToYaml, isFavourite, parseConfigYaml, renderProfile, templates, type Config, type Prefs, type Profile } from '@livebio/core';
import { Customizer } from '../components/Customizer';
import { HeartButton } from '../components/HeartButton';
import { PreviewPane } from '../components/PreviewPane';
import { ReadmeWindow } from '../components/ReadmeWindow';
import { StyleControls } from '../components/StyleControls';
import { TypographyControls } from '../components/TypographyControls';
import { sampleProfile } from '../lib/catalog';
import { downloadText } from '../lib/export';
import { designFields, type SavedDesign } from '../lib/saved';

interface Props {
  profile: Profile | null;
  config: Config;
  onChange: (config: Config) => void;
  designs: SavedDesign[];
  prefs: Prefs;
  onSave: (name: string, config: Config) => boolean;
  onToggleFavourite: (templateId: string) => void;
  /** Called when a design becomes the one being worked on, so it shows under Recently used. */
  onUsed: (templateId: string) => void;
}

type Mode = 'dark' | 'light';

/** Where a design is made: choose a base, change its colour, text, panels and game, then save or export it. */
export function StudioPage({ profile, config, onChange, designs, prefs, onSave, onToggleFavourite, onUsed }: Props) {
  const shown = profile ?? sampleProfile();
  const sample = profile === null;
  const [name, setName] = useState('');
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const [comparing, setComparing] = useState(false);
  const [otherKey, setOtherKey] = useState<string>(() => `t:${templates.find((t) => t.id !== config.template)?.id ?? config.template}`);
  const [sameStyle, setSameStyle] = useState(true);
  const [mode, setMode] = useState<Mode>('dark');

  const output = useMemo(() => renderProfile(shown, config), [shown, config]);
  const base = templates.find((t) => t.id === config.template);

  /** What the other side of the comparison is: a design with this one's settings, or one of the saved designs as saved. */
  const otherConfig = useMemo((): Config => {
    if (otherKey.startsWith('s:')) {
      const saved = designs.find((d) => d.id === otherKey.slice(2));
      if (saved) return { ...config, ...saved.config, username: config.username, text: config.text };
    }
    const id = otherKey.slice(2);
    const { custom: ownStyle, ...rest } = config;
    return sameStyle && ownStyle ? { ...rest, template: id, custom: ownStyle } : { ...rest, template: id };
  }, [otherKey, sameStyle, config, designs]);
  const otherOutput = useMemo(() => (comparing ? renderProfile(shown, otherConfig) : null), [comparing, shown, otherConfig]);
  const otherName = otherKey.startsWith('s:')
    ? (designs.find((d) => d.id === otherKey.slice(2))?.name ?? 'Saved design')
    : (templates.find((t) => t.id === otherKey.slice(2))?.name ?? 'Design');

  const choose = (next: Config) => {
    onChange(next);
    onUsed(next.template);
  };

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
          Start from any design and make it yours: its colour, fonts, text size, the look of the city and game panels,
          and which game plays. The preview updates as you go, and you can set two designs side by side.
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
            <div className="panel-head">
              <h2>Start from</h2>
              <HeartButton on={isFavourite(prefs, config.template)} name={base?.name ?? 'this design'} onToggle={() => onToggleFavourite(config.template)} />
            </div>
            <label className="stack">
              <span className="visually-hidden">Base design</span>
              <select
                value={config.template}
                onChange={(event) => {
                  onChange({ ...config, template: event.target.value });
                  onUsed(event.target.value);
                }}
              >
                {prefs.favourites.length > 0 && (
                  <optgroup label="Favourites">
                    {prefs.favourites.flatMap((id) => templates.find((t) => t.id === id) ?? []).map((template) => (
                      <option key={`fav-${template.id}`} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="All designs">
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </label>
            {base && <p className="hint">{base.description}</p>}
          </section>

          <section className="panel">
            <h2>Compare</h2>
            <p className="hint">Put two designs side by side with your own profile in them, then keep the one you like.</p>
            <button type="button" className={comparing ? 'primary' : ''} aria-pressed={comparing} onClick={() => setComparing(!comparing)}>
              {comparing ? 'Close the comparison' : 'Compare two designs'}
            </button>
            {comparing && (
              <>
                <label className="stack">
                  <span>Compare with</span>
                  <select value={otherKey} onChange={(event) => setOtherKey(event.target.value)}>
                    {designs.length > 0 && (
                      <optgroup label="My designs">
                        {designs.map((d) => (
                          <option key={d.id} value={`s:${d.id}`}>
                            {d.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {prefs.favourites.length > 0 && (
                      <optgroup label="Favourites">
                        {prefs.favourites.flatMap((id) => templates.find((t) => t.id === id) ?? []).map((t) => (
                          <option key={`cf-${t.id}`} value={`t:${t.id}`}>
                            {t.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    <optgroup label="All designs">
                      {templates.map((t) => (
                        <option key={t.id} value={`t:${t.id}`}>
                          {t.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </label>
                {!otherKey.startsWith('s:') && (
                  <label className="check">
                    <input type="checkbox" checked={sameStyle} onChange={() => setSameStyle(!sameStyle)} />
                    Use my colour, fonts and panels on both
                  </label>
                )}
              </>
            )}
          </section>

          <StyleControls config={config} onChange={onChange} />
          <TypographyControls config={config} onChange={onChange} />
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

        {comparing && otherOutput ? (
          <section className="preview compare" aria-label="Comparison">
            <div className="compare-bar">
              <strong>Side by side</strong>
              <button type="button" className="mode" onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}>
                Show in {mode === 'dark' ? 'light' : 'dark'} mode
              </button>
            </div>
            <div className="compare-grid">
              <div className="compare-side">
                <ReadmeWindow
                  output={output}
                  mode={mode}
                  title={`A · ${base?.name ?? 'Your design'}`}
                  actions={
                    <button type="button" className="mode" onClick={() => setComparing(false)}>
                      Keep A
                    </button>
                  }
                />
              </div>
              <div className="compare-side">
                <ReadmeWindow
                  output={otherOutput}
                  mode={mode}
                  title={`B · ${otherName}`}
                  actions={
                    <button
                      type="button"
                      className="mode"
                      onClick={() => {
                        choose(otherConfig);
                        setComparing(false);
                      }}
                    >
                      Keep B
                    </button>
                  }
                />
              </div>
            </div>
            <p className="hint">Both are drawn with {sample ? 'sample data' : `@${shown.login}’s data`}. Keeping one closes the comparison and opens it in the Studio.</p>
          </section>
        ) : (
          <PreviewPane output={output} config={config} profile={shown} sample={sample} />
        )}
      </div>
    </div>
  );
}
