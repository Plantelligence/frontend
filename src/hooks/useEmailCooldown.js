import { useCallback, useEffect, useRef, useState } from 'react';

const COOLDOWN_STEPS = [0, 30, 60, 120, 300]; // seconds after each consecutive send

function getNextCooldown(sendCount) {
  const index = Math.min(sendCount, COOLDOWN_STEPS.length - 1);
  return COOLDOWN_STEPS[index];
}

// Single-instance cooldown (e.g. password reset button)
export function useEmailCooldown() {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [sendCount, setSendCount] = useState(0);
  const timerRef = useRef(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => () => clearTimer(), []);

  const recordSend = useCallback(() => {
    setSendCount((prev) => {
      const next = prev + 1;
      const delay = getNextCooldown(next);
      if (delay > 0) {
        setSecondsLeft(delay);
        clearTimer();
        timerRef.current = setInterval(() => {
          setSecondsLeft((s) => {
            if (s <= 1) {
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

  return { canSend: secondsLeft === 0, secondsLeft, recordSend };
}

// Per-key cooldown map (e.g. per-user resend invite buttons)
export function useEmailCooldownMap() {
  const [seconds, setSeconds] = useState({});       // { [key]: secondsLeft }
  const [counts, setCounts] = useState({});          // { [key]: sendCount }
  const timers = useRef({});

  useEffect(() => {
    return () => {
      Object.values(timers.current).forEach(clearInterval);
    };
  }, []);

  const recordSend = useCallback((key) => {
    setCounts((prev) => {
      const next = (prev[key] ?? 0) + 1;
      const delay = getNextCooldown(next);
      if (delay > 0) {
        setSeconds((s) => ({ ...s, [key]: delay }));
        if (timers.current[key]) clearInterval(timers.current[key]);
        timers.current[key] = setInterval(() => {
          setSeconds((s) => {
            const cur = s[key] ?? 0;
            if (cur <= 1) {
              clearInterval(timers.current[key]);
              timers.current[key] = null;
              return { ...s, [key]: 0 };
            }
            return { ...s, [key]: cur - 1 };
          });
        }, 1000);
      }
      return { ...prev, [key]: next };
    });
  }, []);

  const canSend = useCallback((key) => (seconds[key] ?? 0) === 0, [seconds]);
  const secondsLeft = useCallback((key) => seconds[key] ?? 0, [seconds]);

  return { canSend, secondsLeft, recordSend };
}
