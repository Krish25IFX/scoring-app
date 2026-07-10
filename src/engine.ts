import type { MatchConfig, MatchState, GameState, ServiceState, TeamId, Court, Category } from './types';

// Generate a unique ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

// Determine service court based on score parity (BWF rules)
export function getServiceCourt(score: number): Court {
  return score % 2 === 0 ? 'right' : 'left';
}

// Create initial service state
export function createInitialServiceState(servingTeam: TeamId): ServiceState {
  return {
    servingTeam,
    serverPlayerIndex: 0,
    court: 'right', // Even score (0) = right court
  };
}

// Create a new game state
export function createGameState(gameIndex: number, serviceState: ServiceState): GameState {
  return {
    gameIndex,
    scores: { A: 0, B: 0 },
    serviceState: { ...serviceState },
    isComplete: false,
    winner: null,
  };
}

// Check if a game is won
export function checkGameWon(
  scores: Record<TeamId, number>,
  config: MatchConfig,
  gameIndex: number
): TeamId | null {
  const pointsToWin = config.pointsToWin[gameIndex] ?? config.pointsToWin[0];
  const scoreA = scores.A;
  const scoreB = scores.B;

  if (config.winByTwo) {
    if (config.pointCap !== null) {
      // With cap: first to cap wins
      if (scoreA >= config.pointCap) return 'A';
      if (scoreB >= config.pointCap) return 'B';
    }
    // Win by 2 after reaching pointsToWin
    if (scoreA >= pointsToWin && scoreA - scoreB >= 2) return 'A';
    if (scoreB >= pointsToWin && scoreB - scoreA >= 2) return 'B';
  } else {
    // Simple first to N
    if (scoreA >= pointsToWin) return 'A';
    if (scoreB >= pointsToWin) return 'B';
  }

  return null;
}

// Check if match is won
export function checkMatchWon(
  gamesWon: Record<TeamId, number>,
  config: MatchConfig
): TeamId | null {
  const gamesToWin = Math.ceil(config.bestOf / 2);
  if (gamesWon.A >= gamesToWin) return 'A';
  if (gamesWon.B >= gamesToWin) return 'B';
  return null;
}

// Determine next service state after a rally (BWF rules)
export function getNextServiceState(
  currentService: ServiceState,
  rallyWinner: TeamId,
  scores: Record<TeamId, number>,
  config: MatchConfig,
  firstServer: TeamId = 'A',
  firstReceiverPlayerIndex: number = 0
): ServiceState {
  if (config.playMode === 'singles') {
    // In singles: if server wins, they keep serve; court switches based on server's score.
    if (rallyWinner === currentService.servingTeam) {
      return {
        ...currentService,
        court: getServiceCourt(scores[currentService.servingTeam]),
      };
    } else {
      // Service passes to other team
      return {
        servingTeam: rallyWinner,
        serverPlayerIndex: 0,
        court: getServiceCourt(scores[rallyWinner]),
      };
    }
  } else {
    // Doubles: serving side retains serve if they win
    if (rallyWinner === currentService.servingTeam) {
      // Same server, court alternates based on serving team's score parity
      return {
        ...currentService,
        court: getServiceCourt(scores[currentService.servingTeam]),
      };
    } else {
      // Service passes to receiving team
      // Determine which player serves based on score parity and initial arrangement
      const winnerScore = scores[rallyWinner];
      let serverPlayerIndex: number;
      
      if (rallyWinner === firstServer) {
        // This is the team that served first in the game — player 0 was first server
        serverPlayerIndex = winnerScore % 2 === 0 ? 0 : 1;
      } else {
        // This is the team that received first — use firstReceiverPlayerIndex
        // Even score: player in right court serves (= firstReceiverPlayerIndex)
        // Odd score: player in left court serves (= 1 - firstReceiverPlayerIndex)
        serverPlayerIndex = winnerScore % 2 === 0 ? firstReceiverPlayerIndex : (1 - firstReceiverPlayerIndex);
      }

      return {
        servingTeam: rallyWinner,
        serverPlayerIndex,
        court: getServiceCourt(winnerScore),
      };
    }
  }
}

