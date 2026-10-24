import { useState } from 'react';

interface Props {
  initial?: string;
  busy: boolean;
  button: string;
  onSubmit: (username: string) => void;
}

/** A GitHub username box. Used on pages that need a profile loaded, other than the home page. */
export function UsernameForm({ initial = '', busy, button, onSubmit }: Props) {
  const [input, setInput] = useState(initial);
  return (
    <form
      className="username-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(input);
      }}
    >
      <label htmlFor="username-wrapped">GitHub username</label>
      <div className="field">
        <span aria-hidden="true">@</span>
        <input
          id="username-wrapped"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="octocat"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        <button type="submit" disabled={busy || !input.trim()}>
          {busy ? 'Loading…' : button}
        </button>
      </div>
      <small>Uses public GitHub data only.</small>
    </form>
  );
}
