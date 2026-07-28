export type PlayMode = 'singles' | 'doubles';
export type Court = 'left' | 'right';
export type TeamId = 'A' | 'B';

export type Category =
  | 'mens_single'
  | 'womens_double'
  | 'mix_double'
  | 'mens_double_1'
  | 'mens_double_2'
  | 'mens_double_3'
  | 'mens_double_4'
  | 'mens_double_5'
  | 'mens_double_6'
  | 'mens_double_7';

export const CATEGORIES: { id: Category; label: string; mode: PlayMode }[] = [
  { id: 'mens_single', label: "Men's Single (17th Jul)", mode: 'singles' },
  { id: 'womens_double', label: "Women's Double (22nd Jul)", mode: 'doubles' },
  { id: 'mix_double', label: "Mix Double (15th Jul)", mode: 'doubles' },
  { id: 'mens_double_1', label: "Men's Double (13th Jul)", mode: 'doubles' },
  { id: 'mens_double_2', label: "Men's Double (14th Jul)", mode: 'doubles' },
  { id: 'mens_double_3', label: "Men's Double (16th Jul)", mode: 'doubles' },
  { id: 'mens_double_4', label: "Men's Double (20th Jul)", mode: 'doubles' },
  { id: 'mens_double_5', label: "Men's Double (21st Jul)", mode: 'doubles' },
  { id: 'mens_double_6', label: "Men's Double (23rd Jul)", mode: 'doubles' },
  { id: 'mens_double_7', label: "Men's Double (28th Jul)", mode: 'doubles' },
];

export interface Player {
  name: string;
}

export interface CaptainInfo {
  id: string;
  name: string;
  teamName: string;
  players: string[];
}

export interface Team {
  id: TeamId;
  name: string;
  players: Player[];
  color?: string;
}

export interface MatchConfig {
  bestOf: number; // odd number: 1, 3, 5, etc.
  pointsToWin: number[]; // per-game, e.g. [11, 11, 11]
  winByTwo: boolean;
  pointCap: number | null; // 15 = max 15 on deuce
  playMode: PlayMode;
  category: Category;
  changeEndsAfterGame: boolean;
  changeEndsInDecidingGame: boolean;
  changeEndsAtScore: number; // not used in this tournament
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
  // Tournament metadata
  category: Category;
  teamAName: string; // Captain team name for standings
  teamBName: string;
  firstServer: TeamId;
  firstReceiverPlayerIndex: number; // for doubles: which player receives first
  // Forfeit
  forfeit?: ForfeitResult;
}

export interface ForfeitResult {
  forfeited: true;
  forfeitingTeam: TeamId | 'both'; // 'both' = neither team can play
  gamePointsWinner: number; // 22 for normal forfeit, 0 for both
  gamePointsLoser: number;  // 0
  setPointsWinner: number;  // 1 for normal forfeit, 0 for both
  setPointsLoser: number;   // 0
}

export interface MatchSummary {
  id: string;
  teams: Record<TeamId, Team>;
  gamesWon: Record<TeamId, number>;
  matchWinner: TeamId | null;
  config: MatchConfig;
  startedAt: number;
  endedAt: number | null;
  games: GameState[];
  category?: Category;
  teamAName?: string; // Captain team name (for standings)
  teamBName?: string;
}

/** Tournament standings row for a team */
export interface StandingsRow {
  teamName: string;
  gamesWon: number; // complete match wins
  setsWon: number;  // individual game/set wins across all matches
  totalPoints: number;
  totalOpponentPoints: number;
  rankingPoints: number; // totalPoints - totalOpponentPoints
  rank: number;
}

export const DEFAULT_CONFIG: MatchConfig = {
  bestOf: 3,
  pointsToWin: [11, 11, 11],
  winByTwo: true,
  pointCap: 15,
  playMode: 'singles',
  category: 'mens_single',
  changeEndsAfterGame: true,
  changeEndsInDecidingGame: false,
  changeEndsAtScore: 0,
};
