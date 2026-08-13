import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar>
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-stone-200 font-bold text-stone-700">M</div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-stone-800">Maria</p>
            <p className="text-xs text-stone-500">Owner</p>
          </div>
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
