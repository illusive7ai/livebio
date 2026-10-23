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
2. Register it in `packages/core/src/templates/index.ts`.
3. That is all the tests need: every registered template is automatically checked for the rules below.

### Rules every template must follow

- **Never invent data.** `Profile` fields can be `null`. Leave out what is missing; do not print placeholders such as "Unknown" or guess a job title.
- **Escape everything.** Profile text belongs to someone else. Use `xmlEscape` inside SVG and `escapeMarkdown` in Markdown, and `safeUrl` for links.
- **Support light and dark.** Produce both variants for `theme: auto` (use `variantsFor` and `pictureTag`).
- **Honour `motion`.** Only animate when `config.motion` is true, and add a `prefers-reduced-motion` rule.
- **Honour `blocks`.** Only show sections listed in `config.blocks`, including in alt text.
- **Alt text** must describe only what the image shows.
- **System fonts only.** GitHub blocks external fonts and resources inside images.
- **Give it its own look.** Templates should not be colour swaps of each other. Layout, motion and mood should differ.
- **Images:** an SVG cannot load outside images, so embed them. Set `needsAvatar: true` on your template and use `profile.avatar.dataUri` to embed the profile picture, or `profile.avatar.grid` for pixel data (see `neofetch.ts`). `profile.avatar` can be missing, so always have a fallback. `profile.avatar.grid.tint` is the picture's dominant colour, and `accentColors` in `color.ts` turns it into a palette (see `showcase.ts`). Only embed a picture after checking it is a plain base64 PNG or JPEG data URI.

GitHub strips CSS, scripts and iframes from READMEs, so animation has to live inside the SVG, and hover or click effects are not possible.

## Pull requests

Keep them small and focused, and include a screenshot for template changes. Run `npm run typecheck` and `npm test` first.
