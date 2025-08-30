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
  BACKFILL_STATE_FILE: path.join(process.cwd(), 'backfill-state.json'),
  DRY_RUN: process.env.DRY_RUN === 'true',
  POST_LIMIT: parseInt(process.env.POST_LIMIT || '280'),
  AUTHOR_HANDLES: JSON.parse(process.env.AUTHOR_HANDLES || '{}'),
  DELAY_BETWEEN_POSTS: parseInt(process.env.BACKFILL_DELAY || '10000'), // 10 seconds default
  MAX_POSTS_PER_RUN: parseInt(process.env.MAX_POSTS_PER_RUN || '10'), // Limit per run
};

class HistoricalBackfill {
  constructor() {
    this.masto = null;
    this.postedItems = this.loadPostedItems();
    this.backfillState = this.loadBackfillState();

    if (!CONFIG.MASTODON_ACCESS_TOKEN) {
      throw new Error('MASTODON_ACCESS_TOKEN environment variable is required');
    }

    this.initMastodon();
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

  loadBackfillState() {
    try {
      if (fs.existsSync(CONFIG.BACKFILL_STATE_FILE)) {
        const data = fs.readFileSync(CONFIG.BACKFILL_STATE_FILE, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.warn('Warning: Could not load backfill state file:', error.message);
    }
    return {
      completed: false,
      lastProcessedIndex: -1,
      totalItems: 0,
      postedCount: 0,
      skippedCount: 0,
      startTime: null,
    };
  }

  saveBackfillState() {
    try {
      const data = JSON.stringify(this.backfillState, null, 2);
      fs.writeFileSync(CONFIG.BACKFILL_STATE_FILE, data, 'utf8');
    } catch (error) {
      console.error('❌ Failed to save backfill state:', error.message);
    }
  }

  savePostedItems() {
    try {
      const data = JSON.stringify([...this.postedItems], null, 2);
      fs.writeFileSync(CONFIG.POSTED_FILE, data, 'utf8');
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
      return { id: 'dry-run', url: 'dry-run-url' };
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

  formatTimeElapsed(startTime) {
    const elapsed = Date.now() - startTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }

  async runBackfill() {
    try {
      console.log('🚀 Starting Historical Backfill for Nightdogs Mastodon Bot\n');
      console.log(`🧪 Dry run: ${CONFIG.DRY_RUN}`);
      console.log(`⏱️  Delay between posts: ${CONFIG.DELAY_BETWEEN_POSTS}ms`);
      console.log(`📊 Max posts per run: ${CONFIG.MAX_POSTS_PER_RUN}`);
      console.log('');

      // Initialize start time if this is a new backfill
      if (!this.backfillState.startTime) {
        this.backfillState.startTime = Date.now();
      }

      const feedStream = await this.fetchFeed();
      const items = await this.parseFeed(feedStream);

      console.log(`📄 Found ${items.length} items in feed`);

      // Sort by publication date (oldest first for historical backfill)
      items.sort((a, b) => new Date(a.pubDate) - new Date(b.pubDate));

      // Update total items count
      this.backfillState.totalItems = items.length;

      // Resume from where we left off
      const startIndex = this.backfillState.lastProcessedIndex + 1;
      const endIndex = Math.min(startIndex + CONFIG.MAX_POSTS_PER_RUN, items.length);

      console.log(`🔄 Processing items ${startIndex + 1}-${endIndex} of ${items.length}`);
      console.log(`📈 Progress: ${this.backfillState.postedCount} posted, ${this.backfillState.skippedCount} skipped\n`);

      if (startIndex >= items.length) {
        console.log('✨ Backfill already completed!');
        return;
      }

      let postsInThisRun = 0;

      for (let i = startIndex; i < endIndex; i++) {
        const item = items[i];
        const itemId = this.getItemId(item);

        console.log(`\n📝 Processing (${i + 1}/${items.length}): "${item.title}"`);
        console.log(`📅 Published: ${item.pubDate}`);

        if (this.postedItems.has(itemId)) {
          console.log('⏭️  Already posted, skipping...');
          this.backfillState.skippedCount++;
        } else {
          const content = this.formatPostContent(item);

          console.log('📮 Posting to Mastodon...');
          await this.postToMastodon(content);

          this.postedItems.add(itemId);
          this.backfillState.postedCount++;
          postsInThisRun++;

          // Add delay between posts to avoid rate limiting
          if (i < endIndex - 1) {
            console.log(`⏱️  Waiting ${CONFIG.DELAY_BETWEEN_POSTS}ms before next post...`);
            await new Promise(resolve => setTimeout(resolve, CONFIG.DELAY_BETWEEN_POSTS));
          }
        }

        this.backfillState.lastProcessedIndex = i;
        this.saveBackfillState();
      }

      // Save progress
      this.savePostedItems();

      // Check if we're done
      if (endIndex >= items.length) {
        this.backfillState.completed = true;
        this.saveBackfillState();

        console.log('\n🎉 Historical backfill completed!');
        console.log(`📊 Final stats:`);
        console.log(`   ✅ Posted: ${this.backfillState.postedCount} items`);
        console.log(`   ⏭️  Skipped: ${this.backfillState.skippedCount} items`);
        console.log(`   ⏱️  Total time: ${this.formatTimeElapsed(this.backfillState.startTime)}`);

        // Clean up state file
        if (fs.existsSync(CONFIG.BACKFILL_STATE_FILE)) {
          fs.unlinkSync(CONFIG.BACKFILL_STATE_FILE);
          console.log('🧹 Cleaned up backfill state file');
        }
      } else {
        console.log(`\n⏸️  Paused after ${postsInThisRun} posts this run`);
        console.log(`📊 Progress: ${endIndex}/${items.length} items processed`);
        console.log(`⏱️  Time elapsed: ${this.formatTimeElapsed(this.backfillState.startTime)}`);
        console.log('\n💡 Run the script again to continue backfill');
        console.log('   Or increase MAX_POSTS_PER_RUN to process more items per run');
      }

    } catch (error) {
      console.error('❌ Error during backfill:', error.message);
      console.log('💾 Progress has been saved. You can resume by running the script again.');
      process.exit(1);
    }
  }

  async reset() {
    console.log('🔄 Resetting backfill state...');

    // Remove state file
    if (fs.existsSync(CONFIG.BACKFILL_STATE_FILE)) {
      fs.unlinkSync(CONFIG.BACKFILL_STATE_FILE);
      console.log('✅ Removed backfill state file');
    }

    // Clear posted items (optional - ask user)
    console.log('⚠️  Do you want to clear the posted items list too?');
    console.log('   This will cause the regular bot to repost everything');
    console.log('   Run with --clear-posted-items if you want this');

    if (process.argv.includes('--clear-posted-items')) {
      if (fs.existsSync(CONFIG.POSTED_FILE)) {
        fs.unlinkSync(CONFIG.POSTED_FILE);
        console.log('✅ Cleared posted items list');
      }
    }

    console.log('🎯 Backfill reset complete. Run the script again to start fresh.');
  }
}

// Handle command line arguments
const command = process.argv[2];

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Start the backfill
try {
  const backfill = new HistoricalBackfill();

  if (command === 'reset') {
    await backfill.reset();
  } else {
    await backfill.runBackfill();
  }
} catch (error) {
  console.error('❌ Failed to start backfill:', error.message);
  process.exit(1);
}
