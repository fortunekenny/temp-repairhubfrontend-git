/* Firebase Cloud Messaging service worker.
 * Shows push notifications when the RepairHub tab is closed or in the background.
 *
 * IMPORTANT: service workers are served as-is from public/ and do NOT receive
 * Vite env vars. Paste the SAME config values you put in .env (VITE_FIREBASE_*)
 * directly below. These web-config values are not secret (they ship in the
 * client bundle anyway), so hardcoding them here is expected.
 */
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyBHXnJRK62mwYjcdYXONskgJP6o6Pa2Xpk',
  authDomain: 'repairhub-8d58f.firebaseapp.com',
  projectId: 'repairhub-8d58f',
  storageBucket: 'repairhub-8d58f.firebasestorage.app',
  messagingSenderId: '86169286664',
  appId: '1:86169286664:web:d9ffcec94b276fa8bcb9bd',
});

// With messaging initialized, background `notification` payloads from the
// server are displayed automatically by the browser.
firebase.messaging();
