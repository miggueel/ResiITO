-- ============================================================
-- Migración 003: aplica a los datos existentes las reglas nuevas
-- de postulaciones.
--
-- 1. Un alumno aceptado en un proyecto ya no conserva otras
--    postulaciones en revisión: se eliminan.
-- 2. Un proyecto con el cupo completo ya no recibe alumnos:
--    sus postulaciones en revisión se marcan como rechazadas,
--    para que esos alumnos puedan postularse a otro proyecto.
-- ============================================================

-- 1. Retirar postulaciones pendientes de alumnos que ya tienen proyecto
DELETE FROM postulaciones p
WHERE p.estado = 'pendiente'
  AND EXISTS (
    SELECT 1 FROM postulaciones acept
    WHERE acept.alumno_id = p.alumno_id AND acept.estado = 'aceptado'
  )
  AND NOT EXISTS (SELECT 1 FROM residencias r WHERE r.postulacion_id = p.id);

-- 2. Rechazar postulaciones pendientes a proyectos que ya están completos
UPDATE postulaciones p
SET estado = 'rechazado'
FROM vacantes v
WHERE p.vacante_id = v.id
  AND p.estado = 'pendiente'
  AND v.cupo IS NOT NULL
  AND (SELECT COUNT(*) FROM postulaciones acept
       WHERE acept.vacante_id = v.id AND acept.estado = 'aceptado') >= v.cupo;
