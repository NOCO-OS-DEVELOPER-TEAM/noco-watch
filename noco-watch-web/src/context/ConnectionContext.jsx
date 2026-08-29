import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, ApiError } from '../api/client';
import {
  getServerUrl,
  isMixedContentRisk,
  setServerUrl as persistServerUrl,
} from '../api/serverConfig';

const ConnectionContext = createContext(null);

export function ConnectionProvider({ children }) {
  const [serverUrl, setServerUrlState] = useState(() => getServerUrl());
  const [status, setStatus] = useState('checking'); // checking | online | offline | mixed
  const [error, setError] = useState(null);
  const [videoCount, setVideoCount] = useState(null);

  const refresh = useCallback(async () => {
    const url = getServerUrl();
    setServerUrlState(url);

    if (isMixedContentRisk(url)) {
      setStatus('mixed');
      setError(
        'Dein Browser blockiert aktuell die Verbindung zwischen der sicheren GitHub-Seite und deinem lokalen NOCO-WATCH-Server.'
      );
      setVideoCount(null);
      return { ok: false, status: 'mixed' };
    }

    setStatus('checking');
    setError(null);

    try {
      const data = await api.videos();
      const videos = data.videos || [];
      setVideoCount(videos.length);
      setStatus('online');
      setError(null);
      return { ok: true, status: 'online', videos };
    } catch (err) {
      const code = err instanceof ApiError ? err.code : 'OFFLINE';
      if (code === 'MIXED_CONTENT') {
        setStatus('mixed');
      } else {
        setStatus('offline');
      }
      setError(err.message || 'NOCO WATCH ist nicht erreichbar');
      setVideoCount(null);
      return { ok: false, status: code === 'MIXED_CONTENT' ? 'mixed' : 'offline' };
    }
  }, []);

  const updateServerUrl = useCallback(
    async (next) => {
      const saved = persistServerUrl(next);
      setServerUrlState(saved);
      return refresh();
    },
    [refresh]
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      serverUrl,
      status,
      error,
      videoCount,
      online: status === 'online',
      refresh,
      updateServerUrl,
    }),
    [serverUrl, status, error, videoCount, refresh, updateServerUrl]
  );

  return (
    <ConnectionContext.Provider value={value}>
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection() {
  const ctx = useContext(ConnectionContext);
  if (!ctx) {
    throw new Error('useConnection must be used within ConnectionProvider');
  }
  return ctx;
}
