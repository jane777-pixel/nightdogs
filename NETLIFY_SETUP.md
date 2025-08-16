# 🫘 Netlify Identity & Resend API Setup Guide

This guide covers setting up Netlify Identity for admin authentication and configuring the Resend API for the "Beans in Your Inbox" newsletter.

## Part 1: Netlify Identity Setup

### 1.1 Enable Netlify Identity

1. **Go to your Netlify site dashboard**
   - Navigate to `https://app.netlify.com/sites/[your-site-name]/`

2. **Enable Identity**
   - Go to **Site settings** → **Identity**
   - Click **Enable Identity**

3. **Configure Registration**
   - Under **Registration preferences**, select **Invite only**
   - This prevents random people from creating admin accounts

4. **Configure External Providers (Optional)**
   - You can enable Google, GitHub, etc. for easier login
   - Go to **Identity** → **External providers**
   - Enable desired providers

### 1.2 Invite Yourself as Admin

1. **Go to Identity tab**
   - In your Netlify dashboard, click **Identity**

2. **Invite a user**
   - Click **Invite users**
   - Enter your email address
   - Click **Send**

3. **Accept the invitation**
   - Check your email for the invitation
   - Click the link and set your password
   - You're now an admin user!

### 1.3 Configure Identity Settings

Add these settings to your `netlify.toml`:

```toml
[build.environment]
# ... your existing env vars

[[redirects]]
# ... your existing redirects

# Identity settings
[template.environment]
URL = "https://nightdogs.xyz"

# Enable identity for admin pages
[[headers]]
for = "/admin/*"
[headers.values]
X-Frame-Options = "DENY"
X-XSS-Protection = "1; mode=block"
```

## Part 2: Resend API Setup

### 2.1 Domain Verification in Resend

