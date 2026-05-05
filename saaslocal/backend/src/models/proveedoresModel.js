// backend/src/models/proveedoresModel.js
const db = require("../config/db");

const findAll = async (tiendaId, options = {}) => {
  let query =
    "SELECT * FROM proveedores WHERE tienda_id = $1 AND activo = true";
  const params = [tiendaId];
  if (options.search) {
    query += " AND (nombre ILIKE $2 OR nit ILIKE $2)";
    params.push(`%${options.search}%`);
  }
  query += " ORDER BY nombre ASC";
  const { rows } = await db.query(query, params);
  return rows;
};

const findById = async (tiendaId, id) => {
  const { rows } = await db.query(
    "SELECT * FROM proveedores WHERE tienda_id = $1 AND id = $2 AND activo = true",
    [tiendaId, id],
  );
  return rows[0];
};

const getHistorialCompras = async (tiendaId, proveedorId) => {
  return []; // Placeholder
};

const getProductosAsociados = async (tiendaId, proveedorId) => {
  return []; // Placeholder
};

const create = async (tiendaId, data) => {
  const { nombre, nit, telefono, email, direccion } = data;
  const { rows } = await db.query(
    "INSERT INTO proveedores (tienda_id, nombre, nit, telefono, email, direccion) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
    [tiendaId, nombre, nit, telefono, email, direccion],
  );
  return rows[0];
};

const update = async (tiendaId, id, data) => {
  const { nombre, nit, telefono, email, direccion } = data;
  const { rows } = await db.query(
    "UPDATE proveedores SET nombre = $1, nit = $2, telefono = $3, email = $4, direccion = $5, updated_at = NOW() WHERE tienda_id = $6 AND id = $7 RETURNING *",
    [nombre, nit, telefono, email, direccion, tiendaId, id],
  );
  return rows[0];
};

const remove = async (tiendaId, id) => {
  const { rowCount } = await db.query(
    "UPDATE proveedores SET activo = false WHERE tienda_id = $1 AND id = $2",
    [tiendaId, id],
  );
  return rowCount > 0;
};

module.exports = {
  findAll,
  findById,
  getHistorialCompras,
  getProductosAsociados,
  create,
  update,
  remove,
};
