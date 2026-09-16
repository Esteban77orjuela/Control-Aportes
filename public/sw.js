const CACHE_NAME = 'control-aportes-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Workbox injectManifest placeholder - will be replaced at build time
const precacheManifest = self.__WB_MANIFEST || [];

const SUPABASE_URL = 'https://ihrttbpolvcpqvroacah.supabase.co';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('[SW] Caching static assets + precache manifest');
      // Cache static assets first
      await cache.addAll(STATIC_ASSETS);
      // Then cache all precached URLs from Workbox manifest
      const urlsToCache = precacheManifest.map((entry) => entry.url);
      if (urlsToCache.length > 0) {
        await cache.addAll(urlsToCache);
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin === location.origin) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  if (url.origin === SUPABASE_URL) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  event.respondWith(cacheFirstStrategy(request));
});

async function networkFirstStrategy(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    if (request.mode === 'navigate') {
      const offlineResponse = await cache.match('/');
      if (offlineResponse) return offlineResponse;
    }

    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

async function cacheFirstStrategy(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    fetch(request)
      .then((response) => {
        if (response.ok) {
          cache.put(request, response);
        }
      })
      .catch(() => {});
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'offline-sync') {
    event.waitUntil(performOfflineSync());
  }
});

async function performOfflineSync() {
  console.log('[SW] Background sync triggered');
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({ type: 'SYNC_START' });
  });

  try {
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.ok) {
      clients.forEach((client) => {
        client.postMessage({ type: 'SYNC_COMPLETE' });
      });
    }
  } catch (error) {
    console.error('[SW] Sync failed:', error);
    clients.forEach((client) => {
      client.postMessage({ type: 'SYNC_FAILED', error: error.message });
    });
  }
}

self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      self.clients.openWindow(event.notification.data.url || '/')
    );
  }
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});