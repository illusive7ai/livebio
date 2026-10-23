import { AUTHOR, BLOCK_IDS, THEME_MODES, type BlockId, type Config, type ThemeMode } from '@livebio/core';

interface Props {
  config: Config;
  onChange: (config: Config) => void;
  /** Whether contribution data was available for this preview. */
  hasActivity: boolean;
  /** Leave out the panel frame and title, for use inside another panel. */
  bare?: boolean;
}

const BLOCK_LABELS: Record<BlockId, string> = {
  stats: 'Stats',
  activity: 'Activity (contribution graph and streaks)',
  city: 'Contribution city (live, from your real activity)',
  game: 'Live game (an automated snake or chess match)',
  languages: 'Languages',
  projects: 'Top projects',
};

const THEME_LABELS: Record<ThemeMode, string> = {
  auto: 'Match the viewer’s GitHub theme',
  dark: 'Always dark',
  light: 'Always light',
};

export function Customizer({ config, onChange, hasActivity, bare = false }: Props) {
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
    <section className={bare ? "bare" : "panel"}>
      {!bare && <h2>Make it yours</h2>}

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
        {(config.blocks.includes('activity') || config.blocks.includes('city') || config.blocks.includes('game')) &&
          !hasActivity && (
            <p className="hint">
              Your contribution city, and the snake when a design has one, are not drawn in this preview. They appear
              in your profile after the first automatic update, because GitHub only shares contribution data with a
              token. Chess games do not need it.
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
          Show the “livebio by {AUTHOR}” credit
          <small>A small glitching line under your profile. It helps the project, and you can switch it off at any time.</small>
        </span>
      </label>
    </section>
  );
}
