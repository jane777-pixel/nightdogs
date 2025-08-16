# 🫘 Beans in Your Inbox Setup Guide

This guide will help you set up the "Beans in Your Inbox" newsletter using Resend.com for your nightdogs.xyz website.

## Overview

The newsletter system includes:
- **Newsletter signup component** - Minimal signup form integrated into your homepage
- **Resend.com integration** - Professional email delivery service
- **Admin interface** - Simple digest composer and sender
- **Welcome/goodbye emails** - Automated subscriber onboarding
- **Unsubscribe handling** - One-click unsubscribe functionality

## Step 1: Resend.com Setup

### 1.1 Create Resend Account
1. Go to [resend.com](https://resend.com) and sign up
2. Verify your email address
3. Complete the onboarding process

### 1.2 Domain Verification
1. In your Resend dashboard, go to **Domains**
2. Click **Add Domain** and enter `nightdogs.xyz`
3. Add the required DNS records to your domain:
   - **SPF Record**: Add TXT record with Resend's SPF value
   - **DKIM Records**: Add the CNAME records provided
   - **DMARC Record**: Add TXT record for `_dmarc.nightdogs.xyz`
4. Wait for verification (can take up to 72 hours)

### 1.3 Get API Key
1. Go to **API Keys** in your Resend dashboard
2. Click **Create API Key**
3. Name it "Nightdogs Newsletter"
4. Copy the API key (starts with `re_`)

### 1.4 Create Audience
1. Go to **Audiences** in your Resend dashboard
2. Click **Create Audience**
3. Name it "Beans in Your Inbox"
4. Copy the Audience ID (starts with `aud_`)

## Step 2: Environment Variables

### 2.1 Local Development
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your actual values in `.env`:
   ```env
   RESEND_API_KEY=re_your_actual_api_key_here
   RESEND_AUDIENCE_ID=aud_your_actual_audience_id_here
   ADMIN_KEY=your_secure_random_admin_key_here
   ```

### 2.2 Netlify Deployment
1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Add the following variables:
   - `RESEND_API_KEY`: Your Resend API key
   - `RESEND_AUDIENCE_ID`: Your Resend audience ID
   - `ADMIN_KEY`: A secure random string for admin access

## Step 3: Deploy and Test

### 3.1 Deploy to Netlify
1. Push your changes to your Git repository
2. Netlify will automatically deploy the new version
3. Wait for the build to complete

### 3.2 Test Newsletter Signup
1. Visit your live site at `https://nightdogs.xyz`
2. Scroll down to the "Beans in Your Inbox" signup form
3. Enter your email and click "Subscribe"
4. Check your email for the welcome message

### 3.3 Test Admin Interface
1. Go to `https://nightdogs.xyz/admin/newsletter/`
2. Enter your `ADMIN_KEY` to access the admin panel
3. Try composing a test digest (use the test email feature)

## Step 4: Creating Your First Digest

### 4.1 Access Admin Panel
1. Navigate to `/admin/newsletter/`
2. Log in with your admin key

### 4.2 Compose Digest
1. **Subject**: Keep it minimal like "🫘 Beans - [Date]"
2. **Introduction**: Brief, mysterious introduction
3. **Links**: Add 2-4 curated links related to music, sound, or art
4. **Sound Transmission**: Optional featured track or recording
5. **Footer Note**: Additional thoughts (keep minimal)

### 4.3 Send Strategy
- **Test first**: Always send to a test email before sending to all subscribers
- **Timing**: Consider when your audience is most active
- **Frequency**: Start with monthly or when you have good content
- **Consistency**: No strict schedule - send when inspired

## Content Ideas for Beans in Your Inbox

### Link Categories
- **Experimental music discoveries**
- **Sound art and installations**
- **Music theory and improvisation articles**
- **Artist interviews and profiles**
- **Recording techniques and equipment**
- **Live performance videos**
- **Music technology and software**
- **Related art and creative practices**

### Sound Transmission Ideas
- **Featured track from the collective**
- **Field recordings**
- **Collaborations with other artists**
- **Live performance excerpts**
- **Experimental compositions**
- **Sound sketches and drafts**

### Tone and Voice
- Keep copy minimal and mysterious
- Let the content speak for itself
- Maintain an air of intrigue
- Focus on discovery and exploration
- Less explanation, more experience

## Troubleshooting

### Common Issues

**Newsletter signup not working:**
- Check that environment variables are set correctly in Netlify
- Verify your Resend domain is verified
- Check browser console for JavaScript errors

**Admin panel won't load:**
- Ensure you're using the correct admin key
- Check that the admin key environment variable is set

**Emails not sending:**
- Verify your Resend API key is valid
- Check your Resend account hasn't hit sending limits
- Ensure your domain verification is complete

**Subscribers not receiving emails:**
- Check Resend dashboard for bounce/complaint reports
- Verify audience ID is correct
- Test with a different email address

### API Endpoint Testing

Test the newsletter subscription endpoint directly:
```bash
curl -X POST https://nightdogs.xyz/api/newsletter/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### Logs and Debugging

1. Check Netlify function logs:
   - Go to Netlify dashboard → Functions
   - Click on the newsletter functions to see logs

2. Monitor Resend dashboard:
   - Check delivery statistics
   - Review any error reports

## Best Practices

### Content Strategy
- **Quality over quantity**: Only send when you have something worth sharing
- **Curation**: Focus on discovery and introduction to new sounds
- **Minimal copy**: Let the content speak
- **Mysterious**: Maintain intrigue and mystery

### Technical Maintenance
- **Regular backups**: Save successful digest templates
- **Monitor metrics**: Track open rates, click rates, unsubscribes
- **Update dependencies**: Keep Resend SDK and other packages updated
- **Security**: Regularly rotate admin keys

### Growth Strategy
- **Word of mouth**: Let subscribers share naturally
- **Performance integration**: Mention at live shows
- **Collaboration**: Cross-promote with other artists
- **Organic**: Avoid aggressive marketing tactics

## Future Enhancements

Consider these additions as your newsletter grows:

1. **Audio embeds**: Direct streaming within emails
2. **Event announcements**: Show and performance notifications
3. **Collaboration features**: Guest curations
4. **Archive page**: Public archive of past transmissions
5. **RSS integration**: Automatically include latest posts
6. **Segmentation**: Different content for different audiences

## Support and Resources

- **Resend Documentation**: [https://resend.com/docs](https://resend.com/docs)
- **Netlify Functions**: [https://docs.netlify.com/functions/](https://docs.netlify.com/functions/)
- **Email Best Practices**: Focus on deliverability and engagement

---

Happy transmitting! 🫘🎵

Remember: The best newsletters are authentic and valuable. Start simple and let it evolve organically.