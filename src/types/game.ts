export type Difficulty = "easy" | "medium" | "hard" | "hardcore";
export type RoundStatus = "idle" | "active" | "won" | "lost";
export type Language = "en" | "ru";
export type PrizeId = "pistol" | "dragonLore";

interface RoundRecordBase {
  id: string;
  bet: number;
  steps: number;
  multiplier: number;
  difficulty: Difficulty;
}

export interface HitRecord extends RoundRecordBase {
  result: "hit";
  payout: 0;
}

export interface CashoutRecord extends RoundRecordBase {
  result: "cashed_out";
  payout: number;
  prize?: PrizeId;
}

export type RoundRecord = HitRecord | CashoutRecord;

export interface WalletState {
  balance: number;
  betAmount: number;
  difficulty: Difficulty;
  isMuted: boolean;
  language: Language;
}

export interface GameState {
  status: RoundStatus;
  currentStep: number;
  multiplier: number;
  roundBet: number;
  trackDifficulty: Difficulty;
  hasPlayedRound: boolean;
  isEliminating: boolean;
  awaitingMilestoneChoice: boolean;
  pendingClaim: CashoutRecord | null;
  history: RoundRecord[];
  eventId: number;
}

export const DIFFICULTIES: Record<Difficulty, { hitRisk: number; growth: number }> = {
  easy: { hitRisk: 0.1, growth: 1.03 },
  medium: { hitRisk: 0.2, growth: 1.07 },
  hard: { hitRisk: 0.35, growth: 1.12 },
  hardcore: { hitRisk: 0.5, growth: 1.17 },
};

export function isDifficulty(value: unknown): value is Difficulty {
  return typeof value === "string" && Object.hasOwn(DIFFICULTIES, value);
}
