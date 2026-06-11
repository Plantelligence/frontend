import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';
import { useAuthStore } from '../store/authStore.js';
import {
  createCulturePreset,
  deleteCulturePreset,
  duplicateCulturePreset,
  listCulturePresets,
  suggestPresetWithAI,
  updateCulturePreset
} from '../api/presetService.js';

const FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'default', label: 'Padrão' },
  { id: 'custom', label: 'Personalizados' },
  { id: 'inUse', label: 'Em uso' }
];

const badgeClassByType = {
  inUse: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  custom: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  default: 'border-stone-300 bg-stone-100 text-stone-600 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-400'
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
  luminosidade: makeDefaultRanges(),
  umidade_solo: {
    critico_baixo: { min: 20, max: 40 },
    alerta_baixo: { min: 40, max: 55 },
    ideal: { min: 55, max: 70 },
    alerta_alto: { min: 70, max: 80 },
    critico_alto: { min: 80, max: 100 }
  }
});

const buildRangesFromIdeal = (min, max) => {
  const span = Math.max(max - min, 1);
  return {
    critico_baixo: { min: Math.round(min - span * 1.2), max: Math.round(min - span * 0.5) },
    alerta_baixo: { min: Math.round(min - span * 0.5), max: min },
    ideal: { min, max },
    alerta_alto: { min: max, max: Math.round(max + span * 0.5) },
    critico_alto: { min: Math.round(max + span * 0.5), max: Math.round(max + span * 1.2) }
  };
};

