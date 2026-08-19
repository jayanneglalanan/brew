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
  for (const account of DEMO_ACCOUNTS) {
    const storedEmail = loadEmail(account.user.id);
    const storedPassword = loadPassword(account.user.id);
    const effectiveEmail = storedEmail ?? account.email;
    const effectivePassword = storedPassword ?? account.password;
    if (email.trim().toLowerCase() === effectiveEmail.toLowerCase() && password === effectivePassword) {
      const name = loadProfileName(account.user.id);
      const avatar = loadAvatar(account.user.id);
      const avatarColor = loadAvatarColor(account.user.id);
      return {
        ...account.user,
        name: name ?? account.user.name,
        avatar: avatar ?? undefined,
        avatarColor: avatarColor ?? undefined,
      };
    }
  }
  return null;
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

export function loadProfileName(userId: string): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('kapeflow.profile.' + userId);
}

export function saveProfileName(userId: string, name: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('kapeflow.profile.' + userId, name);
}

export function loadEmail(userId: string): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('kapeflow.email.' + userId);
}

export function saveEmail(userId: string, email: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('kapeflow.email.' + userId, email);
}

export function loadPassword(userId: string): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('kapeflow.password.' + userId);
}

export function savePassword(userId: string, password: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('kapeflow.password.' + userId, password);
}

export function loadAvatar(userId: string): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('kapeflow.avatar.' + userId);
}

export function saveAvatar(userId: string, avatar: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('kapeflow.avatar.' + userId, avatar);
}

export function loadAvatarColor(userId: string): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('kapeflow.avatarColor.' + userId);
}

export function saveAvatarColor(userId: string, color: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('kapeflow.avatarColor.' + userId, color);
}

export type { StaffRole };