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

```bash
npm start
```

The bot will:
1. Connect to your Mastodon instance
2. Immediately check for new posts
3. Schedule regular checks based on your `CHECK_INTERVAL`
4. Continue running until you stop it with Ctrl+C

### Development Mode

For development with auto-restart on file changes:

```bash
npm run dev
```

## Deployment Options

### Option 1: VPS/Server

Run the bot on a VPS or server:

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

### Option 2: GitHub Actions

Create `.github/workflows/mastodon-bot.yml`:

```yaml
name: Mastodon Bot
on:
  schedule:
    - cron: '*/30 * * * *'  # Every 30 minutes
  workflow_dispatch:

jobs:
  post:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd mastodon-bot && npm ci
      - run: cd mastodon-bot && npm start
        env:
          MASTODON_URL: ${{ secrets.MASTODON_URL }}
          MASTODON_ACCESS_TOKEN: ${{ secrets.MASTODON_ACCESS_TOKEN }}
          FEED_URL: https://nightdogs.xyz/feed/feed.xml
```

Then add your secrets in GitHub: Settings → Secrets → Actions.

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

## Troubleshooting

### Bot won't start

- Check that `MASTODON_ACCESS_TOKEN` is set correctly
- Verify your Mastodon instance URL
- Make sure you have the right scopes (`write:statuses`)

### No posts are being created

- Check the feed URL is accessible: `curl https://nightdogs.xyz/feed/feed.xml`
- Look for new posts that haven't been posted before
- Check the `posted-items.json` file

### Posts are truncated

- Increase `POST_LIMIT` if your Mastodon instance allows longer posts
- The bot automatically truncates long posts with "..."

### Rate limiting

- The bot includes delays between posts
- If you hit rate limits, increase `CHECK_INTERVAL`

## Contributing

1. Test changes with `DRY_RUN=true`
2. Follow the existing code style
3. Update this README if you add new features

## License

Same as the nightdogs project (check the main LICENSE file).