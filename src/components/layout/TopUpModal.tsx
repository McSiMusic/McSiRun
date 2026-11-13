"use client";

import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { topUp } from "@/src/store/walletSlice";
import { soundEngine } from "@/src/lib/audio/soundEngine";
import { useI18n } from "@/src/lib/i18n";
import { MAX_BALANCE } from "@/src/lib/gameConstants";

interface Props {
  insufficient: boolean;
  onClose: () => void;
}

const presets = [100, 500, 1000, 5000];

export function TopUpModal({ insufficient, onClose }: Props) {
  const [amount, setAmount] = useState("100");
  const [error, setError] = useState(false);
  const t = useI18n();
  const balance = useAppSelector((state) => state.wallet.balance);
  const dispatch = useAppDispatch();

  const addFunds = () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value < 0.01 || balance + value > MAX_BALANCE) {
      soundEngine.playSound("ui_click");
      setError(true);
      return;
    }
    const rounded = Number(value.toFixed(2));
    dispatch(topUp(rounded));
    soundEngine.playSound("cashout");
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <section className="topup-modal surface-card" role="dialog" aria-modal="true" aria-labelledby="topup-title">
        <div className="modal-heading">
          <h2 id="topup-title">{t.topUp}</h2>
          <button className="icon-button" aria-label={t.closeTopUp} onClick={() => {
            soundEngine.playSound("ui_click");
            onClose();
          }}>×</button>
        </div>
        <p>{insufficient ? t.insufficient : t.freeCredits}</p>
        <div className="topup-presets" aria-label={t.presets}>
          {presets.map((preset) => (
            <button key={preset} className={Number(amount) === preset ? "selected" : ""} onClick={() => {
              soundEngine.playSound("bet_adjust");
              setAmount(String(preset));
              setError(false);
            }}>+${preset.toLocaleString("en-US")}</button>
          ))}
        </div>
        <label htmlFor="topup-amount">{t.customAmount}</label>
        <input id="topup-amount" type="number" min="0.01" step="0.01" value={amount}
          onChange={(event) => { soundEngine.playSound("bet_adjust"); setAmount(event.target.value); setError(false); }} />
        {error && <p className="topup-error" role="alert">{t.invalidAmount}</p>}
        <button className="primary-button" onClick={addFunds}>{t.addFunds}</button>
        <p className="topup-note">{t.demoOnly}</p>
      </section>
    </div>
  );
}
