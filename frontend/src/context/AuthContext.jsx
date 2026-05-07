import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('mishkat_token');
    if (!token) { setLoading(false); return; }
    authAPI.me()
      .then(({ data }) => setUser(data.data))
      .catch(() => { localStorage.removeItem('mishkat_token'); })
      .finally(() => setLoading(false));
  }, []);

  const login = async (phone, password) => {
    const { data } = await authAPI.login({ phone, password });
    localStorage.setItem('mishkat_token', data.data.token);
    setUser(data.data.user);
    return data.data.user;
  };

  const logout = () => {
    localStorage.removeItem('mishkat_token');
    localStorage.removeItem('mishkat_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
