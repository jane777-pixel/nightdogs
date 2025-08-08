// Service Worker for nightdogs.xyz
// Provides offline functionality and improved performance

const CACHE_NAME = 'nightdogs-v1.2.0';
const RUNTIME_CACHE = 'nightdogs-runtime';
const OFFLINE_PAGE = '/offline/';
const OFFLINE_IMAGE = '/img/offline-placeholder.svg';

// Assets to cache immediately
const PRECACHE_ASSETS = [
  '/',
  '/blog/',
  '/about/',
  '/css/index.css',
  '/css/fonts.css',
  '/fonts/bellefair-regular.woff2',
  '/fonts/bitcount-grid-single-regular.woff2',
  '/fonts/eb-garamond-regular.woff2',
  '/fonts/fira-sans-regular.woff2',
  '/fonts/jacquard-12-regular.woff2',
  '/img/favicon.ico',
  '/img/icon-192.png',
  '/img/icon-512.png',
  OFFLINE_PAGE
];

// Cache strategies for different content types
const CACHE_STRATEGIES = {
  // HTML pages: Network first, cache fallback
  pages: 'networkFirst',
  // Static assets: Cache first
  assets: 'cacheFirst',
  // Images: Cache first with runtime caching
  images: 'cacheFirst',
  // API/dynamic content: Network first
  api: 'networkFirst',
  // Fonts: Cache first (long-term)
  fonts: 'cacheFirst'
};

// Install event - cache critical assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      try {
        // Cache critical assets
        await cache.addAll(PRECACHE_ASSETS.filter(url => url !== OFFLINE_PAGE));

        // Cache offline page separately to handle potential failures
        try {
          await cache.add(OFFLINE_PAGE);
        } catch (e) {
          console.warn('[SW] Could not cache offline page:', e);
        }

        console.log('[SW] Precached assets successfully');
      } catch (error) {
        console.error('[SW] Failed to precache assets:', error);
      }

      // Skip waiting to activate immediately
      self.skipWaiting();
    })()
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(cacheName =>
            cacheName.startsWith('nightdogs-') &&
            cacheName !== CACHE_NAME &&
            cacheName !== RUNTIME_CACHE
          )
          .map(cacheName => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );

      // Take control of all open pages
      await self.clients.claim();
      console.log('[SW] Service worker activated');
    })()
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-HTTP requests
  if (!url.protocol.startsWith('http')) return;

  // Skip requests with specific headers (like range requests)
  if (request.headers.get('range')) return;

  event.respondWith(handleFetch(request));
});

// Main fetch handler
async function handleFetch(request) {
  const url = new URL(request.url);

  try {
    // Determine content type and strategy
    if (isHTMLPage(request)) {
      return await handlePageRequest(request);
    } else if (isStaticAsset(request)) {
      return await handleStaticAsset(request);
    } else if (isImage(request)) {
      return await handleImageRequest(request);
    } else if (isFont(request)) {
      return await handleFontRequest(request);
    } else {
      // Default to network first for unknown requests
      return await networkFirst(request);
    }
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    return await getOfflineFallback(request);
  }
}

// Handle HTML page requests
async function handlePageRequest(request) {
  try {
    // Network first strategy for pages
    const response = await fetch(request);

    if (response.ok) {
      // Cache successful responses
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
      return response;
    }

    throw new Error(`HTTP ${response.status}`);
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', error);

    // Try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page as last resort
    return await getOfflinePage();
  }
}

// Handle static asset requests (CSS, JS)
async function handleStaticAsset(request) {
  // Cache first strategy
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
      return response;
    }
    throw new Error(`HTTP ${response.status}`);
  } catch (error) {
    console.warn('[SW] Failed to fetch static asset:', request.url);
    throw error;
  }
}

