
import fs from 'node:fs/promises';
import path from 'node:path';
import { query } from '../config/database.js';

// Eliminar archivo si falla el registro en PostgreSQL
const eliminarArchivo = async (archivo) => {
  if (!archivo) return;

  try {
    await fs.unlink(archivo.path);
  } catch (error) {
    console.error('Error al eliminar archivo:', error.message);
  }
};

// Alumno sube su reporte PDF
export const subirReporte = async (req, res) => {
  try {
    const residenciaId = Number(req.body.residencia_id);
    const numeroReporte = Number(req.body.numero_reporte);

    if (
      !Number.isInteger(residenciaId) ||
      residenciaId <= 0 ||
      !Number.isInteger(numeroReporte) ||
      numeroReporte <= 0 ||
      !req.file
    ) {
      await eliminarArchivo(req.file);

      return res.status(400).json({
        mensaje: 'Residencia, número de reporte y archivo PDF son obligatorios'
      });
    }

    // Verificar que la residencia pertenece al alumno
    const residencia = await query(
      `SELECT r.id
       FROM residencias r
       JOIN postulaciones p ON r.postulacion_id = p.id
       JOIN alumnos a ON p.alumno_id = a.id
       WHERE r.id = $1
         AND a.usuario_id = $2
         AND r.estado = 'en_proceso'`,
      [residenciaId, req.usuario.id]
    );

    if (residencia.rows.length === 0) {
      await eliminarArchivo(req.file);

      return res.status(403).json({
        mensaje: 'No puedes subir reportes a esta residencia'
      });
    }

    // Verificar que el archivo realmente comienza como PDF
    const archivo = await fs.open(req.file.path, 'r');
    let firma;

    try {
      const buffer = Buffer.alloc(5);
      const lectura = await archivo.read(buffer, 0, 5, 0);
      firma = lectura.bytesRead === 5
        ? buffer.toString('ascii')
        : '';
    } finally {
      await archivo.close();
    }

    if (firma !== '%PDF-') {
      await eliminarArchivo(req.file);

      return res.status(400).json({
        mensaje: 'El archivo no tiene un formato PDF válido'
      });
    }

    const rutaArchivo = path.join(
      'uploads',
      'reportes',
      req.file.filename
    );

    const resultado = await query(
      `INSERT INTO reportes (
        residencia_id,
        numero_reporte,
        archivo_pdf
      )
      VALUES ($1, $2, $3)
      RETURNING *`,
      [residenciaId, numeroReporte, rutaArchivo]
    );

    return res.status(201).json({
      mensaje: 'Reporte PDF registrado correctamente',
      reporte: resultado.rows[0]
    });

  } catch (error) {
    await eliminarArchivo(req.file);

    if (error.code === '23505') {
      return res.status(409).json({
        mensaje: 'Ya existe un reporte con ese número para esta residencia'
      });
    }

    console.error(error);

    return res.status(500).json({
      mensaje: 'Error al subir el reporte'
    });
  }
};

// Alumno consulta sus reportes
export const misReportes = async (req, res) => {
  try {
    const resultado = await query(
      `SELECT
         rep.id,
         rep.residencia_id,
         rep.numero_reporte,
         rep.fecha_entrega,
         rep.estado
       FROM reportes rep
       JOIN residencias r ON rep.residencia_id = r.id
       JOIN postulaciones p ON r.postulacion_id = p.id
       JOIN alumnos a ON p.alumno_id = a.id
       WHERE a.usuario_id = $1
       ORDER BY rep.numero_reporte ASC`,
      [req.usuario.id]
    );

    return res.json(resultado.rows);

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: 'Error al consultar mis reportes'
    });
  }
};

// Coordinador consulta todos los reportes
export const listarReportes = async (req, res) => {
  try {
    const resultado = await query(
      `SELECT
         rep.*,
         u.nombre AS alumno,
         a.matricula
       FROM reportes rep
       JOIN residencias r ON rep.residencia_id = r.id
       JOIN postulaciones p ON r.postulacion_id = p.id
       JOIN alumnos a ON p.alumno_id = a.id
       JOIN usuarios u ON a.usuario_id = u.id
       ORDER BY rep.fecha_entrega DESC`
    );

    return res.json(resultado.rows);

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: 'Error al consultar reportes'
    });
  }
};

// Coordinador aprueba o rechaza un reporte
export const revisarReporte = async (req, res) => {
  try {
    const reporteId = Number(req.params.id);
    const { estado } = req.body;

    if (!Number.isInteger(reporteId) || reporteId <= 0) {
      return res.status(400).json({
        mensaje: 'ID de reporte inválido'
      });
    }

    if (!['aprobado', 'rechazado'].includes(estado)) {
      return res.status(400).json({
        mensaje: 'El estado debe ser aprobado o rechazado'
      });
    }

    const resultado = await query(
      `UPDATE reportes
       SET estado = $1
       WHERE id = $2
         AND estado = 'pendiente'
       RETURNING *`,
      [estado, reporteId]
    );

    if (resultado.rows.length === 0) {
      return res.status(409).json({
        mensaje: 'Reporte no encontrado o ya revisado'
      });
    }

    return res.json({
      mensaje: 'Reporte revisado correctamente',
      reporte: resultado.rows[0]
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: 'Error al revisar el reporte'
    });
  }
};


// Descargar PDF con autenticación y permisos
export const descargarReporte = async (req, res) => {
  try {
    const reporteId = Number(req.params.id);

    if (!Number.isInteger(reporteId) || reporteId <= 0) {
      return res.status(400).json({
        mensaje: 'ID de reporte inválido'
      });
    }

    const resultado = await query(
      `SELECT
         rep.id,
         rep.archivo_pdf,
         a.usuario_id AS alumno_usuario_id,
         e.usuario_id AS empresa_usuario_id
       FROM reportes rep
       JOIN residencias r ON rep.residencia_id = r.id
       JOIN postulaciones p ON r.postulacion_id = p.id
       JOIN alumnos a ON p.alumno_id = a.id
       JOIN vacantes v ON p.vacante_id = v.id
       JOIN empresas e ON v.empresa_id = e.id
       WHERE rep.id = $1`,
      [reporteId]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        mensaje: 'Reporte no encontrado'
      });
    }

    const reporte = resultado.rows[0];
    const usuario = req.usuario;

    const autorizado =
      usuario.rol === 'coordinador' ||
      (
        usuario.rol === 'alumno' &&
        usuario.id === reporte.alumno_usuario_id
      ) ||
      (
        usuario.rol === 'empresa' &&
        usuario.id === reporte.empresa_usuario_id
      );

    if (!autorizado) {
      return res.status(403).json({
        mensaje: 'No tienes permiso para consultar este PDF'
      });
    }

    // Evitar utilizar rutas arbitrarias de la base de datos
    const nombreArchivo = path.basename(reporte.archivo_pdf);

    if (!/^[0-9a-f-]{36}\.pdf$/i.test(nombreArchivo)) {
      return res.status(400).json({
        mensaje: 'Ruta del archivo inválida'
      });
    }

    const rutaCompleta = path.resolve(
      'uploads',
      'reportes',
      nombreArchivo
    );

    return res.download(
      rutaCompleta,
      `reporte-${reporte.id}.pdf`,
      (error) => {
        if (error) {
          console.error('Error al descargar PDF:', error.message);

          if (!res.headersSent) {
            res.status(error.status || 500).json({
              mensaje: 'No se pudo descargar el archivo PDF'
            });
          }
        }
      }
    );

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: 'Error al consultar el PDF'
    });
  }
};
