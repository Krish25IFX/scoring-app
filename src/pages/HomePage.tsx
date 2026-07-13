import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useMatch } from '../context/MatchContext';

export default function HomePage() {
  const { theme, toggle } = useTheme();
  const { match } = useMatch();

  const activeGame = match ? match.games[match.currentGameIndex] : null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="max-w-md w-full space-y-6">
        {/* Branding */}
        <div className="text-center space-y-1">
          <div className="text-6xl mb-2">🏸</div>
          <h1 className="text-4xl font-black tracking-tight" style={{ color: 'var(--color-primary)' }}>
            Badminton Scorer
          </h1>
          <p className="text-base" style={{ color: 'var(--color-text-muted)' }}>
            Infineon Badminton · Tournament Edition
          </p>
        </div>

        {/* Active match resume card */}
        {match && activeGame && (
          <div
            className="rounded-2xl p-4 border-2"
            style={{ borderColor: 'var(--color-primary)', backgroundColor: 'var(--color-surface)' }}
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--color-primary)' }}>
              ● Match in progress
            </p>
            <div className="flex items-center justify-between mb-3">
              <div className="text-center flex-1">
                <p className="font-bold truncate" style={{ color: 'var(--color-score-a)' }}>{match.teams.A.name}</p>
                <p className="text-4xl font-black tabular-nums" style={{ color: 'var(--color-score-a)' }}>{activeGame.scores.A}</p>
              </div>
              <div className="text-center px-4">
                <p className="text-2xl font-light" style={{ color: 'var(--color-text-muted)' }}>–</p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  G{match.currentGameIndex + 1} · {match.gamesWon.A}–{match.gamesWon.B}
                </p>
              </div>
              <div className="text-center flex-1">
                <p className="font-bold truncate" style={{ color: 'var(--color-score-b)' }}>{match.teams.B.name}</p>
                <p className="text-4xl font-black tabular-nums" style={{ color: 'var(--color-score-b)' }}>{activeGame.scores.B}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                to="/operator"
                className="flex-1 py-2.5 rounded-xl text-white text-center font-semibold text-sm"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                🎛 Operator View
              </Link>
              <Link
                to="/spectator"
                className="flex-1 py-2.5 rounded-xl text-center font-semibold text-sm border-2"
                style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
              >
                📺 Spectator View
              </Link>
            </div>
          </div>
        )}

        {/* Main actions */}
        <div className="space-y-3">
          <Link
            to="/captain-login"
            className="flex items-center justify-center gap-2 w-full py-4 px-6 rounded-2xl text-white text-lg font-bold transition-transform hover:scale-105 active:scale-95"
            style={{ backgroundColor: 'var(--color-secondary)' }}
          >
            🧑‍✈️ Captain Login
          </Link>

          <Link
            to="/setup"
            className="flex items-center justify-center gap-2 w-full py-4 px-6 rounded-2xl text-white text-lg font-bold transition-transform hover:scale-105 active:scale-95"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {match ? '🔄 New Match' : '▶ Start New Match'}
          </Link>

          <Link
            to="/spectator"
            className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-2xl text-lg font-semibold border-2 transition-transform hover:scale-105"
            style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
          >
            📊 Live Score (Spectator)
          </Link>

          <Link
            to="/history"
            className="flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-2xl text-lg font-semibold border-2 transition-transform hover:scale-105"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
          >
            📋 Match History
          </Link>

          <Link
            to="/standings"
            className="flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-2xl text-lg font-semibold border-2 transition-transform hover:scale-105"
            style={{ borderColor: 'var(--color-secondary)', color: 'var(--color-secondary)' }}
          >
            🏆 Tournament Standings
          </Link>

          <Link
            to="/admin"
            className="flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-2xl text-lg font-semibold border-2 transition-transform hover:scale-105"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
          >
            🛡️ Admin Panel
          </Link>
        </div>

        {/* Theme toggle */}
        <div className="text-center">
          <button
            onClick={toggle}
            className="px-5 py-2 rounded-xl text-sm font-medium border transition-colors"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
          >
            {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
          </button>
        </div>
      </div>
    </div>
  );
}
