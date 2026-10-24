import type { ReactNode } from 'react';
import { HeartButton } from './HeartButton';

interface Props {
  name: string;
  tag: string;
  description: string;
  thumb: string | null;
  selected?: boolean;
  onUse: () => void;
  actionLabel?: string;
  extra?: ReactNode;
  /** Shows a heart on the card. Left out for designs that cannot be liked, such as a saved one. */
  favourite?: { on: boolean; onToggle: () => void };
}

/** One design as a card: picture, name, a short tag and a line about it. Used on the Templates page. */
export function DesignCard({ name, tag, description, thumb, selected, onUse, actionLabel = 'Use this design', extra, favourite }: Props) {
  return (
    <li className={selected ? 'design selected' : 'design'}>
      <button type="button" className="design-main" onClick={onUse} aria-label={`${actionLabel}: ${name}`}>
        <span className="design-thumb">
          {thumb ? (
            <img src={thumb} alt="" loading="lazy" />
          ) : (
            <span className="paper" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </span>
          )}
        </span>
        <strong className="design-name">{name}</strong>
        <span className="design-tag">{tag}</span>
        <span className="design-desc">{description}</span>
      </button>
      {favourite && <HeartButton on={favourite.on} name={name} onToggle={favourite.onToggle} className="on-card" />}
      {extra && <div className="design-extra">{extra}</div>}
    </li>
  );
}
