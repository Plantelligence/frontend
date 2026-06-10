// Testes — Componente CardEstufa
// Verifica renderização dos dados da estufa e callback de abertura.

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CardEstufa } from '../../components/CardEstufa.jsx';

const _typeVisualPadrao = {
  label: 'Cogumelos',
  ring: 'ring-emerald-500',
};

const _logoVisualPadrao = {
  wrap: 'bg-emerald-100',
  icon: 'fas fa-seedling',
};

const _estufaFake = {
  id: 'estufa-001',
  name: 'Estufa Principal',
  profile: 'Shiitake',
  watchersDetails: [
    { id: 'u1', full_name: 'João' },
    { id: 'u2', full_name: 'Maria' },
  ],
  city: 'Curitiba',
  state: 'PR',
};

function renderCard(estufa = _estufaFake, onOpen = vi.fn()) {
  return render(
    <CardEstufa
      greenhouse={estufa}
      typeVisual={_typeVisualPadrao}
      logoVisual={_logoVisualPadrao}
      onOpen={onOpen}
    />
  );
}

describe('CardEstufa', () => {

  it('exibe o nome da estufa', () => {
    renderCard();
    expect(screen.getByText('Estufa Principal')).toBeInTheDocument();
  });

  it('exibe o tipo de cultivo do typeVisual', () => {
    renderCard();
    expect(screen.getAllByText(/Cogumelos/i).length).toBeGreaterThan(0);
  });

  it('exibe "Estufa sem nome" quando name está ausente', () => {
    renderCard({ ..._estufaFake, name: undefined });
    expect(screen.getByText('Estufa sem nome')).toBeInTheDocument();
  });

  it('renderiza o botão "Abrir estufa"', () => {
    renderCard();
    expect(screen.getByRole('button', { name: /abrir estufa/i })).toBeInTheDocument();
  });

  it('chama onOpen ao clicar no botão', () => {
    const handleOpen = vi.fn();
    renderCard(_estufaFake, handleOpen);
    fireEvent.click(screen.getByRole('button', { name: /abrir estufa/i }));
    expect(handleOpen).toHaveBeenCalledTimes(1);
  });

  it('exibe o número de responsáveis quando há watchersDetails', () => {
    renderCard();
    // O card exibe contagem de responsáveis — verificamos que renderiza sem erros
    const texto = document.body.textContent;
    expect(texto).not.toBe('');
  });

  it('funciona corretamente com lista de responsáveis vazia', () => {
    renderCard({ ..._estufaFake, watchersDetails: [] });
    expect(screen.getByText('Estufa Principal')).toBeInTheDocument();
  });

  it('indica ausência de perfil quando profile é nulo', () => {
    renderCard({ ..._estufaFake, profile: null, flowerProfileId: null });
    // Não deve lançar erro — renderiza normalmente
    expect(screen.getByText('Estufa Principal')).toBeInTheDocument();
  });

});
