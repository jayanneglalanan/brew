import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import type { SessionUser } from 'mock-data';
import { isAuthed, loadUser, persistLogin, persistLogout, loadProfileName, saveProfileName, loadAvatar, saveAvatar, loadAvatarColor, saveAvatarColor } from './auth';

interface AuthCtx {
  authed: boolean;
  user: SessionUser | null;
  login: (user: SessionUser) => void;
  logout: () => void;
  updateProfile: (data: { name: string; avatar: string; avatarColor: string }) => void;
}

const Ctx = createContext<AuthCtx>({ authed: false, user: null, login: () => {}, logout: () => {}, updateProfile: () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(() => isAuthed());
  const [user, setUser] = useState<SessionUser | null>(() => loadUser());

  const login = useCallback((u: SessionUser) => {
    const savedName = loadProfileName(u.id);
    const savedAvatar = loadAvatar(u.id);
    const savedAvatarColor = loadAvatarColor(u.id);
    const merged = {
      ...u,
      name: savedName ?? u.name,
      avatar: savedAvatar ?? u.avatar,
      avatarColor: savedAvatarColor ?? u.avatarColor,
    };
    persistLogin(merged);
    setUser(merged);
    setAuthed(true);
  }, []);

  const logout = useCallback(() => {
    persistLogout();
    setUser(null);
    setAuthed(false);
  }, []);

  const updateProfile = useCallback((data: { name: string; avatar: string; avatarColor: string }) => {
    setUser((current) => {
      if (!current) return current;
      const next = {
        ...current,
        name: data.name.trim() || current.name,
        avatar: data.avatar || current.avatar,
        avatarColor: data.avatarColor || current.avatarColor,
      };
      persistLogin(next);
      saveProfileName(current.id, next.name);
      if (data.avatar) saveAvatar(current.id, data.avatar);
      if (data.avatarColor) saveAvatarColor(current.id, data.avatarColor);
      return next;
    });
  }, []);

  return <Ctx.Provider value={{ authed, user, login, logout, updateProfile }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);