# Testing Strategy for nightdogs.xyz

This document outlines testing approaches for the nightdogs.xyz multi-author blog built with Eleventy.

## Current Testing Status

❌ **No automated testing currently implemented**

The project would benefit from testing to ensure:
- Build process works correctly
- Content generation functions properly
- JavaScript features work across browsers
- Links and images are valid
- Performance requirements are met

## Recommended Testing Approach

### 1. Build Testing (Highest Priority)
**Framework:** Native Node.js + npm scripts
**Purpose:** Ensure the Eleventy build process works correctly

```javascript
// test/build.test.js
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export function testBuildProcess() {
  try {
    // Test clean build
    execSync('npm run build', { stdio: 'pipe' });
    
    // Verify essential files exist
    const requiredFiles = [
      '_site/index.html',
      '_site/blog/index.html',
      '_site/feed/feed.xml',
      '_site/search-index.json'
    ];
    
    requiredFiles.forEach(file => {
      if (!fs.existsSync(file)) {
        throw new Error(`Required file missing: ${file}`);
      }
    });
    
    console.log('✅ Build test passed');
    return true;
  } catch (error) {
    console.error('❌ Build test failed:', error.message);
    return false;
  }
}
```

### 2. Content Validation (High Priority)
**Framework:** Zod (already in dependencies) + custom validators
**Purpose:** Validate post frontmatter and content structure

```javascript
// test/content-validation.test.js
import { z } from 'zod';
import matter from 'gray-matter';
import fs from 'fs';
import { glob } from 'glob';

const PostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.enum(['jane', 'orionlw', 'adesse', 'nic', 'amelia', 'abby', 'ewan']),
  date: z.string().datetime("Invalid date format"),
  tags: z.array(z.string()).refine(tags => tags.includes('posts'), "Must include 'posts' tag"),
  collaborators: z.array(z.string()).optional(),
  series: z.string().optional(),
  seriesPart: z.number().optional()
});

export async function validateAllPosts() {
  const posts = await glob('content/blog/**/index.md');
  let errors = 0;
  
  for (const post of posts) {
    try {
      const content = fs.readFileSync(post, 'utf8');
      const { data } = matter(content);
      PostSchema.parse(data);
      console.log(`✅ ${post}`);
    } catch (error) {
      console.error(`❌ ${post}:`, error.message);
      errors++;
    }
  }
  
  return errors === 0;
}
```

### 3. Link and Image Validation (Medium Priority)
**Framework:** Custom Node.js scripts
**Purpose:** Ensure all links work and images exist

```javascript
// test/links-images.test.js
import fs from 'fs';
import { glob } from 'glob';
import { JSDOM } from 'jsdom';

export async function validateLinks() {
  const htmlFiles = await glob('_site/**/*.html');
  let brokenLinks = [];
  
  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, 'utf8');
    const dom = new JSDOM(html);
    const links = dom.window.document.querySelectorAll('a[href^="/"], img[src^="/"]');
    
    links.forEach(element => {
      const url = element.href || element.src;
      const filePath = url.replace(/^\//, '_site/');
      
      if (!fs.existsSync(filePath)) {
        brokenLinks.push({ file, url });
      }
    });
  }
  
  if (brokenLinks.length > 0) {
    console.error('❌ Broken links found:', brokenLinks);
    return false;
  }
  
  console.log('✅ All internal links valid');
  return true;
}
```

### 4. JavaScript Unit Testing (Medium Priority)
**Framework:** Vitest (modern, fast, ESM-friendly)
**Purpose:** Test client-side JavaScript functionality

```javascript
// test/search.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';

describe('Search functionality', () => {
  let dom, document, window;
  
  beforeEach(() => {
    dom = new JSDOM(`
      <div id="search-overlay"></div>
      <button data-search-trigger>Search</button>
    `);
    document = dom.window.document;
    window = dom.window;
    global.document = document;
    global.window = window;
  });

  it('should initialize search overlay', () => {
    // Import and test search functionality
    // This would test the SimpleSearch class
    expect(document.getElementById('search-overlay')).toBeTruthy();
  });
});
```

### 5. Performance Testing (Lower Priority)
**Framework:** Lighthouse CI
**Purpose:** Ensure performance standards are maintained

```javascript
// test/performance.test.js
import { execSync } from 'child_process';

export async function testPerformance() {
  try {
    // Run Lighthouse CI on key pages
    const pages = [
      'http://localhost:8080/',
      'http://localhost:8080/blog/',
      'http://localhost:8080/explore/'
    ];
    
    for (const page of pages) {
      const result = execSync(`npx lhci autorun --url=${page}`, { 
        encoding: 'utf8', 
        stdio: 'pipe' 
      });
      
      // Parse results and check thresholds
      console.log(`✅ Performance test passed for ${page}`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Performance test failed:', error.message);
    return false;
  }
}
```

## Implementation Plan

### Phase 1: Essential Testing (Week 1)
```bash
npm install --save-dev vitest jsdom
```

Add to `package.json`:
```json
{
  "scripts": {
    "test": "node test/run-tests.js",
    "test:build": "node test/build.test.js",
    "test:content": "node test/content-validation.test.js",
    "test:links": "node test/links-images.test.js"
  }
}
```

### Phase 2: JavaScript Testing (Week 2)
- Set up Vitest for client-side JavaScript
- Test search functionality
- Test theme switching
- Test social sharing

### Phase 3: Performance & Integration (Week 3)
- Add Lighthouse CI
- Set up automated testing in GitHub Actions
- Create performance budgets

## Recommended Test Runner Script

```javascript
// test/run-tests.js
import { testBuildProcess } from './build.test.js';
import { validateAllPosts } from './content-validation.test.js';
import { validateLinks } from './links-images.test.js';

async function runAllTests() {
  console.log('🧪 Running nightdogs.xyz test suite\n');
  
  const tests = [
    { name: 'Build Process', fn: testBuildProcess },
    { name: 'Content Validation', fn: validateAllPosts },
    { name: 'Links & Images', fn: validateLinks }
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const test of tests) {
    console.log(`Running ${test.name}...`);
    const result = await test.fn();
    if (result) passed++;
    console.log('');
  }
  
  console.log(`\n📊 Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('💥 Some tests failed');
    process.exit(1);
  }
}

runAllTests().catch(console.error);
```

## GitHub Actions Integration

```yaml
# .github/workflows/test.yml
name: Test nightdogs.xyz

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build site
      run: npm run build
      
    - name: Run Lighthouse CI
      run: |
        npm install -g @lhci/cli@0.12.x
        lhci autorun
```

## Benefits of This Testing Strategy

1. **Fast Feedback**: Build and content validation catch issues quickly
2. **Prevents Broken Deploys**: Link validation prevents 404s
3. **Maintains Quality**: Performance testing ensures site remains fast
4. **Developer Confidence**: Automated testing reduces manual QA
5. **Low Maintenance**: Uses existing dependencies where possible

## Getting Started

To implement basic testing immediately:

1. Create the `test/` directory
2. Add the build test script
3. Add content validation
4. Set up npm test script
5. Run tests before each deployment

This approach provides maximum benefit with minimal overhead, perfect for a personal/small team blog project.