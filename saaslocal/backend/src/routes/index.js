// routes/index.js - Registro central de rutas
const router = require('express').Router();
const { authenticate } = require('../middlewares/auth');
const { body } = require('express-validator');

// Controllers
const Auth        = require('../controllers/authController');
const Productos   = require('../controllers/productosController');
const Ventas      = require('../controllers/ventasController');
const Clientes    = require('../controllers/clientesController');
const Dashboard   = require('../controllers/dashboardController');
const Proveedores = require('../controllers/proveedoresController');

// ── Auth (pública) ───────────────────────────────────────────
router.post('/auth/login', Auth.login);
router.get('/auth/me', authenticate, Auth.me);

// ── Dashboard ────────────────────────────────────────────────
router.get('/dashboard', authenticate, Dashboard.getStats);

// ── Productos ────────────────────────────────────────────────
const productoRules = [
  body('nombre').notEmpty().withMessage('El nombre es requerido').trim(),
  body('precio_venta').isFloat({ gt: 0 }).withMessage('Precio de venta inválido'),
  body('precio_costo').optional().isFloat({ min: 0 }),
];
router.get   ('/productos',      authenticate, Productos.list);
router.get   ('/productos/:id',  authenticate, Productos.getOne);
router.post  ('/productos',      authenticate, productoRules, Productos.create);
router.put   ('/productos/:id',  authenticate, productoRules, Productos.update);
router.delete('/productos/:id',  authenticate, Productos.remove);

// ── Ventas ───────────────────────────────────────────────────
const ventaRules = [
  body('items').isArray({ min: 1 }).withMessage('Items requeridos'),
  body('items.*.producto_id').isInt({ gt: 0 }),
  body('items.*.cantidad').isFloat({ gt: 0 }),
  body('items.*.precio_venta').isFloat({ gt: 0 }),
];
router.get ('/ventas',      authenticate, Ventas.list);
router.get ('/ventas/:id',  authenticate, Ventas.getOne);
router.post('/ventas',      authenticate, ventaRules, Ventas.create);

// ── Clientes ─────────────────────────────────────────────────
const clienteRules = [
  body('nombre').notEmpty().withMessage('El nombre es requerido').trim(),
  body('email').optional().isEmail().withMessage('Email inválido'),
];
router.get  ('/clientes',          authenticate, Clientes.list);
router.get  ('/clientes/:id',      authenticate, Clientes.getOne);
router.post ('/clientes',          authenticate, clienteRules, Clientes.create);
router.put  ('/clientes/:id',      authenticate, clienteRules, Clientes.update);
router.post ('/clientes/:id/abonar', authenticate, Clientes.abonar);

// ── Categorías ───────────────────────────────────────────────
const db = require('../config/db');
router.get('/categorias', authenticate, async (req, res, next) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM categorias WHERE tienda_id=$1 AND activa=TRUE ORDER BY nombre',
      [req.tiendaId]
    );
    res.json({ categorias: rows });
  } catch (err) { next(err); }
});

// ── Métodos de pago ──────────────────────────────────────────
router.get('/metodos-pago', authenticate, async (req, res, next) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM metodos_pago WHERE tienda_id=$1 AND activo=TRUE ORDER BY nombre',
      [req.tiendaId]
    );
    res.json({ metodos: rows });
  } catch (err) { next(err); }
});

// ── Proveedores ───────────────────────────────────────────────
const proveedorRules = [
  body('nombre').notEmpty().withMessage('El nombre es requerido').trim(),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Email inválido'),
  body('nit').optional().trim(),
];
router.get   ('/proveedores',      authenticate, Proveedores.list);
router.get   ('/proveedores/:id',  authenticate, Proveedores.getOne);
router.post  ('/proveedores',      authenticate, proveedorRules, Proveedores.create);
router.put   ('/proveedores/:id',  authenticate, proveedorRules, Proveedores.update);
router.delete('/proveedores/:id',  authenticate, Proveedores.remove);

module.exports = router;
