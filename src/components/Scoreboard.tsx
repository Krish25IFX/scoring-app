import type { MatchState } from '../types';

interface ScoreboardProps {
  match: MatchState;
}

export default function Scoreboard({ match }: ScoreboardProps) {
  const currentGame = match.games[match.currentGameIndex];
  const servingA = currentGame.serviceState.servingTeam === 'A';
  const court = currentGame.serviceState.court;

  return (
    <div
      className="rounded-2xl p-4 md:p-6 border-2"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      role="region"
      aria-label="Scoreboard"
    >
      {/* Team A */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {servingA && (
            <span className="text-lg md:text-2xl" title={`Serving from ${court} court`}>🏸</span>
          )}
          <span className="text-lg md:text-xl font-bold truncate max-w-[120px] md:max-w-[200px]" style={{ color: 'var(--color-score-a)' }}>
            {match.teams.A.name}
          </span>
          {servingA && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 uppercase font-bold">
              {court}
            </span>
          )}
        </div>
        <span className="text-4xl md:text-6xl font-black tabular-nums" style={{ color: 'var(--color-score-a)' }}>
          {currentGame.scores.A}
        </span>
      </div>

      {/* Divider */}
      <div className="h-px w-full mb-3" style={{ backgroundColor: 'var(--color-border)' }} />

      {/* Team B */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!servingA && (
            <span className="text-lg md:text-2xl" title={`Serving from ${court} court`}>🏸</span>
          )}
          <span className="text-lg md:text-xl font-bold truncate max-w-[120px] md:max-w-[200px]" style={{ color: 'var(--color-score-b)' }}>
            {match.teams.B.name}
          </span>
          {!servingA && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 uppercase font-bold">
              {court}
            </span>
          )}
        </div>
        <span className="text-4xl md:text-6xl font-black tabular-nums" style={{ color: 'var(--color-score-b)' }}>
          {currentGame.scores.B}
        </span>
      </div>

      {/* Server indicator for doubles */}
      {match.config.playMode === 'doubles' && (
        <div className="mt-3 text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
          Server: {match.teams[currentGame.serviceState.servingTeam].players[currentGame.serviceState.serverPlayerIndex]?.name ?? 'Player'}
        </div>
      )}
    </div>
  );
}
