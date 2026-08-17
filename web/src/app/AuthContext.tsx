import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import type { SessionUser } from 'mock-data';
import { isAuthed, loadUser, persistLogin, persistLogout } from './auth';

interface AuthCtx {
  authed: boolean;
  user: SessionUser | null;
  login: (user: SessionUser) => void;
  logout: () => void;
  updateUser: (name: string) => void;
}

const Ctx = createContext<AuthCtx>({ authed: false, user: null, login: () => {}, logout: () => {}, updateUser: () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(() => isAuthed());
  const [user, setUser] = useState<SessionUser | null>(() => loadUser());

  const login = useCallback((u: SessionUser) => {
    persistLogin(u);
    setUser(u);
    setAuthed(true);
  }, []);

  const logout = useCallback(() => {
    persistLogout();
    setUser(null);
    setAuthed(false);
  }, []);

  const updateUser = useCallback((name: string) => {
    setUser((current) => {
      if (!current) return current;
      const next = { ...current, name: name.trim() || current.name };
      persistLogin(next);
      return next;
    });
  }, []);

  return <Ctx.Provider value={{ authed, user, login, logout, updateUser }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);