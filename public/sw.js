// Bump VERSION only to force-drop every cache; routine asset updates are picked up automatically.
const VERSION = "v2";
const SHELL_CACHE = `mcsirun-shell-${VERSION}`;
const ASSET_CACHE = `mcsirun-assets-${VERSION}`;
const scope = self.registration.scope;
const base = new URL(scope).pathname;

const SPRITES = [
  "body.svg", "head.svg", "wing.svg", "leg.svg", "feather.svg", "crate.svg",
  "beam.svg", "tracer.svg", "screen-crack.png", "glow.svg", "awp-dragon-lore.svg",
  "milestone-pistol.svg", "violet-glow.svg", "cleared-rim.svg", "impact-ring.svg",
  "emerald-ring.svg", "emerald-glow.svg", "italy-sky.svg", "italy-walls.svg", "italy-ground.svg",
].map((name) => `sprites/${name}`);
const ASSETS = [...SPRITES, "sound/awp.ogg", "icons/icon-192.png", "icons/icon-512.png", "icons/chicken.svg", "manifest.json"];
const ASSET_PREFIXES = ["sprites/", "sound/", "icons/", "manifest.json"];
const toUrl = (path) => new URL(path, scope).href;

self.addEventListener("install", (event) => {
  event.waitUntil(Promise.all([
    caches.open(SHELL_CACHE).then((cache) => cache.add(scope)),
    caches.open(ASSET_CACHE).then((cache) => cache.addAll(ASSETS.map(toUrl))),
  ]).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys
      .filter((key) => key.startsWith("mcsirun-") && key !== SHELL_CACHE && key !== ASSET_CACHE)
      .map((key) => caches.delete(key))))
    .then(() => self.clients.claim()));
});

/** Pages: always try the network so deploys show up immediately; fall back to the cached shell offline. */
async function networkFirstPage(request) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(scope, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(scope);
    if (cached) return cached;
    throw error;
  }
}

/** Next's hashed build output never changes under the same URL, so the cache is authoritative. */
async function cacheFirst(request) {
  const cache = await caches.open(SHELL_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}

/** Game art and audio: instant from cache, refreshed in the background for the next load. */
async function staleWhileRevalidate(request, event) {
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match(request);
  const refresh = fetch(request).then(async (response) => {
    if (response.ok) await cache.put(request, response.clone());
    return response;
  });
  if (cached) {
    event.waitUntil(refresh.catch(() => undefined));
    return cached;
  }
  return refresh;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || !url.pathname.startsWith(base)) return;
  const path = url.pathname.slice(base.length);
  if (request.mode === "navigate") event.respondWith(networkFirstPage(request));
  else if (path.startsWith("_next/static/")) event.respondWith(cacheFirst(request));
  else if (ASSET_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    event.respondWith(staleWhileRevalidate(request, event));
  }
});
