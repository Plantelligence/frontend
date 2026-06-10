import React, { useMemo, useState } from 'react';
import { Button } from './Button.jsx';
import { requestPresetSuggestion } from '../api/chatService.js';

const createDefaultCustomParams = () => ({
  profileName: '',
  plantation: '',
  temperatureMin: '',
  temperatureMax: '',
  humidityMin: '',
  humidityMax: '',
  soilMoistureMin: '',
  soilMoistureMax: ''
});

const formatCep = (value) => {
  const digits = String(value ?? '').replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) {
    return digits;
  }
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

const digitsOnly = (value) => String(value ?? '').replace(/\D/g, '');

const CUSTOM_LIMITS = {
  temperature: { min: -5, max: 45, step: '0.1', label: '-5 a 45 °C' },
  humidity: { min: 0, max: 100, step: '1', label: '0 a 100 %' },
  soilMoisture: { min: 0, max: 500, step: '1', label: '0 a 500 %' }
};

// o id precisa bater com o slug do backend (flower_profiles.py)
const cropOptions = [
  {
    id: 'champignon',
    title: 'Champignon',
    description: 'Cogumelo champignon em ambiente mais fresco e úmido.',
    style: 'border-stone-200 bg-white dark:border-stone-800/60 dark:bg-stone-900/35'
  },
  {
    id: 'shimeji',
    title: 'Shimeji',
    description: 'Shimeji com boa ventilação e umidade alta.',
    style: 'border-stone-200 bg-white dark:border-stone-800/60 dark:bg-stone-900/35'
  },
  {
    id: 'shiitake',
    title: 'Shiitake',
    description: 'Shiitake em fase de produção, com umidade alta e ventilação controlada.',
    style: 'border-stone-200 bg-white dark:border-stone-800/60 dark:bg-stone-900/35'
  },
  {
    id: 'personalizado',
    title: 'Personalizado',
    description: 'Você escolhe manualmente os limites do seu cultivo.',
    style: 'border-stone-200 bg-white dark:border-stone-800/60 dark:bg-stone-900/35'
  }
];

