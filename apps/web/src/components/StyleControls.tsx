import { PRESETS, type Companion, type Config, type CustomStyle, type Preset } from '@livebio/core';

interface Props {
  config: Config;
  onChange: (config: Config) => void;
}

const LOOK_LABELS: Record<Preset, string> = {
  aurora: 'Aurora glass',
  sunrise: 'Sunrise',
  night: 'Night city',
  space: 'Deep space',
  arcade: 'Arcade',
  chalk: 'Chalkboard',
  editor: 'Code editor',
  blueprint: 'Blueprint',
  paper: 'Paper',
  terminal: 'Green terminal',
  glow: 'Neon glow',
  plain: 'Plain',
};

const GAMES: Array<[Companion | 'default', string]> = [
  ['default', 'Design default'],
  ['snake', 'Snake'],
  ['chess', 'Chess'],
  ['none', 'No game'],
];

/** The changes a person can make to any design: its colour, the look of its live panels, and its game. */
export function StyleControls({ config, onChange }: Props) {
  const custom = config.custom ?? {};

  const update = (patch: Partial<CustomStyle>, remove: Array<keyof CustomStyle> = []) => {
    const next: CustomStyle = { ...custom, ...patch };
    for (const key of remove) delete next[key];
    const { custom: _old, ...rest } = config;
    onChange(Object.keys(next).length > 0 ? { ...rest, custom: next } : rest);
  };

  const hue = custom.hue ?? 160;
  const game = custom.companion ?? 'default';

  return (
    <section className="panel">
      <h2>Style</h2>

      <div className="stack">
        <label htmlFor="hue">Accent colour</label>
        <input
          id="hue"
          className="hue"
          type="range"
          min={0}
          max={359}
          value={hue}
          onChange={(event) => update({ hue: Number(event.target.value) })}
          aria-valuetext={custom.hue === undefined ? 'Taken from your profile picture' : `Hue ${hue} degrees`}
        />
        <small className="muted-line">
          {custom.hue === undefined ? 'Taken from your profile picture. Drag to choose your own.' : `Hue ${hue}.`}{' '}
          {custom.hue !== undefined && (
            <button type="button" className="link" onClick={() => update({}, ['hue'])}>
              Use my picture’s colour
            </button>
          )}
        </small>
      </div>

      <label className="stack">
        <span>Look of the city and game panels</span>
        <select
          value={custom.look ?? ''}
          onChange={(event) => (event.target.value ? update({ look: event.target.value as Preset }) : update({}, ['look']))}
        >
          <option value="">Design default</option>
          {PRESETS.map((preset) => (
            <option key={preset} value={preset}>
              {LOOK_LABELS[preset]}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="plain">
        <legend>Live game</legend>
        <div className="segmented">
          {GAMES.map(([value, label]) => (
            <label key={value} className={game === value ? 'on' : ''}>
              <input
                type="radio"
                name="game"
                checked={game === value}
                onChange={() => (value === 'default' ? update({}, ['companion']) : update({ companion: value }))}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
    </section>
  );
}
