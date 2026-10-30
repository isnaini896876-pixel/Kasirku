// Kasir Cetak Struk - Service Worker
const CACHE_NAME = 'kasir-struk-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/favicon.png',
  '/apple-touch-icon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png'
];

// Install Event - Precache static assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Cache addAll warning:', err);
      });
    })
  );
});

// Activate Event - Clean old caches & claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== 'shared-image-cache') {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Stale-while-revalidate for static assets, network-first for documents, direct for API
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Handle Web Share Target POST from Android share sheet
  if (event.request.method === 'POST' && url.pathname === '/share-target') {
    event.respondWith(
      (async () => {
        try {
          const formData = await event.request.formData();
          const file = formData.get('receipt_image');
          if (file && file.size > 0) {
            const cache = await caches.open('shared-image-cache');
            const response = new Response(file, {
              headers: {
                'Content-Type': file.type || 'image/jpeg',
                'X-Filename': encodeURIComponent(file.name || 'shared_receipt.jpg'),
                'X-Timestamp': Date.now().toString(),
              },
            });
            await cache.put('/shared-image-data', response);
          }
        } catch (err) {
          console.warn('[SW] Share target processing error:', err);
        }
        return Response.redirect('/?shared=receipt&t=' + Date.now(), 303);
      })()
    );
    return;
  }

  // Bypass API calls
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Non-GET requests should proceed directly
  if (event.request.method !== 'GET') {
    return;
  }

  // HTML Navigation requests - Network first with fallback to cached index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          return caches.match('/index.html');
        })
    );
    return;
  }

  // Static assets (CSS, JS, images, fonts)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
