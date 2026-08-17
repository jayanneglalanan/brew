import type { StaffRole } from '../types/staff';

export type NavKey =
  | 'dashboard'
  | 'register'
  | 'sales'
  | 'inventory'
  | 'products'
  | 'analytics'
  | 'profit'
  | 'reports'
  | 'management';

export const ALL_NAV_KEYS: NavKey[] = [
  'dashboard',
  'register',
  'sales',
  'inventory',
  'products',
  'analytics',
  'profit',
  'reports',
  'management',
];

const NAV_BY_ROLE: Record<StaffRole, NavKey[]> = {
  owner: ALL_NAV_KEYS,
  manager: ['inventory', 'products'],
  cashier: ['dashboard', 'register', 'sales', 'inventory'],
};

const PATH_BY_KEY: Record<NavKey, string> = {
  dashboard: '/',
  register: '/register',
  sales: '/sales',
  inventory: '/inventory',
  products: '/products',
  analytics: '/analytics',
  profit: '/profit',
  reports: '/reports',
  management: '/management',
};

export function navKeysForRole(role: StaffRole): NavKey[] {
  return NAV_BY_ROLE[role] ?? [];
}

export function homePathForRole(role: StaffRole): string {
  const keys = navKeysForRole(role);
  return keys.length > 0 ? PATH_BY_KEY[keys[0]] : '/';
}

export function canAccess(role: StaffRole, key: NavKey): boolean {
  return navKeysForRole(role).includes(key);
}

export function roleLabel(role: StaffRole): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}