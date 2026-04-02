// Fluxo de cadastro de nova estufa com wizard guiado e selecao do perfil de cultivo de cogumelo.
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGreenhouse, getFlowerRecommendations, listGreenhouses } from '../api/greenhouseService.js';
import { DashboardSideNav } from '../components/DashboardSideNav.jsx';
import { WizardOnboardingCriarEstufa } from '../components/WizardOnboardingCriarEstufa.jsx';
import { loadGreenhouseUiPrefs, saveGreenhouseUiPrefs } from '../utils/greenhouseUiPrefs.js';

export const OnboardingGreenhousePage = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [greenhouseCount, setGreenhouseCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
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
          setError(loadError.response?.data?.message ?? 'Não foi possível preparar o cadastro da estufa.');
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
  }, []);

  const forceMode = !loading && greenhouseCount === 0;

  const handleCreate = async ({ name, cropType, flowerProfileId, customParams }) => {
    if (submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await createGreenhouse({
        name,
        flowerProfileId
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
      setError(createError.response?.data?.message ?? 'Não foi possível criar a estufa agora.');
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
            />
          </section>
        </div>
      </div>
    </div>
  );
};
