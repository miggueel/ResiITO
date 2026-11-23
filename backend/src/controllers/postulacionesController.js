
import { query } from '../config/database.js';

// POST: Alumno se postula
export const crearPostulacion = async (req, res) => {
  try {
    const { vacante_id } = req.body;

    if (!Number.isInteger(vacante_id) || vacante_id <= 0) {
      return res.status(400).json({
        mensaje: 'Debes proporcionar un vacante_id válido'
      });
    }

    const alumno = await query(
      'SELECT id FROM alumnos WHERE usuario_id = $1',
      [req.usuario.id]
    );

    if (alumno.rows.length === 0) {
      return res.status(403).json({
        mensaje: 'No tienes un perfil de alumno registrado'
      });
    }

    const vacante = await query(
      'SELECT id FROM vacantes WHERE id = $1 AND estado = $2',
      [vacante_id, 'activa']
    );

    if (vacante.rows.length === 0) {
      return res.status(404).json({
        mensaje: 'Vacante no encontrada o no está activa'
      });
    }

    const resultado = await query(
      `INSERT INTO postulaciones (alumno_id, vacante_id)
       VALUES ($1, $2)
       RETURNING *`,
      [alumno.rows[0].id, vacante_id]
    );

    res.status(201).json({
      mensaje: 'Postulación registrada correctamente',
      postulacion: resultado.rows[0]
    });

  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        mensaje: 'Ya te postulaste a esta vacante'
      });
    }

    console.error(error);
    res.status(500).json({
      mensaje: 'Error al registrar postulación'
    });
  }
};

// GET: Alumno consulta sus postulaciones
export const misPostulaciones = async (req, res) => {
  try {
    const resultado = await query(
      `SELECT
         p.id,
         p.estado,
         p.fecha_postulacion,
         v.id AS vacante_id,
         v.titulo,
         e.nombre AS empresa
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
    res.status(500).json({
      mensaje: 'Error al consultar postulaciones'
    });
  }
};

// GET: Empresa consulta postulaciones recibidas
export const postulacionesEmpresa = async (req, res) => {
  try {
    const resultado = await query(
      `SELECT
         p.id,
         p.estado,
         p.fecha_postulacion,
         v.id AS vacante_id,
         v.titulo AS vacante,
         u.nombre AS alumno,
         u.correo,
         a.matricula,
         a.carrera
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
    res.status(500).json({
      mensaje: 'Error al consultar postulaciones de empresa'
    });
  }
};

// PATCH: Empresa acepta o rechaza
export const actualizarEstado = async (req, res) => {
  try {
    const { estado } = req.body;
    const { id } = req.params;

    if (!['aceptado', 'rechazado'].includes(estado)) {
      return res.status(400).json({
        mensaje: 'Estado permitido: aceptado o rechazado'
      });
    }

    const resultado = await query(
      `UPDATE postulaciones p
       SET estado = $1
       FROM vacantes v
       JOIN empresas e ON v.empresa_id = e.id
       WHERE p.id = $2
         AND p.vacante_id = v.id
         AND e.usuario_id = $3
         AND p.estado = 'pendiente'
       RETURNING p.*`,
      [estado, id, req.usuario.id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        mensaje: 'Postulación no encontrada, no autorizada o ya procesada'
      });
    }

    res.json({
      mensaje: `Postulación ${estado} correctamente`,
      postulacion: resultado.rows[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: 'Error al actualizar postulación'
    });
  }
};
