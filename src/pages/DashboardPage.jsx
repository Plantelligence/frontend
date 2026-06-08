import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '../components/Button.jsx';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';
import { useAuthStore } from '../store/authStore.js';
import { getFriendlyErrorMessage } from '../utils/errorMessages.js';
import {
  listGreenhouses,
  updateGreenhouse,
  updateGreenhouseAlerts,
  updateAlertThresholds,
  evaluateGreenhouseMetrics,
  deleteGreenhouse,
  listGreenhouseTeamMembers,
  updateGreenhouseTeam,
  getGreenhouseExternalWeather
} from '../api/greenhouseService.js';
import { listCulturePresets } from '../api/presetService.js';
import { listDevices, createDevice, updateDevice, deleteDevice } from '../api/deviceService.js';
import { WizardOnboardingDispositivo } from '../components/WizardOnboardingDispositivo.jsx';
import { ControlesPanel } from '../components/ControlesPanel.jsx';
import { CentroComando } from '../components/CentroComando.jsx';
import { MonitoramentoTab } from '../components/MonitoramentoTab.jsx';

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

  const internalLuminosidade = asFiniteNumber(telemetry?.luminosidade);
  const externalLuminosidade = asFiniteNumber(externalWeather?.luminosidade_estimada);
  if (internalLuminosidade !== null || externalLuminosidade !== null) {
    const useInternal = internalLuminosidade !== null;
    metrics.luminosity = useInternal ? internalLuminosidade : externalLuminosidade;
    metricSources.luminosity = useInternal ? 'internal' : 'external';
  } else {
    missingMetrics.push('luminosity');
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
  luminosidade: null,
  irrigation: 'Integração IoT em implantação',
  ventilation: 'Integração IoT em implantação',
  lighting: 'Integração IoT em implantação',
  lastUpdate: null
});

const createInitialEventLog = () => ([]);


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

  // formato atual (presets da API — campos em português)
  if (profile.temperatura && profile.umidade) {
    return {
      id: profile.id,
      name: profile.nome_cultura ?? 'Perfil sem nome',
      summary: profile.descricao ?? '',
      temperature: normalizeProfileRange(profile.temperatura),
      humidity: normalizeProfileRange(profile.umidade),
      soilMoisture: normalizeProfileRange(profile.umidade_solo) ?? null,
      luminosity: normalizeProfileRange(profile.luminosidade) ?? null,
    };
  }

  // formato mapeado (já convertido para chaves frontend)
  if (profile.temperature && profile.humidity) {
    return {
      id: profile.id,
      name: profile.name ?? profile.nome_cultura ?? 'Perfil sem nome',
      summary: profile.summary ?? profile.descricao ?? '',
      temperature: normalizeProfileRange(profile.temperature),
      humidity: normalizeProfileRange(profile.humidity),
      soilMoisture: normalizeProfileRange(profile.soilMoisture) ?? null,
      luminosity: normalizeProfileRange(profile.luminosity) ?? null,
    };
  }

  return null;
};

// calcula posição percentual do valor dentro do intervalo ideal
const pct = (valor, min, max) =>
  Math.min(100, Math.max(0, ((valor - min) / (max - min)) * 100));

// retorna 'ok', 'alerta' ou 'pending' para um valor vs intervalo ideal
const sensorStatus = (value, ideal) => {
  if (typeof value !== 'number' || !ideal) return 'pending';
  if (value < ideal[0] || value > ideal[1]) return 'alerta';
  return 'ok';
};

// gauge circular em SVG — mesmo design do protótipo v2
function Gauge({ valor, unidade, ideal, cor, status }) {
  const p = ideal ? pct(valor, ideal[0], ideal[1]) : 0;
  const r = 28, cx = 36, cy = 36;
  const circ = 2 * Math.PI * r;
  const dash = (p / 100) * circ * 0.75;
  const gap  = circ * 0.75 - dash;
  const offset = circ * 0.125;

  const trackColor = status === 'alerta' ? '#fef3c7' : '#f1f5f9';
  const fillColor  = status === 'alerta' ? '#f59e0b' : status === 'pending' ? '#e2e8f0' : cor;

  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke={trackColor} strokeWidth="6"
        strokeDasharray={`${circ * 0.75} ${circ * 0.25}`}
        strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(135 36 36)"
      />
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke={fillColor} strokeWidth="6"
        strokeDasharray={`${dash} ${gap + circ * 0.25}`}
        strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(135 36 36)"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      <text x="36" y="39" textAnchor="middle" fontSize="11" fontWeight="700"
        fill={status === 'alerta' ? '#b45309' : status === 'pending' ? '#94a3b8' : '#1c1917'}>
        {status === 'pending' ? '—' : valor}
      </text>
      <text x="36" y="50" textAnchor="middle" fontSize="7" fill="#a8a29e">
        {unidade}
      </text>
    </svg>
  );
}

