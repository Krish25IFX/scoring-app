import { useState } from 'react';
import { OPERATOR_PIN } from '../config/players';

const SESSION_KEY = 'operator_auth';

export default function PinGate({ children }: { children: React.ReactNode }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [authed, setAuthed] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === 'true'
  );

  if (authed) return <>{children}</>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === OPERATOR_PIN) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      setAuthed(true);
    } else {
      setError(true);
      setPin('');
    }
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
            setError(false);
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
            Incorrect PIN. Try again.
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
