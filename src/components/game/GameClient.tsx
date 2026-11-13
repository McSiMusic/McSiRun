"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BettingPanel } from "@/src/components/controls/BettingPanel";
import { Header } from "@/src/components/layout/Header";
import { TopUpModal } from "@/src/components/layout/TopUpModal";
import { PixiStageCanvas } from "@/src/components/game/PixiStageCanvas";
import { SkinWinModal } from "@/src/components/game/SkinWinModal";
import { ResultBanner } from "@/src/components/game/ResultBanner";
import { useRoundActions } from "@/src/components/game/useRoundActions";
import { presentRound } from "@/src/components/game/presentRound";
import { useAppDispatch, useAppSelector, useAppStore } from "@/src/store/hooks";
import { completeElimination } from "@/src/store/gameSlice";
import { MAX_STEPS } from "@/src/lib/gameConstants";
import { cashoutRecord } from "@/src/lib/roundRecords";
import { soundEngine } from "@/src/lib/audio/soundEngine";
import { useI18n } from "@/src/lib/i18n";

export function GameClient() {
  const isMuted = useAppSelector((state) => state.wallet.isMuted);
  const language = useAppSelector((state) => state.wallet.language);
  const game = useAppSelector((state) => state.game);
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const t = useI18n();
  const [topUp, setTopUp] = useState<"manual" | "insufficient" | null>(null);
  const [dockHeight, setDockHeight] = useState(0);
  const [revealedLoss, setRevealedLoss] = useState<number | null>(null);
  const showInsufficient = useCallback(() => setTopUp("insufficient"), []);
  const actions = useRoundActions(showInsufficient);
  const view = presentRound(game, actions.jumpFromStep);
  const revealLoss = useCallback((eventId: number) => {
    const current = store.getState().game;
    if (current.status !== "lost" || current.eventId !== eventId) return;
    setRevealedLoss(eventId);
    dispatch(completeElimination(eventId));
  }, [dispatch, store]);
  const showResult = view.status === "won" || (view.status === "lost" && revealedLoss === game.eventId);
  const milestone = useMemo(() => game.awaitingMilestoneChoice && !view.jumping
    ? cashoutRecord(game.roundBet, game.currentStep, game.multiplier, game.trackDifficulty, "milestone")
    : null, [game.awaitingMilestoneChoice, game.roundBet, game.currentStep, game.multiplier, game.trackDifficulty, view.jumping]);
  const claim = view.jumping ? null : game.pendingClaim;

  useEffect(() => {
    soundEngine.setMuted(isMuted);
    soundEngine.preload();
  }, [isMuted]);
  useEffect(() => { document.documentElement.lang = language; }, [language]);

  const snapshot = useMemo(() => ({
    status: view.status,
    currentStep: view.currentStep,
    difficulty: game.trackDifficulty,
    eventId: game.eventId,
    jumping: view.jumping,
  }), [view.status, view.currentStep, view.jumping, game.eventId, game.trackDifficulty]);

  return (
    <main className="game-shell">
      <Header onTopUp={() => setTopUp("manual")} />
      {topUp && <TopUpModal insufficient={topUp === "insufficient"} onClose={() => setTopUp(null)} />}
      <SkinWinModal win={milestone ?? claim} milestone={!!milestone}
        onClaim={milestone ? actions.claimMilestone : actions.claimWin} onKeepRunning={actions.keepRunning} />
      <div className="game-content">
        <section className="stage-card">
          <PixiStageCanvas snapshot={snapshot} reservedBottom={dockHeight + 20} label={t.stage}
            onEliminationComplete={revealLoss} />
          <div className={`stage-dim${showResult ? " visible" : ""}`} />
          <div className="stage-footer">
            <span>{t.step} {view.currentStep} / {MAX_STEPS}</span>
            {view.status === "won" && view.currentStep === MAX_STEPS && (
              <strong className="prize-message">{t.prize}: {t.dragonLore.toUpperCase()}</strong>
            )}
            <div className="multiplier-display">
              <span>{t.multiplier}</span>
              <span className="compact-dot">•</span>
              <strong>{view.multiplier.toFixed(2)}x</strong>
            </div>
          </div>
          {showResult && game.history[0] && <ResultBanner record={game.history[0]} bottom={dockHeight + 20} />}
        </section>
        <BettingPanel view={view} onPlay={actions.play} onNext={actions.next} onCashOut={actions.cashOut}
          busy={view.jumping || !!milestone || game.isEliminating} onHeightChange={setDockHeight} />
      </div>
    </main>
  );
}
