// context/AuthContext.jsx
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario]   = useState(() => {
    try { return JSON.parse(localStorage.getItem('saaslocal_user')); }
    catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('saaslocal_token', data.token);
      localStorage.setItem('saaslocal_user', JSON.stringify(data.usuario));
      setUsuario(data.usuario);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.response?.data?.error || 'Error al iniciar sesión' };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('saaslocal_token');
    localStorage.removeItem('saaslocal_user');
    setUsuario(null);
  }, []);

  const isAdmin = usuario?.rol === 'admin';

  return (
    <AuthContext.Provider value={{ usuario, login, logout, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
