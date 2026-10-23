import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AUTHOR,
  AUTHOR_URL,
  REPO_URL,
  defaultConfig,
  fetchProfile,
  getTemplate,
  isValidUsername,
  renderProfile,
  type Config,
  type Profile,
} from '@livebio/core';
import { Customizer } from './components/Customizer';
import { Gallery } from './components/Gallery';
import { PreviewPane } from './components/PreviewPane';
import { ProfileStrip } from './components/ProfileStrip';
import { loadAvatar } from './lib/avatar';
import { describeError } from './lib/errors';

type Status =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'error'; message: string }
  | { state: 'ready'; profile: Profile };

function initialUsername(): string {
  try {
    return new URLSearchParams(window.location.search).get('user')?.trim() ?? '';
  } catch {
    return '';
  }
}

/** A shared link can open a specific design with ?template=<id>. */
function initialTemplate(): string {
  try {
    const id = new URLSearchParams(window.location.search).get('template');
    return id && getTemplate(id) ? id : 'showcase';
  } catch {
    return 'showcase';
  }
}

function updateUrl(key: string, value: string): void {
  try {
    const url = new URL(window.location.href);
    url.searchParams.set(key, value);
    window.history.replaceState(null, '', url);
  } catch {
    // The address bar is only a convenience, so ignore failures.
  }
}

export function App() {
  const [input, setInput] = useState(initialUsername);
  const [status, setStatus] = useState<Status>({ state: 'idle' });
  const [config, setConfig] = useState<Config>(() => defaultConfig(initialUsername() || 'octocat', initialTemplate()));

  const load = useCallback(async (name: string) => {
    const username = name.trim().replace(/^@/, '');
    if (!isValidUsername(username)) {
      setStatus({ state: 'error', message: describeError(new Error('invalid'), username) });
      return;
    }
    setStatus({ state: 'loading' });
    try {
      const loaded = await fetchProfile(username);
      const avatar = await loadAvatar(loaded.avatarUrl);
      const profile: Profile = avatar ? { ...loaded, avatar } : loaded;
      setConfig((prev) => ({ ...prev, username: profile.login }));
      setStatus({ state: 'ready', profile });
      updateUrl('user', profile.login);
    } catch (error) {
      setStatus({ state: 'error', message: describeError(error, username) });
    }
  }, []);

  useEffect(() => {
    const name = initialUsername();
    if (name) void load(name);
  }, [load]);

  const profile = status.state === 'ready' ? status.profile : null;
  const output = useMemo(() => (profile ? renderProfile(profile, config) : null), [profile, config]);

  return (
    <>
      <header className="top">
        <a className="brand" href="./">
          live<span>bio</span>
        </a>
        <a className="top-link" href={REPO_URL} target="_blank" rel="noreferrer">
          Star on GitHub
        </a>
      </header>

      <main>
        <section className="hero">
          <h1>A GitHub profile that keeps itself up to date.</h1>
          <p>
            Type your username, pick a design, make it yours. Free and open source. No sign-in, nothing stored.
          </p>
          <form
            className="username-form"
            onSubmit={(event) => {
              event.preventDefault();
              void load(input);
            }}
          >
            <label htmlFor="username">GitHub username</label>
            <div className="field">
              <span aria-hidden="true">@</span>
              <input
                id="username"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="octocat"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
              />
              <button type="submit" disabled={status.state === 'loading' || !input.trim()}>
                {status.state === 'loading' ? 'Loading…' : 'Preview designs'}
              </button>
            </div>
            <small>Uses public GitHub data only.</small>
          </form>
          {status.state === 'error' && (
            <p className="error" role="alert">
              {status.message}
            </p>
          )}
        </section>

        {profile && output && (
          <>
            <ProfileStrip profile={profile} />
            <div className="workspace">
              <aside className="controls">
                <Gallery
                  profile={profile}
                  config={config}
                  onPick={(template) => {
                    setConfig({ ...config, template });
                    updateUrl('template', template);
                  }}
                />
                <Customizer config={config} onChange={setConfig} />
              </aside>
              <PreviewPane output={output} config={config} profile={profile} />
            </div>
          </>
        )}
      </main>

      <footer className="bottom">
        <span>
          Open source under the MIT license. Built by{' '}
          <a href={AUTHOR_URL} target="_blank" rel="noreferrer">
            {AUTHOR}
          </a>
          .
        </span>
      </footer>
    </>
  );
}
