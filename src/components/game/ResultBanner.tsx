"use client";

import Image from "next/image";
import type { RoundRecord } from "@/src/types/game";
import { useI18n } from "@/src/lib/i18n";
import { assetPath } from "@/src/lib/assetPath";
import { PRIZE_ART, prizeName } from "@/src/components/game/prizes";

export function ResultBanner({ record, bottom }: { record: RoundRecord; bottom: number }) {
  const t = useI18n();
  const prize = record.result === "cashed_out" ? record.prize : undefined;
  return (
    <div className="result-zone" style={{ bottom }} aria-live="polite">
      <div className={`result-banner ${record.result === "cashed_out" ? "result-win" : "result-loss"}`}>
        {record.result === "cashed_out" ? (
          <>
            <strong>{t.won} +${record.payout.toFixed(2)} ({record.multiplier.toFixed(2)}x)</strong>
            {prize && (
              <div className="result-prize">
                <Image src={assetPath(PRIZE_ART[prize])} alt="" width={80} height={40} unoptimized loading="eager" />
                <span>{prizeName(prize, t)}</span>
              </div>
            )}
          </>
        ) : (
          <><strong>{t.lost}</strong><span>{t.betterLuck}</span></>
        )}
      </div>
    </div>
  );
}
