import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import type { MatchState, MatchConfig, TeamId, CaptainInfo } from '../types';
import { CAPTAINS } from '../config/players';
import {
  createMatchState,
  scorePoint,
  togglePause,
  editScore,
  switchEnds,
} from '../engine';
import { saveMatch } from '../persistence';

interface MatchContextType {
  match: MatchState | null;
  history: MatchState[];
  historyIndex: number;
  captains: CaptainInfo[];
  captainSelections: Record<string, string[]>;
  selectedCaptainAId: string | null;
  selectedCaptainBId: string | null;
  setCaptainSelection: (captainId: string, players: string[]) => void;
  setOperatorSelectedCaptain: (team: TeamId, captainId: string) => void;
  
  startMatch: (
    config: MatchConfig,
    teamA: { name: string; players: string[] },
    teamB: { name: string; players: string[] },
    firstServer: TeamId
  ) => void;
  point: (team: TeamId) => void;
  undo: () => void;
  redo: () => void;
  pause: () => void;
  edit: (scoreA: number, scoreB: number) => void;
  swapEnds: () => void;
  resetMatch: () => void;
}

const MatchContext = createContext<MatchContextType | null>(null);

export function MatchProvider({ children }: { children: ReactNode }) {
  const [match, setMatch] = useState<MatchState | null>(null);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [history, setHistory] = useState<MatchState[]>([]);
  
  const captains: CaptainInfo[] = CAPTAINS.map((c) => ({
    id: c.id,
    name: c.name,
    players: c.players,
  }));
  const [captainSelections, setCaptainSelections] = useState<Record<string, string[]>>({});
  const [selectedCaptainAId, setSelectedCaptainAId] = useState<string | null>(null);
  const [selectedCaptainBId, setSelectedCaptainBId] = useState<string | null>(null);
  const historyRef = useRef({ history: [] as MatchState[], index: -1 });

  // Keep ref in sync via effect
  useEffect(() => {
    historyRef.current = { history, index: historyIndex };
  });

  const pushState = useCallback((state: MatchState) => {
    const { history: h, index: idx } = historyRef.current;
    const trimmed = h.slice(0, idx + 1);
    const newHistory = [...trimmed, state];
    const newIndex = newHistory.length - 1;
    setHistory(newHistory);
    setHistoryIndex(newIndex);
    setMatch(state);
    saveMatch(state).catch(console.error);
  }, []);

  const startMatch = useCallback(
    (
      config: MatchConfig,
      teamA: { name: string; players: string[] },
      teamB: { name: string; players: string[] },
      firstServer: TeamId
    ) => {
      const state = createMatchState(config, teamA, teamB, firstServer);
      setHistory([state]);
      setHistoryIndex(0);
      setMatch(state);
      saveMatch(state).catch(console.error);
    },
    []
  );

  const point = useCallback(
    (team: TeamId) => {
      if (!match) return;
      const next = scorePoint(match, team);
      if (next !== match) pushState(next);
    },
    [match, pushState]
  );

  const undo = useCallback(() => {
    const { history: h, index: idx } = historyRef.current;
    if (idx > 0) {
      const newIdx = idx - 1;
      setHistoryIndex(newIdx);
      const prev = h[newIdx];
      setMatch(prev);
      saveMatch(prev).catch(console.error);
    }
  }, []);

  const redo = useCallback(() => {
    const { history: h, index: idx } = historyRef.current;
    if (idx < h.length - 1) {
      const newIdx = idx + 1;
      setHistoryIndex(newIdx);
      const next = h[newIdx];
      setMatch(next);
      saveMatch(next).catch(console.error);
    }
  }, []);

  const pause = useCallback(() => {
    if (!match) return;
    const next = togglePause(match);
    pushState(next);
  }, [match, pushState]);

  const edit = useCallback(
    (scoreA: number, scoreB: number) => {
      if (!match) return;
      const next = editScore(match, scoreA, scoreB);
      if (next !== match) pushState(next);
    },
    [match, pushState]
  );

  const swapEnds = useCallback(() => {
    if (!match) return;
    const next = switchEnds(match);
    pushState(next);
  }, [match, pushState]);

  const resetMatch = useCallback(() => {
    setMatch(null);
    setHistory([]);
    setHistoryIndex(-1);
  }, []);

  const setCaptainSelection = useCallback((captainId: string, players: string[]) => {
    setCaptainSelections((prev) => ({ ...prev, [captainId]: players }));
  }, []);

  const setOperatorSelectedCaptain = useCallback((team: TeamId, captainId: string) => {
    if (team === 'A') {
      setSelectedCaptainAId(captainId);
    } else {
      setSelectedCaptainBId(captainId);
    }
  }, []);

  return (
    <MatchContext.Provider
      value={{
        match,
        history,
        historyIndex,
        captains,
        captainSelections,
        selectedCaptainAId,
        selectedCaptainBId,
        setCaptainSelection,
        setOperatorSelectedCaptain,
        startMatch,
        point,
        undo,
        redo,
        pause,
        edit,
        swapEnds,
        resetMatch,
      }}
    >
      {children}
    </MatchContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useMatch() {
  const ctx = useContext(MatchContext);
  if (!ctx) throw new Error('useMatch must be used within MatchProvider');
  return ctx;
}
