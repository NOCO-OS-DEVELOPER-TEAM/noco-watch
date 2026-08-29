import { Link, NavLink } from 'react-router-dom';
import { api } from '../api/client';

const isDesktop =
  typeof window !== 'undefined' && Boolean(window.nocoDesktop?.isDesktop);

export default function TopNav({ system }) {
  const online = Boolean(system?.status === 'online');
  const logoSrc = api.mediaUrl('/branding/noco-watch-logo.svg');

  return (
    <header className="topnav">
      <Link to="/" className="brand brand-logo">
        <img src={logoSrc} alt="NOCO WATCH" className="brand-logo-img" />
      </Link>
      <nav className="nav-links desktop-nav" aria-label="Hauptnavigation">
        <NavLink to="/" end>
          Home
        </NavLink>
        <NavLink to="/films">Filme</NavLink>
        <NavLink to="/genres">Genres</NavLink>
        <NavLink to="/search">Suche</NavLink>
        <NavLink to="/ask">Frag NOCO</NavLink>
      </nav>
      <div className="topnav-right">
        {isDesktop && <span className="app-badge">Windows App</span>}
        <NavLink to="/settings" className="nav-more">
          Mehr
        </NavLink>
        <div className={`server-pill ${online ? '' : 'offline'}`}>
          <span className="dot" />
          {online ? 'Online' : 'Offline'}
        </div>
      </div>
    </header>
  );
}
