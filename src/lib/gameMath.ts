import { DIFFICULTIES, type Difficulty } from "@/src/types/game";

export const MAX_STEPS = 20;

export function multiplierForStep(difficulty: Difficulty, step: number): number {
  const boundedStep = Math.max(0, Math.min(MAX_STEPS, Math.trunc(step)));
  return Number(Math.pow(DIFFICULTIES[difficulty].growth, boundedStep).toFixed(2));
}

export function stepIsSafe(difficulty: Difficulty, randomValue = Math.random()): boolean {
  return randomValue >= DIFFICULTIES[difficulty].hitRisk;
}

export function calculatePayout(bet: number, multiplier: number): number {
  return Number((bet * multiplier).toFixed(2));
}

export function clampBet(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(500, Math.max(1, Number(value.toFixed(2))));
}
