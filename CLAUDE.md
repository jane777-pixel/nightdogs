# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

nightdogs.xyz is a multi-author blog built with Eleventy (11ty) static site generator. Originally forked from eleventy-base-blog, it has been extensively customized with advanced features including automated newsletters, search functionality, theme switching, image optimization, and service worker capabilities.

## Development Commands

### Core Commands
- **Build**: `npm run build` - Production build with image optimization and environment variables set to production
- **Build (fast)**: `npm run build-fast` - Development build with ELEVENTY_ENV=development 
- **Build (dev)**: `npm run build-dev` - Build without production optimizations
- **Serve locally**: `npm start` or `npx eleventy --serve` - Development server on port 8080
- **Debug**: `npm run debug` - Run with Eleventy debug output
- **Debug serve**: `npm run debugstart` - Serve with debug output

### Image Optimization
- **Optimize images**: `npm run optimize-images` - Process all images in content/
- **Optimize new images**: `npm run optimize-new-images` - Process only recently added images
- **Optimize recent**: `npm run optimize-recent` - Optimize images from recent commits

### No Test Framework
This project does not have automated tests configured. All functionality is tested manually through the development server and build process.

## Architecture Overview

### Core Structure
- **Content**: All content lives in `content/` directory
- **Templates**: Nunjucks templates in `_includes/` with layouts in `_includes/layouts/`
- **Data**: Global data files in `_data/` (authors, metadata, webmentions)
- **Config**: Eleventy configuration split across `eleventy.config.js` and `_config/` modules
- **Public Assets**: Static files in `public/` copied to output
- **Build Output**: Generated site in `_site/`

### Blog Post Structure
Posts follow strict folder organization:
```
content/blog/<author>/<YYYY-MM-DD>/<slug>/index.md
```
- Author slug must match `_data/authors.json`
- Date folder format must match frontmatter date
- Images placed in same folder as post
- Required frontmatter: title, slug, date, author, tags (must include 'posts')

### Multi-Author System
- Authors defined in `_data/authors.json` with themes, bios, and preferences
- Each author has dedicated CSS theme variables
- Author pages auto-generated via `content/author-pages.11ty.js`
- Theme switching preserves per-author styling

### Key Features

#### Image Pipeline
- Advanced optimization with AVIF/WebP formats and multiple breakpoints
- Development vs production settings (minimal optimization in dev)
- Automatic lazy loading and responsive sizing
- Cache management with 30-day retention

#### Newsletter System
- Automated monthly digest via Netlify Functions (`netlify/functions/monthly-digest.js`)
- Integration with Resend API for email delivery
- Newsletter subscription/unsubscribe endpoints
- Admin testing interface at `/admin/newsletter-test/`
- Scheduled builds for webmentions refresh

#### Search & Performance
- Client-side search with fuzzy matching (`public/js/search.js`)
- Service worker for offline functionality (`public/sw.js`)
- Critical CSS inlining system (`_config/critical-css.js`)
- Performance monitoring and Core Web Vitals tracking

#### Theme System
- Light/dark/auto modes with system preference detection
- Per-author color schemes maintained across mode switches
- Theme persistence via localStorage
- CSS custom properties for consistent theming

## Configuration Files

### Key Config Modules
- `eleventy.config.js` - Main Eleventy configuration
- `_config/filters.js` - Custom template filters
- `_config/related-posts.js` - Related content algorithm
- `_config/critical-css.js` - Above-fold CSS optimization

### Data Files
- `_data/authors.json` - Author definitions with themes and preferences
- `_data/metadata.json` - Site-wide metadata
- `_data/webmentions.js` - Dynamic webmentions fetching
- `_data/tag-descriptions.json` - Tag metadata for archive pages

### Important Environment Variables
When working with newsletter functionality:
- `RESEND_API_KEY` - For email sending
- `RESEND_AUDIENCE_ID` - For subscriber management
- `URL` - Site URL for proper link generation

## Development Guidelines

### Content Creation
- Use Netlify CMS at `/admin/` for content management
- Images should be co-located with posts for proper processing
- Tag posts appropriately - `posts` tag is required for all blog entries
- Author slugs must match `_data/authors.json` entries exactly

### Code Organization
- Custom filters belong in `_config/filters.js`
- Template logic goes in `_includes/` with appropriate subfolder structure
- Client-side JavaScript in `public/js/` with specific feature modules
- Netlify Functions in `netlify/functions/` for serverless functionality

### Performance Considerations
- Image optimization runs on every build - use `optimize-new-images` for development
- Service worker caches aggressively - clear cache when testing major changes
- Critical CSS is inlined automatically for above-fold content
- Development server has hot reload for CSS/JS changes

## Deployment

The site auto-deploys to Netlify on pushes to main branch. The build process:
1. Runs image optimization
2. Generates static site with Eleventy
3. Deploys with Netlify Functions for newsletter/admin functionality

Key deployment files:
- `netlify.toml` - Netlify configuration
- `public/admin/config.yml` - Netlify CMS configuration
- Environment variables must be set in Netlify dashboard for newsletter features

## Common Tasks

### Adding a New Author
1. Add entry to `_data/authors.json` with theme colors
2. Add corresponding CSS theme in appropriate stylesheet
3. Author page will be auto-generated on next build

### Newsletter Management
- Test newsletters via `/admin/newsletter-test/` (requires authentication)
- Scheduled digests run automatically via Netlify Functions
- Manual triggers available through admin interface

### Performance Debugging
- Use `npm run debug` for Eleventy-specific issues  
- Check `public/js/analytics.js` for performance metrics
- Service worker logs available in browser developer tools