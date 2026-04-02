// Exibe o histórico de eventos de segurança do usuário logado (logins, falhas, etc.).
import React, { useEffect, useState } from 'react';
import { Button } from '../components/Button.jsx';
import { useAuthStore } from '../store/authStore.js';
import { getSecurityLogs } from '../api/userService.js';

export const SecurityLogsPage = () => {
  const { user } = useAuthStore((state) => ({ user: state.user }));
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isAdmin = user?.role === 'Admin';

  const getActionTone = (action = '') => {
    const normalized = String(action).toLowerCase();
    if (normalized.includes('delete') || normalized.includes('remove') || normalized.includes('fail')) {
      return 'border-rose-200 bg-rose-50 text-rose-700';
    }
    if (normalized.includes('update') || normalized.includes('change') || normalized.includes('role')) {
      return 'border-amber-200 bg-amber-50 text-amber-700';
    }
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  };

  const fetchLogs = async () => {
    if (!isAdmin) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await getSecurityLogs();
      setLogs(result.logs ?? []);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Não foi possível carregar os logs de segurança.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchLogs();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6">
        <div className="rounded-[30px] bg-[#181415] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.35)] md:p-6">
          <div className="rounded-[26px] bg-[#f5f1eb] p-6">
            <h1 className="text-2xl font-semibold text-slate-800">Logs de segurança</h1>
            <p className="mt-2 text-sm text-slate-600">
              Apenas administradores podem acessar trilhas de auditoria e eventos sensíveis do sistema.
            </p>
            <p className="mt-4 rounded border border-stone-200 bg-white px-4 py-3 text-sm text-slate-600">
              Solicite acesso ao time responsável por governança e compliance.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6">
      <div className="rounded-[30px] bg-[#181415] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.35)] md:p-6">
        <header className="rounded-[26px] bg-[#f5f1eb] p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-700">Compliance</p>
              <h1 className="mt-1 text-2xl font-semibold text-slate-800">Logs de segurança</h1>
              <p className="mt-1 text-sm text-slate-600">
                Registro auditável de ações críticas no sistema.
              </p>
            </div>
            <Button variant="secondary" onClick={fetchLogs} disabled={loading}>
              {loading ? 'Atualizando...' : 'Atualizar logs'}
            </Button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <article className="rounded-xl border border-stone-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-red-700">Eventos carregados</p>
              <p className="mt-1 text-2xl font-semibold text-slate-800">{logs.length}</p>
            </article>
            <article className="rounded-xl border border-stone-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-red-700">Última atualização</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{loading ? 'Atualizando...' : 'Concluída'}</p>
            </article>
            <article className="rounded-xl border border-stone-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-red-700">Integridade</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">Hash encadeado ativo</p>
            </article>
          </div>

          {error ? (
            <p className="mt-4 rounded border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
          ) : null}
        </header>

        <section className="mt-4 rounded-[26px] bg-[#f5f1eb] p-5 md:p-6">
          {logs.length === 0 && !loading ? (
            <p className="rounded border border-stone-200 bg-white px-4 py-3 text-sm text-slate-600">
              Nenhum evento recente encontrado. Novas entradas aparecem conforme ações sensíveis forem executadas.
            </p>
          ) : (
            <div className="max-h-[560px] space-y-3 overflow-y-auto pr-1">
              {logs.map((entry) => (
                <article key={entry.id} className="rounded-xl border border-stone-200 bg-white p-4">
                  <header className="flex flex-wrap items-center justify-between gap-2">
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getActionTone(entry.action)}`}>
                      {entry.action}
                    </span>
                    <span className="text-xs text-slate-500">{entry.createdAt}</span>
                  </header>

                  <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                    <p><strong className="text-slate-700">Usuário:</strong> {entry.userId ?? 'Não informado'}</p>
                    <p><strong className="text-slate-700">Hash:</strong> {entry.hash ?? '—'}</p>
                    <p className="sm:col-span-2"><strong className="text-slate-700">Hash anterior:</strong> {entry.prevHash ?? '—'}</p>
                  </div>

                  {entry.metadata ? (
                    <pre className="mt-3 whitespace-pre-wrap rounded-lg border border-stone-200 bg-[#fcfaf7] p-3 text-[11px] text-slate-600">
                      {JSON.stringify(entry.metadata, null, 2)}
                    </pre>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
