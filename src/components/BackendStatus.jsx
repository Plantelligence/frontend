import React, { useState } from 'react';

// Lê a URL base da API da variável de ambiente e remove barras finais
const API_URL =
  (import.meta.env?.VITE_APP_API_URL ?? '').replace(/\/+$/, '') || '';

/**
 * Botão de teste de conexão com o backend.
 * Chama GET /ping (sem autenticação) e exibe o resultado.
 * Útil para diagnóstico de CORS e disponibilidade do servidor.
 */
export const BackendStatus = () => {
  // status: null=inicial | 'loading'=testando | 'ok'=sucesso | 'error'=falha
  const [status, setStatus] = useState(null);
  // Mensagem detalhada do resultado do teste para exibir ao usuário
  const [detail, setDetail] = useState('');

  // Dispara o teste de conectividade ao clicar no botão
  const handleTest = async () => {
    setStatus('loading');
    setDetail('');

    // Usa a URL absoluta da API se configurada, ou a rota relativa /ping pelo proxy do Vite
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
        // Backend respondeu com sucesso: exibe o JSON retornado para debug
        const data = await res.json();
        setStatus('ok');
        setDetail(`Backend respondeu: ${JSON.stringify(data)}`);
      } else {
        // Servidor está acessível mas retornou erro HTTP
        setStatus('error');
        setDetail(`HTTP ${res.status} — servidor retornou erro.`);
      }
    } catch (err) {
      setStatus('error');
      // Distingue erros de rede (CORS, servidor offline) de outros erros
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
        <span className="text-slate-400 dark:text-stone-500">Diagnóstico de conexão com o backend</span>
        {/* Botão desabilitado durante o teste para evitar múltiplas requisições simultâneas */}
        <button
          type="button"
          onClick={handleTest}
          disabled={status === 'loading'}
          className="rounded-md border border-slate-600 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200 transition hover:bg-slate-700 disabled:opacity-50"
        >
          {status === 'loading' ? 'Testando…' : 'Testar conexão'}
        </button>
      </div>

      {/* Resultado de sucesso: backend respondeu corretamente */}
      {status === 'ok' && (
        <p className="flex items-center gap-1.5 text-emerald-400">
          <span>✅</span>
          <span>{detail}</span>
        </p>
      )}

      {/* Resultado de erro: servidor inacessível ou retornou código de falha */}
      {status === 'error' && (
        <p className="flex items-start gap-1.5 text-rose-400">
          <span className="mt-px">❌</span>
          {/* break-all para URLs longas não quebrarem o layout */}
          <span className="break-all">{detail}</span>
        </p>
      )}

      {/* Estado inicial: exibe a URL configurada para referência */}
      {status === null && (
        <p className="text-slate-500 dark:text-stone-400 text-xs">
          URL configurada: <code className="text-slate-400 dark:text-stone-500">{API_URL || '(relativa /api)'}</code>
        </p>
      )}
    </div>
  );
};
