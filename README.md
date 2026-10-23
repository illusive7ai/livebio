# livebio

A GitHub profile README that keeps itself up to date. Open source, no sign-in, nothing stored.

<a href="https://github.com/illusive7ai"><picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/credit-dark.svg">
  <img alt="livebio by illusivehacks" src="assets/credit-light.svg" width="222">
</picture></a>

### [Try it: illusive7ai.github.io/livebio](https://illusive7ai.github.io/livebio/)

Type your GitHub username, pick a design, make it yours, and export. A small GitHub Action in your own profile repository then refreshes your stats every day, so your profile never goes stale and never depends on someone else's server.

> **Status: early.** The builder, a Templates gallery, a Studio for restyling designs and the Action all work, with 50 templates. Every one carries a live contribution city and an automated snake or chess game (the two designs that already are a city or a snake carry the other half). See the [roadmap](#roadmap).

## What it looks like

<p align="center">
  <img src="assets/screenshot-builder.png" width="900" alt="The livebio builder with a GitHub profile loaded: a grouped picker of designs on the left and a live preview of the README on the right">
</p>

Type a username, pick one of 50 designs, and see your own profile in it. Every design comes with a live contribution city and a chess game or snake that moves on its own (the Contribution city and Snake trail designs already are those, so they carry the other half). The pictures below are real output for the author's own profile, saved on 23 October 2026. They are animated SVGs, so they move here too.

<table>
<tr>
<td align="center" width="50%"><img src="assets/gallery/showcase.svg" width="440" alt="The Showcase design: a banner coloured by the profile picture, stat tiles, an activity calendar, languages and top projects"><br><sub><b>Showcase</b></sub></td>
<td align="center" width="50%"><img src="assets/gallery/contribution-city.svg" width="440" alt="A contribution city: every day of the past year as a building, taller on busier days"><br><sub><b>Contribution city, on every design</b></sub></td>
</tr>
<tr>
<td align="center" width="50%"><img src="assets/gallery/chess.svg" width="440" alt="A live chess game that plays two moves a day, with the latest moves listed beside the board"><br><sub><b>A chess game that plays itself, on every design</b></sub></td>
<td align="center" width="50%"><img src="assets/gallery/snake-trail.svg" width="440" alt="The Snake trail design: a snake crosses the contribution graph and eats the active days"><br><sub><b>Snake trail</b></sub></td>
</tr>
<tr>
<td align="center" width="50%"><img src="assets/gallery/space-shooter.svg" width="440" alt="The Space Shooter design: a ship zaps each column of active days on the contribution graph"><br><sub><b>Space Shooter</b></sub></td>
<td align="center" width="50%"><img src="assets/gallery/front-page.svg" width="440" alt="The Front Page design: a newspaper with a masthead, a lead story, a table of numbers and the year in brief"><br><sub><b>Front Page</b></sub></td>
</tr>
<tr>
<td align="center" width="50%"><img src="assets/gallery/cinematic.svg" width="440" alt="The Cinematic design: a letterboxed title card with rings that fill and a line that draws itself"><br><sub><b>Cinematic</b></sub></td>
<td align="center" width="50%"><img src="assets/gallery/terminal.svg" width="440" alt="The Terminal design: a terminal window that types out the profile line by line"><br><sub><b>Terminal</b></sub></td>
</tr>
</table>

### Publish with one paste

<table>
<tr>
<td valign="top"><img src="assets/screenshot-export.png" width="500" alt="The publish panel: Copy and paste is selected, with a Copy README button and three short steps"></td>
<td valign="top"><img src="assets/screenshot-phone.png" width="200" alt="The builder on a phone: the picker is a row of designs per group that scrolls sideways"></td>
</tr>
<tr>
<td><sub>Copy the README, paste it into your profile repository, done. The pictures are drawn live and stay current.</sub></td>
<td><sub>It works on a phone too.</sub></td>
</tr>
</table>

### More of the site

<table>
<tr>
<td width="50%"><img src="assets/screenshot-templates.png" width="440" alt="The Templates page: every design in a grid, grouped as Professional, Creative, Developer and Minimal"><br><sub>Every design in one grid</sub></td>
<td width="50%"><img src="assets/screenshot-studio.png" width="440" alt="The Studio: start from any design and change its accent colour, the look of its panels and its game"><br><sub>The Studio: recolour any design, swap its game</sub></td>
</tr>
</table>

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

## Copy and paste, with live pictures

The quickest way: pick a design on the site, press **Copy README**, and paste it into the README of your profile repository (a public repository named like your username). That is all. There is nothing to upload and nothing to set up.

The README holds no image files. Each picture is an address on the livebio server, which draws it from your public GitHub data when your profile is viewed, so your numbers, contribution city and chess game stay current by themselves. A picture is refreshed about once an hour.

- **What is kept:** only a one-hour copy of public GitHub data, so a busy profile does not use up GitHub's limits. No accounts, no cookies, nothing about who looked.
- **What it depends on:** the livebio server being up. If you would rather not depend on it, choose **Host the files myself** on the site (or use the Action below). Those files are yours and need no server.
- **Running your own server:** the picture server is the Cloudflare Worker in [workers/contributions](workers/contributions). Deploy it with your own token and point the site's `VITE_CONTRIBUTIONS_URL` at it.

## Use the Action

In your profile repository (named the same as your username), add `livebio.yml`:

```yaml
username: your-username
template: showcase   # see the Templates page for every id, for example showcase, launchpad, city, frontend, backend, ossproof or minimal
theme: auto
motion: true
credit: true
blocks: [stats, activity, languages, projects, city, game]
text:
  headline: Security researcher
custom:              # optional: make any design your own
  hue: 200           # accent colour, 0-359 (default: taken from your profile picture)
  look: blueprint    # look of the city and game panels: aurora, sunrise, night, space, arcade, chalk, editor, blueprint, paper, terminal, glow or plain
  companion: chess   # which game plays under the card: snake, chess or none
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
      - uses: illusive7ai/livebio@v0.1.1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
      - run: |
          git config user.name "livebio[bot]"
          git config user.email "livebio[bot]@users.noreply.github.com"
          git add -A
          git diff --cached --quiet || (git commit -m "Update profile README" && git push)
```

If your README already contains `<!-- livebio:start -->` and `<!-- livebio:end -->`, only the text between them is replaced, so the rest of your README is left alone.

The builder generates both files for you. The Action is the "host the files myself" option: it writes the pictures into your repository every day, so your profile never depends on a server.

## Activity: contribution graph and streaks

The `activity` section shows your contribution graph and streaks. GitHub only shares that data with a token, so:

- **In your profile**, the Action reads it with the workflow's built-in `GITHUB_TOKEN`. If it cannot, it prints a warning and leaves the section out, and everything else still updates. In that case, create a token with no scopes, save it as a repository secret and pass it as the `token` input instead.
- **In the builder's preview**, a small [edge function](workers/contributions) supplies the same data. It is optional. Without it the preview just has no activity section, and your profile still gets one.

Streaks are worked out from the calendar itself. A streak is current if it includes today, or yesterday when today has no activity yet. The longest streak is the longest within the past year of data.

## Templates and the Studio

The site has a **Templates** page with every design in one grid, and a **Studio** where you start from any design and change its accent colour, the look of its city and game panels, and which game plays. Designs you save stay in your browser only. **Export livebio.yml** from the Studio to use one on GitHub; the `custom` settings above are what it writes. The Studio changes and combines the existing designs. It does not edit their layouts.

## Reviews on the website

The home page shows reviews from real users, and says plainly when there are none yet. To add one, someone submits the **Share your experience** form (`.github/ISSUE_TEMPLATE/review.yml`) and ticks the box that agrees to have it shown. The site reads these issues itself, through the contribution service (`/reviews`), and caches them for ten minutes. A review from any GitHub user appears on its own, with no approval step, once the cache refreshes. Only reviews written with the form, with a rating, some text and the box ticked, are shown, and each is shown as plain text next to the GitHub username that opened the issue. Reviews from bots, and reviews that contain a web address (which is how advertising gets onto a page), are left out. To take a review down, a maintainer adds the `hidden` label to its issue, or closes the issue as spam; the label takes effect within ten minutes. The same service also reports the repository's star count (`/stars`), which the home page shows next to its WhatsApp, Telegram and copy-link share buttons. `apps/web/src/data/testimonials.ts` is only a fallback for when the service cannot be reached; never add a review there that was not submitted by the person it names.

## The credit line

By default the generated README ends with a small glitching "livebio by illusivehacks" credit. It is an image, because a profile README cannot run CSS, and it links to this project. It helps the project reach people. You can switch it off with one checkbox in the builder, or with `credit: false` in `livebio.yml`.

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
- [x] Snake trail: an animated snake that crosses your contribution graph and eats every active day, then starts over
- [x] Launchpad: a bold, hero-first page for people shipping products, with one featured project and recent momentum
- [x] Learning log: a notebook page with a language list, a twelve-week habit tracker and recent work
- [x] Build log: a release-notes style timeline of what was updated most recently, grouped by month
- [x] Contribution graph and streaks, from the Action and from an optional edge function for the preview
- [ ] Activity in more templates, and a template built around the isometric contribution city
- [ ] Import and improve an existing README
- [ ] Profile lint: broken images, dead links, missing alt text
- [ ] Template gallery site

## Contributing

Templates are small TypeScript files, and they are the easiest way to contribute. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE) © illusivehacks
