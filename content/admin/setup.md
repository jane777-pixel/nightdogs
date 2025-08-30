---
title: "Automated Systems Setup"
description: "Setup instructions for nightdogs automated systems"
permalink: /admin/setup/
eleventyExcludeFromCollections: true
---

# 🤖 Automated Systems Setup

This guide covers setting up the automated systems for nightdogs.xyz.

## 📧 Monthly Newsletter Digest

The automated monthly digest sends a beautiful newsletter on the last Sunday of each month featuring all posts from that month, grouped by author with their theme colors.

### Environment Variables Required

In your Netlify dashboard, go to **Site Settings → Environment Variables** and add:

```bash
RESEND_API_KEY=your_resend_api_key_here
RESEND_AUDIENCE_ID=your_resend_audience_id_here
```

### How It Works

- **Automatic**: Runs every Sunday at 9 AM UTC
- **Smart**: Only sends on the last Sunday of the month
- **Content**: Scans all blog posts from that month
- **Styling**: Uses each author's theme colors
- **Previews**: Includes actual post content previews

### Testing

Visit `/admin/newsletter-test/` to:
- Preview what would be sent
- Send test emails to yourself
- Generate digests for previous months

## 🔄 Daily Webmentions Refresh

Automatically rebuilds the site daily to fetch new webmentions and keep content fresh.

### Setup Build Hook

1. In Netlify dashboard: **Site Settings → Build & Deploy → Build Hooks**
2. Click **Add Build Hook**
3. Name: "Daily Webmentions Refresh"
4. Branch: "main" 
5. Copy the generated webhook URL
6. Add to environment variables:

```bash
NETLIFY_BUILD_HOOK_URL=https://api.netlify.com/build_hooks/your_hook_id_here
```

### How It Works

- **Automatic**: Runs every day at 2 AM UTC
- **Purpose**: Refreshes webmentions from webmention.io
- **Efficient**: Only rebuilds, doesn't redeploy unless content changed

## 🧪 Testing & Monitoring

### Newsletter Test Page
- **URL**: `/admin/newsletter-test/`
- **Features**: Preview, test emails, different months
- **Safe**: Won't send to subscribers unless you explicitly choose to

### Function Logs
Check Netlify function logs to monitor:
- Monthly digest execution
- Daily build triggers
- Any errors or issues

### Manual Triggers

You can manually trigger functions:

**Monthly Digest (preview)**:
```
/.netlify/functions/trigger-monthly-digest
```

**Monthly Digest (test email)**:
```
/.netlify/functions/trigger-monthly-digest?test_email=your@email.com
```

**Daily Build**:
```
/.netlify/functions/daily-build
```

## 🎯 System Status

### Active Automations

✅ **Monthly Newsletter**: Last Sunday of each month at 9 AM UTC  
✅ **Daily Builds**: Every day at 2 AM UTC for webmentions  
✅ **Newsletter Signup**: `/api/newsletter/subscribe`  
✅ **Newsletter Unsubscribe**: `/api/newsletter/unsubscribe`  

### Removed Systems

❌ Manual newsletter admin panels (replaced with automation)  
❌ Complex identity authentication (not needed anymore)  

## 🚨 Troubleshooting

### Newsletter Not Sending
1. Check environment variables are set
2. Verify Resend API key is valid
3. Check function logs in Netlify dashboard
4. Test with `/admin/newsletter-test/`

### Daily Builds Not Working
1. Verify build hook URL is correct
2. Check function logs for errors
3. Test manual trigger: `/.netlify/functions/daily-build`

### No Webmentions Updating
1. Confirm webmention.io is configured
2. Check if daily builds are running
3. Verify webmention endpoints in site head

## 📝 Notes

- All systems are designed to be zero-maintenance once configured
- Newsletter automatically adapts to new authors and theme changes  
- Daily builds are lightweight and won't impact site performance
- Test functions are safe and won't affect production subscribers

---

**Need help?** Check the function logs in your Netlify dashboard or test individual components using the URLs above.