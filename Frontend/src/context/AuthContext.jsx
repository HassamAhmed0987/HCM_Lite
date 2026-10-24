import React, { createContext, useContext, useState, useCallback } from 'react';
import * as authApi from '../api/auth';
import { TOKEN_KEY, USER_KEY } from '../api/client';

export const ROLES = { ADMIN: 'ADMIN', HR: 'HR', EMPLOYEE: 'EMPLOYEE' };

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const readStored = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const stored = readStored();
    return token && stored ? stored : null; // { role, user }
  });

  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password);
    const next = { role: String(data.role || data.user?.role || '').toUpperCase(), user: data.user };
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(next));
    setSession(next);
    return next;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setSession(null);
  }, []);

  const value = {
    isAuthenticated: !!session,
    role: session?.role || null,
    user: session?.user || null,
    login,
    logout,
    hasRole: (...roles) => !!session && roles.includes(session.role),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
