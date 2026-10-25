import { NavLink } from 'react-router-dom';
import { Home, Search, Library } from '../lib/icons.jsx';

const TABS = [
  { to: '/', label: 'Inicio', Icon: Home, end: true },
  { to: '/buscar', label: 'Buscar', Icon: Search },
  { to: '/biblioteca', label: 'Tu biblioteca', Icon: Library },
];

// Bottom tabs on a phone, a left rail on wider screens (CSS decides).
export default function TabBar() {
  return (
    <nav className="tabbar" aria-label="Secciones">
      {TABS.map(({ to, label, Icon, end }) => (
        <NavLink key={to} to={to} end={end} className="tabbar__item">
          {({ isActive }) => (
            <>
              <Icon size={24} active={isActive} />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
