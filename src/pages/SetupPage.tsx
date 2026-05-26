import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMatch } from '../context/MatchContext';
import type { MatchConfig, PlayMode, TeamId } from '../types';

export default function SetupPage() {
  const navigate = useNavigate();
  const { startMatch } = useMatch();

  const [bestOf, setBestOf] = useState(3);
  const [pointsPerGame, setPointsPerGame] = useState('21');
  const [winByTwo, setWinByTwo] = useState(true);
  const [playMode, setPlayMode] = useState<PlayMode>('singles');
  const [teamAName, setTeamAName] = useState('Team A');
  const [teamBName, setTeamBName] = useState('Team B');
  const [teamAPlayers, setTeamAPlayers] = useState(['Player 1', 'Player 2']);
  const [teamBPlayers, setTeamBPlayers] = useState(['Player 3', 'Player 4']);
  const [firstServer, setFirstServer] = useState<TeamId>('A');
  const [changeEnds, setChangeEnds] = useState(true);

  const handleStart = () => {
    const pts = pointsPerGame.split(',').map((s) => parseInt(s.trim(), 10));
    const pointsToWin: number[] = [];
    for (let i = 0; i < bestOf; i++) {
      pointsToWin.push(pts[i] ?? pts[pts.length - 1]);
    }

    const config: MatchConfig = {
      bestOf,
      pointsToWin,
      winByTwo,
      pointCap: null,
      playMode,
      changeEndsAfterGame: changeEnds,
      changeEndsInDecidingGame: changeEnds,
      changeEndsAtScore: 11,
    };

    const playersA = playMode === 'singles' ? [teamAPlayers[0]] : teamAPlayers;
    const playersB = playMode === 'singles' ? [teamBPlayers[0]] : teamBPlayers;

    startMatch(
      config,
      { name: teamAName, players: playersA },
      { name: teamBName, players: playersB },
      firstServer
    );

    navigate('/operator');
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-lg mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-center" style={{ color: 'var(--color-primary)' }}>
          Match Setup
        </h1>

        {/* Play Mode */}
        <fieldset className="space-y-2">
          <legend className="font-semibold text-sm uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
            Play Mode
          </legend>
          <div className="flex gap-3">
            {(['singles', 'doubles'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setPlayMode(mode)}
                className={`flex-1 py-3 rounded-lg font-medium capitalize transition-colors border-2 ${
                  playMode === mode ? 'text-white' : ''
                }`}
                style={{
                  backgroundColor: playMode === mode ? 'var(--color-primary)' : 'transparent',
                  borderColor: playMode === mode ? 'var(--color-primary)' : 'var(--color-border)',
                  color: playMode === mode ? 'white' : 'var(--color-text)',
                }}
              >
                {mode}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Games */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Best of (games)
            </label>
            <select
              value={bestOf}
              onChange={(e) => setBestOf(Number(e.target.value))}
              className="w-full p-3 rounded-lg border-2"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
            >
              {[1, 3, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Points to win (per game, comma-separated)
            </label>
            <input
              type="text"
              value={pointsPerGame}
              onChange={(e) => setPointsPerGame(e.target.value)}
              placeholder="21 or 21,21,15"
              className="w-full p-3 rounded-lg border-2"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
            />
          </div>
        </div>

        {/* Win by 2 */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={winByTwo}
            onChange={(e) => setWinByTwo(e.target.checked)}
            className="w-5 h-5 rounded"
          />
          <span className="font-medium">Win by 2 (no cap)</span>
        </label>

        {/* Change Ends */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={changeEnds}
            onChange={(e) => setChangeEnds(e.target.checked)}
            className="w-5 h-5 rounded"
          />
          <span className="font-medium">Change ends after each game &amp; at 11 in deciding</span>
        </label>

        {/* Teams */}
        <div className="space-y-4">
          <h2 className="font-semibold" style={{ color: 'var(--color-text-muted)' }}>Teams</h2>

          <div className="p-4 rounded-lg border-2" style={{ borderColor: 'var(--color-score-a)', backgroundColor: 'var(--color-surface)' }}>
            <input
              type="text"
              value={teamAName}
              onChange={(e) => setTeamAName(e.target.value)}
              className="w-full p-2 rounded border mb-2 font-semibold"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
              aria-label="Team A name"
            />
            {(playMode === 'doubles' ? teamAPlayers : [teamAPlayers[0]]).map((p, i) => (
              <input
                key={i}
                type="text"
                value={p}
                onChange={(e) => {
                  const copy = [...teamAPlayers];
                  copy[i] = e.target.value;
                  setTeamAPlayers(copy);
                }}
                className="w-full p-2 rounded border mb-1 text-sm"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                aria-label={`Team A player ${i + 1}`}
              />
            ))}
          </div>

          <div className="p-4 rounded-lg border-2" style={{ borderColor: 'var(--color-score-b)', backgroundColor: 'var(--color-surface)' }}>
            <input
              type="text"
              value={teamBName}
              onChange={(e) => setTeamBName(e.target.value)}
              className="w-full p-2 rounded border mb-2 font-semibold"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
              aria-label="Team B name"
            />
            {(playMode === 'doubles' ? teamBPlayers : [teamBPlayers[0]]).map((p, i) => (
              <input
                key={i}
                type="text"
                value={p}
                onChange={(e) => {
                  const copy = [...teamBPlayers];
                  copy[i] = e.target.value;
                  setTeamBPlayers(copy);
                }}
                className="w-full p-2 rounded border mb-1 text-sm"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                aria-label={`Team B player ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* First Server */}
        <fieldset className="space-y-2">
          <legend className="font-semibold text-sm uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
            First Server
          </legend>
          <div className="flex gap-3">
            {(['A', 'B'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFirstServer(t)}
                className={`flex-1 py-3 rounded-lg font-medium transition-colors border-2`}
                style={{
                  backgroundColor: firstServer === t ? (t === 'A' ? 'var(--color-score-a)' : 'var(--color-score-b)') : 'transparent',
                  borderColor: t === 'A' ? 'var(--color-score-a)' : 'var(--color-score-b)',
                  color: firstServer === t ? 'white' : 'var(--color-text)',
                }}
              >
                {t === 'A' ? teamAName : teamBName}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Start Button */}
        <button
          onClick={handleStart}
          className="w-full py-4 rounded-xl text-white text-xl font-bold transition-transform hover:scale-105 active:scale-95"
          style={{ backgroundColor: 'var(--color-secondary)' }}
        >
          Start Match
        </button>
      </div>
    </div>
  );
}
