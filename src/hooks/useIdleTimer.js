/**
 * useIdleTimer - Hook de detecção de inatividade do usuário.
 *
 * Monitora eventos de interação (mouse, teclado, scroll, touch) e dispara
 * um callback após o tempo configurado sem atividade.
 *
 * Persistência entre recargas:
 *   O timestamp da última atividade é gravado no localStorage
 *   ("plantelligence-last-activity"). Na montagem, se o tempo decorrido
 *   desde a última atividade já supera idleMs, o callback é disparado
 *   imediatamente — impedindo que um refresh de página contorne o lock.
 *
 * BALANÇO UX / SEGURANÇA:
 *   O idle timer NÃO faz logout — apenas bloqueia a interface (lock screen).
 *   A sessão JWT permanece válida. Para desbloquear, o usuário informa apenas
 *   a senha (sem MFA), o que confirma presença sem interromper o fluxo.
 *
 * @param {number}   idleMs      Tempo de inatividade em ms antes de chamar onIdle.
 * @param {Function} onIdle      Callback chamado quando inatividade é detectada.
 * @param {boolean}  enabled     Se false, o timer é desativado (default: true).
 *
 * @example
 *   useIdleTimer(30 * 60 * 1000, () => lockSession(), isAuthenticated);
 */

import { useCallback, useEffect, useRef } from 'react';

const LAST_ACTIVITY_KEY = 'plantelligence-last-activity';

// Eventos que reiniciam o contador de inatividade
const ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove',
  'keydown',
  'scroll',
  'touchstart',
  'touchmove',
  'click',
  'wheel',
  'pointerdown',
];

const readLastActivity = () => {
  try {
    const raw = window.localStorage.getItem(LAST_ACTIVITY_KEY);
    return raw ? Number(raw) : null;
  } catch {
    return null;
  }
};

const writeLastActivity = (ts) => {
  try {
    window.localStorage.setItem(LAST_ACTIVITY_KEY, String(ts));
  } catch {}
};

export const clearLastActivity = () => {
  try { window.localStorage.removeItem(LAST_ACTIVITY_KEY); } catch {}
};

export function useIdleTimer(idleMs, onIdle, enabled = true) {
  const timerRef   = useRef(null);
  const onIdleRef  = useRef(onIdle);
  const enabledRef = useRef(enabled);

  // Mantém referências atualizadas sem re-adicionar listeners
  useEffect(() => { onIdleRef.current  = onIdle;   }, [onIdle]);
  useEffect(() => { enabledRef.current = enabled;  }, [enabled]);

  const resetTimer = useCallback(() => {
    if (!enabledRef.current) return;
    writeLastActivity(Date.now());
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (enabledRef.current) onIdleRef.current?.();
    }, idleMs);
  }, [idleMs]);

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    // Verifica se o usuário já estava inativo antes desta carga de página
    const lastActivity = readLastActivity();
    if (lastActivity !== null) {
      const elapsed = Date.now() - lastActivity;
      if (elapsed >= idleMs) {
        // Inatividade já atingiu o limite — bloqueia imediatamente
        onIdleRef.current?.();
        return;
      }
      // Agenda o restante do tempo que falta
      const remaining = idleMs - elapsed;
      timerRef.current = setTimeout(() => {
        if (enabledRef.current) onIdleRef.current?.();
      }, remaining);
    } else {
      // Primeira carga — inicia o timer completo e registra a atividade
      writeLastActivity(Date.now());
      timerRef.current = setTimeout(() => {
        if (enabledRef.current) onIdleRef.current?.();
      }, idleMs);
    }

    // Adiciona listeners para qualquer interação do usuário
    const handleActivity = () => resetTimer();
    ACTIVITY_EVENTS.forEach((evt) =>
      window.addEventListener(evt, handleActivity, { passive: true })
    );

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach((evt) =>
        window.removeEventListener(evt, handleActivity)
      );
    };
  }, [enabled, idleMs, resetTimer]);
}

export default useIdleTimer;
