import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
}

const NAV: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: '📊', end: true },
  { to: '/register', label: 'Register', icon: '🛒' },
  { to: '/sales', label: 'Sales', icon: '💰' },
  { to: '/inventory', label: 'Inventory', icon: '📦' },
  { to: '/products', label: 'Products', icon: '☕' },
  { to: '/analytics', label: 'Analytics', icon: '📈' },
  { to: '/profit', label: 'Profit', icon: '💵' },
  { to: '/reports', label: 'Reports', icon: '📑' },
  { to: '/management', label: 'Management', icon: '⚙️' },
];

export default function Sidebar({ children }: { children: ReactNode }) {
  return (
    <aside className="flex h-full w-60 flex-col border-r border-stone-200 bg-white">
      <div className="flex items-center gap-2.5 border-b border-stone-100 px-5 py-5">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-xl text-white">☕</span>
        <div>
          <p className="text-base font-bold leading-tight text-stone-900">KapeFlow</p>
          <p className="text-xs text-stone-500">Admin Console</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? 'bg-brand-50 text-brand-700' : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
              }`
            }
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-stone-100 p-4">{children}</div>
    </aside>
  );
}
