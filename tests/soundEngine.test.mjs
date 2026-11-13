import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";

const source = fs.readFileSync(new URL("../src/lib/audio/soundEngine.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;

test("AWP sample defaults to muted and plays at 0.09 with a two-second cutoff", async () => {
  const previousWindow = globalThis.window;
  const previousFetch = globalThis.fetch;
  const events = [];
  class MockAudioContext {
    currentTime = 5;
    state = "running";
    destination = {};
    createGain() {
      return {
        gain: {
          value: 1,
          setValueAtTime: (...args) => events.push(["gain", ...args]),
          linearRampToValueAtTime: (...args) => events.push(["fade", ...args]),
        },
        connect() { return this; },
        disconnect() {},
      };
    }
    createBufferSource() {
      return { connect() { return this; }, start: (...args) => events.push(["start", ...args]), disconnect() {} };
    }
    async decodeAudioData() { return { duration: 10 }; }
  }
  try {
    globalThis.window = { AudioContext: MockAudioContext };
    globalThis.fetch = async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(4) });
    const exportsForTest = {};
    const require = createRequire(import.meta.url);
    new Function("require", "exports", compiled)(
      (id) => id === "@/src/lib/assetPath" ? { assetPath: (path) => path } : require(id), exportsForTest,
    );
    const engine = exportsForTest.soundEngine;
    engine.playSound("awp_shot");
    assert.deepEqual(events, []);
    engine.setMuted(false);
    engine.playSound("awp_shot");
    await new Promise((resolve) => setImmediate(resolve));
    assert.deepEqual(events, [
      ["gain", 0.09, 5], ["gain", 0.09, 6.9], ["fade", 0, 7], ["start", 5, 0, 2],
    ]);
  } finally {
    globalThis.window = previousWindow;
    globalThis.fetch = previousFetch;
  }
});