1. **Login to Resend Dashboard**
   - Go to [resend.com](https://resend.com)
   - Sign in to your account

2. **Add Your Domain**
   - Navigate to **Domains**
   - Click **Add Domain**
   - Enter `nightdogs.xyz`

3. **Add DNS Records**
   You'll need to add these DNS records to your domain:

   **SPF Record (TXT):**
   ```
   Name: @
   Value: v=spf1 include:_spf.resend.com ~all
   ```

   **DKIM Records (CNAME):**
   ```
   Name: resend._domainkey
   Value: resend._domainkey.resend.com
   
   Name: resend2._domainkey  
   Value: resend2._domainkey.resend.com
   ```

   **DMARC Record (TXT):**
   ```
   Name: _dmarc
   Value: v=DMARC1; p=quarantine; rua=mailto:newsletter@nightdogs.xyz
   ```

4. **Wait for Verification**
   - DNS propagation can take up to 72 hours
   - Check the Resend dashboard for verification status

### 2.2 Create API Key and Audience

1. **Create API Key**
   - In Resend dashboard, go to **API Keys**
   - Click **Create API Key**
   - Name: "Nightdogs Newsletter"
   - Permission: **Full access** (or **Sending access** minimum)
   - Copy the key (starts with `re_`)

2. **Create Audience**
   - Go to **Audiences**
   - Click **Create Audience**
   - Name: "Beans in Your Inbox"
   - Copy the Audience ID (starts with `aud_`)

## Part 3: Environment Variables

### 3.1 Set Environment Variables in Netlify

1. **Go to Site Settings**
   - Navigate to **Site settings** → **Environment variables**

2. **Add These Variables**

   ```
   RESEND_API_KEY=re_your_actual_api_key_here
   RESEND_AUDIENCE_ID=aud_your_actual_audience_id_here
   URL=https://nightdogs.xyz
   ```

   **Important:** Don't include the old `ADMIN_KEY` - we're using Netlify Identity now!

### 3.2 Local Development

For local testing, create a `.env` file:

```bash
# .env (for local development)
RESEND_API_KEY=re_your_actual_api_key_here
RESEND_AUDIENCE_ID=aud_your_actual_audience_id_here
URL=http://localhost:8888
```

## Part 4: Testing the Setup

### 4.1 Test Newsletter Signup

1. **Deploy Your Changes**
   ```bash
   git add .
   git commit -m "Add newsletter system with Netlify Identity"
   git push
   ```

2. **Test the Signup Form**
   - Visit `https://nightdogs.xyz`
   - Find the "Beans in Your Inbox" signup
   - Enter your email and subscribe
   - Check your email for the welcome message

### 4.2 Test Admin Access

1. **Visit Admin Panel**
   - Go to `https://nightdogs.xyz/admin/newsletter/`
   - You should see the Netlify Identity login button

2. **Login**
   - Click "Login with Netlify Identity"
   - Use the email/password you set up earlier
   - You should now see the admin interface

3. **Test Digest Creation**
   - Create a test digest
   - Use your email as the test recipient
   - Send and verify you receive it

## Part 5: API Endpoint Details

Your newsletter system creates these API endpoints:

- `/.netlify/functions/newsletter-subscribe` - Handles subscriptions
- `/.netlify/functions/newsletter-unsubscribe` - Handles unsubscribes  
- `/.netlify/functions/send-digest` - Sends digest emails (requires auth)

### API Testing

Test subscription endpoint:
```bash
curl -X POST https://nightdogs.xyz/api/newsletter/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

## Part 6: Troubleshooting

### Common Issues

**"Identity not enabled" error:**
- Make sure you've enabled Identity in Netlify dashboard
- Check that the Identity widget script is loading

**"Domain not verified" in Resend:**
- Verify all DNS records are added correctly
- Wait up to 72 hours for DNS propagation
- Use DNS checker tools to verify records

**"Authentication failed" in admin:**
- Check that URL environment variable is set correctly
- Make sure you're using the email that was invited
- Try logging out and back in

**Emails not sending:**
- Verify Resend API key is correct
- Check Resend dashboard for error logs
- Ensure domain verification is complete

**Functions not working:**
- Check Netlify function logs in dashboard
- Verify environment variables are set
- Make sure `resend` package is installed

### Debug Steps

1. **Check Netlify Function Logs**
   - Go to **Functions** tab in Netlify dashboard
   - Click on a function to see recent logs

2. **Check Resend Dashboard**
   - View recent API calls and errors
   - Check delivery statistics

3. **Test Environment Variables**
   Add this temporary debug function to test your setup:

   ```javascript
   // netlify/functions/test-env.js
   export const handler = async (event, context) => {
     return {
       statusCode: 200,
       body: JSON.stringify({
         hasResendKey: !!process.env.RESEND_API_KEY,
         hasAudienceId: !!process.env.RESEND_AUDIENCE_ID,
         url: process.env.URL
       })
     };
   };
   ```

## Part 7: Security Best Practices

### Netlify Identity Security

- **Use invite-only registration**
- **Enable 2FA if available**
- **Regularly review user list**
- **Use role-based access when needed**

### API Security

- **Never expose API keys in frontend code**
- **Use environment variables for all secrets**
- **Monitor API usage in Resend dashboard**
- **Set up proper CORS headers**

### Email Security

- **Implement proper SPF/DKIM/DMARC**
- **Monitor bounce and complaint rates**
- **Use double opt-in if needed**
- **Include unsubscribe links**

## Part 8: Going Live Checklist

- [ ] Domain verified in Resend
- [ ] DNS records added and propagated
- [ ] Netlify Identity enabled and configured
- [ ] Admin user invited and confirmed
- [ ] Environment variables set in Netlify
- [ ] Test signup form works
- [ ] Test admin panel access
- [ ] Test email sending
- [ ] Test unsubscribe flow
- [ ] Monitor initial sends for issues

## Support Resources

- **Netlify Identity Docs**: https://docs.netlify.com/visitor-access/identity/
- **Resend Documentation**: https://resend.com/docs
- **Netlify Functions**: https://docs.netlify.com/functions/
- **DNS Propagation Checker**: https://dnschecker.org/

---

🫘 Happy transmitting! Your newsletter system should now be fully operational.