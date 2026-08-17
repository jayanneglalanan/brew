import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import type { SessionUser } from 'mock-data';
import { isAuthed, loadUser, persistLogin, persistLogout } from './auth';

interface AuthCtx {
  authed: boolean;
  user: SessionUser | null;
  login: (user: SessionUser) => void;
  logout: () => void;
}

const Ctx = createContext<AuthCtx>({ authed: false, user: null, login: () => {}, logout: () => {} });

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

  return <Ctx.Provider value={{ authed, user, login, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);