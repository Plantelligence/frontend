// Dialog de confirmacao generico usado para acoes criticas que exigem aprovacao do usuario.
import React from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button.jsx';

export const ConfirmDialog = ({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  confirmDisabled = false,
  cancelDisabled = false,
  onConfirm,
  onCancel
}) => {
  if (!open) {
    return null;
  }

  const dialog = (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4">
      <div className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-900 p-6 text-center shadow-xl">
        <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
        <p className="mt-2 text-sm text-slate-300">{description}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button
            variant="secondary"
            className="w-full sm:w-36"
            onClick={onCancel}
            disabled={cancelDisabled}
          >
            {cancelLabel}
          </Button>
          <Button
            variant="danger"
            className="w-full sm:w-36"
            onClick={onConfirm}
            disabled={confirmDisabled}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
};
