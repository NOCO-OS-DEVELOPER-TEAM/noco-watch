import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

function formatDuration(seconds) {
  if (seconds == null) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function Hero({ video }) {
  const navigate = useNavigate();

  if (!video) {
    return (
      <section className="hero hero-quiet">
        <div className="hero-content">
          <p className="eyebrow">Lokales Streaming</p>
          <h1 className="hero-brand">NOCO WATCH</h1>
          <p className="muted">Deine Bibliothek ist noch leer.</p>
        </div>
      </section>
    );
  }

  const duration = formatDuration(video.durationSeconds);
  const meta = [video.genre || video.genres?.[0], duration]
    .filter(Boolean)
    .join(' · ');

  return (
    <section className="hero hero-quiet">
      <div className="hero-media" aria-hidden="true">
        {video.coverUrl ? (
          <iframe
            className="hero-cover-frame"
            src={api.mediaUrl(video.coverUrl)}
            title=""
            tabIndex={-1}
            sandbox="allow-scripts allow-same-origin"
          />
        ) : (
          <div className="hero-art" />
        )}
      </div>
      <div className="hero-content">
        <p className="eyebrow">
          {video.nocoOriginal ? 'NOCO Original' : 'Jetzt entdecken'}
        </p>
        <h1>{video.title}</h1>
        {meta && <p className="hero-meta">{meta}</p>}
        <p className="muted hero-desc">{video.description}</p>
        <div className="hero-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate(`/video/${video.id}`)}
          >
            Mehr Infos
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => navigate(`/play/${video.id}`)}
            disabled={!video.available}
          >
            ▶ Abspielen
          </button>
        </div>
      </div>
    </section>
  );
}
