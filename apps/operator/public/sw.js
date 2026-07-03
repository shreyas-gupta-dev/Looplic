// Minimal service worker for PWA installability + notification handling.
//
// IMPORTANT: do NOT intercept navigations with event.respondWith(fetch(...)).
// A previous version proxied every GET through the service worker, which turned
// any failed fetch — most notably a redirected navigation — into a hard
// ERR_FAILED ("This site can't be reached") for the whole page on clients that
// had the worker cached. The browser's native networking is more resilient, so
// we now stay out of the request path entirely.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Drop any caches left behind by older service worker versions so devices
      // stuck on a bad worker recover cleanly once this version activates.
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.clients.claim();
    })(),
  );
});

// An empty fetch listener keeps PWA install criteria satisfied without taking
// over the request — the browser handles all network traffic natively.
self.addEventListener("fetch", () => {});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes("/technician") && "focus" in client) {
          return client.focus();
        }
      }

      for (const client of clients) {
        if ("focus" in client) {
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow("/technician");
      }

      return undefined;
    }),
  );
});
