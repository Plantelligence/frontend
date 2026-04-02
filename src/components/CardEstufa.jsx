import React from 'react';
import { Button } from './Button.jsx';

export const CardEstufa = ({
  greenhouse,
  typeVisual,
  statusVisual,
  logoVisual,
  onOpen
}) => {
  return (
    <article className={`flex h-full min-h-[240px] flex-col rounded-2xl border bg-[#fcfaf7] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${typeVisual.ring}`}>
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-lg ${logoVisual.wrap}`}>
            <i className={logoVisual.icon} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-slate-800" title={greenhouse.name || 'Estufa sem nome'}>
              {greenhouse.name || 'Estufa sem nome'}
            </h3>
            <p className="truncate text-xs text-slate-500" title={`Cultivo: ${typeVisual.label}`}>
              Cultivo: {typeVisual.label}
            </p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${statusVisual.chip}`}>
          <span className={`h-2 w-2 rounded-full ${statusVisual.dot}`} />
          {statusVisual.label}
        </span>
      </header>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${typeVisual.badge}`}>
          {typeVisual.label}
        </span>
        <span className={`text-xs font-semibold ${statusVisual.text}`}>Situação: {statusVisual.label}</span>
      </div>

      <div className="mt-auto pt-5">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            className="min-w-[180px] flex-1 bg-gradient-to-r from-red-700 to-red-500 text-white hover:brightness-110"
            onClick={onOpen}
          >
            Abrir estufa
          </Button>
        </div>
      </div>
    </article>
  );
};
