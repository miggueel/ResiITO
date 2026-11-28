import { query } from '../config/database.js';

// Reúne quién está relacionado con una residencia para decidir permisos.
export async function contextoResidencia(residenciaId, usuarioId) {
  const resultado = await query(
    `SELECT
       r.id,
       r.estado,
       v.id AS vacante_id,
       a.id AS alumno_id,
       a.usuario_id AS alumno_usuario_id,
       e.usuario_id AS empresa_usuario_id,
       dv.funcion AS funcion_docente,
       d.id AS docente_id
     FROM residencias r
     JOIN postulaciones p ON r.postulacion_id = p.id
     JOIN alumnos a ON p.alumno_id = a.id
     JOIN vacantes v ON p.vacante_id = v.id
     JOIN empresas e ON v.empresa_id = e.id
     LEFT JOIN docentes d ON d.usuario_id = $2
     LEFT JOIN docentes_vacante dv ON dv.vacante_id = v.id AND dv.docente_id = d.id
     WHERE r.id = $1`,
    [residenciaId, usuarioId]
  );

  return resultado.rows[0] ?? null;
}

export function puedeVerResidencia(usuario, contexto) {
  if (!contexto) return false;
  switch (usuario.rol) {
    case 'coordinador': return true;
    case 'alumno': return contexto.alumno_usuario_id === usuario.id;
    case 'empresa': return contexto.empresa_usuario_id === usuario.id;
    case 'docente': return Boolean(contexto.funcion_docente);
    default: return false;
  }
}

// Docentes asignados al proyecto, como arreglo JSON (para usar en SELECT)
export const SQL_DOCENTES_DE_VACANTE = (aliasVacante) => `
  COALESCE((
    SELECT json_agg(json_build_object(
             'docente_id', d.id,
             'nombre', ud.nombre,
             'correo', ud.correo,
             'funcion', dv.funcion
           ) ORDER BY dv.funcion, ud.nombre)
    FROM docentes_vacante dv
    JOIN docentes d ON d.id = dv.docente_id
    JOIN usuarios ud ON ud.id = d.usuario_id
    WHERE dv.vacante_id = ${aliasVacante}.id
  ), '[]'::json)`;

// Integrantes del equipo: alumnos aceptados en el mismo proyecto
export const SQL_EQUIPO_DE_VACANTE = (aliasVacante) => `
  COALESCE((
    SELECT json_agg(json_build_object(
             'residencia_id', re.id,
             'alumno_id', ae.id,
             'nombre', ue.nombre,
             'matricula', ae.matricula,
             'correo', ue.correo
           ) ORDER BY ue.nombre)
    FROM postulaciones pe
    JOIN alumnos ae ON ae.id = pe.alumno_id
    JOIN usuarios ue ON ue.id = ae.usuario_id
    JOIN residencias re ON re.postulacion_id = pe.id
    WHERE pe.vacante_id = ${aliasVacante}.id AND pe.estado = 'aceptado'
  ), '[]'::json)`;
