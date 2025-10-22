/**
 * @file sw.js
 * @description Service Worker for the 101Monkeys Pacer Protocol PWA.
 * Handles caching of all application assets to ensure full offline functionality.
 */

const CACHE_NAME = '101monkeys-pacer-cache-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html', // Or your main entry point HTML
    '/css/app.css', // Example CSS file
    '/js/policy_config.json',
    '/js/yoga_protocol_library.json',
    '/js/baseline_store.js',
    '/js/sensor_engine.js',
    '/js/dl_engine.js',
    '/js/decision_engine.js',
    // Add other JS modules as they are created
    '/tfl/pacer_model.json',
    '/tfl/pacer_model.bin', // Add the model weights file
    'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js', // Cache TF.js library
    'https://cdn.jsdelivr.net/npm/@mediapipe/pose' // Cache MediaPipe library
];

// Install event: open a cache and add all assets to it
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache, caching assets...');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => {
                console.log('All assets cached successfully.');
            })
            .catch(err => {
                console.error('Failed to cache assets during install:', err);
            })
    );
});

// Fetch event: serve assets from cache first, fall back to network
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // If the request is in the cache, return the cached response
                if (response) {
                    return response;
                }
                // If the request is not in the cache, fetch it from the network
                return fetch(event.request);
            })
    );
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
