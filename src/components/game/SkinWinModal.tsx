"use client";

import Image from "next/image";
import type { CashoutRecord } from "@/src/types/game";
import { soundEngine } from "@/src/lib/audio/soundEngine";
import { useI18n } from "@/src/lib/i18n";
import { assetPath } from "@/src/lib/assetPath";
import { PRIZE_ART, prizeName } from "@/src/components/game/prizes";

interface Props {
  win: CashoutRecord | null;
  milestone: boolean;
  onClaim: () => void;
  onKeepRunning: () => void;
}

export function SkinWinModal({ win, milestone, onClaim, onKeepRunning }: Props) {
  const t = useI18n();
  if (!win?.prize) return null;
  const legendary = win.prize === "dragonLore";
  const reward = prizeName(win.prize, t);
  const click = (action: () => void) => () => {
    soundEngine.playSound("ui_click");
    action();
  };

  return (
    <div className="modal-backdrop win-backdrop">
      <section className={`win-modal ${legendary ? "win-legendary" : ""}`} role="dialog" aria-modal="true" aria-labelledby="win-title">
        <div className="win-rays" aria-hidden="true" />
        <div className="win-content">
          <span className="win-eyebrow">{legendary ? t.grandTitle : t.classified}</span>
          <h2 id="win-title">{legendary ? t.legendaryUnlocked : t.milestoneUnlocked}</h2>
          <p className="win-subtitle">{milestone ? t.milestoneChoice : t.rewardText}</p>
          <div className={`win-art ${legendary ? "" : "classified-art"}`}>
            <Image src={assetPath(PRIZE_ART[win.prize])} alt={reward} width={300} height={180} unoptimized loading="eager" />
          </div>
          <h3>{reward}</h3>
          <div className="win-payout"><strong>+${win.payout.toFixed(2)}</strong><span>{t.at} {win.multiplier.toFixed(2)}x</span></div>
          <button className="claim-button" onClick={click(onClaim)} autoFocus>
            {milestone ? `${t.claimPistol} ($${win.payout.toFixed(2)})` : t.claimContinue}
          </button>
          {milestone && (
            <button className="keep-running-button" onClick={click(onKeepRunning)}>{t.keepRunning}</button>
          )}
        </div>
      </section>
    </div>
  );
}
