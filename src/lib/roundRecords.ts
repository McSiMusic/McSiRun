import type { CashoutRecord, Difficulty, HitRecord, PrizeId } from "@/src/types/game";
import { MAX_STEPS, MILESTONE_STEP } from "@/src/lib/gameConstants";
import { calculatePayout } from "@/src/lib/gameMath";

/** `crypto.randomUUID` only exists in secure contexts (HTTPS/localhost), not on a LAN dev URL. */
export function createRoundId(): string {
  const uuid = globalThis.crypto?.randomUUID?.bind(globalThis.crypto);
  if (uuid) return uuid();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function prizeForStep(steps: number): PrizeId | undefined {
  if (steps >= MAX_STEPS) return "dragonLore";
  return steps >= MILESTONE_STEP ? "pistol" : undefined;
}

export function hitRecord(
  bet: number, steps: number, multiplier: number, difficulty: Difficulty, id = createRoundId(),
): HitRecord {
  return { id, bet, steps, multiplier, difficulty, result: "hit", payout: 0 };
}

export function cashoutRecord(
  bet: number, steps: number, multiplier: number, difficulty: Difficulty, id = createRoundId(),
): CashoutRecord {
  const prize = prizeForStep(steps);
  return {
    id, bet, steps, multiplier, difficulty, result: "cashed_out",
    payout: calculatePayout(bet, multiplier), ...(prize ? { prize } : {}),
  };
}
