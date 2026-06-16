import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMatch } from '../context/MatchContext';
import { PLAYERS } from '../config/players';
import type { MatchConfig, PlayMode, TeamId } from '../types';

export default function SetupPage() {
  const navigate = useNavigate();
  const {
    startMatch,
    captains,
    captainSelections,
    selectedCaptainAId,
    selectedCaptainBId,
    setOperatorSelectedCaptain,
  } = useMatch();

  const [bestOf, setBestOf] = useState(3);
  const [pointsPerGame, setPointsPerGame] = useState('21');
  const [winByTwo, setWinByTwo] = useState(true);
  const [playMode, setPlayMode] = useState<PlayMode>('singles');
  const [teamAName, setTeamAName] = useState('');
  const [teamBName, setTeamBName] = useState('');
  const [teamAPlayers, setTeamAPlayers] = useState(['', '']);
  const [teamBPlayers, setTeamBPlayers] = useState(['', '']);
  const [operatorSelectedA, setOperatorSelectedA] = useState<string[]>([]);
  const [operatorSelectedB, setOperatorSelectedB] = useState<string[]>([]);
  const [firstServer, setFirstServer] = useState<TeamId>('A');
  const [changeEnds, setChangeEnds] = useState(true);

  const submittedCaptains = captains.filter((c) => (captainSelections[c.id] ?? []).length > 0);
  const selectedCaptainA = captains.find((c) => c.id === selectedCaptainAId) ?? null;
  const selectedCaptainB = captains.find((c) => c.id === selectedCaptainBId) ?? null;
  const selectedCaptainAPlayers = selectedCaptainAId ? (captainSelections[selectedCaptainAId] ?? []) : [];
  const selectedCaptainBPlayers = selectedCaptainBId ? (captainSelections[selectedCaptainBId] ?? []) : [];

  // When captain is selected, initialize operator selection with their players
  useEffect(() => {
    if (selectedCaptainA && operatorSelectedA.length === 0) {
      setOperatorSelectedA(selectedCaptainAPlayers);
    }
  }, [selectedCaptainA, selectedCaptainAPlayers, operatorSelectedA.length]);

  useEffect(() => {
    if (selectedCaptainB && operatorSelectedB.length === 0) {
      setOperatorSelectedB(selectedCaptainBPlayers);
    }
  }, [selectedCaptainB, selectedCaptainBPlayers, operatorSelectedB.length]);

  // Update team players based on operator selection
  useEffect(() => {
    if (selectedCaptainA) {
      if (playMode === 'singles') {
        setTeamAPlayers([operatorSelectedA[0] || '', '']);
        setTeamAName(operatorSelectedA[0] || '');
      } else {
        const players = operatorSelectedA.slice(0, 2);
        setTeamAPlayers(players.length === 2 ? (players as [string, string]) : [players[0] || '', players[1] || '']);
      }
    }
  }, [selectedCaptainA, playMode, operatorSelectedA]);

  useEffect(() => {
    if (selectedCaptainB) {
      if (playMode === 'singles') {
        setTeamBPlayers([operatorSelectedB[0] || '', '']);
        setTeamBName(operatorSelectedB[0] || '');
      } else {
        const players = operatorSelectedB.slice(0, 2);
        setTeamBPlayers(players.length === 2 ? (players as [string, string]) : [players[0] || '', players[1] || '']);
      }
    }
  }, [selectedCaptainB, playMode, operatorSelectedB]);

  // Auto-set team name from player name (singles only, no captain)
  useEffect(() => {
    if (playMode === 'singles' && !selectedCaptainA) {
      if (teamAPlayers[0]) setTeamAName(teamAPlayers[0]);
    }
    if (playMode === 'singles' && !selectedCaptainB) {
      if (teamBPlayers[0]) setTeamBName(teamBPlayers[0]);
    }
  }, [playMode, teamAPlayers[0], teamBPlayers[0], selectedCaptainA, selectedCaptainB]);

  const requiredA = playMode === 'singles' ? [teamAPlayers[0]] : [teamAPlayers[0], teamAPlayers[1]];
  const requiredB = playMode === 'singles' ? [teamBPlayers[0]] : [teamBPlayers[0], teamBPlayers[1]];
  const canStart =
    requiredA.every(Boolean) &&
    requiredB.every(Boolean) &&
    Boolean(selectedCaptainAId) &&
    Boolean(selectedCaptainBId) &&
    selectedCaptainAId !== selectedCaptainBId;

  const handleStart = () => {
    if (!canStart) return;
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
    const nameA = teamAName || playersA[0];
    const nameB = teamBName || playersB[0];

    startMatch(config, { name: nameA, players: playersA }, { name: nameB, players: playersB }, firstServer);
    navigate('/operator');
  };

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-sm px-3 py-1.5 rounded-lg border" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
            ← Home
          </Link>
          <h1 className="text-2xl font-black" style={{ color: 'var(--color-primary)' }}>Match Setup</h1>
        </div>

        {/* Captain Selection */}
        <div className="space-y-4 p-4 rounded-lg border-2" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Select Captain Teams</p>
          
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-semibold" style={{ color: 'var(--color-score-a)' }}>Team A Captain</label>
              <select
                value={selectedCaptainAId || ''}
                onChange={(e) => {
                  setOperatorSelectedCaptain('A', e.target.value);
                  setOperatorSelectedA([]);
                }}
                className="w-full p-2 rounded-lg border-2 text-sm"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
              >
                <option value="">— Select Team A Captain —</option>
                {submittedCaptains
                  .filter((captain) => captain.id !== selectedCaptainBId)
                  .map((captain) => (
                  <option key={captain.id} value={captain.id}>
                    {captain.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold" style={{ color: 'var(--color-score-b)' }}>Team B Captain</label>
              <select
                value={selectedCaptainBId || ''}
                onChange={(e) => {
                  setOperatorSelectedCaptain('B', e.target.value);
                  setOperatorSelectedB([]);
                }}
                className="w-full p-2 rounded-lg border-2 text-sm"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
              >
                <option value="">— Select Team B Captain —</option>
                {submittedCaptains
                  .filter((captain) => captain.id !== selectedCaptainAId)
                  .map((captain) => (
                  <option key={captain.id} value={captain.id}>
                    {captain.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
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
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--color-score-a)' }}>Side A</p>
            {selectedCaptainA ? (
              <div className="space-y-3">
                <div className="text-sm font-medium">Captain: {selectedCaptainA.name}</div>
                <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Select players to include in today's match:</div>
                <div className="space-y-2">
                  {selectedCaptainAPlayers.map((player) => (
                    <label
                      key={player}
                      className="flex items-center gap-3 p-2 rounded cursor-pointer"
                      style={{ backgroundColor: 'var(--color-bg)' }}
                    >
                      <input
                        type="checkbox"
                        checked={operatorSelectedA.includes(player)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setOperatorSelectedA([...operatorSelectedA, player]);
                          } else {
                            setOperatorSelectedA(operatorSelectedA.filter((p) => p !== player));
                          }
                        }}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm font-medium">{player}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {playMode === 'doubles' && (
                  <input
                    type="text"
                    value={teamAName}
                    onChange={(e) => setTeamAName(e.target.value)}
                    placeholder="Team name (optional)"
                    className="w-full p-2 rounded border mb-2 font-semibold"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                    aria-label="Team A name"
                  />
                )}
                {(playMode === 'doubles' ? [0, 1] : [0]).map((i) => {
                  const allSelected = [...teamAPlayers, ...teamBPlayers];
                  const available = PLAYERS.filter(
                    (p) => !allSelected.includes(p) || teamAPlayers[i] === p
                  );
                  return (
                    <select
                      key={i}
                      value={teamAPlayers[i]}
                      onChange={(e) => {
                        const copy = [...teamAPlayers];
                        copy[i] = e.target.value;
                        setTeamAPlayers(copy);
                      }}
                      className="w-full p-2 rounded border mb-1 text-sm"
                      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                      aria-label={`Team A player ${i + 1}`}
                    >
                      <option value="">— Select player {i + 1} —</option>
                      {available.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  );
                })}
              </>
            )}
          </div>

          <div className="p-4 rounded-lg border-2" style={{ borderColor: 'var(--color-score-b)', backgroundColor: 'var(--color-surface)' }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--color-score-b)' }}>Side B</p>
            {selectedCaptainB ? (
              <div className="space-y-3">
                <div className="text-sm font-medium">Captain: {selectedCaptainB.name}</div>
                <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Select players to include in today's match:</div>
                <div className="space-y-2">
                  {selectedCaptainBPlayers.map((player) => (
                    <label
                      key={player}
                      className="flex items-center gap-3 p-2 rounded cursor-pointer"
                      style={{ backgroundColor: 'var(--color-bg)' }}
                    >
                      <input
                        type="checkbox"
                        checked={operatorSelectedB.includes(player)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setOperatorSelectedB([...operatorSelectedB, player]);
                          } else {
                            setOperatorSelectedB(operatorSelectedB.filter((p) => p !== player));
                          }
                        }}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm font-medium">{player}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {playMode === 'doubles' && (
                  <input
                    type="text"
                    value={teamBName}
                    onChange={(e) => setTeamBName(e.target.value)}
                    placeholder="Team name (optional)"
                    className="w-full p-2 rounded border mb-2 font-semibold"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                    aria-label="Team B name"
                  />
                )}
                {(playMode === 'doubles' ? [0, 1] : [0]).map((i) => {
                  const allSelected = [...teamAPlayers, ...teamBPlayers];
                  const available = PLAYERS.filter(
                    (p) => !allSelected.includes(p) || teamBPlayers[i] === p
                  );
                  return (
                    <select
                      key={i}
                      value={teamBPlayers[i]}
                      onChange={(e) => {
                        const copy = [...teamBPlayers];
                        copy[i] = e.target.value;
                        setTeamBPlayers(copy);
                      }}
                      className="w-full p-2 rounded border mb-1 text-sm"
                      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                      aria-label={`Team B player ${i + 1}`}
                    >
                      <option value="">— Select player {i + 1} —</option>
                      {available.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  );
                })}
              </>
            )}
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
          disabled={!canStart}
          className="w-full py-4 rounded-xl text-white text-xl font-bold transition-transform hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          style={{ backgroundColor: 'var(--color-secondary)' }}
        >
          {canStart ? '▶ Start Match' : 'Select captains and players to continue'}
        </button>
      </div>
    </div>
  );
}
