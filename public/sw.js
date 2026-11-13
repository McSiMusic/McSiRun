const CACHE = "mcsirun-assets-v1";
const assets = [
  "body.svg", "head.svg", "wing.svg", "leg.svg", "feather.svg", "crate.svg",
  "beam.svg", "tracer.svg", "screen-crack.png", "glow.svg", "awp-dragon-lore.svg",
  "milestone-pistol.svg", "violet-glow.svg", "cleared-rim.svg", "impact-ring.svg",
  "emerald-ring.svg", "emerald-glow.svg", "italy-sky.svg", "italy-walls.svg",
  "italy-ground.svg", "tactical-sticker.svg",
].map((name) => `/sprites/${name}`);

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) =>
    cache.addAll([...assets, "/sound/awp.ogg", "/icons/icon-192.png", "/icons/icon-512.png"])));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key.startsWith("mcsirun-assets-") && key !== CACHE)
      .map((key) => caches.delete(key)),
  )));
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin ||
      !(url.pathname.startsWith("/sprites/") || url.pathname.startsWith("/sound/") ||
        url.pathname.startsWith("/icons/"))) return;
  event.respondWith(caches.open(CACHE).then(async (cache) => {
    const cached = await cache.match(event.request);
    if (cached) return cached;
    const response = await fetch(event.request);
    if (response.ok) await cache.put(event.request, response.clone());
    return response;
  }));
});
