import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/Button.jsx';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';
import { useAuthStore } from '../store/authStore.js';
import { getFriendlyErrorMessage } from '../utils/errorMessages.js';
import {
  listGreenhouses,
  updateGreenhouse,
  updateGreenhouseAlerts,
  evaluateGreenhouseMetrics,
  deleteGreenhouse,
  listGreenhouseTeamMembers,
  updateGreenhouseTeam,
  getGreenhouseExternalWeather
} from '../api/greenhouseService.js';
import { listCulturePresets } from '../api/presetService.js';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const generateEventId = () =>
  (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

const setTimeoutSafe = (callback, delay) =>
  (typeof window !== 'undefined' && typeof window.setTimeout === 'function'
    ? window.setTimeout(callback, delay)
    : setTimeout(callback, delay));

const clearTimeoutSafe = (handle) => {
  if (!handle) {
    return;
  }

  if (typeof window !== 'undefined' && typeof window.clearTimeout === 'function') {
    window.clearTimeout(handle);
  } else {
    clearTimeout(handle);
  }
};

const asFiniteNumber = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const buildEvaluationMetricsPayload = (telemetry, externalWeather) => {
  const metrics = {};
  const metricSources = {};
  const missingMetrics = [];

  const internalTemperature = asFiniteNumber(telemetry?.temperature);
  const externalTemperature = asFiniteNumber(externalWeather?.temperatura);
  if (internalTemperature !== null || externalTemperature !== null) {
    const useInternal = internalTemperature !== null;
    metrics.temperature = useInternal ? internalTemperature : externalTemperature;
    metricSources.temperature = useInternal ? 'internal' : 'external';
  } else {
    missingMetrics.push('temperature');
  }

  const internalHumidity = asFiniteNumber(telemetry?.humidity);
  const externalHumidity = asFiniteNumber(externalWeather?.umidade);
  if (internalHumidity !== null || externalHumidity !== null) {
    const useInternal = internalHumidity !== null;
    metrics.humidity = useInternal ? internalHumidity : externalHumidity;
    metricSources.humidity = useInternal ? 'internal' : 'external';
  } else {
    missingMetrics.push('humidity');
  }

  const internalSoilMoisture = asFiniteNumber(telemetry?.soilMoisture);
  if (internalSoilMoisture !== null) {
    metrics.soilMoisture = internalSoilMoisture;
    metricSources.soilMoisture = 'internal';
  } else {
    missingMetrics.push('soilMoisture');
  }

  return {
    metrics,
    metricSources,
    missingMetrics,
    partialEvaluation: missingMetrics.length > 0,
  };
};

const AUTOMATION_COOLING_DELAY_MS = 12000;
const ALERT_WATCHDOG_DELAY_MS = 3 * 60 * 1000;

const createInitialGreenhouseState = (name = 'Estufa Matriz') => ({
  greenhouseName: name,
  temperature: null,
  humidity: null,
  soilMoisture: null,
  co2: null,
  irrigation: 'Integração IoT em implantação',
  ventilation: 'Integração IoT em implantação',
  lighting: 'Integração IoT em implantação',
  lastUpdate: null
});

const createInitialEventLog = () => ([]);

const computeNextGreenhouseState = (prev) => {
  const temperature = clamp(prev.temperature + (Math.random() - 0.5) * 0.6, 22, 28);
  const humidity = clamp(prev.humidity + (Math.random() - 0.5) * 2.4, 55, 78);
  const soilMoisture = clamp(prev.soilMoisture + (Math.random() - 0.5) * 4.2, 35, 68);
  const co2 = clamp(prev.co2 + (Math.random() - 0.5) * 36, 380, 540);

  const irrigation = soilMoisture < 42
    ? 'Irrigação acionada automaticamente'
    : soilMoisture > 60
      ? 'Irrigação pausada'
      : 'Irrigação em stand-by';

  const ventilation = temperature > 26.4
    ? 'Ventilação forçada'
    : temperature < 23.1
      ? 'Ventilação mínima'
      : 'Ventilação modulada';

  const lighting = humidity > 70
    ? 'Iluminação reduzida'
    : humidity < 58
      ? 'Iluminação reforçada'
      : 'Iluminação automática';

  return {
    ...prev,
    temperature,
    humidity,
    soilMoisture,
    co2,
    irrigation,
    ventilation,
    lighting,
    lastUpdate: new Date().toISOString()
  };
};

const buildEventMessage = (stats) => {
  if (stats.irrigation.startsWith('Irrigação acionada')) {
    return `Umidade do substrato em ${Math.round(stats.soilMoisture)}%. Bomba e válvula solenoide acionadas por 2 minutos.`;
  }

  if (stats.ventilation === 'Ventilação forçada') {
    return `Exaustão forçada acionada para conter ${stats.temperature.toFixed(1)}°C.`;
  }

  if (stats.co2 > 510) {
    return `CO₂ em ${Math.round(stats.co2)} ppm. Ajuste de exaustão aplicado para estabilização ambiental.`;
  }

  if (stats.lighting === 'Iluminação reforçada') {
    return 'AgroLED ajustado para reforço de luminosidade conforme preset de cultivo.';
  }

  return 'Telemetria estável. Controle automático mantendo parâmetros ambientais dentro da faixa operacional.';
};

const formatTimestamp = (iso) => {
  if (!iso) {
    return '--';
  }

  try {
    return new Date(iso).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (_error) {
    return '--';
  }
};

const evaluateMetricRange = (value, range) => {
  if (!range) {
    return { ok: true, value: null, expected: range, direction: 'in-range' };
  }

  const normalized = typeof value === 'number' && Number.isFinite(value) ? value : null;

  if (normalized === null) {
    return { ok: true, value: null, expected: range, direction: 'unknown' };
  }

  if (normalized < range.min) {
    return {
      ok: false,
      value: normalized,
      expected: range,
      direction: 'low',
      deviation: range.min - normalized
    };
  }

  if (normalized > range.max) {
    return {
      ok: false,
      value: normalized,
      expected: range,
      direction: 'high',
      deviation: normalized - range.max
    };
  }

  return {
    ok: true,
    value: normalized,
    expected: range,
    direction: 'in-range',
    deviation: 0
  };
};

const buildAlertMessages = (profile, evaluation) => {
  const alerts = [];

  if (!evaluation.temperature.ok) {
    alerts.push(
      `Temperatura fora do ideal (${profile.temperature.min}°C - ${profile.temperature.max}°C).`
    );
  }

  if (!evaluation.humidity.ok) {
    alerts.push(
      `Umidade relativa fora do ideal (${profile.humidity.min}% - ${profile.humidity.max}%).`
    );
  }

  if (!evaluation.soilMoisture.ok) {
    alerts.push(
      `Umidade do substrato fora do ideal (${profile.soilMoisture.min}% - ${profile.soilMoisture.max}%).`
    );
  }

  return alerts;
};

const analyzeGreenhouseState = (state, profile) => {
  if (!state || !profile) {
    return {
      status: 'pending',
      alerts: [],
      metrics: {
        temperature: { ok: true, expected: profile?.temperature ?? null },
        humidity: { ok: true, expected: profile?.humidity ?? null },
        soilMoisture: { ok: true, expected: profile?.soilMoisture ?? null }
      }
    };
  }

  const metrics = {
    temperature: evaluateMetricRange(state.temperature, profile.temperature),
    humidity: evaluateMetricRange(state.humidity, profile.humidity),
    soilMoisture: evaluateMetricRange(state.soilMoisture, profile.soilMoisture)
  };

  const alerts = buildAlertMessages(profile, metrics);

  return {
    status: alerts.length === 0 ? 'ok' : 'alert',
    alerts,
    metrics
  };
};

const buildAlertFingerprint = (metrics) =>
  [metrics.temperature?.direction, metrics.humidity?.direction, metrics.soilMoisture?.direction]
    .filter(Boolean)
    .join('|');

const normalizeProfileRange = (metric) => {
  if (!metric || typeof metric !== 'object') {
    return null;
  }

  const source = metric.ideal && typeof metric.ideal === 'object' ? metric.ideal : metric;
  const min = Number(source.min);
  const max = Number(source.max);

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return null;
  }

  return { min, max };
};

const normalizeProfile = (profile) => {
  if (!profile || typeof profile !== 'object') {
    return null;
  }

  // formato legado (flower_profiles.py)
  if (profile.temperature && profile.humidity && profile.soilMoisture) {
    return {
      id: profile.id,
      name: profile.name,
      summary: profile.summary ?? '',
      temperature: normalizeProfileRange(profile.temperature),
      humidity: normalizeProfileRange(profile.humidity),
      soilMoisture: normalizeProfileRange(profile.soilMoisture)
    };
  }

  // formato atual (presets da API)
  if (profile.temperatura && profile.umidade && profile.luminosidade) {
    return {
      id: profile.id,
      name: profile.nome_cultura ?? 'Perfil sem nome',
      summary: profile.descricao ?? '',
      temperature: normalizeProfileRange(profile.temperatura),
      humidity: normalizeProfileRange(profile.umidade),
      // a tela ainda espera "soilMoisture", então mapeamos luminosidade aqui
      soilMoisture: normalizeProfileRange(profile.luminosidade)
    };
  }

  return null;
};

const GreenhousePanel = ({
  greenhouse,
  telemetry,
  eventLog,
  evaluation,
  profiles,
  teamMembers,
  notifyFeedback,
  saving,
  teamSaving,
  alertsSaving,
  notifyBusy,
  externalWeather,
  externalWeatherLoading,
  onSave,
  onUpdateTeam,
  onToggleAlerts,
  onNotify,
  onSimulateHeat,
  onDeleteRequest,
  readOnly = false
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [draftName, setDraftName] = useState(greenhouse.name ?? 'Estufa Matriz');
  const [draftProfileId, setDraftProfileId] = useState(greenhouse.flowerProfileId ?? '');
  const [draftResponsibleIds, setDraftResponsibleIds] = useState(greenhouse.responsibleUserIds ?? []);
  const [menuFeedback, setMenuFeedback] = useState(null);
  const [activeTopic, setActiveTopic] = useState('operacao');

  const currentProfile = useMemo(() => {
    if (greenhouse.profile) {
      return greenhouse.profile;
    }
    return profiles.find((profile) => profile.id === greenhouse.flowerProfileId) ?? null;
  }, [greenhouse.profile, greenhouse.flowerProfileId, profiles]);

  useEffect(() => {
    setDraftName(greenhouse.name ?? 'Estufa Matriz');
  }, [greenhouse.name]);

  useEffect(() => {
    setDraftProfileId(greenhouse.flowerProfileId ?? '');
  }, [greenhouse.flowerProfileId]);

  useEffect(() => {
    setDraftResponsibleIds(greenhouse.responsibleUserIds ?? []);
  }, [greenhouse.responsibleUserIds]);

  useEffect(() => {
    setActiveTopic('operacao');
  }, [greenhouse.id]);

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setMenuOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  const handleSave = async (event) => {
    event.preventDefault();
    const trimmedName = draftName.trim();

    if (!trimmedName) {
      setMenuFeedback({ type: 'error', text: 'Informe um nome para a estufa.' });
      return;
    }

    const result = await onSave(greenhouse.id, {
      name: trimmedName,
      flowerProfileId: draftProfileId || null
    });

    if (result.ok) {
      setMenuFeedback({ type: 'success', text: 'Configurações atualizadas.' });
    } else {
      setMenuFeedback({ type: 'error', text: result.message });
    }
  };

  const handleToggleAlerts = async (event) => {
    const enabled = event.target.checked;
    const result = await onToggleAlerts(greenhouse.id, enabled);

    if (!result.ok) {
      setMenuFeedback({ type: 'error', text: result.message });
    }
  };

  const handleDeleteClick = () => {
    if (typeof onDeleteRequest === 'function') {
      onDeleteRequest(greenhouse.id);
    }
    setMenuFeedback(null);
    setMenuOpen(false);
  };

  const handleToggleResponsible = (userId, enabled) => {
    setDraftResponsibleIds((prev) => {
      if (enabled) {
        if (prev.includes(userId)) {
          return prev;
        }
        return [...prev, userId];
      }
      return prev.filter((id) => id !== userId);
    });
    setMenuFeedback(null);
  };

  const handleSaveTeam = async () => {
    const result = await onUpdateTeam(greenhouse.id, draftResponsibleIds);
    if (result.ok) {
      setMenuFeedback({ type: 'success', text: 'Equipe responsável atualizada.' });
    } else {
      setMenuFeedback({ type: 'error', text: result.message });
    }
  };

  const resolvedTelemetry = telemetry ?? createInitialGreenhouseState(greenhouse.name);
  const resolvedLog = eventLog ?? createInitialEventLog(greenhouse.name);
  const hasTelemetry =
    typeof resolvedTelemetry.temperature === 'number'
    || typeof resolvedTelemetry.humidity === 'number'
    || typeof resolvedTelemetry.soilMoisture === 'number'
    || typeof resolvedTelemetry.co2 === 'number';
  const previewEvaluationPayload = buildEvaluationMetricsPayload(resolvedTelemetry, externalWeather);
  const hasEvaluableMetrics = Object.keys(previewEvaluationPayload.metrics).length > 0;
  const resolvedEvaluation = evaluation ?? {
    status: 'pending',
    alerts: [],
    metrics: {},
    partialEvaluation: false,
    metricSources: {},
    missingMetrics: []
  };
  const statusTone =
    resolvedEvaluation.status === 'ok'
      ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
      : resolvedEvaluation.status === 'alert'
        ? 'border-amber-300 bg-amber-50 text-amber-700'
        : 'border-stone-300 bg-stone-100 text-stone-600';
  const statusLabel =
    resolvedEvaluation.status === 'ok'
      ? 'Tudo certo'
      : resolvedEvaluation.status === 'alert'
        ? 'Atenção'
        : 'Sem avaliação';

  return (
    <section className="rounded-[26px] border border-stone-300 bg-[#f5f1eb] p-4 shadow-sm md:p-6">
      <header className="relative flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-300 bg-[#fcfaf7] p-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-red-700">
            Visão geral da estufa
          </span>
          <h2 className="text-2xl font-semibold text-slate-800">
            {resolvedTelemetry.greenhouseName}
          </h2>
          <p className="mt-1 text-sm text-slate-600">Aqui você acompanha como a estufa está agora.</p>
        </div>
        <div className="flex w-full flex-wrap items-center justify-start gap-3 md:w-auto md:justify-end">
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusTone}`}>
            {statusLabel}
          </span>
          {currentProfile ? (
            <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
              Perfil: {currentProfile.name}
            </span>
          ) : null}
          {readOnly ? (
            <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
              Perfil Leitor: consulta somente
            </span>
          ) : (
            <>
              <label className="flex items-center gap-2 rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={Boolean(greenhouse.alertsEnabled)}
                  onChange={handleToggleAlerts}
                  disabled={alertsSaving}
                  className="h-4 w-4 rounded border border-stone-400 bg-white text-red-600 focus:ring-red-400"
                />
                <span>{greenhouse.alertsEnabled ? 'Alertas ligados' : 'Alertas desligados'}</span>
              </label>
              <Button variant="secondary" onClick={() => setMenuOpen(true)}>
                Editar estufa
              </Button>
            </>
          )}
        </div>
      </header>

      {menuOpen ? createPortal(
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setMenuOpen(false);
            }
          }}
        >
          <div className="w-full max-w-2xl rounded-2xl border border-stone-300 bg-[#fcfaf7] p-4 shadow-2xl sm:p-5">
            <div className="mb-4 flex items-start justify-between gap-3 border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Editar estufa</h3>
                <p className="text-xs text-slate-500">Atualize nome, perfil de cultivo e equipe responsável.</p>
              </div>
              <Button
                type="button"
                variant="secondary"
                className="h-9 px-3 text-xs"
                onClick={() => setMenuOpen(false)}
              >
                Fechar
              </Button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-sm text-slate-700">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-stone-200 bg-stone-50 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Dados da estufa
                  </p>
                  <div className="mt-2 flex flex-col gap-2">
                    <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      Nome da estufa
                    </span>
                    <input
                      type="text"
                      value={draftName}
                      onChange={(event) => {
                        setDraftName(event.target.value.slice(0, 80));
                        setMenuFeedback(null);
                      }}
                      className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    />
                  </div>
                </div>

                <div className="rounded-md border border-stone-200 bg-stone-50 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Perfil de cultivo
                  </p>
                  <div className="mt-2 flex flex-col gap-2">
                    <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      Perfil de cultivo
                    </span>
                    <select
                      value={draftProfileId}
                      onChange={(event) => {
                        setDraftProfileId(event.target.value);
                        setMenuFeedback(null);
                      }}
                      className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    >
                      <option value="">Selecione a espécie de cogumelo</option>
                      {profiles.map((profile) => (
                        <option key={profile.id} value={profile.id}>
                          {profile.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-500">
                      Dica: escolha o perfil mais próximo do seu cultivo para melhorar os alertas automáticos.
                    </p>
                    <Link
                      to="/dashboard/presets"
                      className="inline-flex items-center justify-center rounded-md border border-stone-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-red-400 hover:text-red-700"
                    >
                      Gerenciar perfis de cultivo
                    </Link>
                  </div>
                </div>
              </div>

              <div className="rounded-md border border-stone-200 bg-white px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Equipe responsável
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Somente os responsáveis marcados recebem o alerta do botão Notificar equipe.
                </p>
                <ul className="mt-2 max-h-44 space-y-1 overflow-y-auto pr-1">
                  {teamMembers.length > 0 ? (
                    teamMembers.map((member) => {
                      const checked = draftResponsibleIds.includes(member.id);
                      return (
                        <li key={member.id}>
                          <label className="flex cursor-pointer items-start gap-2 rounded border border-stone-200 px-2 py-1.5 text-xs text-slate-700 hover:border-red-300">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(event) => handleToggleResponsible(member.id, event.target.checked)}
                              className="mt-0.5 h-4 w-4 rounded border border-stone-400 bg-white text-red-600 focus:ring-red-400"
                            />
                            <span>
                              <span className="block font-semibold text-slate-800">{member.fullName}</span>
                              <span className="text-[11px] text-slate-500">{member.email}</span>
                            </span>
                          </label>
                        </li>
                      );
                    })
                  ) : (
                    <li className="text-[11px] text-slate-500">Nenhum colaborador disponível para delegação.</li>
                  )}
                </ul>
                <div className="mt-2 flex flex-wrap justify-end gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-9 px-3 text-xs"
                    onClick={handleSaveTeam}
                    disabled={teamSaving}
                  >
                    {teamSaving ? 'Salvando equipe...' : 'Salvar equipe responsável'}
                  </Button>
                </div>
              </div>

              {menuFeedback ? (
                <div
                  className={`rounded border px-3 py-2 text-xs ${
                    menuFeedback.type === 'success'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-rose-200 bg-rose-50 text-rose-700'
                  }`}
                >
                  {menuFeedback.text}
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-2 border-t border-stone-200 pt-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className="text-[11px] uppercase tracking-[0.2em] text-rose-600">
                    Remoção de estufa
                  </span>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Use apenas se não for mais acompanhar este cultivo.
                  </p>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                  <Button
                    variant="danger"
                    type="button"
                    className="w-full sm:w-auto"
                    onClick={handleDeleteClick}
                  >
                    Remover estufa
                  </Button>
                  <Button type="submit" className="w-full sm:w-auto" disabled={saving}>
                    {saving ? 'Salvando...' : 'Salvar alterações'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-stone-300 bg-[#fcfaf7] p-2">
        {[
          { id: 'operacao', label: 'Operação' },
          { id: 'monitoramento', label: 'Monitoramento' },
          { id: 'guia', label: 'Guia rápido' }
        ].map((topic) => (
          <button
            key={topic.id}
            type="button"
            onClick={() => setActiveTopic(topic.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              activeTopic === topic.id
                ? 'bg-red-600 text-white'
                : 'border border-stone-300 bg-white text-slate-700 hover:border-red-300 hover:text-red-700'
            }`}
          >
            {topic.label}
          </button>
        ))}
      </div>

      {activeTopic === 'monitoramento' ? (
      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        <article className="rounded-2xl border border-stone-300 bg-white p-5">
          <header className="mb-4 flex items-center justify-between text-xs text-slate-500">
            <span>Como está sua estufa agora</span>
            <span>
              {hasTelemetry
                ? `Atualizado às ${formatTimestamp(resolvedTelemetry.lastUpdate)}`
                : 'Sem telemetria IoT disponível'}
            </span>
          </header>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 text-slate-800">
            {hasTelemetry ? (
              <>
                <div className="rounded-xl border border-stone-200 bg-[#fcfaf7] p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Temperatura</p>
                  <p className="text-2xl font-semibold text-slate-900">
                    {typeof resolvedTelemetry.temperature === 'number' ? `${resolvedTelemetry.temperature.toFixed(1)}°C` : '—'}
                  </p>
                  <p className="text-xs text-slate-500">{resolvedTelemetry.ventilation}</p>
                </div>
                <div className="rounded-xl border border-stone-200 bg-[#fcfaf7] p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Umidade do ambiente</p>
                  <p className="text-2xl font-semibold text-slate-900">
                    {typeof resolvedTelemetry.humidity === 'number' ? `${Math.round(resolvedTelemetry.humidity)}%` : '—'}
                  </p>
                  <p className="text-xs text-slate-500">Controle automático ativo</p>
                </div>
                <div className="rounded-xl border border-stone-200 bg-[#fcfaf7] p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Umidade do solo/substrato</p>
                  <p className="text-2xl font-semibold text-slate-900">
                    {typeof resolvedTelemetry.soilMoisture === 'number' ? `${Math.round(resolvedTelemetry.soilMoisture)}%` : '—'}
                  </p>
                  <p className="text-xs text-slate-500">{resolvedTelemetry.irrigation}</p>
                </div>
                <div className="rounded-xl border border-stone-200 bg-[#fcfaf7] p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">CO₂</p>
                  <p className="text-2xl font-semibold text-slate-900">
                    {typeof resolvedTelemetry.co2 === 'number' ? `${Math.round(resolvedTelemetry.co2)} ppm` : '—'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {typeof resolvedTelemetry.co2 === 'number'
                      ? `Fluxo ${resolvedTelemetry.co2 > 500 ? 'alto' : 'modulado'}`
                      : 'Sem leitura de fluxo'}
                  </p>
                </div>
                <div className="rounded-xl border border-stone-200 bg-[#fcfaf7] p-4 sm:col-span-2 xl:col-span-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Iluminação</p>
                  <p className="text-sm font-semibold text-slate-800">{resolvedTelemetry.lighting}</p>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-stone-300 bg-[#fcfaf7] p-4 text-sm text-slate-600 sm:col-span-2 xl:col-span-4">
                Telemetria interna oculta por enquanto. Este bloco será habilitado automaticamente quando os dispositivos IoT estiverem conectados.
              </div>
            )}
            <div className="rounded-xl border border-stone-200 bg-[#fcfaf7] p-4 sm:col-span-2 xl:col-span-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Clima da cidade (OpenWeather)</p>
              {externalWeatherLoading ? (
                <p className="text-sm text-slate-600">Consultando clima externo...</p>
              ) : externalWeather ? (
                <div className="mt-2 grid gap-2 text-sm text-slate-700 sm:grid-cols-4">
                  <p>
                    <span className="text-xs text-slate-500">Local</span>
                    <span className="block font-semibold">{externalWeather.cidade}/{externalWeather.estado}</span>
                  </p>
                  <p>
                    <span className="text-xs text-slate-500">Temperatura</span>
                    <span className="block font-semibold">{externalWeather.temperatura}°C</span>
                  </p>
                  <p>
                    <span className="text-xs text-slate-500">Umidade</span>
                    <span className="block font-semibold">{externalWeather.umidade}%</span>
                  </p>
                  <p>
                    <span className="text-xs text-slate-500">Condição</span>
                    <span className="block font-semibold">{externalWeather.descricao}</span>
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  Sem dados climáticos externos no momento. Verifique se cidade/estado da estufa estão válidos.
                </p>
              )}
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-stone-300 bg-white p-5">
          <header className="mb-3 flex items-center justify-between text-sm text-slate-700">
            <h3 className="text-lg font-semibold text-slate-800">Últimas atualizações</h3>
            <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Histórico</span>
          </header>
          <p className="text-xs text-slate-500">
            Aqui aparece o que aconteceu na estufa nos últimos momentos.
          </p>
          <ul className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1 text-sm text-slate-700">
            {resolvedLog.length > 0 ? (
              resolvedLog.map((entry) => (
                <li key={entry.id} className="rounded-md border border-stone-200 bg-[#fcfaf7] p-3">
                  <p className="text-xs text-slate-500">{formatTimestamp(entry.timestamp)}</p>
                  <p className="mt-1 text-slate-700">{entry.message}</p>
                </li>
              ))
            ) : (
              <li className="rounded-md border border-dashed border-stone-300 bg-[#fcfaf7] p-3 text-xs text-slate-500">
                Integração de eventos IoT em implantação. As atualizações aparecerão aqui conforme os dispositivos forem conectados.
              </li>
            )}
          </ul>
        </article>
      </div>
      ) : null}

      {activeTopic === 'guia' ? (
      <article className="mt-6 rounded-2xl border border-stone-300 bg-white p-5 text-sm text-slate-700">
        <h3 className="text-base font-semibold text-slate-800">Como ler essas informações</h3>
        <p className="mt-1 text-xs text-slate-500">
          Este guia rápido ajuda a entender para que serve cada opção no cultivo diário.
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded border border-stone-200 bg-[#fcfaf7] p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">Temperatura</p>
            <p className="mt-1 text-xs text-slate-600">Mostra se o ambiente está quente ou frio para o cultivo.</p>
          </div>
          <div className="rounded border border-stone-200 bg-[#fcfaf7] p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">Umidade do ambiente</p>
            <p className="mt-1 text-xs text-slate-600">Ajuda a manter o ar no ponto certo para o crescimento.</p>
          </div>
          <div className="rounded border border-stone-200 bg-[#fcfaf7] p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">Umidade do solo/substrato</p>
            <p className="mt-1 text-xs text-slate-600">Indica se precisa molhar mais ou menos o meio de cultivo.</p>
          </div>
          <div className="rounded border border-stone-200 bg-[#fcfaf7] p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">CO₂ e iluminação</p>
            <p className="mt-1 text-xs text-slate-600">Mostra se a qualidade do ar e a luz estão adequadas.</p>
          </div>
          <div className="rounded border border-stone-200 bg-[#fcfaf7] p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">Perfil de cultivo</p>
            <p className="mt-1 text-xs text-slate-600">É a meta que a estufa deve seguir para esse tipo de cultivo.</p>
          </div>
          <div className="rounded border border-stone-200 bg-[#fcfaf7] p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">Equipe responsável</p>
            <p className="mt-1 text-xs text-slate-600">As pessoas marcadas aqui recebem aviso quando algo sair do esperado.</p>
          </div>
        </div>
      </article>
      ) : null}

      {activeTopic === 'operacao' ? (
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <article className="rounded-2xl border border-stone-300 bg-white p-5 text-sm text-slate-700">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-slate-800">Meta do cultivo</h3>
            <Link
              to="/dashboard/presets"
              className="inline-flex items-center justify-center rounded-md border border-stone-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-red-400 hover:text-red-700"
            >
              Ver perfis
            </Link>
          </div>
          {currentProfile ? (
            <>
              <p className="mt-1 text-xs text-slate-500">{currentProfile.summary}</p>
              <dl className="mt-3 grid gap-3 text-xs text-slate-700 sm:grid-cols-4">
                <div className="rounded border border-stone-200 bg-[#fcfaf7] p-3">
                  <dt className="text-[11px] uppercase tracking-widest text-slate-500">Temperatura</dt>
                  <dd>
                    {currentProfile.temperature.min}°C — {currentProfile.temperature.max}°C
                  </dd>
                </div>
                <div className="rounded border border-stone-200 bg-[#fcfaf7] p-3">
                  <dt className="text-[11px] uppercase tracking-widest text-slate-500">Umidade do ambiente</dt>
                  <dd>
                    {currentProfile.humidity.min}% — {currentProfile.humidity.max}%
                  </dd>
                </div>
                <div className="rounded border border-stone-200 bg-[#fcfaf7] p-3">
                  <dt className="text-[11px] uppercase tracking-widest text-slate-500">Umidade do solo/substrato</dt>
                  <dd>
                    {currentProfile.soilMoisture.min}% — {currentProfile.soilMoisture.max}%
                  </dd>
                </div>
                <div className="rounded border border-stone-200 bg-[#fcfaf7] p-3">
                  <dt className="text-[11px] uppercase tracking-widest text-slate-500">Luminosidade</dt>
                  <dd>
                    {currentProfile.luminosity?.min ?? '—'} lux — {currentProfile.luminosity?.max ?? '—'} lux
                  </dd>
                </div>
              </dl>
            </>
          ) : (
            <p className="mt-2 text-xs text-slate-500">
              Clique em Editar estufa e escolha um perfil de cultivo para ativar os limites ideais.
            </p>
          )}
          <div className="mt-3 rounded-xl border border-stone-200 bg-[#fcfaf7] p-3">
            <h4 className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Equipe responsável</h4>
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {greenhouse.watchersDetails?.length > 0 ? (
                greenhouse.watchersDetails.map((watcher) => (
                  <li
                    key={watcher.id}
                    className="rounded-full border border-red-300 bg-red-50 px-2.5 py-0.5 text-[11px] text-red-700"
                  >
                    {watcher.fullName ?? watcher.email}
                  </li>
                ))
              ) : (
                <li className="rounded-full border border-stone-200 bg-white px-2.5 py-0.5 text-[11px] text-slate-500">
                  Administrador ainda não definiu equipe para esta estufa.
                </li>
              )}
            </ul>
            {!readOnly ? (
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-[10px] text-slate-500">
                  Adicione ou remova membros para receber o alerta de notificação.
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  className="h-8 shrink-0 px-3 text-[11px]"
                  onClick={() => setMenuOpen(true)}
                >
                  Gerenciar equipe
                </Button>
              </div>
            ) : (
              <p className="mt-2 text-[10px] text-slate-500">
                Perfil Leitor: somente visualização da equipe delegada.
              </p>
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-stone-300 bg-white p-5">
          <h3 className="text-base font-semibold text-slate-800">Próximos passos</h3>
          {resolvedEvaluation.status === 'pending' ? (
            <p className="mt-2 text-xs text-slate-500">
              Clique em Gerar avaliação para receber orientações com os dados disponíveis neste momento.
            </p>
          ) : (
            <>
              <p
                className={`mt-2 text-xs font-semibold ${
                  resolvedEvaluation.status === 'ok' ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {resolvedEvaluation.status === 'ok'
                  ? 'Com os dados atuais, tudo está dentro da faixa esperada.'
                  : 'Com os dados atuais, encontramos pontos fora da faixa ideal.'}
              </p>
              {resolvedEvaluation.partialEvaluation ? (
                <p className="mt-1 text-[11px] text-slate-500">
                  Esta avaliação é parcial. Nesta fase de implantação, o sistema analisa principalmente o clima da cidade e apenas os sensores que já estão ativos na estufa.
                </p>
              ) : null}
              <div className="mt-3 grid gap-3 text-xs text-slate-700 sm:grid-cols-3">
                {['temperature', 'humidity', 'soilMoisture'].map((metricKey) => {
                  const metric = resolvedEvaluation.metrics[metricKey] ?? {};
                  const labelMap = {
                    temperature: 'Temperatura',
                    humidity: 'Umidade relativa',
                    soilMoisture: 'Umidade do substrato'
                  };
                  const unitMap = {
                    temperature: '°C',
                    humidity: '%',
                    soilMoisture: '%'
                  };
                  const sourceLabel =
                    resolvedEvaluation.metricSources?.[metricKey] === 'external'
                      ? 'Clima da cidade'
                      : resolvedEvaluation.metricSources?.[metricKey] === 'internal'
                        ? 'Sensor interno'
                        : 'Não informado';
                  const className = metric.evaluated === false
                    ? 'border-stone-200 bg-stone-100 text-slate-600'
                    : metric.ok
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-amber-200 bg-amber-50 text-amber-700';
                  return (
                    <div key={metricKey} className={`rounded border px-3 py-2 ${className}`}>
                      <p className="text-[11px] uppercase tracking-[0.2em]">{labelMap[metricKey]}</p>
                      <p className="text-sm font-semibold">
                        {typeof metric.value === 'number'
                          ? `${metric.value.toFixed(1)}${unitMap[metricKey]}`
                          : '—'}
                      </p>
                      <p className="text-[11px]">
                        Ideal {metric.expected?.min ?? '—'}{unitMap[metricKey]} — {metric.expected?.max ?? '—'}{unitMap[metricKey]}
                      </p>
                      <p className="text-[11px]">
                        {metric.evaluated === false ? 'Sem dado coletado para este parâmetro' : `Fonte usada: ${sourceLabel}`}
                      </p>
                    </div>
                  );
                })}
              </div>
              {resolvedEvaluation.alerts.length > 0 ? (
                <ul className="mt-3 space-y-2 text-xs text-amber-700">
                  {resolvedEvaluation.alerts.map((alert) => (
                    <li key={alert} className="flex items-start gap-2">
                      <span aria-hidden="true">•</span>
                      <span>{alert}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          )}
          <div className="mt-3 rounded-xl border border-stone-200 bg-[#fcfaf7] p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Button
                variant="secondary"
                type="button"
                className="h-9 w-full px-3 text-xs sm:w-auto"
                disabled={
                  readOnly ||
                  notifyBusy ||
                  !onNotify ||
                  !hasEvaluableMetrics
                }
                onClick={() => onNotify?.(greenhouse.id)}
              >
                {notifyBusy
                  ? 'Processando...'
                  : resolvedEvaluation.status === 'alert'
                    ? 'Notificar equipe'
                    : 'Gerar avaliação'}
              </Button>
              <p className="text-[10px] text-slate-500">
                {readOnly ? 'Perfil Leitor não executa ações.' : 'Para evitar repetição, um novo aviso sai só após 15 min.'}
              </p>
            </div>
            <p className="mt-2 text-[10px] text-slate-500">
              {readOnly
                ? 'Você pode apenas acompanhar os dados da estufa delegada.'
                : hasTelemetry
                  ? 'Com sensores internos ativos, as recomendações ficam mais precisas.'
                  : hasEvaluableMetrics
                    ? 'Ainda sem telemetria interna completa: avaliação parcial baseada principalmente no clima da cidade.'
                    : 'Sem dados suficientes para avaliar agora. Aguarde novos dados.'}
            </p>
          </div>
          {notifyFeedback ? (
            <p
              className={`mt-3 rounded border px-3 py-2 text-xs ${
                notifyFeedback.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : notifyFeedback.type === 'info'
                    ? 'border-stone-300 bg-stone-100 text-slate-600'
                    : 'border-rose-200 bg-rose-50 text-rose-700'
              }`}
            >
              {notifyFeedback.text}
            </p>
          ) : null}
        </article>
      </div>
      ) : null}
    </section>
  );
};

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { greenhouseId } = useParams();
  const currentUser = useAuthStore((state) => state.user);
  const requiresPasswordReset = useAuthStore((state) => state.requiresPasswordReset);
  const isReader = currentUser?.role === 'Reader';

  const [profiles, setProfiles] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [greenhouses, setGreenhouses] = useState([]);
  const [telemetryById, setTelemetryById] = useState({});
  const [eventLogById, setEventLogById] = useState({});
  const [evaluationById, setEvaluationById] = useState({});
  const [notifyFeedbackById, setNotifyFeedbackById] = useState({});
  const [savingById, setSavingById] = useState({});
  const [teamSavingById, setTeamSavingById] = useState({});
  const [alertsSavingById, setAlertsSavingById] = useState({});
  const [notifyBusyById, setNotifyBusyById] = useState({});
  const [externalWeatherById, setExternalWeatherById] = useState({});
  const [externalWeatherLoadingById, setExternalWeatherLoadingById] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const lastAlertFingerprintRef = useRef({});
  const simulationTimersRef = useRef({});
  const telemetryRef = useRef({});
  const profileMap = useMemo(() => {
    const map = {};
    profiles.forEach((profile) => {
      map[profile.id] = profile;
    });
    return map;
  }, [profiles]);

  const selectedGreenhouse = useMemo(
    () => greenhouses.find((entry) => entry.id === greenhouseId) ?? null,
    [greenhouses, greenhouseId]
  );

  useEffect(() => {
    let active = true;

    const loadInitialData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [profilesResult, greenhousesResult, teamMembersResult] = await Promise.allSettled([
          listCulturePresets(),
          listGreenhouses(),
          listGreenhouseTeamMembers()
        ]);

        if (!active) {
          return;
        }

        const resolvedProfiles = profilesResult.status === 'fulfilled' ? profilesResult.value : [];
        const resolvedGreenhouses = greenhousesResult.status === 'fulfilled' ? greenhousesResult.value : { greenhouses: [] };
        const resolvedTeamMembers = teamMembersResult.status === 'fulfilled' ? teamMembersResult.value : { members: [] };

        const rawProfiles = Array.isArray(resolvedProfiles)
          ? resolvedProfiles
          : Array.isArray(resolvedProfiles?.profiles)
            ? resolvedProfiles.profiles
            : [];

        const normalizedProfiles = rawProfiles
          .map(normalizeProfile)
          .filter((profile) => profile?.id && profile?.temperature && profile?.humidity && profile?.soilMoisture);

        setProfiles(normalizedProfiles);
        setGreenhouses(resolvedGreenhouses?.greenhouses ?? []);
        setTeamMembers(resolvedTeamMembers?.members ?? []);

        if (greenhousesResult.status === 'rejected') {
          throw greenhousesResult.reason;
        }
      } catch (loadError) {
        if (active) {
          setError(getFriendlyErrorMessage(loadError, 'Não foi possível carregar as estufas de cultivo.'));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadInitialData();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (greenhouses.length === 0) {
      setTelemetryById({});
      setEventLogById({});
      setEvaluationById({});
      setNotifyFeedbackById({});
      lastAlertFingerprintRef.current = {};
      return;
    }

    setTelemetryById((prev) => {
      const next = { ...prev };
      const validIds = new Set();
      greenhouses.forEach((greenhouse) => {
        validIds.add(greenhouse.id);
        if (!next[greenhouse.id]) {
          next[greenhouse.id] = createInitialGreenhouseState(greenhouse.name);
        } else if (next[greenhouse.id].greenhouseName !== greenhouse.name) {
          next[greenhouse.id] = {
            ...next[greenhouse.id],
            greenhouseName: greenhouse.name ?? next[greenhouse.id].greenhouseName
          };
        }
      });
      Object.keys(next).forEach((id) => {
        if (!validIds.has(id)) {
          delete next[id];
        }
      });
      return next;
    });

    setEventLogById((prev) => {
      const next = { ...prev };
      const validIds = new Set();
      greenhouses.forEach((greenhouse) => {
        validIds.add(greenhouse.id);
        if (!next[greenhouse.id]) {
          next[greenhouse.id] = createInitialEventLog(greenhouse.name);
        }
      });
      Object.keys(next).forEach((id) => {
        if (!validIds.has(id)) {
          delete next[id];
        }
      });
      return next;
    });

    setNotifyFeedbackById((prev) => {
      const next = {};
      greenhouses.forEach((greenhouse) => {
        if (prev[greenhouse.id]) {
          next[greenhouse.id] = prev[greenhouse.id];
        }
      });
      return next;
    });

    setExternalWeatherById((prev) => {
      const next = {};
      greenhouses.forEach((greenhouse) => {
        if (prev[greenhouse.id]) {
          next[greenhouse.id] = prev[greenhouse.id];
        }
      });
      return next;
    });

    setExternalWeatherLoadingById((prev) => {
      const next = {};
      greenhouses.forEach((greenhouse) => {
        next[greenhouse.id] = prev[greenhouse.id] ?? false;
      });
      return next;
    });

    setSavingById((prev) => {
      const next = {};
      const validIds = new Set(greenhouses.map((entry) => entry.id));
      greenhouses.forEach((greenhouse) => {
        next[greenhouse.id] = prev[greenhouse.id] ?? false;
      });
      Object.keys(prev).forEach((id) => {
        if (!validIds.has(id) && next[id]) {
          delete next[id];
        }
      });
      return next;
    });

    setTeamSavingById((prev) => {
      const next = {};
      const validIds = new Set(greenhouses.map((entry) => entry.id));
      greenhouses.forEach((greenhouse) => {
        next[greenhouse.id] = prev[greenhouse.id] ?? false;
      });
      Object.keys(prev).forEach((id) => {
        if (!validIds.has(id) && next[id]) {
          delete next[id];
        }
      });
      return next;
    });

    setAlertsSavingById((prev) => {
      const next = {};
      const validIds = new Set(greenhouses.map((entry) => entry.id));
      greenhouses.forEach((greenhouse) => {
        next[greenhouse.id] = prev[greenhouse.id] ?? false;
      });
      Object.keys(prev).forEach((id) => {
        if (!validIds.has(id) && next[id]) {
          delete next[id];
        }
      });
      return next;
    });

    setEvaluationById((prev) => {
      const next = {};
      const validIds = new Set(greenhouses.map((entry) => entry.id));
      greenhouses.forEach((greenhouse) => {
        next[greenhouse.id] = prev[greenhouse.id] ?? {
          status: 'pending',
          alerts: [],
          metrics: {},
          partialEvaluation: false,
          metricSources: {},
          missingMetrics: []
        };
      });
      Object.keys(prev).forEach((id) => {
        if (!validIds.has(id) && next[id]) {
          delete next[id];
        }
      });
      return next;
    });

    const previousFingerprints = lastAlertFingerprintRef.current ?? {};
    const nextFingerprints = {};
    greenhouses.forEach((greenhouse) => {
      if (previousFingerprints[greenhouse.id]) {
        nextFingerprints[greenhouse.id] = previousFingerprints[greenhouse.id];
      }
    });
    lastAlertFingerprintRef.current = nextFingerprints;
  }, [greenhouses]);

  useEffect(
    () => () => {
      Object.values(simulationTimersRef.current).forEach((timers) => {
        if (!timers) {
          return;
        }

        if (timers.coolingTimer) {
          clearTimeoutSafe(timers.coolingTimer);
        }

        if (timers.watchdogTimer) {
          clearTimeoutSafe(timers.watchdogTimer);
        }
      });
      simulationTimersRef.current = {};
    },
    []
  );

  useEffect(() => {
    const validIds = new Set(greenhouses.map((greenhouse) => greenhouse.id));
    Object.keys(simulationTimersRef.current).forEach((greenhouseId) => {
      if (!validIds.has(greenhouseId)) {
        const timers = simulationTimersRef.current[greenhouseId];
        if (timers?.coolingTimer) {
          clearTimeoutSafe(timers.coolingTimer);
        }
        if (timers?.watchdogTimer) {
          clearTimeoutSafe(timers.watchdogTimer);
        }
        delete simulationTimersRef.current[greenhouseId];
      }
    });
  }, [greenhouses]);

  useEffect(() => {
    telemetryRef.current = telemetryById;
  }, [telemetryById]);

  useEffect(() => {
    if (!selectedGreenhouse?.id) {
      return undefined;
    }

    let active = true;
    const targetId = selectedGreenhouse.id;

    const loadExternalWeather = async () => {
      setExternalWeatherLoadingById((prev) => ({
        ...prev,
        [targetId]: true
      }));

      try {
        const weather = await getGreenhouseExternalWeather(targetId);
        if (!active) {
          return;
        }
        setExternalWeatherById((prev) => ({
          ...prev,
          [targetId]: weather
        }));
      } catch (_error) {
        if (!active) {
          return;
        }
        setExternalWeatherById((prev) => ({
          ...prev,
          [targetId]: null
        }));
      } finally {
        if (active) {
          setExternalWeatherLoadingById((prev) => ({
            ...prev,
            [targetId]: false
          }));
        }
      }
    };

    loadExternalWeather();
    const refreshHandle = setInterval(loadExternalWeather, 5 * 60 * 1000);

    return () => {
      active = false;
      clearInterval(refreshHandle);
    };
  }, [selectedGreenhouse?.id]);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (error) {
      return;
    }

    if (greenhouseId && greenhouses.length === 0) {
      return;
    }

    if (!greenhouseId && greenhouses.length === 0) {
      if (isReader) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/dashboard/onboarding', { replace: true });
      }
      return;
    }

    if (greenhouseId && !selectedGreenhouse) {
      navigate('/dashboard', { replace: true });
    }
  }, [loading, greenhouses.length, greenhouseId, selectedGreenhouse, navigate, isReader]);

  useEffect(() => undefined, []);

  useEffect(() => {
    if (greenhouses.length === 0) {
      setEvaluationById({});
      return;
    }

    const nextEvaluation = {};
    const notifyUpdates = {};

    greenhouses.forEach((greenhouse) => {
      const telemetry = telemetryById[greenhouse.id];
      const profile = greenhouse.profile ?? profileMap[greenhouse.flowerProfileId];

      if (!profile) {
        nextEvaluation[greenhouse.id] = {
          status: 'pending',
          alerts: [],
          metrics: {}
        };
        return;
      }

      const evaluation = analyzeGreenhouseState(telemetry, profile);
      nextEvaluation[greenhouse.id] = evaluation;

      const fingerprint = buildAlertFingerprint(evaluation.metrics ?? {});
      const lastFingerprint = lastAlertFingerprintRef.current[greenhouse.id];

      if (evaluation.status === 'alert') {
        if (fingerprint && fingerprint !== lastFingerprint) {
          notifyUpdates[greenhouse.id] = {
            type: 'info',
            text: 'Parâmetros críticos detectados. Revise os atuadores ou notifique a equipe técnica.'
          };
          lastAlertFingerprintRef.current[greenhouse.id] = fingerprint;
        }
      } else if (evaluation.status === 'ok') {
        if (lastFingerprint && lastFingerprint !== 'ok') {
          notifyUpdates[greenhouse.id] = {
            type: 'success',
            text: 'Estufa voltou para a faixa ideal.'
          };
        }
        lastAlertFingerprintRef.current[greenhouse.id] = 'ok';
      }
    });

    setEvaluationById(nextEvaluation);

    if (Object.keys(notifyUpdates).length > 0) {
      setNotifyFeedbackById((prev) => ({
        ...prev,
        ...notifyUpdates
      }));
    }
  }, [telemetryById, greenhouses, profileMap]);

  const handleRequestDeleteGreenhouse = useCallback(
    (greenhouseId) => {
      const target = greenhouses.find((entry) => entry.id === greenhouseId);
      setDeleteBusy(false);
      setDeleteTarget({
        id: greenhouseId,
        name: target?.name ?? 'esta estufa',
        isLast: greenhouses.length <= 1
      });
    },
    [greenhouses]
  );

  const handleCancelDelete = useCallback(() => {
    if (deleteBusy) {
      return;
    }
    setDeleteTarget(null);
  }, [deleteBusy]);

  const handleSaveGreenhouse = useCallback(async (greenhouseId, payload) => {
    setSavingById((prev) => ({
      ...prev,
      [greenhouseId]: true
    }));

    try {
      const response = await updateGreenhouse(greenhouseId, payload);
      const updated = response?.greenhouse ?? response;

      if (updated) {
        setGreenhouses((prev) =>
          prev.map((greenhouse) => (greenhouse.id === greenhouseId ? { ...greenhouse, ...updated } : greenhouse))
        );
      }

      return { ok: true };
    } catch (updateError) {
      return {
        ok: false,
        message: getFriendlyErrorMessage(updateError, 'Não foi possível atualizar a estufa agora.')
      };
    } finally {
      setSavingById((prev) => ({
        ...prev,
        [greenhouseId]: false
      }));
    }
  }, []);

  const handleToggleAlerts = useCallback(async (greenhouseId, enabled) => {
    setAlertsSavingById((prev) => ({
      ...prev,
      [greenhouseId]: true
    }));

    try {
      const response = await updateGreenhouseAlerts(greenhouseId, {
        alertsEnabled: Boolean(enabled)
      });
      const updated = response?.greenhouse ?? response;

      if (updated) {
        setGreenhouses((prev) =>
          prev.map((greenhouse) => (greenhouse.id === greenhouseId ? { ...greenhouse, ...updated } : greenhouse))
        );
      }

      setNotifyFeedbackById((prev) => ({
        ...prev,
        [greenhouseId]: {
          type: enabled ? 'success' : 'info',
          text: enabled
            ? 'Alertas automáticos ativados para esta estufa.'
            : 'Alertas automáticos desativados. Você ainda pode notificar manualmente.'
        }
      }));

      return { ok: true };
    } catch (toggleError) {
      return {
        ok: false,
        message: getFriendlyErrorMessage(toggleError, 'Não foi possível atualizar as preferencias de alertas agora.')
      };
    } finally {
      setAlertsSavingById((prev) => ({
        ...prev,
        [greenhouseId]: false
      }));
    }
  }, []);

  const handleUpdateTeam = useCallback(async (greenhouseId, responsibleUserIds) => {
    setTeamSavingById((prev) => ({
      ...prev,
      [greenhouseId]: true
    }));

    try {
      const response = await updateGreenhouseTeam(greenhouseId, responsibleUserIds);
      const updated = response?.greenhouse ?? response;

      if (updated) {
        setGreenhouses((prev) =>
          prev.map((greenhouse) => (greenhouse.id === greenhouseId ? { ...greenhouse, ...updated } : greenhouse))
        );
      }

      return { ok: true };
    } catch (updateError) {
      return {
        ok: false,
        message: getFriendlyErrorMessage(updateError, 'Não foi possível atualizar os responsáveis desta estufa.')
      };
    } finally {
      setTeamSavingById((prev) => ({
        ...prev,
        [greenhouseId]: false
      }));
    }
  }, []);

  const handleNotifyTeam = useCallback(async (greenhouseId) => {
    const telemetry = telemetryById[greenhouseId];
    const externalWeather = externalWeatherById[greenhouseId];
    const evaluationPayload = buildEvaluationMetricsPayload(telemetry, externalWeather);
    const metricsPayload = evaluationPayload.metrics;

    if (Object.keys(metricsPayload).length === 0) {
      setNotifyFeedbackById((prev) => ({
        ...prev,
        [greenhouseId]: {
          type: 'error',
          text: 'Sem dados suficientes para avaliar. Aguarde telemetria interna ou clima externo da cidade.'
        }
      }));
      return;
    }

    setNotifyBusyById((prev) => ({
      ...prev,
      [greenhouseId]: true
    }));

    setNotifyFeedbackById((prev) => ({
      ...prev,
      [greenhouseId]: {
        type: 'info',
        text: 'Enviando avaliação técnica e alerta para a equipe...'
      }
    }));

    try {
      const result = await evaluateGreenhouseMetrics(greenhouseId, {
        metrics: metricsPayload,
        metricSources: evaluationPayload.metricSources,
        missingMetrics: evaluationPayload.missingMetrics,
        partialEvaluation: evaluationPayload.partialEvaluation,
        notify: true
      });

      if (result?.greenhouse) {
        setGreenhouses((prev) =>
          prev.map((greenhouse) =>
            greenhouse.id === greenhouseId ? { ...greenhouse, ...result.greenhouse } : greenhouse
          )
        );
      }

      if (result?.metricsEvaluation) {
        setEvaluationById((prev) => ({
          ...prev,
          [greenhouseId]: {
            status: result.status,
            alerts: result.alerts,
            metrics: result.metricsEvaluation,
            partialEvaluation: Boolean(result.partialEvaluation),
            metricSources: result.metricSources ?? {},
            missingMetrics: Array.isArray(result.missingMetrics) ? result.missingMetrics : []
          }
        }));
      }

      if (result?.notified) {
        const metricCount = Array.isArray(result?.missingMetrics) ? 3 - result.missingMetrics.length : 0;
        setNotifyFeedbackById((prev) => ({
          ...prev,
          [greenhouseId]: {
            type: 'success',
            text:
              result?.partialEvaluation
                ? `Equipe técnica notificada com avaliação parcial (${Math.max(metricCount, 1)}/3 parâmetros avaliados).`
                : 'Equipe técnica notificada com sucesso com avaliação completa.'
          }
        }));
      } else if (result?.throttled) {
        setNotifyFeedbackById((prev) => ({
          ...prev,
          [greenhouseId]: {
            type: 'info',
            text: 'Um alerta recente já foi enviado. Aguarde o intervalo de 15 minutos.'
          }
        }));
      } else if (result?.status === 'ok') {
        setNotifyFeedbackById((prev) => ({
          ...prev,
          [greenhouseId]: {
            type: 'success',
            text: result?.partialEvaluation
              ? 'Nenhum desvio crítico detectado na avaliação parcial com os dados disponíveis.'
              : 'Nenhum desvio crítico detectado neste ciclo de avaliação.'
          }
        }));
      } else if (Array.isArray(result?.alerts) && result.alerts.length > 0) {
        setNotifyFeedbackById((prev) => ({
          ...prev,
          [greenhouseId]: {
            type: 'info',
            text:
              result?.responsibleCount > 0
                ? 'Alertas registrados. Recomenda-se inspeção operacional manual.'
                : 'Alertas registrados, mas não há equipe responsável delegada para receber notificação.'
          }
        }));
      } else {
        setNotifyFeedbackById((prev) => ({
          ...prev,
          [greenhouseId]: {
            type: 'info',
            text: 'Validação concluída.'
          }
        }));
      }
    } catch (notifyError) {
      setNotifyFeedbackById((prev) => ({
        ...prev,
        [greenhouseId]: {
          type: 'error',
            text: getFriendlyErrorMessage(notifyError, 'Não foi possível notificar a equipe tecnica agora.')
        }
      }));
    } finally {
      setNotifyBusyById((prev) => ({
        ...prev,
        [greenhouseId]: false
      }));
    }
  }, [telemetryById, externalWeatherById]);

  const clearSimulationTimers = useCallback((greenhouseId, options = { cooling: true, watchdog: true }) => {
    const entry = simulationTimersRef.current[greenhouseId];

    if (!entry) {
      return;
    }

    const shouldClearCooling = options.cooling !== undefined ? options.cooling : true;
    const shouldClearWatchdog = options.watchdog !== undefined ? options.watchdog : true;

    if (shouldClearCooling && entry.coolingTimer) {
      clearTimeoutSafe(entry.coolingTimer);
      entry.coolingTimer = null;
    }

    if (shouldClearWatchdog && entry.watchdogTimer) {
      clearTimeoutSafe(entry.watchdogTimer);
      entry.watchdogTimer = null;
    }

    if (!entry.coolingTimer && !entry.watchdogTimer) {
      delete simulationTimersRef.current[greenhouseId];
    }
  }, []);

  const handleConfirmDeleteGreenhouse = useCallback(async () => {
    if (!deleteTarget || deleteBusy) {
      return;
    }

    setDeleteBusy(true);
    setError(null);

    try {
      const response = await deleteGreenhouse(deleteTarget.id);
      const nextGreenhouses = Array.isArray(response?.greenhouses) ? response.greenhouses : null;

      clearSimulationTimers(deleteTarget.id);
      if (telemetryRef.current) {
        delete telemetryRef.current[deleteTarget.id];
      }

      setTelemetryById((prev) => {
        if (!prev[deleteTarget.id]) {
          return prev;
        }
        const next = { ...prev };
        delete next[deleteTarget.id];
        return next;
      });

      setEventLogById((prev) => {
        if (!prev[deleteTarget.id]) {
          return prev;
        }
        const next = { ...prev };
        delete next[deleteTarget.id];
        return next;
      });

      setEvaluationById((prev) => {
        if (!prev[deleteTarget.id]) {
          return prev;
        }
        const next = { ...prev };
        delete next[deleteTarget.id];
        return next;
      });

      setNotifyFeedbackById((prev) => {
        if (!prev[deleteTarget.id]) {
          return prev;
        }
        const next = { ...prev };
        delete next[deleteTarget.id];
        return next;
      });

      setNotifyBusyById((prev) => {
        if (!prev[deleteTarget.id]) {
          return prev;
        }
        const next = { ...prev };
        delete next[deleteTarget.id];
        return next;
      });

      setSavingById((prev) => {
        if (!prev[deleteTarget.id]) {
          return prev;
        }
        const next = { ...prev };
        delete next[deleteTarget.id];
        return next;
      });

      setTeamSavingById((prev) => {
        if (!prev[deleteTarget.id]) {
          return prev;
        }
        const next = { ...prev };
        delete next[deleteTarget.id];
        return next;
      });

      setAlertsSavingById((prev) => {
        if (!prev[deleteTarget.id]) {
          return prev;
        }
        const next = { ...prev };
        delete next[deleteTarget.id];
        return next;
      });

      if (lastAlertFingerprintRef.current) {
        delete lastAlertFingerprintRef.current[deleteTarget.id];
      }

      if (nextGreenhouses) {
        setGreenhouses(nextGreenhouses);
      } else {
        setGreenhouses((prev) => prev.filter((entry) => entry.id !== deleteTarget.id));
      }

      setDeleteTarget(null);
    } catch (deleteError) {
      setError(getFriendlyErrorMessage(deleteError, 'Não foi possível remover a estufa agora.'));
    } finally {
      setDeleteBusy(false);
    }
  }, [deleteTarget, deleteBusy, clearSimulationTimers, deleteGreenhouse]);

  const applyAutomaticCooling = useCallback((greenhouseId) => {
    const greenhouse = greenhouses.find((entry) => entry.id === greenhouseId);

    clearSimulationTimers(greenhouseId);

    if (!greenhouse) {
      return;
    }

    const greenhouseName = greenhouse.name ?? 'Estufa Matriz';
    const profile = greenhouse.profile
      ?? (greenhouse.flowerProfileId ? profileMap[greenhouse.flowerProfileId] : null);
    const nowIso = new Date().toISOString();
    const minTemp = profile?.temperature?.min ?? 19;
    const maxTemp = profile?.temperature?.max ?? 27;
    const target = profile
      ? (profile.temperature.min + profile.temperature.max) / 2
      : 24;

    const baselineTelemetry = telemetryRef.current[greenhouseId]
      ?? createInitialGreenhouseState(greenhouseName);

    const cooledTelemetry = {
      ...baselineTelemetry,
      greenhouseName,
      temperature: clamp(target, minTemp, maxTemp),
      ventilation: 'Ventilação modulada',
      lighting: 'Iluminação automática',
      lastUpdate: nowIso
    };

    setTelemetryById((prev) => ({
      ...prev,
      [greenhouseId]: cooledTelemetry
    }));

    setEventLogById((prev) => {
      const existing = prev[greenhouseId] ?? createInitialEventLog(greenhouseName);
      const entry = {
        id: generateEventId(),
        timestamp: nowIso,
        message:
          'Automação Plantelligence executou resfriamento/exaustão e registrou comunicação de normalização.'
      };
      return {
        ...prev,
        [greenhouseId]: [entry, ...existing].slice(0, 24)
      };
    });

    setNotifyFeedbackById((prev) => ({
      ...prev,
      [greenhouseId]: {
        type: 'success',
        text: 'Automação estabilizou a estufa e registrou a correção do incidente.'
      }
    }));
  }, [greenhouses, profileMap, clearSimulationTimers]);

  const runWatchdogCheck = useCallback(
    (greenhouseId) => {
      clearSimulationTimers(greenhouseId, { cooling: false, watchdog: true });

      const greenhouse = greenhouses.find((entry) => entry.id === greenhouseId);

      if (!greenhouse) {
        return;
      }

      const greenhouseName = greenhouse.name ?? 'Estufa Matriz';
      const profile = greenhouse.profile
        ?? (greenhouse.flowerProfileId ? profileMap[greenhouse.flowerProfileId] : null);
      const telemetry = telemetryRef.current[greenhouseId];
      const evaluation = analyzeGreenhouseState(telemetry, profile);

      if (evaluation.status !== 'alert') {
        setNotifyFeedbackById((prev) => ({
          ...prev,
          [greenhouseId]: {
            type: 'success',
            text: 'Desvio normalizado antes do limite de 3 minutos.'
          }
        }));
        return;
      }

      const nowIso = new Date().toISOString();

      setEventLogById((prev) => {
        const existing = prev[greenhouseId] ?? createInitialEventLog(greenhouseName);
        const entry = {
          id: generateEventId(),
          timestamp: nowIso,
          message: 'Alerta térmico continua após 3 minutos. Intervenção manual requisitada.'
        };
        return {
          ...prev,
          [greenhouseId]: [entry, ...existing].slice(0, 24)
        };
      });

      setNotifyFeedbackById((prev) => ({
        ...prev,
        [greenhouseId]: {
          type: 'error',
          text: 'Aquecimento persiste por mais de 3 minutos. Verifique exaustão, bomba e válvula in loco.'
        }
      }));

      if (!greenhouse.alertsEnabled) {
        return;
      }

      const externalWeather = externalWeatherById[greenhouseId];
      const evaluationPayload = buildEvaluationMetricsPayload(telemetry, externalWeather);
      if (Object.keys(evaluationPayload.metrics).length === 0) {
        return;
      }

      evaluateGreenhouseMetrics(greenhouseId, {
        metrics: evaluationPayload.metrics,
        metricSources: evaluationPayload.metricSources,
        missingMetrics: evaluationPayload.missingMetrics,
        partialEvaluation: evaluationPayload.partialEvaluation,
        notify: true
      }).catch(() => {
        setNotifyFeedbackById((prev) => ({
          ...prev,
          [greenhouseId]: {
            type: 'error',
            text: 'Não foi possível notificar a equipe sobre o alerta persistente.'
          }
        }));
      });
    },
    [greenhouses, profileMap, clearSimulationTimers, externalWeatherById]
  );

  const handleSimulateHeat = useCallback(
    (greenhouseId) => {
      const greenhouse = greenhouses.find((entry) => entry.id === greenhouseId);

      if (!greenhouse) {
        return;
      }

      const greenhouseName = greenhouse.name ?? 'Estufa Matriz';
      const nowIso = new Date().toISOString();

      clearSimulationTimers(greenhouseId);

      let simulatedTelemetry;

      setTelemetryById((prev) => {
        const current = prev[greenhouseId] ?? createInitialGreenhouseState(greenhouseName);
        const nextTemperature = clamp((current.temperature ?? 24) + 5.5, 10, 48);
        simulatedTelemetry = {
          ...current,
          greenhouseName,
          temperature: nextTemperature,
          ventilation: 'Ventilação forçada',
          lighting: 'Iluminação reduzida',
          lastUpdate: nowIso
        };
        return {
          ...prev,
          [greenhouseId]: simulatedTelemetry
        };
      });

      setEventLogById((prev) => {
        const existing = prev[greenhouseId] ?? createInitialEventLog(greenhouseName);
        const entry = {
          id: generateEventId(),
          timestamp: nowIso,
          message: 'Simulação: sensores detectaram temperatura elevada. Alertas automáticos acionados.'
        };
        return {
          ...prev,
          [greenhouseId]: [entry, ...existing].slice(0, 24)
        };
      });

      setNotifyFeedbackById((prev) => ({
        ...prev,
        [greenhouseId]: {
          type: 'info',
          text: 'Desvio térmico simulado. Rotina automática de estabilização será executada em instantes.'
        }
      }));

      setNotifyBusyById((prev) => ({
        ...prev,
        [greenhouseId]: true
      }));

      const externalWeather = externalWeatherById[greenhouseId];
      const evaluationPayload = buildEvaluationMetricsPayload(simulatedTelemetry, externalWeather);
      if (Object.keys(evaluationPayload.metrics).length === 0) {
        setNotifyFeedbackById((prev) => ({
          ...prev,
          [greenhouseId]: {
            type: 'info',
            text: 'Sem dados válidos para avaliar a simulação neste momento.'
          }
        }));
        setNotifyBusyById((prev) => ({
          ...prev,
          [greenhouseId]: false
        }));
        return;
      }

      evaluateGreenhouseMetrics(greenhouseId, {
        metrics: evaluationPayload.metrics,
        metricSources: evaluationPayload.metricSources,
        missingMetrics: evaluationPayload.missingMetrics,
        partialEvaluation: evaluationPayload.partialEvaluation,
        notify: true,
        forceNotify: true
      })
        .then((result) => {
          if (result?.metricsEvaluation) {
            setEvaluationById((prev) => ({
              ...prev,
              [greenhouseId]: {
                status: result.status,
                alerts: result.alerts,
                metrics: result.metricsEvaluation,
                partialEvaluation: Boolean(result.partialEvaluation),
                metricSources: result.metricSources ?? {},
                missingMetrics: Array.isArray(result.missingMetrics) ? result.missingMetrics : []
              }
            }));
          }

          if (result?.greenhouse) {
            setGreenhouses((prev) =>
              prev.map((item) => (item.id === greenhouseId ? { ...item, ...result.greenhouse } : item))
            );
          }

          if (result?.notified) {
            setNotifyFeedbackById((prev) => ({
              ...prev,
              [greenhouseId]: {
                type: 'success',
                text: 'Equipe notificada: desvio simulado identificado e rotina automática registrada.'
              }
            }));
          } else if (result?.throttled) {
            setNotifyFeedbackById((prev) => ({
              ...prev,
              [greenhouseId]: {
                type: 'info',
                text: 'Notificação simulada registrada localmente (janela de cooldown ativa).'
              }
            }));
          }
        })
        .catch(() => {
          setNotifyFeedbackById((prev) => ({
            ...prev,
            [greenhouseId]: {
              type: 'error',
                text: 'Falha ao requisitar envio de e-mail para o desvio simulado.'
            }
          }));
        })
        .finally(() => {
          setNotifyBusyById((prev) => ({
            ...prev,
            [greenhouseId]: false
          }));
        });

      const coolingTimer = setTimeoutSafe(() => {
        applyAutomaticCooling(greenhouseId);
      }, AUTOMATION_COOLING_DELAY_MS);

      const watchdogTimer = setTimeoutSafe(() => {
        runWatchdogCheck(greenhouseId);
      }, ALERT_WATCHDOG_DELAY_MS);

      simulationTimersRef.current[greenhouseId] = {
        coolingTimer: coolingTimer ?? null,
        watchdogTimer: watchdogTimer ?? null
      };
    },
    [greenhouses, clearSimulationTimers, applyAutomaticCooling, runWatchdogCheck, externalWeatherById]
  );

  if (requiresPasswordReset) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-16 text-slate-100">
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-6">
          <h1 className="text-2xl font-semibold text-amber-200">Redefina sua senha</h1>
          <p className="mt-4 text-sm text-amber-100/90">
            Para acessar o dashboard multiestufas é necessário redefinir a senha temporária. Essa etapa reforça a política de segurança e conformidade LGPD da Plantelligence.
          </p>
          <Link
            to="/password-reset"
            className="mt-4 inline-flex items-center gap-2 rounded-md border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:border-amber-200 hover:text-amber-50"
          >
            Ir para redefinição de senha
          </Link>
        </div>
      </div>
    );
  }

  const isLoadingInitial = loading && greenhouses.length === 0;
  const deleteDialogTargetName = deleteTarget?.name?.trim() || 'esta estufa';
  const deleteDialogDescription = deleteTarget
    ? deleteTarget.isLast
      ? `Remover a estufa ${deleteDialogTargetName}? Uma estufa padrão será criada automaticamente para manter o monitoramento disponível.`
      : `Remover a estufa ${deleteDialogTargetName}? Esta ação não poderá ser desfeita.`
    : '';

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6">
      <div className="rounded-[30px] bg-[#181415] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.35)] md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-stone-300 bg-[#f5f1eb] p-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-red-700">Detalhes da estufa</span>
          <h1 className="text-3xl font-semibold text-slate-800">
            {selectedGreenhouse?.name ?? 'Carregando estufa'}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Aqui você acompanha os dados da estufa selecionada. Para trocar de estufa, volte para a lista.
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-red-400 hover:text-red-700"
          >
            Voltar para estufas
          </Link>
          <Link
            to="/settings"
            className="inline-flex items-center justify-center rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-red-400 hover:text-red-700"
          >
            Configurações da conta
          </Link>
        </div>
      </header>

      {error ? (
        <div className="mt-6 rounded-md border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {isLoadingInitial ? (
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {[0, 1].map((placeholder) => (
            <div
              key={placeholder}
              className="h-64 animate-pulse rounded-xl border border-stone-300 bg-[#f5f1eb]"
            />
          ))}
        </div>
      ) : null}

      {selectedGreenhouse ? (
        <div className="mt-12 space-y-10">
          <GreenhousePanel
            key={selectedGreenhouse.id}
            greenhouse={selectedGreenhouse}
            telemetry={telemetryById[selectedGreenhouse.id]}
            eventLog={eventLogById[selectedGreenhouse.id]}
            evaluation={evaluationById[selectedGreenhouse.id]}
            profiles={profiles}
            teamMembers={teamMembers}
            notifyFeedback={notifyFeedbackById[selectedGreenhouse.id]}
            saving={Boolean(savingById[selectedGreenhouse.id])}
            teamSaving={Boolean(teamSavingById[selectedGreenhouse.id])}
            alertsSaving={Boolean(alertsSavingById[selectedGreenhouse.id])}
            notifyBusy={Boolean(notifyBusyById[selectedGreenhouse.id])}
            externalWeather={externalWeatherById[selectedGreenhouse.id]}
            externalWeatherLoading={Boolean(externalWeatherLoadingById[selectedGreenhouse.id])}
            onSave={handleSaveGreenhouse}
            onUpdateTeam={handleUpdateTeam}
            onToggleAlerts={handleToggleAlerts}
            onNotify={handleNotifyTeam}
            onSimulateHeat={handleSimulateHeat}
            onDeleteRequest={handleRequestDeleteGreenhouse}
            readOnly={isReader}
          />
        </div>
      ) : null}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Remover estufa"
        description={deleteDialogDescription}
        confirmLabel={deleteBusy ? 'Removendo...' : 'Remover estufa'}
        confirmDisabled={deleteBusy}
        cancelDisabled={deleteBusy}
        onConfirm={handleConfirmDeleteGreenhouse}
        onCancel={handleCancelDelete}
      />
      </div>
    </div>
  );
};
