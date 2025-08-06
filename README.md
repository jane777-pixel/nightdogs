[![Netlify Status](https://api.netlify.com/api/v1/badges/9b93ae7e-e489-4786-b348-7f45b2325627/deploy-status)](https://app.netlify.com/projects/nightdogs/deploys)

a

# nightdogs.xyz

The source code for the blog at nightdogs.xyz. Built with [Eleventy](https://www.11ty.dev/).

This project was originally forked from [eleventy-base-blog](https://github.com/11ty/eleventy-base-blog).

## Developer Workflows

- **Build:** `npm run build` (or `npx eleventy`)
- **Serve locally:** `npm start` (or `npx eleventy --serve`)
- **Deploy:** Push to main; Netlify auto-deploy.
- **Add author:** Update `_data/authors.json` and add theme CSS if needed.
- **Add post:** Place markdown/Nunjucks file in `content/blog/<author>/<date>/<slug>/`.

## Project-Specific Conventions

- **Author slugs** must match those in `authors.json` and theme selectors.
- **Custom filters**: Add to `_config/filters.js` and register in `eleventy.config.js`.
- **Webmentions:** Data and templates in `_data/webmentions.js` and `_includes/webmentions.njk`.
- **No direct edits** in `_site/`—always edit source files.

## Blog Post Folder Structure & Content Guidelines

### Folder Structure

- All blog posts are stored in `content/blog/`.
- Each post is in its own folder, organized by author and date:
  - `content/blog/<author>/<YYYY-MM-DD>/<slug>/index.md`
  - Example: `content/blog/jane/2025-07-22/first-post/index.md`
- Images for a post should be placed in the same folder as the post's `index.md`.
  - Example: `content/blog/jane/2025-07-22/first-post/my-image.jpg`

### Naming Conventions

- `<author>`: Must match the author slug in `_data/authors.json` (e.g., `jane`, `orionlw`, `adesse`, etc.).
- `<YYYY-MM-DD>`: The publish date of the post (year-month-day).
- `<slug>`: A short, URL-friendly name for the post (e.g., `first-post`).
- Images: Use descriptive, lowercase filenames. Place them in the same folder as the post.

### Required Frontmatter for Posts

Each post must have a YAML frontmatter block at the top of `index.md`:

```yaml
---
title: Post Title
slug: post-title
date: YYYY-MM-DDTHH:MM:SS.000Z # ISO format, matches folder date
author: author-slug # Must match an entry in authors.json
tags:
  - posts # Always include 'posts' tag
  # ...other tags as needed
---
```

- `title`: The title of the post.
- `slug`: The URL slug (should match the folder name).
- `date`: Publish date/time in ISO format (should match folder date).
- `author`: Author slug (must match `_data/authors.json`).
- `tags`: List of tags. Must include `posts`.

### Tags

- Every post must have the `posts` tag.
- Add additional tags as needed (e.g., `knitting`, `music`, `swimming`).
- Tags are used for filtering and tag pages.

### Images

- Place all images for a post in the same folder as the post's `index.md`.
- Reference images in markdown using relative paths:
  - `![alt text](./my-image.jpg)`
- Images are published to `/img/` via the Netlify CMS media settings.

### Example Post Folder

```
content/blog/jane/2025-07-22/first-post/
├── index.md
├── my-photo.jpg
├── chart.png
```

### Additional Notes

- The folder and frontmatter structure is enforced by Netlify CMS (`public/admin/config.yml`).
- Only use author slugs and tags defined in the config and `_data/authors.json`.
- For more, see the [Netlify CMS config](public/admin/config.yml) and [authors.json](_data/authors.json).

## Fonts

The following fonts are available for use in this project (see `public/css/fonts.css`):

- **Bellefair**
- **Bitcount Grid Single**
- **Jacquard 12**
- **EB Garamond** (weights: 400, 500, 600, 700, 800; styles: normal, italic)
- **Fira Sans** (weights: 100, 200, 300, 500; styles: normal, italic)

To use a font in your templates or CSS, reference its `font-family` name as listed above.


## TODO

- [x] Make Nic an author
- [x] Fix CMS authentication
- [ ] Add Dog page for Adesse
