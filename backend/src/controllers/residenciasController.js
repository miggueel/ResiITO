
import { query } from '../config/database.js';

// Consultar postulaciones aceptadas pendientes
export const listarPendientes = async (req, res) => {
  try {
    const resultado = await query(
      `SELECT
         p.id AS postulacion_id,
         u.nombre AS alumno,
         a.matricula,
         v.titulo AS vacante,
         e.nombre AS empresa
       FROM postulaciones p
       JOIN alumnos a ON p.alumno_id = a.id
       JOIN usuarios u ON a.usuario_id = u.id
       JOIN vacantes v ON p.vacante_id = v.id
       JOIN empresas e ON v.empresa_id = e.id
       LEFT JOIN residencias r ON r.postulacion_id = p.id
       WHERE p.estado = 'aceptado'
         AND r.id IS NULL
       ORDER BY p.id DESC`
    );

    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: 'Error al consultar pendientes'
    });
  }
};

// Aprobar una residencia
export const aprobarResidencia = async (req, res) => {
  try {
    const { postulacion_id, asesor, fecha_inicio, fecha_fin } = req.body;

    if (
      !Number.isInteger(postulacion_id) ||
      postulacion_id <= 0 ||
      typeof asesor !== 'string' ||
      !asesor.trim() ||
      typeof fecha_inicio !== 'string' ||
      typeof fecha_fin !== 'string'
    ) {
      return res.status(400).json({
        mensaje: 'Datos incompletos o inválidos'
      });
    }

    const fechaValida = (fecha) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;

      const valor = new Date(`${fecha}T00:00:00Z`);

      return !Number.isNaN(valor.getTime()) &&
        valor.toISOString().slice(0, 10) === fecha;
    };

    if (
      !fechaValida(fecha_inicio) ||
      !fechaValida(fecha_fin) ||
      fecha_inicio > fecha_fin
    ) {
      return res.status(400).json({
        mensaje: 'Las fechas son inválidas'
      });
    }

    const resultado = await query(
      `INSERT INTO residencias (
         postulacion_id,
         asesor,
         fecha_inicio,
         fecha_fin,
         estado
       )
       SELECT p.id, $2, $3, $4, 'aprobada'
       FROM postulaciones p
       WHERE p.id = $1 AND p.estado = 'aceptado'
       ON CONFLICT (postulacion_id) DO NOTHING
       RETURNING *`,
      [postulacion_id, asesor.trim(), fecha_inicio, fecha_fin]
    );

    if (resultado.rows.length === 0) {
      return res.status(409).json({
        mensaje: 'La postulación no está aceptada o ya tiene residencia'
      });
    }

    res.status(201).json({
      mensaje: 'Residencia aprobada correctamente',
      residencia: resultado.rows[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: 'Error al aprobar residencia'
    });
  }
};

// Consultar todas las residencias
export const listarResidencias = async (req, res) => {
  try {
    const resultado = await query(
      `SELECT
         r.*,
         u.nombre AS alumno,
         a.matricula,
         v.titulo AS vacante,
         e.nombre AS empresa
       FROM residencias r
       JOIN postulaciones p ON r.postulacion_id = p.id
       JOIN alumnos a ON p.alumno_id = a.id
       JOIN usuarios u ON a.usuario_id = u.id
       JOIN vacantes v ON p.vacante_id = v.id
       JOIN empresas e ON v.empresa_id = e.id
       ORDER BY r.id DESC`
    );

    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: 'Error al consultar residencias'
    });
  }
};

// Alumno consulta sus residencias
export const misResidencias = async (req, res) => {
  try {
    const resultado = await query(
      `SELECT
         r.*,
         v.titulo AS vacante,
         e.nombre AS empresa
       FROM residencias r
       JOIN postulaciones p ON r.postulacion_id = p.id
       JOIN alumnos a ON p.alumno_id = a.id
       JOIN vacantes v ON p.vacante_id = v.id
       JOIN empresas e ON v.empresa_id = e.id
       WHERE a.usuario_id = $1
       ORDER BY r.id DESC`,
      [req.usuario.id]
    );

    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: 'Error al consultar mis residencias'
    });
  }
};

// Cambiar estado de residencia con validaciones
export const cambiarEstado = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { estado } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        mensaje: 'ID de residencia inválido'
      });
    }

    const transiciones = {
      aprobada: 'en_proceso',
      en_proceso: 'finalizada',
      finalizada: 'liberada'
    };

    const estadoAnterior = Object.keys(transiciones).find(
      actual => transiciones[actual] === estado
    );

    if (!estadoAnterior) {
      return res.status(400).json({
        mensaje: 'Estado no permitido'
      });
    }

    // Actualización atómica: solo cambia el estado si
    // se cumplen todas las condiciones necesarias.
    const resultado = await query(
      `UPDATE residencias r
       SET estado = $1
       WHERE r.id = $2
         AND r.estado = $3

         -- Para finalizar o liberar debe existir
         -- al menos un reporte aprobado.
         AND (
           $1 NOT IN ('finalizada', 'liberada')
           OR EXISTS (
             SELECT 1
             FROM reportes rep
             WHERE rep.residencia_id = r.id
               AND rep.estado = 'aprobado'
           )
         )

         -- No debe haber reportes sin aprobar.
         AND (
           $1 NOT IN ('finalizada', 'liberada')
           OR NOT EXISTS (
             SELECT 1
             FROM reportes rep
             WHERE rep.residencia_id = r.id
               AND rep.estado <> 'aprobado'
           )
         )

         -- Para liberar debe existir evaluación.
         AND (
           $1 <> 'liberada'
           OR EXISTS (
             SELECT 1
             FROM evaluaciones ev
             WHERE ev.residencia_id = r.id
           )
         )

       RETURNING *`,
      [estado, id, estadoAnterior]
    );

    if (resultado.rows.length === 0) {
      const residencia = await query(
        `SELECT estado
         FROM residencias
         WHERE id = $1`,
        [id]
      );

      if (residencia.rows.length === 0) {
        return res.status(404).json({
          mensaje: 'Residencia no encontrada'
        });
      }

      if (residencia.rows[0].estado !== estadoAnterior) {
        return res.status(409).json({
          mensaje: 'Transición de estado no permitida'
        });
      }

      return res.status(409).json({
        mensaje:
          'No se puede actualizar la residencia. Verifica que exista al menos un reporte aprobado, que todos los reportes estén aprobados y, para liberar, que exista una evaluación.'
      });
    }

    res.json({
      mensaje: 'Estado actualizado correctamente',
      residencia: resultado.rows[0]
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje: 'Error al actualizar estado'
    });
  }
};
