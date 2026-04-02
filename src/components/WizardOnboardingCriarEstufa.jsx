// Wizard de onboarding para criação de uma nova estufa — guia o usuário passo a passo pelas configurações iniciais.
import React, { useMemo, useState } from 'react';
import { Button } from './Button.jsx';

const createDefaultCustomParams = () => ({
  temperatureMin: '',
  temperatureMax: '',
  humidityMin: '',
  humidityMax: '',
  soilMoistureMin: '',
  soilMoistureMax: ''
});

// Opcoes de cultivo apresentadas no wizard. O campo id deve bater com o slug
// do perfil no backend (flower_profiles.py) para o mapeamento automatico funcionar.
const cropOptions = [
  {
    id: 'champignon',
    title: 'Champignon',
    description: 'Agaricus bisporus em ambiente fresco, alta umidade e substrato organico.',
    style: 'border-red-200 bg-red-50/70'
  },
  {
    id: 'shimeji',
    title: 'Shimeji',
    description: 'Pleurotus sp. em serragem de eucalipto, boa ventilacao e umidade elevada.',
    style: 'border-orange-200 bg-orange-50/70'
  },
  {
    id: 'shiitake',
    title: 'Shiitake',
    description: 'Lentinula edodes em toras ou blocos de serragem enriquecida.',
    style: 'border-amber-200 bg-amber-50/70'
  },
  {
    id: 'ostra',
    title: 'Cogumelo Ostra',
    description: 'Pleurotus ostreatus de crescimento rapido em palha ou serragem.',
    style: 'border-teal-200 bg-teal-50/70'
  },
  {
    id: 'portobello',
    title: 'Portobello',
    description: 'Variante do Agaricus bisporus com cogumelo grande e sabor intenso.',
    style: 'border-stone-200 bg-stone-50/70'
  },
  {
    id: 'personalizado',
    title: 'Personalizado',
    description: 'Voce define os limites ideais do cultivo manualmente.',
    style: 'border-amber-200 bg-amber-50'
  }
];

