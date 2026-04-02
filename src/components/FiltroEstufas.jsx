// Barra de filtro/busca para as estufas — permite ao usuário pesquisar e filtrar a lista por texto.
import React from 'react';

export const FiltroEstufas = ({
  query,
  onQueryChange,
  typeFilter,
  onTypeFilterChange,
  totalVisible,
  total
}) => {
  return (
    <section className="rounded-2xl border border-stone-300 bg-[#fcfaf7] p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <label className="flex-1">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-red-700">
            Buscar estufa
          </span>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-red-400">
              <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
            </span>
            <input
              type="text"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Digite o nome da estufa"
              className="w-full rounded-xl border border-stone-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
            />
          </div>
        </label>
        <label className="w-full lg:w-56">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-red-700">
            Tipo de cultivo
          </span>
          <select
            value={typeFilter}
            onChange={(event) => onTypeFilterChange(event.target.value)}
            className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
          >
            <option value="todos">Todos</option>
            <option value="champignon">Champignon</option>
            <option value="shimeji">Shimeji</option>
            <option value="personalizado">Personalizado</option>
          </select>
        </label>
      </div>
      <p className="mt-3 text-xs text-red-700/80">
        Exibindo {totalVisible} de {total} estufas.
      </p>
    </section>
  );
};
