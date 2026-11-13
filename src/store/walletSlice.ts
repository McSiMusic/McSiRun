import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  DIFFICULTIES,
  INITIAL_BALANCE,
  type Difficulty,
  type PersistedState,
  type Language,
} from "@/src/types/game";
import { clampBet } from "@/src/lib/gameMath";

type WalletState = PersistedState["wallet"];

const initialState: WalletState = {
  balance: INITIAL_BALANCE,
  betAmount: 10,
  difficulty: "medium",
  isMuted: true,
  language: "en",
};

const walletSlice = createSlice({
  name: "wallet",
  initialState,
  reducers: {
    hydrateWallet(state, action: PayloadAction<Omit<WalletState, "isMuted">>) {
      state.balance = Math.max(0, action.payload.balance);
      state.betAmount = clampBet(action.payload.betAmount);
      state.difficulty = action.payload.difficulty in DIFFICULTIES
        ? action.payload.difficulty
        : "medium";
      state.language = action.payload.language === "ru" ? "ru" : "en";
    },
    setBetAmount(state, action: PayloadAction<number>) {
      state.betAmount = clampBet(action.payload);
    },
    setDifficulty(state, action: PayloadAction<Difficulty>) {
      state.difficulty = action.payload;
    },
    setMuted(state, action: PayloadAction<boolean>) {
      state.isMuted = action.payload;
    },
    setLanguage(state, action: PayloadAction<Language>) {
      state.language = action.payload;
    },
    debitBet(state, action: PayloadAction<number>) {
      state.balance = Math.max(0, Number((state.balance - action.payload).toFixed(2)));
    },
    creditBalance(state, action: PayloadAction<number>) {
      state.balance = Number((state.balance + action.payload).toFixed(2));
    },
  },
});

export const {
  hydrateWallet,
  setBetAmount,
  setDifficulty,
  setMuted,
  setLanguage,
  debitBet,
  creditBalance,
} = walletSlice.actions;
export default walletSlice.reducer;
