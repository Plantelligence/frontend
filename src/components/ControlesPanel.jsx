/**
 * ControlesPanel — Painel de controle remoto dos atuadores da estufa.
 *
 * Cada ESP32 centraliza todos os atuadores:
 *   - Lâmpada de calor  (aquecimento)     : ligar / desligar manual
 *   - Nebulizador       (umidificador)     : ligar / desligar manual
 *   - LED fotoperíodo   (iluminacao)       : fotoperíodo automático + configuração de hora de ligar
 *
 * Fluxo:
 *   Botão → POST /api/estufas/{id}/atuadores/{device_id}/ligar|desligar { parameter }
 *         → Backend → IoT Hub C2D → ESP32 → Relé → Telemetria de confirmação
 *
 * Estado atual dos atuadores é lido da última telemetria recebida do ESP32.
 * LED fotoperíodo: hora de ligar configurável, hora de desligar calculada automaticamente
 * com base no período de luz da fase biológica atual da estufa.
 */

import React, { useState } from 'react';
import api from '../api/client.js';

// ── Configuração dos atuadores ─────────────────────────────────────────────────

const ATUADORES_CONFIG = [
  {
    parametro:  'aquecimento',
    telKey:     'atuador_aquecimento',
    label:      'Lâmpada de calor',
    icon:       'fa-fire',
    cor:        'amber',
    descricao:  'Aquece a estufa quando a temperatura está abaixo do ideal',
    efeito:     'Aumenta temperatura',
  },
  {
    parametro:  'umidificador',
    telKey:     'atuador_umidificador',
    label:      'Nebulizador',
    icon:       'fa-droplet',
    cor:        'blue',
    descricao:  'Controla umidade do ar e resfriamento da estufa',
    efeito:     'Aumenta umidade e reduz temperatura',
  },
];

// Horas de luz por fase biológica (espelha PERIODO_LUZ_HORAS_POR_FASE do backend)
const PERIODO_LUZ_HORAS_POR_FASE = {
  incubacao:    0,
  inducao:      0,
  frutificacao: 12,
  colheita:     10,
};

// ── Estilos por cor ────────────────────────────────────────────────────────────

const corClasses = {
  amber: {
    on:     'bg-amber-50 border-amber-300',
    icon:   'text-amber-500',
    badge:  'bg-amber-100 text-amber-700 border-amber-200',
    btn:    'bg-amber-500 hover:bg-amber-600 text-white',
    btnOff: 'bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 border border-stone-300 dark:border-stone-600 text-slate-700 dark:text-stone-300',
    ring:   'ring-amber-300',
  },
  blue: {
    on:     'bg-blue-50 border-blue-300',
    icon:   'text-blue-500',
    badge:  'bg-blue-100 text-blue-700 border-blue-200',
    btn:    'bg-blue-500 hover:bg-blue-600 text-white',
    btnOff: 'bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 border border-stone-300 dark:border-stone-600 text-slate-700 dark:text-stone-300',
    ring:   'ring-blue-300',
  },
  emerald: {
    on:     'bg-emerald-50 border-emerald-300',
    icon:   'text-emerald-500',
    badge:  'bg-emerald-100 text-emerald-700 border-emerald-200',
    btn:    'bg-emerald-500 hover:bg-emerald-600 text-white',
    btnOff: 'bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 border border-stone-300 dark:border-stone-600 text-slate-700 dark:text-stone-300',
    ring:   'ring-emerald-300',
  },
};

// ── Card de atuador (lâmpada / nebulizador) ────────────────────────────────────