export const WizardOnboardingCriarEstufa = ({
  profiles,
  forceMode,
  loading,
  error,
  onCreate
}) => {
  const [step, setStep] = useState(1);
  const [cropType, setCropType] = useState('champignon');
  const [name, setName] = useState('Minha primeira estufa');
  const [customParams, setCustomParams] = useState(createDefaultCustomParams());

  // Mapeia cada tipo de cultivo para o perfil do backend pelo id (slug).
  // Fallback para pesquisa por nome para compatibilidade com dados legados.
  const profileByType = useMemo(() => {
    const entries = Array.isArray(profiles) ? profiles : [];
    const byId = (id) => entries.find((p) => p?.id === id) ?? null;
    const byName = (value) => entries.find((p) => (p?.name ?? '').toLowerCase().includes(value)) ?? null;

    return {
      champignon: byId('champignon') ?? byName('champignon') ?? entries[0] ?? null,
      shimeji: byId('shimeji') ?? byName('shimeji') ?? entries[1] ?? entries[0] ?? null,
      shiitake: byId('shiitake') ?? byName('shiitake') ?? entries[2] ?? entries[0] ?? null,
      ostra: byId('ostra') ?? byName('ostra') ?? entries[3] ?? entries[0] ?? null,
      portobello: byId('portobello') ?? byName('portobello') ?? entries[4] ?? entries[0] ?? null,
      personalizado: entries[0] ?? null
    };
  }, [profiles]);

  const goNext = () => setStep((prev) => Math.min(prev + 1, 3));
  const goBack = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleCreate = async () => {
    const selectedProfile = profileByType[cropType];

    await onCreate({
      name: name.trim(),
      cropType,
      flowerProfileId: selectedProfile?.id ?? null,
      customParams: cropType === 'personalizado' ? customParams : null
    });
  };

  return (
    <section className="rounded-3xl border border-stone-300 bg-[#fcfaf7] p-6 shadow-sm md:p-8">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
          Onboarding guiado
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-800">
          {forceMode
            ? 'Você ainda não tem estufas cadastradas. Vamos criar a primeira agora.'
            : 'Vamos cadastrar uma nova estufa'}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Leva menos de 1 minuto. Siga os passos abaixo.
        </p>
      </header>

      <div className="mb-6 flex items-center gap-2 text-xs font-semibold text-slate-500">
        {[1, 2, 3].map((item) => (
          <div key={item} className="flex items-center gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full ${step >= item ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-600'}`}
            >
              {item}
            </span>
            {item < 3 ? <span className="h-px w-6 bg-slate-300" /> : null}
          </div>
        ))}
      </div>

      {step === 1 ? (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-800">Escolha o tipo de cultivo</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {cropOptions.map((option) => {
              const selected = cropType === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setCropType(option.id)}
                  className={`rounded-2xl border p-4 text-left transition ${selected ? 'ring-2 ring-red-500' : ''} ${option.style}`}
                >
                  <p className="text-sm font-semibold text-slate-800">{option.title}</p>
                  <p className="mt-1 text-xs text-slate-600">{option.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Nome da estufa</h2>
            <p className="text-sm text-slate-600">Use um nome simples para facilitar a identificação.</p>
          </div>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value.slice(0, 80))}
            placeholder="Ex.: Estufa do galpão 1"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
          />
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Revisão rápida</h2>
            <p className="text-sm text-slate-600">Confira os dados antes de finalizar.</p>
          </div>

          <dl className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <div className="flex items-center justify-between">
              <dt>Nome</dt>
              <dd className="font-semibold">{name || 'Sem nome'}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Tipo</dt>
              <dd className="font-semibold capitalize">{cropType}</dd>
            </div>
          </dl>

          {cropType === 'personalizado' ? (
            <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/85 p-4">
              <h3 className="text-sm font-semibold text-amber-900">Parâmetros ideais</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-xs text-slate-700">
                  Temperatura mínima (°C)
                  <input
                    type="number"
                    value={customParams.temperatureMin}
                    onChange={(event) => setCustomParams((prev) => ({ ...prev, temperatureMin: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-amber-300 px-2 py-1.5 text-sm"
                  />
                </label>
                <label className="text-xs text-slate-700">
                  Temperatura máxima (°C)
                  <input
                    type="number"
                    value={customParams.temperatureMax}
                    onChange={(event) => setCustomParams((prev) => ({ ...prev, temperatureMax: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-amber-300 px-2 py-1.5 text-sm"
                  />
                </label>
                <label className="text-xs text-slate-700">
                  Umidade mínima (%)
                  <input
                    type="number"
                    value={customParams.humidityMin}
                    onChange={(event) => setCustomParams((prev) => ({ ...prev, humidityMin: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-amber-300 px-2 py-1.5 text-sm"
                  />
                </label>
                <label className="text-xs text-slate-700">
                  Umidade máxima (%)
                  <input
                    type="number"
                    value={customParams.humidityMax}
                    onChange={(event) => setCustomParams((prev) => ({ ...prev, humidityMax: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-amber-300 px-2 py-1.5 text-sm"
                  />
                </label>
                <label className="text-xs text-slate-700">
                  Umidade do substrato mínima (%)
                  <input
                    type="number"
                    value={customParams.soilMoistureMin}
                    onChange={(event) => setCustomParams((prev) => ({ ...prev, soilMoistureMin: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-amber-300 px-2 py-1.5 text-sm"
                  />
                </label>
                <label className="text-xs text-slate-700">
                  Umidade do substrato máxima (%)
                  <input
                    type="number"
                    value={customParams.soilMoistureMax}
                    onChange={(event) => setCustomParams((prev) => ({ ...prev, soilMoistureMax: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-amber-300 px-2 py-1.5 text-sm"
                  />
                </label>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {step > 1 ? (
            <Button type="button" variant="secondary" onClick={goBack} disabled={loading}>
              Voltar
            </Button>
          ) : null}
        </div>
        {step < 3 ? (
          <Button type="button" onClick={goNext} disabled={loading || (step === 2 && !name.trim())}>
            Continuar
          </Button>
        ) : (
          <Button type="button" onClick={handleCreate} disabled={loading || !name.trim()}>
            {loading ? 'Criando estufa...' : 'Criar estufa'}
          </Button>
        )}
      </div>
    </section>
  );
};
