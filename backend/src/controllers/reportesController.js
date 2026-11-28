import fs from 'node:fs/promises';
import path from 'node:path';
import pool, { query } from '../config/database.js';
import { contextoResidencia, puedeVerResidencia, SQL_EQUIPO_DE_VACANTE } from '../utils/permisos.js';
import { idValido, textoRequerido } from '../utils/validaciones.js';

const eliminarArchivo = async (rutaOArchivo) => {
  const ruta = typeof rutaOArchivo === 'string' ? rutaOArchivo : rutaOArchivo?.path;
  if (!ruta) return;
  try {
    await fs.unlink(ruta);
  } catch (error) {
    console.error('Error al eliminar archivo:', error.message);
  }
};

// Comprueba que el archivo realmente comienza como PDF
const esPDF = async (archivo) => {
  const manejador = await fs.open(archivo.path, 'r');
  try {
    const buffer = Buffer.alloc(5);
    const lectura = await manejador.read(buffer, 0, 5, 0);
    return lectura.bytesRead === 5 && buffer.toString('ascii') === '%PDF-';
  } finally {
    await manejador.close();
  }
};

// Nombre del archivo guardado; acepta rutas con \ (subidas desde Windows) o con /
const nombreGuardado = (ruta) => path.basename(String(ruta).replace(/\\/g, '/'));

const rutaRelativa = (archivo) => path.join('uploads', 'reportes', archivo.filename);

// Contexto del reporte y la relación del usuario con él.
// El reporte es del equipo: si quien consulta es un integrante, se usa SU residencia
// (así cualquier integrante puede verlo y corregirlo); si no, la de quien lo subió.
const contextoReporte = async (reporteId, usuarioId) => {
  const { rows } = await query(
    `SELECT rep.id, rep.residencia_id, rep.vacante_id, rep.estado, rep.archivo_pdf, rep.es_ultimo,
            COALESCE((
              SELECT r.id FROM residencias r
              JOIN postulaciones p ON p.id = r.postulacion_id
              JOIN alumnos a ON a.id = p.alumno_id
              WHERE p.vacante_id = rep.vacante_id AND a.usuario_id = $2
              LIMIT 1
            ), rep.residencia_id) AS residencia_usuario
     FROM reportes rep WHERE rep.id = $1`,
    [reporteId, usuarioId]
  );
  if (!rows[0]) return null;
  const residencia = await contextoResidencia(rows[0].residencia_usuario, usuarioId);
  return { reporte: rows[0], residencia };
};

const SQL_OBSERVACIONES = `
  COALESCE((
    SELECT json_agg(json_build_object(
             'id', o.id,
             'tipo', o.tipo,
             'pagina', o.pagina,
             'contenido', o.contenido,
             'fecha_creacion', o.fecha_creacion,
             'docente', ud.nombre,
             'funcion', dv.funcion
           ) ORDER BY o.fecha_creacion)
    FROM observaciones_reporte o
    JOIN docentes d ON d.id = o.docente_id
    JOIN usuarios ud ON ud.id = d.usuario_id
    LEFT JOIN docentes_vacante dv ON dv.docente_id = d.id AND dv.vacante_id = rep.vacante_id
    WHERE o.reporte_id = rep.id
  ), '[]'::json)`;

const SQL_REPORTE = `
  rep.id, rep.residencia_id, rep.vacante_id, rep.numero_reporte, rep.fecha_entrega, rep.estado,
  rep.es_ultimo, rep.fecha_revision, rep.fecha_actualizacion,
  ur.nombre AS revisado_por_nombre,
  rep.subido_por AS subido_por_id,
  usb.nombre AS subido_por_nombre,
  ${SQL_OBSERVACIONES} AS observaciones`;

const JOIN_REVISOR = `
  LEFT JOIN docentes dr ON dr.id = rep.revisado_por
  LEFT JOIN usuarios ur ON ur.id = dr.usuario_id
  LEFT JOIN alumnos asb ON asb.id = rep.subido_por
  LEFT JOIN usuarios usb ON usb.id = asb.usuario_id`;