// Handle image requests
async function handleImageRequest(request) {
  // Cache first with runtime caching
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      // Cache in runtime cache
      const cache = await caches.open(RUNTIME_CACHE);

      // Only cache images under 1MB to prevent cache bloat
      const contentLength = response.headers.get('content-length');
      if (!contentLength || parseInt(contentLength) < 1048576) {
        cache.put(request, response.clone());
      }

      return response;
    }
    throw new Error(`HTTP ${response.status}`);
  } catch (error) {
    console.warn('[SW] Image fetch failed:', request.url);
    // Could return a placeholder image here
    return await getOfflineImageFallback();
  }
}

// Handle font requests
async function handleFontRequest(request) {
  // Cache first with long-term caching
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
      return response;
    }
    throw new Error(`HTTP ${response.status}`);
  } catch (error) {
    console.warn('[SW] Font fetch failed:', request.url);
    throw error;
  }
}

// Network first strategy
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Utility functions
function isHTMLPage(request) {
  const url = new URL(request.url);
  return request.method === 'GET' &&
         (request.headers.get('accept')?.includes('text/html') ||
          url.pathname.endsWith('/') ||
          url.pathname.endsWith('.html'));
}

function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.match(/\.(css|js|json)$/i);
}

function isImage(request) {
  const url = new URL(request.url);
  return url.pathname.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i);
}

function isFont(request) {
  const url = new URL(request.url);
  return url.pathname.match(/\.(woff|woff2|ttf|eot|otf)$/i);
}

async function getOfflinePage() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(OFFLINE_PAGE);
    if (response) return response;
  } catch (error) {
    console.error('[SW] Could not get offline page:', error);
  }

  // Fallback offline page
  return new Response(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>Offline - nightdogs</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body {
          font-family: system-ui, sans-serif;
          max-width: 600px;
          margin: 2rem auto;
          padding: 1rem;
          text-align: center;
          background: #ffd6e0;
          color: #8b0020;
        }
        h1 { color: #b8002e; }
        .paw { font-size: 2rem; margin: 1rem 0; }
      </style>
    </head>
    <body>
      <h1>You're Offline</h1>
      <div class="paw">🐾</div>
      <p>It looks like you're not connected to the internet right now.</p>
      <p>Don't worry - you can still browse cached pages from nightdogs.xyz!</p>
      <button onclick="window.history.back()">Go Back</button>
    </body>
    </html>
  `, {
    status: 200,
    headers: { 'Content-Type': 'text/html' }
  });
}

async function getOfflineImageFallback() {
  // Return a simple SVG placeholder
  const svg = `
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="300" fill="#f0f0f0"/>
      <text x="200" y="150" text-anchor="middle" fill="#666" font-family="sans-serif" font-size="16">
        Image unavailable offline
      </text>
      <text x="200" y="180" text-anchor="middle" fill="#666" font-family="sans-serif" font-size="24">
        🐾
      </text>
    </svg>
  `;

  return new Response(svg, {
    status: 200,
    headers: { 'Content-Type': 'image/svg+xml' }
  });
}

async function getOfflineFallback(request) {
  if (isHTMLPage(request)) {
    return await getOfflinePage();
  } else if (isImage(request)) {
    return await getOfflineImageFallback();
  } else {
    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Background sync for failed requests (if supported)
if ('sync' in self.registration) {
  self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
      event.waitUntil(
        // Handle background sync tasks
        handleBackgroundSync()
      );
    }
  });
}

async function handleBackgroundSync() {
  console.log('[SW] Background sync triggered');
  // Could implement retry logic for failed requests here
}

// Push notification handling (if needed in the future)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/img/icon-192.png',
    badge: '/img/icon-72.png',
    tag: 'nightdogs-notification'
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Clean up runtime cache periodically
setInterval(async () => {
  try {
    const cache = await caches.open(RUNTIME_CACHE);
    const keys = await cache.keys();

    // Remove entries older than 7 days
    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const dateHeader = response.headers.get('date');
        if (dateHeader && new Date(dateHeader).getTime() < weekAgo) {
          await cache.delete(request);
        }
      }
    }
  } catch (error) {
    console.warn('[SW] Cache cleanup failed:', error);
  }
}, 24 * 60 * 60 * 1000); // Run daily
