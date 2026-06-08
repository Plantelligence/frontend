/**
 * ControlesPanel — Painel de controle remoto dos atuadores da estufa.
 *
 * Envia comandos Cloud-to-Device (C2D) via Azure IoT Hub para o ESP32,
 * que aciona os relés da Lâmpada e do Nebulizador em tempo real.
 *
 * Fluxo:
 *   Botão → POST /api/estufas/{id}/atuadores/{device_id}/ligar|desligar
 *         → Backend → IoT Hub C2D → ESP32 → Relé → Telemetria de confirmação
 *
 * Estado atual dos atuadores é lido da última telemetria recebida do ESP32
 * (campos atuador_lampada e atuador_nebulizador).
 */

import React, { useState } from 'react';
import api from '../api/client.js';

// ── Configuração dos atuadores ─────────────────────────────────────────────────

const ATUADORES_CONFIG = [
  {
    tipo:        'atuador-lampada',
    parametro:   'lampada',          // parâmetro enviado no C2D ao ESP32
    telKey:      'atuador_lampada',   // chave na telemetria do ESP32
    label:       'Lâmpada',
    icon:        'fa-lightbulb',
    cor:         'amber',
    descricao:   'Controla iluminação e temperatura da estufa',
    efeito:      'Aumenta temperatura e luminosidade',
  },
  {
    tipo:        'atuador-nebulizador',
    parametro:   'nebulizador',
    telKey:      'atuador_nebulizador',
    label:       'Nebulizador',
    icon:        'fa-droplet',
    cor:         'blue',
    descricao:   'Controla umidade do ar e resfriamento da estufa',
    efeito:      'Aumenta umidade e reduz temperatura',
  },
];

// ── Card de atuador ────────────────────────────────────────────────────────────

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
};

