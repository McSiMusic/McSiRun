"use client";

import { useEffect, useRef } from "react";
import { BetInput } from "@/src/components/controls/BetInput";
import { DifficultySelector } from "@/src/components/controls/DifficultySelector";
import { ActionButtons } from "@/src/components/controls/ActionButtons";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { setBetAmount, setDifficulty } from "@/src/store/walletSlice";
import { soundEngine } from "@/src/lib/audio/soundEngine";
import { useI18n } from "@/src/lib/i18n";

interface Props {
  onPlay: () => void;
  onNext: () => void;
  onCashOut: () => void;
  busy: boolean;
  onHeightChange: (height: number) => void;
}

export function BettingPanel({ onPlay, onNext, onCashOut, busy, onHeightChange }: Props) {
  const dockRef = useRef<HTMLElement>(null);
  const dispatch = useAppDispatch();
  const wallet = useAppSelector((state) => state.wallet);
  const game = useAppSelector((state) => state.game);
  const t = useI18n();
  const locked = game.status === "active";
  const payout = game.roundBet * game.multiplier;

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
  const changeDifficulty = (value: typeof wallet.difficulty) => {
    soundEngine.playSound("ui_click");
    dispatch(setDifficulty(value));
  };

  return (
    <section ref={dockRef} className={`control-deck surface-card${locked ? " in-round" : ""}`} aria-label={t.betControls}>
      <div className="deck-settings">
        <BetInput value={wallet.betAmount} balance={wallet.balance} locked={locked} onChange={changeBet} />
        <DifficultySelector key={locked ? "locked" : "unlocked"} value={wallet.difficulty} locked={locked} onChange={changeDifficulty} />
      </div>
      <div className="deck-divider" />
      <ActionButtons
        status={game.status}
        hasPlayedRound={game.hasPlayedRound}
        step={game.currentStep}
        payout={payout}
        busy={busy}
        onPlay={onPlay}
        onNext={onNext}
        onCashOut={onCashOut}
      />
    </section>
  );
}
