import { useCallback, useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import TopNav from './components/TopNav';
import BottomNav from './components/BottomNav';
import { api } from './api/client';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import FilmsPage from './pages/FilmsPage';
import VideoPage from './pages/VideoPage';
import PlayerPage from './pages/PlayerPage';
import SettingsPage from './pages/SettingsPage';
import AskNocoPage from './pages/AskNocoPage';
import ControlCenterPage from './pages/ControlCenterPage';
import OriginalsPage from './pages/OriginalsPage';
import { GenreDetailPage, GenresPage } from './pages/GenresPage';

export default function App() {
  const [system, setSystem] = useState(null);
  const location = useLocation();
  const hideChrome = location.pathname.startsWith('/play/');

  const refreshSystem = useCallback(async () => {
    try {
      const data = await api.system();
      setSystem(data);
    } catch {
      setSystem({ status: 'offline' });
    }
  }, []);

  useEffect(() => {
    refreshSystem();
    const id = setInterval(refreshSystem, 8000);
    const onFocus = () => refreshSystem();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, [refreshSystem]);

  useEffect(() => {
    if (!window.nocoDesktop?.onServerChanged) return undefined;
    return window.nocoDesktop.onServerChanged(() => {
      refreshSystem();
    });
  }, [refreshSystem]);

  return (
    <div className={`app-shell${hideChrome ? ' is-player' : ''}`}>
      {!hideChrome && <TopNav system={system} />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/films" element={<FilmsPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/genres" element={<GenresPage />} />
        <Route path="/genres/:name" element={<GenreDetailPage />} />
        <Route path="/originals" element={<OriginalsPage />} />
        <Route path="/video/:id" element={<VideoPage />} />
        <Route path="/play/:id" element={<PlayerPage />} />
        <Route
          path="/control"
          element={
            <ControlCenterPage
              system={system}
              refreshSystem={refreshSystem}
            />
          }
        />
        <Route
          path="/settings"
          element={
            <SettingsPage system={system} refreshSystem={refreshSystem} />
          }
        />
        <Route path="/ask" element={<AskNocoPage />} />
      </Routes>
      {!hideChrome && <BottomNav />}
    </div>
  );
}
