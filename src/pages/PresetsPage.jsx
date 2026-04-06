import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DashboardSideNav } from '../components/DashboardSideNav.jsx';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';
import { useAuthStore } from '../store/authStore.js';
import {
  createCulturePreset,
  deleteCulturePreset,
  duplicateCulturePreset,
  listCulturePresets,
  updateCulturePreset
} from '../api/presetService.js';

const FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'default', label: 'Padrão' },
  { id: 'custom', label: 'Personalizados' },
  { id: 'inUse', label: 'Em uso' }
];

const badgeClassByType = {
  inUse: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  custom: 'border-amber-200 bg-amber-50 text-amber-700',
  default: 'border-stone-200 bg-stone-100 text-stone-600'
};

const makeDefaultRanges = () => ({
  critico_baixo: { min: 0, max: 10 },
  alerta_baixo: { min: 10, max: 15 },
  ideal: { min: 15, max: 22 },
  alerta_alto: { min: 22, max: 28 },
  critico_alto: { min: 28, max: 40 }
});

const makeDefaultPreset = () => ({
  nome_cultura: 'Novo perfil personalizado',
  tipo_cultura: 'Cogumelos',
  descricao: 'Perfil personalizado criado no painel.',
  temperatura: makeDefaultRanges(),
  umidade: {
    critico_baixo: { min: 40, max: 55 },
    alerta_baixo: { min: 55, max: 70 },
    ideal: { min: 70, max: 90 },
    alerta_alto: { min: 90, max: 96 },
    critico_alto: { min: 96, max: 100 }
  },
  luminosidade: makeDefaultRanges()
});

const getInUseCount = (preset) => Array.isArray(preset?.estufas) ? preset.estufas.length : 0;

const getIdealMetric = (ranges) => {
  const min = Number(ranges?.ideal?.min);
  const max = Number(ranges?.ideal?.max);
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { min: 0, max: 0, target: 0 };
  }
  return { min, max, target: Number(((min + max) / 2).toFixed(1)) };
};

const getPresetLoadErrorMessage = (error) => {
  if (!error) {
    return 'Nao foi possivel carregar os perfis de cultivo.';
  }

  if (error.code === 'ECONNABORTED') {
    return 'A consulta de perfis demorou demais. Tente novamente em instantes.';
  }

  if (error.response?.status === 401) {
    return 'Sua sessao expirou. Entre novamente para carregar os perfis de cultivo.';
  }

  return error?.response?.data?.detail
    ?? error?.response?.data?.message
    ?? 'Nao foi possivel carregar os perfis de cultivo.';
};

const deriveUiPreset = (preset) => {
  const temp = getIdealMetric(preset.temperatura);
  const humidity = getIdealMetric(preset.umidade);
  const light = getIdealMetric(preset.luminosidade);
  const inUse = getInUseCount(preset);

  return {
    ...preset,
    ui: {
      inUse,
      type: preset.sistema ? 'default' : 'custom',
      temperature: temp.target,
      humidity: humidity.target,
      co2: light.target,
      tempRange: `${temp.min}–${temp.max}`,
      humidityRange: `${humidity.min}–${humidity.max}`,
      lightRange: `${light.min}–${light.max}`
    }
  };
};

function MetricInput({ label, value, unit, min, max, range, onChange }) {
  const [localVal, setLocalVal] = useState(String(value ?? ''));
  const [error, setError] = useState('');

  useEffect(() => {
    setLocalVal(String(value ?? ''));
    setError('');
  }, [value]);

  const handleBlur = () => {
    const parsed = parseFloat(localVal);
    if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
      setError(`Valor entre ${min} e ${max}`);
      setLocalVal(String(value ?? ''));
      return;
    }

    setError('');
    onChange(parsed);
  };

  return (
    <div className="rounded-lg border border-stone-200 bg-[#f5f2ec] p-3">
      <span className="block text-[11px] font-semibold leading-snug text-red-700">{label}</span>
      <div className="mt-1 flex items-baseline gap-1">
        <input
          type="number"
          value={localVal}
          min={min}
          max={max}
          step={1}
          onChange={(event) => setLocalVal(event.target.value)}
          onBlur={handleBlur}
          className="w-24 border-b border-stone-300 bg-transparent text-center text-lg font-semibold text-stone-900 outline-none focus:border-red-500"
        />
        <span className="text-xs text-stone-500">{unit}</span>
      </div>
      {error ? (
        <p className="mt-1 text-[9px] text-red-500">{error}</p>
      ) : (
        <p className="mt-1 text-[9px] font-mono text-stone-400">{range}</p>
      )}
    </div>
  );
}

