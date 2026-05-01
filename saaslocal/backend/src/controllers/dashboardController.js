// controllers/dashboardController.js
const Dashboard = require('../models/dashboardModel');

const getStats = async (req, res, next) => {
  try {
    const tiendaId = req.tiendaId;
    const [hoy, semana, topProductos, alertasStock, deudas, metodosPago] = await Promise.all([
      Dashboard.getResumenHoy(tiendaId),
      Dashboard.getVentasUltimos7Dias(tiendaId),
      Dashboard.getTopProductos(tiendaId),
      Dashboard.getAlertasStock(tiendaId),
      Dashboard.getResumenDeudas(tiendaId),
      Dashboard.getVentasPorMetodo(tiendaId),
    ]);
    res.json({ hoy, semana, topProductos, alertasStock, deudas, metodosPago });
  } catch (err) { next(err); }
};

module.exports = { getStats };
