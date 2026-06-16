import { useState, useEffect } from 'react';

export function useMatchTimer(startedAt: number, endedAt: number | null, isPaused: boolean) {
  const [elapsed, setElapsed] = useState(
    endedAt ? endedAt - startedAt : Date.now() - startedAt
  );

  useEffect(() => {
    if (endedAt || isPaused) {
      setElapsed(endedAt ? endedAt - startedAt : Date.now() - startedAt);
      return;
    }
    const id = setInterval(() => setElapsed(Date.now() - startedAt), 1000);
    return () => clearInterval(id);
  }, [startedAt, endedAt, isPaused]);

  const totalSeconds = Math.floor(elapsed / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
