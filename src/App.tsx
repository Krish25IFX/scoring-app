import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { MatchProvider } from './context/MatchContext';
import SetupPage from './pages/SetupPage';
import CaptainLoginPage from './pages/CaptainLoginPage';
import OperatorPage from './pages/OperatorPage';
import SpectatorPage from './pages/SpectatorPage';
import HistoryPage from './pages/HistoryPage';
import StandingsPage from './pages/StandingsPage';
import AdminPage from './pages/AdminPage';
import HomePage from './pages/HomePage';
import PinGate from './components/PinGate';

export default function App() {
  return (
    <ThemeProvider>
      <MatchProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/captain-login" element={<CaptainLoginPage />} />
          <Route path="/setup" element={<PinGate><SetupPage /></PinGate>} />
          <Route path="/operator" element={<PinGate><OperatorPage /></PinGate>} />
          <Route path="/spectator" element={<SpectatorPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/standings" element={<StandingsPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </MatchProvider>
    </ThemeProvider>
  );
}
