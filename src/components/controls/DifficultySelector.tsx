"use client";

import { useEffect, useRef, useState } from "react";
import { DIFFICULTIES, type Difficulty } from "@/src/types/game";
import { useI18n } from "@/src/lib/i18n";
import { soundEngine } from "@/src/lib/audio/soundEngine";

interface Props {
  value: Difficulty;
  locked: boolean;
  onChange: (value: Difficulty) => void;
}

export function DifficultySelector({ value, locked, onChange }: Props) {
  const t = useI18n();
  const [open, setOpen] = useState(false);
  const popup = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!popup.current?.contains(event.target as Node)) setOpen(false);
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
    <div className="difficulty-control">
      <div className="control-label-row">
        <span>{t.difficulty}</span>
        <span className="risk-indicator">
          {t.hitRisk} ({Math.round(DIFFICULTIES[value].hitRisk * 100)}%)
        </span>
      </div>
      <div className="difficulty-options" role="group" aria-label={t.difficulty}>
        {(Object.keys(DIFFICULTIES) as Difficulty[]).map((level) => (
          <button
            key={level}
            className={value === level ? "selected" : ""}
            onClick={() => onChange(level)}
            disabled={locked}
            aria-pressed={value === level}
          >
            {t[level]}
          </button>
        ))}
      </div>
      <div className="difficulty-popup" ref={popup}>
        <button className="difficulty-trigger" disabled={locked} aria-expanded={open && !locked}
          aria-label={`${t.difficulty}: ${t[value]}, ${t.hitRisk} ${Math.round(DIFFICULTIES[value].hitRisk * 100)}%`}
          onClick={() => { soundEngine.playSound("ui_click"); setOpen(!open); }}>
          <span>{t[value]}</span>
          <span className="difficulty-trigger-risk">{t.hitRisk} {Math.round(DIFFICULTIES[value].hitRisk * 100)}% ▾</span>
        </button>
        {open && !locked && <div className="difficulty-menu" role="group" aria-label={t.difficulty}>
          {(Object.keys(DIFFICULTIES) as Difficulty[]).map((level) => (
            <button key={level} aria-pressed={value === level} onClick={() => {
              onChange(level);
              setOpen(false);
            }}>
              <span>{t[level]}</span><span>{Math.round(DIFFICULTIES[level].hitRisk * 100)}%</span>
            </button>
          ))}
        </div>}
      </div>
    </div>
  );
}
