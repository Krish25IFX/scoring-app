import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { MatchProvider } from './context/MatchContext';
import SetupPage from './pages/SetupPage';
import OperatorPage from './pages/OperatorPage';
import SpectatorPage from './pages/SpectatorPage';
import HistoryPage from './pages/HistoryPage';
import HomePage from './pages/HomePage';

export default function App() {
  return (
    <ThemeProvider>
      <MatchProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/operator" element={<OperatorPage />} />
          <Route path="/spectator" element={<SpectatorPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </MatchProvider>
    </ThemeProvider>
  );
}
