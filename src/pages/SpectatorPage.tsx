import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMatch } from '../context/MatchContext';

export default function SpectatorPage() {
  const navigate = useNavigate();
  const { match } = useMatch();

  useEffect(() => {
    if (!match) navigate('/');
  }, [match, navigate]);

  if (!match) return null;

  const currentGame = match.games[match.currentGameIndex];
  const isOver = match.matchWinner !== null;
  const servingA = currentGame.serviceState.servingTeam === 'A';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Game tally */}
      <div className="text-lg md:text-2xl font-medium mb-4" style={{ color: 'var(--color-text-muted)' }}>
        Game {match.currentGameIndex + 1} of {match.config.bestOf} · Best of {match.config.bestOf}
      </div>

      {/* Big Scoreboard */}
      <div className="flex items-center justify-center gap-4 md:gap-12 w-full max-w-4xl">
        {/* Team A */}
        <div className="flex-1 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            {servingA && <span className="text-2xl md:text-4xl" title="Serving">🏸</span>}
            <h2 className="text-2xl md:text-4xl font-bold truncate" style={{ color: 'var(--color-score-a)' }}>
              {match.teams.A.name}
            </h2>
          </div>
          <div
            className="text-7xl md:text-[12rem] font-black leading-none"
            style={{ color: 'var(--color-score-a)' }}
            aria-label={`${match.teams.A.name} score: ${currentGame.scores.A}`}
          >
            {currentGame.scores.A}
          </div>
          <div className="text-xl md:text-3xl mt-2 font-semibold" style={{ color: 'var(--color-text-muted)' }}>
            Games: {match.gamesWon.A}
          </div>
        </div>

        {/* Divider */}
        <div className="text-4xl md:text-6xl font-light" style={{ color: 'var(--color-text-muted)' }}>–</div>

        {/* Team B */}
        <div className="flex-1 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <h2 className="text-2xl md:text-4xl font-bold truncate" style={{ color: 'var(--color-score-b)' }}>
              {match.teams.B.name}
            </h2>
            {!servingA && <span className="text-2xl md:text-4xl" title="Serving">🏸</span>}
          </div>
          <div
            className="text-7xl md:text-[12rem] font-black leading-none"
            style={{ color: 'var(--color-score-b)' }}
            aria-label={`${match.teams.B.name} score: ${currentGame.scores.B}`}
          >
            {currentGame.scores.B}
          </div>
          <div className="text-xl md:text-3xl mt-2 font-semibold" style={{ color: 'var(--color-text-muted)' }}>
            Games: {match.gamesWon.B}
          </div>
        </div>
      </div>

      {/* Match over */}
      {isOver && (
        <div className="mt-8 text-3xl md:text-5xl font-bold text-green-600">
          🏆 {match.teams[match.matchWinner!].name} wins!
        </div>
      )}

      {/* Paused */}
      {match.isPaused && !isOver && (
        <div className="mt-8 text-2xl md:text-4xl font-bold text-yellow-600 animate-pulse">
          ⏸ PAUSED
        </div>
      )}

      {/* Nav */}
      <div className="mt-8 flex gap-4">
        <Link to="/operator" className="px-4 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
          ← Operator View
        </Link>
      </div>
    </div>
  );
}
