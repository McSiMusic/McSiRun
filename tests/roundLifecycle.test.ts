import { test } from "node:test";
import assert from "node:assert/strict";
import reducer, { startRound, safeStep, finishRound, hydrateGame } from "../src/store/gameSlice";
import type { RoundRecord } from "../src/types/game";

test("the finished track keeps its difficulty until Play starts another round", () => {
  let state = reducer(undefined, startRound({ bet: 10, difficulty: "easy" }));
  assert.equal(state.hasPlayedRound, false);
  state = reducer(state, safeStep({ step: 1, multiplier: 1.03 }));
  const record: RoundRecord = { id: "1", bet: 10, steps: 1, multiplier: 1.03, payout: 10.3, result: "cashed_out", difficulty: "easy" };
  state = reducer(state, finishRound({ status: "won", record }));
  assert.equal(state.hasPlayedRound, true);
  state = reducer(state, { type: "wallet/setDifficulty", payload: "hard" });
  state = reducer(state, { type: "wallet/setBetAmount", payload: 20 });
  assert.equal(state.trackDifficulty, "easy");
  assert.equal(state.status, "won");
  assert.equal(state.currentStep, 1);
  state = reducer(state, startRound({ bet: 20, difficulty: "hard" }));
  assert.equal(state.trackDifficulty, "hard");
  assert.equal(state.status, "active");
  assert.equal(state.currentStep, 0);
  assert.equal(state.hasPlayedRound, true);
});

test("completed losses show Play Again but hydration never restores it", () => {
  const record: RoundRecord = { id: "2", bet: 10, steps: 0, multiplier: 1, payout: 0, result: "hit", difficulty: "easy" };
  let state = reducer(undefined, finishRound({ status: "lost", record }));
  assert.equal(state.hasPlayedRound, true);
  const legacySession = { history: [record], hasPlayedRound: true };
  state = reducer(undefined, hydrateGame(legacySession));
  assert.deepEqual(state.history, [record]);
  assert.equal(state.hasPlayedRound, false);
});