// Check if ends should change in the deciding game
export function shouldChangeEndsInDecidingGame(
  scores: Record<TeamId, number>,
  config: MatchConfig,
  currentGameIndex: number,
  alreadySwapped: boolean
): boolean {
  if (!config.changeEndsInDecidingGame) return false;
  if (alreadySwapped) return false;

  const isDecidingGame = currentGameIndex === config.bestOf - 1;
  if (!isDecidingGame) return false;

  const leadingScore = Math.max(scores.A, scores.B);
  return leadingScore === config.changeEndsAtScore;
}

// Create initial match state
export function createMatchState(
  config: MatchConfig,
  teamA: { name: string; players: string[] },
  teamB: { name: string; players: string[] },
  firstServer: TeamId,
  category: Category = 'mens_single',
  teamAName: string = '',
  teamBName: string = '',
  firstReceiverPlayerIndex: number = 0
): MatchState {
  const teams = {
    A: {
      id: 'A' as TeamId,
      name: teamA.name,
      players: teamA.players.map((name) => ({ name })),
    },
    B: {
      id: 'B' as TeamId,
      name: teamB.name,
      players: teamB.players.map((name) => ({ name })),
    },
  };

  const serviceState = createInitialServiceState(firstServer);
  const firstGame = createGameState(0, serviceState);

  return {
    id: generateId(),
    config,
    teams,
    games: [firstGame],
    currentGameIndex: 0,
    gamesWon: { A: 0, B: 0 },
    matchWinner: null,
    isPaused: false,
    eventLog: [{ type: 'MATCH_STARTED', timestamp: Date.now() }],
    startedAt: Date.now(),
    endedAt: null,
    endsSwapped: false,
    category,
    teamAName: teamAName || teamA.name,
    teamBName: teamBName || teamB.name,
    firstServer,
    firstReceiverPlayerIndex,
  };
}

// Score a point for a team
export function scorePoint(state: MatchState, team: TeamId): MatchState {
  if (state.matchWinner) return state;
  if (state.isPaused) return state;

  const currentGame = state.games[state.currentGameIndex];
  if (currentGame.isComplete) return state;

  const newScores = { ...currentGame.scores, [team]: currentGame.scores[team] + 1 };
  const newServiceState = getNextServiceState(
    currentGame.serviceState,
    team,
    newScores,
    state.config,
    state.firstServer,
    state.firstReceiverPlayerIndex
  );

  const winner = checkGameWon(newScores, state.config, state.currentGameIndex);

  const updatedGame: GameState = {
    ...currentGame,
    scores: newScores,
    serviceState: newServiceState,
    isComplete: winner !== null,
    winner,
  };

  const newGames = [...state.games];
  newGames[state.currentGameIndex] = updatedGame;

  let newGamesWon = { ...state.gamesWon };
  let matchWinner: TeamId | null = state.matchWinner;
  let newCurrentGameIndex = state.currentGameIndex;
  let endsSwapped = state.endsSwapped;

  if (winner) {
    newGamesWon = { ...newGamesWon, [winner]: newGamesWon[winner] + 1 };
    matchWinner = checkMatchWon(newGamesWon, state.config);

    if (!matchWinner) {
      // Start next game
      newCurrentGameIndex = state.currentGameIndex + 1;
      // In a new game, the winner of the previous game serves first
      const nextServiceState = createInitialServiceState(winner);
      const nextGame = createGameState(newCurrentGameIndex, nextServiceState);
      newGames.push(nextGame);
      endsSwapped = false; // Reset for new game; ends change after game handled by UI
    }
  } else {
    // Check for ends change in deciding game
    if (shouldChangeEndsInDecidingGame(newScores, state.config, state.currentGameIndex, endsSwapped)) {
      endsSwapped = true;
    }
  }

  const event: import('./types').MatchEvent = {
    type: 'POINT',
    timestamp: Date.now(),
    payload: { team, gameIndex: state.currentGameIndex, scores: newScores },
  };

  return {
    ...state,
    games: newGames,
    currentGameIndex: newCurrentGameIndex,
    gamesWon: newGamesWon,
    matchWinner,
    endsSwapped,
    endedAt: matchWinner ? Date.now() : null,
    eventLog: [...state.eventLog, event],
  };
}

