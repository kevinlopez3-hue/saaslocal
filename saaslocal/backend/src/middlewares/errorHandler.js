// middlewares/errorHandler.js
const logger = require('../utils/logger');

// Handler de errores centralizado
const errorHandler = (err, req, res, next) => {
  logger.error(err.message, { stack: err.stack, url: req.url, method: req.method });

  // Errores de validación de express-validator se manejan en controladores
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON inválido en el cuerpo de la petición' });
  }

  // Errores de PostgreSQL
  if (err.code) {
    switch (err.code) {
      case '23505': return res.status(409).json({ error: 'Registro duplicado: ya existe un elemento con esos datos' });
      case '23503': return res.status(400).json({ error: 'Referencia inválida: el recurso relacionado no existe' });
      case '22P02': return res.status(400).json({ error: 'Formato de dato inválido' });
    }
  }

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: status === 500 ? 'Error interno del servidor' : err.message,
  });
};

// Rutas no encontradas
const notFound = (req, res) => {
  res.status(404).json({ error: `Ruta ${req.method} ${req.url} no encontrada` });
};

module.exports = { errorHandler, notFound };
