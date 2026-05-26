export type PlayMode = 'singles' | 'doubles';
export type Court = 'left' | 'right';
export type TeamId = 'A' | 'B';

export interface Player {
  name: string;
}

export interface Team {
  id: TeamId;
  name: string;
  players: Player[];
  color?: string;
}

export interface MatchConfig {
  bestOf: number; // odd number: 1, 3, 5, etc.
  pointsToWin: number[]; // per-game, e.g. [21, 21, 15] or [21, 21, 21]
  winByTwo: boolean;
  pointCap: number | null; // null = no cap
  playMode: PlayMode;
  changeEndsAfterGame: boolean;
  changeEndsInDecidingGame: boolean;
  changeEndsAtScore: number; // e.g. 11 in deciding game
}

export interface ServiceState {
  servingTeam: TeamId;
  serverPlayerIndex: number; // relevant for doubles
  court: Court;
}

export interface GameState {
  gameIndex: number;
  scores: Record<TeamId, number>;
  serviceState: ServiceState;
  isComplete: boolean;
  winner: TeamId | null;
}

export interface MatchEvent {
  type: string;
  timestamp: number;
  payload?: Record<string, unknown>;
}

export interface MatchState {
  id: string;
  config: MatchConfig;
  teams: Record<TeamId, Team>;
  games: GameState[];
  currentGameIndex: number;
  gamesWon: Record<TeamId, number>;
  matchWinner: TeamId | null;
  isPaused: boolean;
  eventLog: MatchEvent[];
  startedAt: number;
  endedAt: number | null;
  // For ends tracking
  endsSwapped: boolean;
}

export interface MatchSummary {
  id: string;
  teams: Record<TeamId, Team>;
  gamesWon: Record<TeamId, number>;
  matchWinner: TeamId | null;
  config: MatchConfig;
  startedAt: number;
  endedAt: number | null;
}

export const DEFAULT_CONFIG: MatchConfig = {
  bestOf: 3,
  pointsToWin: [21, 21, 21],
  winByTwo: true,
  pointCap: null,
  playMode: 'singles',
  changeEndsAfterGame: true,
  changeEndsInDecidingGame: true,
  changeEndsAtScore: 11,
};
