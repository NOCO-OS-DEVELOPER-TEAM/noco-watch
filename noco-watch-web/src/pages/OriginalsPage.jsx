import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useConnection } from '../context/ConnectionContext';
import OfflineScreen from '../components/OfflineScreen';
import { FilmRail } from '../components/FilmCard';

export default function OriginalsPage() {
  const { online, status } = useConnection();
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!online) return undefined;
    let alive = true;
    api
      .recommendations()
      .then((data) => {
        if (!alive) return;
        setVideos(data.nocoOriginals || []);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err.message);
      });
    return () => {
      alive = false;
    };
  }, [online]);

  if (status === 'offline' || status === 'mixed') {
    return <OfflineScreen />;
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>NOCO Originals</h1>
        <p>Exklusiv aus deiner lokalen Bibliothek.</p>
      </header>
      {error && <div className="error-box">{error}</div>}
      <section className="rail-section">
        <FilmRail videos={videos} />
      </section>
    </div>
  );
}
