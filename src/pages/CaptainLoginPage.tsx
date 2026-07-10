import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMatch } from '../context/MatchContext';
import { CAPTAINS } from '../config/players';
import {  getTodaySchedule, CAPTAIN_DEADLINE_HOUR, MAX_GAMES_PER_PLAYER_PER_OPPONENT } from '../config/schedule';
import { CATEGORIES } from '../types';
import type { Category, PlayMode } from '../types';

/** Players whose name ends with 'F' are female */
function isFemale(name: string): boolean {
  return name.endsWith('F');
}

/**
 * Get the gender requirement for a category:
 * - 'male': only males allowed (mens_single, mens_double_*)
 * - 'female': only females allowed (womens_double)
 * - 'mix': 1 male + 1 female required (mix_double)
 */
function getGenderRequirement(category: Category): 'male' | 'female' | 'mix' {
  if (category === 'womens_double') return 'female';
  if (category === 'mix_double') return 'mix';
  return 'male'; // mens_single, mens_double_*
}

/**
 * Filter players eligible for a category based on gender.
 * For 'mix', returns all players (validation handled during selection).
 */
function getEligiblePlayersByGender(players: string[], category: Category): string[] {
  const req = getGenderRequirement(category);
  if (req === 'male') return players.filter((p) => !isFemale(p));
  if (req === 'female') return players.filter((p) => isFemale(p));
  return players; // mix — show all, enforce 1M+1F at selection time
}

