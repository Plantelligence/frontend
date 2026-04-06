import React from 'react';
import { Button } from './Button.jsx';

export const CardEstufa = ({
  greenhouse,
  typeVisual,
  logoVisual,
  onOpen
}) => {
  const hasProfile = Boolean(greenhouse.profile || greenhouse.flowerProfileId);
  const responsibleCount = greenhouse.watchersDetails?.length ?? 0;

  return (
    <article className={`flex h-full min-h-[230px] flex-col rounded-3xl border bg-[#fcfaf7] p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${typeVisual.ring}`}>
      <header className="flex flex-col items-center gap-2 text-center">
        <div className="flex min-w-0 items-center justify-center gap-2.5">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-base ${logoVisual.wrap}`}>
            <i className={logoVisual.icon} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-base leading-tight font-semibold text-slate-800" title={greenhouse.name || 'Estufa sem nome'}>
              {greenhouse.name || 'Estufa sem nome'}
            </h3>
            <p className="mt-0.5 truncate text-xs text-slate-500" title={`Cultivo: ${typeVisual.label}`}>
              Cultivo: {typeVisual.label}
            </p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${hasProfile ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-600'}`}>
          <span className={`h-2 w-2 rounded-full ${hasProfile ? 'bg-emerald-500' : 'bg-stone-400'}`} />
          {hasProfile ? 'Perfil configurado' : 'Sem perfil'}
        </span>
      </header>

      <div className="mt-3 space-y-1.5 border-t border-slate-200 pt-2.5">
        <p className="flex items-center justify-center gap-1 text-xs leading-snug text-slate-600">
          <span className="font-medium text-slate-500">Localização:</span>
          <span className="max-w-[185px] truncate" title={`${greenhouse.city || '—'} / ${greenhouse.state || '—'}`}>
            {greenhouse.city || '—'} / {greenhouse.state || '—'}
          </span>
        </p>
        <p className="flex items-center justify-center gap-1 text-xs leading-snug text-slate-600">
          <span className="font-medium text-slate-500">Equipe responsável:</span>
          <span className="max-w-[160px] truncate" title={responsibleCount > 0 ? `${responsibleCount} pessoa${responsibleCount > 1 ? 's' : ''}` : 'não definida'}>
            {responsibleCount > 0 ? `${responsibleCount} pessoa${responsibleCount > 1 ? 's' : ''}` : 'não definida'}
          </span>
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${typeVisual.badge}`}>
            {typeVisual.label}
          </span>
        </div>
      </div>

      <div className="mt-auto pt-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            className="h-9 min-w-[130px] flex-1 rounded-xl bg-gradient-to-r from-red-700 to-red-500 text-sm font-semibold text-white hover:brightness-110"
            onClick={onOpen}
          >
            Abrir estufa
          </Button>
        </div>
      </div>
    </article>
  );
};
