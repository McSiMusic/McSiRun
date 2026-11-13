import { createAction } from "@reduxjs/toolkit";
import type { CashoutRecord, Difficulty, RoundRecord } from "@/src/types/game";

/**
 * Cross-slice round events. Each one is a single dispatch that both the wallet and
 * game reducers handle, so money and round state can never be observed half-applied.
 * Dispatch them only through the thunks in `roundThunks.ts`, which validate the whole state first.
 */
export const roundStarted = createAction<{ bet: number; difficulty: Difficulty }>("round/started");

/** `record` is null for a safe step that continues the round; otherwise the round is over. */
export const stepResolved = createAction<{
  step: number;
  multiplier: number;
  record: RoundRecord | null;
}>("round/stepResolved");

export const roundCashedOut = createAction<{ record: CashoutRecord; showClaim: boolean }>("round/cashedOut");
