import type { Middleware } from "@reduxjs/toolkit";
import type { PersistedState } from "@/src/types/game";
import { setMuted } from "@/src/store/walletSlice";

export const STORAGE_KEY = "cs16_chicken_road_state_v1";
export const SOUND_STORAGE_KEY = "mcsirun_sound_muted";
type SessionState = {
  wallet: Omit<PersistedState["wallet"], "isMuted">;
  game: Omit<PersistedState["game"], "hasPlayedRound">;
};

export function readSessionState(): Partial<SessionState> | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<SessionState>) : null;
  } catch (error) {
    console.error("Unable to read game session state.", error);
    return null;
  }
}

export function readMutedPreference(): boolean {
  try {
    const raw = window.localStorage.getItem(SOUND_STORAGE_KEY);
    if (raw === null || raw === "true") return true;
    if (raw === "false") return false;
    console.error("Invalid stored sound preference:", raw);
  } catch (error) {
    console.error("Unable to read sound preference.", error);
  }
  return true;
}

export const sessionStorageMiddleware: Middleware<unknown, PersistedState> =
  (store) => (next) => (action) => {
    const result = next(action);
    if (typeof window !== "undefined") {
      try {
        const state = store.getState();
        const persisted: SessionState = {
          wallet: {
            balance: state.wallet.balance,
            betAmount: state.wallet.betAmount,
            difficulty: state.wallet.difficulty,
            language: state.wallet.language,
          },
          game: {
            status: state.game.status,
            currentStep: state.game.currentStep,
            multiplier: state.game.multiplier,
            roundBet: state.game.roundBet,
            trackDifficulty: state.game.trackDifficulty,
            history: state.game.history,
            eventId: state.game.eventId,
          },
        };
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
      } catch (error) {
        console.error("Unable to persist game session state.", error);
      }
      if (setMuted.match(action)) {
        try {
          window.localStorage.setItem(SOUND_STORAGE_KEY, String(action.payload));
        } catch (error) {
          console.error("Unable to persist sound preference.", error);
        }
      }
    }
    return result;
  };
