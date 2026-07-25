import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../api/client.js';
import { registerPush } from '../lib/push.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('rh_user')) || null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('rh_token'));
  const [loading, setLoading] = useState(Boolean(token));

  // Re-validate the stored session on boot
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    api
      .get('/auth/me')
      .then(({ data }) => {
        if (!cancelled) {
          setUser(data.user);
          localStorage.setItem('rh_user', JSON.stringify(data.user));
        }
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Register this browser for push whenever we have a session (login or boot).
  useEffect(() => {
    if (token) registerPush().catch(() => {});
  }, [token]);

  const applySession = useCallback((data) => {
    localStorage.setItem('rh_token', data.token);
    localStorage.setItem('rh_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  }, []);

  const login = useCallback(
    async (email, password) => {
      const { data } = await api.post('/auth/login', { email, password });
      applySession(data);
      return data.user;
    },
    [applySession]
  );

  const register = useCallback(
    async (payload) => {
      const { data } = await api.post('/auth/register', payload);
      applySession(data);
      return data.user;
    },
    [applySession]
  );

  const logout = useCallback(() => {
    localStorage.removeItem('rh_token');
    localStorage.removeItem('rh_user');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
