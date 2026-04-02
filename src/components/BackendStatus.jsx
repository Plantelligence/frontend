import React, { useState } from 'react';

const API_URL =
  (import.meta.env?.VITE_APP_API_URL ?? '').replace(/\/+$/, '') || '';

/**
 * Botão de teste de conexão com o backend.
 * Chama GET /ping (sem autenticação) e exibe o resultado.
 * Útil para diagnóstico de CORS e disponibilidade do servidor.
 */
export const BackendStatus = () => {
  const [status, setStatus] = useState(null); // null | 'loading' | 'ok' | 'error'
  const [detail, setDetail] = useState('');

  const handleTest = async () => {
    setStatus('loading');
    setDetail('');

    const pingUrl = API_URL
      ? `${API_URL}/ping`
      : '/ping';

    try {
      const res = await fetch(pingUrl, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        // sem credentials para o ping — só testa CORS + disponibilidade
      });

      if (res.ok) {
        const data = await res.json();
        setStatus('ok');
        setDetail(`Backend respondeu: ${JSON.stringify(data)}`);
      } else {
        setStatus('error');
        setDetail(`HTTP ${res.status} — servidor retornou erro.`);
      }
    } catch (err) {
      setStatus('error');
      setDetail(
        err?.message?.includes('NetworkError') || err?.message?.includes('Failed to fetch')
          ? `Sem resposta do servidor (possível CORS ou servidor offline). URL: ${pingUrl}`
          : err?.message ?? 'Erro de rede desconhecido.'
      );
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-700 bg-slate-900/40 px-4 py-3 text-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-slate-400">Diagnóstico de conexão com o backend</span>
        <button
          type="button"
          onClick={handleTest}
          disabled={status === 'loading'}
          className="rounded-md border border-slate-600 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200 transition hover:bg-slate-700 disabled:opacity-50"
        >
          {status === 'loading' ? 'Testando…' : 'Testar conexão'}
        </button>
      </div>

      {status === 'ok' && (
        <p className="flex items-center gap-1.5 text-emerald-400">
          <span>✅</span>
          <span>{detail}</span>
        </p>
      )}

      {status === 'error' && (
        <p className="flex items-start gap-1.5 text-rose-400">
          <span className="mt-px">❌</span>
          <span className="break-all">{detail}</span>
        </p>
      )}

      {status === null && (
        <p className="text-slate-500 text-xs">
          URL configurada: <code className="text-slate-400">{API_URL || '(relativa /api)'}</code>
        </p>
      )}
    </div>
  );
};
