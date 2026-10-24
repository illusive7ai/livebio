# Changelog

All notable changes to livebio. The version numbers are the tags of the GitHub Action (`illusive7ai/livebio@v0.1.1`). The website and the picture server are deployed from the main branch and are not versioned, so their changes are listed under Unreleased until the next tag includes them.

## Unreleased

### Added

- **Time-lapse city.** A Studio switch for the contribution city on any design: the city grows week by week through your year with a running total that only uses real counts, then holds and starts again. It also works in livebio.yml (`custom.timelapse`) and in the hosted pictures. With motion off, the finished city is drawn.
- **Fonts, text colour and text size in the Studio.** Nine typefaces (clean sans, serif, code, rounded, friendly sans, classic book, typewriter, handwriting, bold headline), one colour for all text with a readability check against GitHub's dark and light pages, and a size from 80% to 130%. They apply to every picture of every design, in the zip, the Action and the hosted pictures (`custom.font`, `custom.textColor`, `custom.textSize`). Fonts are the ones already on the reader's device, because GitHub cannot load web fonts.
- **Compare two designs.** The Studio can set two designs side by side with your own profile in them, with your style on both or each as it comes, then keep the one you like.
- **Favourites and recently used.** A heart on every design and a Recently used list, kept only in the browser (no sign-in), shown on the Templates page, in the Create picker and in the Studio.
- **GitHub Wrapped.** A new tab that tells your last twelve months from the real calendar and profile: total, active days, streaks, quiet stretch, busiest day, month and weekday, weekend share, best week, languages and stars. A label such as "Weekend warrior" only appears when the numbers earn it and shows which numbers did. It ends with a card to download as PNG or SVG.
- **README linter.** A new tab that checks any README for problems and writes a corrected copy. About fifty checks cover headings, tables, lists, code blocks, links, images and alt text, HTML that GitHub removes or leaves unclosed, markdown that sits inside HTML and is not rendered, insecure or local addresses, leaked secrets, leftover template text, pictures served from fragile free servers, spelling and product names. Each issue says whether the corrected version fixes it or whether only you can. It shows a line diff and a preview, can load a profile README by username, and runs entirely in the browser.
- **Share and star on the home page.** Under the username box the site shows how many stars the project has (read through the livebio service, shared for ten minutes, and left out rather than guessed when unavailable), a link to star it, and WhatsApp, Telegram and copy-link buttons that send the website to a friend. Nothing is sent or tracked from the site.
- **Twenty-five more designs, 75 in all**, in five more groups of look:
  - Paper: **Wanted poster**, **Recipe card**, **Nutrition label**, **Postcard** and **Ransom note**.
  - Devices: **Departures board**, **Handheld console**, **Neon sign** (lit in the dark theme, unlit in the light one), **Laptop stickers** and **Pixel pet** (its mood follows how long ago you were last active).
  - Activity as a picture: **Garden**, **Ridgeline**, **Pulse monitor**, **Drum machine** and **Weather forecast**. They need the contribution calendar, and say what they are waiting for without it.
  - Worlds: **Activity rings**, **Language tree**, **Aquarium**, **Island map** and **Circuit board** (an LED lights only for a repository pushed to in the last 90 days).
  - Data art: **Sonar**, **Word cloud**, **Timeline**, **Sunburst** and **Brick mosaic** (built from your real profile photo).
  
  Sizes always follow real numbers, on a logarithmic scale where that is the fair way to show them, and each caption says which. Nothing is invented: a missing date, description or photo leaves its part out or says it is waiting.
- **Fifteen more designs, 50 in all**, in four new groups of look:
  - Documents: **Passport** (a stamp for each language), **Receipt** (repositories as items, with a real subtotal), **Character sheet** and **Wall calendar** (every day coloured by its real contributions).
  - Interfaces: **Now playing** (a music player with your weeks as an equaliser), **Inbox** (a repository is unread when it was really pushed to lately), **Retro desktop** and **Cockpit** (dials on a labelled logarithmic scale).
  - Data art: **Metro map**, **Elements** (a periodic table of repositories), **Treemap** (tile area is stars plus one) and **Bookshelf** (spine height is stars on a log scale).
  - Scrapbook: **Trading card**, **Polaroid wall** and **Comic strip**.
  
  Every one draws only what GitHub returned: a repository with no description gets no invented one, a missing date leaves its line out, and a design that has nothing to show says so. All of them carry the live city and a game, and have light and dark versions.
