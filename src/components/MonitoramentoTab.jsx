/**
 * MonitoramentoTab - Dashboard de monitoramento com graficos SVG nativos.
 * Zero dependencias externas. Compativel com qualquer versao do React.
 *
 * Graficos implementados (SVG puro):
 *   1. Linha dupla  - Temperatura + Umidade do ar (historico)
 *   2. Area         - Umidade do substrato vs faixa do preset
 *   3. Barra        - Comparativo dos ultimos 6 pontos
 *
 * Props:
 *   estufaId       {string} - ID da estufa
 *   telemetry      {object} - Ultima leitura dos sensores
 *   profile        {object} - Preset ativo com faixas ideais
 *   externalWeather {object} - Clima externo (opcional)
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getHistoricoTelemetria } from '../api/telemetriaService.js';

// ── Utilitarios ───────────────────────────────────────────────────────────────

const fmt = (v, d = 1) => (typeof v === 'number' && isFinite(v) ? v.toFixed(d) : '');

const fmtTime = (iso) => {
  if (!iso) return '';
  try { return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
};

const fmtDate = (iso) => {
  if (!iso) return '';
  try { return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }); }
  catch { return ''; }
};

const statusOf = (value, range) => {
  if (!range || value == null) return 'stone';
  if (value < range.min || value > range.max) {
    const span = range.max - range.min || 1;
    const dev = value < range.min ? (range.min - value) / span : (value - range.max) / span;
    return dev * 100 > 20 ? 'red' : 'amber';
  }
  return 'green';
};

const STATUS = {
  green: { card: 'border-emerald-500/25 bg-emerald-500/8', val: 'text-emerald-400', dot: 'bg-emerald-400', badge: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400', label: 'OK' },
  amber: { card: 'border-amber-500/25 bg-amber-500/8',   val: 'text-amber-400',   dot: 'bg-amber-400',   badge: 'border-amber-500/30 bg-amber-500/10 text-amber-400',   label: 'Atenção' },
  red:   { card: 'border-red-500/25 bg-red-500/8',       val: 'text-red-400',     dot: 'bg-red-400',     badge: 'border-red-500/30 bg-red-500/10 text-red-400',         label: 'Risco' },
  stone: { card: 'border-stone-200 dark:border-stone-800/50 bg-stone-50 dark:bg-stone-900/25',  val: 'text-stone-600 dark:text-stone-300',   dot: 'bg-stone-400 dark:bg-stone-500',   badge: 'border-stone-300 dark:border-stone-700/50 bg-stone-100 dark:bg-stone-800/50 text-stone-500 dark:text-stone-400',   label: 'Sem dados' },
};

// ── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, unit, range, color }) {
  const st = STATUS[color] || STATUS.stone;
  return (
    <div className={`rounded-2xl border p-4 transition-all ${st.card}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100 dark:bg-stone-800/60">
          <i className={`fa-solid ${icon} text-sm ${st.val} dark:${st.val}`} />
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase ${st.badge}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />{st.label}
        </span>
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-500 mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className={`text-3xl font-bold ${st.val}`}>{value}</span>
        <span className="text-sm text-stone-500">{unit}</span>
      </div>
      {range && <p className="text-[10px] text-stone-500 dark:text-stone-600 mt-1.5">Meta: {range.min}–{range.max} {unit}</p>}
    </div>
  );
}

// ── SVG Line Chart ────────────────────────────────────────────────────────────

function SvgLineChart({ data, keys, colors, labels, height = 180, refLines = [] }) {
  const W = 560, H = height, PAD = { t: 12, r: 16, b: 28, l: 36 };
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;

  if (!data || data.length < 2) {
    return (
      <div className="flex items-center justify-center py-10 text-xs text-stone-600">
        <i className="fa-solid fa-chart-line mr-2" />Sem dados no periodo.
      </div>
    );
  }

  const allVals = data.flatMap((d) => keys.map((k) => d[k]).filter((v) => v != null));
  const refVals = refLines.flatMap((r) => [r.y]).filter(Boolean);
  const minY = Math.floor(Math.min(...allVals, ...refVals) * 0.95);
  const maxY = Math.ceil(Math.max(...allVals, ...refVals) * 1.05);
  const rangeY = maxY - minY || 1;

  const xOf = (i) => PAD.l + (i / (data.length - 1)) * innerW;
  const yOf = (v) => PAD.t + (1 - (v - minY) / rangeY) * innerH;

  const path = (key) => data
    .map((d, i) => d[key] != null ? `${i === 0 ? 'M' : 'L'}${xOf(i).toFixed(1)},${yOf(d[key]).toFixed(1)}` : '')
    .filter(Boolean)
    .join(' ');

  const ticks = [minY, Math.round((minY + maxY) / 2), maxY];
  const xTicks = data.length <= 8
    ? data.map((_, i) => i)
    : [0, Math.floor(data.length / 4), Math.floor(data.length / 2), Math.floor(data.length * 3 / 4), data.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: 'visible' }}>
      {/* Grid */}
      {ticks.map((t) => (
        <g key={t}>
          <line x1={PAD.l} y1={yOf(t)} x2={W - PAD.r} y2={yOf(t)} stroke="#292524" strokeWidth="1" />
          <text x={PAD.l - 4} y={yOf(t) + 4} textAnchor="end" fontSize="9" fill="#78716c">{t}</text>
        </g>
      ))}
      {/* Reference lines (preset limits) */}
      {refLines.map((r, i) => (
        <line key={i} x1={PAD.l} y1={yOf(r.y)} x2={W - PAD.r} y2={yOf(r.y)}
          stroke={r.color} strokeWidth="1" strokeDasharray="4 3" opacity="0.45" />
      ))}
      {/* X axis labels */}
      {xTicks.map((i) => (
        <text key={i} x={xOf(i)} y={H - 4} textAnchor="middle" fontSize="9" fill="#78716c">
          {data[i]?.label || ''}
        </text>
      ))}
      {/* Lines */}
      {keys.map((k, ki) => (
        <path key={k} d={path(k)} fill="none" stroke={colors[ki]} strokeWidth="2" strokeLinejoin="round" />
      ))}
      {/* Dots on last point */}
      {keys.map((k, ki) => {
        const last = [...data].reverse().find((d) => d[k] != null);
        const li = last ? data.lastIndexOf(last) : -1;
        return li >= 0 ? (
          <circle key={k} cx={xOf(li)} cy={yOf(last[k])} r="3.5" fill={colors[ki]} stroke="#1c1917" strokeWidth="1.5" />
        ) : null;
      })}
    </svg>
  );
}

