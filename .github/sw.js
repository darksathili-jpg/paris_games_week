const CACHE = "pgw-nsi-quest-v1.0.1";
const APP_SHELL = [
  "./", "./index.html", "./teacher.html", "./config.js", "./manifest.webmanifest",
  "./css/app.css", "./js/content.js", "./js/storage.js", "./js/supabase-client.js", "./js/app.js", "./js/teacher.js", "./assets/icon.svg"
];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);

  if (url.origin === location.origin && (url.pathname.endsWith("/config.js") || event.request.mode === "navigate")) {
    event.respondWith(fetch(event.request).then(resp => {
      const copy = resp.clone(); caches.open(CACHE).then(cache => cache.put(event.request, copy)); return resp;
    }).catch(() => caches.match(event.request).then(hit => hit || caches.match("./index.html"))));
    return;
  }

  if (url.origin === location.origin) {
    event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(resp => {
      const copy = resp.clone(); caches.open(CACHE).then(cache => cache.put(event.request, copy)); return resp;
    })));
    return;
  }

  if (url.hostname.includes("cdn.jsdelivr.net")) {
    event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(resp => {
      const copy = resp.clone(); caches.open(CACHE).then(cache => cache.put(event.request, copy)); return resp;
    })));
  }
});
