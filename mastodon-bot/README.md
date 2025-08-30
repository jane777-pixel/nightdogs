# Nightdogs Mastodon Bot

An automated Mastodon bot that monitors the nightdogs.xyz blog RSS feed and posts new blog entries to Mastodon.

## Features

- 🤖 Automatically posts new blog entries from nightdogs.xyz to Mastodon
- 📡 Monitors RSS/Atom feed for updates
- ⏰ Configurable check intervals
- 👥 Author attribution with optional Mastodon handles
- 🏷️ Automatic hashtag generation from post tags
- 🔄 Dry run mode for testing
- 💾 Persistent tracking to avoid duplicate posts
- 🛡️ Graceful error handling and retry logic

## Setup

### Prerequisites

- Node.js 18 or higher
- A Mastodon account
- Access to create applications on your Mastodon instance

### Installation

1. **Clone or navigate to the bot directory:**
   ```bash
   cd nightdogs/mastodon-bot
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create your environment file:**
   ```bash
   cp .env.example .env
   ```

4. **Get a Mastodon access token:**
   - Go to your Mastodon instance (e.g., https://mastodon.social)
   - Navigate to Settings → Development → Applications
   - Click "New Application"
   - Fill in the form:
     - **Application name**: `Nightdogs Bot` (or whatever you prefer)
     - **Application website**: `https://nightdogs.xyz`
     - **Scopes**: Check `write:statuses`
   - Click "Submit"
   - Copy the **access token** from the application page

5. **Configure the bot:**
   Edit the `.env` file with your settings:
   ```env
   MASTODON_URL=https://your-mastodon-instance.com
   MASTODON_ACCESS_TOKEN=your_access_token_here
   FEED_URL=https://nightdogs.xyz/feed/feed.xml
   DRY_RUN=false
   ```

### Configuration Options

| Variable | Description | Default |
|----------|-------------|---------|
| `MASTODON_URL` | Your Mastodon instance URL | `https://mastodon.social` |
| `MASTODON_ACCESS_TOKEN` | Your bot's access token | **Required** |
| `FEED_URL` | RSS/Atom feed URL to monitor | `https://nightdogs.xyz/feed/feed.xml` |
| `DRY_RUN` | Set to `true` to test without posting | `false` |
| `POST_LIMIT` | Maximum characters per post | `280` |
| `CHECK_INTERVAL` | How often to check for new posts (cron format) | `*/30 * * * *` |
| `AUTHOR_HANDLES` | JSON mapping of authors to Mastodon handles | `{}` |

#### Author Handles Example

To mention authors in posts, set `AUTHOR_HANDLES` like this:
```env
AUTHOR_HANDLES={"orionlw": "@orion@mastodon.social", "adesse": "@adesse@fosstodon.org", "jane": "@jane@mas.to"}
```

#### Cron Schedule Examples

- `*/15 * * * *` - Every 15 minutes
- `0 */2 * * *` - Every 2 hours
- `0 9,17 * * *` - At 9 AM and 5 PM daily
- `0 10 * * 1` - Every Monday at 10 AM

## Usage

### Testing (Dry Run)

Before going live, test the bot with dry run mode:

```bash
# Set DRY_RUN=true in .env, then:
npm start
```

This will show you what posts would be created without actually posting them.

### Running the Bot

**Continuous Mode (Local/Server):**
```bash
npm start
```

The bot will:
1. Connect to your Mastodon instance
2. Immediately check for new posts
3. Schedule regular checks based on your `CHECK_INTERVAL`
4. Continue running until you stop it with Ctrl+C

**Single Run Mode (GitHub Actions/Manual):**
```bash
npm run check-once
```

This mode:
1. Checks for new posts once
2. Posts any new content found
3. Exits immediately (perfect for GitHub Actions)

**Historical Backfill (Post All Previous Content):**
```bash
npm run backfill
```

This mode:
1. Posts all existing blog content chronologically
2. Respects rate limits with configurable delays
3. Can be run in batches and resumed

### Development Mode

For development with auto-restart on file changes:

```bash
npm run dev
```

## Deployment Options

### Option 1: VPS/Server (Continuous)

Run the bot on a VPS or server for continuous monitoring:

```bash
# Install PM2 for process management
npm install -g pm2

# Start the bot with PM2
pm2 start index.js --name "nightdogs-mastodon-bot"

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### Option 2: GitHub Actions (Automated - Recommended)

**Already set up!** The workflow is in `.github/workflows/mastodon-bot.yml`

**Features:**
- ✅ Runs every 30 minutes automatically
- ✅ Caches `posted-items.json` to prevent reposts
- ✅ Uses single-run mode (doesn't hang)
- ✅ No server maintenance required

**Setup:**
1. Add secrets in GitHub: Settings → Secrets → Actions
   - `MASTODON_URL`: Your Mastodon instance URL
   - `MASTODON_ACCESS_TOKEN`: Your bot's access token
   - `AUTHOR_HANDLES` (optional): Author handle mappings

**Caching:**
The workflow automatically caches the `posted-items.json` file using the content hash of your blog posts. This means:
- ✅ No duplicate posts even across workflow runs
- ✅ Cache updates when blog content changes
- ✅ Efficient and reliable state management

### Option 3: Railway/Render/Similar

Deploy to platforms like Railway or Render.com:

1. Connect your GitHub repo
2. Set the start command to: `cd mastodon-bot && npm start`
3. Add your environment variables in the platform's dashboard

## Post Format

Posts will be formatted like this:

```
📝 New post on nightdogs.xyz by @author:

"Post Title"

https://nightdogs.xyz/blog/author/2025-01-01/post-slug/

#music #books #knitting
```

## Files Created

- `posted-items.json` - Tracks which items have been posted (don't delete this!)
- `backfill-state.json` - Tracks historical backfill progress (temporary)
- `check-once.js` - Single-run version for GitHub Actions
- `backfill.js` - Historical content posting script

## Troubleshooting

### Bot won't start

- Check that `MASTODON_ACCESS_TOKEN` is set correctly
- Verify your Mastodon instance URL
- Make sure you have the right scopes (`write:statuses`)

### No posts are being created

- Check the feed URL is accessible: `curl https://nightdogs.xyz/feed/feed.xml`
- Look for new posts that haven't been posted before
- Check the `posted-items.json` file
- In GitHub Actions, check the workflow logs for errors
- Verify your GitHub secrets are set correctly

### Posts are truncated

- Increase `POST_LIMIT` if your Mastodon instance allows longer posts
- The bot automatically truncates long posts with "..."

### Rate limiting

- The bot includes delays between posts
- If you hit rate limits, increase `CHECK_INTERVAL` (continuous mode)
- For GitHub Actions, the 30-minute interval should prevent rate limits
- Use `BACKFILL_DELAY` to control backfill posting speed

## Contributing

1. Test changes with `DRY_RUN=true`
2. Follow the existing code style
3. Update this README if you add new features

## License

Same as the nightdogs project (check the main LICENSE file).