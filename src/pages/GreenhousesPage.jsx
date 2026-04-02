// Lista as estufas do usuario e permite filtrar, buscar e acessar cada uma delas.
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listGreenhouses } from '../api/greenhouseService.js';
import { DashboardSideNav } from '../components/DashboardSideNav.jsx';
import { FiltroEstufas } from '../components/FiltroEstufas.jsx';
import { GridEstufas } from '../components/GridEstufas.jsx';
import {
  cropTypeVisuals,
  loadGreenhouseUiPrefs,
  resolveCatalogLogo,
  resolveGreenhouseType,
  resolveStatusVisual
} from '../utils/greenhouseUiPrefs.js';

export const GreenhousesPage = () => {
  const navigate = useNavigate();
  const [greenhouses, setGreenhouses] = useState([]);
  const [uiPrefs, setUiPrefs] = useState(() => loadGreenhouseUiPrefs());
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

        if (list.length === 0) {
          navigate('/dashboard/onboarding', { replace: true });
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.response?.data?.message ?? 'Não foi possível carregar suas estufas.');
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
  }, [navigate]);

  const filteredGreenhouses = useMemo(() => {
    return greenhouses.filter((greenhouse) => {
      const type = resolveGreenhouseType(greenhouse, uiPrefs);
      const matchType = typeFilter === 'todos' || type === typeFilter;
      const matchQuery = (greenhouse.name ?? '').toLowerCase().includes(query.trim().toLowerCase());
      return matchType && matchQuery;
    });
  }, [greenhouses, uiPrefs, typeFilter, query]);

  const getCardVisual = (greenhouse) => {
    const type = resolveGreenhouseType(greenhouse, uiPrefs);
    const typeVisual = cropTypeVisuals[type] ?? cropTypeVisuals.personalizado;
    const statusVisual = resolveStatusVisual(greenhouse);
    const logoVisual = resolveCatalogLogo(greenhouse.id, type);

    return {
      typeVisual,
      statusVisual,
      logoVisual
    };
  };

  const summary = useMemo(() => {
    const total = greenhouses.length;
    const ok = greenhouses.filter((item) => resolveStatusVisual(item).label === 'OK').length;
    const attention = greenhouses.filter((item) => resolveStatusVisual(item).label === 'Atenção').length;
    const noData = greenhouses.filter((item) => resolveStatusVisual(item).label === 'Sem dados').length;

    const safePercent = total > 0 ? Math.round((ok / total) * 100) : 0;

    return {
      total,
      safePercent,
      attention,
      noData
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
              <h1 className="mt-1 text-2xl font-semibold text-slate-800">Escolha uma estufa</h1>
              <p className="mt-1 text-sm text-slate-600">
                Tela simples para encontrar e abrir sua estufa sem complicação.
              </p>
            </header>

            <section className="mb-4 grid gap-3 md:grid-cols-3">
              <article className="rounded-2xl border border-stone-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-red-600">Estufas cadastradas</p>
                <p className="mt-1 text-3xl font-semibold text-slate-800">{summary.total}</p>
                <p className="text-xs text-slate-500">Total disponível para abrir agora.</p>
              </article>
              <article className="rounded-2xl border border-stone-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-red-600">Situação geral</p>
                <p className="mt-1 text-3xl font-semibold text-slate-800">{summary.safePercent}%</p>
                <p className="text-xs text-slate-500">Estufas marcadas como OK.</p>
              </article>
              <article className="rounded-2xl border border-stone-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-red-600">Pontos de atenção</p>
                <p className="mt-1 text-3xl font-semibold text-slate-800">{summary.attention + summary.noData}</p>
                <p className="text-xs text-slate-500">Precisam revisão ou ainda sem dados.</p>
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
              <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="h-60 animate-pulse rounded-2xl border border-stone-300 bg-white" />
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
