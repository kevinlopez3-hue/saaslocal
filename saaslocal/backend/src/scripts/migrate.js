// backend/src/scripts/migrate.js
// Ejecuta: node src/scripts/migrate.js
require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const { pool } = require('../config/db');
const logger = require('../utils/logger');

async function migrate() {
  const client = await pool.connect();
  try {
    const schemaPath = path.join(__dirname, '../../../database/schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`No se encontró schema.sql en ${schemaPath}`);
    }
    const sql = fs.readFileSync(schemaPath, 'utf8');
    logger.info('Ejecutando schema.sql...');
    await client.query(sql);
    logger.info('✅ Schema creado correctamente');
  } catch (err) {
    logger.error('Error en migración:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
