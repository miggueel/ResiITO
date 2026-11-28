import pool, { query } from '../config/database.js';
import { cerrarPostulacionesSiCompleto } from './postulacionesController.js';
import { SQL_DOCENTES_DE_VACANTE, SQL_EQUIPO_DE_VACANTE } from '../utils/permisos.js';
import { idValido, textoOpcional, textoRequerido } from '../utils/validaciones.js';

const SQL_ACEPTADOS = (alias) => `
  (SELECT COUNT(*)::int FROM postulaciones p
   WHERE p.vacante_id = ${alias}.id AND p.estado = 'aceptado')`;

const obtenerEmpresa = async (usuarioId) =>
  (await query('SELECT id FROM empresas WHERE usuario_id = $1', [usuarioId])).rows[0];

// GET público: solo proyectos aprobados y abiertos
export const listarVacantes = async (req, res) => {
  try {
    const { carrera } = req.query;

    const resultado = await query(
      `SELECT v.id, v.titulo, v.descripcion, v.carrera, v.requisitos, v.estado,
              v.cupo, v.fecha_publicacion,
              e.nombre AS empresa, e.estado_republica,
              ${SQL_ACEPTADOS('v')} AS aceptados
       FROM vacantes v
       JOIN empresas e ON v.empresa_id = e.id
       WHERE v.estado = 'activa'
         AND ($1::text IS NULL OR v.carrera ILIKE '%' || $1 || '%')
       ORDER BY v.id DESC`,
      [carrera || null]
    );

    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al consultar vacantes' });
  }
};

