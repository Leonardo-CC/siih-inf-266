-- sql/004_fix_metodo_pago.sql
-- Migración para Supabase: Cambiar columna metodo_pago a VARCHAR
-- Ejecutar esto en Supabase SQL Editor

-- Paso 1: Agregar nueva columna temporal como VARCHAR
ALTER TABLE pago 
ADD COLUMN metodo_pago_temp VARCHAR(20);

-- Paso 2: Copiar datos de la columna antigua a la nueva (convertir enum a VARCHAR)
UPDATE pago 
SET metodo_pago_temp = metodo_pago::text;

-- Paso 3: Eliminar la columna antigua (que es enum)
ALTER TABLE pago 
DROP COLUMN metodo_pago;

-- Paso 4: Renombrar la columna temporal a metodo_pago
ALTER TABLE pago 
RENAME COLUMN metodo_pago_temp TO metodo_pago;

-- Paso 5: Agregar constraint CHECK para validar valores
ALTER TABLE pago
ADD CONSTRAINT check_metodo_pago_values 
CHECK (metodo_pago IN ('efectivo', 'transferencia', 'tarjeta'));

-- Nota: Si la tabla tiene valores que no coinciden, habrá error
-- En ese caso, primero actualiza los valores existentes a 'efectivo', 'transferencia' o 'tarjeta'

