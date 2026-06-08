/**
 * WizardOnboardingDispositivo — Wizard multi-etapa para cadastro de ESP32.
 *
 * Etapas do fluxo:
 *   1. Formulário: nome, tipo, Wi-Fi SSID, Wi-Fi senha
 *   2. Firmware:   exibe boot.py e main.py gerados com syntax highlight + copy
 *   3. Aguardando: polling do status de onboarding até receber handshake
 *   4. Sucesso:    dispositivo online e operacional
 *
 * O wizard fecha automaticamente ao atingir o sucesso (ou por botão).
 * Em caso de falha, exibe o erro e permite reiniciar.
 *
 * Props:
 *   estufaId   (string)   — ID da estufa onde o dispositivo será cadastrado
 *   onClose    (function) — callback para fechar o wizard
 *   onSuccess  (function) — callback chamado quando o dispositivo conectar
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import api from '../api/client.js';

// ── Constantes ─────────────────────────────────────────────────────────────────

const TIPO_OPCOES = [
  { value: 'sensor-temperatura',   label: 'Sensor de Temperatura',    icon: 'fa-thermometer-half' },
  { value: 'sensor-umidade',       label: 'Sensor de Umidade do Ar',  icon: 'fa-wind' },
  { value: 'sensor-solo',          label: 'Sensor de Umidade do Solo',icon: 'fa-seedling' },
  { value: 'sensor-luminosidade',  label: 'Sensor de Luminosidade',   icon: 'fa-sun' },
  { value: 'atuador-lampada',      label: 'Atuador: Lâmpada',        icon: 'fa-lightbulb' },
  { value: 'atuador-nebulizador',  label: 'Atuador: Nebulizador',    icon: 'fa-droplet' },
];

const ETAPAS = [
  { id: 'form',      label: 'Dados',     icon: 'fa-pen-to-square' },
  { id: 'firmware',  label: 'Firmware',  icon: 'fa-microchip' },
  { id: 'aguardando',label: 'Aguardando',icon: 'fa-satellite-dish' },
  { id: 'sucesso',   label: 'Pronto',    icon: 'fa-circle-check' },
];

const POLL_INTERVAL_MS    = 3_000;   // verifica o status a cada 3 segundos
const POLL_TIMEOUT_MS     = 120_000; // timeout total: 2 minutos

// ── Componente: bloco de código com copy ───────────────────────────────────────

const CodeViewer = ({ label, code, filename }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50 overflow-hidden">
      {/* cabeçalho */}
      <div className="flex items-center justify-between border-b border-stone-200 bg-stone-100 px-4 py-2">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-file-code text-red-500 text-xs" />
          <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">{filename}</span>
          {label && <span className="rounded bg-stone-200 px-2 py-0.5 text-[10px] text-stone-500">{label}</span>}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-stone-500 transition hover:bg-stone-200 hover:text-stone-800 dark:text-stone-100"
        >
          {copied
            ? <><i className="fa-solid fa-check text-emerald-600" /> Copiado!</>
            : <><i className="fa-regular fa-copy" /> Copiar</>}
        </button>
      </div>
      {/* código */}
      <pre className="max-h-64 overflow-auto p-4 text-[11px] leading-relaxed text-stone-800 dark:text-stone-100 whitespace-pre-wrap break-all">
        {code}
      </pre>
    </div>
  );
};

// ── Componente: barra de progresso das etapas ──────────────────────────────────

