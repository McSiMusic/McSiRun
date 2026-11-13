"use client";

import { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppStore } from "@/src/store/hooks";
import { creditBalance, debitBet } from "@/src/store/walletSlice";
import { finishRound, safeStep, startRound } from "@/src/store/gameSlice";
import { calculatePayout, MAX_STEPS, multiplierForStep, stepIsSafe } from "@/src/lib/gameMath";
import { soundEngine } from "@/src/lib/audio/soundEngine";
import type { RoundRecord } from "@/src/types/game";

export function useRoundActions(onInsufficientBalance: () => void) {
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const [jumping, setJumping] = useState(false);
  const [win, setWin] = useState<RoundRecord | null>(null);
  const [milestone, setMilestone] = useState<RoundRecord | null>(null);
  const milestonePending = useRef(false);
  const pending = useRef(false);
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
  }, []);

  const play = () => {
    const { wallet, game } = store.getState();
    soundEngine.playSound("ui_click");
    if (pending.current || milestonePending.current || win || game.status === "active") return;
    if (wallet.balance <= 0 || wallet.balance < wallet.betAmount) {
      onInsufficientBalance();
      return;
    }
    dispatch(debitBet(wallet.betAmount));
    dispatch(startRound({ bet: wallet.betAmount, difficulty: wallet.difficulty }));
    next();
  };

  const settle = (record: RoundRecord, status: "won" | "lost", showWin = true) => {
    if (status === "won") {
      dispatch(creditBalance(record.payout));
      if (showWin && record.prize) setWin(record);
    }
    dispatch(finishRound({ status, record }));
  };

  const next = () => {
    const { wallet, game } = store.getState();
    if (pending.current || milestonePending.current || game.status !== "active" || game.currentStep >= MAX_STEPS) return;
    pending.current = true;
    setJumping(true);
    soundEngine.playSound("chicken_jump");
    const safe = stepIsSafe(wallet.difficulty);
    timer.current = window.setTimeout(() => {
      const step = game.currentStep + 1;
      const multiplier = multiplierForStep(wallet.difficulty, step);
      if (safe) {
        dispatch(safeStep({ step, multiplier }));
        soundEngine.playSound("step_safe");
        if (step === 10) {
          milestonePending.current = true;
          setMilestone({
            id: crypto.randomUUID(), bet: game.roundBet, steps: step, multiplier,
            payout: calculatePayout(game.roundBet, multiplier),
            result: "cashed_out", difficulty: wallet.difficulty, prize: "Classified Pistol | Ember",
          });
        } else if (step === MAX_STEPS) {
          settle({
            id: crypto.randomUUID(), bet: game.roundBet, steps: step, multiplier,
            payout: calculatePayout(game.roundBet, multiplier),
            result: "cashed_out", difficulty: wallet.difficulty, prize: "AWP | Dragon Lore",
          }, "won");
          soundEngine.playSound("cashout");
        }
      } else {
        settle({
          id: crypto.randomUUID(), bet: game.roundBet, steps: game.currentStep,
          multiplier: game.multiplier, payout: 0, result: "hit", difficulty: wallet.difficulty,
        }, "lost");
        soundEngine.playSound("awp_shot");
      }
      pending.current = false;
      timer.current = null;
      setJumping(false);
    }, 380);
  };

  const cashOut = (claimMilestone = false) => {
    const { wallet, game } = store.getState();
    if (pending.current || (milestonePending.current && !claimMilestone) || game.status !== "active" || game.currentStep < 1) return;
    settle({
      id: crypto.randomUUID(), bet: game.roundBet, steps: game.currentStep,
      multiplier: game.multiplier, payout: calculatePayout(game.roundBet, game.multiplier),
      result: "cashed_out", difficulty: wallet.difficulty,
      prize: game.currentStep >= 10 ? "Classified Pistol | Ember" : undefined,
    }, "won", !claimMilestone);
    if (claimMilestone) {
      milestonePending.current = false;
      setMilestone(null);
    }
    soundEngine.playSound("cashout");
  };

  return {
    jumping, play, next, cashOut: () => cashOut(), win, milestone,
    claim: () => setWin(null),
    claimMilestone: () => cashOut(true),
    keepRunning: () => { milestonePending.current = false; setMilestone(null); },
  };
}
