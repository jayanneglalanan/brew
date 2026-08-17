import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';
import {
  CircleDollarSign,
  CupSoda,
  FileChartColumn,
  HandCoins,
  LayoutDashboard,
  Package,
  Settings,
  TrendingUp,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { NavKey } from 'mock-data';
import { navKeysForRole } from 'mock-data';
import { useAuth } from '@/app/AuthContext';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  key: NavKey;
  end?: boolean;
}

const NAV: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, key: 'dashboard', end: true },
  { to: '/sales', label: 'Sales', icon: HandCoins, key: 'sales' },
  { to: '/inventory', label: 'Inventory', icon: Package, key: 'inventory' },
  { to: '/products', label: 'Products', icon: CupSoda, key: 'products' },
  { to: '/analytics', label: 'Analytics', icon: TrendingUp, key: 'analytics' },
  { to: '/profit', label: 'Profit', icon: CircleDollarSign, key: 'profit' },
  { to: '/reports', label: 'Reports', icon: FileChartColumn, key: 'reports' },
  { to: '/management', label: 'Management', icon: Settings, key: 'management' },
];

export default function Sidebar({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const allowed = new Set(navKeysForRole(user?.role ?? 'owner'));
  const items = NAV.filter((item) => allowed.has(item.key));

  return (
    <aside className="flex h-full w-60 flex-col border-r border-stone-200 bg-white">
      <div className="flex items-center gap-2.5 border-b border-stone-100 px-5 py-5">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-xl text-white">☕</span>
        <div>
          <p className="text-base font-bold leading-tight text-stone-900">KapeFlow</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => (
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
            <item.icon size={18} strokeWidth={1.8} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-stone-100 p-4">{children}</div>
    </aside>
  );
}