function PresetCard({ preset, selected, onSelect, onEdit, onDuplicate, onDelete, readOnly = false }) {
  const inUse = preset.ui.inUse;
  const badgeType = inUse > 0 ? 'inUse' : preset.ui.type;

  return (
    <article
      onClick={() => onSelect(preset)}
      className={`h-full cursor-pointer overflow-hidden rounded-lg border bg-white transition hover:-translate-y-0.5 hover:shadow-md ${
        selected ? 'border-red-500 shadow-[0_0_0_3px_rgba(212,58,42,0.1)]' : 'border-stone-200 hover:border-stone-300'
      }`}
    >
      <div className="h-1 w-full bg-gradient-to-r from-red-700 to-red-500" />
      <div className="p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-stone-900" title={preset.nome_cultura}>{preset.nome_cultura}</p>
            <p className="mt-0.5 truncate text-[10px] italic text-stone-400" title={preset.tipo_cultura}>{preset.tipo_cultura}</p>
          </div>
          <span className={`whitespace-nowrap rounded border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${badgeClassByType[badgeType]}`}>
            {inUse > 0 ? 'Em uso' : preset.ui.type === 'custom' ? 'Personalizado' : 'Padrão'}
          </span>
        </div>

        <div className="mb-3 grid grid-cols-3 gap-2">
          <div className="flex min-h-[96px] flex-col justify-between rounded-md border border-stone-200 bg-[#f5f2ec] p-3">
            <p className="text-[10px] font-semibold leading-tight text-red-700">Temperatura</p>
            <p className="text-xl font-semibold leading-none text-stone-900">{preset.ui.temperature}<span className="ml-0.5 text-[11px] font-normal text-stone-400">°C</span></p>
            <p className="text-[10px] font-mono text-stone-400">{preset.ui.tempRange}°C</p>
          </div>
          <div className="flex min-h-[96px] flex-col justify-between rounded-md border border-stone-200 bg-[#f5f2ec] p-3">
            <p className="text-[10px] font-semibold leading-tight text-red-700">Umidade</p>
            <p className="text-xl font-semibold leading-none text-stone-900">{preset.ui.humidity}<span className="ml-0.5 text-[11px] font-normal text-stone-400">%</span></p>
            <p className="text-[10px] font-mono text-stone-400">{preset.ui.humidityRange}%</p>
          </div>
          <div className="flex min-h-[96px] flex-col justify-between rounded-md border border-stone-200 bg-[#f5f2ec] p-3">
            <p className="text-[10px] font-semibold leading-tight text-red-700">Luminosidade</p>
            <p className="text-xl font-semibold leading-none text-stone-900">{preset.ui.co2}<span className="ml-0.5 text-[11px] font-normal text-stone-400">lux</span></p>
            <p className="text-[10px] font-mono text-stone-400">{preset.ui.lightRange}</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-stone-100 pt-2.5">
          <span className="text-[11px] text-stone-400">
            {inUse > 0 ? `${inUse} estufa${inUse > 1 ? 's' : ''}` : 'Sem estufa vinculada'}
          </span>
          {!readOnly ? (
            <div className={`grid gap-1 ${preset.sistema ? 'grid-cols-1' : 'grid-cols-3'}`} onClick={(event) => event.stopPropagation()}>
              {!preset.sistema ? (
                <button
                  onClick={() => onEdit(preset)}
                  className="rounded border border-stone-200 px-2 py-1.5 text-[10px] text-stone-600 transition hover:bg-stone-100"
                  title="Editar"
                >
                  Editar
                </button>
              ) : null}
              <button
                onClick={() => onDuplicate(preset)}
                className="rounded border border-stone-200 px-2 py-1.5 text-[10px] text-stone-600 transition hover:bg-stone-100"
                title="Criar cópia"
              >
                Copiar
              </button>
              {!preset.sistema ? (
                <button
                  onClick={() => onDelete(preset)}
                  className="rounded border border-stone-200 px-2 py-1.5 text-[10px] text-stone-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                  title="Excluir"
                >
                  Excluir
                </button>
              ) : null}
            </div>
          ) : (
            <span className="text-[11px] text-slate-500">Somente consulta</span>
          )}
        </div>
      </div>
    </article>
  );
}

