import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api/client';

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function parseVtt(text) {
  const cues = [];
  const blocks = String(text || '')
    .replace(/\r/g, '')
    .split(/\n\n+/);
  for (const block of blocks) {
    const lines = block.split('\n').filter(Boolean);
    if (!lines.length || lines[0].startsWith('WEBVTT')) continue;
    const timeLine = lines.find((l) => l.includes('-->'));
    if (!timeLine) continue;
    const [startRaw, endRaw] = timeLine.split('-->').map((x) => x.trim());
    const toSec = (t) => {
      const parts = t.split(':').map(Number);
      if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
      if (parts.length === 2) return parts[0] * 60 + parts[1];
      return 0;
    };
    const textLines = lines.slice(lines.indexOf(timeLine) + 1);
    cues.push({
      start: toSec(startRaw.replace(',', '.')),
      end: toSec(endRaw.split(/\s+/)[0].replace(',', '.')),
      text: textLines.join('\n'),
    });
  }
  return cues;
}

/**
 * NOCO Player V2 – cinematic controls, intro, video + HTML films.
 */
export default function NocoPlayer({
  title,
  type = 'video',
  introUrl,
  contentUrl,
  subtitles = [],
  autoplay = true,
  initialVolume = 1,
  onEnded,
}) {
  const stageRef = useRef(null);
  const videoRef = useRef(null);
  const htmlRef = useRef(null);
  const scrubRef = useRef(null);
  const hideTimer = useRef(null);
  const flashTimer = useRef(null);
  const previewVideoRef = useRef(null);
  const previewCache = useRef(new Map());
  const lastTouchToggle = useRef(0);

  const [phase, setPhase] = useState(introUrl ? 'intro' : 'main');
  const [playing, setPlaying] = useState(Boolean(autoplay));
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(type === 'html' ? 60 : 0);
  const [volume, setVolume] = useState(initialVolume);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1);
  const [showUi, setShowUi] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [flash, setFlash] = useState(null);
  const [ccOpen, setCcOpen] = useState(false);
  const [subtitleLang, setSubtitleLang] = useState('off');
  const [cues, setCues] = useState([]);
  const [hoverPreview, setHoverPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [fsFallback, setFsFallback] = useState(false);
  const currentRef = useRef(0);
  const durationRef = useRef(0);

  useEffect(() => {
    currentRef.current = current;
  }, [current]);
  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  const bumpUi = useCallback(() => {
    setShowUi(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (playing && !ccOpen && !dragging) setShowUi(false);
    }, 3000);
  }, [playing, ccOpen, dragging]);

  useEffect(() => {
    bumpUi();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      if (flashTimer.current) clearTimeout(flashTimer.current);
    };
  }, [bumpUi, phase]);

  useEffect(() => {
    const onFs = () => {
      const active = Boolean(
        document.fullscreenElement || document.webkitFullscreenElement
      );
      setFullscreen(active || fsFallback);
      if (active) setFsFallback(false);
    };
    document.addEventListener('fullscreenchange', onFs);
    document.addEventListener('webkitfullscreenchange', onFs);
    return () => {
      document.removeEventListener('fullscreenchange', onFs);
      document.removeEventListener('webkitfullscreenchange', onFs);
    };
  }, [fsFallback]);

  useEffect(() => {
    setFullscreen(Boolean(document.fullscreenElement) || fsFallback);
  }, [fsFallback]);

  // Cleanup HTML iframe on unmount / leave
  useEffect(() => {
    return () => {
      const frame = htmlRef.current;
      if (frame) {
        try {
          frame.contentWindow?.postMessage(
            { target: 'noco-content', command: 'pause' },
            '*'
          );
        } catch {
          /* ignore */
        }
        frame.src = 'about:blank';
      }
      const vid = videoRef.current;
      if (vid) {
        vid.pause();
        vid.removeAttribute('src');
        vid.load();
      }
    };
  }, []);

  useEffect(() => {
    function onMessage(event) {
      const data = event.data;
      if (!data || data.source !== 'noco-content') return;

      if (phase === 'intro' && data.kind === 'intro' && data.event === 'ended') {
        setPhase('main');
        setCurrent(0);
        setPlaying(true);
        bumpUi();
        return;
      }

      if (phase !== 'main' || data.kind !== 'html-film') return;

      if (data.event === 'ready' && typeof data.duration === 'number') {
        setDuration(data.duration);
      }
      if (data.event === 'timeupdate' && typeof data.currentTime === 'number') {
        setCurrent(data.currentTime);
        if (typeof data.duration === 'number') setDuration(data.duration);
      }
      if (data.event === 'ended') {
        setPlaying(false);
        setCurrent(data.duration || durationRef.current);
        setShowUi(true);
        onEnded?.();
      }
      if (data.event === 'play') setPlaying(true);
      if (data.event === 'pause') setPlaying(false);
    }

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [phase, onEnded, bumpUi]);

  useEffect(() => {
    if (phase !== 'main' || type !== 'video') return;
    const el = videoRef.current;
    if (!el) return;
    el.volume = muted ? 0 : volume;
    el.playbackRate = rate;
    if (playing) {
      el.play().catch(() => setPlaying(false));
    } else {
      el.pause();
    }
  }, [phase, type, playing, volume, muted, rate]);

  useEffect(() => {
    if (phase !== 'main' || type !== 'html') return;
    const frame = htmlRef.current?.contentWindow;
    if (!frame) return;
    frame.postMessage(
      { target: 'noco-content', command: playing ? 'play' : 'pause' },
      '*'
    );
  }, [phase, type, playing]);

  useEffect(() => {
    let alive = true;
    if (subtitleLang === 'off') {
      setCues([]);
      return undefined;
    }
    const track = subtitles.find((s) => s.lang === subtitleLang);
    if (!track) {
      setCues([]);
      return undefined;
    }
    fetch(api.mediaUrl(track.url))
      .then((r) => r.text())
      .then((text) => {
        if (!alive) return;
        setCues(parseVtt(text));
      })
      .catch(() => {
        if (!alive) return;
        setCues([]);
      });
    return () => {
      alive = false;
    };
  }, [subtitleLang, subtitles]);

  const activeCue = cues.find((c) => current >= c.start && current <= c.end);

  function showFlash(kind) {
    setFlash(kind);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 650);
  }

  function skipIntro() {
    setPhase('main');
    setCurrent(0);
    setPlaying(true);
    bumpUi();
  }

  function togglePlay(fromSurface = false) {
    if (phase === 'intro') {
      skipIntro();
      return;
    }
    setPlaying((p) => {
      const next = !p;
      if (fromSurface) showFlash(next ? 'play' : 'pause');
      return next;
    });
    bumpUi();
  }

  function seekTo(ratio) {
    if (phase !== 'main') return;
    const next = Math.max(0, Math.min(1, ratio)) * (durationRef.current || 0);

    if (type === 'video' && videoRef.current) {
      videoRef.current.currentTime = next;
      setCurrent(next);
      return;
    }

    if (type === 'html') {
      htmlRef.current?.contentWindow?.postMessage(
        { target: 'noco-content', command: 'seek', time: next },
        '*'
      );
      setCurrent(next);
    }
  }

  async function toggleFullscreen() {
    const node = stageRef.current;
    if (!node) return;

    try {
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        setFsFallback(false);
        bumpUi();
        return;
      }

      if (typeof node.requestFullscreen === 'function') {
        await node.requestFullscreen();
        setFsFallback(false);
      } else if (typeof node.webkitRequestFullscreen === 'function') {
        node.webkitRequestFullscreen();
        setFsFallback(false);
      } else if (
        type === 'video' &&
        videoRef.current &&
        typeof videoRef.current.webkitEnterFullscreen === 'function'
      ) {
        videoRef.current.webkitEnterFullscreen();
        setFsFallback(false);
      } else {
        setFsFallback((v) => !v);
      }
    } catch {
      setFsFallback((v) => !v);
    }
    bumpUi();
  }

  function onStagePointer(e) {
    if (e.target.closest('.noco-player-chrome, .noco-cc-menu, button, input, select, a, .noco-scrub')) {
      return;
    }
    // Ignore secondary clicks / multi-touch noise
    if (e.type === 'pointerdown' && e.button != null && e.button !== 0) return;
    const now = Date.now();
    if (now - lastTouchToggle.current < 280) return;
    lastTouchToggle.current = now;
    e.preventDefault();
    togglePlay(true);
  }

  function ratioFromEvent(e, el) {
    const rect = el.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    return Math.max(0, Math.min(1, x / rect.width));
  }

  function updateHoverPreview(e) {
    if (phase !== 'main' || !scrubRef.current || !duration) {
      setHoverPreview(null);
      return;
    }
    const ratio = ratioFromEvent(e, scrubRef.current);
    const time = ratio * duration;
    const bucket = Math.floor(time / 10) * 10;
    const rect = scrubRef.current.getBoundingClientRect();
    const stageRect = stageRef.current?.getBoundingClientRect();
    let left = ratio * rect.width;
    if (stageRect) {
      const abs = rect.left - stageRect.left + left;
      left = Math.max(70, Math.min(stageRect.width - 70, abs));
    }

    const preview = {
      time,
      bucket,
      left,
      label: `~${formatTime(bucket)}`,
      image: previewCache.current.get(bucket) || null,
    };
    setHoverPreview(preview);

    if (type === 'video' && contentUrl && !previewCache.current.has(bucket)) {
      ensureVideoPreview(bucket);
    }
  }

  function ensureVideoPreview(bucket) {
    let pv = previewVideoRef.current;
    if (!pv) {
      pv = document.createElement('video');
      pv.muted = true;
      pv.preload = 'metadata';
      pv.src = contentUrl;
      previewVideoRef.current = pv;
    }
    const onSeeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 90;
        const ctx = canvas.getContext('2d');
        if (ctx && pv.videoWidth) {
          ctx.drawImage(pv, 0, 0, canvas.width, canvas.height);
          const url = canvas.toDataURL('image/jpeg', 0.7);
          previewCache.current.set(bucket, url);
          setHoverPreview((h) =>
            h && h.bucket === bucket ? { ...h, image: url } : h
          );
        }
      } catch {
        /* ignore decode issues */
      }
      pv.removeEventListener('seeked', onSeeked);
    };
    pv.addEventListener('seeked', onSeeked);
    try {
      pv.currentTime = Math.min(bucket + 0.1, Math.max(0, (pv.duration || bucket) - 0.1));
    } catch {
      pv.removeEventListener('seeked', onSeeked);
    }
  }

  const progress = duration > 0 ? (current / duration) * 100 : 0;
  const hasAudioControls = type === 'video' || phase === 'intro';
  const hasSubtitles = subtitles.length > 0;
  const cursorHidden = !showUi && playing && phase === 'main';

  return (
    <div
      className={`noco-player ${showUi || phase === 'intro' ? 'ui-visible' : 'ui-hidden'} ${cursorHidden ? 'cursor-hidden' : ''} ${fsFallback ? 'is-fs-fallback' : ''}`}
      ref={stageRef}
      onMouseMove={() => bumpUi()}
      onTouchStart={() => bumpUi()}
      onPointerUp={onStagePointer}
    >
      <div className="noco-player-stage">
        {phase === 'intro' && introUrl && (
          <iframe
            title="NOCO Originals Intro"
            src={introUrl}
            className="noco-frame"
            allow="autoplay"
            sandbox="allow-scripts allow-same-origin"
          />
        )}

        {phase === 'main' && type === 'video' && (
          <video
            ref={videoRef}
            className="noco-video"
            src={contentUrl}
            playsInline
            autoPlay={autoplay}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
            onEnded={() => {
              setPlaying(false);
              setShowUi(true);
              onEnded?.();
            }}
          >
            {subtitles.map((sub) => (
              <track
                key={sub.lang}
                kind="subtitles"
                srcLang={sub.lang}
                label={sub.label}
                src={api.mediaUrl(sub.url)}
              />
            ))}
          </video>
        )}

        {phase === 'main' && type === 'html' && (
          <iframe
            ref={htmlRef}
            title={title}
            src={contentUrl}
            className="noco-frame"
            allow="autoplay"
            sandbox="allow-scripts allow-same-origin"
          />
        )}

        {activeCue && (
          <div className="noco-subtitle-overlay" aria-live="polite">
            {activeCue.text}
          </div>
        )}

        {flash && (
          <div className={`noco-flash noco-flash-${flash}`} aria-hidden="true">
            {flash === 'play' ? '▶' : '❚❚'}
          </div>
        )}
      </div>

      <div
        className="noco-player-chrome"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="noco-player-top">
          <div>
            <div className="noco-player-kicker">
              {phase === 'intro' ? 'NOCO ORIGINALS' : 'JETZT LÄUFT'}
            </div>
            <div className="noco-player-title">
              {phase === 'intro' ? 'Intro' : title}
            </div>
          </div>
          <div className="noco-player-top-actions">
            {phase === 'intro' && (
              <button type="button" className="noco-ctrl" onClick={skipIntro}>
                Intro überspringen
              </button>
            )}
            {phase === 'main' && hasSubtitles && (
              <div className="noco-cc-wrap">
                <button
                  type="button"
                  className={`noco-ctrl ${subtitleLang !== 'off' ? 'active' : ''}`}
                  onClick={() => {
                    setCcOpen((o) => !o);
                    bumpUi();
                  }}
                >
                  CC
                </button>
                {ccOpen && (
                  <div className="noco-cc-menu">
                    <button
                      type="button"
                      className={subtitleLang === 'off' ? 'active' : ''}
                      onClick={() => {
                        setSubtitleLang('off');
                        setCcOpen(false);
                      }}
                    >
                      Aus
                    </button>
                    {subtitles.map((sub) => (
                      <button
                        key={sub.lang}
                        type="button"
                        className={subtitleLang === sub.lang ? 'active' : ''}
                        onClick={() => {
                          setSubtitleLang(sub.lang);
                          setCcOpen(false);
                        }}
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="noco-player-bottom">
          <div
            className="noco-scrub"
            ref={scrubRef}
            role="slider"
            aria-valuemin={0}
            aria-valuemax={duration || 0}
            aria-valuenow={current}
            tabIndex={0}
            onMouseMove={updateHoverPreview}
            onMouseLeave={() => setHoverPreview(null)}
            onMouseDown={(e) => {
              setDragging(true);
              seekTo(ratioFromEvent(e, scrubRef.current));
              bumpUi();
            }}
            onClick={(e) => {
              seekTo(ratioFromEvent(e, scrubRef.current));
              bumpUi();
            }}
            onTouchStart={(e) => {
              setDragging(true);
              seekTo(ratioFromEvent(e, scrubRef.current));
              bumpUi();
            }}
            onTouchMove={(e) => {
              seekTo(ratioFromEvent(e, scrubRef.current));
            }}
            onTouchEnd={() => setDragging(false)}
            onMouseUp={() => setDragging(false)}
          >
            <div className="noco-scrub-fill" style={{ width: `${progress}%` }} />
            {hoverPreview && (
              <div
                className="noco-timeline-preview"
                style={{ left: hoverPreview.left }}
              >
                {hoverPreview.image ? (
                  <img src={hoverPreview.image} alt="" />
                ) : (
                  <div className="noco-timeline-preview-fallback">
                    {type === 'html' ? 'Szene' : 'Preview'}
                  </div>
                )}
                <span>{formatTime(hoverPreview.time)}</span>
              </div>
            )}
          </div>

          <div className="noco-controls">
            <button
              type="button"
              className="noco-ctrl"
              onClick={() => togglePlay(false)}
            >
              {playing ? 'Pause' : 'Play'}
            </button>

            <span className="noco-time">
              {formatTime(current)} / {formatTime(duration)}
            </span>

            <label className={`noco-volume ${hasAudioControls ? '' : 'is-muted-ui'}`}>
              <button
                type="button"
                className="noco-ctrl"
                disabled={!hasAudioControls}
                onClick={() => setMuted((m) => !m)}
                title={
                  hasAudioControls
                    ? 'Ton'
                    : 'Dieser HTML-Film hat keinen Ton-Kanal'
                }
              >
                {muted || volume === 0 || !hasAudioControls ? 'Stumm' : 'Ton'}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={muted || !hasAudioControls ? 0 : volume}
                disabled={!hasAudioControls}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setVolume(v);
                  setMuted(v === 0);
                }}
              />
            </label>

            <label className="noco-rate">
              Tempo
              <select
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                disabled={type === 'html'}
              >
                <option value={0.75}>0.75×</option>
                <option value={1}>1×</option>
                <option value={1.25}>1.25×</option>
                <option value={1.5}>1.5×</option>
                <option value={2}>2×</option>
              </select>
            </label>

            <button type="button" className="noco-ctrl" onClick={toggleFullscreen}>
              {fullscreen ? 'Fenster' : 'Vollbild'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
