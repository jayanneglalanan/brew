import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { SessionUser } from 'mock-data';
import { loadAuthed, loadUser, saveAuthed, saveUser, clearUser, loadProfileName, saveProfileName, loadAvatar, saveAvatar, loadAvatarColor, saveAvatarColor } from './auth';

interface AuthCtx {
  ready: boolean;
  authed: boolean;
  user: SessionUser | null;
  login: (user: SessionUser) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { name: string; avatar: string; avatarColor: string }) => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  ready: false,
  authed: false,
  user: null,
  login: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    let on = true;
    Promise.all([loadAuthed(), loadUser()]).then(([a, u]) => {
      if (on) {
        setAuthed(a);
        setUser(u);
        setReady(true);
      }
    });
    return () => {
      on = false;
    };
  }, []);

  const login = useCallback(async (u: SessionUser) => {
    const [savedName, savedAvatar, savedAvatarColor] = await Promise.all([
      loadProfileName(u.id),
      loadAvatar(u.id),
      loadAvatarColor(u.id),
    ]);
    const merged = {
      ...u,
      name: savedName ?? u.name,
      avatar: savedAvatar ?? u.avatar,
      avatarColor: savedAvatarColor ?? u.avatarColor,
    };
    await Promise.all([saveAuthed(true), saveUser(merged)]);
    setUser(merged);
    setAuthed(true);
  }, []);

  const logout = useCallback(async () => {
    await Promise.all([saveAuthed(false), clearUser()]);
    setUser(null);
    setAuthed(false);
  }, []);

  const updateProfile = useCallback(async (data: { name: string; avatar: string; avatarColor: string }) => {
    setUser((current) => {
      if (!current) return current;
      const next = {
        ...current,
        name: data.name.trim() || current.name,
        avatar: data.avatar || current.avatar,
        avatarColor: data.avatarColor || current.avatarColor,
      };
      saveUser(next);
      saveProfileName(current.id, next.name);
      if (data.avatar) saveAvatar(current.id, data.avatar);
      if (data.avatarColor) saveAvatarColor(current.id, data.avatarColor);
      return next;
    });
  }, []);

  return <Ctx.Provider value={{ ready, authed, user, login, logout, updateProfile }}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  return useContext(Ctx);
}