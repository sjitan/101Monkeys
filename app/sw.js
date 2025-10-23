// app/sw.js

const CACHE_NAME = '101monkeys-pacer-cache-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/css/app.css',
  '/js/main.js',
  '/js/pacer_engine.js',
  '/js/sensor_engine.js',
  '/js/dl_engine.js',
  '/js/baseline_store.js',
  '/js/config_loader.js',
  '/config/policy_config.json',
  // In a real app, you'd also cache tfl/model.json, weight files, etc.
];

// Install event: opens a cache and adds all specified assets to it.
self.addEventListener('install', (event) => {
  console.log('ServiceWorker: Install event in progress.');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('ServiceWorker: Caching app shell');
        return cache.addAll(URLS_TO_CACHE);
      })
      .catch(error => {
          console.error("ServiceWorker: Failed to cache app shell.", error);
      })
  );
});

// Fetch event: serves assets from cache first (offline-first).
// If a resource is not in the cache, it falls back to the network.
self.addEventListener('fetch', (event) => {
    console.log(`ServiceWorker: Fetching ${event.request.url}`);
    event.respondWith(
        caches.match(event.request)
        .then((response) => {
            // If the request is in the cache, return the cached response.
            if (response) {
                console.log(`ServiceWorker: Serving from cache: ${event.request.url}`);
                return response;
            }

            // If the request is not in the cache, fetch it from the network.
            console.log(`ServiceWorker: Fetching from network: ${event.request.url}`);
            return fetch(event.request);
        })
        .catch(error => {
            console.error(`ServiceWorker: Error fetching ${event.request.url}`, error);
            // You might want to return a custom offline page here.
        })
    );
});


// Activate event: clean up old caches.
self.addEventListener('activate', (event) => {
  console.log('ServiceWorker: Activate event in progress.');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log(`ServiceWorker: Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
