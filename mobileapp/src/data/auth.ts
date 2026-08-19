import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SessionUser } from 'mock-data';

const AUTH_KEY_WEB = 'kapeflow.authed';
const USER_KEY_WEB = 'kapeflow.user';
const AUTH_KEY_NATIVE = 'kapeflow.auth.v1';
const USER_KEY_NATIVE = 'kapeflow.user.v1';

export const DEMO_ACCOUNTS: Array<{ email: string; password: string; user: SessionUser }> = [
  { email: 'owner@kapeflow.ph', password: 'demo123', user: { id: 's1', name: 'Maria', role: 'owner' } },
  { email: 'manager@kapeflow.ph', password: 'demo123', user: { id: 's2', name: 'John', role: 'manager' } },
];

const authKey = () => (Platform.OS === 'web' ? AUTH_KEY_WEB : AUTH_KEY_NATIVE);
const userKey = () => (Platform.OS === 'web' ? USER_KEY_WEB : USER_KEY_NATIVE);

function webGet(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(key);
}

function webSet(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, value);
}

function webRemove(key: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(key);
}

async function storeGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web') return webGet(key);
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

async function storeSet(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') return webSet(key, value);
  try {
    await AsyncStorage.setItem(key, value);
  } catch {
    // Ignore storage errors.
  }
}

async function storeRemove(key: string): Promise<void> {
  if (Platform.OS === 'web') return webRemove(key);
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // Ignore storage errors.
  }
}

export async function loadAuthed(): Promise<boolean> {
  return (await storeGet(authKey())) === '1';
}

export async function saveAuthed(on: boolean): Promise<void> {
  if (on) await storeSet(authKey(), '1');
  else await storeRemove(authKey());
}

export async function loadUser(): Promise<SessionUser | null> {
  const raw = await storeGet(userKey());
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export async function saveUser(user: SessionUser): Promise<void> {
  await storeSet(userKey(), JSON.stringify(user));
}

export async function clearUser(): Promise<void> {
  await storeRemove(userKey());
}

export async function loadProfileName(userId: string): Promise<string | null> {
  return storeGet('kapeflow.profile.' + userId);
}

export async function saveProfileName(userId: string, name: string): Promise<void> {
  await storeSet('kapeflow.profile.' + userId, name);
}

export async function loadEmail(userId: string): Promise<string | null> {
  return storeGet('kapeflow.email.' + userId);
}

export async function saveEmail(userId: string, email: string): Promise<void> {
  await storeSet('kapeflow.email.' + userId, email);
}

export async function loadPassword(userId: string): Promise<string | null> {
  return storeGet('kapeflow.password.' + userId);
}

export async function savePassword(userId: string, password: string): Promise<void> {
  await storeSet('kapeflow.password.' + userId, password);
}

export async function loadAvatar(userId: string): Promise<string | null> {
  return storeGet('kapeflow.avatar.' + userId);
}

export async function saveAvatar(userId: string, avatar: string): Promise<void> {
  await storeSet('kapeflow.avatar.' + userId, avatar);
}

export async function loadAvatarColor(userId: string): Promise<string | null> {
  return storeGet('kapeflow.avatarColor.' + userId);
}

export async function saveAvatarColor(userId: string, color: string): Promise<void> {
  await storeSet('kapeflow.avatarColor.' + userId, color);
}

export async function resolveUser(email: string, password: string): Promise<SessionUser | null> {
  for (const account of DEMO_ACCOUNTS) {
    const storedEmail = await loadEmail(account.user.id);
    const storedPassword = await loadPassword(account.user.id);
    const effectiveEmail = storedEmail ?? account.email;
    const effectivePassword = storedPassword ?? account.password;
    if (email.trim().toLowerCase() === effectiveEmail.toLowerCase() && password === effectivePassword) {
      const [name, avatar, avatarColor] = await Promise.all([
        loadProfileName(account.user.id),
        loadAvatar(account.user.id),
        loadAvatarColor(account.user.id),
      ]);
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