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
import { Glitch } from './components/Glitch';
import { PreviewPane } from './components/PreviewPane';
import { ProfileStrip } from './components/ProfileStrip';
import { TemplatePicker } from './components/TemplatePicker';
import { Testimonials } from './components/Testimonials';
import { loadAvatar } from './lib/avatar';
import { loadContributions } from './lib/contributions';
import { describeError } from './lib/errors';
import { go, routeHref, useRoute, type Route } from './lib/route';
import { designFields, loadDesigns, newId, storeDesigns, type SavedDesign } from './lib/saved';
import { StudioPage } from './pages/StudioPage';
import { TemplatesPage } from './pages/TemplatesPage';

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

const NAV: Array<[Route, string]> = [
  ['home', 'Create'],
  ['templates', 'Templates'],
  ['studio', 'Studio'],
];

export function App() {
  const route = useRoute();
  const [input, setInput] = useState(initialUsername);
  const [status, setStatus] = useState<Status>({ state: 'idle' });
  const [config, setConfig] = useState<Config>(() => defaultConfig(initialUsername() || 'octocat', initialTemplate()));
  const [designs, setDesigns] = useState<SavedDesign[]>(loadDesigns);

  const load = useCallback(async (name: string) => {
    const username = name.trim().replace(/^@/, '');
    if (!isValidUsername(username)) {
      setStatus({ state: 'error', message: describeError(new Error('invalid'), username) });
      return;
    }
    setStatus({ state: 'loading' });
    try {
      const loaded = await fetchProfile(username);
      const [avatar, contributions] = await Promise.all([
        loadAvatar(loaded.avatarUrl),
        loadContributions(loaded.login),
      ]);
      const profile: Profile = {
        ...loaded,
        ...(avatar ? { avatar } : {}),
        ...(contributions ? { contributions } : {}),
      };
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
  const chosen = getTemplate(config.template);

  const pick = (template: string) => {
    // A stock design comes as it is, without changes left over from another one.
    const { custom: _custom, ...rest } = config;
    setConfig({ ...rest, template });
    updateUrl('template', template);
  };

  const saveDesign = (name: string, from: Config): boolean => {
    const next = [{ id: newId(), name, config: designFields(from) }, ...designs];
    const stored = storeDesigns(next);
    if (stored) setDesigns(next);
    return stored;
  };

  const deleteDesign = (id: string) => {
    const next = designs.filter((d) => d.id !== id);
    storeDesigns(next);
    setDesigns(next);
  };

  return (
    <>
      <header className="top">
        <a className="brand" href={routeHref('home')}>
          live<span>bio</span>
        </a>
        <nav aria-label="Main">
          {NAV.map(([target, label]) => (
            <a key={target} href={routeHref(target)} aria-current={route === target ? 'page' : undefined}>
              {label}
            </a>
          ))}
        </nav>
        <a className="top-link" href={REPO_URL} target="_blank" rel="noreferrer">
          Star on GitHub
        </a>
      </header>

      <main>
        {route === 'templates' && (
          <TemplatesPage
            profile={profile}
            config={config}
            designs={designs}
            onUse={(template) => {
              pick(template);
              go('home');
            }}
            onUseSaved={(design) => {
              setConfig({ ...config, ...design.config });
              go('studio');
            }}
            onDeleteSaved={deleteDesign}
          />
        )}

        {route === 'studio' && (
          <StudioPage profile={profile} config={config} onChange={setConfig} designs={designs} onSave={saveDesign} />
        )}

        {route === 'home' && (
          <>
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
                <small>
                  Uses public GitHub data only.
                  {chosen && !profile && ` Design chosen: ${chosen.name}.`}
                </small>
              </form>
              {status.state === 'error' && (
                <p className="error" role="alert">
                  {status.message}
                </p>
              )}
            </section>

            {!profile && <Testimonials />}

            {profile && output && (
              <>
                <ProfileStrip profile={profile} />
                <div className="workspace">
                  <aside className="controls">
                    <TemplatePicker profile={profile} config={config} onPick={pick} />
                    <details className="panel fold">
                      <summary>Make it yours</summary>
                      <Customizer config={config} onChange={setConfig} hasActivity={Boolean(profile.contributions)} bare />
                      <p className="hint">
                        Want to change colours, panels or the game? Open the <a href={routeHref('studio')}>Studio</a>.
                      </p>
                    </details>
                  </aside>
                  <PreviewPane output={output} config={config} profile={profile} />
                </div>
                <Testimonials />
              </>
            )}
          </>
        )}
      </main>

      <footer className="bottom">
        <p className="credit-line">
          <a href={REPO_URL} target="_blank" rel="noreferrer">
            <Glitch text="livebio" />
          </a>
          {' '}
          <Glitch text="by" offset={7} />
          {' '}
          <a href={AUTHOR_URL} target="_blank" rel="noreferrer">
            <Glitch text={AUTHOR} offset={10} />
          </a>
        </p>
        <span>Free and open source under the MIT license.</span>
      </footer>
    </>
  );
}
