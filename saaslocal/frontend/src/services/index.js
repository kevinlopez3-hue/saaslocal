// services/index.js - Todas las llamadas al backend
import api from '../api/axios';

// ── Dashboard ────────────────────────────────────────────────
export const dashboardService = {
  getStats: () => api.get('/dashboard').then(r => r.data),
};

// ── Productos ─────────────────────────────────────────────────
export const productosService = {
  list:   (params) => api.get('/productos', { params }).then(r => r.data.productos),
  getOne: (id)     => api.get(`/productos/${id}`).then(r => r.data.producto),
  create: (data)   => api.post('/productos', data).then(r => r.data),
  update: (id, data) => api.put(`/productos/${id}`, data).then(r => r.data),
  delete: (id)     => api.delete(`/productos/${id}`).then(r => r.data),
};

// ── Ventas ────────────────────────────────────────────────────
export const ventasService = {
  list:   (params) => api.get('/ventas', { params }).then(r => r.data.ventas),
  getOne: (id)     => api.get(`/ventas/${id}`).then(r => r.data.venta),
  create: (data)   => api.post('/ventas', data).then(r => r.data),
};

// ── Clientes ──────────────────────────────────────────────────
export const clientesService = {
  list:   (params) => api.get('/clientes', { params }).then(r => r.data.clientes),
  getOne: (id)     => api.get(`/clientes/${id}`).then(r => r.data.cliente),
  create: (data)   => api.post('/clientes', data).then(r => r.data),
  update: (id, d)  => api.put(`/clientes/${id}`, d).then(r => r.data),
  abonar: (id, monto) => api.post(`/clientes/${id}/abonar`, { monto }).then(r => r.data),
};

// ── Proveedores ───────────────────────────────────────────────
export const proveedoresService = {
  list:   (params) => api.get('/proveedores', { params }).then(r => r.data.proveedores),
  getOne: (id)     => api.get(`/proveedores/${id}`).then(r => r.data.proveedor),
  create: (data)   => api.post('/proveedores', data).then(r => r.data),
  update: (id, d)  => api.put(`/proveedores/${id}`, d).then(r => r.data),
  delete: (id)     => api.delete(`/proveedores/${id}`).then(r => r.data),
};

// ── Catálogos ─────────────────────────────────────────────────
export const catalogosService = {
  categorias:   () => api.get('/categorias').then(r => r.data.categorias),
  metodosPago:  () => api.get('/metodos-pago').then(r => r.data.metodos),
};