- **Copy and paste, with live pictures.** The site's **Copy README** now copies a README whose pictures are addresses on the livebio server, which draws them from your public GitHub data when your profile is viewed. There is nothing to upload and no Action to set up, and your numbers, contribution city and chess game stay current by themselves (a picture is refreshed about once an hour). The zip and the Action remain as **Host the files myself**, for anyone who would rather not depend on a server.
  - The settings that shape a picture travel in its address and are checked with the same rules as `livebio.yml`.
  - The server keeps only a one-hour copy of public GitHub data. A picture that cannot be drawn is drawn as a small picture that says why, and is never cached.
  - The server only fetches profile pictures from GitHub's own hosts, and every picture carries a content security policy.
- A reviews section on the home page that reads reviews from this repository's issues (see the README). While they load it says so, and it never claims there are none before it has looked.

### Fixed

- Every design crashed while drawing an account with no contributions in the past year, which left that account with a blank page. A quiet year now draws an empty city, and the city's description says "one building for each active day".

### Changed

- **Reviews from anyone are shown.** A review written with the form by any GitHub user, with the permission box ticked, now appears without waiting for a maintainer to approve it. Reviews from bots, and reviews containing a web address, are left out, and a maintainer can remove one by adding the `hidden` label.
- The Studio's game choice is now a plain **Chess / Snake / No game** picker that works with every design, marks the design's own default, and explains the choice. The choice travels in the exported `livebio.yml` and in the live picture addresses. A test now runs it against all 50 designs.
- The export panel leads with the easiest way to publish, and explains, with a checklist, why a README copied without its picture files shows broken images.

## 0.1.1 - 2026-10-23

### Fixed

- The Action removes pictures left behind by an earlier design. Switching design used to leave the old design's files in `livebio/` for good. Only `.svg` files directly inside `livebio/` that the current run did not write are removed; nothing else is touched.

## 0.1.0 - 2026-10-23

The first release.

### Added

- **The Action.** Reads `livebio.yml`, fetches your public GitHub data, draws the pictures and writes them with your README, then commits them back. It works with the workflow's built-in `GITHUB_TOKEN`, and updates only the block between `<!-- livebio:start -->` and `<!-- livebio:end -->`. The generated workflow is pinned to a release tag.
- **35 designs**, each with its own look: Showcase, Launchpad, Contribution city, Repo galaxy, Snake trail, Learning log, Build log, Open-source maintainer, Recruiter brief, Terminal, Neofetch, Minimal, Frontend, Backend, DevOps, Data Lab, Indie Hacker, Animated Frontend, Product Engineer, Advocate, Framework Creator, OSS Builder, Open-Source Proof, Founder, Space Shooter, Jet Runner, Playable Signal, Cinematic, Wow Profile, Signature Profile, Signature Cap Tip, Front Page, Everything Hub, Creative Portfolio and Erased.
- **A live contribution city and a game with each design**: a city built from your real contribution calendar, plus an automated snake or a chess game (a famous historical game replayed two moves a day). Each can be switched off. The Contribution city design and the Snake trail design already are a city and a snake, so they carry only the other half.
- **Custom settings** in `livebio.yml`: `custom.hue`, `custom.look` and `custom.companion`, to restyle any design without writing code.
- **The "livebio by illusivehacks" credit**, an animated image in which each letter glitches on its own. It is on by default and switched off with `credit: false`.

### Honest by design

- A design only states what your public data supports. Designs named for a kind of work, such as Frontend or Backend, count your repositories by their main language and never give you a job title. When nothing matches, they show plain totals instead.
- Nothing is invented: a field GitHub leaves empty is left out, and numbers from a section you have switched off never appear.
