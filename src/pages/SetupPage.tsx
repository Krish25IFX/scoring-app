import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMatch } from '../context/MatchContext';
import type { MatchConfig, PlayMode, TeamId, Category } from '../types';
import { CATEGORIES } from '../types';
import { getTodaySchedule } from '../config/schedule';

export default function SetupPage() {
  const navigate = useNavigate();
  const {
    startMatch,
    captains,
    captainSelections,
    selectedCaptainAId,
    selectedCaptainBId,
    setOperatorSelectedCaptain,
    canPlayerPlay,
    recordForfeit,
    refreshMatchHistory,
    refreshCaptainSelections,
  } = useMatch();

  // Refresh match history + captain selections so data is up-to-date
  useEffect(() => {
    refreshMatchHistory();
    refreshCaptainSelections();
  }, [refreshMatchHistory, refreshCaptainSelections]);

  const todaySchedule = getTodaySchedule();
  const category: Category = todaySchedule?.category ?? 'mens_single';
  const [bestOf, setBestOf] = useState(3);
  const [pointsPerGame, setPointsPerGame] = useState('11');
  const [winByTwo, setWinByTwo] = useState(true);
  const [pointCap, setPointCap] = useState(15);
  const [teamAName, setTeamAName] = useState('');
  const [teamBName, setTeamBName] = useState('');
  const [teamAPlayers, setTeamAPlayers] = useState(['', '']);
  const [teamBPlayers, setTeamBPlayers] = useState(['', '']);
  const [operatorSelectedA, setOperatorSelectedA] = useState<string[]>([]);
  const [operatorSelectedB, setOperatorSelectedB] = useState<string[]>([]);
  const [firstServer, setFirstServer] = useState<TeamId>('A');
  const [firstReceiverPlayerIndex, setFirstReceiverPlayerIndex] = useState(0);

  // Derive play mode from category (no effect needed)
  const playMode: PlayMode = CATEGORIES.find((c) => c.id === category)?.mode ?? 'singles';

  const submittedCaptains = captains.filter((c) => {
    const sel = captainSelections[c.id];
    // Captain has submitted for the current category
    return sel && sel[category] && Object.keys(sel[category]).length > 0;
  });
  const selectedCaptainA = captains.find((c) => c.id === selectedCaptainAId) ?? null;
  const selectedCaptainB = captains.find((c) => c.id === selectedCaptainBId) ?? null;

  // Get players selected specifically for the opponent team IN THIS CATEGORY
  const selectedCaptainAPlayers = (selectedCaptainAId && selectedCaptainBId)
    ? (captainSelections[selectedCaptainAId]?.[category]?.[selectedCaptainBId] ?? [])
    : [];

  const selectedCaptainBPlayers = (selectedCaptainBId && selectedCaptainAId)
    ? (captainSelections[selectedCaptainBId]?.[category]?.[selectedCaptainAId] ?? [])
    : [];

  // Derive effective players directly from captain selections (no operator override needed if exact count)
  const maxPlayers = playMode === 'singles' ? 1 : 2;
  const effectiveAPlayers = selectedCaptainA
    ? (selectedCaptainAPlayers.length <= maxPlayers ? selectedCaptainAPlayers : operatorSelectedA)
    : [];
  const effectiveBPlayers = selectedCaptainB
    ? (selectedCaptainBPlayers.length <= maxPlayers ? selectedCaptainBPlayers : operatorSelectedB)
    : [];

  // Derive team names and players for match start
  const finalTeamAName = selectedCaptainA ? selectedCaptainA.teamName : teamAName;
  const finalTeamBName = selectedCaptainB ? selectedCaptainB.teamName : teamBName;
  const finalTeamAPlayers = selectedCaptainA
    ? (playMode === 'singles' ? [effectiveAPlayers[0] || ''] : effectiveAPlayers.slice(0, 2))
    : (playMode === 'singles' ? [teamAPlayers[0]] : teamAPlayers);
  const finalTeamBPlayers = selectedCaptainB
    ? (playMode === 'singles' ? [effectiveBPlayers[0] || ''] : effectiveBPlayers.slice(0, 2))
    : (playMode === 'singles' ? [teamBPlayers[0]] : teamBPlayers);

  const requiredA = playMode === 'singles' ? [finalTeamAPlayers[0]] : [finalTeamAPlayers[0], finalTeamAPlayers[1]];
  const requiredB = playMode === 'singles' ? [finalTeamBPlayers[0]] : [finalTeamBPlayers[0], finalTeamBPlayers[1]];
  const isAfter2PM = new Date().getHours() >= 14;
  const captainsReady =
    requiredA.every(Boolean) &&
    requiredB.every(Boolean) &&
    Boolean(selectedCaptainAId) &&
    Boolean(selectedCaptainBId) &&
    selectedCaptainAId !== selectedCaptainBId;
  const canStart = isAfter2PM && captainsReady;

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

    const playersA = finalTeamAPlayers.filter(Boolean);
    const playersB = finalTeamBPlayers.filter(Boolean);
    const nameA = finalTeamAName || playersA[0];
    const nameB = finalTeamBName || playersB[0];

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
        {/* Category — auto-set from today's schedule */}
        <div className="p-3 rounded-lg border-2" style={{ borderColor: 'var(--color-secondary)', backgroundColor: 'var(--color-surface)' }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Today's Category</p>
          <p className="text-lg font-bold mt-1" style={{ color: 'var(--color-secondary)' }}>
            {CATEGORIES.find((c) => c.id === category)?.label ?? category}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {playMode === 'singles' ? 'Singles (1 player)' : 'Doubles (2 players)'} {todaySchedule ? `· ${todaySchedule.timing}` : ''}
          </p>
        </div>

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
                {/* If captain selected exact number needed, show locked display */}
                {selectedCaptainAPlayers.length <= (playMode === 'singles' ? 1 : 2) ? (
                  <div className="space-y-2">
                    <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      Player{playMode === 'doubles' ? 's' : ''} (from captain selection):
                    </div>
                    {selectedCaptainAPlayers.map((player) => (
                      <div
                        key={player}
                        className="flex items-center gap-3 p-2 rounded"
                        style={{ backgroundColor: 'var(--color-bg)' }}
                      >
                        <span className="text-sm font-bold" style={{ color: 'var(--color-score-a)' }}>✓</span>
                        <span className="text-sm font-medium">{player.replace(/F$/, '')}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* If more players than needed (shouldn't happen with new rules), show picker */
                  <div className="space-y-2">
                    <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      Select {playMode === 'singles' ? '1 player' : '2 players'} for this match:
                    </div>
                    {selectedCaptainAPlayers.map((player) => {
                      const eligible = (selectedCaptainAId && selectedCaptainBId) ? canPlayerPlay(player, category, selectedCaptainAId, selectedCaptainBId, todaySchedule?.isFinal ?? false) : true;
                      return (
                      <label
                        key={player}
                        className="flex items-center gap-3 p-2 rounded cursor-pointer"
                        style={{ backgroundColor: 'var(--color-bg)', opacity: eligible ? 1 : 0.4 }}
                      >
                        <input
                          type="checkbox"
                          checked={operatorSelectedA.includes(player)}
                          disabled={!eligible}
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
                        <span className="text-sm font-medium">{player.replace(/F$/, '')}</span>
                        {!eligible && <span className="text-xs text-red-500 ml-auto">Max 2 games reached</span>}
                      </label>
                      );
                    })}
                  </div>
                )}
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
                {/* If captain selected exact number needed, show locked display */}
                {selectedCaptainBPlayers.length <= (playMode === 'singles' ? 1 : 2) ? (
                  <div className="space-y-2">
                    <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      Player{playMode === 'doubles' ? 's' : ''} (from captain selection):
                    </div>
                    {selectedCaptainBPlayers.map((player) => (
                      <div
                        key={player}
                        className="flex items-center gap-3 p-2 rounded"
                        style={{ backgroundColor: 'var(--color-bg)' }}
                      >
                        <span className="text-sm font-bold" style={{ color: 'var(--color-score-b)' }}>✓</span>
                        <span className="text-sm font-medium">{player.replace(/F$/, '')}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* If more players than needed, show picker */
                  <div className="space-y-2">
                    <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      Select {playMode === 'singles' ? '1 player' : '2 players'} for this match:
                    </div>
                    {selectedCaptainBPlayers.map((player) => {
                      const eligible = (selectedCaptainBId && selectedCaptainAId) ? canPlayerPlay(player, category, selectedCaptainBId, selectedCaptainAId, todaySchedule?.isFinal ?? false) : true;
                      return (
                      <label
                        key={player}
                        className="flex items-center gap-3 p-2 rounded cursor-pointer"
                        style={{ backgroundColor: 'var(--color-bg)', opacity: eligible ? 1 : 0.4 }}
                      >
                        <input
                          type="checkbox"
                          checked={operatorSelectedB.includes(player)}
                          disabled={!eligible}
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
                        <span className="text-sm font-medium">{player.replace(/F$/, '')}</span>
                        {!eligible && <span className="text-xs text-red-500 ml-auto">Max 2 games reached</span>}
                      </label>
                      );
                    })}
                  </div>
                )}
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
          {!isAfter2PM ? '⏰ Match setup available from 2:00 PM' : captainsReady ? '▶ Start Match' : 'Select captains and players to continue'}
        </button>

        {/* Forfeit Section */}
        {selectedCaptainAId && selectedCaptainBId && selectedCaptainAId !== selectedCaptainBId && (
          <div className="p-4 rounded-lg border-2 space-y-3" style={{ borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}>
            <p className="text-sm font-bold" style={{ color: '#ef4444' }}>⚠️ Forfeit / Walkover</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              If a team can't play: 22 game points to opponent, 1 set point to opponent.<br/>
              If both can't play: 0 game points, 0 set points to both.
            </p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => {
                  if (!confirm(`Forfeit: ${selectedCaptainA?.teamName} cannot play. Award win to ${selectedCaptainB?.teamName}?`)) return;
                  recordForfeit(category, selectedCaptainA!.teamName, selectedCaptainB!.teamName, 'A', todaySchedule?.isFinal ?? false);
                  alert('Forfeit recorded.');
                }}
                className="flex-1 py-2 px-3 rounded-lg text-white text-sm font-bold"
                style={{ backgroundColor: '#ef4444' }}
              >
                {selectedCaptainA?.teamName || 'Team A'} Forfeits
              </button>
              <button
                onClick={() => {
                  if (!confirm(`Forfeit: ${selectedCaptainB?.teamName} cannot play. Award win to ${selectedCaptainA?.teamName}?`)) return;
                  recordForfeit(category, selectedCaptainA!.teamName, selectedCaptainB!.teamName, 'B', todaySchedule?.isFinal ?? false);
                  alert('Forfeit recorded.');
                }}
                className="flex-1 py-2 px-3 rounded-lg text-white text-sm font-bold"
                style={{ backgroundColor: '#ef4444' }}
              >
                {selectedCaptainB?.teamName || 'Team B'} Forfeits
              </button>
              <button
                onClick={() => {
                  if (!confirm('Both teams cannot play? 0 points to both?')) return;
                  recordForfeit(category, selectedCaptainA!.teamName, selectedCaptainB!.teamName, 'both', todaySchedule?.isFinal ?? false);
                  alert('Both forfeit recorded.');
                }}
                className="w-full py-2 px-3 rounded-lg border-2 text-sm font-bold"
                style={{ borderColor: '#ef4444', color: '#ef4444' }}
              >
                Both Teams Cannot Play
              </button>
            </div>
          </div>
        )}

        {/* Today's Schedule Info */}
        {todaySchedule && (
          <div className="p-3 rounded-lg border text-center" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Today's Schedule</p>
            <p className="font-bold text-sm" style={{ color: 'var(--color-secondary)' }}>
              {todaySchedule.label} — {CATEGORIES.find(c => c.id === todaySchedule.category)?.label || todaySchedule.categoryGroup}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{todaySchedule.timing} {todaySchedule.isFinal ? '(FINAL)' : ''}</p>
          </div>
        )}
      </div>
    </div>
  );
}
