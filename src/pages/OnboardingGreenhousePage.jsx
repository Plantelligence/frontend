import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createGreenhouse,
  getFlowerRecommendations,
  listGreenhouses,
  resolveCepLocation
} from '../api/greenhouseService.js';
import { createCulturePreset } from '../api/presetService.js';
import { DashboardSideNav } from '../components/DashboardSideNav.jsx';
import { WizardOnboardingCriarEstufa } from '../components/WizardOnboardingCriarEstufa.jsx';
import { loadGreenhouseUiPrefs, saveGreenhouseUiPrefs } from '../utils/greenhouseUiPrefs.js';
import { getFriendlyErrorMessage } from '../utils/errorMessages.js';
import { useAuthStore } from '../store/authStore.js';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const normalizeIdealRange = (rawMin, rawMax, bounds, fallback) => {
  const parsedMin = Number(rawMin);
  const parsedMax = Number(rawMax);

  const safeMin = Number.isFinite(parsedMin) ? clamp(parsedMin, bounds.min, bounds.max) : fallback.min;
  const safeMax = Number.isFinite(parsedMax) ? clamp(parsedMax, bounds.min, bounds.max) : fallback.max;

  if (safeMin <= safeMax) {
    return { min: safeMin, max: safeMax };
  }

  return { min: safeMax, max: safeMin };
};

const buildMetricRangesFromIdeal = (ideal, bounds) => {
  const lowMid = Number((bounds.min + ideal.min) / 2);
  const highMid = Number((ideal.max + bounds.max) / 2);

  return {
    critico_baixo: { min: bounds.min, max: lowMid },
    alerta_baixo: { min: lowMid, max: ideal.min },
    ideal: { min: ideal.min, max: ideal.max },
    alerta_alto: { min: ideal.max, max: highMid },
    critico_alto: { min: highMid, max: bounds.max },
  };
};

const buildCustomPresetPayload = (customParams) => {
  const temperatureIdeal = normalizeIdealRange(
    customParams?.temperatureMin,
    customParams?.temperatureMax,
    { min: -5, max: 45 },
    { min: 14, max: 18 }
  );
  const humidityIdeal = normalizeIdealRange(
    customParams?.humidityMin,
    customParams?.humidityMax,
    { min: 0, max: 100 },
    { min: 84, max: 92 }
  );
  const substrateIdeal = normalizeIdealRange(
    customParams?.soilMoistureMin,
    customParams?.soilMoistureMax,
    { min: 0, max: 500 },
    { min: 180, max: 500 }
  );

  return {
    nome_cultura: (customParams?.profileName ?? '').trim(),
    tipo_cultura: 'Cogumelos',
    descricao: (customParams?.plantation ?? '').trim(),
    temperatura: buildMetricRangesFromIdeal(temperatureIdeal, { min: -5, max: 45 }),
    umidade: buildMetricRangesFromIdeal(humidityIdeal, { min: 0, max: 100 }),
    luminosidade: buildMetricRangesFromIdeal(substrateIdeal, { min: 0, max: 500 }),
  };
};

export const OnboardingGreenhousePage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [profiles, setProfiles] = useState([]);
  const [greenhouseCount, setGreenhouseCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.role === 'Reader') {
      setError('Perfil Leitor possui acesso somente de consulta das estufas delegadas.');
      navigate('/dashboard', { replace: true });
      return;
    }

    let active = true;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [profilesResponse, greenhousesResponse] = await Promise.all([
          getFlowerRecommendations(),
          listGreenhouses()
        ]);

        if (!active) {
          return;
        }

        const loadedProfiles = profilesResponse?.profiles ?? [];
        const loadedGreenhouses = greenhousesResponse?.greenhouses ?? [];

        setProfiles(loadedProfiles);
        setGreenhouseCount(loadedGreenhouses.length);
      } catch (loadError) {
        if (active) {
          setError(getFriendlyErrorMessage(loadError, 'Não foi possível preparar o cadastro da estufa.'));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [navigate, user?.role]);

  const forceMode = !loading && greenhouseCount === 0;

  const handleResolveCep = async (cep) => resolveCepLocation(cep);

  const handleCreate = async ({ name, cep, city, state, cropType, flowerProfileId, customParams }) => {
    if (submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      let resolvedProfileId = flowerProfileId;

      if (cropType === 'personalizado') {
        const customPayload = buildCustomPresetPayload(customParams);
        if (!customPayload.nome_cultura || !customPayload.descricao) {
          throw new Error('Informe nome e descrição para criar o perfil personalizado.');
        }

        const createdPreset = await createCulturePreset(customPayload);
        resolvedProfileId = createdPreset?.id ?? null;

        if (!resolvedProfileId) {
          throw new Error('Não foi possível criar o perfil personalizado.');
        }
      }

      const response = await createGreenhouse({
        name,
        cep,
        city,
        state,
        flowerProfileId: resolvedProfileId
      });

      const created = response?.greenhouse ?? response;

      if (!created?.id) {
        throw new Error('Resposta inválida ao criar estufa.');
      }

      const prefs = loadGreenhouseUiPrefs();
      const nextPrefs = {
        ...prefs,
        [created.id]: {
          ...prefs[created.id],
          type: cropType,
          customParams: customParams ?? null,
          useDefaultLogo: true
        }
      };
      saveGreenhouseUiPrefs(nextPrefs);

      navigate('/dashboard', { replace: true });
    } catch (createError) {
      setError(getFriendlyErrorMessage(createError, 'Não foi possível criar a estufa agora.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6">
      <div className="rounded-[30px] border border-stone-700 bg-[#181415] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.35)] md:p-6">
        <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <DashboardSideNav
            active="onboarding"
            footerText={
              forceMode
                ? 'Você ainda não tem estufas cadastradas. Vamos criar a primeira agora.'
                : 'Preencha os dados para criar uma nova estufa sem complicação.'
            }
          />

          <section className="overflow-y-auto rounded-[26px] bg-[#f5f1eb] p-4 md:p-6 lg:h-[calc(100vh-160px)] lg:min-h-[640px] lg:max-h-[820px]">
            <WizardOnboardingCriarEstufa
              profiles={profiles}
              forceMode={forceMode}
              loading={loading || submitting}
              error={error}
              onCreate={handleCreate}
              onResolveCep={handleResolveCep}
            />
          </section>
        </div>
      </div>
    </div>
  );
};
