// Botao flutuante de suporte que abre o chat de atendimento ao usuario.
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export const ChatbotSupportButton = () => {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[90] flex justify-end px-4 sm:bottom-5 sm:px-5">
      <div className="pointer-events-auto flex flex-col items-end gap-3">
        {open ? (
          <div className="w-[min(300px,calc(100vw-2rem))] rounded-2xl border border-stone-300 bg-[#fcfaf7] p-4 shadow-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-700">
              Suporte técnico
            </p>
            <h3 className="mt-1 text-base font-semibold text-slate-800">
              Em breve
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              O assistente de suporte estará disponível em breve para ajudar com dúvidas sobre o cultivo e operação das estufas.
            </p>
          </div>
        ) : null}

        <div className="group relative">
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-red-400 bg-red-600 text-base text-white shadow-lg transition hover:bg-red-500"
            aria-expanded={open ? 'true' : 'false'}
            aria-label="Abrir suporte por chatbot"
          >
            <i className="fa-solid fa-comments" aria-hidden="true" />
          </button>
          <span className="pointer-events-none absolute right-14 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-stone-300 bg-[#fcfaf7] px-3 py-1 text-xs font-semibold text-slate-700 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
            Chat de duvidas
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
};