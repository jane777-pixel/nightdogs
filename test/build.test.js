#!/usr/bin/env node

/**
 * Build test for nightdogs.xyz
 * Ensures the Eleventy build process works correctly
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export function testBuildProcess() {
  console.log('🏗️  Testing build process...');

  try {
    // Clean any existing build
    if (fs.existsSync('_site')) {
      fs.rmSync('_site', { recursive: true });
    }

    // Run build
    console.log('   Building site...');
    const buildOutput = execSync('npm run build-fast', {
      encoding: 'utf8',
      stdio: 'pipe'
    });

    // Verify essential files exist
    const requiredFiles = [
      '_site/index.html',
      '_site/blog/index.html',
      '_site/feed/feed.xml',
      '_site/feeds.html',
      '_site/search-index.json'
    ];

    console.log('   Checking required files...');
    const missingFiles = [];

    requiredFiles.forEach(file => {
      if (!fs.existsSync(file)) {
        missingFiles.push(file);
      } else {
        console.log(`   ✅ ${file}`);
      }
    });

    if (missingFiles.length > 0) {
      throw new Error(`Required files missing: ${missingFiles.join(', ')}`);
    }

    // Check that pages have basic structure
    console.log('   Validating HTML structure...');
    const indexContent = fs.readFileSync('_site/index.html', 'utf8');

    if (!indexContent.includes('<html')) {
      throw new Error('Index page missing HTML structure');
    }

    if (!indexContent.includes('nightdogs')) {
      throw new Error('Index page missing site title');
    }

    // Check RSS feed is valid XML
    console.log('   Validating RSS feed...');
    const feedContent = fs.readFileSync('_site/feed/feed.xml', 'utf8');

    if (!feedContent.includes('<?xml')) {
      throw new Error('RSS feed is not valid XML');
    }

    if (!feedContent.includes('<rss') && !feedContent.includes('<feed')) {
      throw new Error('RSS feed missing feed structure');
    }

    // Check search index is valid JSON
    console.log('   Validating search index...');
    const searchContent = fs.readFileSync('_site/search-index.json', 'utf8');
    const searchData = JSON.parse(searchContent); // Will throw if invalid JSON

    if (!Array.isArray(searchData)) {
      throw new Error('Search index is not an array');
    }

    console.log('✅ Build test passed');
    return true;

  } catch (error) {
    console.error('❌ Build test failed:', error.message);
    return false;
  }
}

// Run if called directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const success = testBuildProcess();
  process.exit(success ? 0 : 1);
}
