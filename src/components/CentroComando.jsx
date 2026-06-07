/**
 * CentroComando — Cockpit operacional da estufa.
 *
 * Exibe o health score, itens criticos, aderencia ao preset, estado da
 * automacao, timeline de eventos e quick actions em um layout orientado
 * a decisao rapida.
 *
 * Props:
 *   estufaId  {string}  — ID da estufa
 *   isReader  {boolean} — se true, oculta acoes destrutivas
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getCommandCenter,
  retomarAutomacao,
  suspenderAutomacao,
  trocarFase,
} from '../api/commandCenterService.js';

// ── Constantes ────────────────────────────────────────────────────────────────

const PHASE_LABELS = {
  incubacao:    { label: 'Incubação',    icon: 'fa-seedling',    color: 'text-lime-400',    bg: 'bg-lime-500/10',    border: 'border-lime-500/30' },
  frutificacao: { label: 'Frutificação', icon: 'fa-leaf',        color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  colheita:     { label: 'Colheita',     icon: 'fa-basket-shopping', color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/30' },
};

const STATUS_CFG = {
  ok:        { label: 'Saudável',   color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', dot: 'bg-emerald-400' },
  attention: { label: 'Atenção',    color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   dot: 'bg-amber-400' },
  risk:      { label: 'Risco',      color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/30',     dot: 'bg-red-400' },
};

const SEVERITY_CFG = {
  critical: { color: 'text-red-400',   bg: 'bg-red-500/10',   border: 'border-red-500/30',   icon: 'fa-circle-exclamation' },
  warning:  { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: 'fa-triangle-exclamation' },
  info:     { color: 'text-blue-400',  bg: 'bg-blue-500/10',  border: 'border-blue-500/30',  icon: 'fa-circle-info' },
};

const DIRECTION_CFG = {
  low:  { icon: 'fa-arrow-down', color: 'text-blue-400' },
  high: { icon: 'fa-arrow-up',   color: 'text-red-400' },
  'in-range': { icon: 'fa-check', color: 'text-emerald-400' },
};

const EVENT_COLOR_MAP = {
  red:   'text-red-400   bg-red-500/10   border-red-500/30',
  amber: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  blue:  'text-blue-400  bg-blue-500/10  border-blue-500/30',
  green: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  stone: 'text-stone-400 bg-stone-800/40 border-stone-700/40',
};

// ── Sub-componentes ───────────────────────────────────────────────────────────

function HealthScoreGauge({ score, status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.attention;
  const clamp = Math.min(100, Math.max(0, score || 0));
  // arco SVG (270 graus de abertura, origem no topo)
  const r = 44;
  const circ = 2 * Math.PI * r;
  const arc = circ * 0.75;
  const fill = (clamp / 100) * arc;

  return (
    <div className="flex flex-col items-center">
      <svg width="120" height="120" viewBox="0 0 120 120">
        {/* trilha */}
        <circle
          cx="60" cy="60" r={r}
          fill="none"
          stroke="#292524"
          strokeWidth="10"
          strokeDasharray={`${arc} ${circ - arc}`}
          strokeDashoffset={circ * 0.125}
          strokeLinecap="round"
          transform="rotate(135 60 60)"
        />
        {/* progresso */}
        <circle
          cx="60" cy="60" r={r}
          fill="none"
          stroke={clamp >= 80 ? '#34d399' : clamp >= 55 ? '#fbbf24' : '#f87171'}
          strokeWidth="10"
          strokeDasharray={`${fill} ${arc - fill + (circ - arc)}`}
          strokeDashoffset={circ * 0.125}
          strokeLinecap="round"
          transform="rotate(135 60 60)"
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
        <text x="60" y="56" textAnchor="middle" fontSize="22" fontWeight="700" fill="white">
          {clamp}
        </text>
        <text x="60" y="70" textAnchor="middle" fontSize="9" fill="#78716c">
          SCORE
        </text>
      </svg>
      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${cfg.bg} ${cfg.border} ${cfg.color} mt-1`}>
        <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
        {cfg.label}
      </span>
    </div>
  );
}

function AdherenceBar({ item }) {
  const isOk = item.status === 'ok';
  const noData = item.status === 'no-data' || item.status === 'no-preset';
  const dir = DIRECTION_CFG[item.direction] || DIRECTION_CFG['in-range'];

  // calcula posicao do valor dentro da faixa para a barra
  let pct = 50;
  if (!noData && item.rangeMin != null && item.rangeMax != null && item.value != null) {
    const span = item.rangeMax - item.rangeMin || 1;
    pct = Math.min(100, Math.max(0, ((item.value - item.rangeMin) / span) * 100));
  }

  return (
    <div className={`rounded-xl border p-3 transition-all ${
      noData ? 'border-stone-800/40 bg-stone-900/20 opacity-60' :
      isOk   ? 'border-stone-800/50 bg-stone-900/30' :
      item.status === 'warning' ? 'border-amber-500/25 bg-amber-500/5' :
      'border-red-500/30 bg-red-500/5'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-stone-500">
          {item.label}
        </span>
        {noData ? (
          <span className="text-[10px] text-stone-600">sem dados</span>
        ) : (
          <div className="flex items-center gap-1.5">
            <i className={`fa-solid ${dir.icon} text-[10px] ${dir.color}`} />
            <span className={`text-[10px] font-semibold ${isOk ? 'text-emerald-400' : item.status === 'warning' ? 'text-amber-400' : 'text-red-400'}`}>
              {isOk ? 'OK' : item.direction === 'low' ? 'Abaixo' : 'Acima'}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-1.5 mb-2">
        <span className="text-xl font-bold text-stone-100">
          {item.value != null ? item.value.toFixed(item.value % 1 === 0 ? 0 : 1) : '--'}
        </span>
        <span className="text-xs text-stone-500">{item.unit}</span>
        {item.rangeMin != null && (
          <span className="text-[10px] text-stone-600 ml-auto">
            ideal: {item.rangeMin}-{item.rangeMax} {item.unit}
          </span>
        )}
      </div>

      {/* barra de posicao */}
      {!noData && item.rangeMin != null && (
        <div className="relative h-1.5 rounded-full bg-stone-800/60">
          {/* zona ideal */}
          <div className="absolute inset-y-0 left-0 right-0 rounded-full bg-emerald-500/15" />
          {/* cursor */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-stone-900 ${
              isOk ? 'bg-emerald-400' : item.status === 'warning' ? 'bg-amber-400' : 'bg-red-400'
            }`}
            style={{ left: `${pct}%`, transition: 'left 0.5s ease' }}
          />
        </div>
      )}
    </div>
  );
}

function CriticalItem({ item }) {
  const cfg = SEVERITY_CFG[item.severity] || SEVERITY_CFG.info;
  return (
    <div className={`flex items-start gap-3 rounded-xl border p-3.5 ${cfg.bg} ${cfg.border}`}>
      <i className={`fa-solid ${cfg.icon} text-sm mt-0.5 flex-shrink-0 ${cfg.color}`} />
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold ${cfg.color}`}>{item.label}</p>
        <p className="text-xs text-stone-400 mt-0.5">{item.cause}</p>
        <p className="text-xs text-stone-300 mt-1.5 font-medium">
          <i className="fa-solid fa-arrow-right text-[9px] mr-1" />
          {item.suggestedAction}
        </p>
      </div>
    </div>
  );
}

function TimelineEvent({ event }) {
  const colorCls = EVENT_COLOR_MAP[event.color] || EVENT_COLOR_MAP.stone;
  const [textColor, bgColor, borderColor] = colorCls.split(' ');
  const ts = event.timestamp ? new Date(event.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--';

  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-stone-800/40 last:border-0">
      <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border text-[11px] ${bgColor} ${borderColor}`}>
        <i className={`fa-solid ${event.icon} ${textColor}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-stone-200 leading-tight">{event.title}</p>
        <p className="text-[10px] text-stone-500 mt-0.5 line-clamp-1">{event.description}</p>
      </div>
      <span className="text-[9px] text-stone-600 flex-shrink-0">{ts}</span>
    </div>
  );
}

// ── Modal de troca de fase ─────────────────────────────────────────────────────

function PhaseModal({ currentPhase, onConfirm, onClose }) {
  const [selectedPhase, setSelectedPhase] = useState(currentPhase);
  const [motivo, setMotivo] = useState('');

  const phases = ['incubacao', 'frutificacao', 'colheita'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-stone-800/60 bg-[#1a1614] p-6 shadow-2xl">
        <h3 className="text-base font-semibold text-stone-100 mb-4">Trocar fase biológica</h3>
        <div className="space-y-2 mb-4">
          {phases.map((phase) => {
            const cfg = PHASE_LABELS[phase];
            const isSelected = selectedPhase === phase;
            return (
              <button
                key={phase}
                type="button"
                onClick={() => setSelectedPhase(phase)}
                className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                  isSelected
                    ? `${cfg.bg} ${cfg.border} ${cfg.color}`
                    : 'border-stone-800/50 bg-stone-900/30 text-stone-400 hover:border-stone-700/60'
                }`}
              >
                <i className={`fa-solid ${cfg.icon} text-sm`} />
                <span className="text-sm font-medium">{cfg.label}</span>
                {isSelected && <i className="fa-solid fa-check text-xs ml-auto" />}
              </button>
            );
          })}
        </div>
        <textarea
          className="w-full resize-none rounded-xl border border-stone-700/60 bg-stone-800/50 px-3 py-2.5 text-sm text-stone-100 placeholder:text-stone-600 outline-none focus:border-red-500/60 mb-4"
          rows={2}
          placeholder="Motivo da troca (opcional)"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
        />
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-stone-700/60 py-2.5 text-sm text-stone-400 hover:text-stone-200 transition">
            Cancelar
          </button>
          <button
            type="button"
            disabled={selectedPhase === currentPhase}
            onClick={() => onConfirm(selectedPhase, motivo || null)}
            className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-500 transition disabled:opacity-40"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export const CentroComando = ({ estufaId, isReader = false }) => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [actionFeedback, setActionFeedback] = useState(null);
  const [phaseModalOpen, setPhaseModalOpen] = useState(false);

  const load = useCallback(async () => {
    if (!estufaId) return;
    setLoading(true);
    setError(null);
    try {
      const dto = await getCommandCenter(estufaId);
      setData(dto);
    } catch (err) {
      setError('Não foi possível carregar o Centro de Comando. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [estufaId]);

  useEffect(() => { load(); }, [load]);

  const showFeedback = (msg, isError = false) => {
    setActionFeedback({ msg, isError });
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleToggleAutomation = async () => {
    if (isReader || !data) return;
    const isManual = data.operationMode === 'manual';
    setActionLoading('automation');
    try {
      if (isManual) {
        await retomarAutomacao(estufaId);
        showFeedback('Automacao retomada com sucesso.');
      } else {
        await suspenderAutomacao(estufaId, 60);
        showFeedback('Automacao suspensa por 60 minutos.');
      }
      await load();
    } catch {
      showFeedback('Erro ao alterar modo de operação.', true);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePhaseConfirm = async (fase, motivo) => {
    setPhaseModalOpen(false);
    setActionLoading('phase');
    try {
      await trocarFase(estufaId, fase, motivo);
      showFeedback(`Fase alterada para: ${PHASE_LABELS[fase]?.label || fase}.`);
      await load();
    } catch (err) {
      showFeedback(err?.response?.data?.message || 'Erro ao trocar fase.', true);
    } finally {
      setActionLoading(null);
    }
  };

  // ── Loading state ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="mt-5 space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl border border-stone-800/40 bg-stone-900/20" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-5 flex flex-col items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
        <i className="fa-solid fa-triangle-exclamation text-2xl text-red-400" />
        <p className="text-sm text-red-300">{error}</p>
        <button type="button" onClick={load} className="rounded-xl bg-red-600/20 border border-red-500/30 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-600/30 transition">
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!data) return null;

  const statusCfg = STATUS_CFG[data.status] || STATUS_CFG.attention;
  const phaseCfg  = PHASE_LABELS[data.phase] || PHASE_LABELS.incubacao;
  const isManual  = data.operationMode === 'manual';

  return (
    <div className="mt-5 space-y-4">

      {/* ── Feedback de acao ──────────────────────────────────────────────── */}
      {actionFeedback && (
        <div className={`rounded-xl border px-4 py-2.5 text-sm font-medium ${actionFeedback.isError ? 'border-red-500/30 bg-red-500/10 text-red-300' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'}`}>
          {actionFeedback.msg}
        </div>
      )}

      {/* ── HERO: Score + Status + Info ───────────────────────────────────── */}
      <div className="rounded-2xl border border-stone-800/60 bg-stone-900/35 p-5">
        <div className="flex flex-col sm:flex-row items-center gap-6">

          {/* gauge */}
          <div className="flex-shrink-0 w-28 sm:w-auto">
            <HealthScoreGauge score={data.healthScore} status={data.status} />
          </div>

          {/* info */}
          <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* fase */}
            <div className={`rounded-xl border p-3 ${phaseCfg.bg} ${phaseCfg.border}`}>
              <p className="text-[9px] font-semibold uppercase tracking-widest text-stone-500 mb-1">Fase</p>
              <div className="flex items-center gap-1.5">
                <i className={`fa-solid ${phaseCfg.icon} text-sm ${phaseCfg.color}`} />
                <span className={`text-sm font-semibold ${phaseCfg.color}`}>{phaseCfg.label}</span>
              </div>
            </div>

            {/* preset */}
            <div className="rounded-xl border border-stone-800/40 bg-stone-800/30 p-3">
              <p className="text-[9px] font-semibold uppercase tracking-widest text-stone-500 mb-1">Preset</p>
              <p className="text-sm font-semibold text-stone-200 truncate">
                {data.presetName || 'Nenhum'}
              </p>
            </div>

            {/* modo */}
            <div className={`rounded-xl border p-3 col-span-2 sm:col-span-1 ${isManual ? 'border-amber-500/30 bg-amber-500/8' : 'border-stone-800/40 bg-stone-800/30'}`}>
              <p className="text-[9px] font-semibold uppercase tracking-widest text-stone-500 mb-1">Modo</p>
              <div className="flex items-center gap-1.5">
                <i className={`fa-solid ${isManual ? 'fa-hand' : 'fa-robot'} text-sm ${isManual ? 'text-amber-400' : 'text-blue-400'}`} />
                <span className={`text-sm font-semibold ${isManual ? 'text-amber-400' : 'text-blue-400'}`}>
                  {isManual ? 'Manual' : 'Automático'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Grid: Atencao Agora + Aderencia ao Preset ─────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-4">

        {/* Atencao Agora */}
        <div className="rounded-2xl border border-stone-800/60 bg-stone-900/35 p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
              <i className="fa-solid fa-bell text-red-400 text-sm" />
            </div>
            <h3 className="text-sm font-semibold text-stone-100">Atenção agora</h3>
            {data.criticalItems?.length > 0 && (
              <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                {data.criticalItems.length}
              </span>
            )}
          </div>

          {data.criticalItems?.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <i className="fa-solid fa-circle-check text-2xl text-emerald-400" />
              <p className="text-sm text-stone-400">Tudo dentro da faixa ideal.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.criticalItems.map((item, i) => (
                <CriticalItem key={i} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Aderencia ao Preset */}
        <div className="rounded-2xl border border-stone-800/60 bg-stone-900/35 p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-lime-500/10">
              <i className="fa-solid fa-leaf text-lime-400 text-sm" />
            </div>
            <h3 className="text-sm font-semibold text-stone-100">Aderência ao preset</h3>
          </div>

          {!data.presetName ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <i className="fa-solid fa-circle-xmark text-xl text-stone-600" />
              <p className="text-sm text-stone-500">Nenhum preset ativo.</p>
              <Link to="/dashboard/presets" className="text-xs text-red-400 hover:underline">
                Configurar preset
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {(data.presetAdherence || []).map((item) => (
                <AdherenceBar key={item.metric} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Grid: Automacao + Timeline ─────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-4">

        {/* Automacao */}
        <div className="rounded-2xl border border-stone-800/60 bg-stone-900/35 p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
              <i className="fa-solid fa-robot text-blue-400 text-sm" />
            </div>
            <h3 className="text-sm font-semibold text-stone-100">Automacao</h3>
            <span className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
              isManual
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
            }`}>
              {isManual ? 'Manual' : 'Automático'}
            </span>
          </div>

          {/* ultima acao */}
          {data.automationState?.last_action ? (
            <div className="rounded-xl border border-stone-800/40 bg-stone-800/30 p-3 mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-600 mb-1">Última ação</p>
              <p className="text-xs text-stone-300">{data.automationState.last_action.reason}</p>
              <p className="text-[10px] text-stone-600 mt-1">
                {data.automationState.last_action.timestamp
                  ? new Date(data.automationState.last_action.timestamp).toLocaleString('pt-BR')
                  : '--'}
              </p>
            </div>
          ) : (
            <p className="text-xs text-stone-500 mb-3">Nenhuma ação registrada ainda.</p>
          )}

          {/* cooldown info */}
          <p className="text-[10px] text-stone-600 mb-3">
            Ciclo de avaliação: 90s | Cooldown: 5min por atuador
          </p>

          {/* botao toggle */}
          {!isReader && (
            <button
              type="button"
              onClick={handleToggleAutomation}
              disabled={actionLoading === 'automation'}
              className={`w-full rounded-xl border py-2.5 text-xs font-semibold transition ${
                isManual
                  ? 'bg-emerald-600/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/20'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
              } disabled:opacity-40`}
            >
              {actionLoading === 'automation' ? (
                <i className="fa-solid fa-spinner fa-spin mr-1.5" />
              ) : (
                <i className={`fa-solid ${isManual ? 'fa-robot' : 'fa-pause'} mr-1.5`} />
              )}
              {isManual ? 'Retomar automação' : 'Suspender por 60 min'}
            </button>
          )}
        </div>

        {/* Timeline de Eventos */}
        <div className="rounded-2xl border border-stone-800/60 bg-stone-900/35 p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10">
              <i className="fa-solid fa-clock-rotate-left text-purple-400 text-sm" />
            </div>
            <h3 className="text-sm font-semibold text-stone-100">Eventos recentes</h3>
          </div>

          {data.recentEvents?.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <i className="fa-solid fa-inbox text-xl text-stone-600" />
              <p className="text-xs text-stone-500">Sem eventos registrados.</p>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-52 pr-1">
              {(data.recentEvents || []).map((event, i) => (
                <TimelineEvent key={i} event={event} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Actions ─────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-stone-800/60 bg-stone-900/35 p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-800/60">
            <i className="fa-solid fa-bolt text-stone-400 text-sm" />
          </div>
          <h3 className="text-sm font-semibold text-stone-100">Ações rápidas</h3>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* trocar fase — sempre disponivel para nao-readers */}
          {!isReader && (
            <button
              type="button"
              onClick={() => setPhaseModalOpen(true)}
              disabled={actionLoading === 'phase'}
              className="inline-flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-xs font-semibold text-purple-400 hover:bg-purple-500/20 transition disabled:opacity-40"
            >
              <i className={`fa-solid ${actionLoading === 'phase' ? 'fa-spinner fa-spin' : 'fa-arrow-right-arrow-left'}`} />
              Trocar fase
            </button>
          )}

          {/* acoes do backend */}
          {(data.quickActions || []).filter((a) => a.route).map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => navigate(action.route)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-700/60 bg-stone-800/40 px-4 py-2 text-xs font-semibold text-stone-300 hover:border-stone-600 hover:text-stone-100 transition"
            >
              <i className={`fa-solid ${action.icon}`} />
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Previsão de curto prazo ───────────────────────────────────────────── */}
      {data.forecastWindow?.risks?.length > 0 && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="flex items-start gap-3">
            <i className="fa-solid fa-chart-line text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-amber-400 mb-1">
                Previsão das próximas {data.forecastWindow.windowHours}h
              </p>
              {data.forecastWindow.risks.map((risk, i) => (
                <p key={i} className="text-xs text-stone-400">{risk.label}: {risk.risk}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal de troca de fase */}
      {phaseModalOpen && (
        <PhaseModal
          currentPhase={data.phase}
          onConfirm={handlePhaseConfirm}
          onClose={() => setPhaseModalOpen(false)}
        />
      )}
    </div>
  );
};

export default CentroComando;
