// app/js/main.js

/**
 * @file Main application entry point.
 *
 * This script is responsible for:
 * 1. Registering the service worker for offline functionality.
 * 2. Kicking off the application logic (e.g., starting a pacer session).
 */

import * as pacerEngine from './pacer_engine.js';

// Register the Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Main: ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch((error) => {
        console.error('Main: ServiceWorker registration failed: ', error);
      });
  });
}

// Example of how to start the pacer session from the UI.
// For this test, we can log a message to the console.
console.log('Main: Application loaded. To start a session, call pacerEngine.startPacerSession()');

// You could automatically start a session for testing purposes:
// window.onload = () => {
//   console.log("Starting a pacer session automatically for testing.");
//   pacerEngine.startPacerSession();
// };
