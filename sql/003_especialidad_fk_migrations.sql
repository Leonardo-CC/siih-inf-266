-- sql/003_especialidad_fk_migration.sql
-- ============================================================
-- MIGRACIÓN: Convertir especialidad en FK en tabla medico
-- Problema: especialidad estaba como VARCHAR "suelto"
-- Solución: Crear FK a tabla especialidad
-- ============================================================

-- 1. Agregar columna temporal para almacenar la especialidad antigua
ALTER TABLE medico 
ADD COLUMN IF NOT EXISTS especialidad_temp VARCHAR(100);

-- 2. Copiar datos de especialidad actual a temporal
UPDATE medico 
SET especialidad_temp = especialidad 
WHERE especialidad IS NOT NULL;

-- 3. Crear tabla especialidad si no existe (ya debe existir de 002)
-- (Si ya existe, esto no hace nada)

-- 4. Agregar columna id_especialidad a medico
ALTER TABLE medico 
ADD COLUMN IF NOT EXISTS id_especialidad INTEGER;

-- 5. Poblar id_especialidad basado en el nombre de especialidad_temp
UPDATE medico m
SET id_especialidad = e.id_especialidad
FROM especialidad e
WHERE m.especialidad_temp = e.nombre
  AND m.especialidad_temp IS NOT NULL;

-- 6. Para especialidades que no existen en la tabla, crearlas
INSERT INTO especialidad (nombre, tarifa, descripcion, estado)
SELECT DISTINCT m.especialidad_temp, 200.00, CONCAT('Especialidad: ', m.especialidad_temp), 'activo'
FROM medico m
WHERE m.especialidad_temp IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM especialidad e WHERE e.nombre = m.especialidad_temp
  )
ON CONFLICT (nombre) DO NOTHING;

-- 7. Actualizar nuevamente para especialidades recién creadas
UPDATE medico m
SET id_especialidad = e.id_especialidad
FROM especialidad e
WHERE m.especialidad_temp = e.nombre
  AND m.id_especialidad IS NULL
  AND m.especialidad_temp IS NOT NULL;

-- 8. Hacer id_especialidad NOT NULL (opcional, comentar si quieres permitir NULL)
-- ALTER TABLE medico ALTER COLUMN id_especialidad SET NOT NULL;

-- 9. Crear FK constraint (CORREGIDO: Sin IF NOT EXISTS)
ALTER TABLE medico 
ADD CONSTRAINT fk_medico_especialidad 
FOREIGN KEY (id_especialidad) REFERENCES especialidad(id_especialidad);

-- 10. Eliminar columna especialidad antigua (comentar para mantener por seguridad)
-- ALTER TABLE medico DROP COLUMN IF EXISTS especialidad;

-- 11. Renombrar especialidad_temp a especialidad (para compatibilidad con queries antiguas)
ALTER TABLE medico 
RENAME COLUMN especialidad_temp TO especialidad_antigua;

-- ============================================================
-- VERIFICACIÓN:
-- SELECT m.id_medico, m.especialidad_antigua, e.nombre, e.tarifa 
-- FROM medico m 
-- LEFT JOIN especialidad e ON m.id_especialidad = e.id_especialidad;
-- ============================================================