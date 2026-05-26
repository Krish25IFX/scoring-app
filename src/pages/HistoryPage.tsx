import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllMatches, deleteMatch, getFullMatch } from '../persistence';
import { exportMatchJSON, exportMatchCSV, exportMatchPDF } from '../export';
import type { MatchSummary } from '../types';

export default function HistoryPage() {
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllMatches().then((m) => {
      setMatches(m);
      setLoading(false);
    });
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this match permanently?')) return;
    await deleteMatch(id);
    setMatches((prev) => prev.filter((m) => m.id !== id));
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
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>Match History</h1>
          <Link to="/" className="px-3 py-1 rounded border text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
            ← Home
          </Link>
        </div>

        {matches.length === 0 ? (
          <p className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>
            No matches played yet.
          </p>
        ) : (
          <div className="space-y-3">
            {matches.map((m) => (
              <div
                key={m.id}
                className="p-4 rounded-xl border-2 transition-colors"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold">
                    <span style={{ color: 'var(--color-score-a)' }}>{m.teams.A.name}</span>
                    {' vs '}
                    <span style={{ color: 'var(--color-score-b)' }}>{m.teams.B.name}</span>
                  </div>
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {new Date(m.startedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>
                  Games: {m.gamesWon.A}–{m.gamesWon.B}
                  {m.matchWinner && ` · Winner: ${m.teams[m.matchWinner].name}`}
                  {' · '}{m.config.playMode} · Best of {m.config.bestOf}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => handleExportJSON(m.id)} className="text-xs px-2 py-1 rounded border" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                    JSON
                  </button>
                  <button onClick={() => handleExportCSV(m.id)} className="text-xs px-2 py-1 rounded border" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                    CSV
                  </button>
                  <button onClick={() => handleExportPDF(m.id)} className="text-xs px-2 py-1 rounded border" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                    PDF
                  </button>
                  <button onClick={() => handleDelete(m.id)} className="text-xs px-2 py-1 rounded border border-red-300 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 ml-auto">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
