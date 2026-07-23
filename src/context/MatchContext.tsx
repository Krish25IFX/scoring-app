import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import type { MatchState, MatchConfig, TeamId, CaptainInfo, Category, ForfeitResult } from '../types';
import { CAPTAINS } from '../config/players';
import { CATEGORY_GROUP_MAP, MAX_GAMES_PER_PLAYER_PER_OPPONENT, MAX_GAMES_PER_PLAYER_FINAL, type CategoryGroup } from '../config/schedule';
import {
  createMatchState,
  scorePoint,
  togglePause,
  editScore,
  switchEnds,
} from '../engine';
import { saveMatch } from '../persistence';
import { postActiveMatch, deleteActiveMatch, fetchCaptainSelections, postCaptainSelection, fetchActiveMatch, fetchAllMatches } from '../api';
import type { CaptainSelectionsMap } from '../api';

interface MatchContextType {
  match: MatchState | null;
  ready: boolean;
  history: MatchState[];
  historyIndex: number;
  captains: CaptainInfo[];
  captainSelections: CaptainSelectionsMap;
  selectedCaptainAId: string | null;
  selectedCaptainBId: string | null;
  setCaptainSelection: (captainId: string, category: string, selections: Record<string, string[]>) => void;
  setOperatorSelectedCaptain: (team: TeamId, captainId: string) => void;
  /** Count how many times a player is selected in a category group against a specific opponent team (from selections) */
  getPlayerSelectionUsage: (player: string, categoryGroup: CategoryGroup, captainId: string, opponentCaptainId: string) => number;
  /** Check if a player can still be selected (hasn't exceeded max games vs this opponent in this category group) */
  canPlayerPlay: (player: string, category: Category, captainId: string, opponentCaptainId: string, isFinal: boolean) => boolean;
  
  startMatch: (
    config: MatchConfig,
    teamA: { name: string; players: string[] },
    teamB: { name: string; players: string[] },
    firstServer: TeamId,
    category?: Category,
    teamAName?: string,
    teamBName?: string,
    firstReceiverPlayerIndex?: number
  ) => void;
  point: (team: TeamId) => void;
  undo: () => void;
  redo: () => void;
  pause: () => void;
  edit: (scoreA: number, scoreB: number) => void;
  swapEnds: () => void;
  resetMatch: () => void;
  recordForfeit: (
    category: Category,
    teamAName: string,
    teamBName: string,
    forfeitingTeam: 'A' | 'B' | 'both',
    isFinal: boolean
  ) => void;
  matchHistory: MatchState[];
  refreshMatchHistory: () => Promise<void>;
  refreshCaptainSelections: () => Promise<void>;
}

const MatchContext = createContext<MatchContextType | null>(null);

