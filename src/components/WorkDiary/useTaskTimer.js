import { useState, useCallback, useEffect } from "react";

const useTaskTimer = () => {
  const [timers, setTimers] = useState({}); // { [_key]: { running, startedAt, elapsed } }

  const start = useCallback((key) => {
    setTimers(p => ({
      ...p,
      [key]: { running: true, startedAt: Date.now(), elapsed: p[key]?.elapsed || 0 }
    }));
  }, []);

  const pause = useCallback((key) => {
    setTimers(p => {
      const t = p[key];
      if (!t?.running) return p;
      return {
        ...p,
        [key]: {
          running: false,
          startedAt: null,
          elapsed: t.elapsed + (Date.now() - t.startedAt)
        }
      };
    });
  }, []);

  const stop = useCallback((key) => {
    setTimers(p => {
      const t = p[key];
      if (!t) return p;
      const total = t.elapsed + (t.running ? Date.now() - t.startedAt : 0);
      return { ...p, [key]: { running: false, startedAt: null, elapsed: 0, finalMs: total } };
    });
    // return hours
    return new Promise(res => {
      setTimers(p => {
        const t = p[key];
        const total = t ? t.elapsed + (t.running ? Date.now() - t.startedAt : 0) : 0;
        res(Math.round(total / 36000) / 100); // to hours, 2 decimal
        return { ...p, [key]: { running: false, startedAt: null, elapsed: 0 } };
      });
    });
  }, []);

  const getDisplay = useCallback((key) => {
    const t = timers[key];
    if (!t) return null;
    const ms = t.elapsed + (t.running && t.startedAt ? Date.now() - t.startedAt : 0);
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return {
      display: h > 0
        ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
        : `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`,
      hours: Math.round(ms / 36000) / 100,
      running: t.running || false,
      hasTime: ms > 0,
    };
  }, [timers]);

  // Tick every second for running timers
  useEffect(() => {
    const anyRunning = Object.values(timers).some(t => t?.running);
    if (!anyRunning) return;
    const id = setInterval(() => setTimers(p => ({ ...p })), 1000);
    return () => clearInterval(id);
  }, [timers]);

  return { start, pause, stop, getDisplay, timers };
};
export default useTaskTimer;