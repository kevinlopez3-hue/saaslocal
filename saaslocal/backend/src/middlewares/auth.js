// middlewares/auth.js - Validación de JWT y extracción de contexto de tienda
const { verify } = require('../utils/jwt');
const logger = require('../utils/logger');

/**
 * Middleware principal de autenticación.
 * Extrae tienda_id y usuario del token para usar en todos los handlers.
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  const token = authHeader.split(' ')[1];
  const { valid, payload, error } = verify(token);

  if (!valid) {
    logger.warn('Token inválido', { error, ip: req.ip });
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }

  // Inyectar contexto en req para uso en controladores
  req.user     = payload;
  req.tiendaId = payload.tienda_id;
  next();
};

/**
 * Middleware de autorización por rol.
 * Uso: authorize('admin') o authorize(['admin','cajero'])
 */
const authorize = (roles) => (req, res, next) => {
  const allowed = Array.isArray(roles) ? roles : [roles];
  if (!allowed.includes(req.user?.rol)) {
    return res.status(403).json({ error: 'No tienes permisos para esta acción' });
  }
  next();
};

module.exports = { authenticate, authorize };