export function MatchProvider({ children }: { children: ReactNode }) {
  const [match, setMatch] = useState<MatchState | null>(null);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [history, setHistory] = useState<MatchState[]>([]);
  const [ready, setReady] = useState(false);
  
  const captains: CaptainInfo[] = CAPTAINS.map((c) => ({
    id: c.id,
    name: c.name,
    teamName: c.teamName,
    players: c.players,
  }));
  const [captainSelections, setCaptainSelections] = useState<CaptainSelectionsMap>({});
  const [selectedCaptainAId, setSelectedCaptainAId] = useState<string | null>(() => {
    try { return localStorage.getItem('operator_captainA'); } catch { return null; }
  });
  const [selectedCaptainBId, setSelectedCaptainBId] = useState<string | null>(() => {
    try { return localStorage.getItem('operator_captainB'); } catch { return null; }
  });
  const [matchHistory, setMatchHistory] = useState<MatchState[]>([]);
  const historyRef = useRef({ history: [] as MatchState[], index: -1 });

  // Load active match + captain selections + match history from server on mount
  useEffect(() => {
    const timeout = setTimeout(() => setReady(true), 2000);
    Promise.all([
      fetchActiveMatch().catch(() => null),
      fetchCaptainSelections().catch(() => ({})),
      fetchAllMatches().catch(() => []),
    ]).then(([activeMatch, selections, allMatches]) => {
      clearTimeout(timeout);
      if (activeMatch) {
        setMatch(activeMatch);
        setHistory([activeMatch]);
        setHistoryIndex(0);
      }
      setCaptainSelections(selections as CaptainSelectionsMap);
      setMatchHistory(allMatches as MatchState[]);
      setReady(true);
    });
  }, []);

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
    // Sync to server so spectators on other devices can see it
    postActiveMatch(state).catch(console.error);
    // When a match completes, add it to matchHistory so player usage tracking stays current
    if (state.matchWinner) {
      setMatchHistory((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m.id === state.id)) return prev;
        return [state, ...prev];
      });
    }
  }, []);

  const startMatch = useCallback(
    (
      config: MatchConfig,
      teamA: { name: string; players: string[] },
      teamB: { name: string; players: string[] },
      firstServer: TeamId,
      category?: Category,
      teamAName?: string,
      teamBName?: string,
      firstReceiverPlayerIndex?: number
    ) => {
      const state = createMatchState(config, teamA, teamB, firstServer, category, teamAName, teamBName, firstReceiverPlayerIndex);
      setHistory([state]);
      setHistoryIndex(0);
      setMatch(state);
      setReady(true);
      saveMatch(state).catch(console.error);
      postActiveMatch(state).catch(console.error);
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
      postActiveMatch(prev).catch(console.error);
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
      postActiveMatch(next).catch(console.error);
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
    const currentMatchId = match?.id;
    setMatch(null);
    setHistory([]);
    setHistoryIndex(-1);
    if (currentMatchId) {
      deleteActiveMatch(currentMatchId).catch(console.error);
    }
  }, [match?.id]);

  const setCaptainSelection = useCallback((captainId: string, category: string, selections: Record<string, string[]>) => {
    setCaptainSelections((prev) => {
      const updated = {
        ...prev,
        [captainId]: {
          ...(prev[captainId] || {}),
          [category]: selections,
        },
      };
      // Send the full captain data to server
      postCaptainSelection(captainId, updated[captainId]).catch(console.error);
      return updated;
    });
  }, []);

  const setOperatorSelectedCaptain = useCallback((team: TeamId, captainId: string) => {
    if (team === 'A') {
      setSelectedCaptainAId(captainId);
      try { localStorage.setItem('operator_captainA', captainId); } catch { /* */ }
    } else {
      setSelectedCaptainBId(captainId);
      try { localStorage.setItem('operator_captainB', captainId); } catch { /* */ }
    }
  }, []);

  /** Count how many times a player is selected against a specific opponent in a category group (across all categories in that group) */
  const getPlayerSelectionUsage = useCallback((player: string, categoryGroup: CategoryGroup, captainId: string, opponentCaptainId: string): number => {
    const captainData = captainSelections[captainId];
    if (!captainData) return 0;
    let count = 0;
    for (const [cat, opponents] of Object.entries(captainData)) {
      // Only count categories in the same group
      if (CATEGORY_GROUP_MAP[cat as Category] !== categoryGroup) continue;
      const players = opponents[opponentCaptainId];
      if (players && players.includes(player)) {
        count++;
      }
    }
    return count;
  }, [captainSelections]);

  /** Check if a player can still be selected (hasn't exceeded max games vs this opponent in this category group) */
  const canPlayerPlay = useCallback((player: string, category: Category, captainId: string, opponentCaptainId: string, isFinal: boolean): boolean => {
    const group = CATEGORY_GROUP_MAP[category];
    const usage = getPlayerSelectionUsage(player, group, captainId, opponentCaptainId);
    const max = isFinal ? MAX_GAMES_PER_PLAYER_FINAL : MAX_GAMES_PER_PLAYER_PER_OPPONENT;
    return usage < max;
  }, [getPlayerSelectionUsage]);

  /** Record a forfeit match */
  const recordForfeit = useCallback((
    category: Category,
    teamAName: string,
    teamBName: string,
    forfeitingTeam: 'A' | 'B' | 'both',
    isFinal: boolean
  ) => {
    const forfeit: ForfeitResult = forfeitingTeam === 'both'
      ? { forfeited: true, forfeitingTeam: 'both', gamePointsWinner: 0, gamePointsLoser: 0, setPointsWinner: 0, setPointsLoser: 0 }
      : { forfeited: true, forfeitingTeam, gamePointsWinner: 22, gamePointsLoser: 0, setPointsWinner: 1, setPointsLoser: 0 };

    const catMeta = ({ mens_single: 'singles', womens_double: 'doubles', mix_double: 'doubles', mens_double_1: 'doubles', mens_double_2: 'doubles', mens_double_3: 'doubles', mens_double_4: 'doubles', mens_double_5: 'doubles', mens_double_6: 'doubles' } as const)[category];
    const config: MatchConfig = {
      bestOf: 1,
      pointsToWin: [21],
      winByTwo: false,
      pointCap: null,
      playMode: catMeta === 'singles' ? 'singles' : 'doubles',
      category,
      changeEndsAfterGame: false,
      changeEndsInDecidingGame: false,
      changeEndsAtScore: 0,
    };

    const winner: TeamId | null = forfeitingTeam === 'both' ? null : (forfeitingTeam === 'A' ? 'B' : 'A');
    const now = Date.now();
    const forfeitMatch: MatchState = {
      id: `forfeit-${now}-${Math.random().toString(36).slice(2, 8)}`,
      config,
      teams: {
        A: { id: 'A', name: teamAName, players: [{ name: 'Forfeit' }] },
        B: { id: 'B', name: teamBName, players: [{ name: 'Forfeit' }] },
      },
      games: [{
        gameIndex: 0,
        scores: forfeitingTeam === 'both' ? { A: 0, B: 0 } : (forfeitingTeam === 'A' ? { A: 0, B: 22 } : { A: 22, B: 0 }),
        serviceState: { servingTeam: 'A', serverPlayerIndex: 0, court: 'right' },
        isComplete: true,
        winner,
      }],
      currentGameIndex: 0,
      gamesWon: forfeitingTeam === 'both' ? { A: 0, B: 0 } : (forfeitingTeam === 'A' ? { A: 0, B: 1 } : { A: 1, B: 0 }),
      matchWinner: winner,
      isPaused: false,
      eventLog: [{ type: 'FORFEIT', timestamp: now, payload: { forfeitingTeam } }],
      startedAt: now,
      endedAt: now,
      endsSwapped: false,
      category,
      teamAName,
      teamBName,
      firstServer: 'A',
      firstReceiverPlayerIndex: 0,
      forfeit,
    };

    // Save forfeit match
    saveMatch(forfeitMatch).catch(console.error);
    postActiveMatch(forfeitMatch).catch(console.error);
    setMatchHistory((prev) => [forfeitMatch, ...prev]);
  }, []);

  /** Re-fetch match history from server (ensures captain page has fresh data) */
  const refreshMatchHistory = useCallback(async () => {
    try {
      const allMatches = await fetchAllMatches();
      setMatchHistory(allMatches);
    } catch {
      // silently fail — use whatever we have
    }
  }, []);

  /** Re-fetch captain selections from server */
  const refreshCaptainSelections = useCallback(async () => {
    try {
      const selections = await fetchCaptainSelections();
      setCaptainSelections(selections);
    } catch {
      // silently fail
    }
  }, []);

  return (
    <MatchContext.Provider
      value={{
        match,
        ready,
        history,
        historyIndex,
        captains,
        captainSelections,
        selectedCaptainAId,
        selectedCaptainBId,
        setCaptainSelection,
        setOperatorSelectedCaptain,
        getPlayerSelectionUsage,
        canPlayerPlay,
        startMatch,
        point,
        undo,
        redo,
        pause,
        edit,
        swapEnds,
        resetMatch,
        recordForfeit,
        matchHistory,
        refreshMatchHistory,
        refreshCaptainSelections,
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
