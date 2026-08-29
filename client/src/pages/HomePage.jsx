import { useEffect, useState } from 'react';
import { api } from '../api/client';
import Hero from '../components/Hero';
import { PosterRail } from '../components/PosterCard';

export default function HomePage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    api
      .recommendations()
      .then((recs) => {
        if (!alive) return;
        setData(recs);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err.message);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (error) {
    return (
      <div className="page">
        <div className="error-box">Fehler: {error}</div>
      </div>
    );
  }

  if (!data) {
    return <div className="loading">Bibliothek wird geladen…</div>;
  }

  const heroVideo = data.hero || data.featured?.[0] || data.nocoOriginals?.[0];

  return (
    <div className="page home-page">
      <header className="home-top">
        <h1 className="home-brand-title">NOCO WATCH</h1>
        <p className="home-tagline">Dein lokales Streaming</p>
      </header>

      <Hero video={heroVideo} />

      <div className="home-rails">
        {data.continueWatching?.length > 0 && (
          <section className="section">
            <div className="section-head">
              <h2 className="section-title">Weiter ansehen</h2>
            </div>
            <PosterRail videos={data.continueWatching} />
          </section>
        )}

        {data.nocoOriginals?.length > 0 && (
          <section className="section">
            <div className="section-head">
              <h2 className="section-title">NOCO Originals</h2>
            </div>
            <PosterRail videos={data.nocoOriginals} />
          </section>
        )}

        {data.popular?.length > 0 && (
          <section className="section">
            <div className="section-head">
              <h2 className="section-title">Beliebt</h2>
            </div>
            <PosterRail videos={data.popular} />
          </section>
        )}

        {data.recentlyAdded?.length > 0 && (
          <section className="section">
            <div className="section-head">
              <h2 className="section-title">Neu bei NOCO</h2>
            </div>
            <PosterRail videos={data.recentlyAdded} />
          </section>
        )}
      </div>
    </div>
  );
}
