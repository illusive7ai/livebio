import {
  FONT_CHOICES,
  FONT_LABELS,
  FONT_STACKS,
  TEXT_SIZE_MAX,
  TEXT_SIZE_MIN,
  contrastRatio,
  type Config,
  type CustomStyle,
  type FontChoice,
} from '@livebio/core';

interface Props {
  config: Config;
  onChange: (config: Config) => void;
}

/** GitHub's own page colours in dark and light mode, which a design's text sits on or close to. */
const DARK_PAGE = '#0d1117';
const LIGHT_PAGE = '#ffffff';
const FALLBACK_COLOUR = '#e6edf3';

function ratioText(colour: string, page: string): string {
  return contrastRatio(colour, page).toFixed(1);
}

/** The words, their colour and their size: the typeface, one colour for all text and a size from small to large. */
export function TypographyControls({ config, onChange }: Props) {
  const custom = config.custom ?? {};

  const update = (patch: Partial<CustomStyle>, remove: Array<keyof CustomStyle> = []) => {
    const next: CustomStyle = { ...custom, ...patch };
    for (const key of remove) delete next[key];
    const { custom: _old, ...rest } = config;
    onChange(Object.keys(next).length > 0 ? { ...rest, custom: next } : rest);
  };

  const size = custom.textSize ?? 100;
  const colour = custom.textColor;
  const weakOnDark = colour !== undefined && contrastRatio(colour, DARK_PAGE) < 3;
  const weakOnLight = colour !== undefined && contrastRatio(colour, LIGHT_PAGE) < 3;

  return (
    <section className="panel">
      <h2>Text</h2>

      <fieldset className="plain">
        <legend>Font</legend>
        <div className="font-grid">
          <button type="button" className={custom.font === undefined ? 'font-option on' : 'font-option'} aria-pressed={custom.font === undefined} onClick={() => update({}, ['font'])}>
            <span className="font-sample">Aa</span>
            <span className="font-name">Design’s own</span>
          </button>
          {FONT_CHOICES.map((font: FontChoice) => (
            <button
              key={font}
              type="button"
              className={custom.font === font ? 'font-option on' : 'font-option'}
              aria-pressed={custom.font === font}
              onClick={() => update({ font })}
            >
              <span className="font-sample" style={{ fontFamily: FONT_STACKS[font] }}>
                Aa
              </span>
              <span className="font-name">{FONT_LABELS[font]}</span>
            </button>
          ))}
        </div>
        <small className="muted-line">
          GitHub cannot load web fonts, so each choice uses fonts that already come with the reader’s device. It looks a
          little different on a phone, a Mac and a PC.
        </small>
      </fieldset>

      <div className="stack">
        <label htmlFor="text-colour">Text colour</label>
        <div className="colour-row">
          <input
            id="text-colour"
            type="color"
            value={colour ?? FALLBACK_COLOUR}
            onChange={(event) => update({ textColor: event.target.value.toLowerCase() })}
            aria-label="Pick a text colour"
          />
          <code>{colour ?? 'design’s own colours'}</code>
          {colour !== undefined && (
            <button type="button" className="link" onClick={() => update({}, ['textColor'])}>
              Use the design’s colours
            </button>
          )}
        </div>
        {colour !== undefined && (
          <small className={weakOnDark || weakOnLight ? 'error-line' : 'muted-line'} role={weakOnDark || weakOnLight ? 'alert' : undefined}>
            Readability on GitHub’s dark page: {ratioText(colour, DARK_PAGE)}:1. On its light page: {ratioText(colour, LIGHT_PAGE)}:1.
            {weakOnDark && ' Hard to read in dark mode.'}
            {weakOnLight && ' Hard to read in light mode.'}
            {!weakOnDark && !weakOnLight && ' Good in both.'} One colour is used for every word, including text drawn on a badge, so check the
            preview in both modes.
          </small>
        )}
      </div>

      <div className="stack">
        <label htmlFor="text-size">Text size</label>
        <input
          id="text-size"
          type="range"
          min={TEXT_SIZE_MIN}
          max={TEXT_SIZE_MAX}
          step={5}
          value={size}
          onChange={(event) => (Number(event.target.value) === 100 ? update({}, ['textSize']) : update({ textSize: Number(event.target.value) }))}
          aria-valuetext={`${size} percent`}
        />
        <small className="muted-line">
          {size}% of the design’s own size.{' '}
          {size > 110 && 'Large text can run past the edge of a card; check the preview. '}
          {custom.textSize !== undefined && (
            <button type="button" className="link" onClick={() => update({}, ['textSize'])}>
              Back to 100%
            </button>
          )}
        </small>
      </div>
    </section>
  );
}
