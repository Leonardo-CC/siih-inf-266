-- sql/002_pago_validacion_seguro.sql
-- Tablas necesarias para HU (Pago de consulta y validación de seguro).
-- Agrega: 
--   1. Tabla especialidad con tarifa base
--   2. Relación FK medico -> especialidad
--   3. Campo fecha_vigencia_seguro en paciente
--   4. Tabla pago (si aún no existe)

-- 1. Crear tabla de especialidades con tarifa
CREATE TABLE IF NOT EXISTS especialidad (
  id_especialidad   SERIAL PRIMARY KEY,
  nombre            VARCHAR(100) NOT NULL UNIQUE,
  tarifa            DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  descripcion       VARCHAR(255),
  estado            VARCHAR(10) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Modificar tabla paciente para agregar fecha de vigencia de seguro
ALTER TABLE paciente 
ADD COLUMN IF NOT EXISTS fecha_vigencia_seguro DATE;

-- 3. Crear tabla pago (si no existe) para registrar pagos de citas
CREATE TABLE IF NOT EXISTS pago (
  id_pago           SERIAL PRIMARY KEY,
  id_cita           INT NOT NULL REFERENCES cita(id_cita),
  id_paciente       INT NOT NULL REFERENCES paciente(id_paciente),
  monto             DECIMAL(10, 2) NOT NULL,
  metodo_pago       VARCHAR(20) NOT NULL CHECK (metodo_pago IN ('efectivo', 'qr', 'tarjeta')),
  estado_pago       VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado_pago IN ('pendiente', 'aprobado', 'rechazado', 'cancelado')),
  comprobante       VARCHAR(255),
  referencia_txn    VARCHAR(100),
  razon_rechazo     VARCHAR(255),
  fecha_pago        TIMESTAMP,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Crear tabla para validación de seguro
CREATE TABLE IF NOT EXISTS validacion_seguro (
  id_validacion     SERIAL PRIMARY KEY,
  id_cita           INT NOT NULL REFERENCES cita(id_cita),
  id_paciente       INT NOT NULL REFERENCES paciente(id_paciente),
  tipo_seguro       VARCHAR(50),
  numero_seguro     VARCHAR(30),
  vigencia          DATE,
  estado_validacion VARCHAR(20) NOT NULL CHECK (estado_validacion IN ('vigente', 'vencido', 'no_validado')),
  fecha_validacion  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Actualizar tabla cita para agregar estado de pago/validación
ALTER TABLE cita 
ADD COLUMN IF NOT EXISTS estado_pago VARCHAR(20) DEFAULT 'sin_pagar' CHECK (estado_pago IN ('sin_pagar', 'pendiente_validacion', 'pagado', 'cancelado'));

-- 6. Insertar especialidades por defecto con tarifas
INSERT INTO especialidad (nombre, tarifa, descripcion, estado)
VALUES
  ('Cardiología', 250.00, 'Especialidad en enfermedades del corazón', 'activo'),
  ('Pediatría', 200.00, 'Especialidad en salud de niños', 'activo'),
  ('Dermatología', 180.00, 'Especialidad en enfermedades de la piel', 'activo'),
  ('Neurología', 300.00, 'Especialidad en enfermedades del sistema nervioso', 'activo'),
  ('Oncología', 350.00, 'Especialidad en tratamiento del cáncer', 'activo'),
  ('Traumatología', 220.00, 'Especialidad en lesiones óseas y articulares', 'activo')
ON CONFLICT (nombre) DO NOTHING;