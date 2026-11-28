import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';

export const verificarToken = async (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    return res.status(401).json({
      mensaje: 'Token requerido'
    });
  }

  const token = authorization.slice(7);
  let datos;

  try {
    datos = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256']
    });
  } catch {
    return res.status(401).json({
      mensaje: 'Token inválido o expirado'
    });
  }

  try {
    // La cuenta debe seguir existiendo y estar activa: si la coordinación la
    // desactiva o la elimina, la sesión deja de servir de inmediato.
    // El rol se toma de la base de datos, no del token.
    const { rows } = await query(
      'SELECT id, rol, estado_cuenta FROM usuarios WHERE id = $1',
      [datos.id]
    );

    if (!rows[0] || rows[0].estado_cuenta !== 'activa') {
      return res.status(401).json({
        mensaje: 'Tu cuenta ya no está activa'
      });
    }

    req.usuario = { id: rows[0].id, rol: rows[0].rol };
    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al verificar la sesión'
    });
  }
};

export const permitirRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.usuario || !roles.includes(req.usuario.rol)) {
      return res.status(403).json({
        mensaje: 'No tienes permisos para esta acción'
      });
    }

    next();
  };
};
