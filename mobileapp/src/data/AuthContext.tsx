import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { SessionUser } from 'mock-data';
import { loadAuthed, loadUser, saveAuthed, saveUser, clearUser } from './auth';

interface AuthCtx {
  ready: boolean;
  authed: boolean;
  user: SessionUser | null;
  login: (user: SessionUser) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (name: string) => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  ready: false,
  authed: false,
  user: null,
  login: async () => {},
  logout: async () => {},
  updateUser: async () => {},
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
    await Promise.all([saveAuthed(true), saveUser(u)]);
    setUser(u);
    setAuthed(true);
  }, []);

  const logout = useCallback(async () => {
    await Promise.all([saveAuthed(false), clearUser()]);
    setUser(null);
    setAuthed(false);
  }, []);

  const updateUser = useCallback(async (name: string) => {
    setUser((current) => {
      if (!current) return current;
      const next = { ...current, name: name.trim() || current.name };
      saveUser(next);
      return next;
    });
  }, []);

  return <Ctx.Provider value={{ ready, authed, user, login, logout, updateUser }}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  return useContext(Ctx);
}