const ProgressBar = ({ etapaAtual }) => {
  const idx = ETAPAS.findIndex((e) => e.id === etapaAtual);
  return (
    <div className="mb-6 flex items-center gap-0">
      {ETAPAS.map((etapa, i) => {
        const done    = i < idx;
        const current = i === idx;
        return (
          <React.Fragment key={etapa.id}>
            <div className="flex flex-col items-center gap-1">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                done    ? 'bg-emerald-500 text-white shadow-sm' :
                current ? 'bg-red-600 text-white shadow-md ring-2 ring-red-300' :
                          'bg-stone-200 text-stone-400'
              }`}>
                {done
                  ? <i className="fa-solid fa-check" />
                  : <i className={`fa-solid ${etapa.icon}`} />}
              </div>
              <span className={`text-[10px] font-medium ${current ? 'text-red-600' : done ? 'text-emerald-600' : 'text-stone-400'}`}>
                {etapa.label}
              </span>
            </div>
            {i < ETAPAS.length - 1 && (
              <div className={`mb-4 flex-1 h-0.5 mx-1 transition-all ${i < idx ? 'bg-emerald-400' : 'bg-stone-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ── Componente principal ───────────────────────────────────────────────────────

export const WizardOnboardingDispositivo = ({ estufaId, onClose, onSuccess }) => {
  // ── Estado do wizard ────────────────────────────────────────────────────────
  const [etapa,    setEtapa]    = useState('form');
  const [busy,     setBusy]     = useState(false);
  const [erro,     setErro]     = useState(null);
  const [deletando, setDeletando] = useState(false);

  // ── Estado do formulário ────────────────────────────────────────────────────
  const [nome,     setNome]     = useState('');
  const [tipo,     setTipo]     = useState('sensor-temperatura');
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiSenha,setWifiSenha]= useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);

  // ── Dados do dispositivo criado ─────────────────────────────────────────────
  const [dispositivo, setDispositivo] = useState(null);
  const [firmware,    setFirmware]    = useState(null);

  // ── Polling de status ───────────────────────────────────────────────────────
  const [pollStatus,  setPollStatus]  = useState(null);
  const [pollTimeout, setPollTimeout] = useState(false);
  const pollTimerRef  = useRef(null);
  const timeoutRef    = useRef(null);
  const pollCountRef  = useRef(0);

  // ── Etapa 1: criar dispositivo ─────────────────────────────────────────────

  // Fecha o wizard. Se o dispositivo foi criado mas ainda não conectou, remove do banco e IoT Hub.
  const handleClose = async () => {
    if (etapa === 'sucesso' || !dispositivo?.id) {
      onClose();
      return;
    }
    // Dispositivo criado mas não conectado — pergunta e deleta
    setDeletando(true);
    try {
      await api.delete(`/estufas/${estufaId}/dispositivos/${dispositivo.id}`);
    } catch (_) {
      // falha silenciosa — fecha de qualquer forma
    } finally {
      setDeletando(false);
      onClose();
    }
  };

  const handleCriar = async (e) => {
    e.preventDefault();
    if (!nome.trim()) return;

    setBusy(true);
    setErro(null);
    try {
      const { data } = await api.post(`/estufas/${estufaId}/dispositivos`, {
        nome:      nome.trim(),
        tipo,
        wifi_ssid:  wifiSsid.trim(),
        wifi_senha: wifiSenha,
      });

      if (data.onboarding_status === 'failed') {
        throw new Error(data.onboarding_error || 'Falha ao registrar no IoT Hub.');
      }

      setDispositivo(data);

      // gera firmware imediatamente após criar
      const { data: fw } = await api.get(
        `/estufas/${estufaId}/dispositivos/${data.id}/firmware`,
        { params: { wifi_ssid: wifiSsid.trim(), wifi_senha: wifiSenha } }
      );
      setFirmware(fw);
      setEtapa('firmware');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.detail || err?.message || 'Erro ao criar dispositivo.';
      setErro(msg);
    } finally {
      setBusy(false);
    }
  };

  // ── Etapa 2: usuário viu o firmware, vai gravar no ESP32 ───────────────────

  const handleFirmwareConfirmado = () => {
    setEtapa('aguardando');
  };

  // ── Etapa 3: polling de status até 'connected' ─────────────────────────────

  const iniciarPolling = useCallback(() => {
    pollCountRef.current = 0;
    setPollTimeout(false);
    setPollStatus(null);

    const poll = async () => {
      if (!dispositivo?.id) return;
      try {
        const { data } = await api.get(
          `/estufas/${estufaId}/dispositivos/${dispositivo.id}/onboarding-status`
        );
        setPollStatus(data);
        pollCountRef.current += 1;

        if (data.is_connected) {
          clearInterval(pollTimerRef.current);
          clearTimeout(timeoutRef.current);
          setEtapa('sucesso');
          if (onSuccess) onSuccess(dispositivo);
          return;
        }
      } catch (_err) {
        // falha silenciosa — continua polling
      }
    };

    poll(); // executa imediatamente
    pollTimerRef.current = setInterval(poll, POLL_INTERVAL_MS);

    // timeout de segurança para não pular indefinidamente
    timeoutRef.current = setTimeout(() => {
      clearInterval(pollTimerRef.current);
      setPollTimeout(true);
    }, POLL_TIMEOUT_MS);
  }, [dispositivo, estufaId, onSuccess]);

  useEffect(() => {
    if (etapa === 'aguardando') iniciarPolling();
    return () => {
      clearInterval(pollTimerRef.current);
      clearTimeout(timeoutRef.current);
    };
  }, [etapa, iniciarPolling]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm px-4 py-6">
      <div className="w-full max-w-2xl rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#1c1917] shadow-2xl my-auto">
        {/* cabeçalho */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-700 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-stone-900 dark:text-stone-900 dark:text-stone-50">Adicionar dispositivo IoT</h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">Wizard de onboarding do ESP32</p>
          </div>
          <button type="button" onClick={handleClose} disabled={deletando} className="rounded-lg p-1.5 text-stone-500 dark:text-stone-400 transition hover:bg-stone-100 dark:hover:bg-stone-700 hover:text-stone-800 dark:hover:text-stone-200 disabled:opacity-50">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* conteúdo */}
        <div className="px-6 py-5">
          <ProgressBar etapaAtual={etapa} />

          {/* ── Etapa 1: Formulário ── */}
          {etapa === 'form' && (
            <form onSubmit={handleCriar} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-stone-300">Nome do dispositivo *</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="ex: Sensor Principal Estufa A"
                  required
                  className="w-full rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-4 py-2.5 text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-stone-300">Tipo do dispositivo *</label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-4 py-2.5 text-sm text-stone-900 dark:text-stone-100 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                >
                  {TIPO_OPCOES.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl border border-amber-800/40 bg-amber-900/20 p-4">
                <p className="mb-3 flex items-center gap-2 text-xs font-semibold text-amber-300">
                  <i className="fa-solid fa-wifi" />
                  Rede Wi-Fi do ESP32
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] text-stone-400">Nome da rede (SSID)</label>
                    <input
                      type="text"
                      value={wifiSsid}
                      onChange={(e) => setWifiSsid(e.target.value)}
                      placeholder="MinhaRede"
                      className="w-full rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-stone-400">Senha do Wi-Fi</label>
                    <div className="relative">
                      <input
                        type={mostrarSenha ? 'text' : 'password'}
                        value={wifiSenha}
                        onChange={(e) => setWifiSenha(e.target.value)}
                        placeholder="(opcional)"
                        className="w-full rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 pr-10 text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 outline-none focus:border-red-500"
                      />
                      <button type="button" onClick={() => setMostrarSenha((v) => !v)}
                        className="absolute inset-y-0 right-2.5 text-stone-500 hover:text-stone-300">
                        <i className={`fa-solid ${mostrarSenha ? 'fa-eye-slash' : 'fa-eye'} text-xs`} />
                      </button>
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-[10px] text-stone-500">
                  <i className="fa-solid fa-lock mr-1" />
                  A senha é embutida no firmware e não é armazenada no banco de dados.
                </p>
              </div>

              {erro && (
                <div className="rounded-xl border border-rose-800/40 bg-rose-900/20 px-4 py-3 text-xs text-rose-300">
                  <i className="fa-solid fa-triangle-exclamation mr-1.5" />{erro}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={handleClose} disabled={deletando}
                  className="rounded-xl border border-stone-600 px-4 py-2 text-sm text-stone-300 transition hover:bg-stone-700 disabled:opacity-50">
                  Cancelar
                </button>
                <button type="submit" disabled={busy || !nome.trim()}
                  className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-50">
                  {busy
                    ? <><i className="fa-solid fa-circle-notch fa-spin" /> Registrando...</>
                    : <><i className="fa-solid fa-arrow-right" /> Continuar</>}
                </button>
              </div>
            </form>
          )}

          {/* ── Etapa 2: Firmware ── */}
          {etapa === 'firmware' && firmware && (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-800/40 bg-emerald-900/20 px-4 py-3">
                <p className="text-xs font-semibold text-emerald-300">
                  <i className="fa-solid fa-circle-check mr-1.5" />
                  Dispositivo registrado no Azure IoT Hub com sucesso!
                </p>
                <p className="mt-1 text-[11px] text-emerald-400/80">
                  Device ID: <code className="rounded bg-emerald-900/40 px-1.5 py-0.5 font-mono text-[10px]">{firmware.device_id}</code>
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold text-stone-300">
                  <i className="fa-solid fa-microchip mr-1.5 text-red-400" />
                  Firmware gerado. Grave os dois arquivos no ESP32:
                </p>
                <div className="space-y-3">
                  <CodeViewer label="Credenciais + Wi-Fi" filename="boot.py" code={firmware.boot_py} />
                  <CodeViewer label="Lógica principal" filename="main.py" code={firmware.main_py} />
                </div>
              </div>

              {/* instruções */}
              <div className="rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 px-4 py-3">
                <p className="mb-2 text-xs font-semibold text-stone-300">
                  <i className="fa-solid fa-list-ol mr-1.5 text-amber-400" />
                  Como gravar no ESP32:
                </p>
                <ol className="space-y-1">
                  {(firmware.instrucoes || []).map((inst, i) => (
                    <li key={i} className="text-[11px] text-stone-400">{inst}</li>
                  ))}
                </ol>
              </div>

              <div className="flex justify-between gap-3 pt-2">
                <button type="button" onClick={() => setEtapa('form')}
                  className="rounded-xl border border-stone-600 px-4 py-2 text-sm text-stone-300 transition hover:bg-stone-700">
                  <i className="fa-solid fa-arrow-left mr-1" /> Voltar
                </button>
                <button type="button" onClick={handleFirmwareConfirmado}
                  className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-500">
                  <i className="fa-solid fa-satellite-dish" /> Já gravei — Aguardar conexão
                </button>
              </div>
            </div>
          )}

          {/* ── Etapa 3: Aguardando handshake ── */}
          {etapa === 'aguardando' && (
            <div className="space-y-5 text-center">
              {!pollTimeout ? (
                <>
                  <div className="flex justify-center">
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-red-600/10">
                      <i className="fa-solid fa-satellite-dish text-3xl text-red-500 animate-pulse" />
                      <span className="absolute inset-0 rounded-full border-2 border-red-500/40 animate-ping" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-stone-700 dark:text-stone-200">Aguardando conexão do ESP32...</p>
                    <p className="mt-1 text-xs text-stone-400">
                      Ligue o ESP32. O sistema detectará a conexão automaticamente.
                    </p>
                  </div>

                  {pollStatus && (
                    <div className="rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 px-4 py-3 text-left">
                      <p className="text-[11px] font-semibold text-stone-300 mb-2">Status do onboarding:</p>
                      <div className="space-y-1 text-[11px] text-stone-400">
                        <p><span className="text-stone-500">Status:</span> {pollStatus.onboarding_status || 'aguardando'}</p>
                        <p><span className="text-stone-500">Device:</span> {pollStatus.device_id || 'aguardando'}</p>
                        {pollStatus.last_seen_at && (
                          <p><span className="text-stone-500">Último contato:</span> {new Date(pollStatus.last_seen_at).toLocaleTimeString('pt-BR')}</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-500">
                    <i className="fa-solid fa-circle-notch fa-spin text-red-500" />
                    Verificando a cada 3 segundos... ({Math.round(pollCountRef.current * 3)}s)
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
                      <i className="fa-solid fa-clock text-2xl text-amber-400" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-stone-700 dark:text-stone-200">Tempo limite atingido</p>
                    <p className="mt-1 text-xs text-stone-400">
                      O ESP32 não respondeu em 2 minutos. Verifique se o firmware foi gravado
                      corretamente, se o Wi-Fi está acessível e se as credenciais estão corretas.
                    </p>
                  </div>
                  <div className="flex justify-center gap-3">
                    <button type="button" onClick={() => { setPollTimeout(false); iniciarPolling(); }}
                      className="rounded-xl border border-stone-600 px-4 py-2 text-sm text-stone-300 transition hover:bg-stone-700">
                      <i className="fa-solid fa-rotate mr-1" /> Tentar novamente
                    </button>
                    <button type="button" onClick={() => setEtapa('firmware')}
                      className="rounded-xl border border-amber-700/40 bg-amber-900/20 px-4 py-2 text-sm text-amber-300 transition hover:bg-amber-900/40">
                      <i className="fa-solid fa-file-code mr-1" /> Ver firmware novamente
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Etapa 4: Sucesso ── */}
          {etapa === 'sucesso' && (
            <div className="space-y-5 text-center">
              <div className="flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
                  <i className="fa-solid fa-circle-check text-4xl text-emerald-400" />
                </div>
              </div>
              <div>
                <p className="text-lg font-semibold text-emerald-300">Dispositivo online!</p>
                <p className="mt-1 text-sm text-stone-400">
                  O ESP32 conectou com sucesso e está enviando dados para a estufa.
                </p>
              </div>
              {dispositivo && (
                <div className="rounded-xl border border-emerald-800/30 bg-emerald-900/10 px-5 py-4 text-left">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-400 mb-2">Dispositivo cadastrado</p>
                  <div className="space-y-1 text-xs text-stone-300">
                    <p><span className="text-stone-500">Nome:</span> {dispositivo.nome}</p>
                    <p><span className="text-stone-500">Tipo:</span> {dispositivo.tipo}</p>
                    {firmware?.device_id && <p><span className="text-stone-500">Device ID:</span> <code className="text-[10px] text-emerald-400">{firmware.device_id}</code></p>}
                  </div>
                </div>
              )}
              <button type="button" onClick={onClose}
                className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500">
                <i className="fa-solid fa-check mr-1.5" /> Concluir
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
