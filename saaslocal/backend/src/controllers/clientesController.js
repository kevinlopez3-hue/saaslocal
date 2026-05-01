// controllers/clientesController.js
const Clientes = require('../models/clientesModel');
const { validationResult } = require('express-validator');

const list = async (req, res, next) => {
  try {
    const clientes = await Clientes.findAll(req.tiendaId, { search: req.query.search });
    res.json({ clientes });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const cliente = await Clientes.findById(req.tiendaId, req.params.id);
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
    const deudas = await Clientes.getHistorialDeudas(req.tiendaId, cliente.id);
    res.json({ cliente: { ...cliente, deudas } });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const cliente = await Clientes.create(req.tiendaId, req.body);
    res.status(201).json({ cliente, message: 'Cliente creado' });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const cliente = await Clientes.update(req.tiendaId, req.params.id, req.body);
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json({ cliente, message: 'Cliente actualizado' });
  } catch (err) { next(err); }
};

const abonar = async (req, res, next) => {
  try {
    const { monto } = req.body;
    if (!monto || parseFloat(monto) <= 0) {
      return res.status(400).json({ error: 'Monto de abono inválido' });
    }
    const resultado = await Clientes.abonarDeuda(req.tiendaId, req.params.id, monto);
    if (!resultado) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json({ saldo_deuda: resultado.saldo_deuda, message: 'Abono registrado' });
  } catch (err) { next(err); }
};

module.exports = { list, getOne, create, update, abonar };
