import pool, { query } from '../config/database.js';
import { contextoResidencia } from '../utils/permisos.js';
import { idValido, textoRequerido } from '../utils/validaciones.js';

const SQL_SOLICITUD = `
  SELECT s.*,
         ud.nombre AS docente,
         u.nombre AS alumno, a.matricula,
         v.titulo AS vacante, e.nombre AS empresa,
         r.estado AS estado_residencia,
         uc.nombre AS resuelta_por_nombre
  FROM solicitudes_cambio_estado s
  JOIN docentes d ON d.id = s.docente_id
  JOIN usuarios ud ON ud.id = d.usuario_id
  JOIN residencias r ON r.id = s.residencia_id
  JOIN postulaciones p ON p.id = r.postulacion_id
  JOIN alumnos a ON a.id = p.alumno_id
  JOIN usuarios u ON u.id = a.usuario_id
  JOIN vacantes v ON v.id = p.vacante_id
  JOIN empresas e ON e.id = v.empresa_id
  LEFT JOIN usuarios uc ON uc.id = s.resuelta_por`;

// Docente pide corregir el estatus final (finalizada / no concluida) explicando el motivo
export const crearSolicitud = async (req, res) => {
  try {
    const residenciaId = idValido(req.body.residencia_id);
    const { estado_solicitado, motivo } = req.body;

    if (!['en_proceso', 'finalizada', 'no_concluida'].includes(estado_solicitado)) {
      return res.status(400).json({ mensaje: 'Elige el estatus correcto: en proceso, finalizada o no concluida' });
    }
    if (!textoRequerido(motivo) || motivo.trim().length < 10) {
      return res.status(400).json({ mensaje: 'Explica el motivo del cambio (al menos 10 caracteres)' });
    }

    const contexto = residenciaId && await contextoResidencia(residenciaId, req.usuario.id);
    if (!contexto) return res.status(404).json({ mensaje: 'Residencia no encontrada' });
    if (!contexto.funcion_docente) {
      return res.status(403).json({ mensaje: 'No eres asesor ni revisor de este proyecto' });
    }
    if (!['finalizada', 'no_concluida'].includes(contexto.estado)) {
      return res.status(409).json({
        mensaje: 'Solo se puede solicitar un cambio cuando el proyecto está finalizado o no concluido'
      });
    }
    if (contexto.estado === estado_solicitado) {
      return res.status(400).json({ mensaje: 'El proyecto ya tiene ese estatus' });
    }

    const resultado = await query(
      `INSERT INTO solicitudes_cambio_estado
         (residencia_id, docente_id, estado_actual, estado_solicitado, motivo)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [residenciaId, contexto.docente_id, contexto.estado, estado_solicitado, motivo.trim()]
    );

    res.status(201).json({
      mensaje: 'Solicitud enviada a coordinación',
      solicitud: resultado.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ mensaje: 'Ya hay una solicitud pendiente para esta residencia' });
    }
    console.error(error);
    res.status(500).json({ mensaje: 'Error al enviar la solicitud' });
  }
};

// Coordinación: todas las solicitudes (filtro opcional ?estado=)
export const listarSolicitudes = async (req, res) => {
  try {
    const resultado = await query(
      `${SQL_SOLICITUD}
       WHERE ($1::text IS NULL OR s.estado = $1)
       ORDER BY (s.estado = 'pendiente') DESC, s.fecha_solicitud DESC`,
      [req.query.estado || null]
    );
    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al consultar solicitudes' });
  }
};

// Docente: sus solicitudes
export const misSolicitudes = async (req, res) => {
  try {
    const resultado = await query(
      `${SQL_SOLICITUD}
       WHERE d.usuario_id = $1
       ORDER BY s.fecha_solicitud DESC`,
      [req.usuario.id]
    );
    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al consultar tus solicitudes' });
  }
};

// Coordinación aprueba (aplica el cambio) o rechaza una solicitud
export const resolverSolicitud = async (req, res) => {
  const id = idValido(req.params.id);
  const { decision, respuesta } = req.body;

  if (!['aprobada', 'rechazada'].includes(decision)) {
    return res.status(400).json({ mensaje: 'La decisión debe ser aprobada o rechazada' });
  }
  if (decision === 'rechazada' && !textoRequerido(respuesta)) {
    return res.status(400).json({ mensaje: 'Explica al docente por qué se rechaza la solicitud' });
  }

  let cliente;

  try {
    cliente = await pool.connect();
    await cliente.query('BEGIN');

    const { rows: [solicitud] } = await cliente.query(
      `SELECT s.*, r.estado AS estado_residencia
       FROM solicitudes_cambio_estado s
       JOIN residencias r ON r.id = s.residencia_id
       WHERE s.id = $1
       FOR UPDATE OF s, r`,
      [id]
    );

    if (!solicitud || solicitud.estado !== 'pendiente') {
      await cliente.query('ROLLBACK');
      return res.status(409).json({ mensaje: 'La solicitud no existe o ya fue resuelta' });
    }

    if (decision === 'aprobada') {
      if (solicitud.estado_residencia !== solicitud.estado_actual) {
        await cliente.query('ROLLBACK');
        return res.status(409).json({
          mensaje: 'El estatus de la residencia cambió desde que se hizo la solicitud. Recházala y pide una nueva.'
        });
      }

      await cliente.query(
        'UPDATE residencias SET estado = $1 WHERE id = $2',
        [solicitud.estado_solicitado, solicitud.residencia_id]
      );

      // Si se reabre, el docente podrá volver a marcar el último reporte
      if (solicitud.estado_solicitado === 'en_proceso') {
        await cliente.query(
          `UPDATE reportes SET es_ultimo = FALSE
           WHERE vacante_id = (SELECT p.vacante_id FROM residencias r
                               JOIN postulaciones p ON p.id = r.postulacion_id
                               WHERE r.id = $1)`,
          [solicitud.residencia_id]
        );
      }
    }

    const { rows: [resuelta] } = await cliente.query(
      `UPDATE solicitudes_cambio_estado
       SET estado = $1, respuesta = $2, resuelta_por = $3, fecha_resolucion = NOW()
       WHERE id = $4
       RETURNING *`,
      [decision, respuesta?.trim() || null, req.usuario.id, id]
    );

    await cliente.query('COMMIT');

    res.json({
      mensaje: decision === 'aprobada'
        ? 'Solicitud aprobada: el estatus del proyecto se actualizó'
        : 'Solicitud rechazada',
      solicitud: resuelta
    });
  } catch (error) {
    if (cliente) await cliente.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ mensaje: 'Error al resolver la solicitud' });
  } finally {
    cliente?.release();
  }
};
