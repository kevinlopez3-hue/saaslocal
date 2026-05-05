// backend/src/controllers/proveedoresController.js
const Proveedores = require('../models/proveedoresModel');
const { validationResult } = require('express-validator');

const list = async (req, res, next) => {
  try {
    const proveedores = await Proveedores.findAll(req.tiendaId, { search: req.query.search });
    res.json({ proveedores });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const proveedor = await Proveedores.findById(req.tiendaId, req.params.id);
    if (!proveedor) return res.status(404).json({ error: 'Proveedor no encontrado' });

    const [historial, productos] = await Promise.all([
      Proveedores.getHistorialCompras(req.tiendaId, proveedor.id),
      Proveedores.getProductosAsociados(req.tiendaId, proveedor.id),
    ]);

    res.json({ proveedor: { ...proveedor, historial, productos } });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const proveedor = await Proveedores.create(req.tiendaId, req.body);
    res.status(201).json({ proveedor, message: 'Proveedor creado' });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const proveedor = await Proveedores.update(req.tiendaId, req.params.id, req.body);
    if (!proveedor) return res.status(404).json({ error: 'Proveedor no encontrado' });
    res.json({ proveedor, message: 'Proveedor actualizado' });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const ok = await Proveedores.remove(req.tiendaId, req.params.id);
    if (!ok) return res.status(404).json({ error: 'Proveedor no encontrado' });
    res.json({ message: 'Proveedor desactivado' });
  } catch (err) { next(err); }
};

module.exports = { list, getOne, create, update, remove };
