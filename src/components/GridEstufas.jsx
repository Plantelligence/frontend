// Grade de cards que lista as estufas cadastradas, repassando ações de edição e exclusão para cada item.
import React from 'react';
import { CardEstufa } from './CardEstufa.jsx';

export const GridEstufas = ({
  estufas,
  onOpen,
  getCardVisual
}) => {
  if (estufas.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        Nenhuma estufa encontrada com esse filtro. Ajuste a busca e tente novamente.
      </div>
    );
  }

  return (
    <section className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {estufas.map((greenhouse) => {
        const visual = getCardVisual(greenhouse);

        return (
          <CardEstufa
            key={greenhouse.id}
            greenhouse={greenhouse}
            typeVisual={visual.typeVisual}
            logoVisual={visual.logoVisual}
            onOpen={() => onOpen(greenhouse.id)}
          />
        );
      })}
    </section>
  );
};
