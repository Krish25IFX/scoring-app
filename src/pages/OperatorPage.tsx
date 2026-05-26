import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMatch } from '../context/MatchContext';
import { useTheme } from '../context/ThemeContext';
import Scoreboard from '../components/Scoreboard';

export default function OperatorPage() {
  const navigate = useNavigate();
  const { match, point, undo, redo, pause, swapEnds, resetMatch, historyIndex, history } = useMatch();
  const { theme, toggle } = useTheme();

  useEffect(() => {
    if (!match) navigate('/setup');
  }, [match, navigate]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.target instanceof HTMLInputElement) return;
      switch (e.key) {
        case 'a':
        case 'A':
          point('A');
          break;
        case 'b':
        case 'B':
        case 'l':
        case 'L':
          point('B');
          break;
        case 'z':
          if (e.ctrlKey || e.metaKey) undo();
          break;
        case 'y':
          if (e.ctrlKey || e.metaKey) redo();
          break;
        case 'p':
        case 'P':
          pause();
          break;
        case 'e':
        case 'E':
          swapEnds();
          break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [point, undo, redo, pause, swapEnds]);

  if (!match) return null;

  const isOver = match.matchWinner !== null;

  return (
    <div className="min-h-screen flex flex-col p-2 md:p-4">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Link to="/" className="text-sm px-3 py-1 rounded border" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
            ← Home
          </Link>
          <Link to="/spectator" className="text-sm px-3 py-1 rounded border" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
            Big Board
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggle} className="text-sm px-3 py-1 rounded border" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          {match.isPaused && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-500 text-black">PAUSED</span>
          )}
        </div>
      </div>

      {/* Scoreboard */}
      <Scoreboard match={match} />

      {/* Game tally */}
      <div className="text-center my-2 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
        Games: {match.gamesWon.A} – {match.gamesWon.B} | Game {match.currentGameIndex + 1} of {match.config.bestOf}
        {match.endsSwapped && ' | Ends Swapped'}
      </div>

      {/* Match over banner */}
      {isOver && (
        <div className="text-center py-4 my-2 rounded-xl bg-green-100 dark:bg-green-900">
          <p className="text-2xl font-bold text-green-800 dark:text-green-200">
            🏆 {match.teams[match.matchWinner!].name} wins the match!
          </p>
        </div>
      )}

      {/* Scoring buttons */}
      {!isOver && (
        <div className="flex gap-3 my-4">
          <button
            onClick={() => point('A')}
            disabled={match.isPaused}
            className="flex-1 py-8 md:py-12 rounded-2xl text-white text-3xl md:text-5xl font-bold transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--color-score-a)' }}
            aria-label={`Point for ${match.teams.A.name}`}
          >
            +1<br />
            <span className="text-lg md:text-xl font-normal">{match.teams.A.name}</span>
          </button>
          <button
            onClick={() => point('B')}
            disabled={match.isPaused}
            className="flex-1 py-8 md:py-12 rounded-2xl text-white text-3xl md:text-5xl font-bold transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--color-score-b)' }}
            aria-label={`Point for ${match.teams.B.name}`}
          >
            +1<br />
            <span className="text-lg md:text-xl font-normal">{match.teams.B.name}</span>
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 my-2">
        <button
          onClick={undo}
          disabled={historyIndex <= 0}
          className="py-3 rounded-lg font-medium border-2 transition-colors disabled:opacity-30"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
        >
          ↶ Undo
        </button>
        <button
          onClick={redo}
          disabled={historyIndex >= history.length - 1}
          className="py-3 rounded-lg font-medium border-2 transition-colors disabled:opacity-30"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
        >
          ↷ Redo
        </button>
        <button
          onClick={pause}
          className="py-3 rounded-lg font-medium border-2 transition-colors"
          style={{
            borderColor: match.isPaused ? 'var(--color-secondary)' : 'var(--color-accent)',
            color: match.isPaused ? 'var(--color-secondary)' : 'var(--color-accent)',
          }}
        >
          {match.isPaused ? '▶ Resume' : '⏸ Pause'}
        </button>
        <button
          onClick={swapEnds}
          className="py-3 rounded-lg font-medium border-2 transition-colors"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
        >
          ⇄ Swap Ends
        </button>
      </div>

      {/* Event log */}
      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
          Event Log ({match.eventLog.length} events)
        </summary>
        <div className="mt-2 max-h-48 overflow-y-auto text-xs space-y-1 p-2 rounded-lg" style={{ backgroundColor: 'var(--color-surface)' }}>
          {[...match.eventLog].reverse().map((ev, i) => (
            <div key={i} className="flex justify-between">
              <span className="font-mono">{ev.type}</span>
              <span style={{ color: 'var(--color-text-muted)' }}>{new Date(ev.timestamp).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      </details>

      {/* End / New Match */}
      <div className="mt-auto pt-4 flex gap-2">
        <button
          onClick={() => {
            resetMatch();
            navigate('/');
          }}
          className="flex-1 py-3 rounded-lg font-medium text-red-600 border-2 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          End Match
        </button>
        <button
          onClick={() => {
            resetMatch();
            navigate('/setup');
          }}
          className="flex-1 py-3 rounded-lg font-medium border-2 transition-colors"
          style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
        >
          New Match
        </button>
      </div>

      {/* Keyboard shortcuts help */}
      <p className="text-center text-xs mt-4 hidden md:block" style={{ color: 'var(--color-text-muted)' }}>
        Keys: <kbd>A</kbd> = point A · <kbd>B/L</kbd> = point B · <kbd>Ctrl+Z</kbd> = undo · <kbd>Ctrl+Y</kbd> = redo · <kbd>P</kbd> = pause · <kbd>E</kbd> = swap ends
      </p>
    </div>
  );
}
