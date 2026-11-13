export const MAX_STEPS = 20;
export const MILESTONE_STEP = 10;
export const MIN_BET = 1;
export const MAX_BET = 500;
export const INITIAL_BALANCE = 1000;
export const MAX_BALANCE = Number.MAX_SAFE_INTEGER / 100;
export const HISTORY_LIMIT = 15;

/** Shared by the round presenter, the camera and the chicken so outcome and animation stay in sync. */
export const JUMP_TIMING = { crouch: 60, hop: 240, land: 80 } as const;
export const JUMP_DURATION_MS = JUMP_TIMING.crouch + JUMP_TIMING.hop + JUMP_TIMING.land;
