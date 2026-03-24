import { NavLink, Outlet } from 'react-router-dom';
import './AppLayout.css';

const TABS = [
  { label: 'Map', path: '/app/map' },
  { label: 'Challenges', path: '/app/challenges' },
  { label: 'Badges', path: '/app/badges' },
  { label: 'Profile', path: '/app/profile' },
];

function AppLayout() {
  return (
    <div className="app-layout">
      {/* ── Top Navigation Bar ── */}
      <nav className="top-nav">
        {/* Top Row: branding */}
        <div className="nav-top-row">
          <span className="nav-title">OpenWorld</span>
          <span className="nav-badge">Gator Explorer View</span>
        </div>

        {/* Bottom Row: tabs */}
        <div className="nav-tabs">
          {TABS.map((tab) => (
            <NavLink
              key={tab.label}
              to={tab.path}
              className={({ isActive }) =>
                'nav-tab' + (isActive ? ' nav-tab-active' : '')
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* ── Page Content (rendered by nested routes) ── */}
      <main className="page-content">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
