import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

export default function HomePage() {
  const { theme, toggle } = useTheme();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--color-primary)' }}>
            🏸 Badminton Scorer
          </h1>
          <p className="text-lg" style={{ color: 'var(--color-text-muted)' }}>
            Professional match scoring
          </p>
        </div>

        <div className="space-y-4">
          <Link
            to="/setup"
            className="block w-full py-4 px-6 rounded-xl text-white text-xl font-semibold transition-transform hover:scale-105 active:scale-95"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            New Match
          </Link>

          <Link
            to="/history"
            className="block w-full py-3 px-6 rounded-xl text-lg font-medium border-2 transition-transform hover:scale-105"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
          >
            Match History
          </Link>
        </div>

        <button
          onClick={toggle}
          className="mt-8 px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
        </button>
      </div>
    </div>
  );
}
