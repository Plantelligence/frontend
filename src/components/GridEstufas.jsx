/**
 * GridEstufas - Grade responsiva de cards de estufas.
 *
 * Renderiza uma grade CSS de CardEstufa.jsx.
 * Se não houver estufas, exibe um estado vazio com instrução.
 * Responsivo: 1 coluna no mobile, 2 no tablet, 3-4 no desktop.
 */

// Grade de cards que lista as estufas cadastradas, repassando ações de edição e exclusão para cada item.
import React from 'react';
// CardEstufa: card visual de cada estufa individual
import { CardEstufa } from './CardEstufa.jsx';

export const GridEstufas = ({
  estufas,
  // Callback chamado quando o usuário clica em "Abrir estufa" em qualquer card
  onOpen,
  // Função que recebe uma estufa e retorna { typeVisual, logoVisual } para o card
  getCardVisual
}) => {
  // Estado vazio: nenhuma estufa corresponde ao filtro atual
  if (estufas.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 dark:text-stone-400">
        Nenhuma estufa encontrada com esse filtro. Ajuste a busca e tente novamente.
      </div>
    );
  }

  // Grade com colunas automáticas - auto-rows-fr faz todos os cards da mesma linha terem a mesma altura
  return (
    <section className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {estufas.map((greenhouse) => {
        // Resolve as configurações visuais (cores, ícone) para o tipo de cultivo desta estufa
        const visual = getCardVisual(greenhouse);

        return (
          <CardEstufa
            key={greenhouse.id}
            greenhouse={greenhouse}
            typeVisual={visual.typeVisual}
            logoVisual={visual.logoVisual}
            // Currying do ID: o card não precisa saber qual estufa é
            onOpen={() => onOpen(greenhouse.id)}
          />
        );
      })}
    </section>
  );
};