const AtuadorCard = ({ config, device, estadoAtual, onComando, readOnly }) => {
  const [busy, setBusy]         = useState(false);
  const [feedback, setFeedback] = useState(null);

  const ligado        = estadoAtual === 'on';
  const c             = corClasses[config.cor];
  const semDispositivo = !device;

  const enviarComando = async (acao) => {
    if (busy || readOnly || semDispositivo) return;
    setBusy(true);
    setFeedback(null);
    try {
      await api.post(
        `/estufas/${device.estufaId}/atuadores/${device.id}/${acao}`,
        { parameter: config.parametro }
      );
      setFeedback({ ok: true, msg: `Comando "${acao}" enviado ao ESP32.` });
      onComando?.(config.parametro, acao);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Falha ao enviar comando. Verifique a conexão do dispositivo.';
      setFeedback({ ok: false, msg });
    } finally {
      setBusy(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  return (
    <div className={`rounded-2xl border-2 p-4 flex flex-col gap-3 transition-all duration-300 ${
      ligado ? `${c.on} ring-2 ${c.ring} ring-opacity-40` : 'bg-white dark:bg-stone-900/35 border-stone-200 dark:border-stone-800/60'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            ligado ? 'bg-white dark:bg-stone-800 shadow-sm' : 'bg-stone-100 dark:bg-stone-700'
          }`}>
            <i className={`fa-solid ${config.icon} text-lg ${ligado ? c.icon : 'text-stone-400'}`} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-stone-100">{config.label}</h3>
            <p className="text-[11px] text-slate-500 dark:text-stone-400">{config.descricao}</p>
          </div>
        </div>
        <span className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
          ligado ? c.badge : 'bg-stone-100 text-stone-500 border-stone-200'
        }`}>
          {ligado ? '● LIGADO' : '○ DESLIGADO'}
        </span>
      </div>

      <div className="rounded-xl bg-white/70 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/40 px-3 py-2 flex items-center gap-2">
        <i className="fa-solid fa-circle-info text-xs text-stone-400" />
        <p className="text-[11px] text-slate-500 dark:text-stone-400">{config.efeito}</p>
      </div>

      {feedback && (
        <div className={`rounded-lg px-3 py-2 text-[11px] font-medium ${
          feedback.ok
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
            : 'bg-rose-50 border border-rose-200 text-rose-700'
        }`}>
          <i className={`fa-solid ${feedback.ok ? 'fa-check' : 'fa-triangle-exclamation'} mr-1.5`} />
          {feedback.msg}
        </div>
      )}

      {!readOnly && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => enviarComando('ligar')}
            disabled={busy || ligado || semDispositivo}
            className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              !ligado && !semDispositivo ? `${c.btn} shadow-sm` : 'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-600'
            }`}
          >
            {busy && !ligado
              ? <><i className="fa-solid fa-circle-notch fa-spin mr-1" />Enviando...</>
              : <><i className="fa-solid fa-power-off mr-1" />Ligar</>}
          </button>
          <button
            type="button"
            onClick={() => enviarComando('desligar')}
            disabled={busy || !ligado || semDispositivo}
            className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              ligado && !semDispositivo ? c.btnOff : 'bg-stone-100 dark:bg-stone-800 text-stone-300 dark:text-stone-600'
            }`}
          >
            {busy && ligado
              ? <><i className="fa-solid fa-circle-notch fa-spin mr-1" />Enviando...</>
              : <><i className="fa-solid fa-stop mr-1" />Desligar</>}
          </button>
        </div>
      )}

      {readOnly && (
        <p className="text-[11px] text-center text-slate-400 dark:text-stone-500">
          <i className="fa-solid fa-lock mr-1" />Perfil somente leitura
        </p>
      )}
    </div>
  );
};

// ── Card do LED fotoperíodo ────────────────────────────────────────────────────

const LedFotoperiodoCard = ({ device, estadoAtual, faseAtual, onComando, readOnly }) => {
  const periodoHoras  = PERIODO_LUZ_HORAS_POR_FASE[faseAtual] ?? 12;
  const initialHora   = device?.lampada_inicio_hora ?? null;

  const [horaInicio,   setHoraInicio]   = useState(initialHora !== null ? String(initialHora) : '');
  const [salvando,     setSalvando]     = useState(false);
  const [feedbackLed,  setFeedbackLed]  = useState(null);
  const [busy,         setBusy]         = useState(false);
  const [feedback,     setFeedback]     = useState(null);

  const ligado        = estadoAtual === 'on';
  const c             = corClasses.emerald;
  const semDispositivo = !device;

  const horaInicioNum = parseInt(horaInicio, 10);
  const horaFim       = (!isNaN(horaInicioNum) && periodoHoras > 0)
    ? (horaInicioNum + periodoHoras) % 24
    : null;

  const fmtHora = (h) => `${String(h).padStart(2, '0')}:00`;

  const enviarComando = async (acao) => {
    if (busy || readOnly || semDispositivo) return;
    setBusy(true);
    setFeedback(null);
    try {
      await api.post(
        `/estufas/${device.estufaId}/atuadores/${device.id}/${acao}`,
        { parameter: 'iluminacao' }
      );
      setFeedback({ ok: true, msg: `Comando "${acao}" enviado ao ESP32.` });
      onComando?.('iluminacao', acao);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Falha ao enviar comando.';
      setFeedback({ ok: false, msg });
    } finally {
      setBusy(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const salvarHora = async () => {
    if (isNaN(horaInicioNum) || horaInicioNum < 0 || horaInicioNum > 23 || semDispositivo) return;
    setSalvando(true);
    setFeedbackLed(null);
    try {
      await api.patch(
        `/estufas/${device.estufaId}/dispositivos/${device.id}`,
        { lampada_inicio_hora: horaInicioNum }
      );
      setFeedbackLed({ ok: true, msg: `Fotoperíodo salvo: liga às ${fmtHora(horaInicioNum)}, desliga às ${fmtHora(horaFim)}.` });
    } catch (err) {
      setFeedbackLed({ ok: false, msg: err?.response?.data?.message || 'Falha ao salvar configuração.' });
    } finally {
      setSalvando(false);
      setTimeout(() => setFeedbackLed(null), 5000);
    }
  };

  return (
    <div className={`rounded-2xl border-2 p-4 flex flex-col gap-3 transition-all duration-300 ${
      ligado ? `${c.on} ring-2 ${c.ring} ring-opacity-40` : 'bg-white dark:bg-stone-900/35 border-stone-200 dark:border-stone-800/60'
    }`}>
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            ligado ? 'bg-white dark:bg-stone-800 shadow-sm' : 'bg-stone-100 dark:bg-stone-700'
          }`}>
            <i className={`fa-solid fa-lightbulb text-lg ${ligado ? c.icon : 'text-stone-400'}`} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-stone-100">LED fotoperíodo</h3>
            <p className="text-[11px] text-slate-500 dark:text-stone-400">Simula luz branca para orientação do crescimento</p>
          </div>
        </div>
        <span className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
          ligado ? c.badge : 'bg-stone-100 text-stone-500 border-stone-200'
        }`}>
          {ligado ? '● LIGADO' : '○ DESLIGADO'}
        </span>
      </div>

      {/* Info fase */}
      <div className="rounded-xl bg-white/70 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/40 px-3 py-2 flex items-center gap-2">
        <i className="fa-solid fa-seedling text-xs text-emerald-500" />
        <p className="text-[11px] text-slate-500 dark:text-stone-400">
          Fase atual: <span className="font-semibold">{faseAtual === 'incubacao' ? 'Incubação' : faseAtual === 'inducao' ? 'Indução' : faseAtual === 'frutificacao' ? 'Frutificação' : faseAtual === 'colheita' ? 'Colheita' : faseAtual}</span>
          {periodoHoras > 0
            ? ` - ${periodoHoras}h de luz necessárias por dia`
            : ' - sem necessidade de luz nesta fase'}
        </p>
      </div>

      {/* Configuração de fotoperíodo */}
      {periodoHoras > 0 && (
        <div className="rounded-xl border border-stone-200 dark:border-stone-700/50 bg-stone-50 dark:bg-stone-800/30 px-3 py-3 flex flex-col gap-2">
          <p className="text-[11px] font-semibold text-stone-600 dark:text-stone-300">
            <i className="fa-solid fa-clock mr-1.5 text-emerald-400" />
            Configurar fotoperíodo
          </p>
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-stone-500">Hora de ligar</label>
              <select
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                disabled={semDispositivo || readOnly}
                className="rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-2 py-1.5 text-xs text-stone-800 dark:text-stone-100 outline-none focus:border-emerald-500 disabled:opacity-50"
              >
                <option value="">--</option>
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>{fmtHora(i)}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-stone-500">Desliga automaticamente às</label>
              <div className="rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800/50 px-3 py-1.5 text-xs text-stone-500 dark:text-stone-400 min-w-[72px] text-center">
                {horaFim !== null ? fmtHora(horaFim) : '--:--'}
              </div>
            </div>
            {!readOnly && (
              <button
                type="button"
                onClick={salvarHora}
                disabled={salvando || semDispositivo || horaInicio === '' || isNaN(horaInicioNum)}
                className="mt-4 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
              >
                {salvando ? <><i className="fa-solid fa-circle-notch fa-spin mr-1" />Salvando</> : 'Salvar'}
              </button>
            )}
          </div>
          {horaInicio !== '' && !isNaN(horaInicioNum) && horaFim !== null && (
            <p className="text-[10px] text-stone-500 dark:text-stone-500">
              <i className="fa-solid fa-info-circle mr-1" />
              O ESP32 ligará o LED às {fmtHora(horaInicioNum)} e desligará às {fmtHora(horaFim)} automaticamente.
            </p>
          )}
        </div>
      )}

      {periodoHoras === 0 && (
        <div className="rounded-xl border border-stone-200 dark:border-stone-700/50 bg-stone-50 dark:bg-stone-800/30 px-3 py-2 text-center">
          <p className="text-[11px] text-stone-500 dark:text-stone-400">
            Fotoperíodo desativado nesta fase: o LED permanece desligado.
          </p>
        </div>
      )}

      {feedbackLed && (
        <div className={`rounded-lg px-3 py-2 text-[11px] font-medium ${
          feedbackLed.ok
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
            : 'bg-rose-50 border border-rose-200 text-rose-700'
        }`}>
          <i className={`fa-solid ${feedbackLed.ok ? 'fa-check' : 'fa-triangle-exclamation'} mr-1.5`} />
          {feedbackLed.msg}
        </div>
      )}

      {feedback && (
        <div className={`rounded-lg px-3 py-2 text-[11px] font-medium ${
          feedback.ok
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
            : 'bg-rose-50 border border-rose-200 text-rose-700'
        }`}>
          <i className={`fa-solid ${feedback.ok ? 'fa-check' : 'fa-triangle-exclamation'} mr-1.5`} />
          {feedback.msg}
        </div>
      )}

      {!readOnly && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => enviarComando('ligar')}
            disabled={busy || ligado || semDispositivo}
            className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              !ligado && !semDispositivo ? `${c.btn} shadow-sm` : 'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-600'
            }`}
          >
            {busy && !ligado
              ? <><i className="fa-solid fa-circle-notch fa-spin mr-1" />Enviando...</>
              : <><i className="fa-solid fa-power-off mr-1" />Ligar manual</>}
          </button>
          <button
            type="button"
            onClick={() => enviarComando('desligar')}
            disabled={busy || !ligado || semDispositivo}
            className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              ligado && !semDispositivo ? c.btnOff : 'bg-stone-100 dark:bg-stone-800 text-stone-300 dark:text-stone-600'
            }`}
          >
            {busy && ligado
              ? <><i className="fa-solid fa-circle-notch fa-spin mr-1" />Enviando...</>
              : <><i className="fa-solid fa-stop mr-1" />Desligar</>}
          </button>
        </div>
      )}

      {readOnly && (
        <p className="text-[11px] text-center text-slate-400 dark:text-stone-500">
          <i className="fa-solid fa-lock mr-1" />Perfil somente leitura
        </p>
      )}
    </div>
  );
};

// ── Componente principal ───────────────────────────────────────────────────────

export const ControlesPanel = ({ greenhouse, devices, devicesLoading, telemetry, readOnly }) => {
  const [estadosLocais, setEstadosLocais] = useState({});

  // Lê o estado real da última telemetria do ESP32
  const getEstadoAtual = (telKey) => {
    if (estadosLocais[telKey] !== undefined) return estadosLocais[telKey];
    return telemetry?.[telKey] ?? null;
  };

  const handleComando = (parametro, acao) => {
    const telKeyMap = {
      aquecimento:  'atuador_aquecimento',
      umidificador: 'atuador_umidificador',
      iluminacao:   'atuador_iluminacao',
    };
    const telKey = telKeyMap[parametro];
    if (telKey) {
      setEstadosLocais((prev) => ({ ...prev, [telKey]: acao === 'ligar' ? 'on' : 'off' }));
    }
  };

  // Pega o primeiro ESP32 ativo da estufa (único dispositivo que controla tudo)
  const esp32 = devices?.find((d) => d.ativo !== false) ?? null;

  // Adiciona estufaId ao objeto de device para os cards enviarem para a rota correta
  const deviceComEstufa = esp32
    ? { ...esp32, estufaId: greenhouse?.id || esp32?.estufaId || esp32?.estufa_id }
    : null;

  const faseAtual = greenhouse?.fase_atual || 'frutificacao';
  const temDispositivo = !!esp32;

  return (
    <div className="mt-6 flex flex-col gap-5">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-stone-100">Painel de controle remoto</p>
          <p className="text-xs text-slate-500 dark:text-stone-400 mt-0.5">
            Envie comandos ao ESP32 via Azure IoT Hub. O dispositivo responde em segundos.
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-semibold text-emerald-700">Controle via MQTT C2D</span>
        </div>
      </div>

      {devicesLoading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-slate-400 dark:text-stone-500">
          <i className="fa-solid fa-circle-notch fa-spin" />
          <span className="text-sm">Carregando dispositivos...</span>
        </div>
      ) : (
        <>
          {/* ESP32 identificado */}
          {esp32 && (
            <div className="rounded-xl border border-stone-200 dark:border-stone-700/50 bg-stone-50 dark:bg-stone-800/30 px-4 py-2.5 flex items-center gap-3">
              <i className="fa-solid fa-microchip text-stone-400" />
              <div>
                <p className="text-xs font-semibold text-stone-700 dark:text-stone-200">{esp32.nome}</p>
                <p className="text-[10px] text-stone-500 dark:text-stone-400">
                  {esp32.iothub_device_id || esp32.identificador}
                  {esp32.onboarding_status === 'connected'
                    ? <span className="ml-2 text-emerald-500"><i className="fa-solid fa-circle text-[8px] mr-0.5" />Online</span>
                    : <span className="ml-2 text-stone-400"><i className="fa-solid fa-circle text-[8px] mr-0.5" />{esp32.onboarding_status || 'aguardando'}</span>}
                </p>
              </div>
            </div>
          )}

          {/* Grid de atuadores (lâmpada + nebulizador) */}
          <div className="grid gap-4 sm:grid-cols-2">
            {ATUADORES_CONFIG.map((config) => (
              <AtuadorCard
                key={config.parametro}
                config={config}
                device={deviceComEstufa}
                estadoAtual={getEstadoAtual(config.telKey)}
                onComando={handleComando}
                readOnly={readOnly}
              />
            ))}
          </div>

          {/* LED fotoperíodo (card full-width) */}
          <LedFotoperiodoCard
            device={deviceComEstufa}
            estadoAtual={getEstadoAtual('atuador_iluminacao')}
            faseAtual={faseAtual}
            onComando={handleComando}
            readOnly={readOnly}
          />

          {/* Aviso se não há dispositivo cadastrado */}
          {!temDispositivo && (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 dark:bg-stone-800/40 p-8 text-center">
              <i className="fa-solid fa-microchip text-2xl text-stone-300 mb-3 block" />
              <p className="text-sm font-medium text-slate-600 dark:text-stone-400">Nenhum ESP32 cadastrado nesta estufa</p>
              <p className="mt-1 text-xs text-slate-400 dark:text-stone-500">
                Vá até a aba Dispositivos e adicione um ESP32 para habilitar o controle remoto.
              </p>
            </div>
          )}

          {/* Nota técnica */}
          <div className="rounded-xl border border-stone-200 dark:border-stone-800/60 bg-white dark:bg-stone-900/35 px-4 py-3 flex items-start gap-3">
            <i className="fa-solid fa-circle-info text-stone-400 mt-0.5" />
            <div>
              <p className="text-[11px] font-semibold text-stone-700 dark:text-stone-300">Controle via nuvem (C2D)</p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                Os comandos são enviados ao ESP32 via Azure IoT Hub. O dispositivo deve estar online para responder.
                O fotoperíodo do LED é sincronizado automaticamente pelo worker de automação a cada 90 segundos.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
