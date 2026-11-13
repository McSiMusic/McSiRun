export type Difficulty = "easy" | "medium" | "hard" | "hardcore";
export type RoundStatus = "idle" | "active" | "won" | "lost";
export type Language = "en" | "ru";

export interface RoundRecord {
  id: string;
  bet: number;
  steps: number;
  multiplier: number;
  payout: number;
  result: "cashed_out" | "hit";
  difficulty: Difficulty;
  prize?: "AWP | Dragon Lore" | "Classified Pistol | Ember";
}

export interface PersistedState {
  wallet: {
    balance: number;
    betAmount: number;
    difficulty: Difficulty;
    isMuted: boolean;
    language: Language;
  };
  game: {
    status: RoundStatus;
    currentStep: number;
    multiplier: number;
    roundBet: number;
    trackDifficulty: Difficulty;
    hasPlayedRound: boolean;
    history: RoundRecord[];
    eventId: number;
  };
}

export const DIFFICULTIES: Record<
  Difficulty,
  { label: string; hitRisk: number; growth: number }
> = {
  easy: { label: "Easy", hitRisk: 0.1, growth: 1.03 },
  medium: { label: "Medium", hitRisk: 0.2, growth: 1.07 },
  hard: { label: "Hard", hitRisk: 0.35, growth: 1.12 },
  hardcore: { label: "Hardcore", hitRisk: 0.5, growth: 1.17 },
};

export const INITIAL_BALANCE = 1000;
export const MIN_BET = 1;
export const MAX_BET = 500;
