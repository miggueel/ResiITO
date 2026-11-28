import pool, { query } from '../config/database.js';
import { fechaValida, idValido } from '../utils/validaciones.js';

// Máximo de postulaciones en revisión que un alumno puede tener a la vez
export const MAX_POSTULACIONES = 3;

// Alumno se postula a un proyecto aprobado con lugares disponibles.
// Solo puede tener 3 postulaciones en revisión y ninguna si ya fue aceptado.
export const crearPostulacion = async (req, res) => {
  const { vacante_id } = req.body;

  if (!Number.isInteger(vacante_id) || vacante_id <= 0) {
    return res.status(400).json({ mensaje: 'Debes proporcionar un vacante_id válido' });
  }

  let cliente;

  try {
    cliente = await pool.connect();
    await cliente.query('BEGIN');

    // Bloquea al alumno para que dos postulaciones simultáneas no rebasen el límite
    const { rows: [alumno] } = await cliente.query(
      'SELECT id FROM alumnos WHERE usuario_id = $1 FOR UPDATE',
      [req.usuario.id]
    );
    if (!alumno) {
      await cliente.query('ROLLBACK');
      return res.status(403).json({ mensaje: 'No tienes un perfil de alumno registrado' });
    }

    const { rows: [conteo] } = await cliente.query(
      `SELECT COUNT(*) FILTER (WHERE estado = 'aceptado')::int AS aceptadas,
              COUNT(*) FILTER (WHERE estado = 'pendiente')::int AS pendientes
       FROM postulaciones WHERE alumno_id = $1`,
      [alumno.id]
    );
    if (conteo.aceptadas > 0) {
      await cliente.query('ROLLBACK');
      return res.status(409).json({ mensaje: 'Ya fuiste aceptado en un proyecto de residencia' });
    }
    if (conteo.pendientes >= MAX_POSTULACIONES) {
      await cliente.query('ROLLBACK');
      return res.status(409).json({
        mensaje: `Solo puedes tener ${MAX_POSTULACIONES} postulaciones en revisión. Espera la respuesta de coordinación.`
      });
    }

    const { rows: [vacante] } = await cliente.query(
      `SELECT v.id, v.cupo,
              (SELECT COUNT(*)::int FROM postulaciones p
               WHERE p.vacante_id = v.id AND p.estado = 'aceptado') AS aceptados
       FROM vacantes v
       WHERE v.id = $1 AND v.estado = 'activa'`,
      [vacante_id]
    );

    if (!vacante) {
      await cliente.query('ROLLBACK');
      return res.status(404).json({ mensaje: 'Vacante no encontrada o no está abierta' });
    }
    if (vacante.aceptados >= vacante.cupo) {
      await cliente.query('ROLLBACK');
      return res.status(409).json({ mensaje: 'Este proyecto ya no tiene lugares disponibles' });
    }

    const { rows: [postulacion] } = await cliente.query(
      `INSERT INTO postulaciones (alumno_id, vacante_id) VALUES ($1, $2) RETURNING *`,
      [alumno.id, vacante_id]
    );

    await cliente.query('COMMIT');

    res.status(201).json({
      mensaje: 'Postulación registrada. Coordinación la revisará.',
      postulacion
    });
  } catch (error) {
    if (cliente) await cliente.query('ROLLBACK');
    if (error.code === '23505') {
      return res.status(409).json({ mensaje: 'Ya te postulaste a esta vacante' });
    }
    console.error(error);
    res.status(500).json({ mensaje: 'Error al registrar postulación' });
  } finally {
    cliente?.release();
  }
};

export const misPostulaciones = async (req, res) => {
  try {
    const resultado = await query(
      `SELECT p.id, p.estado, p.fecha_postulacion,
              v.id AS vacante_id, v.titulo, e.nombre AS empresa
       FROM postulaciones p
       JOIN alumnos a ON p.alumno_id = a.id
       JOIN vacantes v ON p.vacante_id = v.id
       JOIN empresas e ON v.empresa_id = e.id
       WHERE a.usuario_id = $1
       ORDER BY p.fecha_postulacion DESC`,
      [req.usuario.id]
    );

    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al consultar postulaciones' });
  }
};

// Empresa consulta (solo lectura) quién se postuló a sus proyectos
export const postulacionesEmpresa = async (req, res) => {
  try {
    const resultado = await query(
      `SELECT p.id, p.estado, p.fecha_postulacion,
              v.id AS vacante_id, v.titulo AS vacante,
              u.nombre AS alumno, u.correo, a.matricula, a.carrera
       FROM postulaciones p
       JOIN alumnos a ON p.alumno_id = a.id
       JOIN usuarios u ON a.usuario_id = u.id
       JOIN vacantes v ON p.vacante_id = v.id
       JOIN empresas e ON v.empresa_id = e.id
       WHERE e.usuario_id = $1
       ORDER BY p.fecha_postulacion DESC`,
      [req.usuario.id]
    );

    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al consultar postulaciones de empresa' });
  }
};

// Coordinación consulta todas las postulaciones (filtro opcional ?estado=)
export const listarPostulaciones = async (req, res) => {
  try {
    const resultado = await query(
      `SELECT p.id, p.estado, p.fecha_postulacion,
              v.id AS vacante_id, v.titulo AS vacante, v.cupo,
              (SELECT COUNT(*)::int FROM postulaciones p2
               WHERE p2.vacante_id = v.id AND p2.estado = 'aceptado') AS aceptados,
              e.nombre AS empresa,
              u.nombre AS alumno, u.correo, a.matricula, a.carrera, a.semestre
       FROM postulaciones p
       JOIN alumnos a ON p.alumno_id = a.id
       JOIN usuarios u ON a.usuario_id = u.id
       JOIN vacantes v ON p.vacante_id = v.id
       JOIN empresas e ON v.empresa_id = e.id
       WHERE ($1::text IS NULL OR p.estado = $1)
       ORDER BY (p.estado = 'pendiente') DESC, p.fecha_postulacion DESC`,
      [req.query.estado || null]
    );

    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al consultar postulaciones' });
  }
};

