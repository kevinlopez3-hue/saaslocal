// controllers/productosController.js
const Productos = require('../models/productosModel');
const { validationResult } = require('express-validator');

const list = async (req, res, next) => {
  try {
    const { search, categoria_id, disponibles } = req.query;
    const productos = await Productos.findAll(req.tiendaId, {
      search,
      categoriaId: categoria_id ? parseInt(categoria_id) : undefined,
      soloDisponibles: disponibles === 'true',
    });
    res.json({ productos });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const producto = await Productos.findById(req.tiendaId, req.params.id);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ producto });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const producto = await Productos.create(req.tiendaId, req.body);
    res.status(201).json({ producto, message: 'Producto creado exitosamente' });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const producto = await Productos.update(req.tiendaId, req.params.id, req.body);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ producto, message: 'Producto actualizado' });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const ok = await Productos.remove(req.tiendaId, req.params.id);
    if (!ok) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ message: 'Producto desactivado' });
  } catch (err) { next(err); }
};

module.exports = { list, getOne, create, update, remove };
