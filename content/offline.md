---
title: You're Offline
permalink: /offline/
eleventyExcludeFromCollections: true
---

# 🐾 You're Offline

**Don't worry!** You can still browse cached pages from nightdogs.xyz while you're not connected to the internet.

## What You Can Do

- **Go back** to the previous page using your browser's back button
- **Check your connection** and try refreshing the page
- **Browse cached posts** if you've visited them before

## Recent Posts (if cached)

The posts you've recently visited should still be available offline. Try navigating back to pages you've already loaded.

## About nightdogs

nightdogs is a multi-author blog featuring:
- 🐱 **Jane** - horses, cats, concrete, and fibre arts
- 🎵 **Orion** - music, bass, and commuter adventures  
- 🌻 **Adèsse** - creative writing and life updates
- 🎬 **Nic** - movies, music, and snow
- 🎨 **Amelia** - art and creativity
- 🌿 **Abby** - thoughtful perspectives
- 🥁 **Ewan** - drums, books, and more

---

*This page works offline thanks to our service worker. Once you're back online, everything will work normally again!*

<style>
.offline-page {
  text-align: center;
  padding: 2rem;
  max-width: 600px;
  margin: 0 auto;
}

.authors-list {
  text-align: left;
  margin: 1rem 0;
}

.paw-emoji {
  font-size: 2rem;
  margin: 1rem 0;
}
</style>

<script>
// Simple offline page functionality
document.addEventListener('DOMContentLoaded', function() {
  // Check if we're actually online now
  if (navigator.onLine) {
    const banner = document.createElement('div');
    banner.innerHTML = `
      <div style="background: #d4edda; color: #155724; padding: 1rem; border-radius: 4px; margin-bottom: 1rem;">
        🌐 You're back online! <a href="/">Return to nightdogs home</a>
      </div>
    `;
    document.querySelector('main').prepend(banner);
  }
  
  // Add a retry button
  const retryButton = document.createElement('button');
  retryButton.textContent = '🔄 Try Again';
  retryButton.style.cssText = `
    background: var(--color-primary, #b8002e);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-size: 1rem;
    cursor: pointer;
    margin: 1rem 0;
  `;
  
  retryButton.addEventListener('click', function() {
    window.location.reload();
  });
  
  // Insert retry button after the main heading
  const heading = document.querySelector('h1');
  if (heading) {
    heading.parentNode.insertBefore(retryButton, heading.nextSibling);
  }
});
</script>