import pool, { query } from '../config/database.js';
import { correoActivacion, correoRestablecimiento, urlFrontend } from '../config/correo.js';
import {
  crearTokenCuenta,
  HORAS_ACTIVACION,
  HORAS_RESTABLECIMIENTO
} from '../utils/tokensCuenta.js';
import {
  correoValido,
  ESTADOS_REPUBLICA,
  idValido,
  textoOpcional,
  textoRequerido
} from '../utils/validaciones.js';

const ROLES_ALTA = ['alumno', 'empresa', 'docente'];

// Coordinación consulta usuarios (filtro opcional ?rol=)
export const listarUsuarios = async (req, res) => {
  try {
    const { rol } = req.query;

    const resultado = await query(
      `SELECT
         u.id, u.nombre, u.correo, u.rol, u.estado_cuenta, u.fecha_registro,
         a.matricula, a.carrera, a.semestre,
         e.nombre AS empresa, e.estado_republica, e.telefono,
         d.id AS docente_id, d.numero_empleado, d.departamento,
         e.descripcion, e.direccion,
         u.fecha_actualizacion, u.fecha_desactivacion,
         (SELECT MAX(t.expira_en) FROM tokens_cuenta t
          WHERE t.usuario_id = u.id AND t.tipo = 'activacion' AND t.usado_en IS NULL
         ) AS invitacion_vence,
         (SELECT MAX(t.expira_en) FROM tokens_cuenta t
          WHERE t.usuario_id = u.id AND t.tipo = 'restablecimiento'
            AND t.usado_en IS NULL AND t.expira_en > NOW()
         ) AS restablecimiento_vence
       FROM usuarios u
       LEFT JOIN alumnos a ON a.usuario_id = u.id
       LEFT JOIN empresas e ON e.usuario_id = u.id
       LEFT JOIN docentes d ON d.usuario_id = u.id
       WHERE ($1::text IS NULL OR u.rol = $1)
       ORDER BY u.fecha_registro DESC NULLS LAST, u.id DESC`,
      [rol || null]
    );

    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al consultar usuarios' });
  }
};

const enviarActivacion = async (usuario, token) => {
  await correoActivacion({
    nombre: usuario.nombre,
    correo: usuario.correo,
    enlace: urlFrontend(`/activar/${token}`),
    horas: HORAS_ACTIVACION
  });
};

// Coordinación da de alta un alumno, empresa o docente.
// La cuenta queda pendiente hasta que la persona abre el enlace y crea su contraseña.
// Valida nombre, correo y los datos del perfil según el rol. Devuelve un mensaje o null.
const errorDatosUsuario = (rol, datos) => {
  const { nombre, correo, matricula, carrera, semestre, nombre_empresa, estado_republica } = datos;

  if (!textoRequerido(nombre) || !correoValido(correo)) {
    return 'Nombre y un correo válido son obligatorios';
  }
  if (rol === 'alumno') {
    if (!textoRequerido(matricula) || !textoRequerido(carrera)) {
      return 'Número de control y carrera son obligatorios para alumnos';
    }
    if (semestre != null && (!Number.isInteger(semestre) || semestre < 1)) {
      return 'El semestre debe ser un número entero positivo';
    }
  }
  if (rol === 'empresa') {
    if (!textoRequerido(nombre_empresa)) return 'El nombre de la empresa es obligatorio';
    if (!ESTADOS_REPUBLICA.includes(estado_republica)) {
      return 'Selecciona el estado de la República donde está la empresa';
    }
  }
  return null;
};

