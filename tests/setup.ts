// PixiJS reads navigator.userAgent at import time; Node only provides navigator from v21.
if (typeof globalThis.navigator === "undefined") {
  Object.defineProperty(globalThis, "navigator", { value: { userAgent: "Node.js" }, configurable: true });
}
