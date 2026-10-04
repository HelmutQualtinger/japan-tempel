// Service Worker: macht die Szene installierbar und offline lauffähig.
// Eigene Dateien: Netz zuerst (Updates kommen sofort an), Cache als Rückfall.
// three.js vom CDN: versionierte URLs, daher Cache zuerst.
const CACHE = 'tempel-v3';
const CDN = 'https://cdn.jsdelivr.net/npm/three@0.160.0/';
const LOCAL = ['./', 'tempel.html', 'face.png', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
const REMOTE = [
  CDN + 'build/three.module.js',
  CDN + 'examples/jsm/controls/OrbitControls.js',
  CDN + 'examples/jsm/environments/RoomEnvironment.js',
  CDN + 'examples/jsm/utils/BufferGeometryUtils.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll([...LOCAL, ...REMOTE])).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

const put = (req, res) => {
  if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
  return res;
};

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (req.url.startsWith(CDN)) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => put(req, res))));
  } else if (new URL(req.url).origin === location.origin) {
    e.respondWith(fetch(req).then(res => put(req, res))
      .catch(() => caches.match(req, {ignoreSearch: true}).then(hit => hit || Response.error())));
  }
});