// Coordinación acepta (abre la residencia con su periodo) o rechaza a un alumno
export const decidirPostulacion = async (req, res) => {
  const id = idValido(req.params.id);
  const { estado, fecha_inicio, fecha_fin } = req.body;

  if (!['aceptado', 'rechazado'].includes(estado)) {
    return res.status(400).json({ mensaje: 'Estado permitido: aceptado o rechazado' });
  }
  if (estado === 'aceptado' && (
    !fechaValida(fecha_inicio) || !fechaValida(fecha_fin) || fecha_inicio > fecha_fin
  )) {
    return res.status(400).json({ mensaje: 'Indica fechas válidas de inicio y término de la residencia' });
  }

  let cliente;

  try {
    cliente = await pool.connect();
    await cliente.query('BEGIN');

    // Bloquea el proyecto para que dos aceptaciones simultáneas no rebasen el cupo
    const datos = await cliente.query(
      `SELECT p.id, p.alumno_id, p.estado, v.id AS vacante_id, v.cupo, v.estado AS estado_vacante
       FROM postulaciones p
       JOIN vacantes v ON v.id = p.vacante_id
       WHERE p.id = $1
       FOR UPDATE OF p, v`,
      [id]
    );
    const postulacion = datos.rows[0];

    if (!postulacion || postulacion.estado !== 'pendiente') {
      await cliente.query('ROLLBACK');
      return res.status(409).json({ mensaje: 'La postulación no existe o ya fue decidida' });
    }

    if (estado === 'aceptado') {
      const { rows: [conteo] } = await cliente.query(
        `SELECT COUNT(*)::int AS aceptados FROM postulaciones
         WHERE vacante_id = $1 AND estado = 'aceptado'`,
        [postulacion.vacante_id]
      );
      if (conteo.aceptados >= postulacion.cupo) {
        await cliente.query('ROLLBACK');
        return res.status(409).json({
          mensaje: `El proyecto ya tiene su cupo completo (${postulacion.cupo}). Aumenta el cupo o rechaza la postulación.`
        });
      }

      const { rows: otra } = await cliente.query(
        `SELECT 1 FROM postulaciones WHERE alumno_id = $1 AND estado = 'aceptado'`,
        [postulacion.alumno_id]
      );
      if (otra.length > 0) {
        await cliente.query('ROLLBACK');
        return res.status(409).json({ mensaje: 'Este alumno ya fue aceptado en otro proyecto' });
      }
    }

    await cliente.query('UPDATE postulaciones SET estado = $1 WHERE id = $2', [estado, id]);

    let residencia = null;
    let retiradas = 0;
    let proyectoCompleto = false;
    if (estado === 'aceptado') {
      ({ rows: [residencia] } = await cliente.query(
        `INSERT INTO residencias (postulacion_id, fecha_inicio, fecha_fin, estado)
         VALUES ($1, $2, $3, 'en_proceso')
         RETURNING *`,
        [id, fecha_inicio, fecha_fin]
      ));

      // El alumno ya tiene proyecto: sus demás postulaciones en revisión se retiran
      ({ rowCount: retiradas } = await cliente.query(
        `DELETE FROM postulaciones
         WHERE alumno_id = $1 AND id <> $2 AND estado = 'pendiente'`,
        [postulacion.alumno_id, id]
      ));

      // Si con este alumno se llenó el cupo, las demás postulaciones al proyecto
      // se rechazan para que esos alumnos puedan postularse a otro
      proyectoCompleto = await cerrarPostulacionesSiCompleto(cliente, postulacion.vacante_id);
    }

    await cliente.query('COMMIT');

    let mensaje = 'Postulación rechazada';
    if (estado === 'aceptado') {
      mensaje = 'Alumno aceptado. Su residencia quedó en proceso.';
      if (retiradas > 0) {
        mensaje += ` Se retiraron sus otras ${retiradas === 1 ? 'postulación' : `${retiradas} postulaciones`}.`;
      }
      if (proyectoCompleto) {
        mensaje += ' El equipo está completo: asígnale asesor y revisor en Proyectos › Asignar docentes.';
      }
    }

    res.json({ mensaje, residencia, proyecto_completo: proyectoCompleto });
  } catch (error) {
    if (cliente) await cliente.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ mensaje: 'Error al decidir la postulación' });
  } finally {
    cliente?.release();
  }
};

// Si el proyecto ya tiene todos sus alumnos, rechaza las postulaciones que
// seguían en revisión. Devuelve true cuando el cupo está completo.
export async function cerrarPostulacionesSiCompleto(cliente, vacanteId) {
  const { rows: [v] } = await cliente.query(
    `SELECT v.cupo,
            (SELECT COUNT(*)::int FROM postulaciones p
             WHERE p.vacante_id = v.id AND p.estado = 'aceptado') AS aceptados
     FROM vacantes v WHERE v.id = $1`,
    [vacanteId]
  );
  if (!v || v.aceptados < v.cupo) return false;

  await cliente.query(
    `UPDATE postulaciones SET estado = 'rechazado'
     WHERE vacante_id = $1 AND estado = 'pendiente'`,
    [vacanteId]
  );
  return true;
}
