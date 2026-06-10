/**
 * ConfirmDialog - Modal de confirmação genérico.
 *
 * Exibido antes de ações destrutivas (remover estufa, remover relatório etc.)
 * para evitar cliques acidentais. Renderizado via createPortal diretamente
 * no document.body para não ser afetado por overflow:hidden dos containers.
 *
 * Props:
 *   open         {boolean}  - Controla visibilidade
 *   title        {string}   - Título do modal
 *   description  {string}   - Mensagem de confirmação
 *   onConfirm    {Function} - Callback ao confirmar
 *   onCancel     {Function} - Callback ao cancelar
 *   confirmLabel {string}   - Texto do botão de confirmação
 */

// Dialog de confirmacao generico usado para acoes criticas que exigem aprovacao do usuario.
import React from 'react';
// createPortal: renderiza o modal fora da árvore de DOM normal para evitar problemas de z-index
import { createPortal } from 'react-dom';
// Button: componente padrão de botão com variantes de estilo
import { Button } from './Button.jsx';

export const ConfirmDialog = ({
  // Se false, o componente não renderiza nada
  open,
  // Título em destaque do modal
  title,
  // Mensagem explicativa sobre a ação que será confirmada
  description,
  // Texto do botão de confirmação — padrão genérico, substituível por ação específica
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  // Permite desabilitar o botão de confirmação durante operações assíncronas
  confirmDisabled = false,
  cancelDisabled = false,
  // Callback executado quando o usuário confirma a ação
  onConfirm,
  // Callback executado ao cancelar ou fechar o modal
  onCancel
}) => {
  // Otimização: não monta o DOM do modal quando ele não está visível
  if (!open) {
    return null;
  }

  const dialog = (
    // Overlay escuro de fundo cobrindo toda a tela
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4">
      {/* Card central do modal com borda e sombra */}
      <div className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-900 p-6 text-center shadow-xl">
        {/* Título da ação a confirmar */}
        <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
        {/* Descrição com as consequências da ação */}
        <p className="mt-2 text-sm text-slate-300">{description}</p>
        {/* Botões de ação: cancelar (secondary) e confirmar (danger) */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {/* Botão de cancelamento: aparece primeiro visualmente para reduzir cliques acidentais na confirmação */}
          <Button
            variant="secondary"
            className="w-full sm:w-36"
            onClick={onCancel}
            disabled={cancelDisabled}
          >
            {cancelLabel}
          </Button>
          {/* Botão de confirmação em vermelho para indicar que é uma ação destrutiva */}
          <Button
            variant="danger"
            className="w-full sm:w-36"
            onClick={onConfirm}
            disabled={confirmDisabled}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );

  // Renderiza o modal diretamente no body para garantir que fique acima de tudo
  return createPortal(dialog, document.body);
};
