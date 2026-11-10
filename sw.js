// Offline cache: app shell + reference photos. Network-first for HTML, cache-first for the rest.
const VERSION = 'reda-v1.0.1';
const SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/style.css?v=1.0.0',
  'js/app.js?v=1.0.0',
  'js/store.js',
  'js/i18n.js',
  'js/logic.js',
  'js/content.js',
  'js/ui.js',
  'js/views/parts.js',
  'js/views/today.js',
  'js/views/pattern.js',
  'js/views/tests.js',
  'js/views/care.js',
  'js/views/report.js',
  'assets/icon.svg',
  'assets/icon-192.png',
  'assets/ref/dermo-writing.jpg',
  'assets/ref/dermo-back.jpg',
  'assets/ref/cold-ice.jpg',
  'assets/ref/cold-arm.jpg',
  'assets/ref/pressure-test.jpg',
  'assets/ref/pressure-back.jpg',
  'assets/ref/cholinergic.jpg',
  'assets/ref/hives-back.jpg',
  'assets/ref/hives-arm.jpg',
  'assets/ref/hives-torso.jpg',
  'assets/ref/angio-face.jpg',
  'assets/ref/angio-lip.jpg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('index.html')));
    return;
  }
  event.respondWith(
    caches.match(request).then((hit) => hit || fetch(request).then((response) => {
      const copy = response.clone();
      caches.open(VERSION).then((cache) => cache.put(request, copy));
      return response;
    })),
  );
});
