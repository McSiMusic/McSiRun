import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";

const source = fs.readFileSync(new URL("../src/store/sessionStorage.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const exportsForTest = {};
const require = createRequire(import.meta.url);
new Function("require", "exports", compiled)(
  (id) => id === "@/src/store/walletSlice" ? { setMuted: { match: (action) => action.type === "wallet/setMuted" } } : require(id),
  exportsForTest,
);

test("mute defaults on, persists locally, and is omitted from session state", () => {
  const previousWindow = globalThis.window;
  const local = new Map();
  const session = new Map();
  const storage = (map) => ({
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => map.set(key, value),
  });
  try {
    globalThis.window = { localStorage: storage(local), sessionStorage: storage(session) };
    assert.equal(exportsForTest.readMutedPreference(), true);
    const state = { wallet: { balance: 100, betAmount: 10, difficulty: "easy", language: "en", isMuted: false }, game: { history: [], hasPlayedRound: true } };
    const dispatch = exportsForTest.sessionStorageMiddleware({ getState: () => state })((action) => action);
    dispatch({ type: "wallet/setMuted", payload: false });
    assert.equal(local.get("mcsirun_sound_muted"), "false");
    assert.equal(exportsForTest.readMutedPreference(), false);
    const saved = JSON.parse(session.get(exportsForTest.STORAGE_KEY));
    assert.equal("isMuted" in saved.wallet, false);
    assert.equal("hasPlayedRound" in saved.game, false);
    assert.equal("hasPlayedRound" in Object.fromEntries(local), false);
  } finally {
    globalThis.window = previousWindow;
  }
});
