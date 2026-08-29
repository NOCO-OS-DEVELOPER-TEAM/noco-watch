import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, loadSettings } from '../api/client';
import NocoPlayer from '../components/NocoPlayer';

export default function PlayerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [error, setError] = useState('');
  const settings = loadSettings();
  const shouldAutoplay = settings.autoplay !== false;
  const initialVolume =
    typeof settings.volume === 'number' ? settings.volume : 1;

  useEffect(() => {
    let alive = true;
    api
      .video(id)
      .then((data) => {
        if (!alive) return;
        if (!data.video.available) {
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
  }, [id]);

  if (error) {
    return (
      <div className="page player-wrap">
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
    <div className="page player-wrap player-wrap-wide">
      <div className="section-head">
        <div>
          <div className="eyebrow">
            {video.type === 'html' ? 'HTML Film' : 'Video'} · NOCO Player
          </div>
          <h1 className="page-title" style={{ margin: 0 }}>
            {video.title}
          </h1>
        </div>
        <Link className="btn btn-ghost" to={`/video/${video.id}`}>
          Infos
        </Link>
      </div>

      <div style={{ marginTop: 18 }}>
        <NocoPlayer
          title={video.title}
          type={video.type === 'html' ? 'html' : 'video'}
          introUrl={introUrl}
          contentUrl={contentUrl}
          subtitles={video.subtitles || []}
          autoplay={shouldAutoplay}
          initialVolume={initialVolume}
        />
      </div>
    </div>
  );
}
