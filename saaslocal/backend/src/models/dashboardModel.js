// models/dashboardModel.js
const db = require('../config/db');

const getResumenHoy = async (tiendaId) => {
  const { rows } = await db.query(
    `SELECT
       COUNT(*) FILTER (WHERE estado != 'anulada') AS num_ventas,
       COALESCE(SUM(total) FILTER (WHERE estado != 'anulada'), 0) AS total_ventas,
       COALESCE(SUM(total) FILTER (WHERE estado = 'credito'), 0) AS total_credito,
       COALESCE(SUM(total) FILTER (WHERE estado = 'completada'), 0) AS total_efectivo
     FROM ventas
     WHERE tienda_id=$1 AND created_at::date = CURRENT_DATE`,
    [tiendaId]
  );
  return rows[0];
};

const getVentasUltimos7Dias = async (tiendaId) => {
  const { rows } = await db.query(
    `SELECT
       DATE_TRUNC('day', created_at)::date AS fecha,
       COUNT(*) AS num_ventas,
       COALESCE(SUM(total), 0) AS total
     FROM ventas
     WHERE tienda_id=$1
       AND estado != 'anulada'
       AND created_at >= NOW() - INTERVAL '7 days'
     GROUP BY 1 ORDER BY 1`,
    [tiendaId]
  );
  return rows;
};

const getTopProductos = async (tiendaId, limit = 5) => {
  const { rows } = await db.query(
    `SELECT p.id, p.nombre, SUM(dv.cantidad) AS unidades, SUM(dv.subtotal) AS ingresos
     FROM detalle_ventas dv
     JOIN productos p ON p.id = dv.producto_id
     JOIN ventas v ON v.id = dv.venta_id
     WHERE v.tienda_id=$1 AND v.estado != 'anulada'
       AND v.created_at >= NOW() - INTERVAL '30 days'
     GROUP BY p.id, p.nombre
     ORDER BY ingresos DESC LIMIT $2`,
    [tiendaId, limit]
  );
  return rows;
};

const getAlertasStock = async (tiendaId) => {
  const { rows } = await db.query(
    `SELECT p.id, p.nombre, i.cantidad AS stock, i.cantidad_minima AS stock_minimo,
            c.nombre AS categoria
     FROM inventario i
     JOIN productos p ON p.id = i.producto_id
     LEFT JOIN categorias c ON c.id = p.categoria_id
     WHERE i.tienda_id=$1 AND p.disponible=TRUE
       AND i.cantidad <= i.cantidad_minima
     ORDER BY i.cantidad ASC`,
    [tiendaId]
  );
  return rows;
};

const getResumenDeudas = async (tiendaId) => {
  const { rows } = await db.query(
    `SELECT COUNT(*) AS num_clientes, COALESCE(SUM(saldo_deuda),0) AS total_deudas
     FROM clientes WHERE tienda_id=$1 AND saldo_deuda > 0`,
    [tiendaId]
  );
  return rows[0];
};

const getVentasPorMetodo = async (tiendaId) => {
  const { rows } = await db.query(
    `SELECT COALESCE(m.nombre, 'Sin método') AS metodo,
            COUNT(*) AS num_ventas, SUM(v.total) AS total
     FROM ventas v
     LEFT JOIN metodos_pago m ON m.id = v.metodo_pago_id
     WHERE v.tienda_id=$1 AND v.estado != 'anulada'
       AND v.created_at >= NOW() - INTERVAL '30 days'
     GROUP BY m.nombre ORDER BY total DESC`,
    [tiendaId]
  );
  return rows;
};

module.exports = {
  getResumenHoy, getVentasUltimos7Dias, getTopProductos,
  getAlertasStock, getResumenDeudas, getVentasPorMetodo
};
