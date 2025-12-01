const CACHE_NAME = 'tetris-3angle-v1';
const urlsToCache = [
  '/tetris-3angle/',
  '/tetris-3angle/index.html',
  '/tetris-3angle/style.css',
  '/tetris-3angle/main.js',
  '/tetris-3angle/game.js',
  '/tetris-3angle/grid.js',
  '/tetris-3angle/piece.js',
  '/tetris-3angle/shapes.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
