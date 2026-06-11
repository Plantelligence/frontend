/**
 * RelatoriosPage - Histórico de relatórios periódicos por estufa.
 *
 * Exibe relatórios gerados (manual ou automaticamente toda segunda-feira).
 * Cada relatório contém médias de sensores e observações do período.
 * Permite criar novos relatórios com médias preenchidas automaticamente
 * via consulta ao InfluxDB (botão "Buscar médias").
 *
 * Validação: ao salvar, exige pelo menos uma métrica preenchida.
 *
 * Rota: /dashboard/relatorios
 */

// Página de histórico de relatórios periódicos por estufa.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';
import { useAuthStore } from '../store/authStore.js';
import { listGreenhouses } from '../api/greenhouseService.js';
import { listRelatorios, createRelatorio, deleteRelatorio, getRelatorioResumo, exportRelatorios } from '../api/relatorioService.js';

// formata número para 1 casa decimal; para luminosidade usa 0 casas
const fmtVal = (v, decimals = 1) => {
  if (v == null || v === '') return null;
  const n = parseFloat(v);
  return isNaN(n) ? v : n.toFixed(decimals);
};

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
    const hasMetric = form.avgTemperatura.trim() || form.avgUmidade.trim() ||
                      form.avgUmidadeSolo.trim() || form.avgLuminosidade.trim();
    if (!hasMetric) {
      setResumoMsg('Preencha ao menos uma media de sensor antes de salvar.');
      return;
    }
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
                  {loadingResumo ? 'Buscando...' : 'Buscar médias do ESP32'}
                </button>
              </div>
              {resumoMsg ? (
                <p className={`mb-3 rounded-md border px-3 py-2 text-[11px] ${resumoMsg.startsWith('Médias preenchidas') ? 'border-green-200 bg-green-50 text-green-700' : 'border-stone-100 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/40 text-slate-500 dark:text-stone-400'}`}>
                  {resumoMsg}
                </p>
              ) : (
                <p className="mb-3 rounded-md border border-stone-100 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/40 px-3 py-2 text-[11px] text-slate-500 dark:text-stone-400">
                  Clique em <strong className="font-semibold text-slate-600 dark:text-stone-300">Calcular do sensor</strong> para buscar automaticamente as médias do ESP32 no período selecionado, ou preencha os valores manualmente.
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

// indicador de metrica com barra visual relativa ao valor
function MetricCell({ label, value, unit, icon, color }) {
  if (!value) return null;
  const num = parseFloat(value);
  const maxMap = { temperatura: 40, umidade: 100, umidade_solo: 100, luminosidade: 5000 };
  const pct = Math.min(100, Math.max(2, (num / (maxMap[icon] || 100)) * 100));
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-stone-500">{label}</span>
        <span className={`text-sm font-bold ${color}`}>{value}{unit}</span>
      </div>
      <div className="h-1 rounded-full bg-stone-200 dark:bg-stone-800/50">
        <div className={`h-full rounded-full ${color.replace('text-', 'bg-')}`} style={{ width: `${pct}%`, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );
}

// card moderno de relatorio
function RelatorioCard({ relatorio, onDelete }) {
  const isAuto = relatorio.autoGenerated;
  const hasMetrics = relatorio.avgTemperatura || relatorio.avgUmidade || relatorio.avgUmidadeSolo || relatorio.avgLuminosidade;

  return (
    <article className="rounded-2xl border border-stone-200 bg-white dark:border-stone-800/60 dark:bg-stone-900/35 p-5 flex flex-col gap-4 hover:border-red-200 dark:hover:border-stone-700/80 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <i className="fa-solid fa-chart-bar text-red-400 text-sm" />
            <p className="text-sm font-semibold text-stone-100">
              {formatDate(relatorio.periodoInicio)} - {formatDate(relatorio.periodoFim)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-[10px] text-stone-500">Gerado em {formatDate(relatorio.criadoEm)}</p>
            {isAuto && (
              <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/25 bg-blue-500/10 px-2 py-0.5 text-[9px] font-semibold text-blue-400">
                <i className="fa-solid fa-robot text-[8px]" /> Auto
              </span>
            )}
          </div>
        </div>
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(relatorio)}
            className="shrink-0 rounded-lg border border-stone-700/50 p-1.5 text-stone-600 transition hover:border-rose-500/40 hover:text-rose-400"
            title="Remover relatório"
          >
            <i className="fa-solid fa-trash-can text-xs" />
          </button>
        )}
      </div>

      {hasMetrics ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border border-stone-200 bg-stone-50 dark:border-stone-800/40 dark:bg-stone-800/30 p-3">
          <MetricCell label="Temperatura" value={fmtVal(relatorio.avgTemperatura)} unit="°C" icon="temperatura" color="text-red-400" />
          <MetricCell label="Umidade do ar" value={fmtVal(relatorio.avgUmidade)} unit="%" icon="umidade" color="text-blue-400" />
          <MetricCell label="Umidade do solo" value={fmtVal(relatorio.avgUmidadeSolo)} unit="%" icon="umidade_solo" color="text-emerald-400" />
          <MetricCell label="Luminosidade" value={fmtVal(relatorio.avgLuminosidade, 0)} unit=" lux" icon="luminosidade" color="text-amber-400" />
        </div>
      ) : (
        <div className="rounded-xl border border-stone-200 bg-stone-50 dark:border-stone-800/40 dark:bg-stone-800/20 px-4 py-3 text-center">
          <p className="text-xs text-stone-600">Nenhuma metrica registrada para este periodo.</p>
        </div>
      )}

      {relatorio.resumo && (
        <div className="rounded-xl border-l-2 border-red-500/40 bg-red-50/50 dark:bg-stone-800/20 px-3 py-2">
          <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">{relatorio.resumo}</p>
        </div>
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
  const [exporting, setExporting] = useState(null); // 'pdf' | 'xlsx' | 'csv' | null

  // carrega lista de estufas disponíveis
  useEffect(() => {
    listGreenhouses()
      .then((res) => {
        const list = res?.greenhouses ?? [];
        setGreenhouses(list);
        if (list.length > 0 && !selectedId) {
          // prefere a primeira estufa que já teve ESP; caso nenhuma, usa a primeira da lista
          const firstWithDevice = list.find((g) => g.hasEverHadDevice);
          setSelectedId((firstWithDevice ?? list[0]).id);
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

  const handleExport = useCallback(async (format) => {
    if (!selectedId) return;
    setExporting(format);
    try {
      await exportRelatorios(selectedId, format);
    } catch {
      setError('Não foi possível exportar os relatórios.');
    } finally {
      setExporting(null);
    }
  }, [selectedId]);

  const selectedGreenhouse = useMemo(
    () => greenhouses.find((g) => g.id === selectedId) ?? null,
    [greenhouses, selectedId]
  );

  // metricas de resumo para os cards superiores
  const summaryStats = useMemo(() => {
    const total = relatorios.length;
    const autoCount = relatorios.filter((r) => r.autoGenerated).length;
    const withMetrics = relatorios.filter((r) => r.avgTemperatura || r.avgUmidade).length;
    return { total, autoCount, withMetrics };
  }, [relatorios]);

  return (
    <>
      <section className="relative rounded-[26px] bg-[#0f0c0c]/5 dark:bg-[#0f0c0c] p-4 md:p-6 overflow-y-auto">

        {/* painel de criacao */}
        {formOpen && (
          <RelatorioForm
            onSave={handleSave}
            onCancel={() => setFormOpen(false)}
            saving={saving}
            estufaId={selectedId}
          />
        )}

        {/* header principal */}
        <header className="mb-5 rounded-2xl border border-stone-200 bg-stone-50 dark:border-stone-800/60 dark:bg-stone-900/35 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-red-500 mb-1">Relatórios</p>
              <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">Histórico da estufa</h1>
              <p className="mt-1 text-sm text-stone-500 dark:text-stone-400 max-w-lg">
                Médias mensais de temperatura, umidade, substrato e luminosidade com observações operacionais do período.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {greenhouses.length > 1 && (
                <select
                  value={selectedId}
                  onChange={(e) => {
                    const chosen = greenhouses.find((g) => g.id === e.target.value);
                    if (chosen?.hasEverHadDevice === false) return; // bloqueia seleção sem ESP
                    setSelectedId(e.target.value);
                  }}
                  className="rounded-xl border border-stone-300 dark:border-stone-700/60 bg-white dark:bg-stone-800/60 px-3 py-2 text-sm text-stone-800 dark:text-stone-100 outline-none focus:border-red-400 transition"
                >
                  {greenhouses.map((g) => (
                    <option key={g.id} value={g.id} disabled={!g.hasEverHadDevice}>
                      {g.name}{!g.hasEverHadDevice ? ' (sem ESP)' : ''}
                    </option>
                  ))}
                </select>
              )}
              {selectedId && relatorios.length > 0 && (
                <div className="flex items-center gap-1">
                  {[
                    { fmt: 'pdf',  icon: 'fa-file-pdf',   label: 'PDF',  color: 'text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800/50 dark:hover:bg-red-900/20' },
                    { fmt: 'xlsx', icon: 'fa-file-excel',  label: 'Excel', color: 'text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800/50 dark:hover:bg-emerald-900/20' },
                    { fmt: 'csv',  icon: 'fa-file-csv',   label: 'CSV',  color: 'text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-800/50 dark:hover:bg-blue-900/20' },
                  ].map(({ fmt, icon, label, color }) => (
                    <button
                      key={fmt}
                      type="button"
                      disabled={!!exporting}
                      onClick={() => handleExport(fmt)}
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition disabled:opacity-50 ${color}`}
                      title={`Exportar ${label}`}
                    >
                      {exporting === fmt
                        ? <i className="fa-solid fa-spinner fa-spin text-xs" />
                        : <i className={`fa-solid ${icon} text-xs`} />}
                      {label}
                    </button>
                  ))}
                </div>
              )}
              {!isReader && selectedId && (
                <button
                  type="button"
                  onClick={() => setFormOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-500 active:scale-[0.98]"
                >
                  <i className="fa-solid fa-plus text-xs" />
                  Novo relatório
                </button>
              )}
            </div>
          </div>
        </header>

        {/* cards de resumo */}
        {relatorios.length > 0 && (
          <div className="mb-5 grid gap-3 grid-cols-1 sm:grid-cols-3">
            <div className="rounded-2xl border border-stone-200 bg-stone-50 dark:border-stone-800/60 dark:bg-stone-900/35 p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-red-500/10">
                <i className="fa-solid fa-chart-bar text-red-400 text-base" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-500">Total de relatórios</p>
                <p className="text-2xl font-bold text-stone-100">{summaryStats.total}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-stone-50 dark:border-stone-800/60 dark:bg-stone-900/35 p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
                <i className="fa-solid fa-robot text-blue-400 text-base" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-500">Gerados automaticamente</p>
                <p className="text-2xl font-bold text-stone-100">{summaryStats.autoCount}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-stone-50 dark:border-stone-800/60 dark:bg-stone-900/35 p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                <i className="fa-solid fa-temperature-half text-emerald-400 text-base" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-500">Com dados de sensores</p>
                <p className="text-2xl font-bold text-stone-100">{summaryStats.withMetrics}</p>
              </div>
            </div>
          </div>
        )}

        {/* erro */}
        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            <i className="fa-solid fa-circle-exclamation mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* gate: estufa sem ESP cadastrado */}
        {selectedGreenhouse && !selectedGreenhouse.hasEverHadDevice ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-amber-300/60 bg-amber-50/30 dark:border-amber-700/40 dark:bg-amber-900/10 p-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-200 bg-amber-100 dark:border-amber-700/40 dark:bg-amber-900/30">
              <i className="fa-solid fa-microchip text-xl text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">Nenhum ESP32 cadastrado nesta estufa</p>
              <p className="mt-1 text-xs text-stone-500 dark:text-stone-400 max-w-sm">
                Os relatórios são gerados a partir dos dados coletados pelos sensores do ESP32.
                Cadastre um dispositivo no painel da estufa para liberar esta funcionalidade.
              </p>
            </div>
          </div>
        ) : null}

        {/* lista de relatorios */}
        {selectedGreenhouse?.hasEverHadDevice && loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-44 animate-pulse rounded-2xl border border-stone-800/40 bg-stone-900/20" />
            ))}
          </div>
        ) : selectedGreenhouse?.hasEverHadDevice && relatorios.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-300 bg-stone-50 dark:border-stone-700/40 dark:bg-stone-800/20 p-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-stone-300 bg-stone-100 dark:border-stone-700/40 dark:bg-stone-800/60">
              <i className="fa-solid fa-chart-bar text-xl text-stone-400 dark:text-stone-600" />
            </div>
            <p className="text-sm font-semibold text-stone-500 dark:text-stone-400">Nenhum relatório registrado.</p>
            {!isReader && (
              <p className="text-xs text-stone-600 max-w-xs">
                Os relatórios semanais são gerados automaticamente toda segunda-feira. Você também pode criar um manualmente.
              </p>
            )}
          </div>
        ) : selectedGreenhouse?.hasEverHadDevice ? (
          <div className="grid gap-4 md:grid-cols-2">
            {relatorios.map((r) => (
              <RelatorioCard
                key={r.id}
                relatorio={r}
                onDelete={isReader ? null : () => setDeleteTarget(r)}
              />
            ))}
          </div>
        ) : null}
      </section>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Remover relatório"
        description={`Deseja remover o relatório do período ${deleteTarget?.periodoInicio ?? ''}? Esta ação não pode ser desfeita.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
        confirmLabel="Remover"
        cancelLabel="Cancelar"
      />
    </>
  );
};
