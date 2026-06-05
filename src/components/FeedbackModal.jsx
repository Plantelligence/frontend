/**
 * FeedbackModal — Modal para envio de feedback/sugestões pelo usuário autenticado.
 * Envia e-mail para contato@plantelligence.cloud via API.
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../api/client.js';

const TYPES = [
  { id: 'sugestao', icon: 'fa-lightbulb',         label: 'Sugestão',  color: 'text-amber-500' },
  { id: 'bug',      icon: 'fa-triangle-exclamation', label: 'Problema', color: 'text-rose-500' },
  { id: 'elogio',   icon: 'fa-star',               label: 'Elogio',    color: 'text-emerald-500' },
  { id: 'outro',    icon: 'fa-comment',             label: 'Outro',     color: 'text-blue-500' },
];

export const FeedbackModal = ({ open, onClose }) => {
  const [type, setType]       = useState('sugestao');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || message.length < 10) {
      setError('Por favor escreva pelo menos 10 caracteres.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await api.post('/site/feedback', { type, message: message.trim() });
      setSent(true);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Não foi possível enviar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => { setMessage(''); setSent(false); setError(null); setType('sugestao'); }, 300);
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-6 backdrop-blur-sm" onClick={handleClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-stone-200 bg-white shadow-2xl dark:border-stone-700 dark:bg-[#1e1a18] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4 dark:border-stone-700">
          <div className="flex items-center gap-2.5">
            <i className="fa-solid fa-paper-plane text-red-500" />
            <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-100">Enviar feedback</h2>
          </div>
          <button type="button" onClick={handleClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-stone-800 dark:hover:text-stone-200 transition">
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        </div>

        {sent ? (
          /* Sucesso */
          <div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10">
              <i className="fa-solid fa-check text-2xl text-emerald-500" />
            </div>
            <div>
              <p className="text-base font-semibold text-stone-800 dark:text-stone-100">Obrigado pelo feedback!</p>
              <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                Sua mensagem foi enviada para nossa equipe e será analisada em breve.
              </p>
            </div>
            <button type="button" onClick={handleClose}
              className="mt-2 rounded-xl bg-red-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition">
              Fechar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Sua mensagem será enviada diretamente para nossa equipe. Adoramos ouvir sugestões e relatos de melhoria!
            </p>

            {/* Tipo */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">Tipo</p>
              <div className="grid grid-cols-4 gap-2">
                {TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setType(t.id)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border py-3 text-xs font-medium transition ${
                      type === t.id
                        ? 'border-red-400 bg-red-50 text-red-600 dark:border-red-500/60 dark:bg-red-500/10 dark:text-red-400'
                        : 'border-stone-200 bg-stone-50 text-stone-500 hover:border-stone-300 hover:bg-white dark:border-stone-700 dark:bg-stone-800/50 dark:text-stone-400 dark:hover:border-stone-600'
                    }`}
                  >
                    <i className={`fa-solid ${t.icon} text-base ${type === t.id ? 'text-red-500' : t.color}`} />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mensagem */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Mensagem
              </label>
              <textarea
                value={message}
                onChange={(e) => { setMessage(e.target.value); setError(null); }}
                placeholder="Descreva sua sugestão, problema ou elogio com detalhes..."
                rows={5}
                maxLength={2000}
                className="w-full resize-none rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 outline-none transition focus:border-red-400 focus:ring-1 focus:ring-red-400/30 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100 dark:placeholder:text-stone-500"
              />
              <div className="mt-1 flex items-center justify-between">
                {error
                  ? <p className="text-[11px] text-rose-500">{error}</p>
                  : <span />}
                <p className="text-[10px] text-stone-400">{message.length}/2000</p>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || message.trim().length < 10}
              className="w-full rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? <><i className="fa-solid fa-circle-notch fa-spin mr-1.5" />Enviando...</> : 'Enviar feedback'}
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};
