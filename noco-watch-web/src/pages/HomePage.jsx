import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useConnection } from '../context/ConnectionContext';
import ConnectionBanner from '../components/ConnectionBanner';
import OfflineScreen from '../components/OfflineScreen';
import { FilmRail } from '../components/FilmCard';

export default function HomePage() {
  const { online, status } = useConnection();
  const [recs, setRecs] = useState(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!online) {
      setRecs(null);
      setCategories([]);
      return undefined;
    }

    let alive = true;
    Promise.all([api.recommendations(), api.categories()])
      .then(([r, c]) => {
        if (!alive) return;
        setRecs(r);
        setCategories(c.categories || []);
        setError('');
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

  if (status === 'checking' || (!recs && !error)) {
    return (
      <div className="page">
        <ConnectionBanner />
        <div className="loading">Bibliothek wird geladen…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <ConnectionBanner />
        <div className="error-box">{error}</div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="home-hero">
        <p className="home-kicker">Lokales Streaming</p>
        <h1 className="home-brand">NOCO WATCH</h1>
        <p className="home-sub">Dein lokales Streaming</p>
        <ConnectionBanner />
      </header>

      {recs.continueWatching?.length > 0 && (
        <section className="rail-section">
          <h2>Weiter ansehen</h2>
          <FilmRail videos={recs.continueWatching} />
        </section>
      )}

      {recs.nocoOriginals?.length > 0 && (
        <section className="rail-section">
          <h2>NOCO Originals</h2>
          <FilmRail videos={recs.nocoOriginals} />
        </section>
      )}

      {categories.map((cat) => (
        <section className="rail-section" key={cat.name}>
          <h2>{cat.name}</h2>
          <FilmRail videos={cat.videos} />
        </section>
      ))}
    </div>
  );
}
