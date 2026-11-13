"use client";

import Image from "next/image";
import type { RoundRecord } from "@/src/types/game";
import { soundEngine } from "@/src/lib/audio/soundEngine";
import { useI18n } from "@/src/lib/i18n";

interface Props {
  win: RoundRecord | null;
  milestone: boolean;
  onClaim: () => void;
  onKeepRunning: () => void;
}

export function SkinWinModal({ win, milestone, onClaim, onKeepRunning }: Props) {
  const t = useI18n();
  if (!win) return null;
  const legendary = win.steps === 20;
  const classified = win.steps >= 10 && !legendary;
  const art = legendary ? "awp-dragon-lore" : classified ? "milestone-pistol" : "tactical-sticker";
  const reward = legendary ? "AWP | Dragon Lore" : classified ? t.pistol : t.sticker;
  const close = () => {
    soundEngine.playSound("ui_click");
    onClaim();
  };

  return (
    <div className="modal-backdrop win-backdrop">
      <section className={`win-modal ${legendary ? "win-legendary" : ""}`} role="dialog" aria-modal="true" aria-labelledby="win-title">
        <div className="win-rays" aria-hidden="true" />
        <div className="win-content">
          <span className="win-eyebrow">{legendary ? t.grandTitle : classified ? t.classified : t.complete}</span>
          <h2 id="win-title">{legendary ? t.legendaryUnlocked : classified ? t.milestoneUnlocked : t.niceRun}</h2>
          <p className="win-subtitle">{milestone ? t.milestoneChoice : t.rewardText}</p>
          <div className={`win-art ${classified ? "classified-art" : ""}`}>
            <Image src={`/sprites/${art}.svg`} alt={reward} width={300} height={180} unoptimized loading="eager" />
          </div>
          <h3>{reward}</h3>
          <div className="win-payout"><strong>+${win.payout.toFixed(2)}</strong><span>{t.at} {win.multiplier.toFixed(2)}x</span></div>
          <button className="claim-button" onClick={close} autoFocus>
            {milestone ? `${t.claimPistol} ($${win.payout.toFixed(2)})` : t.claimContinue}
          </button>
          {milestone && (
            <button className="keep-running-button" onClick={() => {
              soundEngine.playSound("ui_click");
              onKeepRunning();
            }}>{t.keepRunning}</button>
          )}
        </div>
      </section>
    </div>
  );
}