// ── SVG Area Chart ─────────────────────────────────────────────────────────────

function SvgAreaChart({ data, dataKey, color, refMin, refMax, height = 180 }) {
  const W = 560, H = height, PAD = { t: 12, r: 16, b: 28, l: 36 };
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;

  if (!data || data.length < 2) {
    return (
      <div className="flex items-center justify-center py-10 text-xs text-stone-600">
        Sem dados no periodo.
      </div>
    );
  }

  const vals = data.map((d) => d[dataKey]).filter((v) => v != null);
  const refs = [refMin, refMax].filter(Boolean);
  const minY = Math.floor(Math.min(...vals, ...refs) * 0.9);
  const maxY = Math.ceil(Math.max(...vals, ...refs) * 1.1);
  const rangeY = maxY - minY || 1;

  const xOf = (i) => PAD.l + (i / (data.length - 1)) * innerW;
  const yOf = (v) => PAD.t + (1 - (v - minY) / rangeY) * innerH;

  const linePts = data.filter((d) => d[dataKey] != null).map((d, _, arr) => {
    const i = data.indexOf(d);
    return `${xOf(i).toFixed(1)},${yOf(d[dataKey]).toFixed(1)}`;
  });
  const areaPath = linePts.length
    ? `M${linePts[0]} L${linePts.join(' L')} L${xOf(data.length - 1)},${PAD.t + innerH} L${PAD.l},${PAD.t + innerH} Z`
    : '';
  const linePath = linePts.length ? `M${linePts[0]} L${linePts.join(' L')}` : '';
  const gradId = `ag_${dataKey}`;

  const xTicks = [0, Math.floor(data.length / 2), data.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%"  stopColor={color} stopOpacity="0.25" />
          <stop offset="95%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Faixa ideal */}
      {refMin != null && refMax != null && (
        <rect
          x={PAD.l} y={yOf(refMax)}
          width={innerW} height={yOf(refMin) - yOf(refMax)}
          fill={color} opacity="0.07"
        />
      )}
      {/* Grid */}
      {[minY, Math.round((minY + maxY) / 2), maxY].map((t) => (
        <g key={t}>
          <line x1={PAD.l} y1={yOf(t)} x2={W - PAD.r} y2={yOf(t)} stroke="#292524" strokeWidth="1" />
          <text x={PAD.l - 4} y={yOf(t) + 4} textAnchor="end" fontSize="9" fill="#78716c">{t}</text>
        </g>
      ))}
      {refMin != null && <line x1={PAD.l} y1={yOf(refMin)} x2={W - PAD.r} y2={yOf(refMin)} stroke={color} strokeWidth="1" strokeDasharray="4 3" opacity="0.55" />}
      {refMax != null && <line x1={PAD.l} y1={yOf(refMax)} x2={W - PAD.r} y2={yOf(refMax)} stroke={color} strokeWidth="1" strokeDasharray="4 3" opacity="0.55" />}
      {xTicks.map((i) => (
        <text key={i} x={xOf(i)} y={H - 4} textAnchor="middle" fontSize="9" fill="#78716c">
          {data[i]?.label || ''}
        </text>
      ))}
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

// ── SVG Bar Chart ─────────────────────────────────────────────────────────────

function SvgBarChart({ data, keys, colors, height = 180 }) {
  const W = 560, H = height, PAD = { t: 12, r: 16, b: 32, l: 36 };
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;

  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center py-10 text-xs text-stone-600">Sem dados no periodo.</div>;
  }

  const allVals = data.flatMap((d) => keys.map((k) => d[k] ?? 0));
  const maxY = Math.ceil(Math.max(...allVals) * 1.1) || 1;
  const groupW = innerW / data.length;
  const barW = Math.min(18, groupW / (keys.length + 1));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: 'visible' }}>
      {[0, Math.round(maxY / 2), maxY].map((t) => {
        const y = PAD.t + (1 - t / maxY) * innerH;
        return (
          <g key={t}>
            <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke="#292524" strokeWidth="1" />
            <text x={PAD.l - 4} y={y + 4} textAnchor="end" fontSize="9" fill="#78716c">{t}</text>
          </g>
        );
      })}
      {data.map((d, di) => {
        const groupX = PAD.l + di * groupW + groupW / 2;
        return (
          <g key={di}>
            {keys.map((k, ki) => {
              const val = d[k] ?? 0;
              const barH = (val / maxY) * innerH;
              const x = groupX + (ki - (keys.length - 1) / 2) * (barW + 2) - barW / 2;
              const y = PAD.t + innerH - barH;
              return (
                <rect key={k} x={x} y={y} width={barW} height={Math.max(1, barH)}
                  fill={colors[ki]} rx="2" opacity="0.8" />
              );
            })}
            <text x={groupX} y={H - 6} textAnchor="middle" fontSize="9" fill="#78716c">
              {d.name || ''}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Seletor de janela ─────────────────────────────────────────────────────────

const WINDOWS = [
  { label: '6h',  horas: 6,   janela: 15 },
  { label: '24h', horas: 24,  janela: 30 },
  { label: '3d',  horas: 72,  janela: 60 },
  { label: '7d',  horas: 168, janela: 180 },
];

// ── Componente principal ──────────────────────────────────────────────────────

export const MonitoramentoTab = ({ estufaId, telemetry, profile, externalWeather, city, hasEverHadDevice = false }) => {
  const [series, setSeries]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [winIdx, setWinIdx]     = useState(1);

  const win = WINDOWS[winIdx];

  const loadSeries = useCallback(async () => {
    if (!estufaId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getHistoricoTelemetria(estufaId, win.horas, win.janela);
      setSeries(res.series || []);
    } catch {
      // falha silenciosa: os gauges de tempo real continuam funcionando normalmente
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [estufaId, win.horas, win.janela]);

  useEffect(() => { loadSeries(); }, [loadSeries]);

  // valores atuais
  const temp = telemetry?.temperature ?? telemetry?.temperatura ?? null;
  const hum  = telemetry?.humidity    ?? telemetry?.umidade     ?? null;
  const soil = telemetry?.soilMoisture ?? telemetry?.umidade_solo ?? null;
  const lux  = telemetry?.luminosidade ?? telemetry?.luminosity  ?? null;

  // faixas do preset
  const rTemp = profile?.temperature  ?? null;
  const rHum  = profile?.humidity     ?? null;
  const rSoil = profile?.soilMoisture ?? null;
  const rLux  = profile?.luminosity   ?? null;

  // prepara dados para graficos
  const chartData = useMemo(() =>
    series.map((p) => ({
      ...p,
      label: win.horas <= 24 ? fmtTime(p.timestamp) : fmtDate(p.timestamp),
    })), [series, win.horas]);

  const barData = useMemo(() =>
    chartData.slice(-6).map((p, i) => ({
      name: p.label || `P${i + 1}`,
      temperatura: p.temperatura ?? null,
      umidade: p.umidade ?? null,
    })), [chartData]);

  if (loading) return (
    <div className="mt-5 space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[0,1,2,3].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl border border-stone-200 dark:border-stone-800/40 bg-stone-100 dark:bg-stone-900/20" />)}
      </div>
      <div className="h-56 animate-pulse rounded-2xl border border-stone-200 dark:border-stone-800/40 bg-stone-100 dark:bg-stone-900/20" />
    </div>
  );

  return (
    <div className="mt-5 space-y-4">

      {/* Aviso: sem ESP */}
      {!hasEverHadDevice && (
        <div className="flex items-center gap-2.5 rounded-xl border border-amber-300/50 bg-amber-50/40 dark:border-amber-700/40 dark:bg-amber-900/10 px-4 py-2.5">
          <i className="fa-solid fa-microchip text-amber-500 text-sm flex-shrink-0" />
          <p className="text-xs text-stone-600 dark:text-stone-400">
            Nenhum ESP32 cadastrado. Vá em <strong>Dispositivos</strong> para adicionar um e habilitar o monitoramento em tempo real.
          </p>
        </div>
      )}

      {/* Última atualização */}
      {telemetry?.lastUpdate && (
        <div className="flex items-center gap-1.5 text-[10px] text-stone-500 dark:text-stone-500">
          <i className="fa-solid fa-clock-rotate-left text-[9px]" />
          <span>Última atualização: {new Date(telemetry.lastUpdate).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </div>
      )}

      {/* Seletor de janela */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-stone-600 dark:text-stone-500 uppercase tracking-widest">Telemetria em tempo real</p>
        <div className="flex items-center gap-1">
          {WINDOWS.map((w, i) => (
            <button key={w.label} type="button" onClick={() => setWinIdx(i)}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                i === winIdx ? 'bg-red-600 text-white' : 'border border-stone-300 dark:border-stone-700/60 text-stone-600 dark:text-stone-400 hover:border-stone-400 dark:hover:border-stone-600 hover:text-stone-800 dark:hover:text-stone-200'
              }`}>
              {w.label}
            </button>
          ))}
          <button type="button" onClick={loadSeries}
            className="ml-1 rounded-lg border border-stone-300 dark:border-stone-700/60 p-1.5 text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition" title="Atualizar">
            <i className="fa-solid fa-arrows-rotate text-xs" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon="fa-temperature-half" label="Temperatura" value={fmt(temp)} unit="°C" range={rTemp} color={statusOf(temp, rTemp)} />
        <KpiCard icon="fa-droplet"          label="Umidade do ar" value={fmt(hum)} unit="%" range={rHum} color={statusOf(hum, rHum)} />
        <KpiCard icon="fa-seedling"         label="Umidade do Solo" value={fmt(soil)} unit="%" range={rSoil} color={statusOf(soil, rSoil)} />
        <KpiCard icon="fa-sun"              label="Luminosidade" value={fmt(lux, 0)} unit="lux" range={rLux} color={statusOf(lux, rLux)} />
      </div>

      {/* Erro */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/8 px-4 py-2.5 text-xs text-amber-300">
          <i className="fa-solid fa-triangle-exclamation" /> {error}
        </div>
      )}

      {/* Grafico 1: Temperatura + Umidade */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800/60 bg-white dark:bg-stone-900/35 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-semibold text-stone-800 dark:text-stone-100">Temperatura e Umidade do ar</p>
            <p className="text-[10px] text-stone-500 mt-0.5">Evolução - últimas {win.label}</p>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-stone-500 dark:text-stone-500">
            <span className="flex items-center gap-1"><span className="h-2 w-4 rounded-full inline-block bg-red-400" />Temp (C)</span>
            <span className="flex items-center gap-1"><span className="h-2 w-4 rounded-full inline-block bg-blue-400" />Umidade (%)</span>
          </div>
        </div>
        <SvgLineChart
          data={chartData}
          keys={['temperatura', 'umidade']}
          colors={['#f87171', '#60a5fa']}
          labels={['Temp', 'Umidade']}
          refLines={[
            ...(rTemp ? [{ y: rTemp.min, color: '#f87171' }, { y: rTemp.max, color: '#f87171' }] : []),
            ...(rHum  ? [{ y: rHum.min,  color: '#60a5fa' }, { y: rHum.max,  color: '#60a5fa' }] : []),
          ]}
        />
      </div>

      {/* Graficos 2 e 3 */}
      <div className="grid lg:grid-cols-2 gap-4">

        <div className="rounded-2xl border border-stone-200 dark:border-stone-800/60 bg-white dark:bg-stone-900/35 p-5">
          <div className="mb-4">
            <p className="text-xs font-semibold text-stone-800 dark:text-stone-100">Umidade do substrato</p>
            <p className="text-[10px] text-stone-500 mt-0.5">Tendência - últimas {win.label}</p>
          </div>
          <SvgAreaChart
            data={chartData}
            dataKey="umidade_solo"
            color="#34d399"
            refMin={rSoil?.min}
            refMax={rSoil?.max}
          />
        </div>

        <div className="rounded-2xl border border-stone-200 dark:border-stone-800/60 bg-white dark:bg-stone-900/35 p-5">
          <div className="mb-4">
            <p className="text-xs font-semibold text-stone-800 dark:text-stone-100">Comparativo de períodos</p>
            <p className="text-[10px] text-stone-500 mt-0.5">Últimos 6 pontos</p>
          </div>
          <SvgBarChart
            data={barData}
            keys={['temperatura', 'umidade']}
            colors={['#f87171', '#60a5fa']}
          />
        </div>
      </div>

      {/* Clima externo */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800/60 bg-white dark:bg-stone-900/35 p-4">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
            <i className="fa-solid fa-cloud-sun text-blue-500 dark:text-blue-400 text-sm" />
          </div>
          <p className="text-xs font-semibold text-stone-800 dark:text-stone-100">
            Clima externo{city ? <span className="ml-1 font-normal text-stone-400 dark:text-stone-500">({city})</span> : null}
          </p>
        </div>
        {externalWeather ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Temperatura', value: externalWeather.temperatura != null ? Number(externalWeather.temperatura).toFixed(1) : null, unit: '°C', color: 'text-red-400' },
              { label: 'Umidade', value: externalWeather.umidade != null ? Number(externalWeather.umidade).toFixed(1) : null, unit: '%', color: 'text-blue-400' },
              { label: 'Condição', value: externalWeather.descricao, unit: '', color: 'text-stone-400' },
              { label: 'Nuvens', value: externalWeather.nuvens, unit: '%', color: 'text-stone-400' },
            ].filter((i) => i.value != null).map((item) => (
              <div key={item.label} className="rounded-xl border border-stone-200 dark:border-stone-800/40 bg-stone-50 dark:bg-stone-800/30 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-500 dark:text-stone-600 mb-1">{item.label}</p>
                <span className={`text-sm font-semibold ${item.color}`}>{item.value}</span>
                <span className="text-xs text-stone-500 ml-0.5">{item.unit}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/20 px-4 py-5">
            <i className="fa-solid fa-location-dot text-stone-300 dark:text-stone-600 text-xl" />
            <div>
              <p className="text-xs font-medium text-stone-500 dark:text-stone-400">Localização não cadastrada</p>
              <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">Adicione o CEP da estufa para visualizar temperatura, umidade e condições externas em tempo real.</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default MonitoramentoTab;
