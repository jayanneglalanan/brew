import type { SessionUser, StaffRole } from 'mock-data';

const AUTH_KEY = 'kapeflow.authed';
const USER_KEY = 'kapeflow.user';

export const DEMO_ACCOUNTS: Array<{ email: string; password: string; user: SessionUser }> = [
  { email: 'owner@kapeflow.ph', password: 'demo123', user: { id: 's1', name: 'Maria', role: 'owner' } },
  { email: 'manager@kapeflow.ph', password: 'demo123', user: { id: 's2', name: 'John', role: 'manager' } },
];

export function isAuthed(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(AUTH_KEY) === '1';
}

export function loadUser(): SessionUser | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function resolveUser(email: string, password: string): SessionUser | null {
  const account = DEMO_ACCOUNTS.find(
    (a) => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password,
  );
  return account ? account.user : null;
}

export function persistLogin(user: SessionUser): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(AUTH_KEY, '1');
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function persistLogout(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(AUTH_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export type { StaffRole };