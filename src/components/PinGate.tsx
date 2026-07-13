import { useState, useEffect } from 'react';
import { OPERATOR_PIN, CAPTAINS } from '../config/players';
import { useMatch } from '../context/MatchContext';
import { getTodaySchedule } from '../config/schedule';

const SESSION_KEY = 'operator_auth';
const OVERRIDE_PIN = '0000';

export default function PinGate({ children }: { children: React.ReactNode }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [authed, setAuthed] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === 'true'
  );
  const { captainSelections, refreshCaptainSelections } = useMatch();

  useEffect(() => {
    if (!authed) refreshCaptainSelections();
  }, [authed, refreshCaptainSelections]);

  if (authed) return <>{children}</>;

  const todaySchedule = getTodaySchedule();
  const todayCategory = todaySchedule?.category;

  // Check if all captains have submitted players for today's category
  const allCaptainsSubmitted = todayCategory
    ? CAPTAINS.every((captain) => {
        const captainData = captainSelections[captain.id];
        if (!captainData) return false;
        const categoryData = captainData[todayCategory];
        if (!categoryData) return false;
        // Must have at least one opponent with players selected
        return Object.values(categoryData).some((players) => players.length > 0);
      })
    : true; // No match today — allow access

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Override PIN always works
    if (pin === OVERRIDE_PIN) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      setAuthed(true);
      return;
    }

    if (pin === OPERATOR_PIN) {
      if (!allCaptainsSubmitted) {
        setError('Not all captains have submitted players for today\'s match.');
        setPin('');
        return;
      }
      sessionStorage.setItem(SESSION_KEY, 'true');
      setAuthed(true);
    } else {
      setError('Incorrect PIN. Try again.');
      setPin('');
    }
  };

  // Figure out which captains are missing
  const missingCaptains = todayCategory
    ? CAPTAINS.filter((captain) => {
        const captainData = captainSelections[captain.id];
        if (!captainData) return true;
        const categoryData = captainData[todayCategory];
        if (!categoryData) return true;
        return !Object.values(categoryData).some((players) => players.length > 0);
      })
    : [];

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <form
        onSubmit={handleSubmit}
        className="max-w-xs w-full space-y-4 text-center"
      >
        <div className="text-5xl mb-2">🔒</div>
        <h2
          className="text-2xl font-bold"
          style={{ color: 'var(--color-primary)' }}
        >
          Operator Access
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Enter the PIN to control matches
        </p>

        {!allCaptainsSubmitted && missingCaptains.length > 0 && (
          <div className="p-3 rounded-lg border-2 text-left" style={{ borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)' }}>
            <p className="text-xs font-semibold mb-1" style={{ color: '#f59e0b' }}>⚠ Waiting for captain submissions:</p>
            {missingCaptains.map((c) => (
              <p key={c.id} className="text-xs" style={{ color: 'var(--color-text-muted)' }}>• {c.name} ({c.teamName})</p>
            ))}
          </div>
        )}

        <input
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => {
            setPin(e.target.value);
            setError('');
          }}
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

        {error && (
          <p className="text-red-500 text-sm font-medium">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="w-full py-3 rounded-lg text-white font-semibold transition-transform hover:scale-105 active:scale-95"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          Unlock
        </button>
      </form>
    </div>
  );
}
