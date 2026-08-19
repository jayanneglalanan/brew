import { Link, NavLink } from 'react-router-dom';
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
import { navKeysForRole, roleLabel } from 'mock-data';
import { useAuth } from '@/app/AuthContext';
import { useShopName } from '@/app/ShopNameContext';

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
  const { shopName } = useShopName();
  const allowed = new Set(navKeysForRole(user?.role ?? 'owner'));
  const items = NAV.filter((item) => allowed.has(item.key));

  return (
    <aside className="flex h-full w-60 flex-col border-r border-stone-200 bg-white">
      <div className="flex items-center gap-2.5 border-b border-stone-100 px-5 py-5">
        <span className="grid h-10 w-10 place-items-center rounded-xl text-lg font-bold text-white" style={{ backgroundColor: '#8B6F5A' }}>
          ☕
        </span>
        <div className="min-w-0">
          <p className="truncate text-base font-bold leading-tight text-stone-900">{shopName}</p>
        </div>
      </div>
      <Link
        to="/settings"
        className="group flex items-center gap-2.5 border-b border-stone-100 px-5 py-3 transition-colors hover:bg-stone-50"
      >
        <span
          className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: user?.avatarColor ?? '#8B6F5A' }}
        >
          {user?.avatar ? (
            <img src={user.avatar} alt="avatar" className="h-8 w-8 rounded-full object-cover" />
          ) : (
            (user?.name.charAt(0) ?? '?')
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-stone-800">{user?.name ?? 'Guest'}</p>
          <p className="text-xs text-stone-500">{user ? roleLabel(user.role) : '—'}</p>
        </div>
        <span className="text-stone-300 transition-colors group-hover:text-stone-500">›</span>
      </Link>
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