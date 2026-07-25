import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Wrench, Bell, Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';

const NAV_BY_ROLE = {
  guest: [
    { to: '/technicians', label: 'Find technicians' },
  ],
  customer: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/technicians', label: 'Find technicians' },
    { to: '/requests', label: 'My requests' },
    { to: '/bookings', label: 'Bookings' },
    { to: '/warranties', label: 'Warranties' },
  ],
  technician: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/tech/requests', label: 'Available jobs' },
    { to: '/bookings', label: 'My jobs' },
    { to: '/wallet', label: 'Wallet' },
    { to: '/tech/profile', label: 'Service profile' },
  ],
  admin: [
    { to: '/dashboard', label: 'Analytics' },
    { to: '/admin/technicians', label: 'Verification' },
    { to: '/admin/users', label: 'Users' },
  ],
};

export default function Layout() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = NAV_BY_ROLE[user?.role || 'guest'];

  const linkCls = ({ isActive }) =>
    `rounded-md px-3 py-2 text-sm font-medium transition ${
      isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2 font-bold text-slate-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Wrench className="h-5 w-5" />
            </span>
            <span className="text-lg">
              Repair<span className="text-blue-600">Hub</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} className={linkCls}>
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link
                  to="/notifications"
                  className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
                <div className="hidden items-center gap-3 md:flex">
                  <div className="text-right">
                    <p className="text-sm font-medium leading-tight text-slate-800">{user.name}</p>
                    <p className="text-xs capitalize text-slate-500">{user.role}</p>
                  </div>
                  <button onClick={handleLogout} className="btn-secondary !px-3" title="Log out">
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="hidden items-center gap-2 md:flex">
                <Link to="/login" className="btn-secondary">
                  Log in
                </Link>
                <Link to="/register" className="btn-primary">
                  Get started
                </Link>
              </div>
            )}
            <button
              className="rounded-md p-2 text-slate-600 hover:bg-slate-100 md:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
            <div className="flex flex-col gap-1">
              {links.map((l) => (
                <NavLink key={l.to} to={l.to} className={linkCls} onClick={() => setMobileOpen(false)}>
                  {l.label}
                </NavLink>
              ))}
              {user ? (
                <button onClick={handleLogout} className="mt-2 btn-secondary">
                  <LogOut className="h-4 w-4" /> Log out ({user.name})
                </button>
              ) : (
                <div className="mt-2 flex gap-2">
                  <Link to="/login" className="btn-secondary flex-1" onClick={() => setMobileOpen(false)}>
                    Log in
                  </Link>
                  <Link to="/register" className="btn-primary flex-1" onClick={() => setMobileOpen(false)}>
                    Get started
                  </Link>
                </div>
              )}
            </div>
          </nav>
        )}
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-slate-500 sm:px-6">
          RepairHub — Trusted Repair Services Marketplace · TechCrush Capstone, Group 9
        </div>
      </footer>
    </div>
  );
}
