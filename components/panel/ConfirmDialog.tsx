"use client";

import Modal from "./Modal";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} title={title} onClose={onCancel} maxWidth={440}>
      <p className="pageText">{message}</p>
      <div className="pageActions">
        <button
          type="button"
          className={`cc-btn ${destructive ? "cc-btn--danger" : "cc-btn--solid"}`}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? "Procesando..." : confirmLabel}
        </button>
        <button type="button" className="cc-btn cc-btn--outline" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </button>
      </div>
    </Modal>
  );
}
