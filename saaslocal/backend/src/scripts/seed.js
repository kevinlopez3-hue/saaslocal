// backend/src/scripts/seed.js
// Ejecuta: node src/scripts/seed.js
require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const { pool } = require('../config/db');
const logger = require('../utils/logger');

async function seed() {
  const client = await pool.connect();
  try {
    const seedPath = path.join(__dirname, '../../../database/seed.sql');
    if (!fs.existsSync(seedPath)) {
      throw new Error(`No se encontró seed.sql en ${seedPath}`);
    }
    const sql = fs.readFileSync(seedPath, 'utf8');
    logger.info('Insertando datos de ejemplo...');
    await client.query(sql);
    logger.info('✅ Datos de ejemplo insertados');
    logger.info('   Usuario demo: carlos@esperanza.com / Admin1234!');
  } catch (err) {
    logger.error('Error en seed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
