import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useConnection } from '../context/ConnectionContext';
import OfflineScreen from '../components/OfflineScreen';
import NocoPlayer from '../components/NocoPlayer';

/**
 * Film media is requested only after navigating here (Play button).
 */
export default function PlayerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { online, status } = useConnection();
  const [video, setVideo] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!online) return undefined;
    let alive = true;
    // Metadata only first – stream/content URLs are absolute but only used when Player mounts
    api
      .video(id)
      .then((data) => {
        if (!alive) return;
        if (!data.video?.available) {
          setError('Inhalt ist nicht verfügbar.');
          return;
        }
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
      <div className="page player-page">
        <div className="error-box">{error}</div>
        <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>
          Zurück
        </button>
      </div>
    );
  }

  if (!video) {
    return <div className="loading">Player wird vorbereitet…</div>;
  }

  const introUrl =
    video.playIntro !== false && video.introAvailable
      ? api.mediaUrl(video.introUrl)
      : null;
  const contentUrl = api.mediaUrl(
    video.type === 'html' ? video.contentUrl : video.streamUrl
  );

  return (
    <div className="player-page-shell">
      <NocoPlayer
        title={video.title}
        type={video.type === 'html' ? 'html' : 'video'}
        introUrl={introUrl}
        contentUrl={contentUrl}
        subtitles={video.subtitles || []}
        autoplay
        onClose={() => navigate(`/video/${video.id}`)}
        onEnded={() => navigate(`/video/${video.id}`)}
      />
    </div>
  );
}
