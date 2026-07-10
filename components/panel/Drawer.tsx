"use client";

import { useEffect } from "react";

type DrawerProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

export default function Drawer({ open, title, onClose, children }: DrawerProps) {
  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <div className={`drawerOverlay ${open ? "drawerOverlay--open" : ""}`} onClick={onClose}>
      <div
        className={`drawerPanel ${open ? "drawerPanel--open" : ""}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="modalCard__header">
          <h2>{title}</h2>
          <button type="button" className="modalCard__close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>
        <div className="drawerPanel__body">{children}</div>
      </div>
    </div>
  );
}
