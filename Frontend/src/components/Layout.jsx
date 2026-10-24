import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LogOut, Menu, X, Building } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { NAV } from '../config/nav.js';
import AiDrawer from './AiDrawer.jsx';
import { Badge } from './ui.jsx';

export default function Layout() {
  const { role, user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = NAV.filter((n) => n.roles.includes(role));
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.name || user?.email || 'User';

  const sidebar = (
    <nav className="flex h-full flex-col bg-slate-900 text-slate-300">
      <div className="flex items-center gap-2 px-5 py-5 text-white">
        <Building className="h-6 w-6 text-indigo-400" />
        <span className="text-lg font-bold">HCM Lite</span>
      </div>
      <ul className="flex-1 space-y-1 px-3">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon className="h-4 w-4" /> {label}
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="border-t border-slate-800 p-4">
        <p className="truncate text-sm font-medium text-white">{name}</p>
        <div className="mb-3 mt-1"><Badge tone="indigo">{role}</Badge></div>
        <button onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-800 hover:text-white">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="fixed inset-y-0 w-64">{sidebar}</div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64">{sidebar}</div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <button onClick={() => setMobileOpen((o) => !o)} aria-label="Toggle menu">
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <span className="font-bold text-slate-900">HCM Lite</span>
        </header>
        <main className="flex-1 p-4 sm:p-8">
          <Outlet />
        </main>
      </div>

      <AiDrawer />
    </div>
  );
}
