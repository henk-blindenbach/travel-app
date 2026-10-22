const SHELL_CACHE = "nos-shell-v3";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.add("/manifest.webmanifest")));
  self.skipWaiting();
});

self.addEventListener("activate", (event) =>
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((name) => name.startsWith("nos-shell-") && name !== SHELL_CACHE).map((name) => caches.delete(name))))
      .then(() => self.clients.claim()),
  ),
);

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (new URL(event.request.url).origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      try {
        const response = await fetch(event.request);
        if (response.ok && new URL(event.request.url).pathname.startsWith("/_next/")) {
          const cache = await caches.open(SHELL_CACHE);
          cache.put(event.request, response.clone());
        }
        return response;
      } catch {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        // Avoid Response.error() — it surfaces as FetchEvent network-error in DevTools.
        return new Response("Offline — geen netwerk en geen cachekopie.", {
          status: 503,
          statusText: "Service Unavailable",
          headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
        });
      }
    })(),
  );
});
