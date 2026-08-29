import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { PosterCard } from '../components/PosterCard';

export default function FilmsPage() {
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .videos()
      .then((data) => setVideos(data.videos || []))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="page">
      <h1 className="page-title">Filme</h1>
      <p className="muted">Gesamte Bibliothek vom Server.</p>
      {error && <div className="error-box">{error}</div>}
      <div className="grid search-grid">
        {videos.map((video) => (
          <PosterCard key={video.id} video={video} />
        ))}
      </div>
    </div>
  );
}
