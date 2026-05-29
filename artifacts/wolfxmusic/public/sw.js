const CACHE = "wolfxmusic-v1";

const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.svg",
  "/og-image.svg",
  "/thumbnail-default.svg",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
  "/icons/icon-maskable.svg",
];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(APP_SHELL))
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Always network-first for API calls and HMR
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/@") || url.pathname.includes("__vite")) {
    e.respondWith(fetch(request));
    return;
  }

  // Cache-first for static assets (JS/CSS/images/fonts)
  if (
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "image" ||
    request.destination === "font"
  ) {
    e.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request).then((res) => {
          if (res.ok) {
            caches.open(CACHE).then((c) => c.put(request, res.clone()));
          }
          return res;
        });
        return cached || network;
      })
    );
    return;
  }

  // Network-first for navigation — fall back to cached index.html (SPA)
  e.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok && request.destination === "document") {
          caches.open(CACHE).then((c) => c.put(request, res.clone()));
        }
        return res;
      })
      .catch(() => caches.match("/index.html"))
  );
});
