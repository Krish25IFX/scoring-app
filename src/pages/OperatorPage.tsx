import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMatch } from '../context/MatchContext';
import { useTheme } from '../context/ThemeContext';
import { useMatchTimer } from '../hooks/useMatchTimer';
import type { TeamId } from '../types';
import type { GameState } from '../types';

function GameBadge({ gameIndex, games }: { gameIndex: number; games: GameState[] }) {
  const g = games[gameIndex];
  if (!g) return null;
  return (
    <div className="text-center px-3 py-1 rounded-lg" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>G{gameIndex + 1}</div>
      <div
        className="text-sm font-black tabular-nums"
        style={{ color: g.winner === 'A' ? 'var(--color-score-a)' : g.winner === 'B' ? 'var(--color-score-b)' : 'var(--color-text)' }}
      >
        {g.scores.A}–{g.scores.B}
      </div>
    </div>
  );
}

export default function OperatorPage() {
  const navigate = useNavigate();
  const { match, point, undo, redo, pause, swapEnds, resetMatch, historyIndex, history } = useMatch();
  const { theme, toggle } = useTheme();
  const [lastPoint, setLastPoint] = useState<TeamId | null>(null);

  const timer = useMatchTimer(
    match?.startedAt ?? Date.now(),
    match?.endedAt ?? null,
    match?.isPaused ?? false
  );

  useEffect(() => {
    if (!match) navigate('/setup');
  }, [match, navigate]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      switch (e.key) {
        case 'a': case 'A': handlePoint('A'); break;
        case 'b': case 'B': case 'l': case 'L': handlePoint('B'); break;
        case 'z': if (e.ctrlKey || e.metaKey) undo(); break;
        case 'y': if (e.ctrlKey || e.metaKey) redo(); break;
        case 'p': case 'P': pause(); break;
        case 'e': case 'E': swapEnds(); break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [point, undo, redo, pause, swapEnds]);

  const handlePoint = (team: TeamId) => {
    point(team);
    setLastPoint(team);
    setTimeout(() => setLastPoint(null), 600);
  };

  const handleEndMatch = () => {
    if (!confirm('End this match and return home?')) return;
    resetMatch();
    navigate('/');
  };

  const handleNewMatch = () => {
    if (!confirm('Start a new match? Current match is already saved.')) return;
    resetMatch();
    navigate('/setup');
  };

  if (!match) return null;

  const currentGame = match.games[match.currentGameIndex];
  const isOver = match.matchWinner !== null;
  const servingTeam = currentGame.serviceState.servingTeam;
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const completedGames = match.games.filter((g) => g.isComplete);

  const readableEvents = [...match.eventLog]
    .reverse()
    .slice(0, 40)
    .map((ev) => {
      if (ev.type === 'POINT' && ev.payload) {
        const team = ev.payload.team as TeamId;
        const scores = ev.payload.scores as Record<TeamId, number>;
        return {
          label: `+1 ${match.teams[team].name}`,
          detail: `${scores.A} – ${scores.B}`,
          color: team === 'A' ? 'var(--color-score-a)' : 'var(--color-score-b)',
          time: new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        };
      }
      if (ev.type === 'MATCH_STARTED') return { label: 'Match started', detail: '', color: 'var(--color-secondary)', time: new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
      if (ev.type === 'PAUSE') return { label: '⏸ Paused', detail: '', color: 'var(--color-accent)', time: new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) };
      if (ev.type === 'RESUME') return { label: '▶ Resumed', detail: '', color: 'var(--color-secondary)', time: new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) };
      return { label: ev.type, detail: '', color: 'var(--color-text-muted)', time: '' };
    });

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <div className="flex items-center gap-2">
          <Link to="/" className="text-sm px-3 py-1.5 rounded-lg border font-medium" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
            ← Home
          </Link>
          <Link to="/spectator" className="text-sm px-3 py-1.5 rounded-lg border font-medium" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
            📺 Big Board
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono font-semibold tabular-nums" style={{ color: 'var(--color-text-muted)' }}>⏱ {timer}</span>
          {match.isPaused && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-400 text-black animate-pulse">PAUSED</span>
          )}
          <button onClick={toggle} className="text-sm px-2 py-1.5 rounded-lg border" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-3 gap-3 max-w-2xl mx-auto w-full">
        {/* Match subtitle */}
        <p className="text-center text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
          {match.config.playMode} · Best of {match.config.bestOf} · Game {match.currentGameIndex + 1}
        </p>

        {/* Live score panel */}
        <div className="rounded-2xl p-4 border-2" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-stretch justify-between gap-2">
            {/* Team A */}
            <div className="flex-1 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                {servingTeam === 'A' && <span className="text-base" title="Serving">🏸</span>}
                <span className="text-sm font-bold truncate" style={{ color: 'var(--color-score-a)' }}>{match.teams.A.name}</span>
              </div>
              {match.config.playMode === 'doubles' && (
                <p className="text-xs mb-1 leading-tight" style={{ color: 'var(--color-text-muted)' }}>
                  {match.teams.A.players.map((p) => p.name).join(' / ')}
                </p>
              )}
              <div
                className="text-7xl md:text-8xl font-black tabular-nums leading-none"
                style={{ color: 'var(--color-score-a)', transition: 'transform 0.15s', transform: lastPoint === 'A' ? 'scale(1.15)' : 'scale(1)' }}
              >
                {currentGame.scores.A}
              </div>
              <div className="text-sm mt-1 font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                {match.gamesWon.A} {match.gamesWon.A === 1 ? 'game' : 'games'}
              </div>
            </div>

            {/* Middle: divider + previous game badges */}
            <div className="flex flex-col items-center justify-center gap-1">
              <div className="text-2xl font-light" style={{ color: 'var(--color-text-muted)' }}>–</div>
              {completedGames.length > 0 && (
                <div className="flex flex-col gap-1 mt-1">
                  {completedGames.map((_, i) => (
                    <GameBadge key={i} gameIndex={i} games={match.games} />
                  ))}
                </div>
              )}
            </div>

            {/* Team B */}
            <div className="flex-1 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className="text-sm font-bold truncate" style={{ color: 'var(--color-score-b)' }}>{match.teams.B.name}</span>
                {servingTeam === 'B' && <span className="text-base" title="Serving">🏸</span>}
              </div>
              {match.config.playMode === 'doubles' && (
                <p className="text-xs mb-1 leading-tight" style={{ color: 'var(--color-text-muted)' }}>
                  {match.teams.B.players.map((p) => p.name).join(' / ')}
                </p>
              )}
              <div
                className="text-7xl md:text-8xl font-black tabular-nums leading-none"
                style={{ color: 'var(--color-score-b)', transition: 'transform 0.15s', transform: lastPoint === 'B' ? 'scale(1.15)' : 'scale(1)' }}
              >
                {currentGame.scores.B}
              </div>
              <div className="text-sm mt-1 font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                {match.gamesWon.B} {match.gamesWon.B === 1 ? 'game' : 'games'}
              </div>
            </div>
          </div>

          {/* Serve info footer */}
          <div className="mt-3 pt-3 border-t text-center text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
            {match.config.playMode === 'doubles'
              ? `Serving: ${match.teams[servingTeam].players[currentGame.serviceState.serverPlayerIndex]?.name ?? '—'} · ${currentGame.serviceState.court} court`
              : `Serving: ${match.teams[servingTeam].name} · ${currentGame.serviceState.court} court`}
            {match.endsSwapped && ' · Ends swapped'}
          </div>
        </div>

        {/* Match winner banner */}
        {isOver && (
          <div className="rounded-2xl py-5 text-center text-white" style={{ backgroundColor: 'var(--color-secondary)' }}>
            <div className="text-3xl mb-1">🏆</div>
            <p className="text-xl font-black">{match.teams[match.matchWinner!].name} wins!</p>
            <p className="text-sm mt-1 opacity-80">{match.gamesWon.A} – {match.gamesWon.B}</p>
          </div>
        )}

        {/* Scoring buttons */}
        {!isOver && (
          <div className="flex gap-3">
            <button
              onClick={() => handlePoint('A')}
              disabled={match.isPaused}
              className="flex-1 rounded-2xl text-white font-black transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--color-score-a)', padding: '1.5rem 0.5rem', boxShadow: lastPoint === 'A' ? '0 0 0 4px rgba(37,99,235,0.35)' : 'none' }}
              aria-label={`Point for ${match.teams.A.name}`}
            >
              <div className="text-4xl md:text-5xl leading-none">{currentGame.scores.A + 1}</div>
              <div className="text-base md:text-lg font-semibold mt-1 opacity-90">{match.teams.A.name}</div>
              <div className="text-xs mt-0.5 opacity-60">tap to score</div>
            </button>
            <button
              onClick={() => handlePoint('B')}
              disabled={match.isPaused}
              className="flex-1 rounded-2xl text-white font-black transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--color-score-b)', padding: '1.5rem 0.5rem', boxShadow: lastPoint === 'B' ? '0 0 0 4px rgba(220,38,38,0.35)' : 'none' }}
              aria-label={`Point for ${match.teams.B.name}`}
            >
              <div className="text-4xl md:text-5xl leading-none">{currentGame.scores.B + 1}</div>
              <div className="text-base md:text-lg font-semibold mt-1 opacity-90">{match.teams.B.name}</div>
              <div className="text-xs mt-0.5 opacity-60">tap to score</div>
            </button>
          </div>
        )}

        {/* Controls */}
        <div className="grid grid-cols-4 gap-2">
          <button onClick={undo} disabled={!canUndo} className="py-3 rounded-xl font-semibold text-sm border-2 disabled:opacity-30" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>↶ Undo</button>
          <button onClick={redo} disabled={!canRedo} className="py-3 rounded-xl font-semibold text-sm border-2 disabled:opacity-30" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>↷ Redo</button>
          <button onClick={pause} className="py-3 rounded-xl font-semibold text-sm border-2" style={{ borderColor: match.isPaused ? 'var(--color-secondary)' : 'var(--color-accent)', color: match.isPaused ? 'var(--color-secondary)' : 'var(--color-accent)' }}>
            {match.isPaused ? '▶ Resume' : '⏸ Pause'}
          </button>
          <button onClick={swapEnds} className="py-3 rounded-xl font-semibold text-sm border-2" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>⇄ Ends</button>
        </div>

        {/* Rally log */}
        <details className="rounded-xl border-2 overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
          <summary className="px-4 py-3 cursor-pointer font-medium text-sm select-none" style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-muted)' }}>
            Rally Log · {match.eventLog.filter((e) => e.type === 'POINT').length} points scored
          </summary>
          <div className="max-h-52 overflow-y-auto">
            {readableEvents.map((ev, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2 text-sm border-b" style={{ borderColor: 'var(--color-border)', backgroundColor: i === 0 ? 'var(--color-surface)' : 'var(--color-bg)' }}>
                <span className="font-semibold" style={{ color: ev.color }}>{ev.label}</span>
                <div className="flex items-center gap-3">
                  {ev.detail && <span className="font-mono font-bold text-xs tabular-nums" style={{ color: 'var(--color-text-muted)' }}>{ev.detail}</span>}
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{ev.time}</span>
                </div>
              </div>
            ))}
          </div>
        </details>

        {/* End / New Match */}
        <div className="flex gap-2 pb-4">
          <button onClick={handleEndMatch} className="flex-1 py-3 rounded-xl font-semibold text-sm border-2 text-red-500 border-red-300 hover:bg-red-50 transition-colors">
            End Match
          </button>
          <button onClick={handleNewMatch} className="flex-1 py-3 rounded-xl font-semibold text-sm border-2 transition-colors" style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>
            New Match
          </button>
        </div>
      </div>

      <p className="text-center text-xs pb-3 hidden md:block" style={{ color: 'var(--color-text-muted)' }}>
        <kbd className="px-1 rounded border" style={{ borderColor: 'var(--color-border)' }}>A</kbd> point A ·{' '}
        <kbd className="px-1 rounded border" style={{ borderColor: 'var(--color-border)' }}>B</kbd> point B ·{' '}
        <kbd className="px-1 rounded border" style={{ borderColor: 'var(--color-border)' }}>Ctrl+Z</kbd> undo ·{' '}
        <kbd className="px-1 rounded border" style={{ borderColor: 'var(--color-border)' }}>P</kbd> pause ·{' '}
        <kbd className="px-1 rounded border" style={{ borderColor: 'var(--color-border)' }}>E</kbd> ends
      </p>
    </div>
  );
}
