// Testes — Componente ConfirmDialog
// Verifica visibilidade, callbacks e conteúdo do modal de confirmação.

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDialog } from '../../components/ConfirmDialog.jsx';

describe('ConfirmDialog', () => {

  it('não renderiza nada quando open=false', () => {
    render(
      <ConfirmDialog
        open={false}
        title="Confirmar exclusão"
        description="Tem certeza?"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    expect(screen.queryByText('Confirmar exclusão')).not.toBeInTheDocument();
  });

  it('renderiza o título quando open=true', () => {
    render(
      <ConfirmDialog
        open={true}
        title="Remover estufa"
        description="Esta ação não pode ser desfeita."
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    expect(screen.getByText('Remover estufa')).toBeInTheDocument();
  });

  it('renderiza a descrição quando open=true', () => {
    render(
      <ConfirmDialog
        open={true}
        title="Titulo"
        description="Esta ação não pode ser desfeita."
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    expect(screen.getByText('Esta ação não pode ser desfeita.')).toBeInTheDocument();
  });

  it('chama onConfirm ao clicar no botão de confirmação', () => {
    const handleConfirm = vi.fn();
    render(
      <ConfirmDialog
        open={true}
        title="Excluir"
        description="Confirma?"
        confirmLabel="Sim, excluir"
        onConfirm={handleConfirm}
        onCancel={() => {}}
      />
    );
    fireEvent.click(screen.getByText('Sim, excluir'));
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it('chama onCancel ao clicar no botão de cancelamento', () => {
    const handleCancel = vi.fn();
    render(
      <ConfirmDialog
        open={true}
        title="Excluir"
        description="Confirma?"
        onConfirm={() => {}}
        onCancel={handleCancel}
      />
    );
    fireEvent.click(screen.getByText('Cancelar'));
    expect(handleCancel).toHaveBeenCalledTimes(1);
  });

  it('usa labels customizados para os botões', () => {
    render(
      <ConfirmDialog
        open={true}
        title="Remover"
        description="Tem certeza?"
        confirmLabel="Deletar agora"
        cancelLabel="Voltar"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    expect(screen.getByText('Deletar agora')).toBeInTheDocument();
    expect(screen.getByText('Voltar')).toBeInTheDocument();
  });

});
