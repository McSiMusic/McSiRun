import { isDifficulty, type Difficulty, type Language, type PrizeId, type RoundRecord, type WalletState } from "@/src/types/game";
import {
  HISTORY_LIMIT, INITIAL_BALANCE, MAX_BALANCE, MAX_BET, MAX_STEPS, MILESTONE_STEP, MIN_BET,
} from "@/src/lib/gameConstants";
import { clampBet, roundMoney } from "@/src/lib/gameMath";

export const SESSION_VERSION = 2;

export interface PersistedRound {
  currentStep: number;
  roundBet: number;
  trackDifficulty: Difficulty;
  awaitingMilestoneChoice: boolean;
}

export interface SessionState {
  version: typeof SESSION_VERSION;
  wallet: Omit<WalletState, "isMuted">;
  game: { history: RoundRecord[]; round: PersistedRound | null };
}

type Shape = Record<string, unknown>;

const isObject = (value: unknown): value is Shape =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isMoney = (value: unknown, max = MAX_BALANCE): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= max;
const isStep = (value: unknown, min: number, max: number): value is number =>
  Number.isInteger(value) && (value as number) >= min && (value as number) <= max;
const isPrize = (value: unknown): value is PrizeId => value === "pistol" || value === "dragonLore";

function parseRecord(value: unknown): RoundRecord | null {
  if (!isObject(value) || typeof value.id !== "string" || !isDifficulty(value.difficulty) ||
      !isMoney(value.bet, MAX_BET) || !isStep(value.steps, 0, MAX_STEPS) ||
      !isMoney(value.multiplier) || !isMoney(value.payout)) return null;
  const base = {
    id: value.id, bet: value.bet, steps: value.steps, multiplier: value.multiplier, difficulty: value.difficulty,
  };
  if (value.result === "hit") return { ...base, result: "hit", payout: 0 };
  if (value.result !== "cashed_out") return null;
  return { ...base, result: "cashed_out", payout: value.payout, ...(isPrize(value.prize) ? { prize: value.prize } : {}) };
}

function parseRound(value: unknown): PersistedRound | null {
  if (!isObject(value) || !isStep(value.currentStep, 1, MAX_STEPS - 1) || !isDifficulty(value.trackDifficulty) ||
      !isMoney(value.roundBet, MAX_BET) || value.roundBet < MIN_BET) return null;
  return {
    currentStep: value.currentStep,
    roundBet: roundMoney(value.roundBet),
    trackDifficulty: value.trackDifficulty,
    awaitingMilestoneChoice: value.awaitingMilestoneChoice === true && value.currentStep === MILESTONE_STEP,
  };
}

/** Accepts any parsed JSON and returns a fully valid session, repairing or dropping bad fields; null for foreign data. */
export function parseSessionState(value: unknown): SessionState | null {
  if (!isObject(value) || value.version !== SESSION_VERSION) return null;
  const wallet = isObject(value.wallet) ? value.wallet : {};
  const game = isObject(value.game) ? value.game : {};
  const history = Array.isArray(game.history) ? game.history : [];
  return {
    version: SESSION_VERSION,
    wallet: {
      balance: isMoney(wallet.balance) ? roundMoney(wallet.balance) : INITIAL_BALANCE,
      betAmount: typeof wallet.betAmount === "number" ? clampBet(wallet.betAmount) : 10,
      difficulty: isDifficulty(wallet.difficulty) ? wallet.difficulty : "medium",
      language: (wallet.language === "ru" ? "ru" : "en") satisfies Language,
    },
    game: {
      history: history.slice(0, HISTORY_LIMIT).map(parseRecord).filter((record) => record !== null),
      round: parseRound(game.round),
    },
  };
}