// Guarda (inserta o actualiza) el perfil según el rol
const guardarPerfil = async (cliente, rol, usuarioId, datos, actualizar) => {
  const {
    matricula, carrera, semestre,
    nombre_empresa, descripcion, direccion, telefono, estado_republica,
    numero_empleado, departamento
  } = datos;

  if (rol === 'alumno') {
    await cliente.query(
      actualizar
        ? `UPDATE alumnos SET matricula = $2, carrera = $3, semestre = $4 WHERE usuario_id = $1`
        : `INSERT INTO alumnos (usuario_id, matricula, carrera, semestre) VALUES ($1, $2, $3, $4)`,
      [usuarioId, matricula.trim(), carrera.trim(), semestre ?? null]
    );
  } else if (rol === 'empresa') {
    await cliente.query(
      actualizar
        ? `UPDATE empresas SET nombre = $2, descripcion = $3, direccion = $4, telefono = $5, estado_republica = $6
           WHERE usuario_id = $1`
        : `INSERT INTO empresas (usuario_id, nombre, descripcion, direccion, telefono, estado_republica)
           VALUES ($1, $2, $3, $4, $5, $6)`,
      [usuarioId, nombre_empresa.trim(), textoOpcional(descripcion),
       textoOpcional(direccion), textoOpcional(telefono), estado_republica]
    );
  } else if (rol === 'docente') {
    await cliente.query(
      actualizar
        ? `UPDATE docentes SET numero_empleado = $2, departamento = $3 WHERE usuario_id = $1`
        : `INSERT INTO docentes (usuario_id, numero_empleado, departamento) VALUES ($1, $2, $3)`,
      [usuarioId, textoOpcional(numero_empleado), textoOpcional(departamento)]
    );
  }
};

const MENSAJE_DUPLICADO = 'Ya existe una cuenta con ese correo, número de control o número de empleado';

// Coordinación da de alta un alumno, empresa o docente.
// La cuenta queda pendiente hasta que la persona abre el enlace y crea su contraseña.
export const crearUsuario = async (req, res) => {
  const { rol, nombre, correo } = req.body;

  if (!ROLES_ALTA.includes(rol)) {
    return res.status(400).json({ mensaje: 'El rol debe ser alumno, empresa o docente' });
  }
  const error = errorDatosUsuario(rol, req.body);
  if (error) return res.status(400).json({ mensaje: error });

  let cliente;

  try {
    cliente = await pool.connect();
    await cliente.query('BEGIN');

    const resultado = await cliente.query(
      `INSERT INTO usuarios (nombre, correo, password, rol, estado_cuenta, creado_por)
       VALUES ($1, $2, NULL, $3, 'pendiente', $4)
       RETURNING id, nombre, correo, rol, estado_cuenta`,
      [nombre.trim(), correo.trim().toLowerCase(), rol, req.usuario.id]
    );
    const usuario = resultado.rows[0];

    await guardarPerfil(cliente, rol, usuario.id, req.body, false);

    const token = await crearTokenCuenta(cliente, usuario.id, 'activacion', HORAS_ACTIVACION);
    await cliente.query('COMMIT');

    try {
      await enviarActivacion(usuario, token);
    } catch (errorCorreo) {
      console.error('Error al enviar correo de activación:', errorCorreo.message);
      return res.status(201).json({
        mensaje: 'Usuario creado, pero no se pudo enviar el correo. Usa "Reenviar invitación".',
        correo_enviado: false,
        usuario
      });
    }

    res.status(201).json({
      mensaje: `Invitación enviada a ${usuario.correo}`,
      correo_enviado: true,
      usuario
    });
  } catch (error) {
    if (cliente) await cliente.query('ROLLBACK');

    if (error.code === '23505') {
      return res.status(409).json({ mensaje: MENSAJE_DUPLICADO });
    }

    console.error(error);
    res.status(500).json({ mensaje: 'Error al crear el usuario' });
  } finally {
    cliente?.release();
  }
};

const obtenerUsuario = async (id) =>
  (await query(
    'SELECT id, nombre, correo, rol, estado_cuenta FROM usuarios WHERE id = $1',
    [id]
  )).rows[0];

