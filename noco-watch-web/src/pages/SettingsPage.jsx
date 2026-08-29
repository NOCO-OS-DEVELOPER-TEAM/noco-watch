import { useEffect, useState } from 'react';
import { DEFAULT_SERVER } from '../api/serverConfig';
import { useConnection } from '../context/ConnectionContext';

export default function SettingsPage() {
  const { serverUrl, status, error, updateServerUrl, refresh } = useConnection();
  const [draft, setDraft] = useState(serverUrl);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setDraft(serverUrl);
  }, [serverUrl]);

  async function onConnect(e) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    const result = await updateServerUrl(draft);
    setBusy(false);
    if (result.ok) {
      setMessage('Verbunden');
    } else if (result.status === 'mixed') {
      setMessage('Browser blockiert Mixed Content (HTTPS → HTTP).');
    } else {
      setMessage('Nicht erreichbar – WLAN und Server prüfen.');
    }
  }

  return (
    <div className="page settings-page">
      <header className="page-header">
        <h1>NOCO WATCH SERVER</h1>
        <p>Nur die Serveradresse wird lokal gespeichert – keine Filmdaten.</p>
      </header>

      <div
        className={`status-pill ${
          status === 'online'
            ? 'is-online'
            : status === 'mixed'
              ? 'is-mixed'
              : status === 'checking'
                ? 'is-checking'
                : 'is-offline'
        }`}
      >
        <span className="status-dot" aria-hidden="true" />
        {status === 'online' && 'Verbunden'}
        {status === 'offline' && 'Nicht erreichbar'}
        {status === 'mixed' && 'HTTPS blockiert HTTP'}
        {status === 'checking' && 'Prüfe…'}
      </div>

      <form className="settings-form" onSubmit={onConnect}>
        <label>
          Serveradresse
          <input
            type="url"
            inputMode="url"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={DEFAULT_SERVER}
          />
        </label>

        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Verbinde…' : 'Verbinden'}
        </button>
      </form>

      {message && <p className="settings-message">{message}</p>}
      {error && status !== 'online' && (
        <p className="settings-hint">{error}</p>
      )}

      {status === 'mixed' && (
        <div className="help-card">
          <h2>HTTPS-Hinweis</h2>
          <p>
            GitHub Pages läuft über HTTPS. Dein NOCO-WATCH-Server nutzt HTTP.
            Browser blockieren diese Kombination (Mixed Content).
          </p>
          <ul>
            <li>
              Zum Testen die Mobile-UI über HTTP öffnen, z. B.{' '}
              <code>http://DEINE-PC-IP:3000/web/</code>
            </li>
            <li>Oder später HTTPS am NOCO-WATCH-Server aktivieren.</li>
          </ul>
        </div>
      )}

      <div className="help-card">
        <h2>Tipps</h2>
        <ul>
          <li>iPhone und Windows-PC im selben WLAN</li>
          <li>NOCO WATCH Server am PC starten</li>
          <li>Firewall: Port 3000 für private Netzwerke</li>
          <li>
            Standard: <code>{DEFAULT_SERVER}</code>
          </li>
        </ul>
        <button type="button" className="btn btn-ghost" onClick={() => refresh()}>
          Verbindung erneut prüfen
        </button>
      </div>
    </div>
  );
}