// linha de sensor com barra de progresso e faixa ideal
function SensorRow({ label, valor, unidade, ideal, faixa, cor, status }) {
  const p = (ideal && typeof valor === 'number') ? pct(valor, ideal[0], ideal[1]) : 0;
  const isAlert = status === 'alerta';
  const isPending = status === 'pending';

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
      isAlert ? 'bg-amber-50 border-amber-200' : 'bg-white dark:bg-stone-800/40 border-stone-100 dark:border-stone-700/40'
    }`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-semibold tracking-widest uppercase text-slate-500 dark:text-stone-400">{label}</span>
          {isPending ? (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-700 text-stone-400 dark:text-stone-500">Aguardando</span>
          ) : (
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${isAlert ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400'}`}>
              {isAlert ? '⚠ Fora' : '✓ OK'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold leading-none ${isAlert ? 'text-amber-600' : isPending ? 'text-slate-300 dark:text-stone-600' : 'text-slate-900 dark:text-stone-100'}`}>
            {isPending ? '—' : typeof valor === 'number' ? valor.toFixed(valor % 1 === 0 ? 0 : 1) : '—'}
            <small className="text-[11px] font-normal text-slate-400 dark:text-stone-500 ml-0.5">{unidade}</small>
          </span>
          {faixa && <span className="text-[10px] text-slate-400 dark:text-stone-500 flex-shrink-0">ideal: {faixa}</span>}
        </div>
        <div className="mt-1.5 h-1.5 bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${p}%`, background: isAlert ? '#f59e0b' : isPending ? '#e2e8f0' : cor }}
          />
        </div>
      </div>
    </div>
  );
}

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
  onDeleteRequest,
  onUpdateAlertThresholds,
  devices = [],
  devicesLoading = false,
  onCreateDevice,
  onDeleteDevice,
  onToggleDevice,
  readOnly = false
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [draftName, setDraftName] = useState(greenhouse.name ?? 'Estufa Matriz');
  const [draftProfileId, setDraftProfileId] = useState(greenhouse.flowerProfileId ?? '');
  const [draftResponsibleIds, setDraftResponsibleIds] = useState(greenhouse.responsibleUserIds ?? []);
  const [menuFeedback, setMenuFeedback] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const VALID_TABS = ['comando', 'operacao', 'monitoramento', 'dispositivos', 'controles', 'guia'];
  const tabFromUrl = searchParams.get('tab');
  const [activeTopic, setActiveTopicState] = useState(
    VALID_TABS.includes(tabFromUrl) ? tabFromUrl : 'comando'
  );
  const setActiveTopic = (tab) => {
    setActiveTopicState(tab);
    setSearchParams((prev) => { prev.set('tab', tab); return prev; }, { replace: true });
  };

  const [thresholdDraft, setThresholdDraft] = useState(() => greenhouse.alertThresholds ?? {});
  const [thresholdSaving, setThresholdSaving] = useState(false);
  const [thresholdFeedback, setThresholdFeedback] = useState(null);

  // estado local do formulário de cadastro de dispositivo
  const [showDeviceWizard,  setShowDeviceWizard]  = useState(false);
  // credenciais IoT Hub retornadas após cadastro bem-sucedido


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
    setActiveTopic('comando');
    setThresholdDraft(greenhouse.alertThresholds ?? {});
    setThresholdFeedback(null);
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

    // salva apenas dados da estufa (nome e perfil)
    const resultEstufa = await onSave(greenhouse.id, { name: trimmedName, flowerProfileId: draftProfileId || null });

    if (resultEstufa.ok) {
      setMenuFeedback({ type: 'success', text: 'Estufa atualizada com sucesso.' });
      setTimeoutSafe(() => setMenuOpen(false), 1800);
    } else {
      setMenuFeedback({ type: 'error', text: resultEstufa.message });
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
      setTimeoutSafe(() => setTeamModalOpen(false), 1800);
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
    <section className="rounded-[26px] border border-stone-200 dark:border-stone-800/60 bg-stone-50 dark:bg-[#0f0c0c] p-4 shadow-sm md:p-6">
      <header className="relative flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-300 bg-white dark:border-stone-800/60 dark:bg-stone-900/35 p-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-red-700">
            Visão geral da estufa
          </span>
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-stone-100">
            {resolvedTelemetry.greenhouseName}
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-stone-400">Aqui você acompanha como a estufa está agora.</p>
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
              <label className="flex items-center gap-2 rounded-full border border-stone-300 bg-white dark:border-stone-700/50 dark:bg-stone-800/50 px-3 py-1.5 text-xs text-slate-700 dark:text-stone-300">
                <input
                  type="checkbox"
                  checked={Boolean(greenhouse.alertsEnabled)}
                  onChange={handleToggleAlerts}
                  disabled={alertsSaving}
                  className="h-4 w-4 rounded border border-stone-400 bg-white dark:bg-stone-800/50 text-red-600 focus:ring-red-400"
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
          <div className="w-full max-w-2xl rounded-2xl border border-stone-300 bg-white dark:border-stone-800/60 dark:bg-stone-900/35 p-4 shadow-2xl sm:p-5">
            <div className="mb-4 flex items-start justify-between gap-3 border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-stone-100">Editar estufa</h3>
                <p className="text-xs text-slate-500 dark:text-stone-400">Atualize nome, perfil de cultivo e equipe responsável.</p>
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

            <form onSubmit={handleSave} className="space-y-3 text-sm text-slate-700 dark:text-stone-300">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/40 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-stone-400">
                    Dados da estufa
                  </p>
                  <div className="mt-2 flex flex-col gap-2">
                    <span className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-stone-400">
                      Nome da estufa
                    </span>
                    <input
                      type="text"
                      value={draftName}
                      onChange={(event) => {
                        setDraftName(event.target.value.slice(0, 80));
                        setMenuFeedback(null);
                      }}
                      className="rounded-md border border-stone-300 bg-white dark:bg-stone-800 px-3 py-2 text-sm text-slate-800 dark:text-stone-100 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    />
                  </div>
                </div>

                <div className="rounded-md border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/40 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-stone-400">
                    Perfil de cultivo
                  </p>
                  <div className="mt-2 flex flex-col gap-2">
                    <span className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-stone-400">
                      Perfil de cultivo
                    </span>
                    <select
                      value={draftProfileId}
                      onChange={(event) => {
                        setDraftProfileId(event.target.value);
                        setMenuFeedback(null);
                      }}
                      className="rounded-md border border-stone-300 bg-white dark:bg-stone-800 px-3 py-2 text-sm text-slate-800 dark:text-stone-100 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    >
                      <option value="">Selecione a espécie de cogumelo</option>
                      {profiles.map((profile) => (
                        <option key={profile.id} value={profile.id}>
                          {profile.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-500 dark:text-stone-400">
                      Dica: escolha o perfil mais próximo do seu cultivo para melhorar os alertas automáticos.
                    </p>
                    <Link
                      to="/dashboard/presets"
                      className="inline-flex items-center justify-center rounded-md border border-stone-300 dark:border-stone-600 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-stone-300 transition hover:border-red-400 hover:text-red-700"
                    >
                      Gerenciar perfis de cultivo
                    </Link>
                  </div>
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
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-stone-400">
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

      {teamModalOpen ? createPortal(
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setTeamModalOpen(false); }}
        >
          <div className="w-full max-w-lg rounded-2xl border border-stone-300 bg-white dark:border-stone-800/60 dark:bg-stone-900/35 p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3 border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-stone-100">Gerenciar equipe</h3>
                <p className="text-xs text-slate-500 dark:text-stone-400">Defina quem recebe alertas e notificações desta estufa.</p>
              </div>
              <Button type="button" variant="secondary" className="h-9 px-3 text-xs" onClick={() => setTeamModalOpen(false)}>
                Fechar
              </Button>
            </div>

            <div className="space-y-3">
              <p className="text-[11px] text-slate-500 dark:text-stone-400">
                Somente os membros marcados recebem notificações automáticas de alerta desta estufa.
              </p>
              <ul className="max-h-64 space-y-1 overflow-y-auto pr-1">
                {teamMembers.length > 0 ? (
                  teamMembers.map((member) => {
                    const checked = draftResponsibleIds.includes(member.id);
                    return (
                      <li key={member.id}>
                        <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-stone-200 bg-white dark:border-stone-800/60 dark:bg-stone-900/35 px-3 py-2.5 text-xs text-slate-700 dark:text-stone-300 hover:border-red-300 transition">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => handleToggleResponsible(member.id, e.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded border border-stone-400 bg-white dark:bg-stone-800/50 text-red-600 focus:ring-red-400"
                          />
                          <span>
                            <span className="block font-semibold text-slate-800 dark:text-stone-100">{member.fullName}</span>
                            <span className="block text-[11px] text-slate-500 dark:text-stone-400">{member.email}</span>
                            <span className="block text-[10px] uppercase tracking-wide text-slate-400 dark:text-stone-500 mt-0.5">{member.role}</span>
                          </span>
                        </label>
                      </li>
                    );
                  })
                ) : (
                  <li className="rounded-xl border border-dashed border-stone-300 dark:border-stone-700/40 bg-stone-50 dark:bg-stone-800/40 p-4 text-center text-[11px] text-slate-500 dark:text-stone-400">
                    Nenhum colaborador na organização disponível para delegação.
                  </li>
                )}
              </ul>

              {menuFeedback && (
                <div className={`rounded border px-3 py-2 text-xs ${
                  menuFeedback.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-rose-200 bg-rose-50 text-rose-700'
                }`}>
                  {menuFeedback.text}
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-stone-200 pt-3">
                <Button variant="secondary" type="button" onClick={() => setTeamModalOpen(false)}>Cancelar</Button>
                <Button type="button" onClick={handleSaveTeam} disabled={teamSaving}>
                  {teamSaving ? 'Salvando...' : 'Salvar equipe'}
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2 overflow-x-auto rounded-2xl border border-stone-300 bg-white dark:border-stone-800/60 dark:bg-stone-900/35 p-2">
        {[
          { id: 'comando', label: 'Centro de Comando', icon: 'fa-gauge-high' },
          { id: 'operacao', label: 'Operação', icon: null },
          { id: 'monitoramento', label: 'Monitoramento', icon: null },
          { id: 'dispositivos', label: 'Dispositivos', icon: null },
          { id: 'controles', label: 'Controles', icon: null },
          { id: 'guia', label: 'Guia rápido', icon: null }
        ].map((topic) => (
          <button
            key={topic.id}
            type="button"
            onClick={() => setActiveTopic(topic.id)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              activeTopic === topic.id
                ? 'bg-red-600 text-white'
                : 'border border-stone-300 bg-white dark:bg-stone-900/35 text-slate-700 dark:text-stone-300 hover:border-red-300 hover:text-red-700'
            }`}
          >
            {topic.icon && <i className={`fa-solid ${topic.icon} text-[10px]`} />}
            {topic.label}
          </button>
        ))}
      </div>

      {/* ── Centro de Comando ──────────────────────────────────────────────── */}
      {activeTopic === 'comando' ? (
        <CentroComando
          estufaId={greenhouse.id}
          isReader={readOnly}
        />
      ) : null}

      {activeTopic === 'monitoramento' ? (
        <MonitoramentoTab
          estufaId={greenhouse.id}
          telemetry={telemetry}
          profile={normalizeProfile(profiles.find((p) => p.id === greenhouse.flowerProfileId) ?? null)}
          externalWeather={externalWeather}
        />
      ) : null}

      {activeTopic === 'guia' ? (
      <article className="mt-6 rounded-2xl border border-stone-300 bg-white dark:border-stone-800/60 dark:bg-stone-900/35 p-5 text-sm text-slate-700">
        <h3 className="text-base font-semibold text-slate-800 dark:text-stone-100">Como ler essas informações</h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-stone-400">
          Este guia rápido ajuda a entender para que serve cada opção no cultivo diário.
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded border border-stone-200 bg-white dark:bg-stone-800 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-stone-300">Temperatura</p>
            <p className="mt-1 text-xs text-slate-600 dark:text-stone-400">Mostra se o ambiente está quente ou frio para o cultivo.</p>
          </div>
          <div className="rounded border border-stone-200 bg-white dark:bg-stone-800 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-stone-300">Umidade do ambiente</p>
            <p className="mt-1 text-xs text-slate-600 dark:text-stone-400">Ajuda a manter o ar no ponto certo para o crescimento.</p>
          </div>
          <div className="rounded border border-stone-200 bg-white dark:bg-stone-800 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-stone-300">Umidade do solo/substrato</p>
            <p className="mt-1 text-xs text-slate-600 dark:text-stone-400">Indica se precisa molhar mais ou menos o meio de cultivo.</p>
          </div>
          <div className="rounded border border-stone-200 bg-white dark:bg-stone-800 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-stone-300">Luminosidade</p>
            <p className="mt-1 text-xs text-slate-600 dark:text-stone-400">Nível de luz medido em lux. Cogumelos precisam de pouca luz — excesso prejudica o crescimento.</p>
          </div>
          <div className="rounded border border-stone-200 bg-white dark:bg-stone-800 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-stone-300">Perfil de cultivo</p>
            <p className="mt-1 text-xs text-slate-600 dark:text-stone-400">É a meta que a estufa deve seguir para esse tipo de cultivo.</p>
          </div>
          <div className="rounded border border-stone-200 bg-white dark:bg-stone-800 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-stone-300">Equipe responsável</p>
            <p className="mt-1 text-xs text-slate-600 dark:text-stone-400">As pessoas marcadas aqui recebem aviso quando algo sair do esperado.</p>
          </div>
        </div>
      </article>
      ) : null}

      {activeTopic === 'operacao' ? (
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <article className="rounded-2xl border border-stone-300 bg-white dark:border-stone-800/60 dark:bg-stone-900/35 p-5 text-sm text-slate-700">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-slate-800 dark:text-stone-100">Meta do cultivo</h3>
            <Link
              to="/dashboard/presets"
              className="inline-flex items-center justify-center rounded-md border border-stone-300 dark:border-stone-600 dark:text-stone-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-red-400 hover:text-red-700"
            >
              Ver perfis
            </Link>
          </div>
          {currentProfile ? (
            <>
              <p className="mt-1 text-xs text-slate-500 dark:text-stone-400">{currentProfile.summary}</p>
              <dl className="mt-3 grid gap-3 text-xs text-slate-700 dark:text-stone-300 grid-cols-2 sm:grid-cols-4">
                <div className="rounded border border-stone-200 bg-white dark:bg-stone-800 p-3">
                  <dt className="text-[11px] uppercase tracking-widest text-slate-500 dark:text-stone-400">Temperatura</dt>
                  <dd>
                    {currentProfile.temperature?.min ?? '—'}°C — {currentProfile.temperature?.max ?? '—'}°C
                  </dd>
                </div>
                <div className="rounded border border-stone-200 bg-white dark:bg-stone-800 p-3">
                  <dt className="text-[11px] uppercase tracking-widest text-slate-500 dark:text-stone-400">Umidade do ambiente</dt>
                  <dd>
                    {currentProfile.humidity?.min ?? '—'}% — {currentProfile.humidity?.max ?? '—'}%
                  </dd>
                </div>
                <div className="rounded border border-stone-200 bg-white dark:bg-stone-800 p-3">
                  <dt className="text-[11px] uppercase tracking-widest text-slate-500 dark:text-stone-400">Umidade do solo</dt>
                  <dd>
                    {currentProfile.soilMoisture?.min ?? '—'}% — {currentProfile.soilMoisture?.max ?? '—'}%
                  </dd>
                </div>
                <div className="rounded border border-stone-200 bg-white dark:bg-stone-800 p-3">
                  <dt className="text-[11px] uppercase tracking-widest text-slate-500 dark:text-stone-400">Luminosidade</dt>
                  <dd>
                    {currentProfile.luminosity?.min ?? '—'} lux — {currentProfile.luminosity?.max ?? '—'} lux
                  </dd>
                </div>
              </dl>
            </>
          ) : (
            <p className="mt-2 text-xs text-slate-500 dark:text-stone-400">
              Clique em Editar estufa e escolha um perfil de cultivo para ativar os limites ideais.
            </p>
          )}
          <div className="mt-3 rounded-xl border border-stone-200 bg-white dark:bg-stone-800 p-3">
            <h4 className="text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-stone-400">Equipe responsável</h4>
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
                <li className="rounded-full border border-stone-200 bg-white dark:border-stone-800/60 dark:bg-stone-900/35 px-2.5 py-0.5 text-[11px] text-slate-500 dark:text-stone-400">
                  Administrador ainda não definiu equipe para esta estufa.
                </li>
              )}
            </ul>
            {!readOnly ? (
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-[10px] text-slate-500 dark:text-stone-400">
                  Adicione ou remova membros para receber o alerta de notificação.
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  className="h-8 shrink-0 px-3 text-[11px]"
                  onClick={() => setTeamModalOpen(true)}
                >
                  Gerenciar equipe
                </Button>
              </div>
            ) : (
              <p className="mt-2 text-[10px] text-slate-500 dark:text-stone-400">
                Perfil Leitor: somente visualização da equipe delegada.
              </p>
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-stone-300 bg-white dark:border-stone-800/60 dark:bg-stone-900/35 p-5">
          <h3 className="text-base font-semibold text-slate-800 dark:text-stone-100">Próximos passos</h3>
          {resolvedEvaluation.status === 'pending' ? (
            <p className="mt-2 text-xs text-slate-500 dark:text-stone-400">
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
                <p className="mt-1 text-[11px] text-slate-500 dark:text-stone-400">
                  Esta avaliação é parcial. Nesta fase de implantação, o sistema analisa principalmente o clima da cidade e apenas os sensores que já estão ativos na estufa.
                </p>
              ) : null}
              <div className="mt-3 grid gap-3 text-xs text-slate-700 dark:text-stone-300 grid-cols-2 sm:grid-cols-4">
                {['temperature', 'humidity', 'soilMoisture', 'luminosity'].map((metricKey) => {
                  const metric = resolvedEvaluation.metrics[metricKey] ?? {};
                  const labelMap = {
                    temperature: 'Temperatura',
                    humidity: 'Umidade do ar',
                    soilMoisture: 'Umidade do solo',
                    luminosity: 'Luminosidade'
                  };
                  const unitMap = {
                    temperature: '°C',
                    humidity: '%',
                    soilMoisture: '%',
                    luminosity: ' lux'
                  };
                  const sourceLabel =
                    resolvedEvaluation.metricSources?.[metricKey] === 'external'
                      ? 'Clima da cidade'
                      : resolvedEvaluation.metricSources?.[metricKey] === 'internal'
                        ? 'Sensor interno'
                        : 'Não informado';
                  const className = metric.evaluated === false
                    ? 'border-stone-200 bg-stone-100 dark:border-stone-700/40 dark:bg-stone-700/30 dark:text-stone-400 text-slate-600'
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
          <div className="mt-3 rounded-xl border border-stone-200 bg-white dark:bg-stone-800 p-3">
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
              <p className="text-[10px] text-slate-500 dark:text-stone-400">
                {readOnly ? 'Perfil Leitor não executa ações.' : 'Para evitar repetição, um novo aviso sai só após 15 min.'}
              </p>
            </div>
            <p className="mt-2 text-[10px] text-slate-500 dark:text-stone-400">
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
                    ? 'border-stone-300 bg-stone-100 dark:border-stone-700/40 dark:bg-stone-700/30 dark:text-stone-400 text-slate-600'
                    : 'border-rose-200 bg-rose-50 text-rose-700'
              }`}
            >
              {notifyFeedback.text}
            </p>
          ) : null}
        </article>
        {!readOnly ? (
          <article className="col-span-full mt-4 rounded-2xl border border-stone-300 bg-white dark:border-stone-800/60 dark:bg-stone-900/35 p-5 text-sm text-slate-700">
            <h3 className="text-base font-semibold text-slate-800 dark:text-stone-100">Faixas de alerta personalizadas</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-stone-400">
              Defina o mínimo e o máximo de cada parâmetro. O sistema usa esses valores para gerar avaliações e notificações automáticas.
            </p>
            <div className="mt-4 grid gap-4 grid-cols-2 sm:grid-cols-4">
              {[
                { key: 'temperatura', label: 'Temperatura', unit: '°C' },
                { key: 'umidade', label: 'Umidade do ar', unit: '%' },
                { key: 'umidade_solo', label: 'Umidade do solo', unit: '%' },
                { key: 'luminosidade', label: 'Luminosidade', unit: 'lux' }
              ].map(({ key, label, unit }) => (
                <div key={key} className="rounded-xl border border-stone-200 bg-white dark:bg-stone-800 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-red-700">{label}</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 dark:text-stone-400">Mínimo</label>
                      <input
                        type="number"
                        value={thresholdDraft[key]?.min ?? ''}
                        onChange={(event) => setThresholdDraft((prev) => ({
                          ...prev,
                          [key]: { ...prev[key], min: event.target.value === '' ? undefined : Number(event.target.value) }
                        }))}
                        className="mt-0.5 w-full rounded border border-stone-300 bg-white dark:bg-stone-800 px-2 py-1.5 text-sm text-slate-800 dark:text-stone-100 outline-none focus:border-red-400"
                        placeholder={`min ${unit}`}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 dark:text-stone-400">Máximo</label>
                      <input
                        type="number"
                        value={thresholdDraft[key]?.max ?? ''}
                        onChange={(event) => setThresholdDraft((prev) => ({
                          ...prev,
                          [key]: { ...prev[key], max: event.target.value === '' ? undefined : Number(event.target.value) }
                        }))}
                        className="mt-0.5 w-full rounded border border-stone-300 bg-white dark:bg-stone-800 px-2 py-1.5 text-sm text-slate-800 dark:text-stone-100 outline-none focus:border-red-400"
                        placeholder={`max ${unit}`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-4">
              <button
                type="button"
                disabled={thresholdSaving}
                onClick={async () => {
                  if (!onUpdateAlertThresholds) return;
                  setThresholdSaving(true);
                  setThresholdFeedback(null);
                  try {
                    await onUpdateAlertThresholds(greenhouse.id, thresholdDraft);
                    setThresholdFeedback({ type: 'success', text: 'Faixas salvas com sucesso.' });
                  } catch (_err) {
                    setThresholdFeedback({ type: 'error', text: 'Não foi possível salvar as faixas.' });
                  } finally {
                    setThresholdSaving(false);
                  }
                }}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {thresholdSaving ? 'Salvando...' : 'Salvar faixas'}
              </button>
              {thresholdFeedback ? (
                <p className={`text-xs ${thresholdFeedback.type === 'success' ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {thresholdFeedback.text}
                </p>
              ) : null}
            </div>
          </article>
        ) : null}
      </div>
      ) : null}

      {/* aba dispositivos */}
      {activeTopic === 'dispositivos' ? (
      <div className="mt-6 flex flex-col gap-4">

        {/* cabeçalho com botão de adicionar */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-stone-100">Dispositivos cadastrados</p>
            <p className="text-xs text-slate-500 dark:text-stone-400 mt-0.5">Sensores e atuadores vinculados a esta estufa.</p>
          </div>
          {!readOnly && (
            <button
              type="button"
              onClick={() => setShowDeviceWizard(true)}
              className="flex items-center gap-1.5 rounded-md border border-stone-300 dark:border-stone-600 dark:text-stone-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-red-400 hover:text-red-700"
            >
              <i className="fa-solid fa-plus" /> Adicionar dispositivo
            </button>
          )}
        </div>

        {/* instruções e ID da estufa — fixo, sempre visível */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 flex flex-col gap-2">
          <p className="text-xs font-semibold text-blue-800">Como conectar seu ESP32 a esta estufa</p>
          <ol className="text-[11px] text-blue-700 list-decimal list-inside space-y-1">
            <li>Clique em <strong>+ Adicionar dispositivo</strong>, preencha nome e tipo e salve.</li>
            <li>O sistema cria o dispositivo no Azure IoT Hub automaticamente e exibe as credenciais.</li>
            <li>Copie os 4 valores exibidos para o <strong>boot.py</strong> do ESP32 — incluindo o ID da estufa abaixo.</li>
          </ol>
          <div className="mt-1 flex items-center gap-2 rounded-lg border border-blue-200 bg-white dark:border-stone-700/40 dark:bg-stone-800/40 px-3 py-2">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-stone-500">ID desta estufa (ESTUFA_ID)</p>
              <p className="text-xs font-mono text-slate-700 dark:text-stone-400 mt-0.5 truncate">{greenhouse.id}</p>
            </div>
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(greenhouse.id)}
              className="shrink-0 rounded border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              Copiar
            </button>
          </div>
        </div>

        {/* lista de dispositivos */}
        {devicesLoading ? (
          <p className="text-sm text-slate-500 dark:text-stone-400 py-4">Carregando dispositivos...</p>
        ) : devices.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white dark:border-stone-700/40 dark:bg-stone-800/40 p-8 text-center">
            <p className="text-sm text-slate-600 dark:text-stone-400">Nenhum dispositivo cadastrado nesta estufa.</p>
            <p className="mt-1 text-xs text-slate-400 dark:text-stone-500">Adicione um dispositivo para começar o monitoramento.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {devices.map((device) => (
              <div key={device.id} className="rounded-2xl border border-stone-300 bg-white dark:border-stone-800/60 dark:bg-stone-900/35 p-4 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-stone-100">{device.name}</p>
                    <p className="text-xs text-slate-500 dark:text-stone-400 mt-0.5">
                      {DEVICE_TYPE_LABELS[device.type] ?? device.type}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                    device.active
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-stone-100 text-stone-500 border-stone-200'
                  }`}>
                    {device.active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                {/* identificador do dispositivo (serial / nome do ESP32) */}
                <p className="text-[11px] text-slate-400 dark:text-stone-500 font-mono truncate">{device.identifier}</p>

                {/* status do registro no Azure IoT Hub */}
                {device.iothubDeviceId ? (
                  <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2">
                    <p className="text-[10px] font-semibold text-emerald-700">Registrado no IoT Hub</p>
                    <p className="text-[10px] text-emerald-600 font-mono truncate mt-0.5">{device.iothubDeviceId}</p>
                  </div>
                ) : (
                  <div className="rounded border border-dashed border-stone-200 dark:border-stone-700/40 bg-stone-50 dark:bg-stone-800/40 px-3 py-2">
                    <p className="text-[10px] text-slate-400 dark:text-stone-500">Aguardando registro no IoT Hub</p>
                  </div>
                )}

                {!readOnly && (
                  <div className="flex gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => onToggleDevice?.(greenhouse.id, device.id, !device.active)}
                      className="flex-1 rounded border border-stone-300 dark:border-stone-700/40 dark:text-stone-300 dark:bg-stone-800/40 py-1.5 text-[11px] font-medium text-slate-600 transition hover:border-red-300 hover:text-red-700"
                    >
                      {device.active ? 'Desativar' : 'Ativar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteDevice?.(greenhouse.id, device.id)}
                      className="rounded border border-stone-200 dark:border-stone-700/40 px-3 py-1.5 text-[11px] text-slate-400 transition hover:border-rose-300 hover:text-rose-600"
                    >
                      Remover
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* nota sobre o que já funciona e o que ainda depende de ESP32 físico */}
        <p className="text-xs text-slate-400 dark:text-stone-500">
          O registro do dispositivo no Azure IoT Hub já está funcionando. A leitura de telemetria em tempo real requer um ESP32 físico conectado.
        </p>
      </div>
      ) : null}

      {/* aba controles — painel de comando Lâmpada e Nebulizador */}
      {activeTopic === 'controles' ? (
        <ControlesPanel
          greenhouse={greenhouse}
          devices={devices}
          devicesLoading={devicesLoading}
          telemetry={telemetry}
          readOnly={readOnly}
        />
      ) : null}

      {/* Wizard de onboarding do dispositivo ESP32 */}
      {showDeviceWizard && (
        <WizardOnboardingDispositivo
          estufaId={greenhouse.id}
          onClose={() => setShowDeviceWizard(false)}
          onSuccess={() => {
            setShowDeviceWizard(false);
            if (onCreateDevice) onCreateDevice();
          }}
        />
      )}
    </section>
  );
};

// rótulos legíveis para os tipos de dispositivo cadastrados
const DEVICE_TYPE_LABELS = {
  'sensor-temperatura':   'Sensor de temperatura',
  'sensor-umidade':       'Sensor de umidade do ar',
  'sensor-solo':          'Sensor de umidade do solo',
  'sensor-luminosidade':  'Sensor de luminosidade',
  'atuador-lampada':      'Atuador — Lâmpada',
  'atuador-nebulizador':  'Atuador — Nebulizador',
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

  // dispositivos da estufa selecionada
  const [devicesById, setDevicesById] = useState({});
  const [devicesLoadingById, setDevicesLoadingById] = useState({});

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

  // carrega os dispositivos sempre que a estufa selecionada muda
  useEffect(() => {
    if (!selectedGreenhouse?.id) {
      return;
    }

    const id = selectedGreenhouse.id;
    setDevicesLoadingById((prev) => ({ ...prev, [id]: true }));

    listDevices(id)
      .then(({ devices }) => {
        setDevicesById((prev) => ({ ...prev, [id]: devices }));
      })
      .catch(() => {
        setDevicesById((prev) => ({ ...prev, [id]: [] }));
      })
      .finally(() => {
        setDevicesLoadingById((prev) => ({ ...prev, [id]: false }));
      });
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

  // adiciona o dispositivo no banco e atualiza o estado local
  const handleCreateDevice = useCallback(async (estufaId, payload) => {
    const { device } = await createDevice(estufaId, payload);
    setDevicesById((prev) => ({
      ...prev,
      [estufaId]: [...(prev[estufaId] ?? []), device],
    }));
    return device;
  }, []);

  // remove o dispositivo do banco e do estado local
  const handleDeleteDevice = useCallback(async (estufaId, deviceId) => {
    await deleteDevice(estufaId, deviceId);
    setDevicesById((prev) => ({
      ...prev,
      [estufaId]: (prev[estufaId] ?? []).filter((d) => d.id !== deviceId),
    }));
  }, []);

  // ativa ou desativa o dispositivo e reflete no estado local
  const handleToggleDevice = useCallback(async (estufaId, deviceId, active) => {
    const { device } = await updateDevice(estufaId, deviceId, { active });
    setDevicesById((prev) => ({
      ...prev,
      [estufaId]: (prev[estufaId] ?? []).map((d) => (d.id === deviceId ? device : d)),
    }));
  }, []);

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

  const handleUpdateAlertThresholds = useCallback(async (greenhouseId, thresholds) => {
    const response = await updateAlertThresholds(greenhouseId, thresholds);
    const updated = response?.greenhouse ?? response;
    if (updated) {
      setGreenhouses((prev) =>
        prev.map((greenhouse) => (greenhouse.id === greenhouseId ? { ...greenhouse, ...updated } : greenhouse))
      );
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


  if (requiresPasswordReset) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-16 text-slate-800 dark:text-stone-100">
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
    <>
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-stone-300 bg-white dark:border-stone-800/60 dark:bg-stone-900/35 p-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-red-700">Detalhes da estufa</span>
          <h1 className="text-3xl font-semibold text-slate-800 dark:text-stone-100">
            {selectedGreenhouse?.name ?? 'Carregando estufa'}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-stone-400">
            Aqui você acompanha os dados da estufa selecionada. Para trocar de estufa, volte para a lista.
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center rounded-md border border-stone-300 bg-white dark:border-stone-800/60 dark:bg-stone-900/35 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-stone-300 transition hover:border-red-400 hover:text-red-700"
          >
            Voltar para estufas
          </Link>
          <Link
            to="/settings"
            className="inline-flex items-center justify-center rounded-md border border-stone-300 bg-white dark:border-stone-800/60 dark:bg-stone-900/35 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-stone-300 transition hover:border-red-400 hover:text-red-700"
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
              className="h-64 animate-pulse rounded-xl border border-stone-300 bg-stone-100 dark:border-stone-700/40 dark:bg-stone-800/30"
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
            saving={savingById[selectedGreenhouse.id]}
            teamSaving={teamSavingById[selectedGreenhouse.id]}
            alertsSaving={alertsSavingById[selectedGreenhouse.id]}
            notifyBusy={notifyBusyById[selectedGreenhouse.id]}
            externalWeather={externalWeatherById[selectedGreenhouse.id]}
            externalWeatherLoading={externalWeatherLoadingById[selectedGreenhouse.id]}
            onSave={(payload) => handleSaveGreenhouse(selectedGreenhouse.id, payload)}
            onUpdateTeam={(ids) => handleUpdateTeam(selectedGreenhouse.id, ids)}
            onToggleAlerts={(enabled) => handleToggleAlerts(selectedGreenhouse.id, enabled)}
            onNotify={() => handleNotifyTeam(selectedGreenhouse.id)}
            onDeleteRequest={() => setDeleteTarget({ id: selectedGreenhouse.id, name: selectedGreenhouse.name })}
            onUpdateAlertThresholds={(t) => handleUpdateAlertThresholds(selectedGreenhouse.id, t)}
            devices={devicesById[selectedGreenhouse.id] ?? []}
            devicesLoading={devicesLoadingById[selectedGreenhouse.id] ?? false}
            onCreateDevice={(payload) => handleCreateDevice(selectedGreenhouse.id, payload)}
            onDeleteDevice={(deviceId) => handleDeleteDevice(selectedGreenhouse.id, deviceId)}
            onToggleDevice={(deviceId, active) => handleToggleDevice(selectedGreenhouse.id, deviceId, active)}
            readOnly={isReader}
          />
        </div>
      ) : null}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Remover estufa"
        description={deleteTarget ? `Remover a estufa "${deleteTarget.name}"? Esta acao nao podera ser desfeita.` : ''}
        onConfirm={async () => {
          if (!deleteTarget) return;
          setDeleteBusy(true);
          try {
            await deleteGreenhouse(deleteTarget.id);
            setGreenhouses((prev) => prev.filter((g) => g.id !== deleteTarget.id));
            setDeleteTarget(null);
            navigate('/dashboard');
          } catch {
            setError('Nao foi possivel remover a estufa.');
          } finally {
            setDeleteBusy(false);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
        confirmLabel={deleteBusy ? 'Removendo...' : 'Remover'}
        cancelLabel="Cancelar"
      />
    </>
  );
};
