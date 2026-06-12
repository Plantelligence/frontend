/**
 * useEmailCooldown - Hook para controle de cooldown no reenvio de e-mail.
 *
 * Evita spam de requisições de reenvio de código MFA ou convite.
 * Retorna: {canSend, countdown, startCooldown}
 *   - canSend: boolean indicando se pode enviar
 *   - countdown: segundos restantes até liberar
 *   - startCooldown: inicia o timer (chamar após envio bem-sucedido)
 *
 * O timer padrão é de 60 segundos, configurável via parâmetro.
 */

// useCallback: memoiza as funções para evitar recriações desnecessárias
// useEffect: limpa os timers ao desmontar os componentes
// useRef: armazena IDs de setInterval sem causar re-renders
// useState: mantém os contadores reativos na interface
import { useCallback, useEffect, useRef, useState } from 'react';

// Tempos de espera em segundos após cada envio consecutivo (backoff progressivo)
// Primeiro envio: sem espera; segundo: 30s; terceiro: 60s; quarto: 120s; quinto+: 300s
const COOLDOWN_STEPS = [0, 30, 60, 120, 300]; // seconds after each consecutive send

// Retorna o tempo de espera para o próximo envio com base em quantas vezes já enviou
function getNextCooldown(sendCount) {
  // Garante que não ultrapasse o índice máximo da tabela de cooldowns
  const index = Math.min(sendCount, COOLDOWN_STEPS.length - 1);
  return COOLDOWN_STEPS[index];
}

// Single-instance cooldown (e.g. password reset button)
// Versão para uso em contextos com um único botão de reenvio (ex.: redefinição de senha)
export function useEmailCooldown() {
  // Segundos restantes até poder enviar novamente (0 = liberado)
  const [secondsLeft, setSecondsLeft] = useState(0);
  // Contador de envios para calcular o cooldown progressivo
  const [sendCount, setSendCount] = useState(0);
  // Ref para o ID do setInterval — permite cancelar o timer ao desmontar
  const timerRef = useRef(null);

  // Para o timer e limpa a referência para evitar chamadas após desmontagem
  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Limpa o timer ao desmontar o componente para evitar vazamento de memória
  useEffect(() => () => clearTimer(), []);

  // Chamado após cada envio bem-sucedido: incrementa o contador e inicia o cooldown
  const recordSend = useCallback(() => {
    setSendCount((prev) => {
      const next = prev + 1;
      // Calcula quanto tempo deve esperar com base no número de envios
      const delay = getNextCooldown(next);
      if (delay > 0) {
        setSecondsLeft(delay);
        clearTimer();
        // Decresce o contador a cada segundo até zerar
        timerRef.current = setInterval(() => {
          setSecondsLeft((s) => {
            if (s <= 1) {
              // Quando chegar a zero, para o timer e libera o botão
              clearTimer();
              return 0;
            }
            return s - 1;
          });
        }, 1000);
      }
      return next;
    });
  }, []);

  // canSend: verdadeiro quando não há cooldown ativo (botão liberado)
  return { canSend: secondsLeft === 0, secondsLeft, recordSend };
}

// Per-key cooldown map (e.g. per-user resend invite buttons)
// Versão para múltiplos botões independentes na mesma tela (ex.: reenviar convite por usuário)
// Suporta persistência no localStorage: o cooldown sobrevive a recargas de página.
export function useEmailCooldownMap(fixedCooldown = null) {
  const LS_PREFIX = 'plt_cooldown_end_'; // prefixo de chave no localStorage

  // Calcula segundos restantes a partir do timestamp de fim salvo no localStorage
  function _secondsFromStorage(key) {
    try {
      const end = parseInt(localStorage.getItem(LS_PREFIX + key) || '0', 10);
      const remaining = Math.ceil((end - Date.now()) / 1000);
      return remaining > 0 ? remaining : 0;
    } catch {
      return 0;
    }
  }

  // Inicializa o estado com qualquer cooldown ativo persistido (restaura após F5)
  const [seconds, setSeconds] = useState(() => {
    // Não tenta ler localStorage durante SSR
    if (typeof localStorage === 'undefined') return {};
    try {
      const restored = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(LS_PREFIX)) {
          const mapKey = k.slice(LS_PREFIX.length);
          const remaining = _secondsFromStorage(mapKey);
          if (remaining > 0) restored[mapKey] = remaining;
        }
      }
      return restored;
    } catch {
      return {};
    }
  });

  // Mapa de contadores de envio por chave para o backoff progressivo
  const [counts, setCounts] = useState({});          // { [key]: sendCount }
  // Mapa de IDs de timer para cada chave — permite cancelar timers individualmente
  const timers = useRef({});

  // Restaura timers para chaves com cooldown ativo ao montar o componente
  useEffect(() => {
    Object.entries(seconds).forEach(([key, secs]) => {
      if (secs > 0 && !timers.current[key]) {
        timers.current[key] = setInterval(() => {
          setSeconds((s) => {
            const cur = s[key] ?? 0;
            if (cur <= 1) {
              clearInterval(timers.current[key]);
              timers.current[key] = null;
              try { localStorage.removeItem(LS_PREFIX + key); } catch {}
              return { ...s, [key]: 0 };
            }
            return { ...s, [key]: cur - 1 };
          });
        }, 1000);
      }
    });
    return () => {
      Object.values(timers.current).forEach(clearInterval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Registra um envio para a chave especificada e inicia o cooldown dessa chave
  const recordSend = useCallback((key) => {
    setCounts((prev) => {
      const next = (prev[key] ?? 0) + 1;
      const delay = fixedCooldown !== null ? fixedCooldown : getNextCooldown(next);
      if (delay > 0) {
        // Persiste o timestamp de fim no localStorage para sobreviver a F5
        try { localStorage.setItem(LS_PREFIX + key, String(Date.now() + delay * 1000)); } catch {}
        // Inicializa o contador de segundos para esta chave específica
        setSeconds((s) => ({ ...s, [key]: delay }));
        if (timers.current[key]) clearInterval(timers.current[key]);
        // Decrementa apenas o contador desta chave a cada segundo
        timers.current[key] = setInterval(() => {
          setSeconds((s) => {
            const cur = s[key] ?? 0;
            if (cur <= 1) {
              clearInterval(timers.current[key]);
              timers.current[key] = null;
              try { localStorage.removeItem(LS_PREFIX + key); } catch {}
              return { ...s, [key]: 0 };
            }
            return { ...s, [key]: cur - 1 };
          });
        }, 1000);
      }
      return { ...prev, [key]: next };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fixedCooldown]);

  // Verifica se o botão de uma chave específica está liberado para envio
  const canSend = useCallback((key) => (seconds[key] ?? 0) === 0, [seconds]);
  // Retorna os segundos restantes para uma chave específica
  const secondsLeft = useCallback((key) => seconds[key] ?? 0, [seconds]);

  return { canSend, secondsLeft, recordSend };
}
