// models/ventasModel.js
const db = require('../config/db');

const findAll = async (tiendaId, { desde, hasta, estado, clienteId, limit = 50, offset = 0 } = {}) => {
  let sql = `
    SELECT v.*, u.nombre AS cajero, c.nombre AS cliente_nombre, m.nombre AS metodo_pago,
           COUNT(dv.id) AS num_items
    FROM ventas v
    JOIN usuarios u ON u.id = v.usuario_id
    LEFT JOIN clientes c ON c.id = v.cliente_id
    LEFT JOIN metodos_pago m ON m.id = v.metodo_pago_id
    LEFT JOIN detalle_ventas dv ON dv.venta_id = v.id
    WHERE v.tienda_id = $1`;
  const params = [tiendaId];
  let idx = 2;

  if (desde)    { sql += ` AND v.created_at >= $${idx++}`; params.push(desde); }
  if (hasta)    { sql += ` AND v.created_at <= $${idx++}`; params.push(hasta); }
  if (estado)   { sql += ` AND v.estado = $${idx++}`;      params.push(estado); }
  if (clienteId){ sql += ` AND v.cliente_id = $${idx++}`;  params.push(clienteId); }

  sql += ` GROUP BY v.id, u.nombre, c.nombre, m.nombre ORDER BY v.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
  params.push(limit, offset);
  const { rows } = await db.query(sql, params);
  return rows;
};

const findById = async (tiendaId, id) => {
  const { rows } = await db.query(
    `SELECT v.*, u.nombre AS cajero, c.nombre AS cliente_nombre, m.nombre AS metodo_pago
     FROM ventas v
     JOIN usuarios u ON u.id = v.usuario_id
     LEFT JOIN clientes c ON c.id = v.cliente_id
     LEFT JOIN metodos_pago m ON m.id = v.metodo_pago_id
     WHERE v.tienda_id = $1 AND v.id = $2`,
    [tiendaId, id]
  );
  return rows[0] || null;
};

const findDetalle = async (ventaId) => {
  const { rows } = await db.query(
    `SELECT dv.*, p.nombre AS producto_nombre, p.codigo_barras
     FROM detalle_ventas dv
     JOIN productos p ON p.id = dv.producto_id
     WHERE dv.venta_id = $1`,
    [ventaId]
  );
  return rows;
};

/**
 * Crea venta completa en transacción atómica:
 * 1. Valida stock de cada producto
 * 2. Inserta venta
 * 3. Inserta detalle_ventas
 * 4. Descuenta inventario + registra movimiento
 * 5. Si es crédito, actualiza saldo_deuda del cliente
 */
const create = async (tiendaId, usuarioId, data) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // 1. Validar stock para cada item
    for (const item of data.items) {
      const { rows } = await client.query(
        'SELECT cantidad FROM inventario WHERE tienda_id=$1 AND producto_id=$2 FOR UPDATE',
        [tiendaId, item.producto_id]
      );
      const stockActual = parseInt(rows[0]?.cantidad ?? 0, 10);
      if (stockActual < parseInt(item.cantidad, 10)) {
        const { rows: p } = await client.query('SELECT nombre FROM productos WHERE id=$1', [item.producto_id]);
        throw Object.assign(new Error(`Stock insuficiente para "${p[0]?.nombre}". Disponible: ${stockActual}`), { status: 400 });
      }
    }

    // 2. Calcular totales
    let subtotal = 0;
    for (const item of data.items) {
      subtotal += parseFloat(item.precio_venta) * parseFloat(item.cantidad) - parseFloat(item.descuento || 0);
    }
    const descuento = parseFloat(data.descuento || 0);
    const impuesto  = parseFloat(data.impuesto  || 0);
    const total     = subtotal - descuento + impuesto;
    const montoPagado = parseFloat(data.monto_pagado || 0);
    const cambio = montoPagado > total ? montoPagado - total : 0;
    const estado = data.estado || (montoPagado >= total ? 'completada' : 'credito');

    // 3. Insertar venta
    const { rows: ventaRows } = await client.query(
      `INSERT INTO ventas (tienda_id, usuario_id, cliente_id, metodo_pago_id, subtotal, descuento, impuesto, total, monto_pagado, cambio, estado, notas)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [tiendaId, usuarioId, data.cliente_id || null, data.metodo_pago_id || null,
       subtotal, descuento, impuesto, total, montoPagado, cambio, estado, data.notas || null]
    );
    const venta = ventaRows[0];

    // 4. Detalle y movimiento de inventario
    for (const item of data.items) {
      const subtotalItem = parseFloat(item.precio_venta) * parseFloat(item.cantidad) - parseFloat(item.descuento || 0);
      await client.query(
        `INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_venta, descuento, subtotal)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [venta.id, item.producto_id, item.cantidad, item.precio_venta, item.descuento || 0, subtotalItem]
      );
      // Descontar stock
      const { rows: invRows } = await client.query(
        'SELECT cantidad FROM inventario WHERE tienda_id=$1 AND producto_id=$2',
        [tiendaId, item.producto_id]
      );
      const cantAnterior = parseInt(invRows[0].cantidad, 10);
      const cantNueva    = cantAnterior - parseInt(item.cantidad, 10);
      await client.query(
        'UPDATE inventario SET cantidad=$3, updated_at=NOW() WHERE tienda_id=$1 AND producto_id=$2',
        [tiendaId, item.producto_id, cantNueva]
      );
      await client.query(
        `INSERT INTO inventario_movimientos (tienda_id, producto_id, usuario_id, tipo, cantidad, cantidad_anterior, cantidad_nueva, motivo, referencia_id)
         VALUES ($1,$2,$3,'venta',$4,$5,$6,$7,$8)`,
        [tiendaId, item.producto_id, usuarioId, item.cantidad, cantAnterior, cantNueva, `Venta #${venta.id}`, venta.id]
      );
    }

    // 5. Actualizar deuda de cliente si es crédito
    if (data.cliente_id && estado === 'credito') {
      await client.query(
        'UPDATE clientes SET saldo_deuda = saldo_deuda + $2 WHERE tienda_id=$1 AND id=$3',
        [tiendaId, total - montoPagado, data.cliente_id]
      );
    }

    await client.query('COMMIT');
    return venta;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { findAll, findById, findDetalle, create };
