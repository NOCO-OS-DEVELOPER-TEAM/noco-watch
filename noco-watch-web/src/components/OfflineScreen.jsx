import { Link } from 'react-router-dom';
import { useConnection } from '../context/ConnectionContext';

export default function OfflineScreen({ variant = 'full' }) {
  const { serverUrl, status, error, refresh } = useConnection();
  const mixed = status === 'mixed';

  return (
    <div className={`offline-screen ${variant === 'inline' ? 'is-inline' : ''}`}>
      <p className="offline-brand">NOCO WATCH</p>
      <div className={`status-pill ${mixed ? 'is-mixed' : 'is-offline'}`}>
        <span className="status-dot" aria-hidden="true" />
        {mixed ? 'Verbindung blockiert' : 'Server nicht erreichbar'}
      </div>

      <h1>{mixed ? 'HTTPS blockiert HTTP' : 'NOCO WATCH ist nicht erreichbar'}</h1>

      <p className="offline-copy">
        {mixed
          ? error ||
            'Dein Browser blockiert aktuell die Verbindung zwischen der sicheren GitHub-Seite und deinem lokalen NOCO-WATCH-Server.'
          : 'Verbinde dein Gerät mit demselben WLAN wie deinen NOCO-WATCH-Server. Die Filme liegen nur auf dem Windows-PC – nichts wurde gelöscht.'}
      </p>

      <p className="offline-server">
        Server:
        <br />
        <code>{serverUrl}</code>
      </p>

      <div className="offline-actions">
        <button type="button" className="btn btn-primary" onClick={() => refresh()}>
          Erneut prüfen
        </button>
        <Link to="/settings" className="btn btn-ghost">
          Serveradresse ändern
        </Link>
      </div>
    </div>
  );
}