// Genera un nuevo enlace de activación (el anterior deja de servir)
export const reenviarInvitacion = async (req, res) => {
  try {
    const id = idValido(req.params.id);
    const usuario = id && await obtenerUsuario(id);

    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    if (usuario.estado_cuenta === 'inactiva') {
      return res.status(409).json({ mensaje: 'La cuenta está desactivada. Reactívala primero.' });
    }
    if (usuario.estado_cuenta !== 'pendiente') {
      return res.status(409).json({ mensaje: 'Esta cuenta ya está activa. Usa "Restablecer contraseña".' });
    }

    const token = await crearTokenCuenta(pool, usuario.id, 'activacion', HORAS_ACTIVACION);
    await enviarActivacion(usuario, token);

    res.json({ mensaje: `Invitación reenviada a ${usuario.correo}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'No se pudo reenviar la invitación' });
  }
};

// Envía un enlace para elegir nueva contraseña.
// La contraseña actual NO cambia hasta que el usuario abre el enlace y guarda una nueva.
export const enviarRestablecimiento = async (req, res) => {
  try {
    const id = idValido(req.params.id);
    const usuario = id && await obtenerUsuario(id);

    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    if (usuario.id === req.usuario.id) {
      return res.status(400).json({ mensaje: 'Para tu propia cuenta usa "Cambiar contraseña".' });
    }
    if (usuario.estado_cuenta === 'inactiva') {
      return res.status(409).json({ mensaje: 'La cuenta está desactivada. Reactívala primero.' });
    }
    if (usuario.estado_cuenta !== 'activa') {
      return res.status(409).json({ mensaje: 'La cuenta aún no se activa. Reenvía la invitación.' });
    }

    const token = await crearTokenCuenta(pool, usuario.id, 'restablecimiento', HORAS_RESTABLECIMIENTO);
    await correoRestablecimiento({
      nombre: usuario.nombre,
      correo: usuario.correo,
      enlace: urlFrontend(`/restablecer/${token}`),
      horas: HORAS_RESTABLECIMIENTO
    });

    res.json({ mensaje: `Enlace de restablecimiento enviado a ${usuario.correo}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'No se pudo enviar el enlace de restablecimiento' });
  }
};

// Cuántos registros dependen del usuario: si hay historial no se puede eliminar
const historialDe = async (ejecutor, usuario) => {
  const consultas = {
    alumno: `SELECT
               (SELECT COUNT(*) FROM postulaciones p JOIN alumnos a ON a.id = p.alumno_id
                WHERE a.usuario_id = $1)::int AS postulaciones`,
    empresa: `SELECT
                (SELECT COUNT(*) FROM vacantes v JOIN empresas e ON e.id = v.empresa_id
                 WHERE e.usuario_id = $1)::int AS proyectos`,
    docente: `SELECT
                (SELECT COUNT(*) FROM docentes_vacante dv JOIN docentes d ON d.id = dv.docente_id
                 WHERE d.usuario_id = $1)::int AS proyectos_asignados,
                (SELECT COUNT(*) FROM observaciones_reporte o JOIN docentes d ON d.id = o.docente_id
                 WHERE d.usuario_id = $1)::int AS observaciones,
                (SELECT COUNT(*) FROM reportes r JOIN docentes d ON d.id = r.revisado_por
                 WHERE d.usuario_id = $1)::int AS reportes_revisados,
                (SELECT COUNT(*) FROM solicitudes_cambio_estado s JOIN docentes d ON d.id = s.docente_id
                 WHERE d.usuario_id = $1)::int AS solicitudes`,
    coordinador: `SELECT
                    (SELECT COUNT(*) FROM usuarios WHERE creado_por = $1)::int AS usuarios_creados,
                    (SELECT COUNT(*) FROM solicitudes_cambio_estado WHERE resuelta_por = $1)::int AS solicitudes_resueltas`
  };

  const { rows: [conteos] } = await ejecutor.query(consultas[usuario.rol], [usuario.id]);
  // Los usuarios creados por un coordinador no le impiden ser eliminado
  const relevantes = Object.entries(conteos).filter(([clave, n]) => n > 0 && clave !== 'usuarios_creados');
  return { conteos, tieneHistorial: relevantes.length > 0 };
};

