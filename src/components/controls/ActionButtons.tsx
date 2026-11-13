"use client";

import type { RoundStatus } from "@/src/types/game";
import { useI18n } from "@/src/lib/i18n";

interface Props {
  status: RoundStatus;
  hasPlayedRound: boolean;
  step: number;
  payout: number;
  busy: boolean;
  onPlay: () => void;
  onNext: () => void;
  onCashOut: () => void;
}

export function ActionButtons({ status, hasPlayedRound, step, payout, busy, onPlay, onNext, onCashOut }: Props) {
  const t = useI18n();
  if (status === "active") {
    return (
      <div className="action-buttons active-actions">
        <button key="cashout" className="cashout-button" onClick={onCashOut} disabled={step < 1 || busy}>
          {t.cashOut} <strong>{payout.toFixed(2)} $</strong>
        </button>
        <button key="go" className="next-button" onClick={onNext} disabled={busy}>
          {t.go}
        </button>
      </div>
    );
  }
  return (
    <div className="action-buttons">
      <button key="play" className="play-button" onClick={onPlay} disabled={busy}>
        {hasPlayedRound ? t.playAgain : t.play}
      </button>
    </div>
  );
}
