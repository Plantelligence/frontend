// Página de histórico de relatórios periódicos por estufa.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';
import { useAuthStore } from '../store/authStore.js';
import { listGreenhouses } from '../api/greenhouseService.js';
import { listRelatorios, createRelatorio, deleteRelatorio, getRelatorioResumo } from '../api/relatorioService.js';

// formata ISO para dd/mm/aaaa
const formatDate = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('pt-BR');
  } catch {
    return iso;
  }
};

// datas padrão: início = 1º do mês atual, fim = hoje
const defaultPeriodDates = () => {
  const fim = new Date();
  const inicio = new Date(fim.getFullYear(), fim.getMonth(), 1);
  const toInput = (d) => d.toISOString().slice(0, 10);
  return { inicio: toInput(inicio), fim: toInput(fim) };
};

// componente de formulário de criação de relatório
function RelatorioForm({ onSave, onCancel, saving, estufaId }) {
  const defaults = defaultPeriodDates();
  const [form, setForm] = useState({
    periodoInicio: defaults.inicio,
    periodoFim: defaults.fim,
    avgTemperatura: '',
    avgUmidade: '',
    avgUmidadeSolo: '',
    avgLuminosidade: '',
    resumo: '',
  });
  const [loadingResumo, setLoadingResumo] = useState(false);
  const [resumoMsg, setResumoMsg] = useState(null);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleBuscarMedias = async () => {
    if (!estufaId || !form.periodoInicio || !form.periodoFim) return;
    setLoadingResumo(true);
    setResumoMsg(null);
    try {
      const data = await getRelatorioResumo(estufaId, form.periodoInicio, form.periodoFim);
      if (!data.tem_dados) {
        setResumoMsg('Nenhum dado de sensor encontrado para o período. Preencha manualmente.');
        return;
      }
      setForm((prev) => ({
        ...prev,
        avgTemperatura: data.avg_temperatura ?? prev.avgTemperatura,
        avgUmidade: data.avg_umidade ?? prev.avgUmidade,
        avgUmidadeSolo: data.avg_umidade_solo ?? prev.avgUmidadeSolo,
        avgLuminosidade: data.avg_luminosidade ?? prev.avgLuminosidade,
      }));
      setResumoMsg('Médias preenchidas automaticamente a partir dos dados dos sensores.');
    } catch {
      setResumoMsg('Não foi possível buscar os dados. Preencha manualmente.');
    } finally {
      setLoadingResumo(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      periodoInicio: form.periodoInicio,
      periodoFim: form.periodoFim,
      avgTemperatura: form.avgTemperatura.trim() || null,
      avgUmidade: form.avgUmidade.trim() || null,
      avgUmidadeSolo: form.avgUmidadeSolo.trim() || null,
      avgLuminosidade: form.avgLuminosidade.trim() || null,
      resumo: form.resumo.trim() || null,
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-8 backdrop-blur-sm" onClick={onCancel}>
      <aside
        className="w-full max-w-2xl rounded-2xl border border-stone-800/60 bg-[#0f0c0c] shadow-2xl my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-stone-200 px-5 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-red-400">Novo relatório</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-800 dark:text-stone-100">Registrar período</h2>
          </div>
          <button type="button" onClick={onCancel}
            className="ml-4 mt-0.5 rounded-lg p-1.5 text-slate-400 dark:text-stone-500 transition hover:bg-stone-100 hover:text-slate-700">
            <i className="fa-solid fa-xmark text-base" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => { if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') e.preventDefault(); }}
          className="flex flex-col"
        >
          <div className="space-y-4 overflow-y-auto px-5 py-4" style={{ maxHeight: '65vh' }}>
            {/* período */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-stone-400">Início do período</label>
                <input
                  type="date"
                  value={form.periodoInicio}
                  onChange={(e) => update('periodoInicio', e.target.value)}
                  required
                  className="rounded border border-stone-300 bg-white dark:bg-stone-800 px-3 py-2 text-sm text-slate-800 dark:text-stone-100 outline-none focus:border-red-400"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-stone-400">Fim do período</label>
                <input
                  type="date"
                  value={form.periodoFim}
                  onChange={(e) => update('periodoFim', e.target.value)}
                  required
                  className="rounded border border-stone-300 bg-white dark:bg-stone-800 px-3 py-2 text-sm text-slate-800 dark:text-stone-100 outline-none focus:border-red-400"
                />
              </div>
            </div>

            {/* médias opcionais */}
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-stone-500">Médias do período (opcional)</p>
                <button
                  type="button"
                  onClick={handleBuscarMedias}
                  disabled={loadingResumo || !form.periodoInicio || !form.periodoFim}
                  className="rounded border border-red-200 bg-red-50 px-3 py-1 text-[11px] font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-40"
                >
                  {loadingResumo ? 'Buscando...' : 'Calcular do sensor'}
                </button>
              </div>
              {resumoMsg ? (
                <p className={`mb-3 rounded-md border px-3 py-2 text-[11px] ${resumoMsg.startsWith('Médias preenchidas') ? 'border-green-200 bg-green-50 text-green-700' : 'border-stone-100 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/40 text-slate-500 dark:text-stone-400'}`}>
                  {resumoMsg}
                </p>
              ) : (
                <p className="mb-3 rounded-md border border-stone-100 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/40 px-3 py-2 text-[11px] text-slate-500 dark:text-stone-400">
                  Clique em "Calcular do sensor" para preencher automaticamente a partir dos dados gravados, ou preencha manualmente.
                </p>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-600 dark:text-stone-400">Temperatura média (°C)</label>
                  <input
                    type="text"
                    value={form.avgTemperatura}
                    onChange={(e) => update('avgTemperatura', e.target.value)}
                    placeholder="Ex: 16.5"
                    className="rounded border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm text-slate-800 dark:text-stone-100 placeholder:text-slate-400 outline-none focus:border-red-400"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-600 dark:text-stone-400">Umidade do ar média (%)</label>
                  <input
                    type="text"
                    value={form.avgUmidade}
                    onChange={(e) => update('avgUmidade', e.target.value)}
                    placeholder="Ex: 88"
                    className="rounded border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm text-slate-800 dark:text-stone-100 placeholder:text-slate-400 outline-none focus:border-red-400"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-600 dark:text-stone-400">Umidade do solo média (%)</label>
                  <input
                    type="text"
                    value={form.avgUmidadeSolo}
                    onChange={(e) => update('avgUmidadeSolo', e.target.value)}
                    placeholder="Ex: 63"
                    className="rounded border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm text-slate-800 dark:text-stone-100 placeholder:text-slate-400 outline-none focus:border-red-400"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-600 dark:text-stone-400">Luminosidade média (lux)</label>
                  <input
                    type="text"
                    value={form.avgLuminosidade}
                    onChange={(e) => update('avgLuminosidade', e.target.value)}
                    placeholder="Ex: 250"
                    className="rounded border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm text-slate-800 dark:text-stone-100 placeholder:text-slate-400 outline-none focus:border-red-400"
                  />
                </div>
              </div>
            </div>

            {/* resumo operacional */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-stone-400">Resumo do período</label>
              <textarea
                value={form.resumo}
                onChange={(e) => update('resumo', e.target.value)}
                rows={4}
                placeholder="Descreva as principais ações realizadas e observações do período..."
                className="w-full resize-none rounded border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm text-slate-800 dark:text-stone-100 placeholder:text-slate-400 outline-none focus:border-red-400"
              />
            </div>
          </div>

          <div className="flex gap-2 border-t border-stone-200 px-5 py-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded border border-stone-200 dark:border-stone-700 px-3 py-2 text-sm text-stone-700 dark:text-stone-300 transition hover:bg-stone-50 dark:hover:bg-stone-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar relatório'}
            </button>
          </div>
        </form>
      </aside>
    </div>,
    document.body
  );
}

// card de exibição de um relatório
function RelatorioCard({ relatorio, onDelete, readOnly }) {
  return (
    <article className="rounded-2xl border border-stone-200 bg-white dark:border-stone-800/60 dark:bg-stone-900/35 p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-stone-100">
            {formatDate(relatorio.periodoInicio)} — {formatDate(relatorio.periodoFim)}
          </p>
          <p className="text-[10px] text-slate-400 dark:text-stone-500 mt-0.5">
            Gerado em {formatDate(relatorio.criadoEm)}
          </p>
        </div>
        {!readOnly && (
          <button
            type="button"
            onClick={() => onDelete(relatorio)}
            className="shrink-0 text-[11px] text-slate-400 dark:text-stone-500 border border-stone-200 dark:border-stone-700 rounded px-2 py-1 transition hover:border-rose-300 hover:text-rose-600"
          >
            Remover
          </button>
        )}
      </div>

      {/* médias */}
      {(relatorio.avgTemperatura || relatorio.avgUmidade || relatorio.avgUmidadeSolo || relatorio.avgLuminosidade) && (
        <div className="grid gap-2 grid-cols-2 sm:grid-cols-4">
          {relatorio.avgTemperatura && (
            <div className="rounded border border-stone-100 bg-stone-50 dark:bg-stone-800/40 px-3 py-2">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-stone-500">Temperatura</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-stone-100">{relatorio.avgTemperatura}°C</p>
            </div>
          )}
          {relatorio.avgUmidade && (
            <div className="rounded border border-stone-100 bg-stone-50 dark:bg-stone-800/40 px-3 py-2">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-stone-500">Umidade do ar</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-stone-100">{relatorio.avgUmidade}%</p>
            </div>
          )}
          {relatorio.avgUmidadeSolo && (
            <div className="rounded border border-stone-100 bg-stone-50 dark:bg-stone-800/40 px-3 py-2">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-stone-500">Umidade do solo</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-stone-100">{relatorio.avgUmidadeSolo}%</p>
            </div>
          )}
          {relatorio.avgLuminosidade && (
            <div className="rounded border border-stone-100 bg-stone-50 dark:bg-stone-800/40 px-3 py-2">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-stone-500">Luminosidade</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-stone-100">{relatorio.avgLuminosidade} lux</p>
            </div>
          )}
        </div>
      )}

      {/* resumo operacional */}
      {relatorio.resumo && (
        <p className="text-sm text-slate-600 dark:text-stone-400 leading-relaxed border-t border-stone-100 dark:border-stone-700 pt-2">
          {relatorio.resumo}
        </p>
      )}
    </article>
  );
}

export const RelatoriosPage = () => {
  const user = useAuthStore((state) => state.user);
  const isReader = user?.role === 'Reader';

  const [greenhouses, setGreenhouses] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [relatorios, setRelatorios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // carrega lista de estufas disponíveis
  useEffect(() => {
    listGreenhouses()
      .then((res) => {
        const list = res?.greenhouses ?? [];
        setGreenhouses(list);
        if (list.length > 0 && !selectedId) {
          setSelectedId(list[0].id);
        }
      })
      .catch(() => setError('Não foi possível carregar as estufas.'));
  }, []);

  // carrega relatórios da estufa selecionada
  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    setError(null);
    listRelatorios(selectedId)
      .then((res) => setRelatorios(res.relatorios ?? []))
      .catch(() => setError('Não foi possível carregar os relatórios.'))
      .finally(() => setLoading(false));
  }, [selectedId]);

  const handleSave = useCallback(async (payload) => {
    if (!selectedId) return;
    setSaving(true);
    setError(null);
    try {
      const { relatorio } = await createRelatorio(selectedId, payload);
      setRelatorios((prev) => [relatorio, ...prev]);
      setFormOpen(false);
    } catch {
      setError('Não foi possível salvar o relatório.');
    } finally {
      setSaving(false);
    }
  }, [selectedId]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget || !selectedId) return;
    setSaving(true);
    try {
      await deleteRelatorio(selectedId, deleteTarget.id);
      setRelatorios((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      setError('Não foi possível remover o relatório.');
    } finally {
      setSaving(false);
    }
  }, [deleteTarget, selectedId]);

  const selectedGreenhouse = useMemo(
    () => greenhouses.find((g) => g.id === selectedId) ?? null,
    [greenhouses, selectedId]
  );

  return (
    <>
          <section className="relative rounded-[26px] dark:bg-[#0f0c0c] p-4 md:p-6 overflow-y-auto">

            {/* painel de criação */}
            {formOpen && (
              <RelatorioForm
                onSave={handleSave}
                onCancel={() => setFormOpen(false)}
                saving={saving}
                estufaId={selectedId}
              />
            )}

            <header className="mb-4 rounded-2xl border border-stone-300 bg-white dark:border-stone-800/60 dark:bg-stone-900/35 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Histórico</p>
                  <h1 className="mt-1 text-2xl font-semibold text-slate-800 dark:text-stone-100">Relatórios da estufa</h1>
                  <p className="mt-1 text-sm text-slate-600 dark:text-stone-400">Registre as médias mensais dos 4 sensores e anote o que aconteceu na estufa no período.</p>
                </div>
                {!isReader && selectedId && (
                  <button
                    type="button"
                    onClick={() => setFormOpen(true)}
                    className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                  >
                    + Novo relatório
                  </button>
                )}
              </div>
            </header>

            {/* seletor de estufa */}
            {greenhouses.length > 1 && (
              <div className="mb-4 rounded-2xl border border-stone-200 bg-white dark:border-stone-800/60 dark:bg-stone-900/35 px-4 py-3">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-stone-400 mb-2">
                  Estufa
                </label>
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="w-full rounded border border-stone-300 bg-white dark:bg-stone-800 px-3 py-2 text-sm text-slate-800 dark:text-stone-100 outline-none focus:border-red-400 sm:w-auto"
                >
                  {greenhouses.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* cabeçalho com estufa selecionada */}
            {selectedGreenhouse && greenhouses.length === 1 && (
              <div className="mb-4 rounded-2xl border border-stone-200 bg-white dark:border-stone-800/60 dark:bg-stone-900/35 px-4 py-3">
                <p className="text-xs text-slate-500 dark:text-stone-400">Exibindo relatórios de</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-stone-100">{selectedGreenhouse.name}</p>
              </div>
            )}

            {/* erros */}
            {error && (
              <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
            )}

            {/* lista de relatórios */}
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-36 animate-pulse rounded-2xl border border-stone-200 bg-white dark:border-stone-800/60 dark:bg-stone-900/35" />
                ))}
              </div>
            ) : relatorios.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 dark:border-stone-700/40 dark:bg-stone-800/40 p-10 text-center">
                <p className="text-sm text-slate-600 dark:text-stone-400">Nenhum relatório registrado para esta estufa.</p>
                {!isReader && (
                  <p className="mt-1 text-xs text-slate-400 dark:text-stone-500">Clique em "Novo relatório" para registrar o primeiro período.</p>
                )}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {relatorios.map((r) => (
                  <RelatorioCard
                    key={r.id}
                    relatorio={r}
                    onDelete={isReader ? null : () => setDeleteTarget(r)}
                  />
                ))}
              </div>
            )}
          </section>

          <ConfirmDialog
            open={!!deleteTarget}
            title="Remover relatório"
            description={`Deseja remover o relatório do período ${deleteTarget?.periodo_inicio ?? ''}? Esta ação não pode ser desfeita.`}
            onConfirm={handleConfirmDelete}
            onCancel={() => setDeleteTarget(null)}
            confirmLabel="Remover"
            cancelLabel="Cancelar"
          />
    </>
  );
};
