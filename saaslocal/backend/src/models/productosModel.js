// models/productosModel.js
const db = require('../config/db');

const findAll = async (tiendaId, { search, categoriaId, soloDisponibles } = {}) => {
  let sql = `
    SELECT p.*, c.nombre AS categoria_nombre,
           COALESCE(i.cantidad, 0) AS stock,
           COALESCE(i.cantidad_minima, 0) AS stock_minimo
    FROM productos p
    LEFT JOIN categorias c ON c.id = p.categoria_id
    LEFT JOIN inventario i ON i.producto_id = p.id AND i.tienda_id = p.tienda_id
    WHERE p.tienda_id = $1`;
  const params = [tiendaId];
  let idx = 2;

  if (search) {
    sql += ` AND (p.nombre ILIKE $${idx} OR p.codigo_barras = $${idx+1})`;
    params.push(`%${search}%`, search);
    idx += 2;
  }
  if (categoriaId) {
    sql += ` AND p.categoria_id = $${idx++}`;
    params.push(categoriaId);
  }
  if (soloDisponibles) {
    sql += ` AND p.disponible = TRUE AND COALESCE(i.cantidad, 0) > 0`;
  }
  sql += ' ORDER BY p.nombre';
  const { rows } = await db.query(sql, params);
  return rows;
};

const findById = async (tiendaId, id) => {
  const { rows } = await db.query(
    `SELECT p.*, c.nombre AS categoria_nombre,
            COALESCE(i.cantidad, 0) AS stock,
            COALESCE(i.cantidad_minima, 0) AS stock_minimo
     FROM productos p
     LEFT JOIN categorias c ON c.id = p.categoria_id
     LEFT JOIN inventario i ON i.producto_id = p.id AND i.tienda_id = p.tienda_id
     WHERE p.tienda_id = $1 AND p.id = $2`,
    [tiendaId, id]
  );
  return rows[0] || null;
};

const create = async (tiendaId, data) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO productos (tienda_id, categoria_id, nombre, descripcion, codigo_barras, precio_costo, precio_venta, unidad, disponible)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [tiendaId, data.categoria_id || null, data.nombre, data.descripcion || null,
       data.codigo_barras || null, data.precio_costo || 0, data.precio_venta,
       data.unidad || 'und', data.disponible !== false]
    );
    const producto = rows[0];
    // Crear registro en inventario con stock inicial
    await client.query(
      `INSERT INTO inventario (tienda_id, producto_id, cantidad, cantidad_minima)
       VALUES ($1,$2,$3,$4)`,
      [tiendaId, producto.id, data.stock_inicial || 0, data.stock_minimo || 0]
    );
    await client.query('COMMIT');
    return producto;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const update = async (tiendaId, id, data) => {
  const { rows } = await db.query(
    `UPDATE productos
     SET categoria_id=$3, nombre=$4, descripcion=$5, codigo_barras=$6,
         precio_costo=$7, precio_venta=$8, unidad=$9, disponible=$10
     WHERE tienda_id=$1 AND id=$2 RETURNING *`,
    [tiendaId, id, data.categoria_id || null, data.nombre, data.descripcion || null,
     data.codigo_barras || null, data.precio_costo || 0, data.precio_venta,
     data.unidad || 'und', data.disponible !== false]
  );
  return rows[0] || null;
};

const remove = async (tiendaId, id) => {
  const { rowCount } = await db.query(
    'UPDATE productos SET disponible = FALSE WHERE tienda_id=$1 AND id=$2',
    [tiendaId, id]
  );
  return rowCount > 0;
};

const updateStock = async (client, tiendaId, productoId, delta) => {
  const { rows } = await client.query(
    `UPDATE inventario SET cantidad = cantidad + $3, updated_at = NOW()
     WHERE tienda_id=$1 AND producto_id=$2 RETURNING cantidad`,
    [tiendaId, productoId, delta]
  );
  return rows[0]?.cantidad;
};

const getStock = async (tiendaId, productoId) => {
  const { rows } = await db.query(
    'SELECT cantidad FROM inventario WHERE tienda_id=$1 AND producto_id=$2',
    [tiendaId, productoId]
  );
  return rows[0]?.cantidad ?? 0;
};

module.exports = { findAll, findById, create, update, remove, updateStock, getStock };
