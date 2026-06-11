/**
 * useIdleTimer - Hook de detecção de inatividade do usuário.
 *
 * Monitora eventos de interação (mouse, teclado, scroll, touch) e dispara
 * um callback após o tempo configurado sem atividade.
 *
 * Persistência entre recargas:
 *   O timestamp da última atividade é gravado no localStorage
 *   ("plantelligence-last-activity"). Na montagem inicial, se o tempo
 *   decorrido já supera idleMs, o callback é disparado imediatamente —
 *   impedindo que um refresh de página contorne o lock.
 *
 *   Em re-ativações (enabled vai de false→true após a montagem inicial,
 *   ex.: navegação para rota não protegida e volta), o timer é sempre
 *   reiniciado do zero — o usuário claramente está presente.
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

// useCallback evita recriar funções desnecessariamente
// useEffect para registrar/remover listeners ao montar/desmontar
// useRef para manter referências mutáveis sem causar re-renders
import { useCallback, useEffect, useRef } from 'react';

// Chave do localStorage para o timestamp da última atividade do usuário
const LAST_ACTIVITY_KEY = 'plantelligence-last-activity';

// Eventos que reiniciam o contador de inatividade.
// mousemove foi intencionalmente omitido — dispara centenas de vezes por
// segundo e não acrescenta cobertura relevante frente aos demais eventos.
const ACTIVITY_EVENTS = [
  'mousedown',
  'keydown',
  'scroll',
  'touchstart',
  'touchmove',
  'click',
  'wheel',
  'pointerdown',
];

// Lê o timestamp da última atividade registrada no localStorage
const readLastActivity = () => {
  try {
    const raw = window.localStorage.getItem(LAST_ACTIVITY_KEY);
    // Converte para número ou retorna null se não existir
    return raw ? Number(raw) : null;
  } catch {
    return null;
  }
};

// Grava o timestamp atual como última atividade do usuário
const writeLastActivity = (ts) => {
  try {
    window.localStorage.setItem(LAST_ACTIVITY_KEY, String(ts));
  } catch {}
};

// Exportado para ser chamado pelo authStore no logout e no desbloqueio
export const clearLastActivity = () => {
  try { window.localStorage.removeItem(LAST_ACTIVITY_KEY); } catch {}
};

export function useIdleTimer(idleMs, onIdle, enabled = true) {
  // Guarda o ID do setTimeout para poder cancelar quando o usuário interage
  const timerRef    = useRef(null);
  // Ref para o callback onIdle — evita recriar listeners quando o callback muda
  const onIdleRef   = useRef(onIdle);
  // Ref para o flag enabled — permite desativar sem remover/readicionar listeners
  const enabledRef  = useRef(enabled);
  // Controla se o efeito já foi ativado ao menos uma vez.
  // Na MONTAGEM INICIAL: usa o lastActivity do localStorage (proteção contra
  // contornar o lock com um refresh de página).
  // Em RE-ATIVAÇÕES (enabled foi false e voltou a true): inicia timer completo —
  // o usuário está claramente presente e não deve ser punido por uma troca de
  // rota momentânea ou re-render do Zustand.
  const mountedRef  = useRef(false);

  // Mantém referências atualizadas sem re-adicionar listeners
  useEffect(() => { onIdleRef.current  = onIdle;   }, [onIdle]);
  useEffect(() => { enabledRef.current = enabled;  }, [enabled]);

  // Reinicia o timer e registra a atividade atual no localStorage
  const resetTimer = useCallback(() => {
    if (!enabledRef.current) return;
    // Atualiza o timestamp para sobreviver a refreshes de página
    writeLastActivity(Date.now());
    if (timerRef.current) clearTimeout(timerRef.current);
    // Agenda o callback de inatividade para daqui a idleMs milissegundos
    timerRef.current = setTimeout(() => {
      if (enabledRef.current) onIdleRef.current?.();
    }, idleMs);
  }, [idleMs]);

  useEffect(() => {
    // Se o timer foi desativado, cancela qualquer timeout pendente e sai
    if (!enabled) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    const isInitialActivation = !mountedRef.current;
    mountedRef.current = true;

    if (isInitialActivation) {
      // ── Montagem inicial ──────────────────────────────────────────────────
      // Verifica se o usuário já estava inativo antes desta carga de página.
      // Isso impede que um refresh contorne o lock screen por inatividade.
      const lastActivity = readLastActivity();
      if (lastActivity !== null) {
        const elapsed = Date.now() - lastActivity;
        if (elapsed >= idleMs) {
          // Inatividade já atingiu o limite — bloqueia imediatamente
          onIdleRef.current?.();
          return;
        }
        // Agenda o restante do tempo que falta até completar o período de inatividade
        const remaining = idleMs - elapsed;
        timerRef.current = setTimeout(() => {
          if (enabledRef.current) onIdleRef.current?.();
        }, remaining);
      } else {
        // Primeira carga sem histórico — inicia o timer completo
        writeLastActivity(Date.now());
        timerRef.current = setTimeout(() => {
          if (enabledRef.current) onIdleRef.current?.();
        }, idleMs);
      }
    } else {
      // ── Re-ativação (enabled voltou a true após ter sido false) ───────────
      // O usuário está claramente presente (navegou de volta à rota protegida,
      // desbloqueou a sessão, etc.). Inicia sempre um timer completo para
      // evitar falsos positivos causados por troca de rota ou re-renders.
      writeLastActivity(Date.now());
      timerRef.current = setTimeout(() => {
        if (enabledRef.current) onIdleRef.current?.();
      }, idleMs);
    }

    // Adiciona listeners para qualquer interação do usuário
    const handleActivity = () => resetTimer();
    // passive: true melhora performance em eventos de scroll e touch
    ACTIVITY_EVENTS.forEach((evt) =>
      window.addEventListener(evt, handleActivity, { passive: true })
    );

    // Cleanup: cancela o timer e remove todos os listeners ao desmontar ou trocar dependências
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach((evt) =>
        window.removeEventListener(evt, handleActivity)
      );
    };
  }, [enabled, idleMs, resetTimer]);
}

export default useIdleTimer;
