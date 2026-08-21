// Service Worker for Surat Embroidery Micro-ERP (ETMS PWA)
const CACHE_NAME = 'etms-surat-cache-v1';
const OFFLINE_URL = '/';

const STATIC_ASSETS = [
  '/',
  '/shift',
  '/shift/new',
  '/challans',
  '/challans/inward',
  '/invoices',
  '/invoices/new',
  '/karigar/uchapat',
  '/munim/dashboard',
  '/diagnostics',
  '/manifest.json',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Failed to cache all static assets during install:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Stale-while-revalidate for pages and static resources
  if (event.request.method !== 'GET') return;

  // Ignore API requests from cache
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return cachedResponse || caches.match(OFFLINE_URL);
        });

      return cachedResponse || fetchPromise;
    })
  );
});
