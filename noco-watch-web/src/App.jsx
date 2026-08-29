import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import { ConnectionProvider } from './context/ConnectionContext';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import OriginalsPage from './pages/OriginalsPage';
import SettingsPage from './pages/SettingsPage';
import DetailPage from './pages/DetailPage';
import PlayerPage from './pages/PlayerPage';

function Shell() {
  const location = useLocation();
  const hideNav = location.pathname.startsWith('/play/');

  return (
    <div className={`mobile-shell${hideNav ? ' is-player' : ''}`}>
      <main className="mobile-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/originals" element={<OriginalsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/video/:id" element={<DetailPage />} />
          <Route path="/play/:id" element={<PlayerPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <ConnectionProvider>
      <Shell />
    </ConnectionProvider>
  );
}
