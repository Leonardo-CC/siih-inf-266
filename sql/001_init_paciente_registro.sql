-- sql/001_init_paciente_registro.sql
-- Tablas necesarias para HU-01 (Registro de paciente/estudiante).
-- Coinciden con el Diccionario de Datos (Sección 4.3.1 del documento).
-- Si ya creaste estas tablas en Supabase, puedes omitir este script.

CREATE TABLE IF NOT EXISTS persona (
  persona_id   SERIAL PRIMARY KEY,
  nombre       VARCHAR(100) NOT NULL,
  apellido     VARCHAR(100) NOT NULL,
  fecha_nac    DATE,
  sexo         VARCHAR(10) CHECK (sexo IN ('M', 'F', 'Otro')),
  telefono     VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS usuario (
  id_usuario    SERIAL PRIMARY KEY,
  persona_id    INT UNIQUE REFERENCES persona(persona_id),
  ci            VARCHAR(15) UNIQUE NOT NULL,
  correo        VARCHAR(100) UNIQUE NOT NULL,
  "contraseña"  VARCHAR(255) NOT NULL,
  rol           VARCHAR(20) NOT NULL CHECK (
                  rol IN ('paciente', 'medico', 'enfermero', 'farmaceutico', 'administrativo')
                ),
  estado        VARCHAR(10) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo'))
);

CREATE TABLE IF NOT EXISTS paciente (
  id_paciente    SERIAL PRIMARY KEY,
  persona_id     INT UNIQUE REFERENCES persona(persona_id),
  tipo_seguro    VARCHAR(50),
  numero_seguro  VARCHAR(30)
);
