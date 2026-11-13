import type { CashoutRecord } from "@/src/types/game";
import type { AppDispatch, RootState } from "@/src/store";
import { MAX_BET, MAX_STEPS, MIN_BET } from "@/src/lib/gameConstants";
import { multiplierForStep, stepIsSafe } from "@/src/lib/gameMath";
import { cashoutRecord, hitRecord } from "@/src/lib/roundRecords";
import { roundCashedOut, roundStarted, stepResolved } from "@/src/store/roundActions";

type AppThunk<R> = (dispatch: AppDispatch, getState: () => RootState) => R;
type Random = () => number;

export interface StepOutcome {
  fromStep: number;
  step: number;
  safe: boolean;
  finished: boolean;
}

export type PlayResult =
  | { kind: "insufficient" }
  | { kind: "blocked" }
  | { kind: "started"; outcome: StepOutcome };

/** Rolls and settles the next step immediately; the animation only presents a result that is already final. */
export const advanceStep = (random: Random = Math.random): AppThunk<StepOutcome | null> => (dispatch, getState) => {
  const { game } = getState();
  if (game.status !== "active" || game.isEliminating || game.awaitingMilestoneChoice ||
      game.currentStep >= MAX_STEPS) return null;
  const fromStep = game.currentStep;
  const step = fromStep + 1;
  const difficulty = game.trackDifficulty;
  const safe = stepIsSafe(difficulty, random());
  const multiplier = safe ? multiplierForStep(difficulty, step) : game.multiplier;
  const record = !safe
    ? hitRecord(game.roundBet, fromStep, game.multiplier, difficulty)
    : step === MAX_STEPS ? cashoutRecord(game.roundBet, step, multiplier, difficulty) : null;
  dispatch(stepResolved({ step, multiplier, record }));
  return { fromStep, step, safe, finished: record !== null };
};

export const playRound = (random: Random = Math.random): AppThunk<PlayResult> => (dispatch, getState) => {
  const { wallet, game } = getState();
  if (game.status === "active" || game.isEliminating || game.pendingClaim) return { kind: "blocked" };
  const bet = wallet.betAmount;
  if (!Number.isFinite(bet) || bet < MIN_BET || bet > MAX_BET || !(wallet.balance >= bet)) {
    return { kind: "insufficient" };
  }
  dispatch(roundStarted({ bet, difficulty: wallet.difficulty }));
  const outcome = dispatch(advanceStep(random));
  return outcome ? { kind: "started", outcome } : { kind: "blocked" };
};

/** `claimMilestone` is the step-10 modal's cash-out; the regular button stays locked while that choice is open. */
export const cashOut = (claimMilestone = false): AppThunk<CashoutRecord | null> => (dispatch, getState) => {
  const { game } = getState();
  if (game.status !== "active" || game.isEliminating || game.currentStep < 1 ||
      game.awaitingMilestoneChoice !== claimMilestone) return null;
  const record = cashoutRecord(game.roundBet, game.currentStep, game.multiplier, game.trackDifficulty);
  dispatch(roundCashedOut({ record, showClaim: !claimMilestone && record.prize !== undefined }));
  return record;
};
