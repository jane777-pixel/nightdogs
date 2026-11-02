// The site no longer uses a service worker. This file replaces the old one so
// browsers that installed it clear its caches and unregister it.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
	event.waitUntil(
		(async () => {
			const keys = await caches.keys();
			await Promise.all(keys.map((key) => caches.delete(key)));
			await self.registration.unregister();
			const clients = await self.clients.matchAll({ type: "window" });
			clients.forEach((client) => client.navigate(client.url));
		})(),
	);
});
