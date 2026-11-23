
import { query } from '../config/database.js';

const obtenerEmpresa = async (usuarioId) => {
  const resultado = await query(
    'SELECT id FROM empresas WHERE usuario_id = $1',
    [usuarioId]
  );

  return resultado.rows[0];
};

// GET - Listar vacantes
export const listarVacantes = async (req, res) => {
  try {
    const { carrera, estado } = req.query;

    const resultado = await query(
      `SELECT v.*, e.nombre AS empresa
       FROM vacantes v
       INNER JOIN empresas e ON v.empresa_id = e.id
       WHERE ($1::text IS NULL OR v.carrera ILIKE '%' || $1 || '%')
         AND ($2::text IS NULL OR v.estado = $2)
       ORDER BY v.id DESC`,
      [carrera || null, estado || null]
    );

    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al consultar vacantes' });
  }
};

// GET - Obtener vacante por ID
export const obtenerVacante = async (req, res) => {
  try {
    const resultado = await query(
      `SELECT v.*, e.nombre AS empresa
       FROM vacantes v
       JOIN empresas e ON v.empresa_id = e.id
       WHERE v.id = $1`,
      [req.params.id]
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

// POST - Crear vacante
export const crearVacante = async (req, res) => {
  try {
    const empresa = await obtenerEmpresa(req.usuario.id);

    if (!empresa) {
      return res.status(403).json({
        mensaje: 'Tu cuenta no tiene un perfil de empresa'
      });
    }

    const { titulo, descripcion, carrera, requisitos } = req.body;

    if (typeof titulo !== 'string' || !titulo.trim()) {
      return res.status(400).json({ mensaje: 'El título es obligatorio' });
    }

    const resultado = await query(
      `INSERT INTO vacantes
       (empresa_id, titulo, descripcion, carrera, requisitos)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        empresa.id,
        titulo.trim(),
        descripcion ?? null,
        carrera ?? null,
        requisitos ?? null
      ]
    );

    res.status(201).json({
      mensaje: 'Vacante creada correctamente',
      vacante: resultado.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al crear vacante' });
  }
};

// PUT - Actualizar vacante
export const actualizarVacante = async (req, res) => {
  try {
    const empresa = await obtenerEmpresa(req.usuario.id);

    if (!empresa) {
      return res.status(403).json({
        mensaje: 'Perfil de empresa no encontrado'
      });
    }

    const { titulo, descripcion, carrera, requisitos, estado } = req.body;

    if (typeof titulo !== 'string' || !titulo.trim() ||
        !['activa', 'cerrada'].includes(estado)) {
      return res.status(400).json({
        mensaje: 'Título y estado válido son obligatorios'
      });
    }

    const resultado = await query(
      `UPDATE vacantes
       SET titulo = $1,
           descripcion = $2,
           carrera = $3,
           requisitos = $4,
           estado = $5
       WHERE id = $6 AND empresa_id = $7
       RETURNING *`,
      [
        titulo.trim(),
        descripcion ?? null,
        carrera ?? null,
        requisitos ?? null,
        estado,
        req.params.id,
        empresa.id
      ]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        mensaje: 'Vacante no encontrada o no pertenece a tu empresa'
      });
    }

    res.json({
      mensaje: 'Vacante actualizada correctamente',
      vacante: resultado.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al actualizar vacante' });
  }
};

// DELETE - Eliminar vacante
export const eliminarVacante = async (req, res) => {
  try {
    const empresa = await obtenerEmpresa(req.usuario.id);

    if (!empresa) {
      return res.status(403).json({
        mensaje: 'Perfil de empresa no encontrado'
      });
    }

    const resultado = await query(
      `DELETE FROM vacantes
       WHERE id = $1 AND empresa_id = $2
       RETURNING id`,
      [req.params.id, empresa.id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        mensaje: 'Vacante no encontrada o no pertenece a tu empresa'
      });
    }

    res.json({ mensaje: 'Vacante eliminada correctamente' });
  } catch (error) {
    console.error(error);

    if (error.code === '23503') {
      return res.status(409).json({
        mensaje: 'No se puede eliminar una vacante con postulaciones asociadas'
      });
    }

    res.status(500).json({ mensaje: 'Error al eliminar vacante' });
  }
};
