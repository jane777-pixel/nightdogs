[![Netlify Status](https://api.netlify.com/api/v1/badges/9b93ae7e-e489-4786-b348-7f45b2325627/deploy-status)](https://app.netlify.com/projects/nightdogs/deploys)


# nightdogs.xyz

The source code for the blog at nightdogs.xyz. Built with [Eleventy](https://www.11ty.dev/).

This project was originally forked from [eleventy-base-blog](https://github.com/11ty/eleventy-base-blog).

## Writing posts

Use the editor at **https://nightdogs.xyz/admin/** (sign in with GitHub).
See [docs/CMS.md](docs/CMS.md) for how photos, captions and layouts work.

## Developer workflows

- **Serve locally:** `npm start` (http://localhost:8080)
- **Build:** `npm run build`
- **Test:** `npm test` (build + content validation)
- **Deploy:** push to `main`; Netlify builds automatically.
- **Add author:** add them to `_data/authors.json` and the Author list in
  `public/admin/config.yml`. Their colours are generated from the JSON.

More detail for developers is in [CLAUDE.md](CLAUDE.md).

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
date: YYYY-MM-DDTHH:MM:SS.000-03:00 # ISO format, matches folder date
author: author-slug # Must match an entry in authors.json
photoLayout: grid # optional: column (default) or grid
tags: # optional; 'posts' is added automatically
  - pictures
---
```

- `title`: The title of the post.
- `date`: Publish date/time in ISO format (should match folder date).
- `author`: Author slug (must match `_data/authors.json`).
- `photoLayout`: `grid` shows photos as thumbnails; `column` (default) shows them full width.
- `tags`: Optional list of tags.

### Tags

- The `posts` tag is added automatically.
- Add tags as needed (e.g., `knitting`, `music`, `swimming`).
- Tags are used for filtering and tag pages.

### Images

- Place all images for a post in the same folder as the post's `index.md`.
- Reference images in markdown using relative paths:
  - `![alt text](./my-image.jpg "optional caption")`
- The text in quotes becomes a caption under the photo.
- Photos are resized and converted to WebP automatically when the site builds.

### Example Post Folder

```
content/blog/jane/2025-07-22/first-post/
├── index.md
├── my-photo.jpg
├── chart.png
```

### Additional Notes

- The folder and front matter structure is set by the CMS (`public/admin/config.yml`).
- Only use author slugs defined in `_data/authors.json`.

## Fonts

Self-hosted in `public/fonts` and declared in `public/css/fonts.css`:
Bellefair, Bitcount Grid Single, Jacquard 12, Quicksand, EB Garamond
(400, 600, 700), Fira Sans (400, 600, 700) and Montserrat (400, 600, 700).
Authors pick their fonts in `_data/authors.json`.

## TODO

- [x] Make Nic an author
- [x] Fix CMS authentication (moved to Sveltia CMS + GitHub sign-in)
- [ ] Add Dog page for Adesse
