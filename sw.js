const CACHE = "pgw-nsi-quest-v1.5.0";
const APP_SHELL = [
  "./", "./index.html", "./teacher.html", "./config.js", "./manifest.webmanifest",
  "./css/app.css", "./css/v5-playground.css",
  "./js/content.js", "./js/storage.js", "./js/supabase-client.js", "./js/app.js", "./js/teacher.js", "./js/v5-experience.js",
  "./assets/icon.svg", "./assets/watteau-logo.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);

  if (url.origin === location.origin) {
    const isFreshCritical =
      event.request.mode === "navigate" ||
      url.pathname.endsWith("/config.js") ||
      url.pathname.endsWith("/js/supabase-client.js") ||
      url.pathname.endsWith("/js/v5-experience.js") ||
      url.pathname.endsWith("/js/teacher.js") ||
      url.pathname.endsWith("/js/app.js") ||
      url.pathname.endsWith("/css/app.css") ||
      url.pathname.endsWith("/css/v5-playground.css") ||
      url.pathname.endsWith("/assets/watteau-logo.svg");

    if (isFreshCritical) {
      event.respondWith(
        fetch(event.request, { cache: "no-store" })
          .then(resp => {
            const copy = resp.clone();
            caches.open(CACHE).then(cache => cache.put(event.request, copy));
            return resp;
          })
          .catch(() => caches.match(event.request).then(hit => hit || caches.match("./index.html")))
      );
      return;
    }

    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
        return resp;
      }))
    );
    return;
  }

  if (url.hostname.includes("cdn.jsdelivr.net")) {
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
        return resp;
      }))
    );
  }
});
