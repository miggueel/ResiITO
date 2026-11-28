import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool, { query } from '../config/database.js';
import { hashToken } from '../utils/tokensCuenta.js';
import { errorPassword } from '../utils/validaciones.js';

const crearToken = (usuario) => {
  return jwt.sign(
    { id: usuario.id, rol: usuario.rol },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );
};

// Un alumno aceptado en un proyecto ya no se postula: solo da seguimiento
const SQL_EN_RESIDENCIA = (alias) => `
  EXISTS (
    SELECT 1 FROM postulaciones p
    JOIN alumnos a ON a.id = p.alumno_id
    WHERE a.usuario_id = ${alias}.id AND p.estado = 'aceptado'
  )`;

export const login = async (req, res) => {
  try {
    const { correo, password } = req.body;

    if (typeof correo !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        mensaje: 'Correo y contraseña obligatorios'
      });
    }

    const resultado = await query(
      `SELECT u.*, ${SQL_EN_RESIDENCIA('u')} AS en_residencia
       FROM usuarios u WHERE u.correo = $1`,
      [correo.trim().toLowerCase()]
    );

    const usuario = resultado.rows[0];

    // Las cuentas pendientes no tienen contraseña hasta que se activan
    if (
      !usuario ||
      !usuario.password ||
      !(await bcrypt.compare(password, usuario.password))
    ) {
      return res.status(401).json({
        mensaje: 'Correo o contraseña incorrectos. Si te dieron de alta hace poco, primero activa tu cuenta con el enlace que llegó a tu correo.'
      });
    }

    if (usuario.estado_cuenta !== 'activa') {
      return res.status(403).json({
        mensaje: 'Tu cuenta está desactivada. Comunícate con la coordinación de residencias.'
      });
    }

    res.json({
      mensaje: 'Inicio de sesión exitoso',
      token: crearToken(usuario),
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
        en_residencia: usuario.en_residencia
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al iniciar sesión' });
  }
};

export const perfil = async (req, res) => {
  try {
    const resultado = await query(
      `SELECT u.id, u.nombre, u.correo, u.rol, ${SQL_EN_RESIDENCIA('u')} AS en_residencia
       FROM usuarios u
       WHERE u.id = $1 AND u.estado_cuenta = 'activa'`,
      [req.usuario.id]
    );

    if (resultado.rows.length === 0) {
      return res.status(401).json({ mensaje: 'La cuenta no existe o no está activa' });
    }

    res.json(resultado.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al consultar perfil' });
  }
};

// El usuario cambia su propia contraseña desde su cuenta
export const cambiarPassword = async (req, res) => {
  try {
    const { password_actual, password_nueva } = req.body;

    if (typeof password_actual !== 'string') {
      return res.status(400).json({ mensaje: 'Escribe tu contraseña actual' });
    }

    const error = errorPassword(password_nueva);
    if (error) return res.status(400).json({ mensaje: error });

    const resultado = await query(
      'SELECT password FROM usuarios WHERE id = $1',
      [req.usuario.id]
    );
    const usuario = resultado.rows[0];

    if (!usuario?.password || !(await bcrypt.compare(password_actual, usuario.password))) {
      return res.status(400).json({ mensaje: 'La contraseña actual no es correcta' });
    }

    if (await bcrypt.compare(password_nueva, usuario.password)) {
      return res.status(400).json({ mensaje: 'La nueva contraseña debe ser distinta de la actual' });
    }

    const hash = await bcrypt.hash(password_nueva, 12);
    await query('UPDATE usuarios SET password = $1 WHERE id = $2', [hash, req.usuario.id]);

    // Un enlace de restablecimiento pendiente ya no tiene sentido
    await query(
      `DELETE FROM tokens_cuenta
       WHERE usuario_id = $1 AND tipo = 'restablecimiento' AND usado_en IS NULL`,
      [req.usuario.id]
    );

    res.json({ mensaje: 'Contraseña actualizada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al cambiar la contraseña' });
  }
};

const buscarEnlaceVigente = (ejecutor, token, bloquear = false) =>
  ejecutor.query(
    `SELECT t.id, t.tipo, t.usuario_id, u.nombre, u.correo, u.rol
     FROM tokens_cuenta t
     JOIN usuarios u ON u.id = t.usuario_id
     WHERE t.token_hash = $1
       AND t.usado_en IS NULL
       AND t.expira_en > NOW()
       AND u.estado_cuenta <> 'inactiva'
     ${bloquear ? 'FOR UPDATE OF t' : ''}`,
    [hashToken(token)]
  );

const ENLACE_INVALIDO =
  'Este enlace ya se usó o venció. Pide a la coordinación que te envíe uno nuevo.';

// Consulta un enlace de activación o restablecimiento antes de mostrar el formulario
export const consultarEnlace = async (req, res) => {
  try {
    const { token } = req.params;
    if (typeof token !== 'string' || token.length < 20) {
      return res.status(404).json({ mensaje: ENLACE_INVALIDO });
    }

    const resultado = await buscarEnlaceVigente(pool, token);
    const enlace = resultado.rows[0];

    if (!enlace) return res.status(404).json({ mensaje: ENLACE_INVALIDO });

    res.json({
      tipo: enlace.tipo,
      nombre: enlace.nombre,
      correo: enlace.correo
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al consultar el enlace' });
  }
};

// Activa la cuenta o restablece la contraseña. Solo aquí cambia la contraseña.
export const usarEnlace = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const error = errorPassword(password);
  if (error) return res.status(400).json({ mensaje: error });

  let cliente;

  try {
    cliente = await pool.connect();
    await cliente.query('BEGIN');

    const resultado = await buscarEnlaceVigente(cliente, token, true);
    const enlace = resultado.rows[0];

    if (!enlace) {
      await cliente.query('ROLLBACK');
      return res.status(404).json({ mensaje: ENLACE_INVALIDO });
    }

    const hash = await bcrypt.hash(password, 12);

    await cliente.query(
      `UPDATE usuarios
       SET password = $1, estado_cuenta = 'activa'
       WHERE id = $2`,
      [hash, enlace.usuario_id]
    );

    await cliente.query(
      'UPDATE tokens_cuenta SET usado_en = NOW() WHERE id = $1',
      [enlace.id]
    );

    await cliente.query('COMMIT');

    res.json({
      mensaje: enlace.tipo === 'activacion'
        ? 'Cuenta activada. Ya puedes iniciar sesión.'
        : 'Contraseña restablecida. Ya puedes iniciar sesión.',
      correo: enlace.correo
    });
  } catch (err) {
    if (cliente) await cliente.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ mensaje: 'Error al guardar la contraseña' });
  } finally {
    cliente?.release();
  }
};
