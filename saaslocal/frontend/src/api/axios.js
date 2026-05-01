// api/axios.js - Instancia de Axios con interceptores
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Adjuntar token en cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('saaslocal_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Manejar respuestas y errores globalmente
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('saaslocal_token');
      localStorage.removeItem('saaslocal_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
