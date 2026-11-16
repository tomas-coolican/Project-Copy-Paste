import { useEffect, useId, useRef } from 'react';
import Alert from './Alert.jsx';
import Button from './Button.jsx';

export default function ConfirmDialog({
  open,
  title,
  description,
  summary,
  confirmLabel = 'Confirmar',
  pendingLabel = 'Procesando…',
  pending = false,
  error,
  errorTitle = 'No se pudo cancelar la reserva',
  onConfirm,
  onClose,
}) {
  const dialogRef = useRef(null);
  const triggerRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      triggerRef.current = document.activeElement;
      dialog.showModal();
      dialog.querySelector('[data-safe-action]')?.focus();
    } else if (!open && dialog.open) {
      dialog.close();

      const trigger = triggerRef.current;
      if (trigger?.isConnected) trigger.focus();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog?.open || !error) return;

    dialog.querySelector('[data-confirm-action]')?.focus();
  }, [error, open]);

  function manejarCancelacion(evento) {
    evento.preventDefault();
    if (!pending) onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={manejarCancelacion}
      className="m-auto max-h-[calc(100dvh_-_40px)] w-[min(440px,calc(100vw_-_40px))] overflow-y-auto rounded-control border border-line-strong bg-surface p-6 text-ink sm:p-7"
    >
      <h2 id={titleId} className="m-0 text-app-title">
        {title}
      </h2>
      <p id={descriptionId} className="m-0 mt-2 text-app-body-sm text-ink-muted">
        {description}
      </p>
      {summary && <div className="mt-4 rounded-control border border-line bg-surface-tint p-4">{summary}</div>}
      {error && (
        <Alert tone="danger" title={errorTitle} className="mt-4">
          {error.message}
        </Alert>
      )}
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <Button data-safe-action variant="secondary" onClick={onClose} disabled={pending}>
          Volver
        </Button>
        <Button variant="danger" pending={pending} pendingLabel={pendingLabel} onClick={onConfirm} data-confirm-action>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
