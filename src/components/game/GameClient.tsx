"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { BettingPanel } from "@/src/components/controls/BettingPanel";
import { Header } from "@/src/components/layout/Header";
import { TopUpModal } from "@/src/components/layout/TopUpModal";
import { PixiStageCanvas } from "@/src/components/game/PixiStageCanvas";
import { SkinWinModal } from "@/src/components/game/SkinWinModal";
import { useRoundActions } from "@/src/components/game/useRoundActions";
import { useAppDispatch, useAppSelector, useAppStore } from "@/src/store/hooks";
import { completeElimination } from "@/src/store/gameSlice";
import { MAX_STEPS } from "@/src/lib/gameMath";
import { soundEngine } from "@/src/lib/audio/soundEngine";
import { useI18n } from "@/src/lib/i18n";
import { assetPath } from "@/src/lib/assetPath";

export function GameClient() {
  const wallet = useAppSelector((state) => state.wallet);
  const game = useAppSelector((state) => state.game);
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const t = useI18n();
  const [topUp, setTopUp] = useState<"manual" | "insufficient" | null>(null);
  const [dockHeight, setDockHeight] = useState(0);
  const [revealedLoss, setRevealedLoss] = useState<number | null>(null);
  const revealLoss = useCallback((eventId: number) => {
    const current = store.getState().game;
    if (current.status !== "lost" || current.eventId !== eventId) return;
    setRevealedLoss(eventId);
    dispatch(completeElimination(eventId));
  }, [dispatch, store]);
  const showResult = game.status === "won" || (game.status === "lost" && revealedLoss === game.eventId);
  const { jumping, play, next, cashOut, win, milestone, claim, claimMilestone, keepRunning } =
    useRoundActions(() => setTopUp("insufficient"));

  useEffect(() => {
    soundEngine.setMuted(wallet.isMuted);
    soundEngine.preload();
  }, [wallet.isMuted]);
  useEffect(() => { document.documentElement.lang = wallet.language; }, [wallet.language]);

  const snapshot = useMemo(() => ({
    status: game.status,
    currentStep: game.currentStep,
    difficulty: game.trackDifficulty,
    eventId: game.eventId,
    jumping,
  }), [game.status, game.currentStep, game.eventId, game.trackDifficulty, jumping]);

  return (
    <main className="game-shell">
      <Header onTopUp={() => setTopUp("manual")} />
      {topUp && <TopUpModal insufficient={topUp === "insufficient"} onClose={() => setTopUp(null)} />}
      <SkinWinModal win={milestone ?? win} milestone={!!milestone}
        onClaim={milestone ? claimMilestone : claim} onKeepRunning={keepRunning} />
      <div className="game-content">
        <section className="stage-card">
          <PixiStageCanvas snapshot={snapshot} reservedBottom={dockHeight + 20} label={t.stage}
            onEliminationComplete={revealLoss} />
          <div className={`stage-dim${showResult ? " visible" : ""}`} />
          <div className="stage-footer">
            <span>{t.step} {game.currentStep} / {MAX_STEPS}</span>
            {game.status === "won" && game.currentStep === MAX_STEPS && (
              <strong className="prize-message">{t.prize}: AWP | DRAGON LORE</strong>
            )}
            <div className="multiplier-display">
              <span>{t.multiplier}</span>
              <span className="compact-dot">•</span>
              <strong>{game.multiplier.toFixed(2)}x</strong>
            </div>
          </div>
          {showResult && game.history[0] && (
            <div className="result-zone" style={{ bottom: dockHeight + 20 }} aria-live="polite">
              <div className={`result-banner ${game.status === "won" ? "result-win" : "result-loss"}`}>
                {game.status === "won" ? (
                  <>
                    <strong>{t.won} +${game.history[0].payout.toFixed(2)} ({game.history[0].multiplier.toFixed(2)}x)</strong>
                    {game.history[0].prize && (
                      <div className="result-prize">
                        <Image src={assetPath(`/sprites/${game.history[0].steps === MAX_STEPS ? "awp-dragon-lore" : "milestone-pistol"}.svg`)}
                          alt="" width={80} height={40} unoptimized loading="eager" />
                        <span>{game.history[0].prize === "Classified Pistol | Ember" ? t.pistol : game.history[0].prize}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <><strong>{t.lost}</strong><span>{t.betterLuck}</span></>
                )}
              </div>
            </div>
          )}
        </section>
        <BettingPanel onPlay={play} onNext={next} onCashOut={cashOut} busy={jumping || !!milestone || game.isEliminating} onHeightChange={setDockHeight} />
      </div>
    </main>
  );
}
