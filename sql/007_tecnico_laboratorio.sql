-- sql/007_tecnico_laboratorio.sql
-- ============================================================
-- Modulo de Laboratorio: Tecnico de Laboratorio
-- Crea la tabla tecnico_laboratorio, analisis_laboratorio
-- y agrega el valor al enum de rol. Incluye datos de prueba.
-- ============================================================

-- BLOQUE 1: Agregar 'tecnico_laboratorio' al ENUM de rol (si existe)
-- Este bloque debe ejecutarse PRIMERO y por separado para que
-- PostgreSQL haga commit del nuevo valor antes de usarlo.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_attribute a ON a.attrelid = 'usuario'::regclass
    WHERE t.typname = 'rol_enum'
  ) THEN
    BEGIN
      ALTER TYPE rol_enum ADD VALUE IF NOT EXISTS 'tecnico_laboratorio';
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
  END IF;
END;
$$;

-- BLOQUE 2: Asegurar el CHECK de rol (por si la columna es VARCHAR)
ALTER TABLE usuario
  DROP CONSTRAINT IF EXISTS usuario_rol_check;

ALTER TABLE usuario
  ADD CONSTRAINT usuario_rol_check
  CHECK (rol IN ('paciente', 'medico', 'enfermero', 'farmaceutico', 'administrativo', 'tecnico_laboratorio'));

-- BLOQUE 3: Tabla tecnico_laboratorio (extiende persona)
CREATE TABLE IF NOT EXISTS tecnico_laboratorio
(
  id_tecnico_laboratorio   SERIAL PRIMARY KEY,
  persona_id               INT UNIQUE REFERENCES persona(persona_id) ON UPDATE CASCADE ON DELETE RESTRICT,
  numero_licencia          VARCHAR(50) UNIQUE,
  especialidad_laboratorio VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_tecnico_laboratorio_persona
  ON tecnico_laboratorio(persona_id);

-- BLOQUE 4: Tabla analisis_laboratorio
CREATE TABLE IF NOT EXISTS analisis_laboratorio
(
  id_analisis             SERIAL PRIMARY KEY,
  id_paciente             INTEGER NOT NULL REFERENCES paciente(id_paciente) ON UPDATE CASCADE ON DELETE RESTRICT,
  id_tecnico_laboratorio  INTEGER NOT NULL REFERENCES tecnico_laboratorio(id_tecnico_laboratorio) ON UPDATE CASCADE ON DELETE RESTRICT,
  tipo_analisis           VARCHAR(100) NOT NULL,
  fecha_solicitud         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_resultado         TIMESTAMP,
  estado                  VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_proceso', 'completado', 'cancelado')),
  resultado               TEXT,
  observaciones           TEXT,
  created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analisis_laboratorio_paciente
  ON analisis_laboratorio(id_paciente);

CREATE INDEX IF NOT EXISTS idx_analisis_laboratorio_tecnico
  ON analisis_laboratorio(id_tecnico_laboratorio);

CREATE INDEX IF NOT EXISTS idx_analisis_laboratorio_estado
  ON analisis_laboratorio(estado);

CREATE INDEX IF NOT EXISTS idx_analisis_laboratorio_fecha
  ON analisis_laboratorio(fecha_solicitud);

-- BLOQUE 5: Datos de prueba para tecnico de laboratorio
-- Contrasena: tecnico123 (bcrypt hash incluido)
DO $$
DECLARE
  v_persona_id INT;
  v_id_usuario INT;
  v_id_tecnico INT;
BEGIN
  INSERT INTO persona (nombre, apellido, fecha_nac, sexo, telefono)
  VALUES ('Carlos', 'Tecnico', '1990-01-01', 'M', '77712345')
  RETURNING persona_id INTO v_persona_id;

  INSERT INTO usuario (persona_id, ci, correo, contrasena, rol, estado)
  VALUES (
    v_persona_id,
    '87654321',
    'tecnico@hospital.com',
    '$2a$10$ZEs/Guf1L4kiv3jGuOVcnuTmEQ/pHJUgV9rxv.u8uHAFGQSrvxrOq',
    'tecnico_laboratorio',
    'activo'
  )
  RETURNING id_usuario INTO v_id_usuario;

  INSERT INTO tecnico_laboratorio (persona_id, numero_licencia, especialidad_laboratorio)
  VALUES (v_persona_id, 'LIC-001', 'Laboratorio Clinico')
  RETURNING id_tecnico_laboratorio INTO v_id_tecnico;

  RAISE NOTICE 'Tecnico de laboratorio creado: persona_id=%, usuario_id=%, tecnico_id=%', v_persona_id, v_id_usuario, v_id_tecnico;
END;
$$;
