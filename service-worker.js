self.addEventListener('install', e => {
  e.waitUntil(
    caches.open('rolli-catalogo').then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/detalhe.html',
        '/style.css',
        '/script.js',
        '/img/logo.png'
      ]);
    })
  );
});
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => response || fetch(e.request))
  );
});
