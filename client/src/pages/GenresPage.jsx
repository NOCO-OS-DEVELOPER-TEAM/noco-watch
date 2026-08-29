import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { PosterCard } from '../components/PosterCard';

export function GenresPage() {
  const [genres, setGenres] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .genres()
      .then((data) => setGenres(data.genres || []))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="page">
      <h1 className="page-title">Genres</h1>
      <p className="muted">Nur Genres aus deiner Bibliothek.</p>
      {error && <div className="error-box">{error}</div>}
      <div className="genre-grid">
        {genres.map((g) => (
          <Link key={g.name} to={`/genres/${encodeURIComponent(g.name)}`} className="genre-tile">
            <strong>{g.name}</strong>
            <span>{g.count} Titel</span>
          </Link>
        ))}
      </div>
      {!error && genres.length === 0 && (
        <div className="empty-box">Noch keine Genres in den Metadaten.</div>
      )}
    </div>
  );
}

export function GenreDetailPage() {
  const { name } = useParams();
  const genreName = decodeURIComponent(name || '');
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    api
      .genre(genreName)
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
  }, [genreName]);

  return (
    <div className="page">
      <Link to="/genres" className="back-inline">
        ← Alle Genres
      </Link>
      <h1 className="page-title">{genreName}</h1>
      {error && <div className="error-box">{error}</div>}
      <div className="grid search-grid">
        {videos.map((video) => (
          <PosterCard key={video.id} video={video} />
        ))}
      </div>
      {!error && videos.length === 0 && (
        <div className="empty-box">Keine Filme in diesem Genre.</div>
      )}
    </div>
  );
}
