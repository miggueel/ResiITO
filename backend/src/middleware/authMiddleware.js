
import jwt from 'jsonwebtoken';

export const verificarToken = (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    return res.status(401).json({
      mensaje: 'Token requerido'
    });
  }

  const token = authorization.slice(7);

  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256']
    });
    next();
  } catch {
    return res.status(401).json({
      mensaje: 'Token inválido o expirado'
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
