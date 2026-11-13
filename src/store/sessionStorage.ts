import type { Middleware } from "@reduxjs/toolkit";
import type { GameState, WalletState } from "@/src/types/game";
import { setMuted } from "@/src/store/walletSlice";
import { parseSessionState, SESSION_VERSION, type SessionState } from "@/src/store/sessionSchema";

export const STORAGE_KEY = "mcsirun_session_v2";
export const SOUND_STORAGE_KEY = "mcsirun_sound_muted";

interface StoreShape {
  wallet: WalletState;
  game: GameState;
}

export function readSessionState(): SessionState | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? parseSessionState(JSON.parse(raw)) : null;
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

export function toSessionState({ wallet, game }: StoreShape): SessionState {
  const active = game.status === "active";
  return {
    version: SESSION_VERSION,
    wallet: {
      balance: wallet.balance,
      betAmount: wallet.betAmount,
      difficulty: wallet.difficulty,
      language: wallet.language,
    },
    game: {
      history: game.history,
      round: active ? {
        currentStep: game.currentStep,
        roundBet: game.roundBet,
        trackDifficulty: game.trackDifficulty,
        awaitingMilestoneChoice: game.awaitingMilestoneChoice,
      } : null,
    },
  };
}

export const sessionStorageMiddleware: Middleware<unknown, StoreShape> = (store) => {
  let last: StoreShape | null = null;
  return (next) => (action) => {
    const result = next(action);
    if (typeof window === "undefined") return result;
    const state = store.getState();
    if (!last || last.wallet !== state.wallet || last.game !== state.game) {
      last = state;
      try {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(toSessionState(state)));
      } catch (error) {
        console.error("Unable to persist game session state.", error);
      }
    }
    if (setMuted.match(action)) {
      try {
        window.localStorage.setItem(SOUND_STORAGE_KEY, String(action.payload));
      } catch (error) {
        console.error("Unable to persist sound preference.", error);
      }
    }
    return result;
  };
};
