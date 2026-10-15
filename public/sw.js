const SHELL_CACHE = "nos-shell-v2";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.add("/manifest.webmanifest")));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => event.waitUntil(caches.keys().then((names) => Promise.all(names.filter((name) => name.startsWith("nos-shell-") && name !== SHELL_CACHE).map((name) => caches.delete(name)))).then(() => self.clients.claim())));

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).then((response) => {
    const copy = response.clone();
    if (response.ok && new URL(event.request.url).pathname.startsWith("/_next/")) {
      caches.open(SHELL_CACHE).then((cache) => cache.put(event.request, copy));
    }
    return response;
  }).catch(() => caches.match(event.request).then((cached) => cached || Response.error())));
});
