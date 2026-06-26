import { useEffect, useState } from 'react';
import { useMatchTimer } from '../hooks/useMatchTimer';
import { fetchActiveMatch } from '../api';
import type { MatchState, TeamId } from '../types';

export default function SpectatorPage() {
  const [match, setMatch] = useState<MatchState | null>(null);
  const [loading, setLoading] = useState(true);

  // Poll server every 1.5 seconds for live updates
  useEffect(() => {
    let active = true;

    const poll = async () => {
      try {
        const m = await fetchActiveMatch();
        if (active) {
          setMatch(m);
          setLoading(false);
        }
      } catch {
        // Server might be down, keep trying
      }
    };

    poll(); // initial fetch
    const interval = setInterval(poll, 1500);
    return () => { active = false; clearInterval(interval); };
  }, []);

  const timer = useMatchTimer(
    match?.startedAt ?? Date.now(),
    match?.endedAt ?? null,
    match?.isPaused ?? false
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg)' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>Loading live score...</p>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: 'var(--color-bg)' }}>
        <div className="text-6xl">🏸</div>
        <p className="text-xl font-semibold" style={{ color: 'var(--color-text-muted)' }}>No match in progress</p>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Waiting for a match to start...</p>
        <div className="animate-pulse text-sm" style={{ color: 'var(--color-primary)' }}>● Listening for updates</div>
      </div>
    );
  }

  const currentGame = match.games[match.currentGameIndex];
  const isOver = match.matchWinner !== null;
  const servingTeam = currentGame.serviceState.servingTeam;
  const completedGames = match.games.filter((g) => g.isComplete);

  const teamColor = (team: TeamId) => team === 'A' ? 'var(--color-score-a)' : 'var(--color-score-b)';

  return (
    <div
      className="min-h-screen flex flex-col select-none"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
          🏸 Badminton · {match.config.playMode} · Best of {match.config.bestOf}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono tabular-nums" style={{ color: 'var(--color-text-muted)' }}>⏱ {timer}</span>
          {match.isPaused && !isOver && (
            <span className="px-3 py-0.5 rounded-full text-xs font-black bg-yellow-400 text-black animate-pulse">PAUSED</span>
          )}
        </div>
      </div>

      {/* Main scoreboard */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 gap-4">
        {/* Game indicator */}
        <div className="flex gap-2">
          {Array.from({ length: match.config.bestOf }, (_, i) => {
            const g = match.games[i];
            const isActive = i === match.currentGameIndex;
            const isDone = g?.isComplete;
            return (
              <div
                key={i}
                className="w-3 h-3 rounded-full transition-all"
                style={{
                  backgroundColor: isDone
                    ? teamColor(g.winner!)
                    : isActive
                    ? 'var(--color-primary)'
                    : 'var(--color-border)',
                  transform: isActive ? 'scale(1.4)' : 'scale(1)',
                }}
              />
            );
          })}
        </div>

        <p className="text-base font-semibold" style={{ color: 'var(--color-text-muted)' }}>
          Game {match.currentGameIndex + 1} of {match.config.bestOf}
        </p>

        {/* Scores */}
        <div className="w-full max-w-4xl flex items-center justify-center gap-2 md:gap-8">
          {/* Team A */}
          <div className="flex-1 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              {servingTeam === 'A' && !isOver && (
                <span className="text-2xl md:text-4xl" title="Serving">🏸</span>
              )}
              <h2
                className="text-2xl md:text-5xl font-black text-center leading-tight"
                style={{ color: teamColor('A') }}
              >
                {match.teams.A.name}
              </h2>
            </div>
            {match.config.playMode === 'doubles' && (
              <p className="text-sm md:text-base text-center" style={{ color: 'var(--color-text-muted)' }}>
                {match.teams.A.players.map((p) => p.name).join(' / ')}
              </p>
            )}
            {match.config.playMode === 'singles' && (
              <p className="text-sm md:text-base text-center" style={{ color: 'var(--color-text-muted)' }}>
                {match.teams.A.players[0]?.name}
              </p>
            )}
            <div
              className="text-[8rem] md:text-[16rem] font-black leading-none tabular-nums"
              style={{ color: teamColor('A') }}
              aria-label={`${match.teams.A.name}: ${currentGame.scores.A}`}
            >
              {currentGame.scores.A}
            </div>
            {/* Games won pips */}
            <div className="flex gap-1.5">
              {Array.from({ length: Math.ceil(match.config.bestOf / 2) }, (_, i) => (
                <div
                  key={i}
                  className="w-4 h-4 rounded-full border-2"
                  style={{
                    backgroundColor: i < match.gamesWon.A ? teamColor('A') : 'transparent',
                    borderColor: teamColor('A'),
                  }}
                />
              ))}
            </div>
          </div>

          {/* Centre column */}
          <div className="flex flex-col items-center gap-3">
            <div className="text-4xl md:text-6xl font-light" style={{ color: 'var(--color-text-muted)' }}>–</div>
            {/* Previous game scores */}
            {completedGames.length > 0 && (
              <div className="flex flex-col gap-1 items-center">
                {completedGames.map((g, i) => (
                  <div key={i} className="text-center">
                    <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>G{i + 1}</div>
                    <div
                      className="text-base md:text-xl font-black tabular-nums"
                      style={{ color: g.winner ? teamColor(g.winner) : 'var(--color-text)' }}
                    >
                      {g.scores.A}–{g.scores.B}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Team B */}
          <div className="flex-1 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <h2
                className="text-2xl md:text-5xl font-black text-center leading-tight"
                style={{ color: teamColor('B') }}
              >
                {match.teams.B.name}
              </h2>
              {servingTeam === 'B' && !isOver && (
                <span className="text-2xl md:text-4xl" title="Serving">🏸</span>
              )}
            </div>
            {match.config.playMode === 'doubles' && (
              <p className="text-sm md:text-base text-center" style={{ color: 'var(--color-text-muted)' }}>
                {match.teams.B.players.map((p) => p.name).join(' / ')}
              </p>
            )}
            {match.config.playMode === 'singles' && (
              <p className="text-sm md:text-base text-center" style={{ color: 'var(--color-text-muted)' }}>
                {match.teams.B.players[0]?.name}
              </p>
            )}
            <div
              className="text-[8rem] md:text-[16rem] font-black leading-none tabular-nums"
              style={{ color: teamColor('B') }}
              aria-label={`${match.teams.B.name}: ${currentGame.scores.B}`}
            >
              {currentGame.scores.B}
            </div>
            {/* Games won pips */}
            <div className="flex gap-1.5">
              {Array.from({ length: Math.ceil(match.config.bestOf / 2) }, (_, i) => (
                <div
                  key={i}
                  className="w-4 h-4 rounded-full border-2"
                  style={{
                    backgroundColor: i < match.gamesWon.B ? teamColor('B') : 'transparent',
                    borderColor: teamColor('B'),
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Serve court info */}
        {!isOver && (
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {match.config.playMode === 'doubles'
              ? `Server: ${match.teams[servingTeam].players[currentGame.serviceState.serverPlayerIndex]?.name ?? '—'} · ${currentGame.serviceState.court} court`
              : `${match.teams[servingTeam].name} serving from ${currentGame.serviceState.court} court`}
          </p>
        )}

        {/* Paused */}
        {match.isPaused && !isOver && (
          <div className="text-2xl md:text-4xl font-black text-yellow-500 animate-pulse">⏸ PAUSED</div>
        )}

        {/* Match winner */}
        {isOver && (
          <div className="mt-4 text-center">
            <div className="text-5xl md:text-7xl mb-2">🏆</div>
            <p
              className="text-3xl md:text-6xl font-black"
              style={{ color: teamColor(match.matchWinner!) }}
            >
              {match.teams[match.matchWinner!].name}
            </p>
            <p className="text-xl md:text-3xl font-semibold mt-1" style={{ color: 'var(--color-text-muted)' }}>
              wins the match · {match.gamesWon.A}–{match.gamesWon.B}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
