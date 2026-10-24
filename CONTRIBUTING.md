# Contributing to livebio

Thanks for helping. Templates are the easiest place to start.

## Setup

```
npm install
npm test
npm run dev
```

## Adding a template

1. Create `packages/core/src/templates/<id>.ts` and export a `Template` (see `terminal.ts` for an image-based one and `minimal.ts` for a Markdown-only one).
2. Register it in `packages/core/src/templates/index.ts`: add it to the `bases` list, and give it an entry in the `LIVE` map. Every design carries a live contribution city and a snake or chess game, and the entry says which preset, which game and what hue shift to use (the shift keeps designs that share a preset looking different).
3. Give it a group on the website, in `apps/web/src/lib/catalog.ts`, so it appears on the Templates page and in the picker.
4. Write a test file for the numbers your design shows (see `shop.test.ts` or `print.test.ts`). Put the logic that decides what is drawn, such as how big a bar is or which repository earns a card, in a small exported function and test it directly, with the edge cases: nothing, one item, too many.
5. That is all the shared tests need: every registered template is automatically checked for the rules below, and that every picture its README names is a file it generates (so it also works as a hosted picture).

Helpers for treating the profile picture as a photograph (crops, duotone, heat-map and two-ink filters, an RGB split) live in `photo.ts`. Helpers for drawing live in `packages/core/src/templates/kit.ts` (palettes, panels, bars, repository rows) and `shared.ts`. A design built from a profile's repositories by language can be a "lens" (see `lenses.ts`) instead of a whole file.

### Rules every template must follow

- **Never invent data.** `Profile` fields can be `null`. Leave out what is missing; do not print placeholders such as "Unknown" or guess a job title.
- **Escape everything.** Profile text belongs to someone else. Use `xmlEscape` inside SVG and `escapeMarkdown` in Markdown, and `safeUrl` for links.
- **Support light and dark.** Produce both variants for `theme: auto` (use `variantsFor` and `pictureTag`).
- **Honour `motion`.** Only animate when `config.motion` is true, and add a `prefers-reduced-motion` rule.
- **Honour `blocks`.** Only show sections listed in `config.blocks`, including in alt text.
- **Alt text** must describe only what the image shows. `describeProfile` takes `{ activity: true }`; pass it only if your template draws the activity section.
- **Optional project facts** can be missing too: `profile.totalForks`, `profile.activeRepos` (pushed within `ACTIVE_WINDOW_DAYS`), `profile.fetchedAt`, and each repository's `pushedAt` and `license`. Measure "updated 3 days ago" from `fetchedAt` with `timeAgo`, never from the current time, so output stays repeatable. Leave out whatever is missing instead of printing a placeholder.
- **Activity data** is `profile.contributions` and can be missing. Show the `activity` section only when it exists and `config.blocks` includes `activity`.
- **System fonts only.** GitHub blocks external fonts and resources inside images.
- **Give it its own look.** Templates should not be colour swaps of each other. Layout, motion and mood should differ.
- **Images:** an SVG cannot load outside images, so embed them. Set `needsAvatar: true` on your template and use `profile.avatar.dataUri` to embed the profile picture, or `profile.avatar.grid` for pixel data (see `neofetch.ts`). `profile.avatar` can be missing, so always have a fallback. `profile.avatar.grid.tint` is the picture's dominant colour, and `accentColors` in `color.ts` turns it into a palette (see `showcase.ts`). Only embed a picture after checking it is a plain base64 PNG or JPEG data URI.

- **Show the picture many times? Embed it once.** A picture is a base64 string, and repeating it for every crop or frame makes the file huge (a contact sheet of twelve frames was over half a megabyte). Put `pictureDef(profile, 'av')` in the design's `defs` and draw each use with `photo(..., { ref: 'av' })`. In the same way, draw a repeated texture as a `<pattern>`, not as thousands of shapes.
- **Check it by eye, with motion off.** Render the design for a real profile in dark and light (a screenshot taken mid-animation looks washed out), and try an account with no activity and one with a very long name.

GitHub strips CSS, scripts and iframes from READMEs, so animation has to live inside the SVG, and hover or click effects are not possible.

## Pull requests

Keep them small and focused, and include a screenshot for template changes. Run `npm run typecheck` and `npm test` first.
