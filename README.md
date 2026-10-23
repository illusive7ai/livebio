# livebio

A GitHub profile README that keeps itself up to date. Open source, no sign-in, nothing stored.

**Built by [illusivehacks](https://github.com/illusive7ai).**

### [Try it: illusive7ai.github.io/livebio](https://illusive7ai.github.io/livebio/)

Type your GitHub username, pick a design, make it yours, and export. A small GitHub Action in your own profile repository then refreshes your stats every day, so your profile never goes stale and never depends on someone else's server.

> **Status: early.** The builder, the Action and eight templates work, including a 3D contribution city and an orbiting repo galaxy. More templates are the next thing on the list. See the [roadmap](#roadmap).

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
template: showcase   # showcase, city, galaxy, maintainer, brief, terminal, neofetch or minimal
theme: auto
motion: true
credit: true
blocks: [stats, activity, languages, projects]
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

## Activity: contribution graph and streaks

The `activity` section shows your contribution graph and streaks. GitHub only shares that data with a token, so:

- **In your profile**, the Action reads it with the workflow's built-in `GITHUB_TOKEN`. If it cannot, it prints a warning and leaves the section out, and everything else still updates. In that case, create a token with no scopes, save it as a repository secret and pass it as the `token` input instead.
- **In the builder's preview**, a small [edge function](workers/contributions) supplies the same data. It is optional. Without it the preview just has no activity section, and your profile still gets one.

Streaks are worked out from the calendar itself. A streak is current if it includes today, or yesterday when today has no activity yet. The longest streak is the longest within the past year of data.

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
| `workers/contributions` | Optional edge function that gives the builder's preview contribution data. |

After changing `packages/core` or `packages/action`, run `npm run build -w @livebio/action` and commit the updated `dist/index.js`.

## Roadmap

- [x] Showcase: a banner built around your profile picture, coloured from the picture itself
- [x] Recruiter brief: a calm, paper-style one-page summary of who you are, your work and your stack
- [x] Open-source maintainer: a project board with impact numbers, repository tiles (licence, freshness) and a weekly activity pulse
- [x] Neofetch: your profile picture as ASCII art beside a system-info summary
- [x] Contribution city: every day of the past year as a building in an isometric city, taller on busier days
- [x] Repo galaxy: your projects as planets orbiting your profile picture, sized by stars, with a moon for each fork milestone
- [ ] More templates: snake trail and styles for makers, students and people shipping products, each with its own look
- [x] Contribution graph and streaks, from the Action and from an optional edge function for the preview
- [ ] Activity in more templates, and a template built around the isometric contribution city
- [ ] Import and improve an existing README
- [ ] Profile lint: broken images, dead links, missing alt text
- [ ] Template gallery site

## Contributing

Templates are small TypeScript files, and they are the easiest way to contribute. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE) © illusivehacks
