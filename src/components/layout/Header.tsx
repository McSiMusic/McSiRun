"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { setMuted } from "@/src/store/walletSlice";
import { soundEngine } from "@/src/lib/audio/soundEngine";
import { HowToPlayModal } from "@/src/components/layout/HowToPlayModal";
import { SettingsMenu } from "@/src/components/layout/SettingsMenu";
import { useI18n } from "@/src/lib/i18n";
import { assetPath } from "@/src/lib/assetPath";

export function Header({ onTopUp }: { onTopUp: () => void }) {
  const [helpOpen, setHelpOpen] = useState(false);
  const dispatch = useAppDispatch();
  const { balance, isMuted } = useAppSelector((state) => state.wallet);
  const t = useI18n();
  const formattedBalance = `$${balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const toggleMute = () => {
    soundEngine.playSound("ui_click");
    soundEngine.setMuted(!isMuted);
    dispatch(setMuted(!isMuted));
  };

  return (
    <>
      <header className="topbar">
        <Link className="brand" href="/" aria-label={t.home}>
          <span className="brand-mark"><Image src={assetPath("/icons/chicken.svg")} width={40} height={40} alt="" unoptimized /></span>
          <span className="brand-name">McSi<em>Run</em></span>
        </Link>
        <div className="header-actions">
          <button
            className="subtle-button howto-trigger"
            aria-label={t.howTo}
            onClick={() => { soundEngine.playSound("ui_click"); setHelpOpen(true); }}
          >
            <span className="howto-text">{t.howTo}</span><span className="howto-icon" aria-hidden="true">?</span>
          </button>
          <div className="wallet-pill" role="group" aria-label={`${t.balance} ${formattedBalance}`} title={formattedBalance}>
            <span className="wallet-coin" aria-hidden="true">$</span>
            <strong>{formattedBalance}</strong>
          </div>
          <button className="topup-trigger" aria-label={t.topUp} onClick={() => {
            soundEngine.playSound("ui_click");
            onTopUp();
          }}>+</button>
          <button
            className="icon-button sound-toggle"
            onClick={toggleMute}
            aria-label={isMuted ? t.unmute : t.mute}
            title={isMuted ? t.unmute : t.mute}
          >
            <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 9v6h4l5 4V5L8 9H4Z" />
              {isMuted ? <path d="m17 9 4 6m0-6-4 6" /> : <path d="M17 9a5 5 0 0 1 0 6m3-9a9 9 0 0 1 0 12" />}
            </svg>
          </button>
          <SettingsMenu isMuted={isMuted} onToggleSound={toggleMute} />
        </div>
      </header>
      <HowToPlayModal
        open={helpOpen}
        onClose={() => { soundEngine.playSound("ui_click"); setHelpOpen(false); }}
      />
    </>
  );
}
