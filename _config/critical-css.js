import fs from 'fs';
import path from 'path';

/**
 * Critical CSS system for 11ty
 * Extracts and inlines critical CSS for improved page load performance
 */

export default function criticalCSS(eleventyConfig) {
  // Read base critical CSS
  const baseCriticalCSS = `
    /* Critical CSS - Above the fold styles */
    *,
    *::before,
    *::after {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 0;
      font-family: var(--font-body);
      line-height: 1.6;
      color: var(--color-text);
      background-color: var(--color-bg);
    }

    /* Skip link for accessibility */
    .skip-link {
      position: absolute;
      top: -40px;
      left: 6px;
      background: var(--color-primary);
      color: var(--color-bg);
      padding: 8px;
      text-decoration: none;
      z-index: 100;
    }

    .skip-link:focus {
      top: 6px;
    }

    /* Header styles */
    header {
      background: var(--color-bg);
      border-bottom: 2px solid var(--color-primary);
      padding: 1rem 0;
    }

    .header-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .site-title {
      font-family: var(--font-header);
      font-size: 2rem;
      font-weight: bold;
      color: var(--color-primary);
      text-decoration: none;
      margin: 0;
    }

    /* Navigation */
    nav ul {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      gap: 1rem;
    }

    nav a {
      color: var(--color-text);
      text-decoration: none;
      padding: 0.5rem;
      border-radius: 4px;
      transition: background-color 0.2s ease;
    }

    nav a:hover,
    nav a:focus {
      background-color: var(--color-primary);
      color: var(--color-bg);
    }

    /* Main content */
    main {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }

    /* Typography */
    h1, h2, h3, h4, h5, h6 {
      font-family: var(--font-header);
      color: var(--color-primary);
      margin-top: 0;
      margin-bottom: 0.5rem;
    }

    h1 {
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }

    h2 {
      font-size: 2rem;
      margin-top: 2rem;
    }

    p {
      margin-bottom: 1rem;
    }

    /* Links */
    a {
      color: var(--color-primary);
      transition: color 0.2s ease;
    }

    a:hover,
    a:focus {
      color: var(--color-muted);
    }

    /* Loading states to prevent CLS */
    .posts-list {
      min-height: 300px;
    }

    .post-preview {
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--color-primary);
    }

    /* Author themes will be injected here */
  `;

  // Generate theme-specific critical CSS
  function generateAuthorCriticalCSS(authorData) {
    const themes = {};

    Object.entries(authorData).forEach(([slug, author]) => {
      const theme = author.theme;
      if (!theme) return;

      const lightTheme = theme.light || {};
      const darkTheme = theme.dark || {};
      const fonts = theme.fonts || {};

      themes[slug] = `
        /* ${author.name} theme */
        [data-author="${slug}"] {
          --color-bg: ${lightTheme.background || '#ffffff'};
          --color-text: ${lightTheme.color || '#333333'};
          --color-primary: ${lightTheme.primary || '#0066cc'};
          --color-muted: ${lightTheme.muted || '#666666'};
          --font-body: ${fonts.body || 'system-ui, sans-serif'};
          --font-header: ${fonts.header || 'system-ui, sans-serif'};
          --font-mono: ${fonts.mono || 'monospace'};
        }

        @media (prefers-color-scheme: dark) {
          [data-author="${slug}"] {
            --color-bg: ${darkTheme.background || '#1a1a1a'};
            --color-text: ${darkTheme.color || '#ffffff'};
            --color-primary: ${darkTheme.primary || '#4da6ff'};
            --color-muted: ${darkTheme.muted || '#cccccc'};
          }
        }

        [data-author="${slug}"][data-theme="dark"] {
          --color-bg: ${darkTheme.background || '#1a1a1a'};
          --color-text: ${darkTheme.color || '#ffffff'};
          --color-primary: ${darkTheme.primary || '#4da6ff'};
          --color-muted: ${darkTheme.muted || '#cccccc'};
        }
      `;
    });

    return Object.values(themes).join('\n');
  }

  // Add shortcode for critical CSS
  eleventyConfig.addShortcode('criticalCSS', function(author) {
    try {
      // Read authors data
      const authorsPath = path.join(process.cwd(), '_data/authors.json');
      const authorsData = JSON.parse(fs.readFileSync(authorsPath, 'utf8'));

      // Generate complete critical CSS
      const authorThemes = generateAuthorCriticalCSS(authorsData);
      const completeCriticalCSS = baseCriticalCSS + '\n' + authorThemes;

      // Minify the CSS (simple minification)
      const minified = completeCriticalCSS
        .replace(/\/\*.*?\*\//gs, '') // Remove comments
        .replace(/\s+/g, ' ') // Collapse whitespace
        .replace(/;\s}/g, '}') // Remove trailing semicolons
        .replace(/\s*{\s*/g, '{') // Clean braces
        .replace(/\s*}\s*/g, '}')
        .replace(/\s*;\s*/g, ';') // Clean semicolons
        .replace(/\s*,\s*/g, ',') // Clean commas
        .trim();

      return `<style>${minified}</style>`;
    } catch (error) {
      console.warn('Error generating critical CSS:', error);
      return '<!-- Critical CSS generation failed -->';
    }
  });

  // Add filter to check if CSS should be loaded async
  eleventyConfig.addFilter('isCSSSelectorUsed', function(selector, content) {
    if (!content || typeof content !== 'string') return false;

    // Basic check if selector patterns appear in content
    const patterns = [
      selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), // Escape regex chars
      selector.replace('.', 'class="'),
      selector.replace('#', 'id="')
    ];

    return patterns.some(pattern => content.includes(pattern));
  });

  // Add transform to preload critical fonts
  eleventyConfig.addTransform('preloadFonts', function(content, outputPath) {
    if (!outputPath || !outputPath.endsWith('.html')) return content;

    // Extract font families from content
    const fontMatches = content.match(/font-family:\s*([^;}]+)/g) || [];
    const fonts = new Set();

    fontMatches.forEach(match => {
      const family = match.replace('font-family:', '').trim();
      // Extract quoted font names
      const quotedFonts = family.match(/"([^"]+)"/g);
      if (quotedFonts) {
        quotedFonts.forEach(font => {
          fonts.add(font.replace(/"/g, ''));
        });
      }
    });

    // Generate preload tags for web fonts
    const fontPreloads = Array.from(fonts)
      .filter(font => !['system-ui', 'sans-serif', 'serif', 'monospace'].includes(font))
      .map(font => {
        const fontFile = font.toLowerCase().replace(/\s+/g, '-');
        return `<link rel="preload" href="/fonts/${fontFile}.woff2" as="font" type="font/woff2" crossorigin>`;
      })
      .join('\n  ');

    if (fontPreloads) {
      return content.replace('</head>', `  ${fontPreloads}\n</head>`);
    }

    return content;
  });

  // Add global data for CSS optimization
  eleventyConfig.addGlobalData('criticalCSS', {
    enabled: process.env.NODE_ENV === 'production',
    inlineThreshold: 14000 // 14KB threshold for inlining
  });
}

// Helper function to determine if CSS should be inlined
export function shouldInlineCSS(cssSize, threshold = 14000) {
  return cssSize < threshold;
}

// Helper function to extract critical CSS selectors
export function extractCriticalSelectors(html) {
  const selectors = new Set();

  // Extract classes
  const classMatches = html.match(/class="([^"]+)"/g) || [];
  classMatches.forEach(match => {
    const classes = match.replace('class="', '').replace('"', '').split(' ');
    classes.forEach(cls => {
      if (cls.trim()) selectors.add(`.${cls.trim()}`);
    });
  });

  // Extract IDs
  const idMatches = html.match(/id="([^"]+)"/g) || [];
  idMatches.forEach(match => {
    const id = match.replace('id="', '').replace('"', '');
    if (id.trim()) selectors.add(`#${id.trim()}`);
  });

  return Array.from(selectors);
}
