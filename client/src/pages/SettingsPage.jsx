import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, loadSettings, saveSettings } from '../api/client';

export default function SettingsPage({ system, refreshSystem }) {
  const [settings, setSettings] = useState(() => ({
    quality: '720p',
    autoplay: true,
    volume: 1,
    ...loadSettings(),
  }));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const desktop = typeof window !== 'undefined' && window.nocoDesktop?.isDesktop;
  const online = system?.status === 'online';

  async function handleServerToggle() {
    if (!desktop) {
      setMessage(
        'Server-Steuerung ist in der Windows-App verfügbar. Im Browser läuft der Server separat.'
      );
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      if (online) {
        await window.nocoDesktop.stopServer();
        setMessage('Server gestoppt.');
      } else {
        await window.nocoDesktop.startServer();
        setMessage('Server gestartet.');
      }
      await refreshSystem?.();
    } catch (err) {
      setMessage(err.message || 'Server-Aktion fehlgeschlagen');
    } finally {
      setBusy(false);
    }
  }

  async function handleRestart() {
    if (!desktop) {
      setMessage('Neustart nur in der Windows-App möglich.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      await window.nocoDesktop.stopServer();
      await window.nocoDesktop.startServer();
      await refreshSystem?.();
      setMessage('Server neu gestartet.');
    } catch (err) {
      setMessage(err.message || 'Neustart fehlgeschlagen');
    } finally {
      setBusy(false);
    }
  }

  async function copyLan() {
    if (!system?.lanUrl) return;
    if (desktop) {
      await window.nocoDesktop.copyText(system.lanUrl);
    } else {
      await navigator.clipboard?.writeText(system.lanUrl);
    }
    setMessage('Adresse kopiert.');
  }

  return (
    <div className="page settings-wrap">
      <h1 className="page-title">Einstellungen</h1>

      <p className="muted" style={{ marginTop: -8 }}>
        <Link to="/control">Zur Steuerzentrale →</Link>
        {' · '}
        <Link to="/ask">Frag NOCO</Link>
      </p>

      <div className="panel control-hero">
        <h2>NOCO WATCH LOCAL SERVER</h2>
        <p>
          Status: {online ? '🟢 Online' : '🔴 Offline'}
        </p>
        <p className="muted" style={{ marginTop: 8 }}>
          Netzwerk: {system?.networkHint || 'Lokales WLAN'} · Protokoll: HTTP
          (kein HTTPS in V1)
        </p>

        {system?.lanUrl ? (
          <>
            <p style={{ marginTop: 16 }}>
              Diese Adresse im selben WLAN öffnen:
            </p>
            <div className="lan-url">{system.lanUrl}</div>
            <p className="muted" style={{ marginTop: 10 }}>
              Wichtig: <code>http://</code> verwenden – nicht https://
            </p>
          </>
        ) : (
          <p className="muted" style={{ marginTop: 12 }}>
            Keine LAN-Adresse erkannt.
          </p>
        )}

        {system?.localhostUrl && (
          <p className="muted" style={{ marginTop: 10 }}>
            Lokal am PC: {system.localhostUrl}
          </p>
        )}

        <div className="hero-actions" style={{ marginTop: 18 }}>
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy || !desktop}
            onClick={handleServerToggle}
          >
            {online ? 'Server stoppen' : 'Server starten'}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={busy || !desktop}
            onClick={handleRestart}
          >
            Server neu starten
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={!system?.lanUrl}
            onClick={copyLan}
          >
            Adresse kopieren
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
        {message && (
          <p className="muted" style={{ marginTop: 12 }}>
            {message}
          </p>
        )}
      </div>

      <div className="panel">
        <h2>Kein Zugriff?</h2>
        <ol className="help-list">
          <li>Beide Geräte müssen im selben WLAN sein.</li>
          <li>
            Adresse mit <code>http://</code> öffnen – nicht https://
          </li>
          <li>Windows-PC muss eingeschaltet sein und der Server laufen.</li>
          <li>
            Windows-Firewall: Port <strong>3000</strong> nur für{' '}
            <strong>private</strong> Netzwerke freigeben.
          </li>
          <li>
            Optional: Skript{' '}
            <code>scripts/open-firewall-private.ps1</code> als Administrator
            ausführen.
          </li>
        </ol>
      </div>

      <div className="panel">
        <h2>Wiedergabe</h2>
        <div className="toggle-row">
          <div>
            <strong>Videoqualität</strong>
            <p className="muted">
              V1 streamt die Quelldatei. Mehrere Qualitäten kommen später.
            </p>
          </div>
          <select
            className="select"
            style={{ width: 140 }}
            value={settings.quality}
            onChange={(e) =>
              setSettings((s) => ({ ...s, quality: e.target.value }))
            }
          >
            <option value="480p">480p</option>
            <option value="720p">720p</option>
            <option value="1080p">1080p</option>
          </select>
        </div>
        <div className="toggle-row">
          <div>
            <strong>Autoplay</strong>
            <p className="muted">Player startet nach dem Öffnen automatisch.</p>
          </div>
          <input
            type="checkbox"
            checked={Boolean(settings.autoplay)}
            onChange={(e) =>
              setSettings((s) => ({ ...s, autoplay: e.target.checked }))
            }
          />
        </div>
      </div>

      <div className="panel">
        <h2>App-Informationen</h2>
        <p>
          {system?.app || 'NOCO WATCH'} · Version {system?.version || '1.0.0'}
        </p>
        <p className="muted" style={{ marginTop: 8 }}>
          Titel: {system?.availableCount ?? '–'} verfügbar /{' '}
          {system?.videoCount ?? '–'} gesamt · Bibliothek kommt live von{' '}
          <code>/api/videos</code>
        </p>
        <p className="muted" style={{ marginTop: 8 }}>
          Server lauscht auf <code>{system?.host || '0.0.0.0'}:{system?.port || 3000}</code>
        </p>
      </div>
    </div>
  );
}
