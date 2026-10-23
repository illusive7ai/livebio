# Changelog

All notable changes to livebio. The version numbers are the tags of the GitHub Action (`illusive7ai/livebio@v0.1.1`). The website and the picture server are deployed from the main branch and are not versioned, so their changes are listed under Unreleased until the next tag includes them.

## Unreleased

### Added

- **Copy and paste, with live pictures.** The site's **Copy README** now copies a README whose pictures are addresses on the livebio server, which draws them from your public GitHub data when your profile is viewed. There is nothing to upload and no Action to set up, and your numbers, contribution city and chess game stay current by themselves (a picture is refreshed about once an hour). The zip and the Action remain as **Host the files myself**, for anyone who would rather not depend on a server.
  - The settings that shape a picture travel in its address and are checked with the same rules as `livebio.yml`.
  - The server keeps only a one-hour copy of public GitHub data. A picture that cannot be drawn is drawn as a small picture that says why, and is never cached.
  - The server only fetches profile pictures from GitHub's own hosts, and every picture carries a content security policy.
- A reviews section on the home page that reads reviews from this repository's issues (see the README). While they load it says so, and it never claims there are none before it has looked.

### Changed

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
