// Lista as estufas do usuario e permite filtrar, buscar e acessar cada uma delas.
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listGreenhouses } from '../api/greenhouseService.js';
import { DashboardSideNav } from '../components/DashboardSideNav.jsx';
import { useAuthStore } from '../store/authStore.js';
import { FiltroEstufas } from '../components/FiltroEstufas.jsx';
import { GridEstufas } from '../components/GridEstufas.jsx';
import { getFriendlyErrorMessage } from '../utils/errorMessages.js';
import {
  cropTypeVisuals,
  resolveCatalogLogo,
  resolveGreenhouseType
} from '../utils/greenhouseUiPrefs.js';

export const GreenhousesPage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const organizationName = user?.organizationName || 'sua organização';
  const [greenhouses, setGreenhouses] = useState([]);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await listGreenhouses();
        if (!active) {
          return;
        }

        const list = response?.greenhouses ?? [];
        setGreenhouses(list);

        const hasExplicitEmptyList = Array.isArray(response?.greenhouses);
        if (hasExplicitEmptyList && list.length === 0 && user?.role !== 'Reader') {
          navigate('/dashboard/onboarding', { replace: true });
        }
      } catch (loadError) {
        if (active) {
          setError(getFriendlyErrorMessage(loadError, 'Não foi possível carregar suas estufas.'));
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

  const filteredGreenhouses = useMemo(() => {
    return greenhouses.filter((greenhouse) => {
      const type = resolveGreenhouseType(greenhouse);
      const matchType = typeFilter === 'todos' || type === typeFilter;
      const matchQuery = (greenhouse.name ?? '').toLowerCase().includes(query.trim().toLowerCase());
      return matchType && matchQuery;
    });
  }, [greenhouses, typeFilter, query]);

  const getCardVisual = (greenhouse) => {
    const type = resolveGreenhouseType(greenhouse);
    const typeVisual = cropTypeVisuals[type] ?? cropTypeVisuals.personalizado;
    const logoVisual = resolveCatalogLogo(greenhouse.id, type);

    return {
      typeVisual,
      logoVisual
    };
  };

  const summary = useMemo(() => {
    const total = greenhouses.length;
    const withProfile = greenhouses.filter((item) => Boolean(item.profile || item.flowerProfileId)).length;
    const withTeam = greenhouses.filter((item) => (item.watchersDetails?.length ?? 0) > 0).length;

    return {
      total,
      withProfile,
      withTeam
    };
  }, [greenhouses]);

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6">
      <div className="rounded-[30px] bg-[#181415] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.35)] md:p-6">
        <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <DashboardSideNav
            active="dashboard"
            footerText="Dica rápida: escolha uma estufa e clique em Abrir detalhes."
          />

          <section className="overflow-y-auto rounded-[26px] bg-[#f5f1eb] p-4 md:p-6 lg:h-[calc(100vh-160px)] lg:min-h-[640px] lg:max-h-[820px]">
            <header className="mb-4 rounded-2xl border border-stone-300 bg-[#fcfaf7] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Seleção de estufas</p>
              <h1 className="mt-1 text-2xl font-semibold text-slate-800">Estufas da organização {organizationName}</h1>
              <p className="mt-1 text-sm text-slate-600">
                Abra uma estufa para configurar perfil, equipe responsável e acompanhar os dados reais quando sua integração estiver ativa.
              </p>
            </header>

            <section className="mb-4 grid gap-3 md:grid-cols-3">
              <article className="rounded-2xl border border-amber-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-amber-700">Com perfil vinculado</p>
                <p className="mt-1 text-3xl font-semibold text-amber-800">{summary.withProfile}</p>
                <p className="text-xs text-slate-500">Estufas prontas para avaliação por faixa ideal.</p>
              </article>
              <article className="rounded-2xl border border-emerald-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-emerald-700">Com equipe delegada</p>
                <p className="mt-1 text-3xl font-semibold text-emerald-800">{summary.withTeam}</p>
                <p className="text-xs text-slate-500">Recebem notificação somente para responsáveis definidos.</p>
              </article>
              <article className="rounded-2xl border border-stone-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-red-600">Estufas cadastradas</p>
                <p className="mt-1 text-3xl font-semibold text-slate-800">{summary.total}</p>
                <p className="text-xs text-slate-500">Total disponível para abrir e acompanhar.</p>
              </article>
            </section>

            {error ? (
              <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </p>
            ) : null}

            <FiltroEstufas
              query={query}
              onQueryChange={setQuery}
              typeFilter={typeFilter}
              onTypeFilterChange={setTypeFilter}
              totalVisible={filteredGreenhouses.length}
              total={greenhouses.length}
            />

            {loading ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="h-52 animate-pulse rounded-2xl border border-stone-300 bg-white" />
                ))}
              </div>
            ) : (
              <div className="mt-4">
                <GridEstufas
                  estufas={filteredGreenhouses}
                  getCardVisual={getCardVisual}
                  onOpen={(greenhouseId) => navigate(`/dashboard/estufas/${greenhouseId}`)}
                />
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
