# livebio

A GitHub profile README that keeps itself up to date. Open source, no sign-in, nothing stored.

**Built by [illusivehacks](https://github.com/illusive7ai).**

### [Try it: illusive7ai.github.io/livebio](https://illusive7ai.github.io/livebio/)

Type your GitHub username, pick a design, make it yours, and export. A small GitHub Action in your own profile repository then refreshes your stats every day, so your profile never goes stale and never depends on someone else's server.

> **Status: early.** The builder, the Action and two templates work. More templates are the next thing on the list. See the [roadmap](#roadmap).

## How it works

1. **Preview.** The builder reads your public GitHub data in the browser, with no login.
2. **Choose and customise.** Pick a template, edit the text, switch sections and colours on or off.
3. **Export.** Download a zip with your `README.md`, a `livebio.yml` config and a workflow file.
4. **Stay fresh.** Put those files in your `username/username` repository. The workflow runs daily, regenerates your images from live data using GitHub's built-in token, and commits the result.

Everything is generated as plain files in your own repository. Images are SVGs, not requests to a hosted service, so they cannot break or hit someone else's rate limit.

## Principles

- **Never invent facts.** If GitHub has no value for a field, the template leaves it out. No made-up job titles, no placeholders.
- **Light and dark.** Designs follow the viewer's GitHub theme, and animations respect "reduce motion".
- **Accessible.** Images get real alt text that describes only what they show.
- **Safe.** Profile text is escaped everywhere, and the preview is sanitised.

## Use the Action

In your profile repository (named the same as your username), add `livebio.yml`:

```yaml
username: your-username
template: terminal
theme: auto
motion: true
credit: true
blocks: [stats, languages, projects]
text:
  headline: Security researcher
```

and `.github/workflows/livebio.yml`:

```yaml
name: livebio
on:
  schedule:
    - cron: "17 3 * * *"
  workflow_dispatch:
permissions:
  contents: write
jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: illusive7ai/livebio@main
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
      - run: |
          git config user.name "livebio[bot]"
          git config user.email "livebio[bot]@users.noreply.github.com"
          git add -A
          git diff --cached --quiet || (git commit -m "Update profile README" && git push)
```

If your README already contains `<!-- livebio:start -->` and `<!-- livebio:end -->`, only the text between them is replaced, so the rest of your README is left alone.

The builder generates both files for you.

## The credit line

By default the generated README ends with a small "Made with livebio by illusivehacks" line. It helps the project reach people. You can switch it off with one checkbox in the builder, or with `credit: false` in `livebio.yml`.

## Develop

Requires Node 20 or newer.

```
npm install
npm run dev        # the builder at http://localhost:5173
npm test           # engine tests
npm run typecheck
npm run build
```

| Path | What it is |
|---|---|
| `packages/core` | The engine: GitHub data, templates, README and SVG rendering. Shared by the web app and the Action. |
| `apps/web` | The builder. |
| `packages/action` | The GitHub Action. Its bundle in `dist/` is committed, because Actions run it directly. |

After changing `packages/core` or `packages/action`, run `npm run build -w @livebio/action` and commit the updated `dist/index.js`.

## Roadmap

- [x] Neofetch: your profile picture as ASCII art beside a system-info summary
- [ ] More templates: recruiter brief, open-source maintainer, isometric contribution city, animated repo galaxy, snake trail and more, each with its own look, and some built around images
- [ ] Contribution counts and streaks (authenticated data, available in the Action)
- [ ] Optional small edge function so the browser preview can show contribution data too
- [ ] Import and improve an existing README
- [ ] Profile lint: broken images, dead links, missing alt text
- [ ] Template gallery site

## Contributing

Templates are small TypeScript files, and they are the easiest way to contribute. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE) © illusivehacks
