import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Map, Trophy, CircleStar, User } from 'lucide-react';
import './AppLayout.css';

const TABS = [
  { label: 'Map', path: '/app/map', Icon: Map },
  { label: 'Challenges', path: '/app/challenges', Icon: Trophy },
  { label: 'Badges', path: '/app/badges', Icon: CircleStar },
  { label: 'Profile', path: '/app/profile', Icon: User },
];

function AppLayout() {
  const location = useLocation();
  const darkInset =
    location.pathname === '/app/badges' || location.pathname === '/app/profile';

  const userStr = localStorage.getItem('authUser') || sessionStorage.getItem('authUser');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const isAdmin = currentUser?.role === 'Admin';

  return (
    <div className="app-layout">
      <nav className="top-nav">
        <div className="nav-top-row">
          <span className="nav-title">OpenWorld</span>
          <span className="nav-badge">{isAdmin ? 'Admin Cartographer View' : 'Gator Explorer View'}</span>
        </div>

        <div className="nav-tabs">
          {TABS.map(({ label, path, Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                'nav-tab' + (isActive ? ' nav-tab-active' : '')
              }
            >
              <span className="nav-tab-inner">
                <Icon className="nav-tab-icon" size={26} strokeWidth={2} aria-hidden />
                <span className="nav-tab-label">{label}</span>
              </span>
            </NavLink>
          ))}
        </div>
      </nav>

      <main
        className={
          'page-content' + (darkInset ? ' page-content--flush-dark' : '')
        }
      >
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
