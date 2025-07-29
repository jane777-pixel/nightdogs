[![Netlify Status](https://api.netlify.com/api/v1/badges/9b93ae7e-e489-4786-b348-7f45b2325627/deploy-status)](https://app.netlify.com/projects/nightdogs/deploys)

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

## TODO

- [x] Make Nic an author
- [x] Fix CMS authentication
- [ ] Add Dog page for Adesse
