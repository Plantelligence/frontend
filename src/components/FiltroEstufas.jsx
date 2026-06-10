/**
 * FiltroEstufas - Barra de filtros da grade de estufas.
 *
 * Permite filtrar estufas por tipo de cultivo e buscar por nome.
 * Exibe contagem de resultados visíveis vs total.
 * Usado em GreenhousesPage.jsx logo acima do GridEstufas.
 */

// Barra de busca e filtro das estufas.
import React from 'react';

export const FiltroEstufas = ({
  // Texto atual da busca por nome
  query,
  // Callback chamado quando o usuário digita na busca
  onQueryChange,
  // Filtro de tipo selecionado: 'todos', 'champignon', 'shimeji', etc.
  typeFilter,
  // Callback chamado quando o usuário muda o tipo no select
  onTypeFilterChange,
  // Quantidade de estufas visíveis após aplicar os filtros
  totalVisible,
  // Total de estufas cadastradas sem filtro
  total
}) => {
  // Container da barra de filtros com borda e background
  return (
    <section className="rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 p-3 shadow-sm">
      {/* Layout: coluna no mobile, linha horizontal no desktop */}
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end">
        {/* Campo de busca por nome da estufa */}
        <label className="flex-1">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-red-700">
            Buscar estufa
          </span>
          <div className="relative">
            {/* Ícone de lupa decorativo dentro do input */}
            <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-red-400">
              <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
            </span>
            <input
              type="text"
              value={query}
              // Repassa o texto digitado para o estado do componente pai
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Digite o nome da estufa"
              className="h-10 w-full rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 py-1.5 pl-8 pr-3 text-sm text-slate-700 dark:text-stone-200 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
            />
          </div>
        </label>
        {/* Select de filtro por tipo de cultivo */}
        <label className="w-full lg:w-52">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-red-700">
            Tipo de cultivo
          </span>
          <select
            value={typeFilter}
            // Repassa o tipo selecionado para o estado do componente pai
            onChange={(event) => onTypeFilterChange(event.target.value)}
            className="h-10 w-full rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 px-3 py-1.5 text-sm text-slate-700 dark:text-stone-200 dark:text-stone-200 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
          >
            {/* 'todos' desativa o filtro por tipo */}
            <option value="todos">Todos</option>
            <option value="champignon">Champignon</option>
            <option value="shimeji">Shimeji</option>
            <option value="shiitake">Shiitake</option>
            <option value="personalizado">Personalizado</option>
          </select>
        </label>
      </div>
      {/* Contador de resultados para feedback imediato ao usuário */}
      <p className="mt-2 text-[11px] text-red-700/80">
        Exibindo {totalVisible} de {total} estufas.
      </p>
    </section>
  );
};
