import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { formatDuration } from '../utils/format';

function Cover({ video }) {
  if (video.coverUrl) {
    return (
      <iframe
        className="film-cover-frame"
        src={api.mediaUrl(video.coverUrl)}
        title={`${video.title} Cover`}
        loading="lazy"
        tabIndex={-1}
        aria-hidden="true"
        sandbox="allow-scripts allow-same-origin"
      />
    );
  }
  if (video.thumbnail) {
    return <img src={api.mediaUrl(video.thumbnail)} alt="" />;
  }
  return (
    <div className="film-cover-fallback">
      <strong>{video.title}</strong>
    </div>
  );
}

export function FilmCard({ video }) {
  const navigate = useNavigate();
  const duration = formatDuration(video.durationSeconds);
  const meta = [
    video.series || video.category,
    video.episode != null ? `E${video.episode}` : null,
    duration,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <button
      type="button"
      className="film-card"
      onClick={() => navigate(`/video/${video.id}`)}
    >
      <div className="film-card-cover">
        <Cover video={video} />
      </div>
      <div className="film-card-meta">
        <h3>{video.title}</h3>
        <p>{meta}</p>
      </div>
    </button>
  );
}

export function FilmRail({ videos }) {
  if (!videos?.length) {
    return <div className="empty-rail">Keine Titel in dieser Reihe.</div>;
  }
  return (
    <div className="film-rail">
      {videos.map((video) => (
        <FilmCard key={video.id} video={video} />
      ))}
    </div>
  );
}
