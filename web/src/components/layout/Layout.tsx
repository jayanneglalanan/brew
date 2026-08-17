import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAuth } from '@/app/AuthContext';
import { roleLabel } from 'mock-data';

export default function Layout() {
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar>
        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen((v) => !v)}
            className="flex w-full items-center gap-3 rounded-lg text-left transition-colors hover:bg-stone-50"
          >
            <div className="grid h-9 w-9 place-items-center rounded-full bg-stone-200 font-bold text-stone-700">
              {user?.name.charAt(0) ?? '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-stone-800">{user?.name ?? 'Guest'}</p>
              <p className="text-xs text-stone-500">{user ? roleLabel(user.role) : '—'}</p>
            </div>
            <span className="text-stone-300">›</span>
          </button>

          {profileOpen && (
            <div className="absolute bottom-full left-0 right-0 z-10 mb-2 rounded-xl border border-stone-200 bg-white p-3 shadow-lg">
              <p className="text-sm font-semibold text-stone-800">{user?.name ?? 'Guest'}</p>
              <p className="text-xs text-stone-500">{user ? roleLabel(user.role) : '—'}</p>
              <div className="mt-2 border-t border-stone-100" />
              <button
                type="button"
                onClick={() => {
                  logout();
                  setProfileOpen(false);
                }}
                className="mt-2 w-full rounded-lg py-1.5 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </Sidebar>
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
