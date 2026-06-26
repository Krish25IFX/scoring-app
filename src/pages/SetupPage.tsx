import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMatch } from '../context/MatchContext';
import type { MatchConfig, PlayMode, TeamId, Category } from '../types';
import { CATEGORIES } from '../types';

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

  const [category, setCategory] = useState<Category>('mens_single');
  const [bestOf, setBestOf] = useState(3);
  const [pointsPerGame, setPointsPerGame] = useState('11');
  const [winByTwo, setWinByTwo] = useState(true);
  const [pointCap, setPointCap] = useState(15);
  const [playMode, setPlayMode] = useState<PlayMode>('singles');
  const [teamAName, setTeamAName] = useState('');
  const [teamBName, setTeamBName] = useState('');
  const [teamAPlayers, setTeamAPlayers] = useState(['', '']);
  const [teamBPlayers, setTeamBPlayers] = useState(['', '']);
  const [operatorSelectedA, setOperatorSelectedA] = useState<string[]>([]);
  const [operatorSelectedB, setOperatorSelectedB] = useState<string[]>([]);
  const [firstServer, setFirstServer] = useState<TeamId>('A');
  const [firstReceiverPlayerIndex, setFirstReceiverPlayerIndex] = useState(0);

  // When category changes, update play mode
  useEffect(() => {
    const cat = CATEGORIES.find((c) => c.id === category);
    if (cat) setPlayMode(cat.mode);
  }, [category]);

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
        setTeamAName(selectedCaptainA.teamName);
      } else {
        const players = operatorSelectedA.slice(0, 2);
        setTeamAPlayers(players.length === 2 ? (players as [string, string]) : [players[0] || '', players[1] || '']);
        setTeamAName(selectedCaptainA.teamName);
      }
    }
  }, [selectedCaptainA, playMode, operatorSelectedA]);

  useEffect(() => {
    if (selectedCaptainB) {
      if (playMode === 'singles') {
        setTeamBPlayers([operatorSelectedB[0] || '', '']);
        setTeamBName(selectedCaptainB.teamName);
      } else {
        const players = operatorSelectedB.slice(0, 2);
        setTeamBPlayers(players.length === 2 ? (players as [string, string]) : [players[0] || '', players[1] || '']);
        setTeamBName(selectedCaptainB.teamName);
      }
    }
  }, [selectedCaptainB, playMode, operatorSelectedB]);

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
      pointCap: winByTwo ? pointCap : null,
      playMode,
      category,
      changeEndsAfterGame: true,
      changeEndsInDecidingGame: false,
      changeEndsAtScore: 0,
    };

    const playersA = playMode === 'singles' ? [teamAPlayers[0]] : teamAPlayers;
    const playersB = playMode === 'singles' ? [teamBPlayers[0]] : teamBPlayers;
    const nameA = teamAName || playersA[0];
    const nameB = teamBName || playersB[0];

    startMatch(
      config,
      { name: nameA, players: playersA },
      { name: nameB, players: playersB },
      firstServer,
      category,
      selectedCaptainA?.teamName || nameA,
      selectedCaptainB?.teamName || nameB,
      firstReceiverPlayerIndex
    );
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
            Category
          </legend>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="w-full p-3 rounded-lg border-2"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.label} ({cat.mode})</option>
            ))}
          </select>
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

        {/* Win by 2 with cap */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={winByTwo}
            onChange={(e) => setWinByTwo(e.target.checked)}
            className="w-5 h-5 rounded"
          />
          <span className="font-medium">Win by 2 (max {pointCap} points on deuce)</span>
        </label>

        {winByTwo && (
          <div className="space-y-1">
            <label className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Point cap (max on deuce)
            </label>
            <input
              type="number"
              value={pointCap}
              onChange={(e) => setPointCap(Number(e.target.value))}
              min={1}
              className="w-full p-3 rounded-lg border-2"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
            />
          </div>
        )}

        {/* Side change info */}
        <div className="p-3 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            ℹ️ Side change happens after each match (set) only. No side change at half point.
          </p>
        </div>

        {/* Teams - Player Selection */}
        <div className="space-y-4">
          <h2 className="font-semibold" style={{ color: 'var(--color-text-muted)' }}>Players for this Match</h2>

          <div className="p-4 rounded-lg border-2" style={{ borderColor: 'var(--color-score-a)', backgroundColor: 'var(--color-surface)' }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--color-score-a)' }}>
              Side A {selectedCaptainA ? `(${selectedCaptainA.teamName})` : ''}
            </p>
            {selectedCaptainA ? (
              <div className="space-y-3">
                <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Select {playMode === 'singles' ? '1 player' : '2 players'} for this match:
                </div>
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
                            const maxPlayers = playMode === 'singles' ? 1 : 2;
                            const newSel = [...operatorSelectedA, player].slice(-maxPlayers);
                            setOperatorSelectedA(newSel);
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
              <div className="space-y-2">
                {(playMode === 'doubles' ? [0, 1] : [0]).map((i) => (
                  <input
                    key={i}
                    type="text"
                    value={teamAPlayers[i]}
                    onChange={(e) => {
                      const copy = [...teamAPlayers];
                      copy[i] = e.target.value;
                      setTeamAPlayers(copy);
                    }}
                    placeholder={`Player ${i + 1} name`}
                    className="w-full p-2 rounded border text-sm"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                  />
                ))}
                <input
                  type="text"
                  value={teamAName}
                  onChange={(e) => setTeamAName(e.target.value)}
                  placeholder="Team name"
                  className="w-full p-2 rounded border text-sm font-semibold"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                />
              </div>
            )}
          </div>

          <div className="p-4 rounded-lg border-2" style={{ borderColor: 'var(--color-score-b)', backgroundColor: 'var(--color-surface)' }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--color-score-b)' }}>
              Side B {selectedCaptainB ? `(${selectedCaptainB.teamName})` : ''}
            </p>
            {selectedCaptainB ? (
              <div className="space-y-3">
                <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Select {playMode === 'singles' ? '1 player' : '2 players'} for this match:
                </div>
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
                            const maxPlayers = playMode === 'singles' ? 1 : 2;
                            const newSel = [...operatorSelectedB, player].slice(-maxPlayers);
                            setOperatorSelectedB(newSel);
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
              <div className="space-y-2">
                {(playMode === 'doubles' ? [0, 1] : [0]).map((i) => (
                  <input
                    key={i}
                    type="text"
                    value={teamBPlayers[i]}
                    onChange={(e) => {
                      const copy = [...teamBPlayers];
                      copy[i] = e.target.value;
                      setTeamBPlayers(copy);
                    }}
                    placeholder={`Player ${i + 1} name`}
                    className="w-full p-2 rounded border text-sm"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                  />
                ))}
                <input
                  type="text"
                  value={teamBName}
                  onChange={(e) => setTeamBName(e.target.value)}
                  placeholder="Team name"
                  className="w-full p-2 rounded border text-sm font-semibold"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                />
              </div>
            )}
          </div>
        </div>

        {/* First Server (determines which side serves first) */}
        <fieldset className="space-y-2">
          <legend className="font-semibold text-sm uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
            First Server (side known from this)
          </legend>
          <div className="flex gap-3">
            {(['A', 'B'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFirstServer(t)}
                className="flex-1 py-3 rounded-lg font-medium transition-colors border-2"
                style={{
                  backgroundColor: firstServer === t ? (t === 'A' ? 'var(--color-score-a)' : 'var(--color-score-b)') : 'transparent',
                  borderColor: t === 'A' ? 'var(--color-score-a)' : 'var(--color-score-b)',
                  color: firstServer === t ? 'white' : 'var(--color-text)',
                }}
              >
                {t === 'A' ? (teamAName || 'Side A') : (teamBName || 'Side B')}
              </button>
            ))}
          </div>
        </fieldset>

        {/* First Receiver (for doubles) */}
        {playMode === 'doubles' && (
          <fieldset className="space-y-2">
            <legend className="font-semibold text-sm uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
              First Receiver (receiving team)
            </legend>
            <div className="flex gap-3">
              {[0, 1].map((idx) => {
                const receivingTeam = firstServer === 'A' ? 'B' : 'A';
                const playerName = receivingTeam === 'A' ? teamAPlayers[idx] : teamBPlayers[idx];
                return (
                  <button
                    key={idx}
                    onClick={() => setFirstReceiverPlayerIndex(idx)}
                    className="flex-1 py-3 rounded-lg font-medium transition-colors border-2"
                    style={{
                      backgroundColor: firstReceiverPlayerIndex === idx ? 'var(--color-primary)' : 'transparent',
                      borderColor: 'var(--color-primary)',
                      color: firstReceiverPlayerIndex === idx ? 'white' : 'var(--color-text)',
                    }}
                  >
                    {playerName || `Player ${idx + 1}`}
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

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