// Alumno sube un reporte PDF en nombre de su equipo
export const subirReporte = async (req, res) => {
  try {
    const residenciaId = idValido(req.body.residencia_id);
    const numeroReporte = idValido(req.body.numero_reporte);

    if (!residenciaId || !numeroReporte || !req.file) {
      await eliminarArchivo(req.file);
      return res.status(400).json({
        mensaje: 'Residencia, número de reporte y archivo PDF son obligatorios'
      });
    }

    const contexto = await contextoResidencia(residenciaId, req.usuario.id);
    if (contexto?.alumno_usuario_id !== req.usuario.id || contexto.estado !== 'en_proceso') {
      await eliminarArchivo(req.file);
      return res.status(403).json({ mensaje: 'Solo puedes entregar reportes de tu residencia en proceso' });
    }

    // El proyecto debe tener asesor y revisor antes de recibir reportes
    const { rows: [docentes] } = await query(
      `SELECT bool_or(funcion = 'asesor') AS asesor, bool_or(funcion = 'revisor') AS revisor
       FROM docentes_vacante WHERE vacante_id = $1`,
      [contexto.vacante_id]
    );
    if (!docentes.asesor || !docentes.revisor) {
      const faltan = [!docentes.asesor && 'asesor', !docentes.revisor && 'revisor'].filter(Boolean).join(' y ');
      await eliminarArchivo(req.file);
      return res.status(409).json({
        mensaje: `Aún no puedes entregar reportes: a tu proyecto le falta ${faltan}. Coordinación debe asignarlo.`
      });
    }

    if (!(await esPDF(req.file))) {
      await eliminarArchivo(req.file);
      return res.status(400).json({ mensaje: 'El archivo no tiene un formato PDF válido' });
    }

    const resultado = await query(
      `INSERT INTO reportes (residencia_id, vacante_id, subido_por, numero_reporte, archivo_pdf)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [residenciaId, contexto.vacante_id, contexto.alumno_id, numeroReporte, rutaRelativa(req.file)]
    );

    res.status(201).json({ mensaje: 'Reporte entregado. Todo tu equipo ya puede verlo.', reporte: resultado.rows[0] });
  } catch (error) {
    await eliminarArchivo(req.file);
    if (error.code === '23505') {
      return res.status(409).json({ mensaje: 'Tu equipo ya entregó un reporte con ese número' });
    }
    console.error(error);
    res.status(500).json({ mensaje: 'Error al subir el reporte' });
  }
};

// Cualquier integrante del equipo entrega la versión corregida de un reporte regresado
export const reemplazarReporte = async (req, res) => {
  try {
    const id = idValido(req.params.id);
    if (!id || !req.file) {
      await eliminarArchivo(req.file);
      return res.status(400).json({ mensaje: 'Adjunta el PDF corregido' });
    }

    const contexto = await contextoReporte(id, req.usuario.id);
    if (!contexto || contexto.residencia?.alumno_usuario_id !== req.usuario.id) {
      await eliminarArchivo(req.file);
      return res.status(404).json({ mensaje: 'Reporte no encontrado' });
    }
    if (contexto.reporte.estado !== 'rechazado' || contexto.residencia.estado !== 'en_proceso') {
      await eliminarArchivo(req.file);
      return res.status(409).json({
        mensaje: 'Solo puedes corregir reportes que el docente regresó mientras tu residencia está en proceso'
      });
    }
    if (!(await esPDF(req.file))) {
      await eliminarArchivo(req.file);
      return res.status(400).json({ mensaje: 'El archivo no tiene un formato PDF válido' });
    }

    const resultado = await query(
      `UPDATE reportes
       SET archivo_pdf = $1, estado = 'pendiente', fecha_actualizacion = NOW(),
           revisado_por = NULL, fecha_revision = NULL, subido_por = $3
       WHERE id = $2 AND estado = 'rechazado'
       RETURNING *`,
      [rutaRelativa(req.file), id, contexto.residencia.alumno_id]
    );

    if (resultado.rows.length === 0) {
      await eliminarArchivo(req.file);
      return res.status(409).json({ mensaje: 'El reporte cambió de estado; recarga la página' });
    }

    await eliminarArchivo(path.resolve('uploads', 'reportes', nombreGuardado(contexto.reporte.archivo_pdf)));
    res.json({ mensaje: 'Corrección entregada', reporte: resultado.rows[0] });
  } catch (error) {
    await eliminarArchivo(req.file);
    console.error(error);
    res.status(500).json({ mensaje: 'Error al entregar la corrección' });
  }
};

export const misReportes = async (req, res) => {
  try {
    const resultado = await query(
      `SELECT ${SQL_REPORTE}
       FROM reportes rep
       ${JOIN_REVISOR}
       WHERE rep.vacante_id IN (
         SELECT p.vacante_id FROM postulaciones p
         JOIN alumnos a ON a.id = p.alumno_id
         WHERE a.usuario_id = $1 AND p.estado = 'aceptado'
       )
       ORDER BY rep.numero_reporte ASC`,
      [req.usuario.id]
    );
    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al consultar mis reportes' });
  }
};

// Coordinación: todos los reportes (solo consulta)
export const listarReportes = async (req, res) => {
  try {
    const resultado = await query(
      `SELECT ${SQL_REPORTE}, usb.nombre AS alumno, v.titulo AS vacante,
              ${SQL_EQUIPO_DE_VACANTE('v')} AS equipo
       FROM reportes rep
       JOIN vacantes v ON v.id = rep.vacante_id
       ${JOIN_REVISOR}
       ORDER BY rep.fecha_entrega DESC`
    );
    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al consultar reportes' });
  }
};

// Reportes de una residencia (alumno dueño, docente asignado, coordinación)
export const reportesDeResidencia = async (req, res) => {
  try {
    const id = idValido(req.params.id);
    const contexto = id && await contextoResidencia(id, req.usuario.id);

    if (!contexto) return res.status(404).json({ mensaje: 'Residencia no encontrada' });
    if (req.usuario.rol === 'empresa' || !puedeVerResidencia(req.usuario, contexto)) {
      return res.status(403).json({ mensaje: 'No tienes acceso a estos reportes' });
    }

    const resultado = await query(
      `SELECT ${SQL_REPORTE}
       FROM reportes rep
       ${JOIN_REVISOR}
       WHERE rep.vacante_id = $1
       ORDER BY rep.numero_reporte ASC`,
      [contexto.vacante_id]
    );
    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al consultar reportes' });
  }
};

// Docente: reportes por revisar en sus proyectos
export const reportesPorRevisar = async (req, res) => {
  try {
    const resultado = await query(
      `SELECT rep.id, rep.residencia_id, rep.vacante_id, rep.numero_reporte, rep.fecha_entrega,
              rep.fecha_actualizacion, usb.nombre AS alumno, v.titulo AS vacante, dv.funcion,
              v.cupo AS cupo_equipo
       FROM reportes rep
       JOIN residencias r ON rep.residencia_id = r.id
       JOIN vacantes v ON v.id = rep.vacante_id
       LEFT JOIN alumnos asb ON asb.id = rep.subido_por
       LEFT JOIN usuarios usb ON usb.id = asb.usuario_id
       JOIN docentes_vacante dv ON dv.vacante_id = v.id
       JOIN docentes d ON d.id = dv.docente_id
       WHERE d.usuario_id = $1 AND rep.estado = 'pendiente' AND r.estado = 'en_proceso'
       ORDER BY COALESCE(rep.fecha_actualizacion, rep.fecha_entrega) ASC`,
      [req.usuario.id]
    );
    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al consultar reportes por revisar' });
  }
};

// Docente revisa un reporte:
//   aprobado      → visto bueno al avance
//   rechazado     → regresa al alumno para corregir
//   no_concluido  → solo si es el último reporte: el proyecto no se concluyó
// Si es_ultimo es true, las residencias del equipo pasan a "finalizada" (aprobado) o "no_concluida".
export const revisarReporte = async (req, res) => {
  const id = idValido(req.params.id);
  const { decision } = req.body;
  const esUltimo = req.body.es_ultimo === true;

  if (!['aprobado', 'rechazado', 'no_concluido'].includes(decision)) {
    return res.status(400).json({ mensaje: 'La decisión debe ser aprobado, rechazado o no_concluido' });
  }
  if (decision === 'no_concluido' && !esUltimo) {
    return res.status(400).json({ mensaje: 'Solo el último reporte puede marcar el proyecto como no concluido' });
  }
  if (decision === 'rechazado' && esUltimo) {
    return res.status(400).json({
      mensaje: 'Para cerrar el proyecto con el último reporte, da el visto bueno o márcalo como no concluido'
    });
  }

  let cliente;

  try {
    const contexto = id && await contextoReporte(id, req.usuario.id);
    if (!contexto) return res.status(404).json({ mensaje: 'Reporte no encontrado' });
    if (!contexto.residencia?.funcion_docente) {
      return res.status(403).json({ mensaje: 'No eres asesor ni revisor de este proyecto' });
    }

    cliente = await pool.connect();
    await cliente.query('BEGIN');

    const { rows: [estadoActual] } = await cliente.query(
      `SELECT rep.estado, r.estado AS estado_residencia
       FROM reportes rep JOIN residencias r ON r.id = rep.residencia_id
       WHERE rep.id = $1
       FOR UPDATE OF rep, r`,
      [id]
    );

    if (estadoActual.estado !== 'pendiente' || estadoActual.estado_residencia !== 'en_proceso') {
      await cliente.query('ROLLBACK');
      return res.status(409).json({ mensaje: 'Este reporte ya fue revisado o la residencia no está en proceso' });
    }

    if (esUltimo && decision === 'aprobado') {
      const { rows: [sinVistoBueno] } = await cliente.query(
        `SELECT COUNT(*)::int AS total FROM reportes
         WHERE vacante_id = $1 AND id <> $2 AND estado <> 'aprobado'`,
        [contexto.reporte.vacante_id, id]
      );
      if (sinVistoBueno.total > 0) {
        await cliente.query('ROLLBACK');
        return res.status(409).json({
          mensaje: 'Antes de finalizar, todos los reportes anteriores deben tener visto bueno'
        });
      }
    }

    const { rows: [reporte] } = await cliente.query(
      `UPDATE reportes
       SET estado = $1, es_ultimo = $2, revisado_por = $3, fecha_revision = NOW()
       WHERE id = $4
       RETURNING *`,
      [decision === 'aprobado' ? 'aprobado' : 'rechazado', esUltimo,
       contexto.residencia.docente_id, id]
    );

    let estadoResidencia = estadoActual.estado_residencia;
    if (esUltimo) {
      estadoResidencia = decision === 'aprobado' ? 'finalizada' : 'no_concluida';
      // El proyecto es del equipo: se cierra para todos los integrantes en proceso
      await cliente.query(
        `UPDATE residencias r SET estado = $1
         FROM postulaciones p
         WHERE p.id = r.postulacion_id AND p.vacante_id = $2 AND r.estado = 'en_proceso'`,
        [estadoResidencia, contexto.reporte.vacante_id]
      );
    }

    await cliente.query('COMMIT');

    const mensajes = {
      aprobado: esUltimo ? 'Visto bueno al último reporte. El proyecto quedó finalizado.' : 'Visto bueno registrado',
      rechazado: 'Reporte regresado al equipo para corrección',
      no_concluido: 'El proyecto quedó como no concluido'
    };

    res.json({ mensaje: mensajes[decision], reporte, estado_residencia: estadoResidencia });
  } catch (error) {
    if (cliente) await cliente.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ mensaje: 'Error al revisar el reporte' });
  } finally {
    cliente?.release();
  }
};

// Docente marca un error, deja un comentario o propone una idea
export const crearObservacion = async (req, res) => {
  try {
    const id = idValido(req.params.id);
    const { tipo, contenido } = req.body;
    const pagina = req.body.pagina == null || req.body.pagina === '' ? null : Number(req.body.pagina);

    if (!['error', 'comentario', 'propuesta'].includes(tipo) || !textoRequerido(contenido)) {
      return res.status(400).json({ mensaje: 'Indica el tipo (error, comentario o propuesta) y el texto' });
    }
    if (pagina !== null && (!Number.isInteger(pagina) || pagina < 1)) {
      return res.status(400).json({ mensaje: 'La página debe ser un número entero de 1 o más' });
    }

    const contexto = id && await contextoReporte(id, req.usuario.id);
    if (!contexto) return res.status(404).json({ mensaje: 'Reporte no encontrado' });
    if (!contexto.residencia?.funcion_docente) {
      return res.status(403).json({ mensaje: 'No eres asesor ni revisor de este proyecto' });
    }

    const resultado = await query(
      `INSERT INTO observaciones_reporte (reporte_id, docente_id, tipo, pagina, contenido)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, contexto.residencia.docente_id, tipo, pagina, contenido.trim()]
    );

    res.status(201).json({ mensaje: 'Observación registrada', observacion: resultado.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al registrar la observación' });
  }
};

// Descargar PDF: alumno dueño, empresa del proyecto, docente asignado o coordinación
export const descargarReporte = async (req, res) => {
  try {
    const id = idValido(req.params.id);
    if (!id) return res.status(400).json({ mensaje: 'ID de reporte inválido' });

    const contexto = await contextoReporte(id, req.usuario.id);
    if (!contexto) return res.status(404).json({ mensaje: 'Reporte no encontrado' });
    if (!puedeVerResidencia(req.usuario, contexto.residencia)) {
      return res.status(403).json({ mensaje: 'No tienes permiso para consultar este PDF' });
    }

    // Evitar utilizar rutas arbitrarias de la base de datos
    const nombreArchivo = nombreGuardado(contexto.reporte.archivo_pdf);
    if (!/^[0-9a-f-]{36}\.pdf$/i.test(nombreArchivo)) {
      return res.status(400).json({ mensaje: 'Ruta del archivo inválida' });
    }

    return res.download(
      path.resolve('uploads', 'reportes', nombreArchivo),
      `reporte-${id}.pdf`,
      (error) => {
        if (error) {
          console.error('Error al descargar PDF:', error.message);
          if (!res.headersSent) {
            res.status(error.status || 500).json({ mensaje: 'No se pudo descargar el archivo PDF' });
          }
        }
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al consultar el PDF' });
  }
};
