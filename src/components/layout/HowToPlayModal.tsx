"use client";

import { useI18n } from "@/src/lib/i18n";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function HowToPlayModal({ open, onClose }: Props) {
  const t = useI18n();
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="howto-modal surface-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="howto-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-heading">
          <div>
            <h2 id="howto-title">McSiRun: {t.howTitle}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label={t.closeInstructions}>
            ×
          </button>
        </div>
        <ol className="instruction-list">
          <li><b>{t.stakeTitle}</b><span>{t.stakeText}</span></li>
          <li><b>{t.moveTitle}</b><span>{t.moveText}</span></li>
          <li><b>{t.takeTitle}</b><span>{t.takeText}</span></li>
          <li><b>{t.dropTitle}</b><span>{t.dropText}</span></li>
          <li><b>{t.grandTitle}</b><span>{t.grandText}</span></li>
        </ol>
        <p className="modal-warning">{t.warning}</p>
        <button className="primary-button modal-ok" onClick={onClose}>{t.understood}</button>
      </section>
    </div>
  );
}
