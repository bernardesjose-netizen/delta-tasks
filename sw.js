var CACHE_NAME = 'delta-lingua-v3';
var urlsToCache = [
  './',
  './index.html'
];

// Install - cache the app shell
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(name) { return name !== CACHE_NAME; })
             .map(function(name) { return caches.delete(name); })
      );
    })
  );
  self.clients.claim();
});

// Fetch - network first, fallback to cache
self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  // Always go to network for Firebase and API calls
  if (url.hostname.indexOf('firebase') >= 0 ||
      url.hostname.indexOf('googleapis') >= 0 ||
      url.hostname.indexOf('gstatic') >= 0 ||
      url.hostname.indexOf('anthropic') >= 0 ||
      url.hostname.indexOf('fonts.') >= 0) {
    return;
  }

  event.respondWith(
    fetch(event.request).then(function(response) {
      // Clone and cache the fresh response
      if (response && response.status === 200) {
        var responseClone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, responseClone);
        });
      }
      return response;
    }).catch(function() {
      // Network failed, try cache
      return caches.match(event.request).then(function(response) {
        return response || new Response('Offline - sem ligação à internet', {
          status: 503,
          statusText: 'Offline',
          headers: new Headers({ 'Content-Type': 'text/plain; charset=utf-8' })
        });
      });
    })
  );
});
