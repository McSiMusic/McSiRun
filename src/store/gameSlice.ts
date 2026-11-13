import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Difficulty, PersistedState, RoundRecord, RoundStatus } from "@/src/types/game";
import { MAX_STEPS } from "@/src/lib/gameMath";

type GameState = PersistedState["game"];

const initialState: GameState = {
  status: "idle",
  currentStep: 0,
  multiplier: 1,
  roundBet: 0,
  trackDifficulty: "medium",
  hasPlayedRound: false,
  history: [],
  eventId: 0,
};

const gameSlice = createSlice({
  name: "game",
  initialState,
  reducers: {
    hydrateGame(state, action: PayloadAction<{ history: RoundRecord[] }>) {
      state.status = "idle";
      state.currentStep = 0;
      state.multiplier = 1;
      state.roundBet = 0;
      state.history = action.payload.history.slice(0, 15);
      state.eventId = 0;
    },
    startRound(state, action: PayloadAction<{ bet: number; difficulty: Difficulty }>) {
      state.status = "active";
      state.currentStep = 0;
      state.multiplier = 1;
      state.roundBet = action.payload.bet;
      state.trackDifficulty = action.payload.difficulty;
      state.eventId += 1;
    },
    safeStep(state, action: PayloadAction<{ step: number; multiplier: number }>) {
      if (state.status !== "active" || action.payload.step !== state.currentStep + 1 ||
          action.payload.step > MAX_STEPS) return;
      state.currentStep = action.payload.step;
      state.multiplier = action.payload.multiplier;
      state.eventId += 1;
    },
    finishRound(state, action: PayloadAction<{ status: RoundStatus; record: RoundRecord }>) {
      state.status = action.payload.status;
      state.eventId += 1;
      state.history = [action.payload.record, ...state.history].slice(0, 15);
      state.hasPlayedRound = true;
      state.roundBet = 0;
    },
    resetRound(state) {
      state.status = "idle";
      state.currentStep = 0;
      state.multiplier = 1;
      state.roundBet = 0;
      state.eventId += 1;
    },
  },
});

export const { hydrateGame, startRound, safeStep, finishRound, resetRound } =
  gameSlice.actions;
export default gameSlice.reducer;
