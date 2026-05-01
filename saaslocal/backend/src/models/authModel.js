// models/authModel.js
const db = require('../config/db');

const findByEmail = async (tiendaId, email) => {
  const { rows } = await db.query(
    `SELECT u.*, r.tipo AS rol
     FROM usuarios u
     JOIN roles r ON r.id = u.rol_id
     WHERE u.tienda_id = $1 AND u.email = $2 AND u.activo = TRUE`,
    [tiendaId, email]
  );
  return rows[0] || null;
};

// Login global: buscar usuario por email entre todas las tiendas
const findByEmailGlobal = async (email) => {
  const { rows } = await db.query(
    `SELECT u.*, r.tipo AS rol, t.nombre AS tienda_nombre, t.activa AS tienda_activa
     FROM usuarios u
     JOIN roles r ON r.id = u.rol_id
     JOIN tiendas t ON t.id = u.tienda_id
     WHERE u.email = $1 AND u.activo = TRUE
     LIMIT 1`,
    [email]
  );
  return rows[0] || null;
};

const updateLastLogin = async (userId) => {
  await db.query(
    'UPDATE usuarios SET ultimo_login = NOW() WHERE id = $1',
    [userId]
  );
};

const findByIdWithTienda = async (userId, tiendaId) => {
  const { rows } = await db.query(
    `SELECT u.id, u.nombre, u.email, r.tipo AS rol, t.nombre AS tienda_nombre
     FROM usuarios u
     JOIN roles r ON r.id = u.rol_id
     JOIN tiendas t ON t.id = u.tienda_id
     WHERE u.id = $1 AND u.tienda_id = $2`,
    [userId, tiendaId]
  );
  return rows[0] || null;
};

module.exports = { findByEmail, findByEmailGlobal, updateLastLogin, findByIdWithTienda };
