import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllMatches, deleteMatch, getFullMatch } from '../persistence';
import { fetchAllMatches, deleteMatchApi } from '../api';
import { exportMatchJSON, exportMatchCSV, exportMatchPDF } from '../export';
import { OPERATOR_PIN } from '../config/players';
import type { MatchSummary, MatchState, TeamId } from '../types';

function formatDuration(ms: number | null) {
  if (!ms) return null;
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m ${s % 60}s`;
}

export default function HistoryPage() {
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);

  useEffect(() => {
    // Try server first, fall back to local IndexedDB
    fetchAllMatches()
      .then((serverMatches) => {
        const summaries: MatchSummary[] = serverMatches.map((m: MatchState) => ({
          id: m.id,
          teams: m.teams,
          gamesWon: m.gamesWon,
          matchWinner: m.matchWinner,
          config: m.config,
          startedAt: m.startedAt,
          endedAt: m.endedAt,
          games: m.games,
          category: m.category,
          teamAName: m.teamAName,
          teamBName: m.teamBName,
        }));
        setMatches(summaries.sort((a, b) => b.startedAt - a.startedAt));
        setLoading(false);
      })
      .catch(() => {
        // Fallback to local IndexedDB
        getAllMatches().then((m) => {
          setMatches(m);
          setLoading(false);
        });
      });
  }, []);

  const handleDelete = async (id: string) => {
    setDeleteTarget(id);
    setPin('');
    setPinError(false);
  };

  const confirmDelete = async () => {
    if (pin !== OPERATOR_PIN) {
      setPinError(true);
      setPin('');
      return;
    }
    if (deleteTarget) {
      await deleteMatch(deleteTarget);
      await deleteMatchApi(deleteTarget).catch(() => {});
      setMatches((prev) => prev.filter((m) => m.id !== deleteTarget));
    }
    setDeleteTarget(null);
    setPin('');
    setPinError(false);
  };

  const handleExportJSON = async (id: string) => {
    const match = await getFullMatch(id);
    if (match) exportMatchJSON(match);
  };

  const handleExportCSV = async (id: string) => {
    const match = await getFullMatch(id);
    if (match) exportMatchCSV(match);
  };

  const handleExportPDF = async (id: string) => {
    const match = await getFullMatch(id);
    if (match) exportMatchPDF(match);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/" className="px-3 py-1.5 rounded-lg border text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
            ← Home
          </Link>
          <h1 className="text-2xl font-black" style={{ color: 'var(--color-primary)' }}>Match History</h1>
          <span className="ml-auto text-sm font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-muted)' }}>
            {matches.length} {matches.length === 1 ? 'match' : 'matches'}
          </span>
        </div>

        {matches.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border-2 border-dashed" style={{ borderColor: 'var(--color-border)' }}>
            <div className="text-4xl mb-2">🏸</div>
            <p className="font-semibold" style={{ color: 'var(--color-text-muted)' }}>No matches played yet.</p>
            <Link to="/setup" className="inline-block mt-4 px-5 py-2.5 rounded-xl text-white font-semibold text-sm" style={{ backgroundColor: 'var(--color-primary)' }}>
              Start a Match
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map((m) => {
              const duration = m.endedAt ? formatDuration(m.endedAt - m.startedAt) : null;
              const completedGames = m.games.filter((g) => g.isComplete);
              const teamColor = (team: TeamId) => team === 'A' ? 'var(--color-score-a)' : 'var(--color-score-b)';

              return (
                <div
                  key={m.id}
                  className="p-4 rounded-2xl border-2"
                  style={{
                    borderColor: m.matchWinner ? (m.matchWinner === 'A' ? 'var(--color-score-a)' : 'var(--color-score-b)') : 'var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                  }}
                >
                  {/* Header row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
                      {m.config.playMode} · Best of {m.config.bestOf}
                      {duration && ` · ${duration}`}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {new Date(m.startedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>

                  {/* Score summary */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <p className="font-black text-lg truncate" style={{ color: teamColor('A') }}>{m.teams.A.name}</p>
                      {m.config.playMode === 'singles' && (
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{m.teams.A.players[0]?.name}</p>
                      )}
                    </div>
                    <div className="text-center px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-3xl font-black tabular-nums" style={{ color: teamColor('A') }}>{m.gamesWon.A}</span>
                        <span className="text-xl font-light" style={{ color: 'var(--color-text-muted)' }}>–</span>
                        <span className="text-3xl font-black tabular-nums" style={{ color: teamColor('B') }}>{m.gamesWon.B}</span>
                      </div>
                      {m.matchWinner && (
                        <p className="text-xs mt-0.5 font-semibold" style={{ color: teamColor(m.matchWinner) }}>
                          🏆 {m.teams[m.matchWinner].name}
                        </p>
                      )}
                    </div>
                    <div className="flex-1 text-right">
                      <p className="font-black text-lg truncate" style={{ color: teamColor('B') }}>{m.teams.B.name}</p>
                      {m.config.playMode === 'singles' && (
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{m.teams.B.players[0]?.name}</p>
                      )}
                    </div>
                  </div>

                  {/* Per-game scores */}
                  {completedGames.length > 0 && (
                    <div className="flex gap-2 mb-3">
                      {completedGames.map((g, i) => (
                        <div
                          key={i}
                          className="flex-1 text-center py-1.5 px-2 rounded-lg"
                          style={{ backgroundColor: 'var(--color-bg)' }}
                        >
                          <div className="text-xs font-semibold mb-0.5" style={{ color: 'var(--color-text-muted)' }}>G{i + 1}</div>
                          <div
                            className="text-sm font-black tabular-nums"
                            style={{ color: g.winner ? teamColor(g.winner) : 'var(--color-text)' }}
                          >
                            {g.scores.A}–{g.scores.B}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => handleExportJSON(m.id)} className="text-xs px-2.5 py-1.5 rounded-lg border font-medium" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                      JSON
                    </button>
                    <button onClick={() => handleExportCSV(m.id)} className="text-xs px-2.5 py-1.5 rounded-lg border font-medium" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                      CSV
                    </button>
                    <button onClick={() => handleExportPDF(m.id)} className="text-xs px-2.5 py-1.5 rounded-lg border font-medium" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                      PDF
                    </button>
                    <button onClick={() => handleDelete(m.id)} className="text-xs px-2.5 py-1.5 rounded-lg border border-red-300 text-red-500 hover:bg-red-50 font-medium ml-auto transition-colors">
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xs rounded-2xl p-6 space-y-4 text-center" style={{ backgroundColor: 'var(--color-surface)' }}>
            <div className="text-4xl">🔒</div>
            <h3 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
              Enter Operator PIN
            </h3>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Operator PIN is required to delete a match
            </p>
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => { setPin(e.target.value); setPinError(false); }}
              placeholder="••••"
              maxLength={8}
              autoFocus
              className="w-full p-3 rounded-lg border-2 text-center text-xl tracking-widest"
              style={{
                borderColor: pinError ? '#ef4444' : 'var(--color-border)',
                backgroundColor: 'var(--color-bg)',
                color: 'var(--color-text)',
              }}
              onKeyDown={(e) => { if (e.key === 'Enter') confirmDelete(); }}
            />
            {pinError && (
              <p className="text-sm text-red-500 font-medium">Incorrect PIN</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => { setDeleteTarget(null); setPin(''); setPinError(false); }}
                className="flex-1 py-2.5 rounded-xl border font-semibold text-sm"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white bg-red-500 hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
