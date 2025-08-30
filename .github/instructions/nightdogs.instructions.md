---
applyTo: "**"
---

## Project Overview

- **Static site/blog** built with [Eleventy (11ty)](https://www.11ty.dev/), deployed to Netlify and Vercel.
- Forked from `eleventy-base-blog`, with custom multi-author support, per-author themes, and IndieWeb features.

## Key Structure & Patterns

- **Content:** Markdown/Nunjucks in `content/` (posts, pages, tag pages, etc.)
- **Layouts:** Nunjucks templates in `_includes/layouts/` (e.g., `base.njk`, `post.njk`, `home.njk`).
- **Data:** Global and author data in `_data/` (e.g., `authors.json`, `metadata.json`).
- **Filters:** Custom Nunjucks filters in `_config/filters.js`.
- **Assets:** CSS in `css/`, JS in `js/`, images in `img/`.
- **Build output:** Generated site in `_site/` (do not edit directly).

## Author Theme Pattern

- Author themes are selected via a dropdown in the footer (`base.njk`).
- The selected author is stored in `localStorage` and set as `data-author` on `<body>` and `.site-wrapper`.
- Use `[data-author]` selectors in CSS for per-author theming.

## IndieWeb Integrations

- **Webmentions:**
  - Data fetched in `_data/webmentions.js` using the Webmention.io API and Eleventy Fetch.
  - Displayed via `_includes/webmentions.njk` (see for facepile, likes, replies, etc.).
  - Endpoints set in `<head>` of `base.njk`:
    ```html
    <link
    	rel="webmention"
    	href="https://webmention.io/nightdogs.xyz/webmention"
    />
    <link rel="pingback" href="https://webmention.io/nightdogs.xyz/xmlrpc" />
    ```
- **IndieAuth:**
  - Endpoints in `<head>` of `base.njk`:
    ```html
    <link rel="authorization_endpoint" href="https://indieauth.com/auth" />
    <link rel="token_endpoint" href="https://tokens.indieauth.com/token" />
    ```
- **Microformats:**
  - Use of `h-card`, `h-entry`, `p-name`, `u-url`, `dt-published`, `p-author` classes in markup (see `base.njk`, `post.njk`).
  - Ensures posts and author info are machine-readable for IndieWeb tools.

## Developer Workflows

- **Build:** `npm run build` (or `npx eleventy`)
- **Serve locally:** `npm start` (or `npx eleventy --serve`)
- **Deploy:** Push to main; Netlify/Vercel auto-deploy.
- **Add author:** Update `_data/authors.json` and add theme CSS if needed.
- **Add post:** Place markdown/Nunjucks file in `content/blog/<author>/<date>/<slug>/`.

## Project-Specific Conventions

- **Author slugs** must match those in `authors.json` and theme selectors.
- **Custom filters**: Add to `_config/filters.js` and register in `eleventy.config.js`.
- **Webmentions:** Data and templates in `_data/webmentions.js` and `_includes/webmentions.njk`.
- **No direct edits** in `_site/`—always edit source files.

## Integration Points

- **Netlify/Vercel:** Configured via `netlify.toml` and `vercel.json`.
- **IndieAuth/Webmention:** Endpoints in `<head>` of `base.njk`.
- **CMS:** Admin config in `public/admin/config.yml` (if using Netlify CMS).

## Examples

- See `base.njk` for author theme logic, IndieAuth/Webmention/microformats markup, and footer pattern.
- See `content/blog/` for post structure and author/date/slug convention.
- See `_data/authors.json` for author metadata and theme mapping.
- See `_data/webmentions.js` and `_includes/webmentions.njk` for webmention logic and display.

---

For major changes, review Eleventy docs and this file for project-specific patterns. When in doubt, follow the structure and conventions in the existing codebase.
