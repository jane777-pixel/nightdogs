# nightdogs.xyz

The source code for the blog at nightdogs.xyz. Built with [Eleventy](https://www.11ty.dev/).

This project was originally forked from [eleventy-base-blog](https://github.com/11ty/eleventy-base-blog).

## Development

1. Install dependencies

```
npm install
```

2. Run Eleventy

Build and host on a local development server:

```
npx @11ty/eleventy --serve
```

Or generate a production-ready build to the `_site` folder:

```
npx @11ty/eleventy
```

## Features

- Using [Eleventy v3](https://github.com/11ty/eleventy/releases/tag/v3.0.0) with zero-JavaScript output.
- **Performance focused**: four-hundos Lighthouse score out of the box!
- Local development live reload provided by [Eleventy Dev Server](https://www.11ty.dev/docs/dev-server/).
- Content-driven [navigation menu](https://www.11ty.dev/docs/plugins/navigation/)
- Fully automated [Image optimization](https://www.11ty.dev/docs/plugins/image/)
- Per page CSS bundles [via `eleventy-plugin-bundle`](https://github.com/11ty/eleventy-plugin-bundle).
- Built-in [syntax highlighter](https://www.11ty.dev/docs/plugins/syntaxhighlight/) (zero-JavaScript output).
- Draft content: use `draft: true` to mark any template as a draft.
- Blog Posts
  - Automated next/previous links
  - Accessible deep links to headings
- Generated Pages
  - Home, Archive, and About pages.
  - [Atom feed included](https://www.11ty.dev/docs/plugins/rss/)
  - `sitemap.xml`
  - Zero-maintenance tag pages
  - Content not found (404) page
- **Custom Features**
  - Per-author color themes, configurable in `_data/authors.json` and `css/index.css`.
  - Client-side author filtering on the Archive page.
  - Styled with [Pico.css](https://picocss.com/), with custom theme overrides.

### Implementation Notes

- `content/about/index.md` is an example of a content page.
- `content/blog/` has the blog posts. They need the `posts` tag to be included in the blog posts [collection](https://www.11ty.dev/docs/collections/).
- `_data/authors.json` is used to manage author names, bios, and theme colors.
- The `public` folder is copied to the output folder.
- This project uses three [Eleventy Layouts](https://www.11ty.dev/docs/layouts/):
  - `_includes/layouts/base.njk`: the top level HTML structure
  - `_includes/layouts/home.njk`: the home page template
  - `_includes/layouts/post.njk`: the blog post template
- `_includes/postslist.njk` is a reusable component used to display a list of all the posts. `content/index.njk` has an example of how to use it.

#### Content Security Policy

If your site enforces a [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) (as public-facing sites should), you have a few choices (pick one):

1. In `base.njk`, remove `<style>{% getBundle "css" %}</style>` and uncomment `<link rel="stylesheet" href="{% getBundleFileUrl "css" %}">`
2. Configure the server with the CSP directive `style-src: 'unsafe-inline'` (less secure).
