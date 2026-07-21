-- Facturacion, datos academicos y validacion documental.
-- Ejecutar en Supabase SQL Editor antes de usar las nuevas funciones.

CREATE TABLE IF NOT EXISTS factura (
  id_factura integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_pago integer NOT NULL UNIQUE REFERENCES pago(id_pago) ON DELETE CASCADE,
  id_paciente integer REFERENCES paciente(id_paciente),
  numero_factura varchar(40) NOT NULL UNIQUE,
  razon_social varchar(160) NOT NULL DEFAULT 'Consumidor Final',
  nit_ci varchar(30) NOT NULL DEFAULT '0',
  concepto varchar(180) NOT NULL,
  subtotal numeric(10,2) NOT NULL CHECK (subtotal >= 0),
  iva numeric(10,2) NOT NULL CHECK (iva >= 0),
  total numeric(10,2) NOT NULL CHECK (total >= 0),
  porcentaje_iva numeric(5,2) NOT NULL DEFAULT 13,
  estado varchar(20) NOT NULL DEFAULT 'emitida' CHECK (estado IN ('emitida', 'anulada')),
  fecha_emision timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_factura_pago ON factura(id_pago);
CREATE INDEX IF NOT EXISTS idx_factura_paciente ON factura(id_paciente);

ALTER TABLE paciente
  ADD COLUMN IF NOT EXISTS matricula_numero varchar(30),
  ADD COLUMN IF NOT EXISTS matricula_foto_url text,
  ADD COLUMN IF NOT EXISTS contacto_emergencia_nombre varchar(120),
  ADD COLUMN IF NOT EXISTS contacto_emergencia_telefono varchar(30);

ALTER TABLE usuario
  ADD COLUMN IF NOT EXISTS id_area integer REFERENCES area_facultad(id_area),
  ADD COLUMN IF NOT EXISTS codigo_universitario varchar(40),
  ADD COLUMN IF NOT EXISTS documento_validacion_tipo varchar(80),
  ADD COLUMN IF NOT EXISTS documento_validacion_url text,
  ADD COLUMN IF NOT EXISTS documento_validacion_estado varchar(20) NOT NULL DEFAULT 'no_requerido'
    CHECK (documento_validacion_estado IN ('no_requerido', 'pendiente', 'validado', 'rechazado'));

CREATE INDEX IF NOT EXISTS idx_usuario_id_area ON usuario(id_area);

ALTER TABLE enfermero
  ADD COLUMN IF NOT EXISTS area_servicio varchar(120);

UPDATE usuario
SET documento_validacion_estado = 'pendiente'
WHERE documento_validacion_estado = 'no_requerido';
