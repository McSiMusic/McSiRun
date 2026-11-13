"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAppDispatch } from "@/src/store/hooks";
import { milestoneDeclined, winClaimed } from "@/src/store/gameSlice";
import { advanceStep, cashOut, playRound, type StepOutcome } from "@/src/store/roundThunks";
import { JUMP_DURATION_MS } from "@/src/lib/gameConstants";
import { soundEngine } from "@/src/lib/audio/soundEngine";

/** Play Again appears where Cash Out was; ignore it briefly so a double-click cannot place a new bet. */
export const PLAY_REARM_MS = 500;

/**
 * Thin UI controller: game rules and money live in the round thunks, which settle each step
 * immediately. This hook only paces the jump presentation and plays feedback sounds, so an
 * unmount, reload or audio error mid-animation can never leave the round half-applied.
 */
export function useRoundActions(onInsufficientBalance: () => void) {
  const dispatch = useAppDispatch();
  const [jumpFromStep, setJumpFromStep] = useState<number | null>(null);
  const animating = useRef(false);
  const timer = useRef<number | null>(null);
  const rearmTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    if (rearmTimer.current !== null) window.clearTimeout(rearmTimer.current);
  }, []);

  const present = useCallback((outcome: StepOutcome) => {
    animating.current = true;
    setJumpFromStep(outcome.fromStep);
    soundEngine.playSound("chicken_jump");
    timer.current = window.setTimeout(() => {
      timer.current = null;
      animating.current = false;
      setJumpFromStep(null);
      if (!outcome.safe) return soundEngine.playSound("awp_shot");
      soundEngine.playSound("step_safe");
      if (outcome.finished) soundEngine.playSound("cashout");
    }, JUMP_DURATION_MS);
  }, []);

  const play = useCallback(() => {
    soundEngine.playSound("ui_click");
    if (animating.current || rearmTimer.current !== null) return;
    const result = dispatch(playRound());
    if (result.kind === "insufficient") onInsufficientBalance();
    else if (result.kind === "started") present(result.outcome);
  }, [dispatch, onInsufficientBalance, present]);

  const next = useCallback(() => {
    if (animating.current) return;
    const outcome = dispatch(advanceStep());
    if (outcome) present(outcome);
  }, [dispatch, present]);

  const settle = useCallback((claimMilestone: boolean) => {
    if (animating.current) return;
    if (!dispatch(cashOut(claimMilestone))) return;
    soundEngine.playSound("cashout");
    rearmTimer.current = window.setTimeout(() => { rearmTimer.current = null; }, PLAY_REARM_MS);
  }, [dispatch]);

  return {
    jumpFromStep,
    play,
    next,
    cashOut: useCallback(() => settle(false), [settle]),
    claimMilestone: useCallback(() => settle(true), [settle]),
    keepRunning: useCallback(() => { dispatch(milestoneDeclined()); }, [dispatch]),
    claimWin: useCallback(() => { dispatch(winClaimed()); }, [dispatch]),
  };
}
