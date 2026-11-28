-- ============================================================
-- Migración 004: los alumnos aceptados en un mismo proyecto
-- forman un equipo y comparten sus reportes.
--
-- Cada reporte pertenece al proyecto (equipo) y guarda qué
-- alumno lo subió. residencia_id se conserva: es la residencia
-- de quien lo entregó.
-- ============================================================

ALTER TABLE reportes ADD COLUMN IF NOT EXISTS vacante_id INTEGER REFERENCES vacantes(id);
ALTER TABLE reportes ADD COLUMN IF NOT EXISTS subido_por INTEGER REFERENCES alumnos(id);

UPDATE reportes rep
SET vacante_id = p.vacante_id,
    subido_por = COALESCE(rep.subido_por, p.alumno_id)
FROM residencias r
JOIN postulaciones p ON p.id = r.postulacion_id
WHERE r.id = rep.residencia_id AND rep.vacante_id IS NULL;

ALTER TABLE reportes ALTER COLUMN vacante_id SET NOT NULL;

-- El número de reporte es único por equipo, no por alumno
ALTER TABLE reportes DROP CONSTRAINT IF EXISTS reportes_residencia_id_numero_reporte_key;
ALTER TABLE reportes DROP CONSTRAINT IF EXISTS reportes_vacante_id_numero_reporte_key;
ALTER TABLE reportes ADD CONSTRAINT reportes_vacante_id_numero_reporte_key
  UNIQUE (vacante_id, numero_reporte);

CREATE INDEX IF NOT EXISTS reportes_vacante_idx ON reportes (vacante_id);
