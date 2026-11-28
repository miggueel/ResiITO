-- ============================================================
-- Migración 001: coordinación da de alta usuarios, rol docente,
-- aprobación de proyectos con cupo, revisión docente de reportes
-- y solicitudes de cambio de estatus.
--
-- Se ejecuta con:  npm run migrar
-- Todo va dentro de una transacción: si algo falla, no cambia nada.
-- ============================================================

-- ---------- Usuarios ----------

-- Nuevo rol: docente (asesor o revisor)
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;
ALTER TABLE usuarios ADD CONSTRAINT usuarios_rol_check
  CHECK (rol IN ('alumno', 'empresa', 'coordinador', 'docente'));

-- La contraseña queda vacía hasta que el usuario activa su cuenta
ALTER TABLE usuarios ALTER COLUMN password DROP NOT NULL;

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS estado_cuenta VARCHAR(20) NOT NULL DEFAULT 'activa';
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_estado_cuenta_check;
ALTER TABLE usuarios ADD CONSTRAINT usuarios_estado_cuenta_check
  CHECK (estado_cuenta IN ('pendiente', 'activa'));

-- Una cuenta activa siempre tiene contraseña
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_activa_con_password_check;
ALTER TABLE usuarios ADD CONSTRAINT usuarios_activa_con_password_check
  CHECK (estado_cuenta = 'pendiente' OR password IS NOT NULL);

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS creado_por INTEGER REFERENCES usuarios(id);

-- ---------- Docentes ----------

CREATE TABLE IF NOT EXISTS docentes (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
  numero_empleado VARCHAR(30) UNIQUE,
  departamento VARCHAR(150)
);

-- ---------- Empresas: estado de la República ----------

ALTER TABLE empresas ADD COLUMN IF NOT EXISTS estado_republica VARCHAR(40);
ALTER TABLE empresas DROP CONSTRAINT IF EXISTS empresas_estado_republica_check;
ALTER TABLE empresas ADD CONSTRAINT empresas_estado_republica_check
  CHECK (estado_republica IS NULL OR estado_republica IN (
    'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche',
    'Chiapas', 'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima',
    'Durango', 'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo',
    'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca',
    'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa',
    'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán',
    'Zacatecas'
  ));

-- ---------- Enlaces de activación y restablecimiento ----------
-- Solo se guarda el hash SHA-256 del token, nunca el token en claro.

CREATE TABLE IF NOT EXISTS tokens_cuenta (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('activacion', 'restablecimiento')),
  token_hash CHAR(64) NOT NULL UNIQUE,
  expira_en TIMESTAMP NOT NULL,
  usado_en TIMESTAMP,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS tokens_cuenta_usuario_idx ON tokens_cuenta (usuario_id, tipo);

-- ---------- Vacantes (proyectos): aprobación y cupo ----------

ALTER TABLE vacantes ADD COLUMN IF NOT EXISTS cupo INTEGER;
ALTER TABLE vacantes ADD COLUMN IF NOT EXISTS motivo_rechazo TEXT;
ALTER TABLE vacantes ADD COLUMN IF NOT EXISTS fecha_revision TIMESTAMP;

ALTER TABLE vacantes DROP CONSTRAINT IF EXISTS vacantes_cupo_check;
ALTER TABLE vacantes ADD CONSTRAINT vacantes_cupo_check CHECK (cupo IS NULL OR cupo >= 1);

-- Las vacantes ya publicadas quedan aprobadas con cupo 1 (la coordinación puede ajustarlo)
UPDATE vacantes SET cupo = 1 WHERE cupo IS NULL AND estado IN ('activa', 'cerrada');

ALTER TABLE vacantes ALTER COLUMN estado SET DEFAULT 'pendiente';
ALTER TABLE vacantes DROP CONSTRAINT IF EXISTS vacantes_estado_check;
ALTER TABLE vacantes ADD CONSTRAINT vacantes_estado_check
  CHECK (estado IN ('pendiente', 'activa', 'cerrada', 'rechazada'));

