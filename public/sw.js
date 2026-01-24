// Lightweight service worker focused on icons and manifest only
// Avoid caching HTML or Next.js build assets to prevent stale client bundles
const CACHE = 'pattern-typing-v3';
const ASSETS = [
  '/manifest.webmanifest',
  '/icon/web/favicon-16.png',
  '/icon/web/favicon-32.png',
  '/icon/web/favicon.ico',
  '/icon/web/manifest-192.png',
  '/icon/web/manifest-512.png',
  '/icon/web/apple-touch-icon-180.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  const isNextAsset = url.pathname.startsWith('/_next/');
  const isNavigation = e.request.mode === 'navigate';

  // Always network-first for Next build assets and navigations (HTML)
  if (isNextAsset || isNavigation) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache-first for static icons/manifest
  e.respondWith(caches.match(e.request).then((cached) => cached || fetch(e.request)));
});
