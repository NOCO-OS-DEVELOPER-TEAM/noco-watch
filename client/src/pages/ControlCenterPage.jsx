import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

const isDesktop =
  typeof window !== 'undefined' && Boolean(window.nocoDesktop?.isDesktop);

export default function ControlCenterPage({ system, refreshSystem }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [desktopStatus, setDesktopStatus] = useState(null);
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    api.videos()
      .then((data) => setVideos(data.videos || []))
      .catch(() => setVideos([]));
  }, [system?.status]);

  useEffect(() => {
    if (!isDesktop) return undefined;
    window.nocoDesktop.serverStatus().then(setDesktopStatus).catch(() => {});
    const off = window.nocoDesktop.onServerChanged?.((payload) => {
      setDesktopStatus((s) => ({ ...s, ...payload }));
      refreshSystem?.();
    });
    return () => {
      if (typeof off === 'function') off();
    };
  }, [refreshSystem]);

  async function startServer() {
    if (!isDesktop) {
      setMessage('Server-Steuerung nur in der Windows-App.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      await window.nocoDesktop.startServer();
      setMessage('Server läuft. Andere Geräte können jetzt zugreifen.');
      await refreshSystem?.();
      setDesktopStatus(await window.nocoDesktop.serverStatus());
    } catch (err) {
      setMessage(err.message || 'Start fehlgeschlagen');
    } finally {
      setBusy(false);
    }
  }

  async function stopServer() {
    if (!isDesktop) return;
    setBusy(true);
    setMessage('');
    try {
      const result = await window.nocoDesktop.stopServer();
      if (result?.startedByApp === false && result?.running) {
        setMessage(
          'Dieser Server wurde nicht von der App gestartet und bleibt online.'
        );
      } else {
        setMessage('Server gestoppt.');
      }
      await refreshSystem?.();
      setDesktopStatus(await window.nocoDesktop.serverStatus());
    } catch (err) {
      setMessage(err.message || 'Stoppen fehlgeschlagen');
    } finally {
      setBusy(false);
    }
  }

  async function copyLan() {
    if (!system?.lanUrl) return;
    if (isDesktop) {
      await window.nocoDesktop.copyText(system.lanUrl);
    } else {
      await navigator.clipboard?.writeText(system.lanUrl);
    }
    setMessage('LAN-Adresse kopiert.');
  }

  const online = system?.status === 'online';
  const available = videos.filter((v) => v.available);

  return (
    <div className="page settings-wrap">
      <h1 className="page-title">Steuerzentrale</h1>
      <p className="muted">
        {isDesktop
          ? 'Windows-App aktiv: Server steuern und Filme direkt hier abspielen.'
          : 'Du bist im Browser. Für volle Server-Steuerung die Windows-App starten.'}
      </p>

      <div className="panel control-hero">
        <div className="control-status-row">
          <div>
            <div className="eyebrow">NOCO WATCH Server</div>
            <h2 style={{ margin: '6px 0 0' }}>
              {online ? '🟢 Online' : '🔴 Offline'}
            </h2>
            <p className="muted" style={{ marginTop: 8 }}>
              {isDesktop ? 'Modus: Windows-App' : 'Modus: Browser'}
              {desktopStatus?.startedByApp ? ' · von App gestartet' : ''}
            </p>
          </div>
          <div className="hero-actions">
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy || !isDesktop || online}
              onClick={startServer}
            >
              Server starten
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={busy || !isDesktop || !online}
              onClick={stopServer}
            >
              Server stoppen
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={busy}
              onClick={() => refreshSystem?.()}
            >
              Aktualisieren
            </button>
          </div>
        </div>

        {system?.lanUrl ? (
          <>
            <p style={{ marginTop: 18 }}>
              Im lokalen Netzwerk erreichbar unter:
            </p>
            <div className="lan-url">{system.lanUrl}</div>
            <div className="hero-actions" style={{ marginTop: 14 }}>
              <button type="button" className="btn btn-ghost" onClick={copyLan}>
                Adresse kopieren
              </button>
              {isDesktop && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => window.nocoDesktop.openExternal(system.lanUrl)}
                >
                  Im Browser öffnen
                </button>
              )}
            </div>
          </>
        ) : (
          <p className="muted" style={{ marginTop: 18 }}>
            Keine LAN-Adresse erkannt.
          </p>
        )}

        {system?.localhostUrl && (
          <p className="muted" style={{ marginTop: 12 }}>
            Lokal: {system.localhostUrl}
          </p>
        )}

        {message && (
          <p className="muted" style={{ marginTop: 14 }}>
            {message}
          </p>
        )}

        {!isDesktop && (
          <p className="muted" style={{ marginTop: 14 }}>
            Starte die Windows-App über die Desktop-Verknüpfung{' '}
            <strong>NOCO WATCH</strong>, um Server und Player in einem Fenster zu
            nutzen.
          </p>
        )}
      </div>

      <div className="panel">
        <h2>Bibliothek in der App</h2>
        <p className="muted">
          {available.length} Titel verfügbar · Filme hier abspielen (inkl. Intro)
        </p>
        <div className="control-library">
          {available.map((video) => (
            <div className="control-library-row" key={video.id}>
              <div>
                <strong>{video.title}</strong>
                <p className="muted">
                  {video.type === 'html' ? 'HTML Film' : 'Video'} ·{' '}
                  {video.category}
                </p>
              </div>
              <div className="hero-actions">
                <Link className="btn btn-ghost" to={`/video/${video.id}`}>
                  Infos
                </Link>
                <Link className="btn btn-primary" to={`/play/${video.id}`}>
                  Abspielen
                </Link>
              </div>
            </div>
          ))}
          {available.length === 0 && (
            <div className="empty-box">Noch keine abspielbaren Titel.</div>
          )}
        </div>
      </div>

      <div className="panel">
        <h2>Schnellzugriff</h2>
        <div className="hero-actions">
          <Link className="btn btn-ghost" to="/">
            Home
          </Link>
          <Link className="btn btn-ghost" to="/search">
            Suche
          </Link>
          <Link className="btn btn-ghost" to="/settings">
            Einstellungen
          </Link>
        </div>
      </div>
    </div>
  );
}