export const WizardOnboardingCriarEstufa = ({
  profiles,
  forceMode,
  loading,
  error,
  onCreate,
  onResolveCep
}) => {
  const [step, setStep] = useState(1);
  const [cropType, setCropType] = useState('champignon');
  const [name, setName] = useState('');
  const [cep, setCep] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState('');
  const [customParams, setCustomParams] = useState(createDefaultCustomParams());
  const [customProfileTab, setCustomProfileTab] = useState('manual');
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiSuccess, setAiSuccess] = useState('');
  const [aiNotes, setAiNotes] = useState([]);
  const [stepError, setStepError] = useState('');

  const normalizeNumericValue = (value, fallback = '') => {
    const normalized = Number(value);
    if (!Number.isFinite(normalized)) {
      return fallback;
    }
    return String(normalized);
  };

  // fallback por nome para dados legados
  const profileByType = useMemo(() => {
    const entries = Array.isArray(profiles) ? profiles : [];
    const byId = (id) => entries.find((p) => p?.id === id) ?? null;
    const byName = (value) => entries.find((p) => (p?.name ?? '').toLowerCase().includes(value)) ?? null;

    return {
      champignon: byId('champignon') ?? byName('champignon') ?? entries[0] ?? null,
      shimeji: byId('shimeji') ?? byName('shimeji') ?? entries[1] ?? entries[0] ?? null,
      shiitake: byId('shiitake') ?? byName('shiitake') ?? entries[2] ?? entries[0] ?? null,
      personalizado: null
    };
  }, [profiles]);

  // Detecta se todos os valores numéricos do perfil personalizado são idênticos (ex: tudo 0)
  const repeatedValuesWarning = useMemo(() => {
    if (cropType !== 'personalizado') return false;
    const nums = [
      customParams.temperatureMin, customParams.temperatureMax,
      customParams.humidityMin, customParams.humidityMax,
      customParams.soilMoistureMin, customParams.soilMoistureMax,
    ].filter((v) => v !== '');
    if (nums.length < 2) return false;
    return nums.every((v) => v === nums[0]);
  }, [cropType, customParams]);

  const handleSuggestWithAi = async () => {
    const plantation = (customParams.plantation ?? '').trim();
    const question = aiQuestion.trim() || (plantation ? `Criar perfil de cultivo para ${plantation}.` : '');
    if (!question || aiLoading) {
      if (!question) {
        setAiError('Informe a plantação específica ou descreva o cenário para sugerir com IA.');
      }
      return;
    }

    setAiLoading(true);
    setAiError('');
    setAiSuccess('');

    try {
      const suggestion = await requestPresetSuggestion(question);

      setCustomParams((prev) => ({
        ...prev,
        profileName: (suggestion?.name ?? '').trim() || prev.profileName,
        temperatureMin: normalizeNumericValue(suggestion?.temperature?.min, prev.temperatureMin),
        temperatureMax: normalizeNumericValue(suggestion?.temperature?.max, prev.temperatureMax),
        humidityMin: normalizeNumericValue(suggestion?.humidity?.min, prev.humidityMin),
        humidityMax: normalizeNumericValue(suggestion?.humidity?.max, prev.humidityMax),
        soilMoistureMin: normalizeNumericValue(suggestion?.soilMoisture?.min, prev.soilMoistureMin),
        soilMoistureMax: normalizeNumericValue(suggestion?.soilMoisture?.max, prev.soilMoistureMax)
      }));

      setAiNotes(Array.isArray(suggestion?.notes) ? suggestion.notes.slice(0, 3) : []);
      setAiSuccess('Sugestão aplicada. Nome do perfil e parâmetros foram preenchidos automaticamente.');
    } catch (error) {
      const detail = error?.response?.data?.detail;
      const isIaUnavailable =
        typeof detail === 'string'
        && detail.toLowerCase().includes('assistente de ia indisponivel');

      setAiError(
        isIaUnavailable
          ? 'Assistente temporariamente indisponível. Tente novamente em alguns minutos.'
          : error?.response?.data?.detail
          ?? error?.response?.data?.message
          ?? 'Não foi possível obter sugestao da IA agora.'
      );
      setAiSuccess('');
    } finally {
      setAiLoading(false);
    }
  };

  const goBack = () => { setStepError(''); setStep((prev) => Math.max(prev - 1, 1)); };
  const handleNext = () => {
    setStepError('');
    if (step === 2) {
      if (!name.trim()) {
        setStepError('Informe o nome da estufa antes de continuar.');
        return;
      }
      if (!city.trim() || !state.trim()) {
        setStepError('Informe a cidade e o estado. Busque pelo CEP ou preencha manualmente.');
        return;
      }
    }
    setStep((prev) => Math.min(prev + 1, 3));
  };
  const handleBack = goBack;
  const busy = loading ?? false;
  const totalSteps = 3;

  const handleCepLookup = async () => {
    const normalizedCep = digitsOnly(cep);
    if (normalizedCep.length !== 8 || typeof onResolveCep !== 'function') {
      setCepError('Informe um CEP valido com 8 digitos.');
      setCity('');
      setState('');
      return;
    }

    setCepLoading(true);
    setCepError('');
    try {
      const resolved = await onResolveCep(normalizedCep);
      setCep(formatCep(resolved?.cep ?? normalizedCep));
      setCity(resolved?.cidade ?? '');
      setState(resolved?.estado ?? '');
    } catch (resolveError) {
      setCity('');
      setState('');
      setCepError(
        resolveError?.response?.data?.detail
        ?? resolveError?.response?.data?.message
        ?? 'Nao foi possivel consultar esse CEP agora.'
      );
    } finally {
      setCepLoading(false);
    }
  };

  const handleCreate = async () => {
    setStepError('');

    if (cropType === 'personalizado') {
      const requiredFields = [
        { key: 'temperatureMin', label: 'Temperatura minima' },
        { key: 'temperatureMax', label: 'Temperatura maxima' },
        { key: 'humidityMin',    label: 'Umidade minima' },
        { key: 'humidityMax',    label: 'Umidade maxima' },
        { key: 'soilMoistureMin', label: 'Umidade do substrato minima' },
        { key: 'soilMoistureMax', label: 'Umidade do substrato maxima' },
      ];
      const missing = requiredFields.filter((f) => customParams[f.key] === '');
      if (missing.length > 0) {
        setStepError(`Preencha os campos obrigatorios do perfil de cultivo: ${missing.map((f) => f.label).join(', ')}.`);
        return;
      }
    }

    const selectedProfile = profileByType[cropType];

    await onCreate({
      name: name.trim(),
      cep: digitsOnly(cep),
      city: city.trim(),
      state,
      cropType,
      flowerProfileId: selectedProfile?.id ?? null,
      customParams: cropType === 'personalizado' ? customParams : null
    });
  };

  const isAiTab = customProfileTab === 'ia';

  const handleCustomNumericChange = (field, min, max) => (event) => {
    const raw = event.target.value;
    if (raw === '') {
      setCustomParams((prev) => ({ ...prev, [field]: '' }));
      return;
    }

    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) {
      return;
    }

    const clamped = Math.min(max, Math.max(min, parsed));
    setCustomParams((prev) => ({ ...prev, [field]: String(clamped) }));
  };

  return (
    <section className="rounded-3xl border border-stone-200 bg-white dark:border-stone-800/60 dark:bg-[#0f0c0c] p-6 shadow-sm md:p-8">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
          Onboarding guiado
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-800 dark:text-stone-100">
          {forceMode
            ? 'Você ainda não tem estufas cadastradas. Vamos criar a primeira agora.'
            : 'Vamos cadastrar uma nova estufa'}
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-stone-400">
          Leva menos de 1 minuto. Siga os passos abaixo.
        </p>
      </header>

      <div className="mb-6 flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-stone-400">
        {[1, 2, 3].map((item) => (
          <div key={item} className="flex items-center gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full ${step >= item ? 'bg-red-600 text-white' : 'bg-slate-200 dark:bg-stone-700 text-slate-600 dark:text-stone-300'}`}
            >
              {item}
            </span>
            {item < 3 ? <span className="h-px w-6 bg-stone-700" /> : null}
          </div>
        ))}
      </div>

      {step === 1 ? (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-stone-100">Escolha o tipo de cultivo</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {cropOptions.map((option) => {
              const selected = cropType === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setCropType(option.id)}
                  className={`rounded-2xl border p-4 text-left transition-all w-full ${selected ? 'border-red-500/70 bg-red-500/8 ring-1 ring-red-500/40' : 'border-stone-200 bg-white hover:border-stone-300 dark:border-stone-800/60 dark:bg-stone-900/35 dark:hover:border-stone-700/60'}`}
                >
                  <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">{option.title}</p>
                  <p className="mt-1 text-xs text-stone-600 dark:text-stone-400">{option.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-stone-100">Nome e localização da estufa</h2>
            <p className="text-sm text-slate-600 dark:text-stone-400">Informe o CEP para preenchimento automático de cidade e estado.</p>
          </div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-stone-300">
            Nome da estufa *
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value.slice(0, 80))}
              placeholder="Ex.: Estufa do galpao 1"
              className="mt-1 w-full rounded-xl border border-slate-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm text-slate-700 dark:text-stone-200 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
            />
          </label>
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
            <input
              type="text"
              value={cep}
              onChange={(event) => {
                const nextCep = formatCep(event.target.value);
                setCep(nextCep);
                setCepError('');
                if (digitsOnly(nextCep).length < 8) {
                  setCity('');
                  setState('');
                }
              }}
              onBlur={() => {
                if (digitsOnly(cep).length === 8) {
                  handleCepLookup();
                }
              }}
              placeholder="CEP (00000-000)"
              className="w-full rounded-xl border border-slate-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm text-slate-700 dark:text-stone-200 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={handleCepLookup}
              disabled={cepLoading || digitsOnly(cep).length !== 8}
            >
              {cepLoading ? 'Consultando CEP...' : 'Buscar CEP'}
            </Button>
          </div>
          {cepError ? <p className="text-xs text-rose-700">{cepError}</p> : null}
          <div className="grid gap-3 md:grid-cols-2">
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value.slice(0, 80))}
              placeholder="Cidade (preenchida pelo CEP ou manual)"
              className="w-full rounded-xl border border-slate-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm text-slate-700 dark:text-stone-200 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
            />
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase())}
              placeholder="UF"
              className="w-full rounded-xl border border-slate-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm text-slate-700 dark:text-stone-200 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
            />
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-stone-100">Revisão rápida</h2>
            <p className="text-sm text-slate-600 dark:text-stone-400">Confira os dados antes de finalizar.</p>
          </div>

          <dl className="grid gap-2 rounded-xl border border-slate-200 dark:border-stone-700 bg-slate-50 dark:bg-stone-800/40 p-4 text-sm text-slate-700 dark:text-stone-300">
            <div className="flex items-center justify-between">
              <dt>Nome</dt>
              <dd className="font-semibold">{name || 'Sem nome'}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>CEP</dt>
              <dd className="font-semibold">{cep || 'Nao informado'}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Cidade</dt>
              <dd className="font-semibold">{city || 'Nao informada'}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Estado</dt>
              <dd className="font-semibold">{state || 'Nao informado'}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Tipo</dt>
              <dd className="font-semibold capitalize">{cropType}</dd>
            </div>
          </dl>

          {cropType === 'personalizado' ? (
            <div className="space-y-3 rounded-xl border border-stone-200 bg-white dark:border-stone-800/60 dark:bg-stone-900/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-amber-900">Perfil de cultivo personalizado</h3>
                <div className="inline-flex rounded-lg border border-amber-300 bg-white dark:bg-stone-900 p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setCustomProfileTab('manual')}
                    className={`rounded-md px-2.5 py-1 font-semibold transition ${customProfileTab === 'manual' ? 'bg-red-600 text-white' : 'text-stone-400 hover:bg-stone-700/50'}`}
                  >
                    Manual
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomProfileTab('ia')}
                    className={`rounded-md px-2.5 py-1 font-semibold transition ${customProfileTab === 'ia' ? 'bg-red-600 text-white' : 'text-stone-400 hover:bg-stone-700/50'}`}
                  >
                    Sugerir com IA
                  </button>
                </div>
              </div>

              {customProfileTab === 'ia' ? (
                <div className="rounded-lg border border-amber-300 bg-white/70 dark:bg-stone-800/50 p-3">
                  <p className="text-xs font-semibold text-amber-900">Assistente de perfil com IA</p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-stone-400">
                    Descreva o cultivo desejado e a IA sugere faixas iniciais para preencher os parametros.
                  </p>
                  <div className="mt-2">
                    <label className="text-xs text-slate-700 dark:text-stone-300">
                      Descricao do perfil de cultivo
                      <input
                        type="text"
                        value={customParams.plantation}
                        onChange={(event) => setCustomParams((prev) => ({ ...prev, plantation: event.target.value.slice(0, 120) }))}
                        placeholder="Ex.: Perfil para frutificacao com alta umidade e ventilacao moderada"
                        className="mt-1 w-full rounded-lg border border-amber-300 bg-white dark:bg-stone-800 px-2 py-1.5 text-sm text-slate-900 dark:text-stone-100"
                      />
                    </label>
                    <p className="mt-1 text-[11px] text-slate-600 dark:text-stone-400">
                      Descreva objetivo e contexto do perfil. A IA usa esse dado para montar a sugestao.
                    </p>
                  </div>
                  <div className="mt-2 flex flex-col gap-2 md:flex-row">
                    <input
                      type="text"
                      value={aiQuestion}
                      onChange={(event) => setAiQuestion(event.target.value.slice(0, 300))}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          handleSuggestWithAi();
                        }
                      }}
                      placeholder="Ex.: Quero cultivar shiitake com foco em rendimento e baixa contaminacao"
                      className="w-full rounded-lg border border-amber-300 bg-white dark:bg-stone-800 px-2 py-1.5 text-sm text-slate-900 dark:text-stone-100 placeholder:text-slate-400"
                    />
                    <Button type="button" onClick={handleSuggestWithAi} disabled={aiLoading || !aiQuestion.trim()}>
                      {aiLoading ? 'Gerando...' : 'Aplicar sugestao'}
                    </Button>
                  </div>
                  {aiError ? <p className="mt-2 text-xs text-rose-700">{aiError}</p> : null}
                  {aiSuccess ? <p className="mt-2 text-xs text-emerald-700">{aiSuccess}</p> : null}
                  {aiNotes.length > 0 ? (
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-700 dark:text-stone-300">
                      {aiNotes.map((note, index) => (
                        <li key={`${note}-${index}`}>{note}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}

              <div className="grid gap-3 md:grid-cols-2">
                <p className="text-[11px] text-slate-600 dark:text-stone-400 md:col-span-2">
                  Limites permitidos: temperatura {CUSTOM_LIMITS.temperature.label}, umidade do ar {CUSTOM_LIMITS.humidity.label} e umidade do substrato {CUSTOM_LIMITS.soilMoisture.label}.
                </p>
                <label className="text-xs text-slate-700 dark:text-stone-300 md:col-span-2">
                  Nome do perfil de cultivo
                  <input
                    type="text"
                    value={customParams.profileName}
                    onChange={(event) => setCustomParams((prev) => ({ ...prev, profileName: event.target.value.slice(0, 80) }))}
                    disabled={isAiTab}
                    placeholder="Ex.: Shiitake - Frutificacao inverno"
                    className={`mt-1 w-full rounded-lg border px-2 py-1.5 text-sm ${isAiTab ? 'cursor-not-allowed border-slate-300 bg-slate-100 text-slate-500' : 'border-amber-300 bg-white dark:bg-stone-800 text-slate-900 dark:text-stone-100'}`}
                  />
                  <p className="mt-1 text-[11px] text-slate-600 dark:text-stone-400">
                    Esse e o nome do perfil que sera usado para aplicar os limites ideais da estufa.
                  </p>
                </label>
                <label className="text-xs text-slate-700 dark:text-stone-300 md:col-span-2">
                  Descricao do perfil de cultivo
                  <input
                    type="text"
                    value={customParams.plantation}
                    onChange={(event) => setCustomParams((prev) => ({ ...prev, plantation: event.target.value.slice(0, 120) }))}
                    disabled={isAiTab}
                    placeholder="Ex.: Perfil para frutificacao com alta umidade e ventilacao moderada"
                    className={`mt-1 w-full rounded-lg border px-2 py-1.5 text-sm ${isAiTab ? 'cursor-not-allowed border-slate-300 bg-slate-100 text-slate-500' : 'border-amber-300 bg-white dark:bg-stone-800 text-slate-900 dark:text-stone-100'}`}
                  />
                  <p className="mt-1 text-[11px] text-slate-600 dark:text-stone-400">
                    Esse texto ajuda a identificar rapidamente quando usar esse perfil.
                  </p>
                </label>
                <label className="text-xs text-slate-700 dark:text-stone-300">
                  Temperatura minima (°C)
                  <input
                    type="number"
                    value={customParams.temperatureMin}
                    onChange={handleCustomNumericChange('temperatureMin', CUSTOM_LIMITS.temperature.min, CUSTOM_LIMITS.temperature.max)}
                    disabled={isAiTab}
                    min={CUSTOM_LIMITS.temperature.min}
                    max={CUSTOM_LIMITS.temperature.max}
                    step={CUSTOM_LIMITS.temperature.step}
                    className={`mt-1 w-full rounded-lg border px-2 py-1.5 text-sm ${isAiTab ? 'cursor-not-allowed border-slate-300 bg-slate-100 text-slate-500' : 'border-amber-300 bg-white dark:bg-stone-800 text-slate-900 dark:text-stone-100'}`}
                  />
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-stone-400">Permitido: {CUSTOM_LIMITS.temperature.label}</p>
                </label>
                <label className="text-xs text-slate-700 dark:text-stone-300">
                  Temperatura maxima (°C)
                  <input
                    type="number"
                    value={customParams.temperatureMax}
                    onChange={handleCustomNumericChange('temperatureMax', CUSTOM_LIMITS.temperature.min, CUSTOM_LIMITS.temperature.max)}
                    disabled={isAiTab}
                    min={CUSTOM_LIMITS.temperature.min}
                    max={CUSTOM_LIMITS.temperature.max}
                    step={CUSTOM_LIMITS.temperature.step}
                    className={`mt-1 w-full rounded-lg border px-2 py-1.5 text-sm ${isAiTab ? 'cursor-not-allowed border-slate-300 bg-slate-100 text-slate-500' : 'border-amber-300 bg-white dark:bg-stone-800 text-slate-900 dark:text-stone-100'}`}
                  />
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-stone-400">Permitido: {CUSTOM_LIMITS.temperature.label}</p>
                </label>
                <label className="text-xs text-slate-700 dark:text-stone-300">
                  Umidade minima (%)
                  <input
                    type="number"
                    value={customParams.humidityMin}
                    onChange={handleCustomNumericChange('humidityMin', CUSTOM_LIMITS.humidity.min, CUSTOM_LIMITS.humidity.max)}
                    disabled={isAiTab}
                    min={CUSTOM_LIMITS.humidity.min}
                    max={CUSTOM_LIMITS.humidity.max}
                    step={CUSTOM_LIMITS.humidity.step}
                    className={`mt-1 w-full rounded-lg border px-2 py-1.5 text-sm ${isAiTab ? 'cursor-not-allowed border-slate-300 bg-slate-100 text-slate-500' : 'border-amber-300 bg-white dark:bg-stone-800 text-slate-900 dark:text-stone-100'}`}
                  />
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-stone-400">Permitido: {CUSTOM_LIMITS.humidity.label}</p>
                </label>
                <label className="text-xs text-slate-700 dark:text-stone-300">
                  Umidade maxima (%)
                  <input
                    type="number"
                    value={customParams.humidityMax}
                    onChange={handleCustomNumericChange('humidityMax', CUSTOM_LIMITS.humidity.min, CUSTOM_LIMITS.humidity.max)}
                    disabled={isAiTab}
                    min={CUSTOM_LIMITS.humidity.min}
                    max={CUSTOM_LIMITS.humidity.max}
                    step={CUSTOM_LIMITS.humidity.step}
                    className={`mt-1 w-full rounded-lg border px-2 py-1.5 text-sm ${isAiTab ? 'cursor-not-allowed border-slate-300 bg-slate-100 text-slate-500' : 'border-amber-300 bg-white dark:bg-stone-800 text-slate-900 dark:text-stone-100'}`}
                  />
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-stone-400">Permitido: {CUSTOM_LIMITS.humidity.label}</p>
                </label>
                <label className="text-xs text-slate-700 dark:text-stone-300">
                  Umidade do substrato minima (%)
                  <input
                    type="number"
                    value={customParams.soilMoistureMin}
                    onChange={handleCustomNumericChange('soilMoistureMin', CUSTOM_LIMITS.soilMoisture.min, CUSTOM_LIMITS.soilMoisture.max)}
                    disabled={isAiTab}
                    min={CUSTOM_LIMITS.soilMoisture.min}
                    max={CUSTOM_LIMITS.soilMoisture.max}
                    step={CUSTOM_LIMITS.soilMoisture.step}
                    className={`mt-1 w-full rounded-lg border px-2 py-1.5 text-sm ${isAiTab ? 'cursor-not-allowed border-slate-300 bg-slate-100 text-slate-500' : 'border-amber-300 bg-white dark:bg-stone-800 text-slate-900 dark:text-stone-100'}`}
                  />
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-stone-400">Permitido: {CUSTOM_LIMITS.soilMoisture.label}</p>
                </label>
                <label className="text-xs text-slate-700 dark:text-stone-300">
                  Umidade do substrato maxima (%)
                  <input
                    type="number"
                    value={customParams.soilMoistureMax}
                    onChange={handleCustomNumericChange('soilMoistureMax', CUSTOM_LIMITS.soilMoisture.min, CUSTOM_LIMITS.soilMoisture.max)}
                    disabled={isAiTab}
                    min={CUSTOM_LIMITS.soilMoisture.min}
                    max={CUSTOM_LIMITS.soilMoisture.max}
                    step={CUSTOM_LIMITS.soilMoisture.step}
                    className={`mt-1 w-full rounded-lg border px-2 py-1.5 text-sm ${isAiTab ? 'cursor-not-allowed border-slate-300 bg-slate-100 text-slate-500' : 'border-amber-300 bg-white dark:bg-stone-800 text-slate-900 dark:text-stone-100'}`}
                  />
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-stone-400">Permitido: {CUSTOM_LIMITS.soilMoisture.label}</p>
                </label>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {repeatedValuesWarning && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10 px-3 py-2.5 text-xs text-amber-700 dark:text-amber-400">
          <i className="fa-solid fa-triangle-exclamation mt-0.5 flex-shrink-0" />
          <span>Utilize informações reais para chegar a um resultado correto. Os valores do perfil de cultivo estão todos iguais.</span>
        </div>
      )}

      {error ? (
        <p className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      {stepError && (
        <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-400">
          <i className="fa-solid fa-circle-exclamation mr-1.5" />{stepError}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {step > 1 ? (
            <Button
              type="button"
              variant="secondary"
              onClick={handleBack}
              disabled={busy}
              className="rounded-xl border border-stone-200 dark:border-stone-700 px-4 py-2 text-sm font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition disabled:opacity-40"
            >
              ← Voltar
            </Button>
          ) : null}
        </div>

        <Button
          type="button"
          onClick={step === totalSteps ? handleCreate : handleNext}
          disabled={busy}
          className="rounded-xl bg-gradient-to-r from-red-700 to-red-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-red-600 hover:to-red-500 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {busy ? (
            <><i className="fa-solid fa-circle-notch fa-spin mr-2" />{step === totalSteps ? 'Criando...' : 'Salvando...'}</>
          ) : step === totalSteps ? (
            <><i className="fa-solid fa-check mr-2" />Criar estufa</>
          ) : (
            <>Próximo <i className="fa-solid fa-arrow-right ml-2" /></>
          )}
        </Button>
      </div>
    </section>
  );
};
