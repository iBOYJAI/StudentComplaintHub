// Service Worker for Offline Support
const CACHE_NAME = 'complaint-hub-v2';
const DEV_MODE = false; // Service workers don't have access to window.location
const urlsToCache = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Cache resources one by one to handle failures gracefully
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(() => {
              // Silently fail - some URLs may not be cacheable
              return null;
            })
          )
        );
      })
      .then(() => {
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension, chrome, and other non-http/https schemes
  const url = new URL(event.request.url);
  if (!url.protocol.startsWith('http')) {
    return; // Let browser handle non-http requests
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        
        return fetch(event.request)
          .then((response) => {
            // Don't cache if not a valid response or not http/https
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Only cache same-origin requests
            const responseUrl = new URL(response.url);
            if (!responseUrl.protocol.startsWith('http')) {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                // Only cache if it's a valid http/https request
                try {
                  cache.put(event.request, responseToCache).catch(() => {
                    // Silently fail for unsupported schemes
                  });
                } catch (err) {
                  // Ignore caching errors for unsupported schemes
                }
              });

            return response;
          });
      })
      .catch(() => {
        // If both fail, return offline page for navigation requests
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-complaints') {
    event.waitUntil(syncComplaints());
  }
});

async function syncComplaints() {
  // Sync any pending complaints/comments/likes from IndexedDB
  // This is handled by the frontend when connection is restored
  try {
    // Service worker can access IndexedDB if needed
    // For now, frontend handles sync on connection restore
  } catch (error) {
    // Silently fail - frontend will handle sync
  }
}

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

