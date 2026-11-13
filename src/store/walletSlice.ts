import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Difficulty, Language, WalletState } from "@/src/types/game";
import { INITIAL_BALANCE, MAX_BALANCE } from "@/src/lib/gameConstants";
import { clampBet, roundMoney } from "@/src/lib/gameMath";
import { roundCashedOut, roundStarted, stepResolved } from "@/src/store/roundActions";

const initialState: WalletState = {
  balance: INITIAL_BALANCE,
  betAmount: 10,
  difficulty: "medium",
  isMuted: true,
  language: "en",
};

function credit(state: WalletState, amount: number) {
  state.balance = Math.min(MAX_BALANCE, roundMoney(state.balance + amount));
}

const walletSlice = createSlice({
  name: "wallet",
  initialState,
  reducers: {
    /** The payload must come from `parseSessionState`, which validates every field. */
    hydrateWallet(state, action: PayloadAction<Omit<WalletState, "isMuted">>) {
      Object.assign(state, action.payload);
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
    topUp(state, action: PayloadAction<number>) {
      const amount = action.payload;
      if (Number.isFinite(amount) && amount >= 0.01) credit(state, amount);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(roundStarted, (state, action) => {
        const { bet } = action.payload;
        if (Number.isFinite(bet) && bet > 0 && bet <= state.balance) state.balance = roundMoney(state.balance - bet);
      })
      .addCase(stepResolved, (state, action) => {
        const { record } = action.payload;
        if (record?.result === "cashed_out") credit(state, record.payout);
      })
      .addCase(roundCashedOut, (state, action) => credit(state, action.payload.record.payout));
  },
});

export const { hydrateWallet, setBetAmount, setDifficulty, setMuted, setLanguage, topUp } = walletSlice.actions;
export default walletSlice.reducer;