function DetailPanel({ preset, open, saving, onSave, onClose, readOnly = false }) {
  const [form, setForm] = useState(preset);

  useEffect(() => {
    setForm(preset);
  }, [preset]);

  if (!preset || !open) {
    return null;
  }

  const updateRange = (metric, nextIdeal) => {
    setForm((prev) => ({
      ...prev,
      [metric]: {
        ...prev[metric],
        ideal: nextIdeal
      }
    }));
  };

  return (
    <div className="absolute inset-0 z-[70] flex items-center justify-center bg-white/60 p-4 backdrop-blur-[1px]" onClick={onClose}>
      <aside
        className="w-full max-w-3xl overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
      <div className="border-b border-stone-200 px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-red-600">Perfil em edição</p>
        <label className="mt-2 block text-[11px] font-semibold uppercase tracking-wide text-stone-500">
          Nome do perfil de cultivo
        </label>
        <input
          value={form.nome_cultura}
          disabled={preset.sistema || readOnly}
          onChange={(event) => setForm((prev) => ({ ...prev, nome_cultura: event.target.value.slice(0, 80) }))}
          placeholder="Ex.: Shiitake - Frutificacao inverno"
          className="mt-2 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-base font-semibold text-stone-900 outline-none focus:border-red-400 disabled:bg-stone-100"
        />
        <label className="mt-3 block text-[11px] font-semibold uppercase tracking-wide text-stone-500">
          Descricao do perfil
        </label>
        <textarea
          value={form.descricao ?? ''}
          disabled={preset.sistema || readOnly}
          onChange={(event) => setForm((prev) => ({ ...prev, descricao: event.target.value.slice(0, 400) }))}
          placeholder="Ex.: Perfil focado em frutificacao com maior umidade e ventilacao moderada."
          rows={2}
          className="mt-2 w-full resize-none rounded-md border border-stone-300 bg-white px-3 py-2 text-xs text-stone-700 outline-none focus:border-red-400 disabled:bg-stone-100"
        />
        <p className="mt-1 text-[11px] text-stone-500">
          Descreva o objetivo desse perfil para facilitar o uso pela equipe.
        </p>
      </div>

      <div className="space-y-5 px-5 py-4 max-h-[65vh] overflow-y-auto">
        <section>
          <p className="mb-1 border-b border-stone-100 pb-2 text-[10px] font-semibold uppercase tracking-widest text-stone-400">Faixa ideal para o cultivo</p>
          <p className="mb-3 text-xs text-stone-500">Ajuste os valores mínimo e máximo recomendados para cada parâmetro.</p>
          <p className="mb-3 rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-[11px] text-stone-600">
            Limites permitidos: temperatura de -5 a 45 °C, umidade de 0 a 100% e luminosidade de 0 a 3000 lux. Valores fora da faixa são rejeitados ao sair do campo.
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <MetricInput
              label="Temperatura mínima"
              value={form.temperatura?.ideal?.min}
              unit="°C"
              min={-5}
              max={45}
              range="-5 a 45"
              onChange={(min) => updateRange('temperatura', { ...form.temperatura.ideal, min })}
            />
            <MetricInput
              label="Umidade mínima"
              value={form.umidade?.ideal?.min}
              unit="%"
              min={0}
              max={100}
              range="0 a 100"
              onChange={(min) => updateRange('umidade', { ...form.umidade.ideal, min })}
            />
            <MetricInput
              label="Luminosidade mínima"
              value={form.luminosidade?.ideal?.min}
              unit="lx"
              min={0}
              max={3000}
              range="0 a 3000"
              onChange={(min) => updateRange('luminosidade', { ...form.luminosidade.ideal, min })}
            />
          </div>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <MetricInput
              label="Temperatura máxima"
              value={form.temperatura?.ideal?.max}
              unit="°C"
              min={-5}
              max={45}
              range="-5 a 45"
              onChange={(max) => updateRange('temperatura', { ...form.temperatura.ideal, max })}
            />
            <MetricInput
              label="Umidade máxima"
              value={form.umidade?.ideal?.max}
              unit="%"
              min={0}
              max={100}
              range="0 a 100"
              onChange={(max) => updateRange('umidade', { ...form.umidade.ideal, max })}
            />
            <MetricInput
              label="Luminosidade máxima"
              value={form.luminosidade?.ideal?.max}
              unit="lx"
              min={0}
              max={3000}
              range="0 a 3000"
              onChange={(max) => updateRange('luminosidade', { ...form.luminosidade.ideal, max })}
            />
          </div>
        </section>
      </div>

      <div className="flex gap-2 border-t border-stone-200 px-5 py-3">
        <button
          onClick={onClose}
          className="flex-1 rounded border border-stone-200 px-3 py-2 text-sm text-stone-700 transition hover:bg-stone-50"
        >
          Fechar painel
        </button>
        <button
          onClick={() => onSave(form)}
          disabled={saving || preset.sistema || readOnly}
          className="flex-1 rounded bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {readOnly ? 'Somente consulta' : saving ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>
      </aside>
    </div>
  );
}

