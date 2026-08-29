import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

function formatDuration(seconds) {
  if (seconds == null || Number.isNaN(Number(seconds))) return null;
  const total = Math.max(0, Math.floor(Number(seconds)));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function Cover({ video }) {
  if (video.coverUrl) {
    return (
      <iframe
        className="poster-html-cover"
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
    <div className="poster-fallback">
      <strong>{video.title}</strong>
    </div>
  );
}

export function PosterCard({ video }) {
  const navigate = useNavigate();
  const duration = formatDuration(video.durationSeconds);
  const subtitle = [
    video.series || video.genre || video.category,
    video.episode != null ? `E${video.episode}` : null,
    duration,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <button
      type="button"
      className="poster"
      onClick={() => navigate(`/video/${video.id}`)}
    >
      <div className="poster-cover">
        <Cover video={video} />
      </div>
      <div className="poster-meta">
        <h3>{video.title}</h3>
        <p>{subtitle}</p>
      </div>
    </button>
  );
}

export function PosterRail({ videos }) {
  const railRef = useRef(null);
  const drag = useRef({ active: false, startX: 0, scrollLeft: 0 });

  useEffect(() => {
    const el = railRef.current;
    if (!el) return undefined;

    function onWheel(e) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        el.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    }

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  if (!videos?.length) {
    return <div className="empty-box">Noch keine Titel in dieser Reihe.</div>;
  }

  return (
    <div
      className="rail"
      ref={railRef}
      onMouseDown={(e) => {
        const el = railRef.current;
        if (!el) return;
        drag.current = {
          active: true,
          startX: e.pageX - el.offsetLeft,
          scrollLeft: el.scrollLeft,
        };
        el.classList.add('is-dragging');
      }}
      onMouseLeave={() => {
        drag.current.active = false;
        railRef.current?.classList.remove('is-dragging');
      }}
      onMouseUp={() => {
        drag.current.active = false;
        railRef.current?.classList.remove('is-dragging');
      }}
      onMouseMove={(e) => {
        if (!drag.current.active) return;
        e.preventDefault();
        const el = railRef.current;
        if (!el) return;
        const x = e.pageX - el.offsetLeft;
        el.scrollLeft = drag.current.scrollLeft - (x - drag.current.startX);
      }}
    >
      {videos.map((video) => (
        <PosterCard key={video.id} video={video} />
      ))}
    </div>
  );
}
