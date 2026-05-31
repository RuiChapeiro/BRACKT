import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { authApi, type ApiUser } from '../api/endpoints';
import { clearToken, getToken, setToken } from '../config';

interface AuthContextValue {
  user: ApiUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Holds the authenticated user + JWT. On mount, if a token is already stored it
 * is validated against /api/auth/me (stale/expired tokens are cleared). The token
 * lives in localStorage so the offline sync client and SignalR can read it.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  const login: AuthContextValue['login'] = async (email, password) => {
    const res = await authApi.login({ email, password });
    setToken(res.accessToken);
    setUser(res.user);
  };

  const register: AuthContextValue['register'] = async (email, password, displayName) => {
    const res = await authApi.register({ email, password, displayName });
    setToken(res.accessToken);
    setUser(res.user);
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>.');
  return ctx;
}
