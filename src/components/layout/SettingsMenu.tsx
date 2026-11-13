"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/src/lib/i18n";
import { soundEngine } from "@/src/lib/audio/soundEngine";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { setLanguage } from "@/src/store/walletSlice";
import { usePwaInstall } from "@/src/components/layout/PwaRegistrar";

export function SettingsMenu() {
  const [open, setOpen] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const language = useAppSelector((state) => state.wallet.language);
  const dispatch = useAppDispatch();
  const pwa = usePwaInstall();
  const t = useI18n();

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);

  return (
    <div className="settings" ref={root}>
      <button className="icon-button" aria-label={t.settings} title={t.settings} aria-expanded={open}
        aria-controls="settings-menu" onClick={() => {
          soundEngine.playSound("ui_click"); setOpen(!open); setShowInstructions(false);
        }}>⚙</button>
      {open && <div id="settings-menu" className="settings-menu">
        <button onClick={() => {
          soundEngine.playSound("ui_click");
          if (!pwa.available) { setShowInstructions(true); return; }
          void pwa.install().catch(() => setShowInstructions(true));
        }}><span>{t.install}</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3v12m-5-5 5 5 5-5M4 17v3h16v-3" />
          </svg>
        </button>
        <button className="settings-language" aria-label={`${t.language}: ${language.toUpperCase()}`} onClick={() => {
          soundEngine.playSound("ui_click");
          dispatch(setLanguage(language === "en" ? "ru" : "en"));
        }}>
          <span>{t.language}</span>
          <span className="language-switch" aria-hidden="true">
            <span className={language === "en" ? "selected" : ""}>EN</span>
            <span className={language === "ru" ? "selected" : ""}>RU</span>
          </span>
        </button>
        {showInstructions && <p role="status">{pwa.installed ? t.installed : t.installHelp}</p>}
      </div>}
    </div>
  );
}
