const CACHE = "mcsirun-assets-v1";
const scope = self.registration.scope;
const assets = [
  "body.svg", "head.svg", "wing.svg", "leg.svg", "feather.svg", "crate.svg",
  "beam.svg", "tracer.svg", "screen-crack.png", "glow.svg", "awp-dragon-lore.svg",
  "milestone-pistol.svg", "violet-glow.svg", "cleared-rim.svg", "impact-ring.svg",
  "emerald-ring.svg", "emerald-glow.svg", "italy-sky.svg", "italy-walls.svg",
  "italy-ground.svg", "tactical-sticker.svg",
].map((name) => new URL(`sprites/${name}`, scope).href);

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) =>
    cache.addAll([...assets, ...["sound/awp.ogg", "icons/icon-192.png", "icons/icon-512.png"]
      .map((path) => new URL(path, scope).href)])));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key.startsWith("mcsirun-assets-") && key !== CACHE)
      .map((key) => caches.delete(key)),
  )));
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const base = new URL(scope).pathname;
  if (event.request.method !== "GET" || url.origin !== self.location.origin ||
      !["sprites/", "sound/", "icons/"].some((path) => url.pathname.startsWith(`${base}${path}`))) return;
  event.respondWith(caches.open(CACHE).then(async (cache) => {
    const cached = await cache.match(event.request);
    if (cached) return cached;
    const response = await fetch(event.request);
    if (response.ok) await cache.put(event.request, response.clone());
    return response;
  }));
});
