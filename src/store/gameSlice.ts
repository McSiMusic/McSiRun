import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { GameState, RoundRecord } from "@/src/types/game";
import { HISTORY_LIMIT, MILESTONE_STEP } from "@/src/lib/gameConstants";
import { multiplierForStep } from "@/src/lib/gameMath";
import type { PersistedRound } from "@/src/store/sessionSchema";
import { roundCashedOut, roundStarted, stepResolved } from "@/src/store/roundActions";

const initialState: GameState = {
  status: "idle",
  currentStep: 0,
  multiplier: 1,
  roundBet: 0,
  trackDifficulty: "medium",
  hasPlayedRound: false,
  isEliminating: false,
  awaitingMilestoneChoice: false,
  pendingClaim: null,
  history: [],
  eventId: 0,
};

function finish(state: GameState, record: RoundRecord) {
  state.status = record.result === "hit" ? "lost" : "won";
  state.history = [record, ...state.history].slice(0, HISTORY_LIMIT);
  state.hasPlayedRound = true;
  state.awaitingMilestoneChoice = false;
  if (record.result === "hit") state.isEliminating = true;
}

const gameSlice = createSlice({
  name: "game",
  initialState,
  reducers: {
    /** The payload must come from `parseSessionState`. Restores an in-flight round, never the lock or Play Again. */
    hydrateGame(state, action: PayloadAction<{ history: RoundRecord[]; round: PersistedRound | null }>) {
      const { history, round } = action.payload;
      state.status = round ? "active" : "idle";
      state.currentStep = round?.currentStep ?? 0;
      state.roundBet = round?.roundBet ?? 0;
      if (round) state.trackDifficulty = round.trackDifficulty;
      state.multiplier = multiplierForStep(state.trackDifficulty, state.currentStep);
      state.awaitingMilestoneChoice = round?.awaitingMilestoneChoice ?? false;
      state.isEliminating = false;
      state.pendingClaim = null;
      state.history = history.slice(0, HISTORY_LIMIT);
      state.eventId += 1;
    },
    completeElimination(state, action: PayloadAction<number>) {
      if (state.status === "lost" && state.eventId === action.payload) state.isEliminating = false;
    },
    milestoneDeclined(state) {
      state.awaitingMilestoneChoice = false;
    },
    winClaimed(state) {
      state.pendingClaim = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(roundStarted, (state, action) => {
        if (state.status === "active" || state.isEliminating) return;
        state.status = "active";
        state.currentStep = 0;
        state.multiplier = 1;
        state.roundBet = action.payload.bet;
        state.trackDifficulty = action.payload.difficulty;
        state.awaitingMilestoneChoice = false;
        state.pendingClaim = null;
        state.eventId += 1;
      })
      .addCase(stepResolved, (state, action) => {
        const { step, multiplier, record } = action.payload;
        if (state.status !== "active" || step !== state.currentStep + 1) return;
        state.eventId += 1;
        if (record?.result === "hit") return finish(state, record);
        state.currentStep = step;
        state.multiplier = multiplier;
        state.awaitingMilestoneChoice = step === MILESTONE_STEP;
        if (record) {
          finish(state, record);
          state.pendingClaim = record;
        }
      })
      .addCase(roundCashedOut, (state, action) => {
        if (state.status !== "active") return;
        state.eventId += 1;
        finish(state, action.payload.record);
        if (action.payload.showClaim) state.pendingClaim = action.payload.record;
      });
  },
});

export const { hydrateGame, completeElimination, milestoneDeclined, winClaimed } = gameSlice.actions;
export default gameSlice.reducer;
