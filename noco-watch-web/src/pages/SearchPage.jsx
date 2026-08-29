import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { useConnection } from '../context/ConnectionContext';
import OfflineScreen from '../components/OfflineScreen';
import { FilmCard } from '../components/FilmCard';

export default function SearchPage() {
  const { online, status } = useConnection();
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!online) return undefined;
    let alive = true;
    api
      .videos()
      .then((data) => {
        if (!alive) return;
        setVideos(data.videos || []);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err.message);
      });
    return () => {
      alive = false;
    };
  }, [online]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return videos;
    return videos.filter((v) => {
      const hay = [v.title, v.description, v.series, v.category, v.genre, ...(v.tags || [])]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [videos, query]);

  if (status === 'offline' || status === 'mixed') {
    return <OfflineScreen />;
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Suche</h1>
        <p>Nur Metadaten vom Server – keine Filmdateien.</p>
      </header>

      <label className="search-field">
        <span className="sr-only">Suchen</span>
        <input
          type="search"
          inputMode="search"
          enterKeyHint="search"
          placeholder="Titel, Reihe, Genre…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoCapitalize="off"
          autoCorrect="off"
        />
      </label>

      {error && <div className="error-box">{error}</div>}

      <div className="search-grid">
        {results.map((video) => (
          <FilmCard key={video.id} video={video} />
        ))}
      </div>

      {!error && results.length === 0 && (
        <div className="empty-rail">Keine Treffer.</div>
      )}
    </div>
  );
}
