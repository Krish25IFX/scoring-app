import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMatch } from '../context/MatchContext';
import { CAPTAINS } from '../config/players';

interface CaptainLoginState {
  step: 'login' | 'selectPlayers';
  password: string;
  selectedCaptainId: string | null;
  selectedPlayers: string[];
  error: string;
}

export default function CaptainLoginPage() {
  const navigate = useNavigate();
  const { setCaptainSelection } = useMatch();
  const [state, setState] = useState<CaptainLoginState>({
    step: 'login',
    password: '',
    selectedCaptainId: null,
    selectedPlayers: [],
    error: '',
  });

  const handleBack = () => {
    if (state.step === 'selectPlayers') {
      setState({ ...state, step: 'login', password: '', error: '' });
    } else if (state.step === 'login') {
      navigate('/');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const captain = CAPTAINS.find((c) => c.password === state.password);

    if (!captain) {
      setState({ ...state, error: 'Invalid password' });
      return;
    }

    setState({
      ...state,
      step: 'selectPlayers',
      selectedCaptainId: captain.id,
      selectedPlayers: [],
      error: '',
    });
  };

  const handlePlayerToggle = (player: string) => {
    setState((prev) => ({
      ...prev,
      selectedPlayers: prev.selectedPlayers.includes(player)
        ? prev.selectedPlayers.filter((p) => p !== player)
        : [...prev.selectedPlayers, player],
    }));
  };

  const handleContinue = () => {
    if (state.selectedPlayers.length === 0) {
      setState({ ...state, error: 'Select at least one player' });
      return;
    }

    if (!state.selectedCaptainId) return;
    setCaptainSelection(state.selectedCaptainId, state.selectedPlayers);
    // Navigate back to home - captain selection is saved in context
    navigate('/');
  };

  const currentCaptain = CAPTAINS.find((c) => c.id === state.selectedCaptainId);

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link to="/" className="text-sm px-3 py-1.5 rounded-lg border" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
            ← Home
          </Link>
          <h1 className="text-2xl font-black" style={{ color: 'var(--color-secondary)' }}>
            {state.step === 'login' ? '🧑‍✈️ Captain Login' : `Captain: ${currentCaptain?.name}`}
          </h1>
        </div>

        {/* Step 1: Select Team */}
        {state.step === 'login' && (
          <div className="space-y-4">
            <p className="text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Enter your captain password
            </p>
            <form onSubmit={handleLogin} className="space-y-3">
              <input
                type="password"
                value={state.password}
                onChange={(e) => setState({ ...state, password: e.target.value })}
                placeholder="Password"
                className="w-full p-3 rounded-lg border-2 text-center text-2xl tracking-widest"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                autoFocus
              />
              {state.error && (
                <div className="p-3 rounded-lg text-center font-medium" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                  {state.error}
                </div>
              )}
              <button
                type="submit"
                className="w-full py-3 rounded-lg text-white font-bold transition-transform hover:scale-105 active:scale-95"
                style={{ backgroundColor: 'var(--color-secondary)' }}
              >
                Login
              </button>
            </form>
            <button
              onClick={handleBack}
              className="w-full py-2 rounded-lg border-2 font-medium"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            >
              Back
            </button>
          </div>
        )}

        {/* Step 3: Select Players */}
        {state.step === 'selectPlayers' && currentCaptain && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>
                Select players who will play today:
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                (You can also select yourself)
              </p>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {currentCaptain.players.map((player) => (
                <label
                  key={player}
                  className="flex items-center gap-3 p-3 rounded-lg cursor-pointer"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    borderColor: 'var(--color-border)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={state.selectedPlayers.includes(player)}
                    onChange={() => handlePlayerToggle(player)}
                    className="w-5 h-5 rounded"
                  />
                  <span className="font-medium">{player}</span>
                </label>
              ))}
            </div>

            <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Selected: {state.selectedPlayers.length} player{state.selectedPlayers.length !== 1 ? 's' : ''}
            </div>

            {state.error && (
              <div className="p-3 rounded-lg text-center font-medium" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                {state.error}
              </div>
            )}

            <button
              onClick={handleContinue}
              disabled={state.selectedPlayers.length === 0}
              className="w-full py-3 rounded-lg text-white font-bold transition-transform hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{ backgroundColor: 'var(--color-secondary)' }}
            >
              ✓ Players Selected
            </button>

            <button
              onClick={handleBack}
              className="w-full py-2 rounded-lg border-2 font-medium"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            >
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
