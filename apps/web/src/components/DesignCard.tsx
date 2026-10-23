import type { ReactNode } from 'react';

interface Props {
  name: string;
  tag: string;
  description: string;
  thumb: string | null;
  selected?: boolean;
  onUse: () => void;
  actionLabel?: string;
  extra?: ReactNode;
}

/** One design as a card: picture, name, a short tag and a line about it. Used on the Templates page. */
export function DesignCard({ name, tag, description, thumb, selected, onUse, actionLabel = 'Use this design', extra }: Props) {
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
      {extra && <div className="design-extra">{extra}</div>}
    </li>
  );
}
