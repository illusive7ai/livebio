interface Props {
  on: boolean;
  name: string;
  onToggle: () => void;
  className?: string;
}

/** Likes a design. The state is kept in the browser, so it works without an account. */
export function HeartButton({ on, name, onToggle, className = '' }: Props) {
  return (
    <button
      type="button"
      className={`heart ${on ? 'on' : ''} ${className}`.trim()}
      aria-pressed={on}
      aria-label={on ? `Remove ${name} from favourites` : `Add ${name} to favourites`}
      title={on ? 'Remove from favourites' : 'Add to favourites'}
      onClick={onToggle}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          d="M12 21s-7.5-4.6-9.6-9.3C.9 8.2 2.8 4.5 6.4 4.5c2 0 3.8 1.1 5.6 3.2 1.8-2.1 3.6-3.2 5.6-3.2 3.6 0 5.5 3.7 4 7.2C19.500 16.400 12 21 12 21z"
          fill={on ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
