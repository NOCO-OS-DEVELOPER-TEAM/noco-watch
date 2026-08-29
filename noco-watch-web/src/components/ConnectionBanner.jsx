import { Link } from 'react-router-dom';
import { useConnection } from '../context/ConnectionContext';

export default function ConnectionBanner() {
  const { status, serverUrl } = useConnection();

  if (status === 'checking') {
    return (
      <div className="conn-banner is-checking" role="status">
        Verbinde mit NOCO WATCH…
      </div>
    );
  }

  if (status === 'online') {
    return (
      <div className="conn-banner is-online" role="status">
        <span className="status-dot" aria-hidden="true" />
        NOCO WATCH verbunden
      </div>
    );
  }

  if (status === 'mixed') {
    return (
      <div className="conn-banner is-mixed" role="status">
        <span className="status-dot" aria-hidden="true" />
        Browser blockiert lokale HTTP-Verbindung
        <Link to="/settings">Hilfe</Link>
      </div>
    );
  }

  return (
    <div className="conn-banner is-offline" role="status">
      <span className="status-dot" aria-hidden="true" />
      NOCO WATCH ist nicht erreichbar
      <Link to="/settings">Server ändern</Link>
      <span className="conn-banner-url">{serverUrl}</span>
    </div>
  );
}
