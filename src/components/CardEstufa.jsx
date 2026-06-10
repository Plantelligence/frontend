/**
 * CardEstufa - Card de exibição de uma estufa na grade de estufas.
 *
 * Exibe: nome, tipo de cultivo, status do perfil, localização,
 * equipe responsável e botão "Abrir estufa".
 *
 * Usado em GridEstufas.jsx que é renderizado em GreenhousesPage.jsx.
 *
 * Props:
 *   greenhouse   {object} - Dados da estufa do backend
 *   typeVisual   {object} - Configuração visual do tipo de cultivo
 *   logoVisual   {object} - Ícone e cor do logo da estufa
 *   onOpen       {Function} - Callback ao clicar em "Abrir estufa"
 */

import React from 'react';
// Button: componente reutilizável de botão com estilos padronizados
import { Button } from './Button.jsx';

export const CardEstufa = ({
  greenhouse,
  typeVisual,
  logoVisual,
  onOpen
}) => {
  // Verifica se a estufa tem um perfil de cultivo configurado (com ou sem dados completos)
  const hasProfile = Boolean(greenhouse.profile || greenhouse.flowerProfileId);
  // Conta quantos usuários estão vinculados como responsáveis pela estufa
  const responsibleCount = greenhouse.watchersDetails?.length ?? 0;

  return (
    {/* article semanticamente correto para representar um item de lista de entidades */}
    {/* typeVisual.ring: borda colorida que identifica o tipo de cultivo da estufa */}
    <article className={`flex h-full min-h-[230px] flex-col rounded-3xl border bg-white dark:border-stone-800/60 dark:bg-stone-900/35 p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${typeVisual.ring}`}>
      {/* Cabeçalho: logo + nome + tipo de cultivo */}
      <header className="flex flex-col items-center gap-2 text-center">
        <div className="flex min-w-0 items-center justify-center gap-2.5">
          {/* Ícone do logo com cor determinística baseada no ID da estufa */}
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-base ${logoVisual.wrap}`}>
            <i className={logoVisual.icon} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            {/* Nome da estufa com truncamento e tooltip no hover */}
            <h3 className="truncate text-base leading-tight font-semibold text-slate-800 dark:text-stone-100" title={greenhouse.name || 'Estufa sem nome'}>
              {greenhouse.name || 'Estufa sem nome'}
            </h3>
            {/* Tipo de cultivo inferido do perfil vinculado */}
            <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-stone-400" title={`Cultivo: ${typeVisual.label}`}>
              Cultivo: {typeVisual.label}
            </p>
          </div>
        </div>
        {/* Badge de status do perfil: verde com check se configurado, cinza se não */}
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${hasProfile ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-stone-100 text-stone-600 dark:bg-stone-700 dark:text-stone-400'}`}>
          {/* Ponto indicador: verde se tem perfil, cinza se não */}
          <span className={`h-2 w-2 rounded-full ${hasProfile ? 'bg-emerald-500' : 'bg-stone-400'}`} />
          {hasProfile ? 'Perfil configurado' : 'Sem perfil'}
        </span>
      </header>

      {/* Corpo: informações de localização e equipe */}
      <div className="mt-3 space-y-1.5 border-t border-slate-200 dark:border-stone-800/40 pt-2.5">
        {/* Cidade e estado da estufa para contexto geográfico */}
        <p className="flex items-center justify-center gap-1 text-xs leading-snug text-slate-600 dark:text-stone-400">
          <span className="font-medium text-slate-500 dark:text-stone-400">Localização:</span>
          <span className="max-w-[185px] truncate" title={`${greenhouse.city || '—'} / ${greenhouse.state || '—'}`}>
            {greenhouse.city || '—'} / {greenhouse.state || '—'}
          </span>
        </p>
        {/* Quantidade de usuários responsáveis pelo monitoramento da estufa */}
        <p className="flex items-center justify-center gap-1 text-xs leading-snug text-slate-600 dark:text-stone-400">
          <span className="font-medium text-slate-500 dark:text-stone-400">Equipe responsável:</span>
          <span className="max-w-[160px] truncate" title={responsibleCount > 0 ? `${responsibleCount} pessoa${responsibleCount > 1 ? 's' : ''}` : 'não definida'}>
            {responsibleCount > 0 ? `${responsibleCount} pessoa${responsibleCount > 1 ? 's' : ''}` : 'não definida'}
          </span>
        </p>
        {/* Badge colorido do tipo de cultivo para identificação visual rápida */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${typeVisual.badge}`}>
            {typeVisual.label}
          </span>
        </div>
      </div>

      {/* Rodapé: botão de ação principal — mt-auto empurra para o fundo do card */}
      <div className="mt-auto pt-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Botão que navega para o dashboard detalhado da estufa */}
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
