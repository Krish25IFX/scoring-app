import { useState } from 'react';
import { OPERATOR_PIN, CAPTAINS } from '../config/players';
import { fetchCaptainSelections } from '../api';
import { getTodaySchedule } from '../config/schedule';

const SESSION_KEY = 'operator_auth';
const OVERRIDE_PIN = '0000';

export default function PinGate({ children }: { children: React.ReactNode }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const [authed, setAuthed] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === 'true'
  );

  if (authed) return <>{children}</>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Override PIN always works
    if (pin === OVERRIDE_PIN) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      setAuthed(true);
      return;
    }

    if (pin !== OPERATOR_PIN) {
      setError('Incorrect PIN. Try again.');
      setPin('');
      return;
    }

    // Operator PIN entered — check if all captains submitted for today
    const todaySchedule = getTodaySchedule();
    const todayCategory = todaySchedule?.category;
    if (!todayCategory) {
      // No match today, allow access
      sessionStorage.setItem(SESSION_KEY, 'true');
      setAuthed(true);
      return;
    }

    setChecking(true);
    setError('');
    try {
      const selections = await fetchCaptainSelections();
      const allSubmitted = CAPTAINS.every((captain) => {
        const catData = selections[captain.id]?.[todayCategory];
        if (!catData) return false;
        const opponents = CAPTAINS.filter((c) => c.id !== captain.id);
        return opponents.every((opp) => {
          const players = catData[opp.id];
          return Array.isArray(players) && players.length > 0;
        });
      });

      if (allSubmitted) {
        sessionStorage.setItem(SESSION_KEY, 'true');
        setAuthed(true);
      } else {
        const missing = CAPTAINS.filter((captain) => {
          const catData = selections[captain.id]?.[todayCategory];
          if (!catData) return true;
          const opponents = CAPTAINS.filter((c) => c.id !== captain.id);
          return !opponents.every((opp) => {
            const players = catData[opp.id];
            return Array.isArray(players) && players.length > 0;
          });
        });
        setError(`Waiting: ${missing.map((c) => c.teamName).join(', ')}. Use 0000 to bypass.`);
        setPin('');
      }
    } catch {
      // If server unreachable, allow access
      sessionStorage.setItem(SESSION_KEY, 'true');
      setAuthed(true);
    }
    setChecking(false);
  };

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
          disabled={checking}
          className="w-full py-3 rounded-lg text-white font-semibold transition-transform hover:scale-105 active:scale-95 disabled:opacity-60"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          {checking ? 'Checking...' : 'Unlock'}
        </button>
      </form>
    </div>
  );
}
