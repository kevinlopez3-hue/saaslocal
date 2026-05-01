// controllers/ventasController.js
const Ventas = require('../models/ventasModel');
const { validationResult } = require('express-validator');

const list = async (req, res, next) => {
  try {
    const { desde, hasta, estado, cliente_id, limit, offset } = req.query;
    const ventas = await Ventas.findAll(req.tiendaId, {
      desde, hasta, estado, clienteId: cliente_id,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
    });
    res.json({ ventas });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const venta = await Ventas.findById(req.tiendaId, req.params.id);
    if (!venta) return res.status(404).json({ error: 'Venta no encontrada' });
    const detalle = await Ventas.findDetalle(venta.id);
    res.json({ venta: { ...venta, detalle } });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { items } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'La venta debe tener al menos un producto' });
    }

    const venta = await Ventas.create(req.tiendaId, req.user.id, req.body);
    res.status(201).json({ venta, message: 'Venta registrada exitosamente' });
  } catch (err) {
    // Errores de stock insuficiente tienen status 400
    if (err.status === 400) return res.status(400).json({ error: err.message });
    next(err);
  }
};

module.exports = { list, getOne, create };
