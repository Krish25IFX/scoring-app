import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllMatches } from '../persistence';
import { fetchAllMatches } from '../api';
import { TEAM_NAMES } from '../config/players';
import type { MatchSummary, MatchState, StandingsRow } from '../types';

function computeStandings(matches: MatchSummary[]): StandingsRow[] {
  const teamStats: Record<string, { gamesWon: number; setsWon: number; totalPoints: number; totalOpponentPoints: number }> = {};

  // Initialize all teams
  for (const name of TEAM_NAMES) {
    teamStats[name] = { gamesWon: 0, setsWon: 0, totalPoints: 0, totalOpponentPoints: 0 };
  }

  // Process completed matches only
  for (const match of matches) {
    if (!match.matchWinner) continue;

    const teamAName = match.teamAName || match.teams.A.name;
    const teamBName = match.teamBName || match.teams.B.name;

    // Aggregate points from all games in the match
    let totalA = 0;
    let totalB = 0;
    for (const game of match.games) {
      totalA += game.scores.A;
      totalB += game.scores.B;
    }

    // Match win (1 per complete match won)
    const matchWinnerName = match.matchWinner === 'A' ? teamAName : teamBName;

    // Sets won (individual game wins within this match)
    const setsWonA = match.gamesWon.A;
    const setsWonB = match.gamesWon.B;

    if (teamStats[teamAName]) {
      if (matchWinnerName === teamAName) teamStats[teamAName].gamesWon += 1;
      teamStats[teamAName].setsWon += setsWonA;
      teamStats[teamAName].totalPoints += totalA;
      teamStats[teamAName].totalOpponentPoints += totalB;
    }

    if (teamStats[teamBName]) {
      if (matchWinnerName === teamBName) teamStats[teamBName].gamesWon += 1;
      teamStats[teamBName].setsWon += setsWonB;
      teamStats[teamBName].totalPoints += totalB;
      teamStats[teamBName].totalOpponentPoints += totalA;
    }
  }

  // Build rows and sort
  const rows: StandingsRow[] = Object.entries(teamStats).map(([teamName, stats]) => ({
    teamName,
    gamesWon: stats.gamesWon,
    setsWon: stats.setsWon,
    totalPoints: stats.totalPoints,
    totalOpponentPoints: stats.totalOpponentPoints,
    rankingPoints: stats.totalPoints - stats.totalOpponentPoints,
    rank: 0,
  }));

  // Sort: primary by gamesWon desc, secondary by setsWon desc, tertiary by rankingPoints desc
  rows.sort((a, b) => {
    if (b.gamesWon !== a.gamesWon) return b.gamesWon - a.gamesWon;
    if (b.setsWon !== a.setsWon) return b.setsWon - a.setsWon;
    return b.rankingPoints - a.rankingPoints;
  });

  // Assign ranks
  rows.forEach((row, i) => {
    row.rank = i + 1;
  });

  return rows;
}

export default function StandingsPage() {
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
        setMatches(summaries);
        setLoading(false);
      })
      .catch(() => {
        getAllMatches().then((m) => {
          setMatches(m);
          setLoading(false);
        });
      });
  }, []);

  const standings = computeStandings(matches);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/" className="px-3 py-1.5 rounded-lg border text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
            ← Home
          </Link>
          <h1 className="text-2xl font-black" style={{ color: 'var(--color-primary)' }}>Tournament Standings</h1>
        </div>

        {standings.every((r) => r.gamesWon === 0) ? (
          <div className="text-center py-16 rounded-2xl border-2 border-dashed" style={{ borderColor: 'var(--color-border)' }}>
            <div className="text-4xl mb-2">📊</div>
            <p className="font-semibold" style={{ color: 'var(--color-text-muted)' }}>No completed matches yet.</p>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>Standings will appear once matches are played.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border-2" style={{ borderColor: 'var(--color-border)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: 'var(--color-surface)' }}>
                  <th className="text-left px-4 py-3 font-bold" style={{ color: 'var(--color-text-muted)' }}>#</th>
                  <th className="text-left px-4 py-3 font-bold" style={{ color: 'var(--color-text-muted)' }}>Team</th>
                  <th className="text-center px-4 py-3 font-bold" style={{ color: 'var(--color-text-muted)' }}>Games Won</th>
                  <th className="text-center px-4 py-3 font-bold" style={{ color: 'var(--color-text-muted)' }}>Sets Won</th>
                  <th className="text-center px-4 py-3 font-bold" style={{ color: 'var(--color-text-muted)' }}>Points</th>
                  <th className="text-center px-4 py-3 font-bold" style={{ color: 'var(--color-text-muted)' }}>Opp. Points</th>
                  <th className="text-center px-4 py-3 font-bold" style={{ color: 'var(--color-text-muted)' }}>Ranking Pts</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((row) => (
                  <tr
                    key={row.teamName}
                    className="border-t"
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    <td className="px-4 py-3 font-black text-lg" style={{ color: row.rank <= 2 ? 'var(--color-primary)' : 'var(--color-text)' }}>
                      {row.rank}
                    </td>
                    <td className="px-4 py-3 font-semibold" style={{ color: 'var(--color-text)' }}>
                      {row.teamName}
                    </td>
                    <td className="px-4 py-3 text-center font-bold tabular-nums" style={{ color: 'var(--color-primary)' }}>
                      {row.gamesWon}
                    </td>
                    <td className="px-4 py-3 text-center font-bold tabular-nums" style={{ color: 'var(--color-text)' }}>
                      {row.setsWon}
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums" style={{ color: 'var(--color-text)' }}>
                      {row.totalPoints}
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums" style={{ color: 'var(--color-text-muted)' }}>
                      {row.totalOpponentPoints}
                    </td>
                    <td
                      className="px-4 py-3 text-center font-bold tabular-nums"
                      style={{ color: row.rankingPoints >= 0 ? 'var(--color-score-a)' : 'var(--color-score-b)' }}
                    >
                      {row.rankingPoints > 0 ? '+' : ''}{row.rankingPoints}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Rules summary */}
        <div className="mt-6 p-4 rounded-xl border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <h3 className="font-bold text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>Ranking Rules</h3>
          <ul className="text-xs space-y-1" style={{ color: 'var(--color-text-muted)' }}>
            <li>• Team with highest <strong>Games Won</strong> (complete match wins) ranks first</li>
            <li>• If still equal, <strong>Ranking Points</strong> (Team Points − Opponent Points) breaks the tie</li>
            <li>• If still tied, a Mix Double tiebreaker match is played</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
