import { DIFFICULTIES, type Difficulty } from "@/src/types/game";
import { MAX_BET, MAX_STEPS, MIN_BET } from "@/src/lib/gameConstants";

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function multiplierForStep(difficulty: Difficulty, step: number): number {
  const boundedStep = Math.max(0, Math.min(MAX_STEPS, Math.trunc(step)));
  return roundMoney(Math.pow(DIFFICULTIES[difficulty].growth, boundedStep));
}

export function stepIsSafe(difficulty: Difficulty, randomValue = Math.random()): boolean {
  return randomValue >= DIFFICULTIES[difficulty].hitRisk;
}

export function calculatePayout(bet: number, multiplier: number): number {
  return roundMoney(bet * multiplier);
}

export function clampBet(value: number): number {
  if (!Number.isFinite(value)) return MIN_BET;
  return Math.min(MAX_BET, Math.max(MIN_BET, roundMoney(value)));
}
