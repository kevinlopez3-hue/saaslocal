// utils/jwt.js
const jwt = require('jsonwebtoken');

const SECRET  = process.env.JWT_SECRET  || 'cambia_esto_en_produccion';
const EXPIRES = process.env.JWT_EXPIRES || '8h';

const sign = (payload) => jwt.sign(payload, SECRET, { expiresIn: EXPIRES });

const verify = (token) => {
  try {
    return { valid: true, payload: jwt.verify(token, SECRET) };
  } catch (err) {
    return { valid: false, error: err.message };
  }
};

module.exports = { sign, verify };
