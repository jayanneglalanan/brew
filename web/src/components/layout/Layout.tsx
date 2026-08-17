import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAuth } from '@/app/AuthContext';

export default function Layout() {
  const { logout } = useAuth();
  const [logoutOpen, setLogoutOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar>
        {logoutOpen ? (
          <div className="rounded-lg border border-stone-200 bg-white p-3 shadow-sm">
            <p className="mb-2 text-sm font-semibold text-stone-800">Log out</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setLogoutOpen(false)}
                className="btn flex-1 bg-stone-100 text-stone-700 hover:bg-stone-200"
              >
                Cancel
              </button>
              <button type="button" onClick={logout} className="btn btn-primary flex-1 !bg-rose-600 hover:!bg-rose-700">
                Log out
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setLogoutOpen(true)}
            className="flex w-full items-center justify-start gap-2 rounded-lg bg-rose-600 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-700"
          >
            <span aria-hidden>↪</span>
            Log out
          </button>
        )}
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
