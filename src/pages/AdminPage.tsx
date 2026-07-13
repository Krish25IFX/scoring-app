import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMatch } from '../context/MatchContext';
import { CAPTAINS } from '../config/players';
import { CATEGORIES } from '../types';
import { exportCaptainSelectionsPDF } from '../export';

const ADMIN_PIN = '0112';
const SESSION_KEY = 'admin_auth';

export default function AdminPage() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [authed, setAuthed] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === 'true'
  );
  const { captainSelections, refreshCaptainSelections, matchHistory, refreshMatchHistory } = useMatch();

  useEffect(() => {
    if (authed) {
      refreshCaptainSelections();
      refreshMatchHistory();
    }
  }, [authed, refreshCaptainSelections, refreshMatchHistory]);

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: 'var(--color-bg)' }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (pin === ADMIN_PIN) {
              sessionStorage.setItem(SESSION_KEY, 'true');
              setAuthed(true);
            } else {
              setError(true);
              setPin('');
            }
          }}
          className="max-w-xs w-full space-y-4 text-center"
        >
          <div className="text-5xl mb-2">🛡️</div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>Admin Access</h2>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Enter the admin PIN</p>
          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => { setPin(e.target.value); setError(false); }}
            placeholder="••••"
            maxLength={8}
            autoFocus
            className="w-full p-3 rounded-lg border-2 text-center text-xl tracking-widest"
            style={{
              borderColor: error ? '#ef4444' : 'var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)',
            }}
          />
          {error && <p className="text-sm text-red-500 font-medium">Incorrect PIN</p>}
          <button type="submit" className="w-full py-3 rounded-xl text-white font-semibold" style={{ backgroundColor: 'var(--color-primary)' }}>
            Unlock
          </button>
          <Link to="/" className="block text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>← Back to Home</Link>
        </form>
      </div>
    );
  }

  // Build a readable view of all captain selections
  const captainMap = Object.fromEntries(CAPTAINS.map((c) => [c.id, c]));
  const categoryMap = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label]));

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/" className="px-3 py-1.5 rounded-lg border text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
            ← Home
          </Link>
          <h1 className="text-2xl font-black" style={{ color: 'var(--color-primary)' }}>🛡️ Admin Panel</h1>
        </div>

        {/* Captain Selections */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>Captain Selections</h2>
            {Object.keys(captainSelections).length > 0 && (
              <button
                onClick={() => exportCaptainSelectionsPDF(captainSelections, CAPTAINS, categoryMap)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-transform hover:scale-105"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                📄 Export PDF
              </button>
            )}
          </div>
          {Object.keys(captainSelections).length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No captain selections yet.</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(captainSelections).map(([captainId, categories]) => {
                const captain = captainMap[captainId];
                return (
                  <div key={captainId} className="p-4 rounded-2xl border-2" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                    <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--color-primary)' }}>
                      {captain?.name ?? captainId} — {captain?.teamName ?? 'Unknown Team'}
                    </h3>
                    {Object.entries(categories).map(([category, opponents]) => (
                      <div key={category} className="mb-3 ml-2">
                        <h4 className="font-semibold text-sm mb-1" style={{ color: 'var(--color-text)' }}>
                          📋 {categoryMap[category] ?? category}
                        </h4>
                        {Object.entries(opponents).map(([opponentId, players]) => {
                          const opponent = captainMap[opponentId];
                          return (
                            <div key={opponentId} className="ml-4 mb-2 p-2 rounded-lg" style={{ backgroundColor: 'var(--color-bg)' }}>
                              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>
                                vs {opponent?.teamName ?? opponentId}
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {players.map((player) => (
                                  <span key={player} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}>
                                    {player}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Match History Summary */}
        <section>
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>Match History</h2>
          {matchHistory.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No matches played yet.</p>
          ) : (
            <div className="space-y-3">
              {matchHistory.map((m) => (
                <div key={m.id} className="p-3 rounded-xl border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold uppercase" style={{ color: 'var(--color-text-muted)' }}>
                      {m.category ? (categoryMap[m.category] ?? m.category) : m.config.playMode}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {new Date(m.startedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold" style={{ color: 'var(--color-score-a)' }}>{m.teamAName || m.teams.A.name}</span>
                    <span className="text-lg font-black tabular-nums">
                      {m.gamesWon.A} – {m.gamesWon.B}
                    </span>
                    <span className="font-bold" style={{ color: 'var(--color-score-b)' }}>{m.teamBName || m.teams.B.name}</span>
                    {m.matchWinner && (
                      <span className="ml-auto text-xs font-semibold" style={{ color: m.matchWinner === 'A' ? 'var(--color-score-a)' : 'var(--color-score-b)' }}>
                        🏆 {m.matchWinner === 'A' ? (m.teamAName || m.teams.A.name) : (m.teamBName || m.teams.B.name)}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    Players: {m.teams.A.players.map((p) => p.name).join(', ')} vs {m.teams.B.players.map((p) => p.name).join(', ')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
