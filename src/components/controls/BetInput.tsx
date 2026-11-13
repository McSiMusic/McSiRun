"use client";

import { useI18n } from "@/src/lib/i18n";

interface Props {
  value: number;
  balance: number;
  locked: boolean;
  onChange: (value: number) => void;
}

const chips = [2, 3, 8, 20];

export function BetInput({ value, balance, locked, onChange }: Props) {
  const t = useI18n();
  return (
    <div className="bet-control">
      <label className="visually-hidden" htmlFor="bet-amount">{t.bet}</label>
      <div className="bet-entry">
        <button onClick={() => onChange(1)} disabled={locked} aria-label={t.minimum}>{t.minShort}</button>
        <span className="currency">$</span>
        <input
          id="bet-amount"
          type="number"
          min={1}
          max={500}
          step={0.01}
          value={value}
          disabled={locked}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <button onClick={() => onChange(Math.min(balance, 500))} disabled={locked} aria-label={t.maximum}>{t.maxShort}</button>
      </div>
      <div className="bet-chips">
        {chips.map((chip) => (
          <button key={chip} onClick={() => onChange(chip)} disabled={locked}>
            {chip} $
          </button>
        ))}
      </div>
    </div>
  );
}