export default function CaptainLoginPage() {
  const navigate = useNavigate();
  const { setCaptainSelection, captainSelections, canPlayerPlay, refreshMatchHistory, refreshCaptainSelections } = useMatch();

  // Refresh match history + captain selections from server on every mount
  useEffect(() => {
    refreshMatchHistory();
    refreshCaptainSelections();
  }, [refreshMatchHistory, refreshCaptainSelections]);
  // TODO: re-enable deadline check after testing
  // const deadlinePassed = isDeadlinePassed();
  const deadlinePassed = false;
  const todaySchedule = getTodaySchedule();

  const [password, setPassword] = useState('');
  const [selectedCaptainId, setSelectedCaptainId] = useState<string | null>(() => {
    try { return localStorage.getItem('captain_draft_id'); } catch { return null; }
  });
  const [error, setError] = useState('');
  // Per-opponent selections: { opponentCaptainId: string[] }
  const [selections, setSelections] = useState<Record<string, string[]>>(() => {
    try {
      const draft = localStorage.getItem('captain_draft_selections');
      return draft ? JSON.parse(draft) : {};
    } catch { return {}; }
  });
  // Which opponent team is currently being configured
  const [activeOpponentId, setActiveOpponentId] = useState<string | null>(null);
  // Category selector - defaults to today's schedule or first available
  const [selectedCategory, setSelectedCategory] = useState<Category>(() => {
    try {
      const saved = localStorage.getItem('captain_draft_category');
      return (saved as Category) || todaySchedule?.category || 'mens_double_1';
    } catch { return todaySchedule?.category ?? 'mens_double_1'; }
  });
  // If we have a draft captain, skip login step
  const [step, setStep] = useState<'login' | 'selectPlayers'>(() => {
    try { return localStorage.getItem('captain_draft_id') ? 'selectPlayers' : 'login'; } catch { return 'login'; }
  });

  // Auto-save drafts to localStorage whenever selections change
  useEffect(() => {
    try {
      if (selectedCaptainId) {
        localStorage.setItem('captain_draft_id', selectedCaptainId);
        localStorage.setItem('captain_draft_selections', JSON.stringify(selections));
        localStorage.setItem('captain_draft_category', selectedCategory);
      }
    } catch { /* localStorage unavailable */ }
  }, [selectedCaptainId, selections, selectedCategory]);

  const currentCaptain = CAPTAINS.find((c) => c.id === selectedCaptainId);
  const opponentTeams = CAPTAINS.filter((c) => c.id !== selectedCaptainId);

  // Determine mode from selected category
  const categoryMode: PlayMode = CATEGORIES.find((c) => c.id === selectedCategory)?.mode ?? 'doubles';
  const maxPlayersPerOpponent = categoryMode === 'singles' ? 1 : 2;
  const isFinal = todaySchedule?.isFinal ?? false;

  const clearDraft = () => {
    try {
      localStorage.removeItem('captain_draft_id');
      localStorage.removeItem('captain_draft_selections');
      localStorage.removeItem('captain_draft_category');
    } catch { /* */ }
  };

  const handleBack = () => {
    if (activeOpponentId) {
      setActiveOpponentId(null);
    } else if (step === 'selectPlayers') {
      setStep('login');
      setPassword('');
      setError('');
      clearDraft();
    } else {
      navigate('/');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const captain = CAPTAINS.find((c) => c.password === password);
    if (!captain) {
      setError('Invalid password');
      return;
    }
    setSelectedCaptainId(captain.id);
    // Load existing selections if any
    const existing = captainSelections[captain.id];
    if (existing && Object.keys(existing).length > 0) {
      setSelections(existing);
    }
    setStep('selectPlayers');
    setError('');
  };

  const genderReq = getGenderRequirement(selectedCategory);

  /** For mix doubles: check if adding this player would violate the 1M+1F rule */
  const canSelectForMix = (player: string, opponentId: string): boolean => {
    if (genderReq !== 'mix') return true;
    const current = selections[opponentId] ?? [];
    // If already selected for this opponent, allow deselect
    if (current.includes(player)) return true;
    // If already full, will replace — allowed
    if (current.length >= 2) return true;
    // If 1 already selected, the next must be opposite gender
    if (current.length === 1) {
      const existingIsFemale = isFemale(current[0]);
      const newIsFemale = isFemale(player);
      return existingIsFemale !== newIsFemale; // must be opposite
    }
    return true; // first pick, anything goes
  };

  // Player toggle with max limit based on category mode
  const handlePlayerToggle = (opponentId: string, player: string) => {
    setSelections((prev) => {
      const current = prev[opponentId] ?? [];
      if (current.includes(player)) {
        // Deselect
        return { ...prev, [opponentId]: current.filter((p) => p !== player) };
      }
      // Mix doubles: enforce 1M + 1F
      if (genderReq === 'mix' && current.length === 1) {
        const existingIsFemale = isFemale(current[0]);
        const newIsFemale = isFemale(player);
        if (existingIsFemale === newIsFemale) return prev; // same gender, block
      }
      // Enforce max player limit per match
      if (current.length >= maxPlayersPerOpponent) {
        // Replace: for singles just swap, for doubles keep last and add new
        const keep = maxPlayersPerOpponent > 1 ? current.slice(-(maxPlayersPerOpponent - 1)) : [];
        const updated = [...keep, player];
        return { ...prev, [opponentId]: updated };
      }
      return { ...prev, [opponentId]: [...current, player] };
    });
  };

  const handleSubmitAll = () => {
    // Check exact player count for each opponent
    const missing = opponentTeams.filter((t) => !selections[t.id] || selections[t.id].length !== maxPlayersPerOpponent);
    if (missing.length > 0) {
      setError(`Select exactly ${maxPlayersPerOpponent} player${maxPlayersPerOpponent > 1 ? 's' : ''} for: ${missing.map((t) => t.teamName).join(', ')}`);
      return;
    }
    // For mix doubles, validate each selection has 1M + 1F
    if (genderReq === 'mix') {
      const invalid = opponentTeams.filter((t) => {
        const sel = selections[t.id] ?? [];
        if (sel.length !== 2) return true;
        const females = sel.filter(isFemale).length;
        return females !== 1; // must be exactly 1 female and 1 male
      });
      if (invalid.length > 0) {
        setError(`Mix Double requires 1 male + 1 female for: ${invalid.map((t) => t.teamName).join(', ')}`);
        return;
      }
    }
    if (!selectedCaptainId) return;
    setCaptainSelection(selectedCaptainId, selections);
    clearDraft();
    navigate('/');
  };

  const completedCount = opponentTeams.filter((t) => selections[t.id] && selections[t.id].length === maxPlayersPerOpponent).length;

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="text-sm px-3 py-1.5 rounded-lg border"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
          >
            ← Back
          </button>
          <h1 className="text-2xl font-black" style={{ color: 'var(--color-secondary)' }}>
            {step === 'login' ? '🧑‍✈️ Captain Login' : `Captain: ${currentCaptain?.name}`}
          </h1>
        </div>

        {/* Step 1: Login */}
        {step === 'login' && (
          <div className="space-y-4">
            {deadlinePassed && (
              <div className="p-3 rounded-lg text-center font-medium" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                ⚠️ Deadline passed! Submissions are locked after {CAPTAIN_DEADLINE_HOUR > 12 ? `${CAPTAIN_DEADLINE_HOUR - 12}:00 PM` : `${CAPTAIN_DEADLINE_HOUR}:00 AM`} on game day.
              </div>
            )}
            {todaySchedule && (
              <div className="p-3 rounded-lg text-center" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Today's Match</p>
                <p className="font-bold" style={{ color: 'var(--color-secondary)' }}>{todaySchedule.label} — {todaySchedule.categoryGroup.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{todaySchedule.timing}</p>
              </div>
            )}
            <p className="text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Enter your captain password
            </p>
            <form onSubmit={handleLogin} className="space-y-3">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full p-3 rounded-lg border-2 text-center text-2xl tracking-widest"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                autoFocus
              />
              {error && (
                <div className="p-3 rounded-lg text-center font-medium" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={deadlinePassed}
                className="w-full py-3 rounded-lg text-white font-bold transition-transform hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: 'var(--color-secondary)' }}
              >
                {deadlinePassed ? 'Submissions Locked' : 'Login'}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Select Players Per Opponent Team */}
        {step === 'selectPlayers' && currentCaptain && !activeOpponentId && (
          <div className="space-y-4">
            {/* Category Selector */}
            <div className="p-3 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
                Category for today
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value as Category);
                  // Clear selections when category changes (mode might change)
                  setSelections({});
                }}
                className="w-full mt-1 p-2 rounded-lg border text-sm font-medium"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label} ({cat.mode === 'singles' ? '1 player' : '2 players'})
                  </option>
                ))}
              </select>
              {todaySchedule && (
                <p className="text-xs mt-1" style={{ color: 'var(--color-secondary)' }}>
                  Scheduled: {CATEGORIES.find(c => c.id === todaySchedule.category)?.label}
                </p>
              )}
            </div>

            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-muted)' }}>
              Select {maxPlayersPerOpponent} player{maxPlayersPerOpponent > 1 ? 's' : ''} per opponent ({categoryMode}) — {completedCount}/{opponentTeams.length} done
            </p>

            <div className="space-y-2">
              {opponentTeams.map((opponent) => {
                const selected = selections[opponent.id] ?? [];
                const isDone = selected.length === maxPlayersPerOpponent;
                return (
                  <button
                    key={opponent.id}
                    onClick={() => { setActiveOpponentId(opponent.id); setError(''); }}
                    className="w-full flex items-center justify-between p-4 rounded-lg border-2 text-left transition-all hover:scale-[1.01]"
                    style={{
                      borderColor: isDone ? 'var(--color-secondary)' : 'var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                    }}
                  >
                    <div>
                      <span className="font-bold" style={{ color: 'var(--color-text)' }}>
                        vs {opponent.teamName}
                      </span>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                        Captain: {opponent.name}
                      </p>
                    </div>
                    <span className="text-sm font-medium" style={{ color: isDone ? 'var(--color-secondary)' : 'var(--color-text-muted)' }}>
                      {isDone ? `${selected.length} selected ✓` : 'Tap to select'}
                    </span>
                  </button>
                );
              })}
            </div>

            {error && (
              <div className="p-3 rounded-lg text-center font-medium" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                {error}
              </div>
            )}

            <button
              onClick={handleSubmitAll}
              disabled={completedCount === 0}
              className="w-full py-3 rounded-lg text-white font-bold transition-transform hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{ backgroundColor: 'var(--color-secondary)' }}
            >
              ✓ Submit All Selections ({completedCount}/{opponentTeams.length})
            </button>
          </div>
        )}

        {/* Step 2b: Player selection for a specific opponent */}
        {step === 'selectPlayers' && currentCaptain && activeOpponentId && (
          <div className="space-y-4">
            {(() => {
              const opponent = CAPTAINS.find((c) => c.id === activeOpponentId)!;
              const selected = selections[activeOpponentId] ?? [];
              return (
                <>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                    <p className="text-sm font-bold" style={{ color: 'var(--color-secondary)' }}>
                      Selecting players vs {opponent.teamName}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                      {genderReq === 'mix'
                        ? 'Select 1 male + 1 female'
                        : `Select exactly ${maxPlayersPerOpponent} ${genderReq === 'female' ? 'female' : 'male'} player${maxPlayersPerOpponent > 1 ? 's' : ''}`
                      } ({categoryMode})
                    </p>
                    <p className="text-xs mt-1 font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                      Category: {CATEGORIES.find(c => c.id === selectedCategory)?.label} • Max 2 games per player per opponent
                    </p>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {getEligiblePlayersByGender(currentCaptain.players, selectedCategory).map((player) => {
                      const eligibleHistory = canPlayerPlay(player, selectedCategory, opponent.teamName, isFinal);
                      const eligibleMix = canSelectForMix(player, activeOpponentId);
                      const eligible = eligibleHistory && eligibleMix;
                      const isSelected = selected.includes(player);
                      const playerGender = isFemale(player) ? 'F' : 'M';
                      return (
                      <label
                        key={player}
                        className="flex items-center gap-3 p-3 rounded-lg cursor-pointer border"
                        style={{
                          backgroundColor: isSelected ? 'rgba(var(--color-secondary-rgb, 99, 102, 241), 0.1)' : 'var(--color-surface)',
                          borderColor: isSelected ? 'var(--color-secondary)' : 'var(--color-border)',
                          opacity: eligible ? 1 : 0.4,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={!eligible}
                          onChange={() => handlePlayerToggle(activeOpponentId, player)}
                          className="w-5 h-5 rounded"
                        />
                        <span className="font-medium" style={{ color: 'var(--color-text)' }}>
                          {player.replace(/F$/, '')}
                        </span>
                        {genderReq === 'mix' && (
                          <span className="text-xs px-1.5 py-0.5 rounded font-bold" style={{
                            backgroundColor: playerGender === 'F' ? '#fce7f3' : '#dbeafe',
                            color: playerGender === 'F' ? '#be185d' : '#1d4ed8',
                          }}>
                            {playerGender}
                          </span>
                        )}
                        <span className="ml-auto flex items-center gap-1">
                          {!eligibleHistory && (
                            <span className="text-xs font-medium" style={{ color: '#ef4444' }}>
                              Max {MAX_GAMES_PER_PLAYER_PER_OPPONENT} vs this team
                            </span>
                          )}
                          {eligibleHistory && !eligibleMix && (
                            <span className="text-xs font-medium" style={{ color: '#ef4444' }}>
                              Need opposite gender
                            </span>
                          )}
                        </span>
                      </label>
                      );
                    })}
                  </div>

                  <div className="text-sm" style={{ color: selected.length === maxPlayersPerOpponent ? 'var(--color-secondary)' : 'var(--color-text-muted)' }}>
                    Selected: {selected.length}/{maxPlayersPerOpponent} player{maxPlayersPerOpponent !== 1 ? 's' : ''}
                    {selected.length === maxPlayersPerOpponent && ' ✓'}
                  </div>

                  <button
                    onClick={() => setActiveOpponentId(null)}
                    className="w-full py-3 rounded-lg text-white font-bold transition-transform hover:scale-105 active:scale-95"
                    style={{ backgroundColor: 'var(--color-secondary)' }}
                  >
                    ← Done with {opponent.teamName}
                  </button>
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
