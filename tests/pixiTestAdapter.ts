if (typeof globalThis.navigator === "undefined") {
  Object.defineProperty(globalThis, "navigator", {
    value: { userAgent: "Node.js" },
    configurable: true,
  });
}

export {};
