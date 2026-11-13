"use client";

import { useEffect, useRef } from "react";
import { BetInput } from "@/src/components/controls/BetInput";
import { DifficultySelector } from "@/src/components/controls/DifficultySelector";
import { ActionButtons } from "@/src/components/controls/ActionButtons";
import type { PresentedRound } from "@/src/components/game/presentRound";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { setBetAmount, setDifficulty } from "@/src/store/walletSlice";
import type { Difficulty } from "@/src/types/game";
import { soundEngine } from "@/src/lib/audio/soundEngine";
import { useI18n } from "@/src/lib/i18n";

interface Props {
  view: PresentedRound;
  onPlay: () => void;
  onNext: () => void;
  onCashOut: () => void;
  busy: boolean;
  onHeightChange: (height: number) => void;
}

export function BettingPanel({ view, onPlay, onNext, onCashOut, busy, onHeightChange }: Props) {
  const dockRef = useRef<HTMLElement>(null);
  const dispatch = useAppDispatch();
  const betAmount = useAppSelector((state) => state.wallet.betAmount);
  const balance = useAppSelector((state) => state.wallet.balance);
  const difficulty = useAppSelector((state) => state.wallet.difficulty);
  const hasPlayedRound = useAppSelector((state) => state.game.hasPlayedRound);
  const t = useI18n();
  const locked = view.status === "active";

  useEffect(() => {
    const dock = dockRef.current;
    if (!dock) return;
    const observer = new ResizeObserver(() => onHeightChange(dock.offsetHeight));
    observer.observe(dock);
    onHeightChange(dock.offsetHeight);
    return () => observer.disconnect();
  }, [onHeightChange]);

  const changeBet = (value: number) => {
    soundEngine.playSound("bet_adjust");
    dispatch(setBetAmount(value));
  };
  const changeDifficulty = (value: Difficulty) => {
    soundEngine.playSound("ui_click");
    dispatch(setDifficulty(value));
  };

  return (
    <section ref={dockRef} className={`control-deck surface-card${locked ? " in-round" : ""}`} aria-label={t.betControls}>
      <div className="deck-settings">
        <BetInput value={betAmount} balance={balance} locked={locked} onChange={changeBet} />
        <DifficultySelector key={locked ? "locked" : "unlocked"} value={difficulty} locked={locked} onChange={changeDifficulty} />
      </div>
      <div className="deck-divider" />
      <ActionButtons
        status={view.status}
        hasPlayedRound={hasPlayedRound}
        step={view.currentStep}
        payout={view.payout}
        busy={busy}
        onPlay={onPlay}
        onNext={onNext}
        onCashOut={onCashOut}
      />
    </section>
  );
}
