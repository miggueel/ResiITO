
import { query } from '../config/database.js';

// Empresa registra evaluación de su residente
export const crearEvaluacion = async (req, res) => {
  try {
    const { residencia_id, calificacion, observaciones } = req.body;

    if (
      !Number.isInteger(residencia_id) ||
      residencia_id <= 0 ||
      typeof calificacion !== 'number' ||
      !Number.isFinite(calificacion) ||
      calificacion < 0 ||
      calificacion > 100
    ) {
      return res.status(400).json({
        mensaje: 'Residencia y calificación entre 0 y 100 son obligatorias'
      });
    }

    // Comprobar que la residencia pertenece a la empresa
    const residencia = await query(
      `SELECT r.id
       FROM residencias r
       JOIN postulaciones p ON r.postulacion_id = p.id
       JOIN vacantes v ON p.vacante_id = v.id
       JOIN empresas e ON v.empresa_id = e.id
       WHERE r.id = $1
         AND e.usuario_id = $2
         AND r.estado IN ('en_proceso', 'finalizada')`,
      [residencia_id, req.usuario.id]
    );

    if (residencia.rows.length === 0) {
      return res.status(403).json({
        mensaje: 'No puedes evaluar esta residencia'
      });
    }

    const resultado = await query(
      `INSERT INTO evaluaciones (
         residencia_id,
         calificacion,
         observaciones
       )
       VALUES ($1, $2, $3)
       RETURNING *`,
      [residencia_id, calificacion, observaciones ?? null]
    );

    return res.status(201).json({
      mensaje: 'Evaluación registrada correctamente',
      evaluacion: resultado.rows[0]
    });

  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        mensaje: 'Esta residencia ya tiene una evaluación'
      });
    }

    console.error(error);

    return res.status(500).json({
      mensaje: 'Error al registrar evaluación'
    });
  }
};

// Coordinador consulta todas las evaluaciones
export const listarEvaluaciones = async (req, res) => {
  try {
    const resultado = await query(
      `SELECT
         ev.*,
         u.nombre AS alumno,
         a.matricula,
         e.nombre AS empresa
       FROM evaluaciones ev
       JOIN residencias r ON ev.residencia_id = r.id
       JOIN postulaciones p ON r.postulacion_id = p.id
       JOIN alumnos a ON p.alumno_id = a.id
       JOIN usuarios u ON a.usuario_id = u.id
       JOIN vacantes v ON p.vacante_id = v.id
       JOIN empresas e ON v.empresa_id = e.id
       ORDER BY ev.id DESC`
    );

    return res.json(resultado.rows);

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: 'Error al consultar evaluaciones'
    });
  }
};

// Alumno consulta sus evaluaciones
export const misEvaluaciones = async (req, res) => {
  try {
    const resultado = await query(
      `SELECT
         ev.id,
         ev.residencia_id,
         ev.calificacion,
         ev.observaciones,
         ev.fecha_evaluacion
       FROM evaluaciones ev
       JOIN residencias r ON ev.residencia_id = r.id
       JOIN postulaciones p ON r.postulacion_id = p.id
       JOIN alumnos a ON p.alumno_id = a.id
       WHERE a.usuario_id = $1
       ORDER BY ev.id DESC`,
      [req.usuario.id]
    );

    return res.json(resultado.rows);

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: 'Error al consultar mis evaluaciones'
    });
  }
};
