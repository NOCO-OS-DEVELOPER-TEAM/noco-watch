import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Home', icon: '⌂', end: true },
  { to: '/search', label: 'Suche', icon: '⌕' },
  { to: '/genres', label: 'Genres', icon: '▣' },
  { to: '/originals', label: 'Originals', icon: '★' },
  { to: '/settings', label: 'Mehr', icon: '⚙' },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Mobile Navigation">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          className={({ isActive }) =>
            `bottom-nav-link${isActive ? ' is-active' : ''}`
          }
        >
          <span className="bottom-nav-icon" aria-hidden="true">
            {link.icon}
          </span>
          <span>{link.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
