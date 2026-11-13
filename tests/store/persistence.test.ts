import { describe, expect, it, vi } from "vitest";
import { makeStore } from "@/src/store";
import { hydrateGame } from "@/src/store/gameSlice";
import { setMuted, setBetAmount } from "@/src/store/walletSlice";
import { playRound } from "@/src/store/roundThunks";
import { parseSessionState } from "@/src/store/sessionSchema";
import { readMutedPreference, readSessionState, SOUND_STORAGE_KEY, STORAGE_KEY } from "@/src/store/sessionStorage";
import { FATAL, SAFE, memoryStorage } from "../helpers/fixtures";

function stubStorage() {
  const local = memoryStorage();
  const session = memoryStorage();
  vi.stubGlobal("window", { localStorage: local, sessionStorage: session });
  return { local, session };
}

describe("session persistence", () => {
  it("persists balance, settings, history and the active round, but not mute, lock or Play Again", () => {
    const { session, local } = stubStorage();
    const store = makeStore();
    store.dispatch(playRound(FATAL));
    store.dispatch(setMuted(false));
    const saved = JSON.parse(session.map.get(STORAGE_KEY)!);
    expect(saved.wallet).toEqual({ balance: 990, betAmount: 10, difficulty: "medium", language: "en" });
    expect(saved.game.history).toHaveLength(1);
    expect(saved.game.round).toBeNull();
    expect(JSON.stringify(saved)).not.toMatch(/isMuted|isEliminating|hasPlayedRound/);
    expect(local.map.get(SOUND_STORAGE_KEY)).toBe("false");
  });

  it("skips the storage write when an action changes nothing", () => {
    const { session } = stubStorage();
    const store = makeStore();
    store.dispatch(setBetAmount(25));
    const setItem = vi.spyOn(session, "setItem");
    store.dispatch(setBetAmount(25));
    store.dispatch({ type: "unknown/noop" });
    expect(setItem).not.toHaveBeenCalled();
  });

  it("restores an in-flight round after a reload instead of silently forfeiting the bet", () => {
    const { session } = stubStorage();
    const before = makeStore();
    before.dispatch(playRound(SAFE));
    const saved = readSessionState()!;
    expect(saved).not.toBeNull();
    const after = makeStore();
    after.dispatch(hydrateGame(saved.game));
    expect(after.getState().game).toMatchObject({ status: "active", currentStep: 1, multiplier: 1.07, roundBet: 10, isEliminating: false });
    expect(session.map.has(STORAGE_KEY)).toBe(true);
  });

  it("returns null for corrupt JSON without throwing", () => {
    const { session } = stubStorage();
    vi.spyOn(console, "error").mockImplementation(() => {});
    session.setItem(STORAGE_KEY, "{not json");
    expect(readSessionState()).toBeNull();
    expect(parseSessionState(undefined)).toBeNull();
  });
});

describe("mute preference", () => {
  it("defaults to muted and rejects unexpected values", () => {
    const { local } = stubStorage();
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(readMutedPreference()).toBe(true);
    local.setItem(SOUND_STORAGE_KEY, "false");
    expect(readMutedPreference()).toBe(false);
    local.setItem(SOUND_STORAGE_KEY, "maybe");
    expect(readMutedPreference()).toBe(true);
  });
});