export const obtenerVacante = async (req, res) => {
  try {
    const id = idValido(req.params.id);
    if (!id) return res.status(404).json({ mensaje: 'Vacante no encontrada' });

    const resultado = await query(
      `SELECT v.id, v.titulo, v.descripcion, v.carrera, v.requisitos, v.estado,
              v.cupo, v.fecha_publicacion,
              e.nombre AS empresa, e.estado_republica,
              ${SQL_ACEPTADOS('v')} AS aceptados
       FROM vacantes v
       JOIN empresas e ON v.empresa_id = e.id
       WHERE v.id = $1 AND v.estado = 'activa'`,
      [id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Vacante no encontrada' });
    }

    res.json(resultado.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al consultar vacante' });
  }
};

// Empresa propone un proyecto: queda pendiente de aprobación por coordinación
export const crearVacante = async (req, res) => {
  try {
    const empresa = await obtenerEmpresa(req.usuario.id);
    if (!empresa) {
      return res.status(403).json({ mensaje: 'Tu cuenta no tiene un perfil de empresa' });
    }

    const { titulo, descripcion, carrera, requisitos } = req.body;
    if (!textoRequerido(titulo)) {
      return res.status(400).json({ mensaje: 'El título es obligatorio' });
    }

    const resultado = await query(
      `INSERT INTO vacantes (empresa_id, titulo, descripcion, carrera, requisitos, estado)
       VALUES ($1, $2, $3, $4, $5, 'pendiente')
       RETURNING *`,
      [empresa.id, titulo.trim(), textoOpcional(descripcion),
       textoOpcional(carrera), textoOpcional(requisitos)]
    );

    res.status(201).json({
      mensaje: 'Proyecto enviado a coordinación para su aprobación',
      vacante: resultado.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al crear vacante' });
  }
};

// Empresa edita su proyecto.
// - Pendiente o rechazado: al guardar vuelve a revisión de coordinación.
// - Aprobado: puede abrirlo (activa) o cerrarlo (cerrada).
export const actualizarVacante = async (req, res) => {
  try {
    const empresa = await obtenerEmpresa(req.usuario.id);
    if (!empresa) {
      return res.status(403).json({ mensaje: 'Perfil de empresa no encontrado' });
    }

    const id = idValido(req.params.id);
    const actual = id && (await query(
      'SELECT estado FROM vacantes WHERE id = $1 AND empresa_id = $2',
      [id, empresa.id]
    )).rows[0];

    if (!actual) {
      return res.status(404).json({ mensaje: 'Vacante no encontrada o no pertenece a tu empresa' });
    }

    const { titulo, descripcion, carrera, requisitos, estado } = req.body;
    if (!textoRequerido(titulo)) {
      return res.status(400).json({ mensaje: 'El título es obligatorio' });
    }

    let nuevoEstado;
    if (['pendiente', 'rechazada'].includes(actual.estado)) {
      nuevoEstado = 'pendiente';
    } else if (estado === undefined) {
      nuevoEstado = actual.estado;
    } else if (['activa', 'cerrada'].includes(estado)) {
      nuevoEstado = estado;
    } else {
      return res.status(400).json({ mensaje: 'El estado debe ser activa o cerrada' });
    }

    const resultado = await query(
      `UPDATE vacantes
       SET titulo = $1, descripcion = $2, carrera = $3, requisitos = $4, estado = $5,
           motivo_rechazo = CASE WHEN $5 = 'pendiente' THEN NULL ELSE motivo_rechazo END
       WHERE id = $6 AND empresa_id = $7
       RETURNING *`,
      [titulo.trim(), textoOpcional(descripcion), textoOpcional(carrera),
       textoOpcional(requisitos), nuevoEstado, id, empresa.id]
    );

    res.json({
      mensaje: actual.estado === 'rechazada'
        ? 'Proyecto corregido y enviado de nuevo a coordinación'
        : 'Vacante actualizada correctamente',
      vacante: resultado.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al actualizar vacante' });
  }
};

export const eliminarVacante = async (req, res) => {
  try {
    const empresa = await obtenerEmpresa(req.usuario.id);
    if (!empresa) {
      return res.status(403).json({ mensaje: 'Perfil de empresa no encontrado' });
    }

    const resultado = await query(
      'DELETE FROM vacantes WHERE id = $1 AND empresa_id = $2 RETURNING id',
      [idValido(req.params.id), empresa.id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Vacante no encontrada o no pertenece a tu empresa' });
    }

    res.json({ mensaje: 'Vacante eliminada correctamente' });
  } catch (error) {
    if (error.code === '23503') {
      return res.status(409).json({
        mensaje: 'No se puede eliminar una vacante con postulaciones asociadas'
      });
    }
    console.error(error);
    res.status(500).json({ mensaje: 'Error al eliminar vacante' });
  }
};

// Empresa consulta sus propios proyectos
export const misVacantes = async (req, res) => {
  try {
    const resultado = await query(
      `SELECT v.*, e.nombre AS empresa,
              (SELECT COUNT(*)::int FROM postulaciones p WHERE p.vacante_id = v.id) AS total_postulaciones,
              ${SQL_ACEPTADOS('v')} AS aceptados,
              ${SQL_DOCENTES_DE_VACANTE('v')} AS docentes
       FROM vacantes v
       JOIN empresas e ON v.empresa_id = e.id
       WHERE e.usuario_id = $1
       ORDER BY v.id DESC`,
      [req.usuario.id]
    );

    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al consultar tus vacantes' });
  }
};

// Coordinación consulta todos los proyectos (filtro opcional ?estado=)
export const listarProyectosCoordinacion = async (req, res) => {
  try {
    const resultado = await query(
      `SELECT v.*, e.nombre AS empresa, e.estado_republica,
              (SELECT COUNT(*)::int FROM postulaciones p WHERE p.vacante_id = v.id) AS total_postulaciones,
              (SELECT COUNT(*)::int FROM postulaciones p
               WHERE p.vacante_id = v.id AND p.estado = 'pendiente') AS postulaciones_pendientes,
              ${SQL_ACEPTADOS('v')} AS aceptados,
              ${SQL_DOCENTES_DE_VACANTE('v')} AS docentes,
              ${SQL_EQUIPO_DE_VACANTE('v')} AS equipo
       FROM vacantes v
       JOIN empresas e ON v.empresa_id = e.id
       WHERE ($1::text IS NULL OR v.estado = $1)
       ORDER BY (v.estado = 'pendiente') DESC, v.id DESC`,
      [req.query.estado || null]
    );

    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al consultar proyectos' });
  }
};

// Coordinación aprueba (con cupo) o rechaza (con motivo) un proyecto pendiente
export const revisarVacante = async (req, res) => {
  try {
    const id = idValido(req.params.id);
    const { decision, cupo, motivo } = req.body;

    if (decision === 'aprobar' && (!Number.isInteger(cupo) || cupo < 1)) {
      return res.status(400).json({ mensaje: 'Indica cuántos alumnos puede recibir el proyecto (1 o más)' });
    }
    if (decision === 'rechazar' && !textoRequerido(motivo)) {
      return res.status(400).json({ mensaje: 'Explica a la empresa por qué se rechaza el proyecto' });
    }
    if (!['aprobar', 'rechazar'].includes(decision)) {
      return res.status(400).json({ mensaje: 'La decisión debe ser aprobar o rechazar' });
    }

    const resultado = await query(
      `UPDATE vacantes
       SET estado = $1, cupo = $2, motivo_rechazo = $3, fecha_revision = NOW()
       WHERE id = $4 AND estado = 'pendiente'
       RETURNING *`,
      decision === 'aprobar'
        ? ['activa', cupo, null, id]
        : ['rechazada', null, motivo.trim(), id]
    );

    if (resultado.rows.length === 0) {
      return res.status(409).json({ mensaje: 'El proyecto no existe o ya fue revisado' });
    }

    res.json({
      mensaje: decision === 'aprobar' ? 'Proyecto aprobado y publicado' : 'Proyecto rechazado',
      vacante: resultado.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al revisar el proyecto' });
  }
};

// Coordinación ajusta el cupo de un proyecto aprobado
export const actualizarCupo = async (req, res) => {
  const id = idValido(req.params.id);
  const { cupo } = req.body;

  if (!Number.isInteger(cupo) || cupo < 1) {
    return res.status(400).json({ mensaje: 'El cupo debe ser un número entero de 1 o más' });
  }

  let cliente;

  try {
    cliente = await pool.connect();
    await cliente.query('BEGIN');

    const resultado = await cliente.query(
      `UPDATE vacantes v
       SET cupo = $1
       WHERE v.id = $2
         AND v.estado IN ('activa', 'cerrada')
         AND $1 >= ${SQL_ACEPTADOS('v')}
       RETURNING v.*`,
      [cupo, id]
    );

    if (resultado.rows.length === 0) {
      await cliente.query('ROLLBACK');
      return res.status(409).json({
        mensaje: 'No se puede: el proyecto no está aprobado o el cupo es menor que los alumnos ya aceptados'
      });
    }

    const completo = await cerrarPostulacionesSiCompleto(cliente, id);
    await cliente.query('COMMIT');

    res.json({
      mensaje: completo
        ? 'Cupo actualizado. El proyecto quedó completo: ya puedes asignar a sus docentes.'
        : 'Cupo actualizado',
      vacante: resultado.rows[0]
    });
  } catch (error) {
    if (cliente) await cliente.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ mensaje: 'Error al actualizar el cupo' });
  } finally {
    cliente?.release();
  }
};

// Coordinación asigna un docente como asesor o revisor.
// - Solo cuando el proyecto ya tiene a todos sus alumnos (cupo completo).
// - Un único asesor y un único revisor por proyecto.
// - Un docente no puede ser asesor y revisor del mismo proyecto.
export const asignarDocente = async (req, res) => {
  try {
    const vacanteId = idValido(req.params.id);
    const docenteId = idValido(req.body.docente_id);
    const { funcion } = req.body;

    if (!vacanteId || !docenteId || !['asesor', 'revisor'].includes(funcion)) {
      return res.status(400).json({ mensaje: 'Indica el docente y si será asesor o revisor' });
    }

    const { rows: [proyecto] } = await query(
      `SELECT v.estado, v.cupo, ${SQL_ACEPTADOS('v')} AS aceptados
       FROM vacantes v WHERE v.id = $1`,
      [vacanteId]
    );

    if (!proyecto || !['activa', 'cerrada'].includes(proyecto.estado)) {
      return res.status(409).json({ mensaje: 'Solo se asignan docentes a proyectos aprobados' });
    }
    if (proyecto.aceptados < proyecto.cupo) {
      return res.status(409).json({
        mensaje: `El proyecto aún no tiene a todos sus alumnos (${proyecto.aceptados} de ${proyecto.cupo}). Asigna a los docentes cuando el equipo esté completo.`
      });
    }

    const { rows: asignados } = await query(
      `SELECT dv.docente_id, dv.funcion, u.nombre
       FROM docentes_vacante dv
       JOIN docentes d ON d.id = dv.docente_id
       JOIN usuarios u ON u.id = d.usuario_id
       WHERE dv.vacante_id = $1`,
      [vacanteId]
    );

    const mismo = asignados.find((a) => a.docente_id === docenteId);
    if (mismo) {
      return res.status(409).json({
        mensaje: `${mismo.nombre} ya es ${mismo.funcion} de este proyecto. Un docente no puede ser asesor y revisor del mismo proyecto.`
      });
    }
    const ocupada = asignados.find((a) => a.funcion === funcion);
    if (ocupada) {
      return res.status(409).json({
        mensaje: `El proyecto ya tiene ${funcion}: ${ocupada.nombre}. Quítalo primero si quieres cambiarlo.`
      });
    }

    const resultado = await query(
      `INSERT INTO docentes_vacante (vacante_id, docente_id, funcion)
       SELECT $1, d.id, $3 FROM docentes d WHERE d.id = $2
       RETURNING *`,
      [vacanteId, docenteId, funcion]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensaje: 'El docente no existe' });
    }

    res.status(201).json({
      mensaje: `Docente asignado como ${funcion}`,
      asignacion: resultado.rows[0]
    });
  } catch (error) {
    // Dos asignaciones simultáneas: los índices únicos de la base lo impiden
    if (error.code === '23505') {
      return res.status(409).json({
        mensaje: 'El proyecto ya tiene esa función ocupada o el docente ya está asignado. Recarga la página.'
      });
    }
    console.error(error);
    res.status(500).json({ mensaje: 'Error al asignar docente' });
  }
};

export const quitarDocente = async (req, res) => {
  try {
    const resultado = await query(
      'DELETE FROM docentes_vacante WHERE vacante_id = $1 AND docente_id = $2 RETURNING id',
      [idValido(req.params.id), idValido(req.params.docenteId)]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Ese docente no está asignado al proyecto' });
    }

    res.json({ mensaje: 'Docente retirado del proyecto' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al retirar docente' });
  }
};
