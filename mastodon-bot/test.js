import { createRestAPIClient } from 'masto';
import FeedParser from 'feedparser';
import fetch from 'node-fetch';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const CONFIG = {
  MASTODON_URL: process.env.MASTODON_URL || 'https://mastodon.social',
  MASTODON_ACCESS_TOKEN: process.env.MASTODON_ACCESS_TOKEN,
  FEED_URL: process.env.FEED_URL || 'https://nightdogs.xyz/feed/feed.xml',
  AUTHOR_HANDLES: JSON.parse(process.env.AUTHOR_HANDLES || '{}'),
  POST_LIMIT: parseInt(process.env.POST_LIMIT || '280'),
};

class BotTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  test(name, testFn) {
    console.log(`🧪 Testing: ${name}`);
    try {
      const result = testFn();
      if (result === true || (result && result.then)) {
        this.results.passed++;
        this.results.tests.push({ name, status: 'PASS' });
        console.log(`✅ PASS: ${name}`);
        return result;
      } else {
        throw new Error('Test returned false');
      }
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ name, status: 'FAIL', error: error.message });
      console.log(`❌ FAIL: ${name} - ${error.message}`);
      return false;
    }
  }

  async testAsync(name, testFn) {
    console.log(`🧪 Testing: ${name}`);
    try {
      const result = await testFn();
      if (result === true || result) {
        this.results.passed++;
        this.results.tests.push({ name, status: 'PASS' });
        console.log(`✅ PASS: ${name}`);
        return result;
      } else {
        throw new Error('Test returned false');
      }
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ name, status: 'FAIL', error: error.message });
      console.log(`❌ FAIL: ${name} - ${error.message}`);
      return false;
    }
  }

  async testConfiguration() {
    return this.test('Configuration loaded', () => {
      if (!CONFIG.MASTODON_ACCESS_TOKEN) {
        throw new Error('MASTODON_ACCESS_TOKEN not set');
      }
      if (!CONFIG.FEED_URL) {
        throw new Error('FEED_URL not set');
      }
      return true;
    });
  }

  async testFeedAccess() {
    return await this.testAsync('Feed accessibility', async () => {
      const response = await fetch(CONFIG.FEED_URL);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const contentType = response.headers.get('content-type');
      if (!contentType || (!contentType.includes('xml') && !contentType.includes('atom'))) {
        console.warn(`⚠️  Warning: Content-Type is '${contentType}', expected XML/Atom`);
      }
      return true;
    });
  }

  async testFeedParsing() {
    return await this.testAsync('Feed parsing', async () => {
      const response = await fetch(CONFIG.FEED_URL);
      const items = await this.parseFeed(response.body);

      if (items.length === 0) {
        throw new Error('No items found in feed');
      }

      console.log(`📄 Found ${items.length} items in feed`);

      // Check if items have required fields
      const firstItem = items[0];
      if (!firstItem.title) {
        throw new Error('Feed items missing title');
      }
      if (!firstItem.link) {
        throw new Error('Feed items missing link');
      }

      return true;
    });
  }

  async testPostFormatting() {
    return await this.testAsync('Post formatting', async () => {
      // Create a mock feed item
      const mockItem = {
        title: 'Test Post Title',
        link: 'https://nightdogs.xyz/blog/test/2025-01-01/test-post/',
        author: 'orionlw',
        categories: ['posts', 'music', 'test'],
        pubDate: new Date().toISOString(),
        guid: 'test-item-123'
      };

      const content = this.formatPostContent(mockItem);

      if (!content) {
        throw new Error('No content generated');
      }

      if (content.length > CONFIG.POST_LIMIT) {
        throw new Error(`Content too long: ${content.length} > ${CONFIG.POST_LIMIT}`);
      }

      console.log('📝 Generated post content:');
      console.log('---');
      console.log(content);
      console.log('---');

      return true;
    });
  }

  async testMastodonConnection() {
    return await this.testAsync('Mastodon connection', async () => {
      const masto = createRestAPIClient({
        url: CONFIG.MASTODON_URL,
        accessToken: CONFIG.MASTODON_ACCESS_TOKEN,
      });

      const account = await masto.v1.accounts.verifyCredentials();

      if (!account.username) {
        throw new Error('Could not verify Mastodon credentials');
      }

      console.log(`🐘 Connected as @${account.username} on ${CONFIG.MASTODON_URL}`);
      return true;
    });
  }

  // Helper methods (copied from main bot)
  parseFeed(feedStream) {
    return new Promise((resolve, reject) => {
      const items = [];
      const feedparser = new FeedParser();

      feedparser.on('error', reject);
      feedparser.on('readable', function() {
        let item;
        while (item = this.read()) {
          items.push(item);
        }
      });
      feedparser.on('end', () => resolve(items));

      feedStream.pipe(feedparser);
    });
  }

  formatPostContent(item) {
    const author = this.extractAuthor(item);
    const authorHandle = CONFIG.AUTHOR_HANDLES[author] || '';
    const authorText = authorHandle ? ` by ${authorHandle}` : (author ? ` by ${author}` : '');

    let content = `📝 New post on nightdogs.xyz${authorText}:\n\n"${item.title}"\n\n${item.link}`;

    const tags = this.extractTags(item);
    if (tags.length > 0) {
      const hashTags = tags
        .filter(tag => tag !== 'posts')
        .slice(0, 3)
        .map(tag => `#${tag.replace(/[^a-zA-Z0-9]/g, '')}`)
        .join(' ');

      if (hashTags) {
        content += `\n\n${hashTags}`;
      }
    }

    if (content.length > CONFIG.POST_LIMIT) {
      const truncated = content.substring(0, CONFIG.POST_LIMIT - 4) + '...';
      return truncated;
    }

    return content;
  }

  extractAuthor(item) {
    return item.author ||
           item['dc:creator'] ||
           (item.categories && item.categories.find(cat =>
             ['adesse', 'amelia', 'jane', 'nic', 'orionlw'].includes(cat.toLowerCase())
           )) ||
           '';
  }

  extractTags(item) {
    const tags = [];

    if (item.categories) {
      tags.push(...item.categories);
    }

    const content = (item.description || item.summary || '').toLowerCase();
    const commonTags = ['music', 'knitting', 'swimming', 'books', 'games', 'movies'];

    commonTags.forEach(tag => {
      if (content.includes(tag)) {
        tags.push(tag);
      }
    });

    return [...new Set(tags)];
  }

  printSummary() {
    console.log('\n🧪 Test Summary');
    console.log('================');
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📊 Total:  ${this.results.tests.length}`);

    if (this.results.failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.tests
        .filter(test => test.status === 'FAIL')
        .forEach(test => console.log(`   - ${test.name}: ${test.error}`));
    }

    if (this.results.failed === 0) {
      console.log('\n🎉 All tests passed! The bot should work correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please fix the issues before running the bot.');
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Nightdogs Mastodon Bot Tests\n');

    await this.testConfiguration();
    await this.testFeedAccess();
    await this.testFeedParsing();
    await this.testPostFormatting();

    // Only test Mastodon connection if token is provided
    if (CONFIG.MASTODON_ACCESS_TOKEN) {
      await this.testMastodonConnection();
    } else {
      console.log('⚠️  Skipping Mastodon connection test (no access token)');
    }

    this.printSummary();

    return this.results.failed === 0;
  }
}

// Run tests
const tester = new BotTester();
tester.runAllTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Test runner failed:', error.message);
    process.exit(1);
  });
