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

interface MatchContextType {
  match: MatchState | null;
  ready: boolean;
  history: MatchState[];
  historyIndex: number;
  captains: CaptainInfo[];
  captainSelections: Record<string, Record<string, string[]>>;
  selectedCaptainAId: string | null;
  selectedCaptainBId: string | null;
  setCaptainSelection: (captainId: string, selections: Record<string, string[]>) => void;
  setOperatorSelectedCaptain: (team: TeamId, captainId: string) => void;
  getPlayerUsage: (player: string, categoryGroup: CategoryGroup, opponentTeamName: string) => number;
  canPlayerPlay: (player: string, category: Category, opponentTeamName: string, isFinal: boolean) => boolean;
  
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
  const [captainSelections, setCaptainSelections] = useState<Record<string, Record<string, string[]>>>({});
  const [selectedCaptainAId, setSelectedCaptainAId] = useState<string | null>(null);
  const [selectedCaptainBId, setSelectedCaptainBId] = useState<string | null>(null);
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
      setCaptainSelections(selections as Record<string, Record<string, string[]>>);
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
    setMatch(null);
    setHistory([]);
    setHistoryIndex(-1);
    deleteActiveMatch().catch(console.error);
  }, []);

  const setCaptainSelection = useCallback((captainId: string, selections: Record<string, string[]>) => {
    setCaptainSelections((prev) => ({ ...prev, [captainId]: selections }));
    postCaptainSelection(captainId, selections).catch(console.error);
  }, []);

  const setOperatorSelectedCaptain = useCallback((team: TeamId, captainId: string) => {
    if (team === 'A') {
      setSelectedCaptainAId(captainId);
    } else {
      setSelectedCaptainBId(captainId);
    }
  }, []);

  /** Count how many times a player has played in a category group against a specific opponent team */
  const getPlayerUsage = useCallback((player: string, categoryGroup: CategoryGroup, opponentTeamName: string): number => {
    let count = 0;
    for (const m of matchHistory) {
      if (!m.matchWinner && !m.forfeit) continue; // only count completed matches
      const mGroup = CATEGORY_GROUP_MAP[m.category];
      if (mGroup !== categoryGroup) continue;

      // Check if this match involves the opponent team
      const isOpponentA = m.teamAName === opponentTeamName;
      const isOpponentB = m.teamBName === opponentTeamName;
      if (!isOpponentA && !isOpponentB) continue;

      // Check if the player was in the match
      const teamAPlayers = m.teams.A.players.map((p) => p.name);
      const teamBPlayers = m.teams.B.players.map((p) => p.name);
      if (teamAPlayers.includes(player) || teamBPlayers.includes(player)) {
        count++;
      }
    }
    return count;
  }, [matchHistory]);

  /** Check if a player can still play (hasn't exceeded max games) */
  const canPlayerPlay = useCallback((player: string, category: Category, opponentTeamName: string, isFinal: boolean): boolean => {
    const group = CATEGORY_GROUP_MAP[category];
    const usage = getPlayerUsage(player, group, opponentTeamName);
    const max = isFinal ? MAX_GAMES_PER_PLAYER_FINAL : MAX_GAMES_PER_PLAYER_PER_OPPONENT;
    return usage < max;
  }, [getPlayerUsage]);

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

    const catMeta = ({ mens_single: 'singles', womens_double: 'doubles', mix_double: 'doubles', mens_double_1: 'doubles', mens_double_2: 'doubles', mens_double_3: 'doubles', mens_double_4: 'doubles', mens_double_5: 'doubles' } as const)[category];
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
        getPlayerUsage,
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
