-- ============================================================
-- Migración 002: la coordinación puede desactivar cuentas.
-- Una cuenta inactiva no puede iniciar sesión ni usar enlaces,
-- pero conserva su historial (postulaciones, reportes, proyectos).
-- ============================================================

ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_estado_cuenta_check;
ALTER TABLE usuarios ADD CONSTRAINT usuarios_estado_cuenta_check
  CHECK (estado_cuenta IN ('pendiente', 'activa', 'inactiva'));

-- Solo las cuentas activas requieren contraseña
-- (una invitación pendiente puede desactivarse antes de usarse)
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_activa_con_password_check;
ALTER TABLE usuarios ADD CONSTRAINT usuarios_activa_con_password_check
  CHECK (estado_cuenta <> 'activa' OR password IS NOT NULL);

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS fecha_actualizacion TIMESTAMP;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS fecha_desactivacion TIMESTAMP;
