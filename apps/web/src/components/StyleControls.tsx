import { PRESETS, defaultCompanion, getTemplate, type Companion, type Config, type CustomStyle, type Preset } from '@livebio/core';

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

const GAMES: Array<[Companion, string, string]> = [
  ['chess', 'Chess', 'A famous game, replayed two moves a day'],
  ['snake', 'Snake', 'A snake that eats your active days'],
  ['none', 'No game', 'Only the contribution city'],
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
  const fallback: Companion = defaultCompanion(config.template) ?? 'none';
  const game: Companion = custom.companion ?? fallback;
  const doubled = config.template === 'snake' && game === 'snake';

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
        <legend>Contribution city</legend>
        <div className="segmented">
          <label className={custom.timelapse ? '' : 'on'}>
            <input type="radio" name="city-mode" checked={!custom.timelapse} onChange={() => update({}, ['timelapse'])} />
            Finished city
          </label>
          <label className={custom.timelapse ? 'on' : ''}>
            <input type="radio" name="city-mode" checked={Boolean(custom.timelapse)} onChange={() => update({ timelapse: true })} />
            Time-lapse
          </label>
        </div>
        <small className="muted-line">
          {custom.timelapse
            ? 'The city grows week by week through your year, with a running total, then holds and starts again. Every building is a real active day.'
            : 'Your whole year at once, one building for every active day.'}{' '}
          {config.template === 'city' && 'The Contribution city design draws its own city, so the time-lapse does not apply to it.'}
          {!config.blocks.includes('city') && 'The city is switched off for this design. Tick Contribution city under Sections to see it.'}
        </small>
      </fieldset>

      <fieldset className="plain">
        <legend>Game under the card</legend>
        <div className="segmented">
          {GAMES.map(([value, label, about]) => (
            <label key={value} className={game === value ? 'on' : ''} title={about}>
              <input
                type="radio"
                name="game"
                checked={game === value}
                onChange={() => (value === fallback ? update({}, ['companion']) : update({ companion: value }))}
              />
              {label}
              {value === fallback && <span className="muted-line"> (default)</span>}
            </label>
          ))}
        </div>
        <small className="muted-line">
          {GAMES.find(([value]) => value === game)?.[2]}.
          {game !== 'none' && ' It plays itself from your real activity.'}
          {config.template === 'snake' && game === 'none' && ' The Snake trail design is already a snake game.'}
          {doubled && ' The Snake trail design is already a snake game, so this adds a second one under it.'} Any design can carry either game.
        </small>
      </fieldset>
    </section>
  );
}
