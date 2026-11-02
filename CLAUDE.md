# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working in this repository.

## Project overview

nightdogs.xyz is a multi-author blog built with Eleventy 3. It started from
eleventy-base-blog and adds per-author colour themes, photo galleries, client
side search, webmentions and a browser-based editor (Sveltia CMS).

## Commands

- `npm start`: dev server on http://localhost:8080. Image processing is
  skipped here, so pages load fast and show the original photos.
- `npm run build`: production build into `_site/`. This is what Netlify runs.
- `npm run build-fast`: same output with `ELEVENTY_ENV=development`.
- `npm test`: runs a full build, validates post front matter
  (`test/content-validation.test.js`) and checks `_data/authors.json`.
- `npm run optimize-images [files…]`: shrinks oversized photos in
  `content/blog` in place. It's safe to re-run. CI runs it on pushes to main
  (`.github/workflows/optimize-images.yml`). It is **not** part of the build.

## Layout

- `content/`: pages and posts. Posts live at
  `content/blog/<author>/<YYYY-MM-DD>/<slug>/index.md`, with their photos
  in the same folder.
- `_includes/layouts/`:
  - `base.njk`: page shell, theme CSS generated from `authors.json`, meta
    tags, header and footer.
  - `post.njk`: the post page.
- `_includes/postslist.njk`: the post list with thumbnails, used on the home
  and tag pages.
- `css/index.css`: the main stylesheet. It is inlined into every page via
  `base.njk`. It uses theme custom properties: `--background-color`,
  `--color`, `--primary`, `--muted-color`, `--font-body`, `--font-heading`,
  plus derived `--surface` and `--border`.
- `public/`: copied as-is to the site root. It holds `js/site.js` (themes,
  dark mode, menu), `js/search.js`, `js/lightbox.js`, `css/fonts.css`, the
  fonts, icons and `admin/`.
- `_data/authors.json`: authors, bios and light/dark colours. Keep text at
  ≥4.5:1 contrast against the background, and preferably ≥5:1 so it also
  passes on tinted cards.
- `_data/tag-descriptions.json`: icon and description for each tag. Templates
  see it as `tagDescriptions`.
- `_config/`:
  - `filters.js`: template filters, including `excerptText`, `wordsInPosts`,
    `firstName` and `absoluteUrl`.
  - `markdown.js`: image-only paragraphs become `<figure>`s, and an image's
    title becomes its visible caption. Runs of photos are wrapped in
    `.gallery--column` or `.gallery--grid`, chosen by the post's
    `photoLayout`.
  - `images.js`: the `firstImage` filter (thumbnails) and the
    `socialImage` filter (Open Graph image).
  - `related-posts.js`
- `netlify/functions/`:
  - `cms-auth.js`: GitHub OAuth for the CMS, served at `/api/cms-auth`.
  - `daily-build.js`: a scheduled rebuild that refreshes webmentions.

## Posts

The front matter the CMS writes:

```yaml
title: …
author: jane # key in _data/authors.json
date: 2026-05-25T20:01:00.000-03:00
draft: false # optional; drafts aren't built
photoLayout: grid # optional: column (default) or grid
tags: [pictures] # optional; `posts` is added automatically
description: … # optional; used in previews
```

The URL comes from the folder path, not from `slug:`. The CMS names date
folders in UTC, so a folder can be one day off from the local date.

## Themes

`<html data-author="…">` picks the colours. The value is the post's or
profile's author, or the reader's choice saved in `localStorage`
(`author-theme`). Viewing a post shows that author's colours without changing
the saved choice. Dark mode follows the device unless the reader toggles it
(`nightdogs-dark-mode`, which sets `data-theme`).

To add an author:
1. Add an entry to `authors.json`. The CSS is generated from it.
2. Add the author to the Author options in `public/admin/config.yml`.

## Images

The eleventy-img transform turns every local `<img>` into WebP + JPEG at 480,
960 and 1600 px, written to `/img/`. Netlify caches `_site/img` between
builds. Remote images and the Cat page image use `eleventy:ignore`.

## CMS

The editor is Sveltia CMS at `/admin/` (`public/admin/config.yml`). Authors
sign in with GitHub and need write access to the repo. Saves commit straight
to `main`. Uploads are converted to WebP and capped at 2400 px in the
browser. Author docs and the one-time setup are in `docs/CMS.md`.

## Environment variables (Netlify)

- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`: CMS sign-in
- `WEBMENTION_IO_TOKEN`: webmentions
- `NETLIFY_BUILD_HOOK_URL`: the daily rebuild

## Deploy

Netlify builds `npm run build` on every push to `main` (see `netlify.toml`,
which also has the redirects).