// Undo last point (event sourcing approach)
export function undoLastPoint(state: MatchState): MatchState {
  // Find the last POINT event
  const lastPointIdx = findLastIndex(state.eventLog, (e) => e.type === 'POINT');
  if (lastPointIdx === -1) return state;

  // Replay all events except the last point
  const eventsWithout = [...state.eventLog.slice(0, lastPointIdx), ...state.eventLog.slice(lastPointIdx + 1)];

  // Rebuild state from scratch
  return replayEvents(state.config, state.teams, eventsWithout);
}

// Replay events to rebuild state
function replayEvents(
  config: MatchConfig,
  teams: Record<TeamId, import('./types').Team>,
  events: import('./types').MatchEvent[]
): MatchState {
  // Find the initial server from the first point event or default to A
  const firstServer: TeamId = 'A';
  const startEvent = events.find((e) => e.type === 'MATCH_STARTED');

  const serviceState = createInitialServiceState(firstServer);
  const firstGame = createGameState(0, serviceState);

  let state: MatchState = {
    id: generateId(),
    config,
    teams,
    games: [firstGame],
    currentGameIndex: 0,
    gamesWon: { A: 0, B: 0 },
    matchWinner: null,
    isPaused: false,
    eventLog: startEvent ? [startEvent] : [{ type: 'MATCH_STARTED', timestamp: Date.now() }],
    startedAt: startEvent?.timestamp ?? Date.now(),
    endedAt: null,
    endsSwapped: false,
    category: config.category,
    teamAName: teams.A.name,
    teamBName: teams.B.name,
    firstServer,
    firstReceiverPlayerIndex: 0,
  };

  for (const event of events) {
    if (event.type === 'POINT' && event.payload) {
      state = scorePoint(state, event.payload.team as TeamId);
    } else if (event.type === 'PAUSE') {
      state = { ...state, isPaused: true };
    } else if (event.type === 'RESUME') {
      state = { ...state, isPaused: false };
    }
  }

  return state;
}

// Toggle pause
export function togglePause(state: MatchState): MatchState {
  const isPaused = !state.isPaused;
  const event: import('./types').MatchEvent = {
    type: isPaused ? 'PAUSE' : 'RESUME',
    timestamp: Date.now(),
  };
  return { ...state, isPaused, eventLog: [...state.eventLog, event] };
}

// Edit score directly
export function editScore(state: MatchState, scoreA: number, scoreB: number): MatchState {
  if (state.matchWinner) return state;

  const currentGame = state.games[state.currentGameIndex];
  const newScores = { A: Math.max(0, scoreA), B: Math.max(0, scoreB) };
  const winner = checkGameWon(newScores, state.config, state.currentGameIndex);

  // Recalculate service state based on new scores
  // After an edit, server is whoever last scored (simplified)
  const newServiceState: ServiceState = {
    ...currentGame.serviceState,
    court: getServiceCourt(newScores[currentGame.serviceState.servingTeam]),
  };

  const updatedGame: GameState = {
    ...currentGame,
    scores: newScores,
    serviceState: newServiceState,
    isComplete: winner !== null,
    winner,
  };

  const newGames = [...state.games];
  newGames[state.currentGameIndex] = updatedGame;

  const event: import('./types').MatchEvent = {
    type: 'EDIT_SCORE',
    timestamp: Date.now(),
    payload: { scoreA, scoreB, gameIndex: state.currentGameIndex },
  };

  return {
    ...state,
    games: newGames,
    eventLog: [...state.eventLog, event],
  };
}

// Switch ends
export function switchEnds(state: MatchState): MatchState {
  const event: import('./types').MatchEvent = {
    type: 'SWITCH_ENDS',
    timestamp: Date.now(),
  };
  return {
    ...state,
    endsSwapped: !state.endsSwapped,
    eventLog: [...state.eventLog, event],
  };
}

// Utility: findLastIndex
function findLastIndex<T>(arr: T[], predicate: (item: T) => boolean): number {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (predicate(arr[i])) return i;
  }
  return -1;
}
