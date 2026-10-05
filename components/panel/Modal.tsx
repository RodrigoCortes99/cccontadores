"use client";

import { useEffect, useRef } from "react";

type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: number;
};

export default function Modal({ open, title, onClose, children, maxWidth = 640 }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    const previous = document.activeElement as HTMLElement | null;
    dialog.showModal();
    return () => { dialog.close(); (previous === document.body ? document.getElementById('panel-main') : previous)?.focus(); };
  }, [open]);

  return (
    <dialog ref={ref} className="uxDialog" aria-modal="true" onKeyDown={e=>{
      if(e.key!=='Tab')return;
      const controls=Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href]')||[]);
      const first=controls[0],last=controls.at(-1);
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
    }} onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.target===e.currentTarget)onClose();}} aria-label={title} style={{ maxWidth }}>
      {open &&
      <div
        className="modalCard"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modalCard__header">
          <h2>{title}</h2>
          <button type="button" className="modalCard__close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>
        <div className="modalCard__body">{children}</div>
      </div>}
    </dialog>
  );
}
