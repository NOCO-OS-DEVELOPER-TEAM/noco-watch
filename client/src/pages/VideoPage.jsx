import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';

function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function VideoPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
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
  }, [id]);

  if (error) {
    return (
      <div className="page detail-wrap">
        <div className="error-box">{error}</div>
        <p>
          <Link to="/">Zurück zur Startseite</Link>
        </p>
      </div>
    );
  }

  if (!video) {
    return <div className="loading">Lade Titel…</div>;
  }

  const duration = formatDuration(video.durationSeconds);
  const metaLine = [
    video.genre,
    video.series,
    video.episode ? `Teil ${video.episode}` : null,
    duration,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="page detail-wrap detail-page">
      <div className="detail-layout">
        <div className="detail-cover" aria-hidden={!video.coverUrl}>
          {video.coverUrl ? (
            <iframe
              className="poster-html-cover"
              src={api.mediaUrl(video.coverUrl)}
              title={`${video.title} Cover`}
              tabIndex={-1}
              sandbox="allow-scripts allow-same-origin"
            />
          ) : video.thumbnail ? (
            <img
              src={api.mediaUrl(video.thumbnail)}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div className="poster-fallback">
              <strong>{video.title}</strong>
            </div>
          )}
        </div>

        <div className="detail-main">
          <div className="eyebrow">
            {video.nocoOriginal ? 'NOCO Original' : 'Titel'}
          </div>
          <h1 className="detail-title">{video.title}</h1>
          {metaLine && <p className="detail-meta-line">{metaLine}</p>}
          <p className="muted detail-desc">{video.description}</p>

          <div className="hero-actions detail-actions">
            <button
              type="button"
              className="btn btn-primary btn-play"
              disabled={!video.available}
              onClick={() => navigate(`/play/${video.id}`)}
            >
              ▶ Abspielen
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => navigate(-1)}
            >
              Zurück
            </button>
          </div>

          <div className="detail-info-panel">
            <h2>Weitere Informationen</h2>
            <dl className="detail-facts">
              {(video.genres?.length || video.genre) && (
                <>
                  <dt>Genre</dt>
                  <dd>{(video.genres?.length ? video.genres : [video.genre]).join(', ')}</dd>
                </>
              )}
              {(video.series || video.category) && (
                <>
                  <dt>Reihe</dt>
                  <dd>{video.series || video.category}</dd>
                </>
              )}
              {video.episode != null && (
                <>
                  <dt>Teil</dt>
                  <dd>{video.episode}</dd>
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
              {video.releaseDate && (
                <>
                  <dt>Veröffentlicht</dt>
                  <dd>{video.releaseDate}</dd>
                </>
              )}
              {video.quality && (
                <>
                  <dt>Qualität</dt>
                  <dd>{video.quality}</dd>
                </>
              )}
            </dl>
            {video.tags?.length > 0 && (
              <div className="meta-row" style={{ marginTop: 14 }}>
                {video.tags.map((tag) => (
                  <span className="chip" key={tag}>
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            {!video.available && (
              <p className="muted" style={{ marginTop: 12 }}>
                Datei nicht verfügbar – prüfe den Pfad in metadata/videos.json.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
