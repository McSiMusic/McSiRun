import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

const SOURCE = readFileSync(new URL("../../public/sw.js", import.meta.url), "utf8");
const SCOPE = "https://game.test/McSiRun/";

type Handler = (event: Record<string, unknown>) => void;

function fakeCaches(seed: Record<string, Record<string, string>> = {}) {
  const stores = new Map(Object.entries(seed).map(([name, entries]) =>
    [name, new Map(Object.entries(entries).map(([url, body]) => [url, new Response(body)]))]));
  const key = (request: Request | string) => (typeof request === "string" ? request : request.url);
  const open = async (name: string) => {
    if (!stores.has(name)) stores.set(name, new Map());
    const store = stores.get(name)!;
    return {
      match: async (request: Request | string) => store.get(key(request))?.clone(),
      put: async (request: Request | string, response: Response) => { store.set(key(request), response); },
      add: async (url: string) => { store.set(url, new Response(`net:${url}`)); },
      addAll: async (urls: string[]) => urls.forEach((url) => store.set(url, new Response(`net:${url}`))),
    };
  };
  return {
    stores,
    api: { open, keys: async () => [...stores.keys()], delete: async (name: string) => stores.delete(name) },
    text: async (name: string, url: string) => stores.get(name)?.get(url)?.clone().text(),
  };
}

function loadWorker(caches: ReturnType<typeof fakeCaches>, fetch: (request: Request | string) => Promise<Response>) {
  const handlers: Record<string, Handler> = {};
  const self = {
    registration: { scope: SCOPE },
    location: { origin: "https://game.test" },
    clients: { claim: vi.fn(async () => {}) },
    skipWaiting: vi.fn(async () => {}),
    addEventListener: (type: string, handler: Handler) => { handlers[type] = handler; },
  };
  runInNewContext(SOURCE, { self, caches: caches.api, fetch, URL, Response, Promise, console });
  const dispatch = async (type: string, extra: Record<string, unknown> = {}) => {
    const waits: Promise<unknown>[] = [];
    let response: Promise<Response> | undefined;
    handlers[type]({ ...extra, waitUntil: (p: Promise<unknown>) => waits.push(p), respondWith: (p: Promise<Response>) => { response = p; } });
    const result = response ? await response : undefined;
    await Promise.all(waits);
    return result;
  };
  const request = (path: string, mode = "cors") => ({ url: SCOPE + path, method: "GET", mode });
  return { self, dispatch, request };
}

describe("service worker", () => {
  it("precaches the shell and game assets, then activates immediately", async () => {
    const caches = fakeCaches();
    const { self, dispatch } = loadWorker(caches, vi.fn());
    await dispatch("install");
    expect(await caches.text("mcsirun-shell-v2", SCOPE)).toBe(`net:${SCOPE}`);
    expect(await caches.text("mcsirun-assets-v2", `${SCOPE}sound/awp.ogg`)).toBeDefined();
    expect(self.skipWaiting).toHaveBeenCalled();
  });

  it("drops outdated McSiRun caches on activation and claims open pages", async () => {
    const caches = fakeCaches({ "mcsirun-assets-v1": {}, "mcsirun-assets-v2": {}, "other-app": {} });
    const { self, dispatch } = loadWorker(caches, vi.fn());
    await dispatch("activate");
    expect([...caches.stores.keys()].sort()).toEqual(["mcsirun-assets-v2", "other-app"]);
    expect(self.clients.claim).toHaveBeenCalled();
  });

  it("serves pages network-first so deploys appear, falling back to the cached shell offline", async () => {
    const caches = fakeCaches({ "mcsirun-shell-v2": { [SCOPE]: "old shell" } });
    const fetch = vi.fn(async () => new Response("new shell"));
    const { dispatch, request } = loadWorker(caches, fetch);
    expect(await (await dispatch("fetch", { request: request("", "navigate") }))!.text()).toBe("new shell");
    expect(await caches.text("mcsirun-shell-v2", SCOPE)).toBe("new shell");
    fetch.mockRejectedValueOnce(new TypeError("offline"));
    expect(await (await dispatch("fetch", { request: request("", "navigate") }))!.text()).toBe("new shell");
  });

  it("serves game assets from cache and refreshes them in the background", async () => {
    const url = `${SCOPE}sprites/crate.svg`;
    const caches = fakeCaches({ "mcsirun-assets-v2": { [url]: "old crate" } });
    const { dispatch, request } = loadWorker(caches, vi.fn(async () => new Response("new crate")));
    expect(await (await dispatch("fetch", { request: request("sprites/crate.svg") }))!.text()).toBe("old crate");
    expect(await caches.text("mcsirun-assets-v2", url)).toBe("new crate");
  });

  it("caches hashed build output and leaves unrelated requests alone", async () => {
    const caches = fakeCaches();
    const fetch = vi.fn(async () => new Response("chunk"));
    const { dispatch, request } = loadWorker(caches, fetch);
    await dispatch("fetch", { request: request("_next/static/chunks/app.js") });
    await dispatch("fetch", { request: request("_next/static/chunks/app.js") });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(await dispatch("fetch", { request: request("api/data") })).toBeUndefined();
    expect(await dispatch("fetch", { request: { ...request("sprites/crate.svg"), method: "POST" } })).toBeUndefined();
  });
});
