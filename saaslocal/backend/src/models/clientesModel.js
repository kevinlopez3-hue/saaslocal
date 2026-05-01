// models/clientesModel.js
const db = require('../config/db');

const findAll = async (tiendaId, { search } = {}) => {
  let sql = `SELECT * FROM clientes WHERE tienda_id = $1 AND activo = TRUE`;
  const params = [tiendaId];
  if (search) {
    sql += ` AND (nombre ILIKE $2 OR telefono ILIKE $2 OR documento ILIKE $2)`;
    params.push(`%${search}%`);
  }
  sql += ' ORDER BY nombre';
  const { rows } = await db.query(sql, params);
  return rows;
};

const findById = async (tiendaId, id) => {
  const { rows } = await db.query(
    'SELECT * FROM clientes WHERE tienda_id=$1 AND id=$2',
    [tiendaId, id]
  );
  return rows[0] || null;
};

const create = async (tiendaId, data) => {
  const { rows } = await db.query(
    `INSERT INTO clientes (tienda_id, nombre, telefono, email, direccion, documento, limite_credito, notas)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [tiendaId, data.nombre, data.telefono || null, data.email || null,
     data.direccion || null, data.documento || null,
     data.limite_credito || 0, data.notas || null]
  );
  return rows[0];
};

const update = async (tiendaId, id, data) => {
  const { rows } = await db.query(
    `UPDATE clientes SET nombre=$3, telefono=$4, email=$5, direccion=$6,
     documento=$7, limite_credito=$8, notas=$9
     WHERE tienda_id=$1 AND id=$2 RETURNING *`,
    [tiendaId, id, data.nombre, data.telefono || null, data.email || null,
     data.direccion || null, data.documento || null,
     data.limite_credito || 0, data.notas || null]
  );
  return rows[0] || null;
};

const abonarDeuda = async (tiendaId, clienteId, monto) => {
  const { rows } = await db.query(
    `UPDATE clientes SET saldo_deuda = GREATEST(0, saldo_deuda - $3)
     WHERE tienda_id=$1 AND id=$2 RETURNING saldo_deuda`,
    [tiendaId, clienteId, monto]
  );
  return rows[0] || null;
};

const getHistorialDeudas = async (tiendaId, clienteId) => {
  const { rows } = await db.query(
    `SELECT v.id, v.total, v.monto_pagado, v.estado, v.created_at,
            (v.total - v.monto_pagado) AS pendiente
     FROM ventas v
     WHERE v.tienda_id=$1 AND v.cliente_id=$2 AND v.estado IN ('credito','parcial')
     ORDER BY v.created_at DESC`,
    [tiendaId, clienteId]
  );
  return rows;
};

module.exports = { findAll, findById, create, update, abonarDeuda, getHistorialDeudas };
