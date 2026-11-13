import type { GameState, RoundStatus } from "@/src/types/game";
import { calculatePayout, multiplierForStep } from "@/src/lib/gameMath";

export interface PresentedRound {
  status: RoundStatus;
  currentStep: number;
  multiplier: number;
  payout: number;
  jumping: boolean;
}

/**
 * The store is settled the moment a step is rolled; while the hop animates, the UI and
 * scene keep presenting the pre-jump round so the outcome is revealed on landing.
 */
export function presentRound(game: GameState, jumpFromStep: number | null): PresentedRound {
  if (jumpFromStep === null) {
    return {
      status: game.status,
      currentStep: game.currentStep,
      multiplier: game.multiplier,
      payout: calculatePayout(game.roundBet, game.multiplier),
      jumping: false,
    };
  }
  const multiplier = multiplierForStep(game.trackDifficulty, jumpFromStep);
  return {
    status: "active",
    currentStep: jumpFromStep,
    multiplier,
    payout: calculatePayout(game.roundBet, multiplier),
    jumping: true,
  };
}