export const PresetsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const isReader = user?.role === 'Reader';
  const contentSectionRef = useRef(null);
  const [presets, setPresets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const focusPresetId = (searchParams.get('presetId') || '').trim();

  const openDetailForItem = (item) => {
    setSelected(item);

    const section = contentSectionRef.current;
    if (section && section.scrollTop > 8) {
      section.scrollTo({ top: 0, behavior: 'smooth' });
      window.setTimeout(() => {
        setIsDetailOpen(true);
      }, 220);
      return;
    }

    setIsDetailOpen(true);
  };

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    if (isDetailOpen) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isDetailOpen]);

  const loadPresets = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listCulturePresets();
      const normalized = Array.isArray(response) ? response.map(deriveUiPreset) : [];
      setPresets(normalized);
      if (!selected && normalized.length > 0) {
        setSelected(normalized[0]);
      }
    } catch (loadError) {
      setError(getPresetLoadErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPresets();
  }, []);

  useEffect(() => {
    if (!focusPresetId || presets.length === 0) {
      return;
    }

    const target = presets.find((item) => item.id === focusPresetId);
    if (!target) {
      return;
    }

    setSelected(target);
    setIsDetailOpen(true);

    const next = new URLSearchParams(searchParams);
    next.delete('presetId');
    setSearchParams(next, { replace: true });
  }, [focusPresetId, presets, searchParams, setSearchParams]);

  const counts = useMemo(() => ({
    all: presets.length,
    default: presets.filter((preset) => preset.sistema).length,
    custom: presets.filter((preset) => !preset.sistema).length,
    inUse: presets.filter((preset) => preset.ui.inUse > 0).length
  }), [presets]);

  const filtered = useMemo(() => presets.filter((preset) => {
    const matchesFilter =
      activeFilter === 'all'
        ? true
        : activeFilter === 'inUse'
          ? preset.ui.inUse > 0
          : activeFilter === 'default'
            ? preset.sistema
            : !preset.sistema;

    const term = search.trim().toLowerCase();
    const matchesSearch =
      term.length === 0
      || preset.nome_cultura.toLowerCase().includes(term)
      || (preset.descricao ?? '').toLowerCase().includes(term)
      || preset.tipo_cultura.toLowerCase().includes(term);

    return matchesFilter && matchesSearch;
  }), [presets, activeFilter, search]);

  const segmented = useMemo(() => ({
    defaults: filtered.filter((preset) => preset.sistema),
    customs: filtered.filter((preset) => !preset.sistema)
  }), [filtered]);

  const handleSave = async (updated) => {
    if (!updated?.id || updated.sistema) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await updateCulturePreset(updated.id, updated);
      const normalized = deriveUiPreset(response);
      setPresets((prev) => prev.map((entry) => entry.id === normalized.id ? normalized : entry));
      setSelected(normalized);
      setIsDetailOpen(false);
    } catch (saveError) {
      setError(saveError?.response?.data?.detail ?? saveError?.response?.data?.message ?? 'Falha ao salvar o perfil de cultivo.');
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async (preset) => {
    setError(null);
    try {
      const response = await duplicateCulturePreset(preset);
      const normalized = deriveUiPreset(response);
      setPresets((prev) => [normalized, ...prev]);
      setSelected(normalized);
      setIsDetailOpen(true);
    } catch (duplicateError) {
      setError(duplicateError?.response?.data?.detail ?? duplicateError?.response?.data?.message ?? 'Falha ao duplicar o perfil de cultivo.');
    }
  };

  const handleCreate = async () => {
    setError(null);
    try {
      const response = await createCulturePreset(makeDefaultPreset());
      const normalized = deriveUiPreset(response);
      setPresets((prev) => [normalized, ...prev]);
      setActiveFilter('custom');
      setSearch('');
      setSelected(normalized);
      setIsDetailOpen(true);
    } catch (createError) {
      setError(createError?.response?.data?.detail ?? createError?.response?.data?.message ?? 'Não foi possível criar novo perfil de cultivo.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await deleteCulturePreset(deleteTarget.id);
      setPresets((prev) => prev.filter((entry) => entry.id !== deleteTarget.id));
      setSelected((prev) => (prev?.id === deleteTarget.id ? null : prev));
      setIsDetailOpen((prev) => (selected?.id === deleteTarget.id ? false : prev));
      setDeleteTarget(null);
    } catch (deleteError) {
      setError(deleteError?.response?.data?.detail ?? deleteError?.response?.data?.message ?? 'Falha ao remover o perfil de cultivo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6">
      <div className="rounded-[30px] bg-[#181415] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.35)] md:p-6">
        <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <DashboardSideNav
            active="presets"
            footerText={isReader
              ? 'Perfil Leitor: apenas consulta dos perfis de cultivo utilizados nas estufas delegadas.'
              : 'Você pode criar, copiar e ajustar perfis de cultivo personalizados para cada estufa.'}
          />

          <section
            ref={contentSectionRef}
            className={`relative rounded-[26px] bg-[#f5f1eb] p-4 md:p-6 lg:h-[calc(100vh-160px)] lg:min-h-[640px] lg:max-h-[820px] ${isDetailOpen ? 'overflow-hidden' : 'overflow-y-auto'}`}
          >
            <header className="mb-4 rounded-2xl border border-stone-300 bg-[#fcfaf7] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Perfis de cultivo</p>
                  <h1 className="mt-1 text-2xl font-semibold text-slate-800">Perfis de cultivo da estufa</h1>
                  <p className="mt-1 text-sm text-slate-600">Escolha um perfil pronto ou crie o seu para definir temperatura, umidade e luz ideais.</p>
                </div>
                {!isReader ? (
                  <button
                    onClick={handleCreate}
                    className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                  >
                    Novo perfil
                  </button>
                ) : null}
              </div>
            </header>

            <section className="mb-4 rounded-2xl border border-stone-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-slate-800">Como usar este painel</h2>
              <p className="mt-2 text-sm text-slate-600">
                1. Comece escolhendo um perfil padrão para usar como referência inicial.
              </p>
              <p className="mt-1 text-sm text-slate-600">
                2. Se precisar adaptar à sua operação, use Copiar para criar um perfil personalizado.
              </p>
              <p className="mt-1 text-sm text-slate-600">
                3. Ajuste os valores no painel lateral e clique em Salvar alterações.
              </p>
              <p className="mt-1 text-sm text-slate-600">4. Perfis em uso já estão vinculados a estufas.</p>
            </section>

            <section className="mb-4 grid gap-3 md:grid-cols-3">
              <article className="rounded-2xl border border-stone-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-red-600">Total de perfis</p>
                <p className="mt-1 text-3xl font-semibold text-slate-800">{counts.all}</p>
                <p className="text-xs text-slate-500">Perfis padrão e personalizados</p>
              </article>
              <article className="rounded-2xl border border-stone-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-red-600">Perfis em uso</p>
                <p className="mt-1 text-3xl font-semibold text-slate-800">{counts.inUse}</p>
                <p className="text-xs text-slate-500">Já aplicados em estufas</p>
              </article>
              <article className="rounded-2xl border border-stone-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-red-600">Perfis personalizados</p>
                <p className="mt-1 text-3xl font-semibold text-slate-800">{counts.custom}</p>
                <p className="text-xs text-slate-500">Criados para sua operação</p>
              </article>
            </section>

            <div className="mb-4 flex flex-col gap-3 rounded-lg border border-stone-200 bg-white px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-1">
                {FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className={`rounded border px-3 py-1.5 text-xs transition ${
                      activeFilter === filter.id
                        ? 'border-stone-300 bg-stone-100 font-semibold text-stone-900'
                        : 'border-transparent text-stone-500 hover:border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    {filter.label}
                    <span className="ml-1 rounded-full bg-stone-200 px-1.5 py-0.5 text-[10px]">{counts[filter.id]}</span>
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nome do perfil..."
                className="w-full rounded border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700 outline-none focus:border-red-400 lg:w-64"
              />
            </div>

            <section className="mb-4 rounded-lg border border-stone-200 bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Legenda dos indicadores</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1">Temperatura: valor em °C</span>
                <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1">Umidade: valor em %</span>
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1">Luminosidade: valor em lux</span>
              </div>
            </section>

            {error ? <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

            <div className="grid gap-4">
              <div className="space-y-4">
                {loading ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {[0, 1, 2].map((item) => (
                      <div key={item} className="h-60 animate-pulse rounded-lg border border-stone-300 bg-white" />
                    ))}
                  </div>
                ) : (
                  <>
                    {activeFilter !== 'custom' ? (
                      <section className="rounded-2xl border border-stone-200 bg-white p-4">
                        <div className="mb-3 flex items-center justify-between gap-2 border-b border-stone-100 pb-2">
                          <h3 className="text-sm font-semibold text-slate-800">Perfis padrão (modelos prontos)</h3>
                          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-slate-600">{segmented.defaults.length}</span>
                        </div>
                        {segmented.defaults.length === 0 ? (
                          <p className="text-sm text-slate-500">Nenhum perfil padrão encontrado para este filtro.</p>
                        ) : (
                          <div className="grid items-start gap-4 md:grid-cols-2">
                            {segmented.defaults.map((preset) => (
                              <PresetCard
                                key={preset.id}
                                preset={preset}
                                selected={isDetailOpen && selected?.id === preset.id}
                                onSelect={openDetailForItem}
                                onEdit={openDetailForItem}
                                onDuplicate={handleDuplicate}
                                onDelete={setDeleteTarget}
                                readOnly={isReader}
                              />
                            ))}
                          </div>
                        )}
                      </section>
                    ) : null}

                    {activeFilter !== 'default' ? (
                      <section className="rounded-2xl border border-stone-200 bg-white p-4">
                        <div className="mb-3 flex items-center justify-between gap-2 border-b border-stone-100 pb-2">
                          <h3 className="text-sm font-semibold text-slate-800">Perfis personalizados (criados por você)</h3>
                          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-slate-600">{segmented.customs.length}</span>
                        </div>
                        {segmented.customs.length === 0 ? (
                          <p className="text-sm text-slate-500">Nenhum perfil personalizado encontrado para este filtro.</p>
                        ) : (
                          <div className="grid items-start gap-4 md:grid-cols-2">
                            {segmented.customs.map((preset) => (
                              <PresetCard
                                key={preset.id}
                                preset={preset}
                                selected={isDetailOpen && selected?.id === preset.id}
                                onSelect={openDetailForItem}
                                onEdit={openDetailForItem}
                                onDuplicate={handleDuplicate}
                                onDelete={setDeleteTarget}
                                readOnly={isReader}
                              />
                            ))}
                          </div>
                        )}
                      </section>
                    ) : null}
                  </>
                )}
              </div>

            </div>

            <DetailPanel
              preset={selected}
              open={isDetailOpen}
              saving={saving}
              onSave={handleSave}
              onClose={() => setIsDetailOpen(false)}
              readOnly={isReader}
            />
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Remover perfil"
        description={deleteTarget ? `Deseja remover o perfil ${deleteTarget.nome_cultura}?` : ''}
        confirmLabel={saving ? 'Removendo...' : 'Remover'}
        confirmDisabled={saving}
        cancelDisabled={saving}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