const AtuadorCard = ({ config, device, estadoAtual, onComando, readOnly }) => {
  const [busy, setBusy]     = useState(false);
  const [feedback, setFeedback] = useState(null); // {ok, msg}

  const ligado = estadoAtual === 'on';
  const c = corClasses[config.cor];
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
      onComando?.(config.tipo, acao);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Falha ao enviar comando. Verifique a conexão do dispositivo.';
      setFeedback({ ok: false, msg });
    } finally {
      setBusy(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  return (
    <div className={`rounded-2xl border-2 p-5 flex flex-col gap-4 transition-all duration-300 ${
      ligado ? `${c.on} ring-2 ${c.ring} ring-opacity-40` : 'bg-white dark:bg-stone-900/35 border-stone-200 dark:border-stone-800/60'
    }`}>
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${
            ligado ? 'bg-white dark:bg-stone-800 shadow-sm' : 'bg-stone-100 dark:bg-stone-700'
          }`}>
            <i className={`fa-solid ${config.icon} text-xl ${ligado ? c.icon : 'text-stone-400'}`} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-800 dark:text-stone-100">{config.label}</h3>
            <p className="text-xs text-slate-500 dark:text-stone-400 mt-0.5">{config.descricao}</p>
          </div>
        </div>

        {/* Badge de estado */}
        <span className={`flex-shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
          ligado
            ? `${c.badge}`
            : 'bg-stone-100 text-stone-500 border-stone-200'
        }`}>
          {ligado ? '● LIGADO' : '○ DESLIGADO'}
        </span>
      </div>

      {/* Info de efeito */}
      <div className="rounded-xl bg-white/70 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/40 px-3 py-2.5 flex items-center gap-2">
        <i className="fa-solid fa-circle-info text-xs text-stone-400" />
        <p className="text-[11px] text-slate-500 dark:text-stone-400">{config.efeito}</p>
      </div>

      {/* Sem dispositivo cadastrado */}
      {semDispositivo && (
        <div className="rounded-xl border border-dashed border-stone-300 dark:border-stone-700/40 bg-stone-50 dark:bg-stone-800/40 px-3 py-3 text-center">
          <p className="text-[11px] text-slate-500 dark:text-stone-400">
            Nenhum dispositivo do tipo <strong>{config.label}</strong> cadastrado.
          </p>
          <p className="text-[10px] text-slate-400 dark:text-stone-500 mt-0.5">
            Adicione na aba Dispositivos para habilitar o controle.
          </p>
        </div>
      )}

      {/* Feedback de comando */}
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

      {/* Botões de comando */}
      {!readOnly && (
        <div className="flex gap-2 mt-auto">
          <button
            type="button"
            onClick={() => enviarComando('ligar')}
            disabled={busy || ligado || semDispositivo}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
              !ligado && !semDispositivo ? `${c.btn} shadow-sm` : 'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-600'
            }`}
          >
            {busy && !ligado ? (
              <><i className="fa-solid fa-circle-notch fa-spin mr-1.5" />Enviando...</>
            ) : (
              <><i className="fa-solid fa-power-off mr-1.5" />Ligar</>
            )}
          </button>
          <button
            type="button"
            onClick={() => enviarComando('desligar')}
            disabled={busy || !ligado || semDispositivo}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
              ligado && !semDispositivo ? `${c.btnOff}` : 'bg-stone-100 dark:bg-stone-800 text-stone-300 dark:text-stone-600'
            }`}
          >
            {busy && ligado ? (
              <><i className="fa-solid fa-circle-notch fa-spin mr-1.5" />Enviando...</>
            ) : (
              <><i className="fa-solid fa-stop mr-1.5" />Desligar</>
            )}
          </button>
        </div>
      )}

      {readOnly && (
        <p className="text-[11px] text-center text-slate-400 dark:text-stone-500">
          <i className="fa-solid fa-lock mr-1" />Perfil somente leitura — sem permissão de controle
        </p>
      )}
    </div>
  );
};

// ── Componente principal ───────────────────────────────────────────────────────

export const ControlesPanel = ({ _greenhouse, devices, devicesLoading, telemetry, readOnly }) => {
  const [estadosLocais, setEstadosLocais] = useState({});

  // Lê o estado real da última telemetria do ESP32
  const getEstadoAtual = (telKey) => {
    // Prioriza estado local otimista (após comando enviado)
    if (estadosLocais[telKey] !== undefined) return estadosLocais[telKey];
    // Fallback para telemetria recebida
    return telemetry?.[telKey] ?? null;
  };

  const handleComando = (tipo, acao) => {
    const telKey = ATUADORES_CONFIG.find((c) => c.tipo === tipo)?.telKey;
    if (telKey) {
      // Atualiza estado local otimistamente enquanto aguarda telemetria
      setEstadosLocais((prev) => ({ ...prev, [telKey]: acao === 'ligar' ? 'on' : 'off' }));
    }
  };

  const findDevice = (tipo) => devices?.find((d) => d.type === tipo) ?? null;

  const temAtuadores = devices?.some((d) => d.type?.startsWith('atuador-'));

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
          {/* Grid de atuadores */}
          <div className="grid gap-4 sm:grid-cols-2">
            {ATUADORES_CONFIG.map((config) => (
              <AtuadorCard
                key={config.tipo}
                config={config}
                device={findDevice(config.tipo)}
                estadoAtual={getEstadoAtual(config.telKey)}
                onComando={handleComando}
                readOnly={readOnly}
              />
            ))}
          </div>

          {/* Aviso se não há atuadores cadastrados */}
          {!temAtuadores && (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 dark:bg-stone-800/40 p-8 text-center">
              <i className="fa-solid fa-plug text-2xl text-stone-300 mb-3 block" />
              <p className="text-sm font-medium text-slate-600 dark:text-stone-400">Nenhum atuador cadastrado nesta estufa</p>
              <p className="mt-1 text-xs text-slate-400 dark:text-stone-500">
                Vá até a aba Dispositivos, adicione uma Lâmpada e/ou um Nebulizador para habilitar o controle remoto.
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
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
