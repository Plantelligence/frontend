/**
 * useIdleTimer - Hook de deteccao de inatividade do usuario.
 *
 * Monitora eventos de interacao (mouse, teclado, scroll, touch) e dispara
 * um callback apos o tempo configurado sem atividade.
 *
 * BALANCAMENTO UX / SEGURANCA:
 *   O idle timer NAO faz logout — apenas bloqueia a interface (lock screen).
 *   A sessao JWT permanece valida. Para desbloquear, o usuario informa apenas
 *   a senha (sem MFA), o que confirma presenca sem interromper o fluxo.
 *
 *   Isso e deliberado: operadores que monitoram estufas em turnos longos nao
 *   devem ser forcados a re-autenticar com MFA a cada 30 minutos. O bloquio
 *   de tela e suficiente para proteger o painel caso o operador se afaste.
 *
 * @param {number}   idleMs      Tempo de inatividade em ms antes de chamar onIdle.
 * @param {Function} onIdle      Callback chamado quando inatividade e detectada.
 * @param {boolean}  enabled     Se false, o timer e desativado (default: true).
 *
 * @example
 *   useIdleTimer(30 * 60 * 1000, () => lockSession(), isAuthenticated);
 */

import { useCallback, useEffect, useRef } from 'react';

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
  'visibilitychange',
];

export function useIdleTimer(idleMs, onIdle, enabled = true) {
  const timerRef   = useRef(null);
  const onIdleRef  = useRef(onIdle);
  const enabledRef = useRef(enabled);

  // Mantém referências atualizadas sem re-adicionar listeners
  useEffect(() => { onIdleRef.current  = onIdle;   }, [onIdle]);
  useEffect(() => { enabledRef.current = enabled;  }, [enabled]);

  const resetTimer = useCallback(() => {
    if (!enabledRef.current) return;
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

    // Inicia o timer imediatamente
    resetTimer();

    // Adiciona listeners para qualquer interacao do usuario
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
  }, [enabled, resetTimer]);
}

export default useIdleTimer;
