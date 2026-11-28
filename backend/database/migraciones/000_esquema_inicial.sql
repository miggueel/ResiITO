-- ============================================================
-- Migración 000: esquema inicial de ResiITO.
-- Crea las tablas base sobre las que trabajan las migraciones
-- 001 en adelante. En una base que ya tenía estas tablas,
-- scripts/migrar.js la registra como aplicada sin ejecutarla.
-- ============================================================

CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  correo VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  rol VARCHAR(20) NOT NULL CHECK (rol IN ('alumno', 'empresa', 'coordinador')),
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE alumnos (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER UNIQUE REFERENCES usuarios(id),
  matricula VARCHAR(20) NOT NULL UNIQUE,
  carrera VARCHAR(150) NOT NULL,
  semestre INTEGER
);

CREATE TABLE empresas (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER UNIQUE REFERENCES usuarios(id),
  nombre VARCHAR(150) NOT NULL,
  descripcion TEXT,
  direccion TEXT,
  telefono VARCHAR(20)
);

CREATE TABLE vacantes (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id),
  titulo VARCHAR(150) NOT NULL,
  descripcion TEXT,
  carrera VARCHAR(150),
  requisitos TEXT,
  estado VARCHAR(20) DEFAULT 'activa',
  fecha_publicacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE postulaciones (
  id SERIAL PRIMARY KEY,
  alumno_id INTEGER NOT NULL REFERENCES alumnos(id),
  vacante_id INTEGER NOT NULL REFERENCES vacantes(id),
  estado VARCHAR(20) DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'aceptado', 'rechazado')),
  fecha_postulacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (alumno_id, vacante_id)
);

CREATE TABLE residencias (
  id SERIAL PRIMARY KEY,
  postulacion_id INTEGER NOT NULL UNIQUE REFERENCES postulaciones(id),
  asesor VARCHAR(150),
  fecha_inicio DATE,
  fecha_fin DATE,
  estado VARCHAR(30) DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'aprobada', 'en_proceso', 'finalizada', 'liberada', 'rechazada'))
);

CREATE TABLE reportes (
  id SERIAL PRIMARY KEY,
  residencia_id INTEGER NOT NULL REFERENCES residencias(id),
  numero_reporte INTEGER NOT NULL,
  archivo_pdf TEXT NOT NULL,
  fecha_entrega TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  estado VARCHAR(20) DEFAULT 'pendiente',
  UNIQUE (residencia_id, numero_reporte)
);

CREATE TABLE evaluaciones (
  id SERIAL PRIMARY KEY,
  residencia_id INTEGER NOT NULL UNIQUE REFERENCES residencias(id),
  calificacion NUMERIC(5,2) CHECK (calificacion >= 0 AND calificacion <= 100),
  observaciones TEXT,
  fecha_evaluacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
