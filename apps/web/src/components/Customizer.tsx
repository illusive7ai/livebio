import { AUTHOR, BLOCK_IDS, THEME_MODES, type BlockId, type Config, type ThemeMode } from '@livebio/core';

interface Props {
  config: Config;
  onChange: (config: Config) => void;
  /** Whether contribution data was available for this preview. */
  hasActivity: boolean;
}

const BLOCK_LABELS: Record<BlockId, string> = {
  stats: 'Stats',
  activity: 'Activity (contribution graph and streaks)',
  languages: 'Languages',
  projects: 'Top projects',
};

const THEME_LABELS: Record<ThemeMode, string> = {
  auto: 'Match the viewer’s GitHub theme',
  dark: 'Always dark',
  light: 'Always light',
};

export function Customizer({ config, onChange, hasActivity }: Props) {
  const setText = (key: 'headline' | 'bio', value: string) => {
    const text = { ...config.text };
    if (value.trim()) text[key] = value;
    else delete text[key];
    onChange({ ...config, text });
  };

  const toggleBlock = (block: BlockId) => {
    const blocks = config.blocks.includes(block)
      ? config.blocks.filter((b) => b !== block)
      : BLOCK_IDS.filter((b) => b === block || config.blocks.includes(b));
    onChange({ ...config, blocks });
  };

  return (
    <section className="panel">
      <h2>Make it yours</h2>

      <label className="stack">
        <span>Headline</span>
        <input
          value={config.text.headline ?? ''}
          maxLength={200}
          placeholder="Leave empty to skip it"
          onChange={(event) => setText('headline', event.target.value)}
        />
      </label>

      <label className="stack">
        <span>Bio</span>
        <textarea
          rows={3}
          value={config.text.bio ?? ''}
          maxLength={200}
          placeholder="Leave empty to use your GitHub bio"
          onChange={(event) => setText('bio', event.target.value)}
        />
      </label>

      <fieldset>
        <legend>Sections</legend>
        {BLOCK_IDS.map((block) => (
          <label className="check" key={block}>
            <input type="checkbox" checked={config.blocks.includes(block)} onChange={() => toggleBlock(block)} />
            {BLOCK_LABELS[block]}
          </label>
        ))}
        {config.blocks.includes('activity') && !hasActivity && (
          <p className="hint">
            The activity section is not in this preview. It appears in your profile after the first automatic
            update, because GitHub only shares contribution data with a token.
          </p>
        )}
      </fieldset>

      <label className="stack">
        <span>Colours</span>
        <select value={config.theme} onChange={(event) => onChange({ ...config, theme: event.target.value as ThemeMode })}>
          {THEME_MODES.map((mode) => (
            <option key={mode} value={mode}>
              {THEME_LABELS[mode]}
            </option>
          ))}
        </select>
      </label>

      <label className="check">
        <input type="checkbox" checked={config.motion} onChange={(event) => onChange({ ...config, motion: event.target.checked })} />
        Animate the design
      </label>

      <label className="check">
        <input type="checkbox" checked={config.credit} onChange={(event) => onChange({ ...config, credit: event.target.checked })} />
        <span>
          Show “Made with livebio by {AUTHOR}”
          <small>A small line under your profile. It helps the project, and you can switch it off at any time.</small>
        </span>
      </label>
    </section>
  );
}
