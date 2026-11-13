import { test } from "node:test";
import assert from "node:assert/strict";
import { makeStore } from "../src/store";
import { finishRound } from "../src/store/gameSlice";
import { setMuted } from "../src/store/walletSlice";
import { readMutedPreference, STORAGE_KEY } from "../src/store/sessionStorage";

test("mute defaults on, persists locally, and is omitted from session state", () => {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const local = new Map<string, string>();
  const session = new Map<string, string>();
  const storage = (map: Map<string, string>) => ({
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => map.set(key, value),
  });
  try {
    Object.defineProperty(globalThis, "window", {
      value: { localStorage: storage(local), sessionStorage: storage(session) }, configurable: true,
    });
    assert.equal(readMutedPreference(), true);
    const store = makeStore();
    store.dispatch(finishRound({
      status: "lost",
      record: { id: "1", bet: 10, steps: 0, multiplier: 1, payout: 0, result: "hit", difficulty: "easy" },
    }));
    store.dispatch(setMuted(false));
    assert.equal(local.get("mcsirun_sound_muted"), "false");
    assert.equal(readMutedPreference(), false);
    const raw = session.get(STORAGE_KEY);
    assert.ok(raw);
    const saved: { wallet: object; game: object } = JSON.parse(raw);
    assert.equal("isMuted" in saved.wallet, false);
    assert.equal("hasPlayedRound" in saved.game, false);
    assert.equal("isEliminating" in saved.game, false);
    assert.equal("hasPlayedRound" in Object.fromEntries(local), false);
  } finally {
    if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow);
    else Reflect.deleteProperty(globalThis, "window");
  }
});
