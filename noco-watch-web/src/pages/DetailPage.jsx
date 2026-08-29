import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useConnection } from '../context/ConnectionContext';
import OfflineScreen from '../components/OfflineScreen';
import { formatDuration } from '../utils/format';

export default function DetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { online, status } = useConnection();
  const [video, setVideo] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!online) return undefined;
    let alive = true;
    api
      .video(id)
      .then((data) => {
        if (!alive) return;
        setVideo(data.video);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err.message);
      });
    return () => {
      alive = false;
    };
  }, [id, online]);

  if (status === 'offline' || status === 'mixed') {
    return <OfflineScreen />;
  }

  if (error) {
    return (
      <div className="page">
        <div className="error-box">{error}</div>
        <Link to="/" className="btn btn-ghost">
          Zurück
        </Link>
      </div>
    );
  }

  if (!video) {
    return <div className="loading">Lade Titel…</div>;
  }

  const duration = formatDuration(video.durationSeconds);
  const titleParts = String(video.title || '').split(':');
  const headline =
    titleParts.length > 1
      ? { lead: `${titleParts[0].trim()}:`, rest: titleParts.slice(1).join(':').trim() }
      : { lead: null, rest: video.title };

  return (
    <div className="page detail-page">
      <button type="button" className="back-link" onClick={() => navigate(-1)}>
        ← Zurück
      </button>

      <div className="detail-cover">
        {video.coverUrl ? (
          <iframe
            className="film-cover-frame"
            src={api.mediaUrl(video.coverUrl)}
            title={`${video.title} Cover`}
            tabIndex={-1}
            sandbox="allow-scripts allow-same-origin"
          />
        ) : video.thumbnail ? (
          <img src={api.mediaUrl(video.thumbnail)} alt="" />
        ) : (
          <div className="film-cover-fallback">
            <strong>{video.title}</strong>
          </div>
        )}
      </div>

      <div className="detail-body">
        {video.nocoOriginal && <p className="detail-eyebrow">NOCO Original</p>}
        <h1 className="detail-title">
          {headline.lead && <span className="detail-title-lead">{headline.lead}</span>}
          <span>{headline.rest}</span>
        </h1>

        <p className="detail-meta">
          {[video.genre, duration].filter(Boolean).join(' · ')}
        </p>

        {video.description && (
          <p className="detail-desc">{video.description}</p>
        )}

        <button
          type="button"
          className="btn btn-primary btn-play"
          disabled={!video.available}
          onClick={() => navigate(`/play/${video.id}`)}
        >
          ▶ Abspielen
        </button>

        {!video.available && (
          <p className="muted-note">
            Datei auf dem Server nicht verfügbar.
          </p>
        )}

        <section className="detail-info">
          <h2>Weitere Informationen</h2>
          <dl>
            {(video.series || video.category) && (
              <>
                <dt>Reihe</dt>
                <dd>{video.series || video.category}</dd>
              </>
            )}
            {video.episode != null && (
              <>
                <dt>Episode</dt>
                <dd>{video.episode}</dd>
              </>
            )}
            {video.genre && (
              <>
                <dt>Genre</dt>
                <dd>{video.genre}</dd>
              </>
            )}
            {duration && (
              <>
                <dt>Laufzeit</dt>
                <dd>{duration}</dd>
              </>
            )}
            <dt>Typ</dt>
            <dd>{video.type === 'html' ? 'HTML Film' : 'Video'}</dd>
          </dl>
        </section>
      </div>
    </div>
  );
}
