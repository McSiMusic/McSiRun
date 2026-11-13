import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { soundEngine } from "../src/lib/audio/soundEngine";

test("AWP sample defaults to muted and plays at 0.09 with a two-second cutoff", async () => {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const events: Array<[string, ...number[]]> = [];
  class MockAudioContext {
    currentTime = 5;
    state = "running";
    destination = {};
    createGain() {
      return {
        gain: {
          value: 1,
          setValueAtTime: (...args: number[]) => events.push(["gain", ...args]),
          linearRampToValueAtTime: (...args: number[]) => events.push(["fade", ...args]),
        },
        connect() { return this; },
        disconnect() {},
      };
    }
    createBufferSource() {
      return { connect() { return this; }, start: (...args: number[]) => events.push(["start", ...args]), disconnect() {} };
    }
    async decodeAudioData() { return { duration: 10 }; }
  }
  try {
    Object.defineProperty(globalThis, "window", { value: { AudioContext: MockAudioContext }, configurable: true });
    mock.method(globalThis, "fetch", async () => new Response(new Uint8Array(4)));
    soundEngine.playSound("awp_shot");
    assert.deepEqual(events, []);
    soundEngine.setMuted(false);
    soundEngine.playSound("awp_shot");
    await new Promise((resolve) => setImmediate(resolve));
    assert.deepEqual(events, [
      ["gain", 0.09, 5], ["gain", 0.09, 6.9], ["fade", 0, 7], ["start", 5, 0, 2],
    ]);
  } finally {
    mock.restoreAll();
    if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow);
    else Reflect.deleteProperty(globalThis, "window");
  }
});
