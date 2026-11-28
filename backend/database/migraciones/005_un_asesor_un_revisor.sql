-- ============================================================
-- Migración 005: cada proyecto tiene un único asesor y un único
-- revisor, y un docente no puede ocupar ambas funciones en el
-- mismo proyecto (eso ya lo garantiza UNIQUE (vacante_id, docente_id)).
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS docentes_vacante_una_funcion_idx
  ON docentes_vacante (vacante_id, funcion);