const aiResponseToPreset = (suggestion) => ({
  nome_cultura: suggestion?.name ?? 'Perfil sugerido pela IA',
  tipo_cultura: 'Cogumelos',
  descricao: suggestion?.summary ?? '',
  temperatura: buildRangesFromIdeal(suggestion?.temperature?.min ?? 15, suggestion?.temperature?.max ?? 25),
  umidade: buildRangesFromIdeal(suggestion?.humidity?.min ?? 70, suggestion?.humidity?.max ?? 90),
  luminosidade: buildRangesFromIdeal(suggestion?.luminosity?.min ?? suggestion?.soilMoisture?.min ?? 0, suggestion?.luminosity?.max ?? suggestion?.soilMoisture?.max ?? 500),
  umidade_solo: buildRangesFromIdeal(suggestion?.soilMoisture?.min ?? 55, suggestion?.soilMoisture?.max ?? 70),
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
  const soil = getIdealMetric(preset.umidade_solo);
  const inUse = getInUseCount(preset);

  return {
    ...preset,
    ui: {
      inUse,
      type: preset.sistema ? 'default' : 'custom',
      temperature: temp.target,
      humidity: humidity.target,
      luminosity: light.target,
      soilMoisture: soil.target,
      tempRange: `${temp.min}–${temp.max}`,
      humidityRange: `${humidity.min}–${humidity.max}`,
      lightRange: `${light.min}–${light.max}`,
      soilRange: preset.umidade_solo ? `${soil.min}–${soil.max}` : '—'
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
    <div className="rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 p-3">
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
          className="w-24 border-b border-stone-300 dark:border-stone-600 bg-transparent text-center text-lg font-semibold text-stone-900 dark:text-stone-100 outline-none focus:border-red-500"
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
      className={`h-full cursor-pointer overflow-hidden rounded-lg border bg-white dark:bg-stone-900 transition hover:-translate-y-0.5 hover:shadow-md ${
        selected ? 'border-red-500 shadow-[0_0_0_3px_rgba(212,58,42,0.1)]' : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600'
      }`}
    >
      <div className="h-1 w-full bg-gradient-to-r from-red-700 to-red-500" />
      <div className="p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-stone-900 dark:text-stone-100" title={preset.nome_cultura}>{preset.nome_cultura}</p>
            <p className="mt-0.5 truncate text-[10px] italic text-stone-400" title={preset.tipo_cultura}>{preset.tipo_cultura}</p>
          </div>
          <span className={`whitespace-nowrap rounded border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${badgeClassByType[badgeType]}`}>
            {inUse > 0 ? 'Em uso' : preset.ui.type === 'custom' ? 'Personalizado' : 'Padrão'}
          </span>
        </div>

        <div className="mb-3 grid grid-cols-2 gap-2">
          <div className="flex min-h-[80px] flex-col justify-between rounded-md border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 p-3">
            <p className="text-[10px] font-semibold leading-tight text-red-700">Temperatura</p>
            <p className="text-lg font-semibold leading-none text-stone-900 dark:text-stone-100">{preset.ui.temperature}<span className="ml-0.5 text-[10px] font-normal text-stone-400">°C</span></p>
            <p className="text-[10px] font-mono text-stone-500 dark:text-stone-400">{preset.ui.tempRange}°C</p>
          </div>
          <div className="flex min-h-[80px] flex-col justify-between rounded-md border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 p-3">
            <p className="text-[10px] font-semibold leading-tight text-red-700">Umidade do ar</p>
            <p className="text-lg font-semibold leading-none text-stone-900 dark:text-stone-100">{preset.ui.humidity}<span className="ml-0.5 text-[10px] font-normal text-stone-400">%</span></p>
            <p className="text-[10px] font-mono text-stone-500 dark:text-stone-400">{preset.ui.humidityRange}%</p>
          </div>
          <div className="flex min-h-[80px] flex-col justify-between rounded-md border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 p-3">
            <p className="text-[10px] font-semibold leading-tight text-red-700">Umidade do solo</p>
            <p className="text-lg font-semibold leading-none text-stone-900 dark:text-stone-100">{preset.ui.soilMoisture || '—'}<span className="ml-0.5 text-[10px] font-normal text-stone-400">%</span></p>
            <p className="text-[10px] font-mono text-stone-500 dark:text-stone-400">{preset.ui.soilRange}</p>
          </div>
          <div className="flex min-h-[80px] flex-col justify-between rounded-md border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 p-3">
            <p className="text-[10px] font-semibold leading-tight text-red-700">Luminosidade</p>
            <p className="text-lg font-semibold leading-none text-stone-900 dark:text-stone-100">{preset.ui.luminosity}<span className="ml-0.5 text-[10px] font-normal text-stone-400">lux</span></p>
            <p className="text-[10px] font-mono text-stone-500 dark:text-stone-400">{preset.ui.lightRange}</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-stone-100 dark:border-stone-800 pt-2.5">
          <span className="text-[11px] text-stone-400">
            {inUse > 0 ? `${inUse} estufa${inUse > 1 ? 's' : ''}` : 'Sem estufa vinculada'}
          </span>
          {!readOnly ? (
            <div className={`grid gap-1 ${preset.sistema ? 'grid-cols-1' : 'grid-cols-3'}`} onClick={(event) => event.stopPropagation()}>
              {!preset.sistema ? (
                <button
                  onClick={() => onEdit(preset)}
                  className="rounded border border-stone-300 dark:border-stone-700 px-2 py-1.5 text-[10px] font-medium text-stone-700 dark:text-stone-400 transition hover:bg-stone-100 dark:hover:bg-stone-800"
                  title="Editar"
                >
                  Editar
                </button>
              ) : null}
              <button
                onClick={() => onDuplicate(preset)}
                className="rounded border border-stone-300 dark:border-stone-700 px-2 py-1.5 text-[10px] font-medium text-stone-700 dark:text-stone-400 transition hover:bg-stone-100 dark:hover:bg-stone-800"
                title="Criar cópia"
              >
                Copiar
              </button>
              {!preset.sistema ? (
                <button
                  onClick={() => onDelete(preset)}
                  className="rounded border border-stone-200 dark:border-stone-700 px-2 py-1.5 text-[10px] text-stone-600 dark:text-stone-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                  title="Excluir"
                >
                  Excluir
                </button>
              ) : null}
            </div>
          ) : (
            <span className="text-[11px] text-slate-500 dark:text-stone-400">Somente consulta</span>
          )}
        </div>
      </div>
    </article>
  );
}

function DetailPanel({ preset, open, saving, onSave, onClose, readOnly = false, isDraft = false, saveError = null }) {
  const [form, setForm] = useState(preset);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiDesc, setAiDesc] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  useEffect(() => {
    setForm(preset);
  }, [preset]);

  // reset AI panel when the overlay is closed/reopened
  useEffect(() => {
    if (!open) {
      setAiOpen(false);
      setAiDesc('');
      setAiError(null);
    }
  }, [open]);

  if (!preset || !open) {
    return null;
  }

  const handleAISuggest = async () => {
    if (!aiDesc.trim()) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const suggestion = await suggestPresetWithAI(aiDesc.trim());
      setForm((prev) => ({
        ...prev,
        ...aiResponseToPreset(suggestion),
      }));
      setAiOpen(false);
      setAiDesc('');
    } catch (err) {
      setAiError(err?.response?.data?.detail ?? 'Não foi possível gerar sugestão. Tente novamente.');
    } finally {
      setAiLoading(false);
    }
  };

  const updateRange = (metric, nextIdeal) => {
    setForm((prev) => ({
      ...prev,
      [metric]: {
        ...prev[metric],
        ideal: nextIdeal
      }
    }));
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-6 backdrop-blur-sm" onClick={onClose}>
      <aside
        className="w-full max-w-3xl rounded-2xl my-auto border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900 shadow-2xl"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(event) => event.stopPropagation()}
      >
      <div className="border-b border-stone-200 dark:border-stone-700 px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-red-600">Perfil em edição</p>
        <label className="mt-2 block text-[11px] font-semibold uppercase tracking-wide text-stone-500">
          Nome do perfil de cultivo
        </label>
        <input
          value={form.nome_cultura}
          disabled={preset.sistema || readOnly}
          onChange={(event) => setForm((prev) => ({ ...prev, nome_cultura: event.target.value.slice(0, 80) }))}
          placeholder="Ex.: Shiitake - Frutificação inverno"
          className="mt-2 w-full rounded-md border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-base font-semibold text-stone-900 dark:text-stone-100 outline-none focus:border-red-400 disabled:bg-stone-100 dark:disabled:bg-stone-700"
        />
        <label className="mt-3 block text-[11px] font-semibold uppercase tracking-wide text-stone-500">
          Descrição do perfil
        </label>
        <textarea
          value={form.descricao ?? ''}
          disabled={preset.sistema || readOnly}
          onChange={(event) => setForm((prev) => ({ ...prev, descricao: event.target.value.slice(0, 400) }))}
          placeholder="Ex.: Perfil focado em frutificação com maior umidade e ventilação moderada."
          rows={2}
          className="mt-2 w-full resize-none rounded-md border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-xs text-stone-700 dark:text-stone-300 outline-none focus:border-red-400 disabled:bg-stone-100 dark:disabled:bg-stone-700"
        />
        <p className="mt-1 text-[11px] text-stone-500">
          Descreva o objetivo desse perfil para facilitar o uso pela equipe.
        </p>
      </div>

      <div className="space-y-5 px-5 py-4 max-h-[65vh] overflow-y-auto">
        <section>
          <p className="mb-1 border-b border-stone-100 dark:border-stone-800 pb-2 text-[10px] font-semibold uppercase tracking-widest text-stone-400">Faixa ideal para o cultivo</p>
          <p className="mb-3 text-xs text-stone-500">Ajuste os valores mínimo e máximo recomendados para cada parâmetro.</p>
          <p className="mb-3 rounded-md border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-3 py-2 text-[11px] text-stone-600 dark:text-stone-400">
            Limites: temperatura -5 a 45 °C, umidade 0 a 100%, umidade do solo 0 a 100% e luminosidade 0 a 3000 lux.
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
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
              label="Umidade do ar mínima"
              value={form.umidade?.ideal?.min}
              unit="%"
              min={0}
              max={100}
              range="0 a 100"
              onChange={(min) => updateRange('umidade', { ...form.umidade.ideal, min })}
            />
            <MetricInput
              label="Umidade do solo mínima"
              value={form.umidade_solo?.ideal?.min}
              unit="%"
              min={0}
              max={100}
              range="0 a 100"
              onChange={(min) => updateRange('umidade_solo', { ...(form.umidade_solo?.ideal ?? { min: 55, max: 70 }), min })}
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
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-4">
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
              label="Umidade do ar máxima"
              value={form.umidade?.ideal?.max}
              unit="%"
              min={0}
              max={100}
              range="0 a 100"
              onChange={(max) => updateRange('umidade', { ...form.umidade.ideal, max })}
            />
            <MetricInput
              label="Umidade do solo máxima"
              value={form.umidade_solo?.ideal?.max}
              unit="%"
              min={0}
              max={100}
              range="0 a 100"
              onChange={(max) => updateRange('umidade_solo', { ...(form.umidade_solo?.ideal ?? { min: 55, max: 70 }), max })}
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

      <div className="border-t border-stone-200 dark:border-stone-700 px-5 py-3">
        {saveError && (
          <p className="mb-2 rounded-lg border border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950 px-3 py-2 text-xs text-rose-700 dark:text-rose-400">{saveError}</p>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded border border-stone-200 dark:border-stone-700 px-3 py-2 text-sm text-stone-700 dark:text-stone-300 transition hover:bg-stone-50 dark:hover:bg-stone-800"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onSave(form)}
            disabled={saving || preset.sistema || readOnly}
            className="flex-1 rounded bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {readOnly ? 'Somente consulta' : saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </div>
      </aside>
    </div>,
    document.body
  );
}

function AIModal({ open, onClose, onUse }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestion, setSuggestion] = useState(null);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setError(null);
      setSuggestion(null);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!query.trim()) {
      return;
    }
    setLoading(true);
    setError(null);
    setSuggestion(null);
    try {
      const result = await suggestPresetWithAI(query.trim());
      setSuggestion(result);
    } catch (err) {
      setError(err?.response?.data?.detail ?? 'Não foi possível gerar sugestão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-6 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl my-auto border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900 shadow-2xl"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-stone-200 dark:border-stone-700 px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-red-600">Inteligência Artificial</p>
          <h2 className="mt-1 text-lg font-semibold text-stone-900 dark:text-stone-100">Criar perfil com IA</h2>
          <p className="mt-1 text-sm text-stone-500">Descreva a cultura ou condições de cultivo e a IA irá sugerir os parâmetros ideais.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 px-5 py-4">
          <textarea
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ex.: Shiitake em clima frio, alta umidade, pouca luz..."
            rows={3}
            disabled={loading}
            className="w-full resize-none rounded-md border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm text-stone-800 dark:text-stone-100 outline-none focus:border-red-400 disabled:bg-stone-50 dark:disabled:bg-stone-700"
          />
          {error ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
          ) : null}
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="w-full rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? 'Gerando sugestão...' : 'Gerar sugestão com IA'}
          </button>
        </form>

        {suggestion ? (
          <div className="space-y-3 border-t border-stone-200 dark:border-stone-700 px-5 pb-5 pt-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700">Sugestão gerada</p>
            <div className="space-y-2 rounded-xl border border-stone-200 bg-stone-50 dark:border-stone-700 dark:bg-stone-800 p-4">
              <p className="font-semibold text-stone-900 dark:text-stone-100">{suggestion.name}</p>
              {suggestion.summary ? <p className="text-sm text-stone-600 dark:text-stone-400">{suggestion.summary}</p> : null}
              <div className="mt-2 grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900 p-2 text-center">
                  <p className="text-[10px] font-semibold text-red-600">Temperatura</p>
                  <p className="mt-1 text-sm font-semibold text-stone-800 dark:text-stone-200">{suggestion.temperature?.min}–{suggestion.temperature?.max}°C</p>
                </div>
                <div className="rounded-lg border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900 p-2 text-center">
                  <p className="text-[10px] font-semibold text-red-600">Umidade</p>
                  <p className="mt-1 text-sm font-semibold text-stone-800 dark:text-stone-200">{suggestion.humidity?.min}–{suggestion.humidity?.max}%</p>
                </div>
                <div className="rounded-lg border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900 p-2 text-center">
                  <p className="text-[10px] font-semibold text-red-600">Luminosidade</p>
                  <p className="mt-1 text-sm font-semibold text-stone-800 dark:text-stone-200">{suggestion.soilMoisture?.min}–{suggestion.soilMoisture?.max} lx</p>
                </div>
              </div>
              {suggestion.notes ? (
                <p className="mt-2 text-xs italic text-stone-500">{suggestion.notes}</p>
              ) : null}
            </div>
            <button
              onClick={() => onUse(suggestion)}
              className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Usar este perfil
            </button>
          </div>
        ) : null}

        <div className="border-t border-stone-100 dark:border-stone-800 px-5 py-3">
          <button onClick={onClose} className="text-sm text-stone-500 transition hover:text-stone-700 dark:text-stone-300">
            Cancelar
          </button>
        </div>
      </div>
    </div>,
    document.body
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
  const [isDraft, setIsDraft] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);

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
    if (updated?.sistema) return;

    setSaving(true);
    setError(null);

    try {
      let normalized;
      if (isDraft) {
        // rascunho: ainda não existe no backend — cria agora
        const response = await createCulturePreset(updated);
        normalized = deriveUiPreset(response);
        setPresets((prev) => [normalized, ...prev]);
        setIsDraft(false);
      } else {
        if (!updated?.id) { setSaving(false); return; }
        const response = await updateCulturePreset(updated.id, updated);
        normalized = deriveUiPreset(response);
        setPresets((prev) => prev.map((entry) => entry.id === normalized.id ? normalized : entry));
      }
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

  const handleCreate = () => {
    // abre o painel com rascunho local — só cria no backend ao clicar em Salvar
    setSelected(makeDefaultPreset());
    setIsDraft(true);
    setIsDetailOpen(true);
    setActiveFilter('custom');
    setSearch('');
  };

  const handleAIUse = (suggestion) => {
    // abre o painel como rascunho — só persiste no backend ao clicar em Salvar
    setAiModalOpen(false);
    setSelected(aiResponseToPreset(suggestion));
    setIsDraft(true);
    setIsDetailOpen(true);
    setActiveFilter('custom');
    setSearch('');
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
      setDeleteTarget(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
          <section
            ref={contentSectionRef}
            className={`relative rounded-[26px] dark:bg-[#0f0c0c] p-4 md:p-6 ${isDetailOpen ? 'overflow-hidden' : 'overflow-y-auto'}`}
          >
            <header className="mb-4 rounded-2xl border border-stone-300 bg-white dark:border-stone-800 dark:bg-stone-900 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Perfis de cultivo</p>
                  <h1 className="mt-1 text-2xl font-semibold text-slate-800 dark:text-stone-100">Perfis de cultivo da estufa</h1>
                  <p className="mt-1 text-sm text-slate-600 dark:text-stone-400">Escolha um perfil pronto ou crie o seu para definir temperatura, umidade e luz ideais.</p>
                </div>
                {!isReader ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAiModalOpen(true)}
                      className="rounded-md border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                    >
                      Criar com IA
                    </button>
                    <button
                      onClick={handleCreate}
                      className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                    >
                      Novo perfil
                    </button>
                  </div>
                ) : null}
              </div>
            </header>

            <section className="mb-4 rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900 p-4">
              <h2 className="text-sm font-semibold text-slate-800 dark:text-stone-100">Como usar este painel</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-stone-400">
                1. Comece escolhendo um perfil padrão para usar como referência inicial.
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-stone-400">
                2. Se precisar adaptar à sua operação, use Copiar para criar um perfil personalizado.
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-stone-400">
                3. Ajuste os valores no painel lateral e clique em Salvar alterações.
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-stone-400">4. Perfis em uso já estão vinculados a estufas.</p>
            </section>

            <section className="mb-4 grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
              <article className="rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900 p-4">
                <p className="text-xs uppercase tracking-wide text-red-600">Total de perfis</p>
                <p className="mt-1 text-3xl font-semibold text-slate-800 dark:text-stone-100">{counts.all}</p>
                <p className="text-xs text-slate-500 dark:text-stone-400">Perfis padrão e personalizados</p>
              </article>
              <article className="rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900 p-4">
                <p className="text-xs uppercase tracking-wide text-red-600">Perfis em uso</p>
                <p className="mt-1 text-3xl font-semibold text-slate-800 dark:text-stone-100">{counts.inUse}</p>
                <p className="text-xs text-slate-500 dark:text-stone-400">Já aplicados em estufas</p>
              </article>
              <article className="rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900 p-4">
                <p className="text-xs uppercase tracking-wide text-red-600">Perfis personalizados</p>
                <p className="mt-1 text-3xl font-semibold text-slate-800 dark:text-stone-100">{counts.custom}</p>
                <p className="text-xs text-slate-500 dark:text-stone-400">Criados para sua operação</p>
              </article>
            </section>

            <div className="mb-4 flex flex-col gap-3 rounded-lg border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-1">
                {FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className={`rounded border px-3 py-1.5 text-xs transition ${
                      activeFilter === filter.id
                        ? 'border-stone-300 bg-stone-100 dark:border-stone-700 dark:bg-stone-800 font-semibold text-stone-900 dark:text-stone-100'
                        : 'border-transparent text-stone-500 dark:text-stone-400 hover:border-stone-200 dark:hover:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800'
                    }`}
                  >
                    {filter.label}
                    <span className="ml-1 rounded-full bg-stone-200 dark:bg-stone-700 dark:text-stone-300 px-1.5 py-0.5 text-[10px]">{counts[filter.id]}</span>
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nome do perfil..."
                className="w-full rounded border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-3 py-2 text-sm text-stone-700 dark:text-stone-300 outline-none focus:border-red-400 lg:w-64"
              />
            </div>

            <section className="mb-4 rounded-lg border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-stone-400">Legenda dos indicadores</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-stone-400">
                <span className="rounded-full border border-stone-300 bg-stone-100 text-stone-600 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-400 px-2.5 py-1 text-[11px]">Temperatura: valor em °C</span>
                <span className="rounded-full border border-stone-300 bg-stone-100 text-stone-600 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-400 px-2.5 py-1 text-[11px]">Umidade: valor em %</span>
                <span className="rounded-full border border-stone-300 bg-stone-100 text-stone-600 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-400 px-2.5 py-1 text-[11px]">Luminosidade: valor em lux</span>
              </div>
            </section>

            {error ? <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

            <div className="grid gap-4">
              <div className="space-y-4">
                {loading ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {[0, 1, 2].map((item) => (
                      <div key={item} className="h-60 animate-pulse rounded-lg border border-stone-300 bg-white dark:border-stone-800 dark:bg-stone-900" />
                    ))}
                  </div>
                ) : (
                  <>
                    {activeFilter !== 'custom' ? (
                      <section className="rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900 p-4">
                        <div className="mb-3 flex items-center justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-2">
                          <h3 className="text-sm font-semibold text-slate-800 dark:text-stone-100">Perfis padrão (modelos prontos)</h3>
                          <span className="rounded-full bg-stone-100 dark:bg-stone-800 px-2 py-0.5 text-xs text-slate-600 dark:text-stone-400">{segmented.defaults.length}</span>
                        </div>
                        {segmented.defaults.length === 0 ? (
                          <p className="text-sm text-slate-500 dark:text-stone-400">Nenhum perfil padrão encontrado para este filtro.</p>
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
                      <section className="rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900 p-4">
                        <div className="mb-3 flex items-center justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-2">
                          <h3 className="text-sm font-semibold text-slate-800 dark:text-stone-100">Perfis personalizados (criados por você)</h3>
                          <span className="rounded-full bg-stone-100 dark:bg-stone-800 px-2 py-0.5 text-xs text-slate-600 dark:text-stone-400">{segmented.customs.length}</span>
                        </div>
                        {segmented.customs.length === 0 ? (
                          <p className="text-sm text-slate-500 dark:text-stone-400">Nenhum perfil personalizado encontrado para este filtro.</p>
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
            onClose={() => { setIsDetailOpen(false); setIsDraft(false); setError(null); }}
            readOnly={isReader || selected?.sistema}
            isDraft={isDraft}
            saveError={error}
          />

          <AIModal
            open={aiModalOpen}
            onClose={() => setAiModalOpen(false)}
            onUse={handleAIUse}
          />

          <ConfirmDialog
            open={!!deleteTarget}
            title="Remover perfil de cultivo"
            description={deleteTarget ? `Deseja remover o perfil ${deleteTarget.nome_cultura}?` : ''}
            onConfirm={handleConfirmDelete}
            onCancel={() => setDeleteTarget(null)}
            confirmLabel='Remover'
            cancelLabel='Cancelar'
          />

          </section>
    </>
  );
};