const SQL_DETALLE = `
  SELECT u.id, u.nombre, u.correo, u.rol, u.estado_cuenta, u.fecha_registro,
         u.fecha_actualizacion, u.fecha_desactivacion,
         a.matricula, a.carrera, a.semestre,
         e.nombre AS empresa, e.estado_republica, e.telefono, e.direccion, e.descripcion,
         d.id AS docente_id, d.numero_empleado, d.departamento
  FROM usuarios u
  LEFT JOIN alumnos a ON a.usuario_id = u.id
  LEFT JOIN empresas e ON e.usuario_id = u.id
  LEFT JOIN docentes d ON d.usuario_id = u.id
  WHERE u.id = $1`;

// Detalle de un usuario con el resumen de su historial
export const obtenerDetalleUsuario = async (req, res) => {
  try {
    const id = idValido(req.params.id);
    const { rows: [usuario] } = id ? await query(SQL_DETALLE, [id]) : { rows: [] };

    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    const { conteos, tieneHistorial } = await historialDe(pool, usuario);
    res.json({ ...usuario, historial: conteos, puede_eliminarse: !tieneHistorial && usuario.id !== req.usuario.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al consultar el usuario' });
  }
};

// Edita nombre, correo y perfil. El rol no cambia: para otro rol se da de alta una cuenta nueva.
export const actualizarUsuario = async (req, res) => {
  let cliente;

  try {
    const id = idValido(req.params.id);
    const actual = id && await obtenerUsuario(id);
    if (!actual) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    if (req.body.rol && req.body.rol !== actual.rol) {
      return res.status(400).json({
        mensaje: 'El tipo de cuenta no se puede cambiar. Da de alta una cuenta nueva con el otro tipo.'
      });
    }

    const error = errorDatosUsuario(actual.rol, req.body);
    if (error) return res.status(400).json({ mensaje: error });

    const correo = req.body.correo.trim().toLowerCase();

    cliente = await pool.connect();
    await cliente.query('BEGIN');

    await cliente.query(
      `UPDATE usuarios SET nombre = $1, correo = $2, fecha_actualizacion = NOW() WHERE id = $3`,
      [req.body.nombre.trim(), correo, id]
    );
    await guardarPerfil(cliente, actual.rol, id, req.body, true);

    // Si cambió el correo de una cuenta sin activar, la invitación anterior deja de servir
    const cambioCorreo = correo !== actual.correo;
    if (cambioCorreo && actual.estado_cuenta === 'pendiente') {
      await cliente.query(
        `DELETE FROM tokens_cuenta WHERE usuario_id = $1 AND usado_en IS NULL`,
        [id]
      );
    }

    await cliente.query('COMMIT');

    const { rows: [usuario] } = await query(SQL_DETALLE, [id]);
    res.json({
      mensaje: cambioCorreo && actual.estado_cuenta === 'pendiente'
        ? 'Datos guardados. Como cambió el correo, reenvía la invitación.'
        : 'Datos guardados',
      usuario
    });
  } catch (error) {
    if (cliente) await cliente.query('ROLLBACK');
    if (error.code === '23505') return res.status(409).json({ mensaje: MENSAJE_DUPLICADO });
    console.error(error);
    res.status(500).json({ mensaje: 'Error al actualizar el usuario' });
  } finally {
    cliente?.release();
  }
};

// Desactiva o reactiva una cuenta. Al desactivar se invalidan sus enlaces y su sesión.
export const cambiarEstadoCuenta = async (req, res) => {
  try {
    const id = idValido(req.params.id);
    const { activa } = req.body;

    if (typeof activa !== 'boolean') {
      return res.status(400).json({ mensaje: 'Indica si la cuenta queda activa (true) o desactivada (false)' });
    }

    const actual = id && (await query('SELECT id, estado_cuenta, password FROM usuarios WHERE id = $1', [id])).rows[0];
    if (!actual) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    if (actual.id === req.usuario.id) {
      return res.status(400).json({ mensaje: 'No puedes desactivar tu propia cuenta' });
    }

    if (!activa) {
      if (actual.estado_cuenta === 'inactiva') {
        return res.status(409).json({ mensaje: 'La cuenta ya está desactivada' });
      }
      await query(
        `UPDATE usuarios SET estado_cuenta = 'inactiva', fecha_desactivacion = NOW() WHERE id = $1`,
        [id]
      );
      await query('DELETE FROM tokens_cuenta WHERE usuario_id = $1 AND usado_en IS NULL', [id]);
      return res.json({ mensaje: 'Cuenta desactivada. Ya no puede iniciar sesión.' });
    }

    if (actual.estado_cuenta !== 'inactiva') {
      return res.status(409).json({ mensaje: 'La cuenta no está desactivada' });
    }

    // Sin contraseña nunca terminó de activarse: vuelve a quedar pendiente de invitación
    const nuevoEstado = actual.password ? 'activa' : 'pendiente';
    await query(
      `UPDATE usuarios SET estado_cuenta = $1, fecha_desactivacion = NULL WHERE id = $2`,
      [nuevoEstado, id]
    );

    res.json({
      mensaje: nuevoEstado === 'activa'
        ? 'Cuenta reactivada. Puede iniciar sesión con su contraseña.'
        : 'Cuenta reactivada. Reenvía la invitación para que cree su contraseña.',
      estado_cuenta: nuevoEstado
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al cambiar el estado de la cuenta' });
  }
};

// Elimina definitivamente una cuenta sin historial.
// Si ya participó en residencias, se debe desactivar para conservar los registros.
export const eliminarUsuario = async (req, res) => {
  let cliente;

  try {
    const id = idValido(req.params.id);
    const usuario = id && await obtenerUsuario(id);
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    if (usuario.id === req.usuario.id) {
      return res.status(400).json({ mensaje: 'No puedes eliminar tu propia cuenta' });
    }

    cliente = await pool.connect();
    await cliente.query('BEGIN');

    // Bloquea la fila para que no se le agregue historial mientras se elimina
    await cliente.query('SELECT id FROM usuarios WHERE id = $1 FOR UPDATE', [id]);
    const { tieneHistorial } = await historialDe(cliente, usuario);

    if (tieneHistorial) {
      await cliente.query('ROLLBACK');
      return res.status(409).json({
        mensaje: 'Este usuario ya tiene historial en residencias (postulaciones, proyectos, reportes o revisiones). Desactívalo en lugar de eliminarlo para conservar esos registros.',
        sugerencia: 'desactivar'
      });
    }

    await cliente.query('DELETE FROM alumnos WHERE usuario_id = $1', [id]);
    await cliente.query('DELETE FROM empresas WHERE usuario_id = $1', [id]);
    await cliente.query('DELETE FROM docentes WHERE usuario_id = $1', [id]);
    await cliente.query('UPDATE usuarios SET creado_por = NULL WHERE creado_por = $1', [id]);
    await cliente.query('DELETE FROM usuarios WHERE id = $1', [id]);

    await cliente.query('COMMIT');
    res.json({ mensaje: `Cuenta de ${usuario.nombre} eliminada` });
  } catch (error) {
    if (cliente) await cliente.query('ROLLBACK');
    if (error.code === '23503') {
      return res.status(409).json({
        mensaje: 'Este usuario tiene registros relacionados. Desactívalo en lugar de eliminarlo.',
        sugerencia: 'desactivar'
      });
    }
    console.error(error);
    res.status(500).json({ mensaje: 'Error al eliminar el usuario' });
  } finally {
    cliente?.release();
  }
};
