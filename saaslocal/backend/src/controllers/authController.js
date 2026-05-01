// controllers/authController.js
const bcrypt = require('bcrypt');
const { sign } = require('../utils/jwt');
const AuthModel = require('../models/authModel');
const logger = require('../utils/logger');

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    const usuario = await AuthModel.findByEmailGlobal(email.toLowerCase().trim());
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    if (!usuario.tienda_activa) {
      return res.status(403).json({ error: 'La tienda está desactivada' });
    }

    const validPassword = await bcrypt.compare(password, usuario.contrasena_hash);
    if (!validPassword) {
      logger.warn('Intento de login fallido', { email, ip: req.ip });
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    await AuthModel.updateLastLogin(usuario.id);

    const token = sign({
      id:        usuario.id,
      tienda_id: usuario.tienda_id,
      rol:       usuario.rol,
      nombre:    usuario.nombre,
      email:     usuario.email,
    });

    res.json({
      token,
      usuario: {
        id:            usuario.id,
        nombre:        usuario.nombre,
        email:         usuario.email,
        rol:           usuario.rol,
        tienda_id:     usuario.tienda_id,
        tienda_nombre: usuario.tienda_nombre,
      },
    });
  } catch (err) {
    next(err);
  }
};

const me = async (req, res, next) => {
  try {
    const usuario = await AuthModel.findByIdWithTienda(req.user.id, req.tiendaId);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ usuario });
  } catch (err) {
    next(err);
  }
};

module.exports = { login, me };