-- Una vacante aprobada (activa o cerrada) siempre tiene cupo
ALTER TABLE vacantes DROP CONSTRAINT IF EXISTS vacantes_aprobada_con_cupo_check;
ALTER TABLE vacantes ADD CONSTRAINT vacantes_aprobada_con_cupo_check
  CHECK (estado NOT IN ('activa', 'cerrada') OR cupo IS NOT NULL);

-- ---------- Docentes asignados a cada proyecto ----------

CREATE TABLE IF NOT EXISTS docentes_vacante (
  id SERIAL PRIMARY KEY,
  vacante_id INTEGER NOT NULL REFERENCES vacantes(id) ON DELETE CASCADE,
  docente_id INTEGER NOT NULL REFERENCES docentes(id) ON DELETE CASCADE,
  funcion VARCHAR(20) NOT NULL CHECK (funcion IN ('asesor', 'revisor')),
  fecha_asignacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (vacante_id, docente_id)
);
CREATE INDEX IF NOT EXISTS docentes_vacante_docente_idx ON docentes_vacante (docente_id);

-- ---------- Residencias: nuevo resultado "no concluida" ----------

ALTER TABLE residencias DROP CONSTRAINT IF EXISTS residencias_estado_check;
ALTER TABLE residencias ADD CONSTRAINT residencias_estado_check
  CHECK (estado IN ('pendiente', 'aprobada', 'en_proceso', 'finalizada',
                    'no_concluida', 'liberada', 'rechazada'));

-- ---------- Reportes: revisión docente ----------

ALTER TABLE reportes ADD COLUMN IF NOT EXISTS es_ultimo BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE reportes ADD COLUMN IF NOT EXISTS revisado_por INTEGER REFERENCES docentes(id);
ALTER TABLE reportes ADD COLUMN IF NOT EXISTS fecha_revision TIMESTAMP;
ALTER TABLE reportes ADD COLUMN IF NOT EXISTS fecha_actualizacion TIMESTAMP;

ALTER TABLE reportes DROP CONSTRAINT IF EXISTS reportes_estado_check;
ALTER TABLE reportes ADD CONSTRAINT reportes_estado_check
  CHECK (estado IN ('pendiente', 'aprobado', 'rechazado'));

-- ---------- Observaciones del docente sobre un reporte ----------

CREATE TABLE IF NOT EXISTS observaciones_reporte (
  id SERIAL PRIMARY KEY,
  reporte_id INTEGER NOT NULL REFERENCES reportes(id) ON DELETE CASCADE,
  docente_id INTEGER NOT NULL REFERENCES docentes(id),
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('error', 'comentario', 'propuesta')),
  pagina INTEGER CHECK (pagina IS NULL OR pagina >= 1),
  contenido TEXT NOT NULL CHECK (length(trim(contenido)) > 0),
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS observaciones_reporte_reporte_idx ON observaciones_reporte (reporte_id);

-- ---------- Solicitudes de cambio de estatus (docente → coordinación) ----------

CREATE TABLE IF NOT EXISTS solicitudes_cambio_estado (
  id SERIAL PRIMARY KEY,
  residencia_id INTEGER NOT NULL REFERENCES residencias(id) ON DELETE CASCADE,
  docente_id INTEGER NOT NULL REFERENCES docentes(id),
  estado_actual VARCHAR(20) NOT NULL,
  estado_solicitado VARCHAR(20) NOT NULL
    CHECK (estado_solicitado IN ('en_proceso', 'finalizada', 'no_concluida')),
  motivo TEXT NOT NULL CHECK (length(trim(motivo)) >= 10),
  estado VARCHAR(20) NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'aprobada', 'rechazada')),
  respuesta TEXT,
  resuelta_por INTEGER REFERENCES usuarios(id),
  fecha_solicitud TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_resolucion TIMESTAMP,
  CHECK (estado_solicitado <> estado_actual)
);

-- Solo una solicitud pendiente por residencia a la vez
CREATE UNIQUE INDEX IF NOT EXISTS solicitudes_una_pendiente_idx
  ON solicitudes_cambio_estado (residencia_id) WHERE estado = 'pendiente';
