import { describe, it, expect } from 'vitest';
import {
  createMatchState,
  scorePoint,
  checkGameWon,
  checkMatchWon,
  undoLastPoint,
  togglePause,
  editScore,
  switchEnds,
  getServiceCourt,
} from '../engine';
import type { MatchConfig } from '../types';

const defaultConfig: MatchConfig = {
  bestOf: 3,
  pointsToWin: [21, 21, 21],
  winByTwo: true,
  pointCap: null,
  playMode: 'singles',
  changeEndsAfterGame: true,
  changeEndsInDecidingGame: true,
  changeEndsAtScore: 11,
};

describe('Scoring Engine', () => {
  describe('getServiceCourt', () => {
    it('returns right for even scores', () => {
      expect(getServiceCourt(0)).toBe('right');
      expect(getServiceCourt(2)).toBe('right');
      expect(getServiceCourt(20)).toBe('right');
    });

    it('returns left for odd scores', () => {
      expect(getServiceCourt(1)).toBe('left');
      expect(getServiceCourt(3)).toBe('left');
      expect(getServiceCourt(21)).toBe('left');
    });
  });

  describe('checkGameWon', () => {
    it('returns winner at 21-19 (win by 2)', () => {
      expect(checkGameWon({ A: 21, B: 19 }, defaultConfig, 0)).toBe('A');
    });

    it('returns null at 21-20 (not won by 2)', () => {
      expect(checkGameWon({ A: 21, B: 20 }, defaultConfig, 0)).toBeNull();
    });

    it('returns winner at 25-23 (deuce resolved)', () => {
      expect(checkGameWon({ A: 25, B: 23 }, defaultConfig, 0)).toBe('A');
    });

    it('handles no-cap deuce - game continues indefinitely', () => {
      expect(checkGameWon({ A: 29, B: 28 }, defaultConfig, 0)).toBeNull();
      expect(checkGameWon({ A: 30, B: 28 }, defaultConfig, 0)).toBe('A');
      expect(checkGameWon({ A: 50, B: 48 }, defaultConfig, 0)).toBe('A');
    });

    it('handles cap at 30 (BWF rule)', () => {
      const configWithCap = { ...defaultConfig, pointCap: 30 };
      expect(checkGameWon({ A: 30, B: 29 }, configWithCap, 0)).toBe('A');
      expect(checkGameWon({ A: 29, B: 30 }, configWithCap, 0)).toBe('B');
    });

    it('handles simple first-to-N without win-by-2', () => {
      const simpleConfig = { ...defaultConfig, winByTwo: false };
      expect(checkGameWon({ A: 21, B: 20 }, simpleConfig, 0)).toBe('A');
    });

    it('respects per-game point values', () => {
      const config: MatchConfig = { ...defaultConfig, pointsToWin: [21, 21, 15] };
      expect(checkGameWon({ A: 15, B: 13 }, config, 2)).toBe('A');
      expect(checkGameWon({ A: 14, B: 12 }, config, 2)).toBeNull();
    });
  });

  describe('checkMatchWon', () => {
    it('returns winner when reaching majority', () => {
      expect(checkMatchWon({ A: 2, B: 0 }, defaultConfig)).toBe('A');
      expect(checkMatchWon({ A: 0, B: 2 }, defaultConfig)).toBe('B');
    });

    it('returns null when match not decided', () => {
      expect(checkMatchWon({ A: 1, B: 1 }, defaultConfig)).toBeNull();
      expect(checkMatchWon({ A: 1, B: 0 }, defaultConfig)).toBeNull();
    });
  });

  describe('Singles scoring flow', () => {
    it('scores a full game to 21-19 correctly', () => {
      let state = createMatchState(
        defaultConfig,
        { name: 'Alice', players: ['Alice'] },
        { name: 'Bob', players: ['Bob'] },
        'A'
      );

      // Score to 19-19
      for (let i = 0; i < 19; i++) {
        state = scorePoint(state, 'A');
        state = scorePoint(state, 'B');
      }

      const game = state.games[0];
      expect(game.scores.A).toBe(19);
      expect(game.scores.B).toBe(19);
      expect(game.isComplete).toBe(false);

      // Score to 21-19
      state = scorePoint(state, 'A');
      state = scorePoint(state, 'A');

      const finalGame = state.games[0];
      expect(finalGame.scores.A).toBe(21);
      expect(finalGame.scores.B).toBe(19);
      expect(finalGame.isComplete).toBe(true);
      expect(finalGame.winner).toBe('A');
    });

    it('handles deuce scenario without cap', () => {
      let state = createMatchState(
        defaultConfig,
        { name: 'Alice', players: ['Alice'] },
        { name: 'Bob', players: ['Bob'] },
        'A'
      );

      // Score to 20-20
      for (let i = 0; i < 20; i++) {
        state = scorePoint(state, 'A');
        state = scorePoint(state, 'B');
      }

      // 21-20: not won
      state = scorePoint(state, 'A');
      expect(state.games[0].isComplete).toBe(false);

      // 21-21
      state = scorePoint(state, 'B');
      expect(state.games[0].isComplete).toBe(false);

      // 22-21: not won
      state = scorePoint(state, 'A');
      expect(state.games[0].isComplete).toBe(false);

      // 22-22
      state = scorePoint(state, 'B');
      expect(state.games[0].isComplete).toBe(false);

      // 23-22: not won
      state = scorePoint(state, 'A');
      expect(state.games[0].isComplete).toBe(false);

      // 24-22: WON!
      state = scorePoint(state, 'A');
      expect(state.games[0].scores.A).toBe(24);
      expect(state.games[0].scores.B).toBe(22);
      expect(state.games[0].isComplete).toBe(true);
      expect(state.games[0].winner).toBe('A');
    });

    it('service court alternates based on server score', () => {
      let state = createMatchState(
        defaultConfig,
        { name: 'Alice', players: ['Alice'] },
        { name: 'Bob', players: ['Bob'] },
        'A'
      );

      // Initial serve: A serves from right (score 0 is even)
      expect(state.games[0].serviceState.servingTeam).toBe('A');
      expect(state.games[0].serviceState.court).toBe('right');

      // A scores: A's score becomes 1, serves from left
      state = scorePoint(state, 'A');
      expect(state.games[0].serviceState.servingTeam).toBe('A');
      expect(state.games[0].serviceState.court).toBe('left');

      // A scores again: A's score becomes 2, serves from right
      state = scorePoint(state, 'A');
      expect(state.games[0].serviceState.servingTeam).toBe('A');
      expect(state.games[0].serviceState.court).toBe('right');

      // B wins rally: service passes to B, B's score is 1, serves from left
      state = scorePoint(state, 'B');
      expect(state.games[0].serviceState.servingTeam).toBe('B');
      expect(state.games[0].serviceState.court).toBe('left');
    });
  });

  describe('Doubles scoring flow', () => {
    const doublesConfig: MatchConfig = { ...defaultConfig, playMode: 'doubles' };

    it('service passes correctly and player rotates', () => {
      let state = createMatchState(
        doublesConfig,
        { name: 'Team A', players: ['A1', 'A2'] },
        { name: 'Team B', players: ['B1', 'B2'] },
        'A'
      );

      // A serves and wins: A keeps serve
      state = scorePoint(state, 'A');
      expect(state.games[0].serviceState.servingTeam).toBe('A');

      // A scores again
      state = scorePoint(state, 'A');
      expect(state.games[0].serviceState.servingTeam).toBe('A');

      // B wins rally: service passes to B
      state = scorePoint(state, 'B');
      expect(state.games[0].serviceState.servingTeam).toBe('B');

      // B scores: B keeps serve, player index based on score parity
      state = scorePoint(state, 'B');
      expect(state.games[0].serviceState.servingTeam).toBe('B');
    });
  });

  describe('Match flow - best of 3', () => {
    it('completes a full 2-0 match', () => {
      let state = createMatchState(
        { ...defaultConfig, pointsToWin: [5, 5, 5], winByTwo: false },
        { name: 'Alice', players: ['Alice'] },
        { name: 'Bob', players: ['Bob'] },
        'A'
      );

      // Win game 1: A scores 5
      for (let i = 0; i < 5; i++) state = scorePoint(state, 'A');
      expect(state.gamesWon.A).toBe(1);
      expect(state.currentGameIndex).toBe(1);

      // Win game 2: A scores 5
      for (let i = 0; i < 5; i++) state = scorePoint(state, 'A');
      expect(state.gamesWon.A).toBe(2);
      expect(state.matchWinner).toBe('A');
    });

    it('completes a 2-1 match with deciding game', () => {
      let state = createMatchState(
        { ...defaultConfig, pointsToWin: [3, 3, 3], winByTwo: false },
        { name: 'Alice', players: ['Alice'] },
        { name: 'Bob', players: ['Bob'] },
        'A'
      );

      // A wins game 1
      for (let i = 0; i < 3; i++) state = scorePoint(state, 'A');
      expect(state.gamesWon.A).toBe(1);

      // B wins game 2
      for (let i = 0; i < 3; i++) state = scorePoint(state, 'B');
      expect(state.gamesWon.B).toBe(1);

      // A wins game 3
      for (let i = 0; i < 3; i++) state = scorePoint(state, 'A');
      expect(state.gamesWon.A).toBe(2);
      expect(state.matchWinner).toBe('A');
    });
  });

  describe('Undo/Redo', () => {
    it('undoes the last point correctly', () => {
      let state = createMatchState(
        defaultConfig,
        { name: 'Alice', players: ['Alice'] },
        { name: 'Bob', players: ['Bob'] },
        'A'
      );

      state = scorePoint(state, 'A');
      state = scorePoint(state, 'A');
      expect(state.games[0].scores.A).toBe(2);

      state = undoLastPoint(state);
      expect(state.games[0].scores.A).toBe(1);
    });
  });

  describe('Pause/Resume', () => {
    it('toggles pause state', () => {
      let state = createMatchState(
        defaultConfig,
        { name: 'Alice', players: ['Alice'] },
        { name: 'Bob', players: ['Bob'] },
        'A'
      );

      expect(state.isPaused).toBe(false);
      state = togglePause(state);
      expect(state.isPaused).toBe(true);
      state = togglePause(state);
      expect(state.isPaused).toBe(false);
    });

    it('prevents scoring while paused', () => {
      let state = createMatchState(
        defaultConfig,
        { name: 'Alice', players: ['Alice'] },
        { name: 'Bob', players: ['Bob'] },
        'A'
      );

      state = togglePause(state);
      const before = state.games[0].scores.A;
      state = scorePoint(state, 'A');
      expect(state.games[0].scores.A).toBe(before);
    });
  });

  describe('Edit score', () => {
    it('sets score directly', () => {
      let state = createMatchState(
        defaultConfig,
        { name: 'Alice', players: ['Alice'] },
        { name: 'Bob', players: ['Bob'] },
        'A'
      );

      state = editScore(state, 15, 12);
      expect(state.games[0].scores.A).toBe(15);
      expect(state.games[0].scores.B).toBe(12);
    });

    it('prevents negative scores', () => {
      let state = createMatchState(
        defaultConfig,
        { name: 'Alice', players: ['Alice'] },
        { name: 'Bob', players: ['Bob'] },
        'A'
      );

      state = editScore(state, -5, -3);
      expect(state.games[0].scores.A).toBe(0);
      expect(state.games[0].scores.B).toBe(0);
    });
  });

  describe('Switch ends', () => {
    it('toggles endsSwapped', () => {
      let state = createMatchState(
        defaultConfig,
        { name: 'Alice', players: ['Alice'] },
        { name: 'Bob', players: ['Bob'] },
        'A'
      );

      expect(state.endsSwapped).toBe(false);
      state = switchEnds(state);
      expect(state.endsSwapped).toBe(true);
      state = switchEnds(state);
      expect(state.endsSwapped).toBe(false);
    });
  });

  describe('Change ends in deciding game at 11', () => {
    it('triggers ends swap when leading score reaches 11 in deciding game', () => {
      const config: MatchConfig = {
        ...defaultConfig,
        pointsToWin: [3, 3, 3],
        winByTwo: false,
        changeEndsAtScore: 2, // lower threshold for testing
      };

      let state = createMatchState(
        config,
        { name: 'Alice', players: ['Alice'] },
        { name: 'Bob', players: ['Bob'] },
        'A'
      );

      // A wins game 1
      for (let i = 0; i < 3; i++) state = scorePoint(state, 'A');
      // B wins game 2
      for (let i = 0; i < 3; i++) state = scorePoint(state, 'B');

      // Now in deciding game (game 3, index 2)
      expect(state.currentGameIndex).toBe(2);
      expect(state.endsSwapped).toBe(false);

      // Score to 2-0 in deciding game => leading score is 2 => swap
      state = scorePoint(state, 'A');
      state = scorePoint(state, 'A');
      expect(state.endsSwapped).toBe(true);
    });
  });
});
