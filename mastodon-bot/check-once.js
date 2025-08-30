import { createRestAPIClient } from 'masto';
import FeedParser from 'feedparser';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const CONFIG = {
  MASTODON_URL: process.env.MASTODON_URL || 'https://mastodon.social',
  MASTODON_ACCESS_TOKEN: process.env.MASTODON_ACCESS_TOKEN,
  FEED_URL: process.env.FEED_URL || 'https://nightdogs.xyz/feed/feed.xml',
  POSTED_FILE: path.join(process.cwd(), 'posted-items.json'),
  DRY_RUN: process.env.DRY_RUN === 'true',
  POST_LIMIT: parseInt(process.env.POST_LIMIT || '280'),
  AUTHOR_HANDLES: JSON.parse(process.env.AUTHOR_HANDLES || '{}'),
};

class NightdogsMastodonBotSingleRun {
  constructor() {
    this.masto = null;
    this.postedItems = this.loadPostedItems();

    if (!CONFIG.MASTODON_ACCESS_TOKEN) {
      throw new Error('MASTODON_ACCESS_TOKEN environment variable is required');
    }
  }

  async initMastodon() {
    try {
      this.masto = createRestAPIClient({
        url: CONFIG.MASTODON_URL,
        accessToken: CONFIG.MASTODON_ACCESS_TOKEN,
      });

      // Test the connection
      const account = await this.masto.v1.accounts.verifyCredentials();
      console.log(`✅ Connected to Mastodon as @${account.username}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to connect to Mastodon:', error.message);
      throw error;
    }
  }

  loadPostedItems() {
    try {
      if (fs.existsSync(CONFIG.POSTED_FILE)) {
        const data = fs.readFileSync(CONFIG.POSTED_FILE, 'utf8');
        return new Set(JSON.parse(data));
      }
    } catch (error) {
      console.warn('Warning: Could not load posted items file:', error.message);
    }
    return new Set();
  }

  savePostedItems() {
    try {
      const data = JSON.stringify([...this.postedItems], null, 2);
      fs.writeFileSync(CONFIG.POSTED_FILE, data, 'utf8');
      console.log('💾 Saved posted items state');
    } catch (error) {
      console.error('❌ Failed to save posted items:', error.message);
    }
  }

  async fetchFeed() {
    try {
      console.log(`📡 Fetching feed from ${CONFIG.FEED_URL}...`);
      const response = await fetch(CONFIG.FEED_URL);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.body;
    } catch (error) {
      console.error('❌ Failed to fetch feed:', error.message);
      throw error;
    }
  }

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

    // Create base post content
    let content = `📝 New post on nightdogs.xyz${authorText}:\n\n"${item.title}"\n\n${item.link}`;

    // Add tags if available
    const tags = this.extractTags(item);
    if (tags.length > 0) {
      const hashTags = tags
        .filter(tag => tag !== 'posts') // Skip generic 'posts' tag
        .slice(0, 3) // Limit to 3 tags
        .map(tag => `#${tag.replace(/[^a-zA-Z0-9]/g, '')}`) // Clean tag names
        .join(' ');

      if (hashTags) {
        content += `\n\n${hashTags}`;
      }
    }

    // Truncate if too long
    if (content.length > CONFIG.POST_LIMIT) {
      const truncated = content.substring(0, CONFIG.POST_LIMIT - 4) + '...';
      return truncated;
    }

    return content;
  }

  extractAuthor(item) {
    // Try to extract author from various feed fields
    return item.author ||
           item['dc:creator'] ||
           (item.categories && item.categories.find(cat =>
             ['adesse', 'amelia', 'jane', 'nic', 'orionlw'].includes(cat.toLowerCase())
           )) ||
           '';
  }

  extractTags(item) {
    const tags = [];

    // Extract from categories
    if (item.categories) {
      tags.push(...item.categories);
    }

    // Extract from description/content (look for common tags)
    const content = (item.description || item.summary || '').toLowerCase();
    const commonTags = ['music', 'knitting', 'swimming', 'books', 'games', 'movies'];

    commonTags.forEach(tag => {
      if (content.includes(tag)) {
        tags.push(tag);
      }
    });

    return [...new Set(tags)]; // Remove duplicates
  }

  getItemId(item) {
    // Create a unique ID for each item
    return item.guid || item.link || `${item.title}-${item.pubDate}`;
  }

  async postToMastodon(content) {
    if (CONFIG.DRY_RUN) {
      console.log('🔄 DRY RUN - Would post:');
      console.log(content);
      console.log('---');
      return { id: 'dry-run' };
    }

    try {
      const status = await this.masto.v1.statuses.create({
        status: content,
        visibility: 'public',
      });

      console.log(`✅ Posted to Mastodon: ${status.url}`);
      return status;
    } catch (error) {
      console.error('❌ Failed to post to Mastodon:', error.message);
      throw error;
    }
  }

  async checkAndPost() {
    try {
      console.log('🔍 Checking for new posts (single run)...');

      // Initialize Mastodon connection
      await this.initMastodon();

      const feedStream = await this.fetchFeed();
      const items = await this.parseFeed(feedStream);

      console.log(`📄 Found ${items.length} items in feed`);

      // Sort by publication date (newest first)
      items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

      let newPosts = 0;

      for (const item of items) {
        const itemId = this.getItemId(item);

        if (!this.postedItems.has(itemId)) {
          console.log(`📮 New post found: "${item.title}"`);

          const content = this.formatPostContent(item);
          await this.postToMastodon(content);

          this.postedItems.add(itemId);
          newPosts++;

          // Add a small delay between posts to be respectful
          if (newPosts > 1) {
            console.log('⏱️ Waiting 5 seconds before next post...');
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
        }
      }

      if (newPosts > 0) {
        this.savePostedItems();
        console.log(`🎉 Posted ${newPosts} new items to Mastodon`);
      } else {
        console.log('✨ No new posts to share');
      }

      console.log('✅ Single run completed successfully');
      return { newPosts, totalChecked: items.length };

    } catch (error) {
      console.error('❌ Error during check and post:', error.message);
      process.exit(1);
    }
  }
}

// Run once and exit
async function main() {
  console.log('🤖 Starting Nightdogs Mastodon Bot (Single Run)');
  console.log(`🔗 Feed URL: ${CONFIG.FEED_URL}`);
  console.log(`🐘 Mastodon: ${CONFIG.MASTODON_URL}`);
  console.log(`🧪 Dry run: ${CONFIG.DRY_RUN}\n`);

  try {
    const bot = new NightdogsMastodonBotSingleRun();
    const result = await bot.checkAndPost();

    console.log('\n📊 Run Summary:');
    console.log(`   📮 New posts: ${result.newPosts}`);
    console.log(`   📄 Total checked: ${result.totalChecked}`);
    console.log('👋 Exiting...');

    process.exit(0);
  } catch (error) {
    console.error('❌ Bot failed:', error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Received SIGINT, exiting...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Received SIGTERM, exiting...');
  process.exit(0);
});

// Start the single run
main();
