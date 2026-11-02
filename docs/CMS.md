# Writing for nightdogs

The editor lives at **https://nightdogs.xyz/admin/**. It works on phones too.

## Signing in

1. You need a free GitHub account, and Jane needs to add you to the
   `jane777-pixel/nightdogs` repository (GitHub → repo → Settings →
   Collaborators).
2. Go to `/admin/` and choose **Sign in with GitHub**. A small window opens;
   approve it once and you're in.

## Writing a post

1. **Blog posts → New Blog post.**
2. Fill in the **Title**, pick yourself as **Author**, and write in **Body**.
3. Press **Save**. The post goes live in a couple of minutes, once the site
   rebuilds.

Want to save something without publishing it yet? Turn on **Draft**. Turn it
off and save again when it's ready.

## Photos

- Use the **image button** in the Body toolbar to add a photo. You can pick
  several at once.
- Photos straight off a phone are fine, including iPhone HEIC photos. The
  editor shrinks them and converts them to a web-friendly format before
  uploading, so posts load quickly.
- **Alt text**: a short description for people who can't see the photo,
  e.g. "a grey cat asleep on a wool blanket". Please fill this in.
- **Title**: becomes a **caption** shown under the photo. Leave it empty for
  no caption.
- Photos placed one after another are grouped together.

### Column or grid?

Set **Photo layout** on the post:

- **Column**: each photo full width, one after another. Good for a few
  photos mixed in with writing.
- **Grid**: thumbnails side by side. Good for big batches of pictures.

Either way, readers can tap a photo to see it full size and swipe through
the rest.

## Your author profile

**Site settings → Authors** has your name, bio, links and colours. Choose
colours with strong contrast between the background and the text, so posts
stay easy to read.

---

## One-time setup (site admin)

These steps only need doing once.

1. **Create a GitHub OAuth App**: GitHub → Settings → Developer settings →
   OAuth Apps → New OAuth App.
   - Homepage URL: `https://nightdogs.xyz`
   - Authorization callback URL: `https://nightdogs.xyz/api/cms-auth/callback`
2. Copy the **Client ID**, generate a **Client secret**, and add both in
   Netlify → Site configuration → Environment variables:
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
3. Redeploy the site.
4. Netlify Identity and Git Gateway are no longer used and can be disabled.

The sign-in code lives in `netlify/functions/cms-auth.js`. The editor
configuration is `public/admin/config.yml`.
