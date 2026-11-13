"use client";

import { DIFFICULTIES, type Difficulty } from "@/src/types/game";
import { useI18n } from "@/src/lib/i18n";

interface Props {
  value: Difficulty;
  locked: boolean;
  onChange: (value: Difficulty) => void;
}

export function DifficultySelector({ value, locked, onChange }: Props) {
  const t = useI18n();
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
      {!locked && (
        <select className="difficulty-select" aria-label={t.difficulty} value={value}
          onChange={(event) => {
            const difficulty = event.target.value;
            if (difficulty in DIFFICULTIES) onChange(difficulty as Difficulty);
          }}>
          {(Object.keys(DIFFICULTIES) as Difficulty[]).map((level) => (
            <option key={level} value={level}>
              {t[level]} - {t.hitRisk} {Math.round(DIFFICULTIES[level].hitRisk * 100)}%
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
