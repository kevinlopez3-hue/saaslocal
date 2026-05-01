// src/index.js - Entry point del servidor
require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const compression = require('compression');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');

const routes = require('./routes');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const logger = require('./utils/logger');
const { pool } = require('./config/db');

const app  = express();
const PORT = process.env.PORT || 4000;

// ── Seguridad ────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// Rate limiting: 200 peticiones / 15 min por IP
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Demasiadas peticiones. Intenta en unos minutos.' },
}));

// ── Utilidades ────────────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// ── Rutas ────────────────────────────────────────────────────
app.use('/api/v1', routes);

// Health check
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', version: '1.0.0' });
  } catch {
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

// ── Error handlers ───────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Arranque ─────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`🚀 SaasLocal API corriendo en http://localhost:${PORT}`);
  logger.info(`   Ambiente: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
