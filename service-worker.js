const STATIC_CACHE_NAME = 'numizmapp-static-cache-v2';
const DYNAMIC_CACHE_NAME = 'numizmapp-dynamic-cache-v2';
const API_CACHE_NAME = 'numizmapp-api-cache-v2';

const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/vite.svg',
  '/manifest.json'
];

const CDN_URLS = [
    'https://cdn.tailwindcss.com',
    'https://aistudiocdn.com/react@^19.2.0',
    'https://aistudiocdn.com/react-dom@^19.2.0/',
    'https://aistudiocdn.com/react@^19.2.0/',
    'https://aistudiocdn.com/@google/genai@^1.23.0',
    'https://esm.sh/@supabase/supabase-js@2.44.4'
];

const STATIC_ASSETS = [...APP_SHELL_URLS, ...CDN_URLS];

self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then(cache => {
      console.log('[Service Worker] Precaching App Shell and Static Assets');
      const promises = STATIC_ASSETS.map(url => {
        return cache.add(new Request(url, { mode: 'cors' })).catch(err => { // Use 'cors' for third-party
            console.warn(`[Service Worker] Failed to cache ${url}`, err);
        });
      });
      return Promise.all(promises);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  const cacheWhitelist = [STATIC_CACHE_NAME, DYNAMIC_CACHE_NAME, API_CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Strategy for Supabase API calls: Network first, then cache
  if (url.hostname === 'zujyupgetmscoqqrtyid.supabase.co') {
    event.respondWith(
      caches.open(API_CACHE_NAME).then(cache => {
        return fetch(event.request).then(response => {
          if (response && response.status === 200) {
            cache.put(event.request, response.clone());
          }
          return response;
        }).catch(() => {
          // Network failed, try to serve from cache
          console.log('[Service Worker] Network failed for API, trying cache.');
          return cache.match(event.request);
        });
      })
    );
    return;
  }
  
  // Strategy for CDN and other assets: Stale-while-revalidate
  if (url.hostname.includes('aistudiocdn.com') || url.hostname.includes('esm.sh') || url.hostname.includes('cdn.tailwindcss.com')) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE_NAME).then(cache => {
        return cache.match(event.request).then(response => {
          const fetchPromise = fetch(event.request).then(networkResponse => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          }).catch(err => console.warn('[Service Worker] CDN fetch failed:', err));
          return response || fetchPromise;
        });
      })
    );
    return;
  }

  // Strategy for App Shell & navigation: Cache first, then network
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).then(fetchResponse => {
        return caches.open(DYNAMIC_CACHE_NAME).then(cache => {
          cache.put(event.request.url, fetchResponse.clone());
          return fetchResponse;
        });
      });
    }).catch(error => {
        console.error('[Service Worker] Fetch failed.', error);
    })
  );
});
