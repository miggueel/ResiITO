import { query } from '../config/database.js';
import {
  contextoResidencia,
  puedeVerResidencia,
  SQL_DOCENTES_DE_VACANTE,
  SQL_EQUIPO_DE_VACANTE
} from '../utils/permisos.js';
import { idValido } from '../utils/validaciones.js';

const SQL_BASE = `
  SELECT
    r.*,
    u.nombre AS alumno,
    u.correo AS correo_alumno,
    a.id AS alumno_id,
    a.matricula,
    a.carrera,
    v.id AS vacante_id,
    v.titulo AS vacante,
    e.nombre AS empresa,
    v.cupo AS cupo_equipo,
    ${SQL_DOCENTES_DE_VACANTE('v')} AS docentes,
    ${SQL_EQUIPO_DE_VACANTE('v')} AS equipo,
    -- Los reportes son del equipo (proyecto), no de cada alumno
    (SELECT COUNT(*)::int FROM reportes rep WHERE rep.vacante_id = v.id) AS total_reportes,
    (SELECT COUNT(*)::int FROM reportes rep
     WHERE rep.vacante_id = v.id AND rep.estado = 'aprobado') AS reportes_aprobados,
    (SELECT COUNT(*)::int FROM reportes rep
     WHERE rep.vacante_id = v.id AND rep.estado = 'pendiente') AS reportes_pendientes,
    ev.id AS evaluacion_id,
    ev.calificacion,
    (SELECT s.id FROM solicitudes_cambio_estado s
     WHERE s.residencia_id = r.id AND s.estado = 'pendiente') AS solicitud_pendiente_id
  FROM residencias r
  JOIN postulaciones p ON r.postulacion_id = p.id
  JOIN alumnos a ON p.alumno_id = a.id
  JOIN usuarios u ON a.usuario_id = u.id
  JOIN vacantes v ON p.vacante_id = v.id
  JOIN empresas e ON v.empresa_id = e.id
  LEFT JOIN evaluaciones ev ON ev.residencia_id = r.id`;

// Coordinación: todas las residencias
export const listarResidencias = async (req, res) => {
  try {
    const resultado = await query(`${SQL_BASE} ORDER BY r.id DESC`);
    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al consultar residencias' });
  }
};

// Alumno: sus residencias, con sus asesores y revisores
export const misResidencias = async (req, res) => {
  try {
    const resultado = await query(
      `${SQL_BASE} WHERE a.usuario_id = $1 ORDER BY r.id DESC`,
      [req.usuario.id]
    );
    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al consultar mis residencias' });
  }
};

// Empresa: residencias de sus proyectos
export const residenciasEmpresa = async (req, res) => {
  try {
    const resultado = await query(
      `${SQL_BASE} WHERE e.usuario_id = $1 ORDER BY r.id DESC`,
      [req.usuario.id]
    );
    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al consultar residencias de la empresa' });
  }
};

// Docente: residencias de los proyectos donde es asesor o revisor
export const residenciasDocente = async (req, res) => {
  try {
    const resultado = await query(
      `SELECT base.*, dv.funcion AS mi_funcion
       FROM (${SQL_BASE}) base
       JOIN docentes_vacante dv ON dv.vacante_id = base.vacante_id
       JOIN docentes d ON d.id = dv.docente_id
       WHERE d.usuario_id = $1
       ORDER BY base.reportes_pendientes DESC, base.id DESC`,
      [req.usuario.id]
    );
    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al consultar tus residentes' });
  }
};

// Detalle de una residencia (coordinación, alumno, empresa o docente asignado)
export const obtenerResidencia = async (req, res) => {
  try {
    const id = idValido(req.params.id);
    const contexto = id && await contextoResidencia(id, req.usuario.id);

    if (!contexto) return res.status(404).json({ mensaje: 'Residencia no encontrada' });
    if (!puedeVerResidencia(req.usuario, contexto)) {
      return res.status(403).json({ mensaje: 'No tienes acceso a esta residencia' });
    }

    const resultado = await query(`${SQL_BASE} WHERE r.id = $1`, [id]);
    res.json({ ...resultado.rows[0], mi_funcion: contexto.funcion_docente ?? null });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al consultar la residencia' });
  }
};

// Coordinación: iniciar una residencia aprobada o liberar una finalizada.
// "Finalizada" y "no concluida" las decide el docente al revisar el último reporte.
export const cambiarEstado = async (req, res) => {
  try {
    const id = idValido(req.params.id);
    const { estado } = req.body;

    if (!id) return res.status(400).json({ mensaje: 'ID de residencia inválido' });

    const transiciones = { en_proceso: 'aprobada', liberada: 'finalizada' };
    const estadoAnterior = transiciones[estado];

    if (!estadoAnterior) {
      return res.status(400).json({
        mensaje: 'Coordinación solo puede iniciar (en_proceso) o liberar (liberada) una residencia'
      });
    }

    const resultado = await query(
      `UPDATE residencias r
       SET estado = $1
       WHERE r.id = $2
         AND r.estado = $3
         AND ($1 <> 'liberada' OR EXISTS (
           SELECT 1 FROM evaluaciones ev WHERE ev.residencia_id = r.id
         ))
       RETURNING *`,
      [estado, id, estadoAnterior]
    );

    if (resultado.rows.length === 0) {
      const actual = await query('SELECT estado FROM residencias WHERE id = $1', [id]);
      if (actual.rows.length === 0) {
        return res.status(404).json({ mensaje: 'Residencia no encontrada' });
      }
      if (actual.rows[0].estado !== estadoAnterior) {
        return res.status(409).json({ mensaje: 'Transición de estado no permitida' });
      }
      return res.status(409).json({
        mensaje: 'No se puede liberar: la empresa aún no registra la evaluación del residente.'
      });
    }

    res.json({ mensaje: 'Estado actualizado correctamente', residencia: resultado.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al actualizar estado' });
  }
};
