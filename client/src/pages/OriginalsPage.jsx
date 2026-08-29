import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { PosterRail } from '../components/PosterCard';

export default function OriginalsPage() {
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .recommendations()
      .then((data) => setVideos(data.nocoOriginals || []))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="page">
      <h1 className="page-title">NOCO Originals</h1>
      <p className="muted">Exklusiv aus deiner lokalen Bibliothek.</p>
      {error && <div className="error-box">{error}</div>}
      <section className="section">
        <PosterRail videos={videos} />
      </section>
    </div>
  );
}
