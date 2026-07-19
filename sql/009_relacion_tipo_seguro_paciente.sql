-- sql/009_relacion_tipo_seguro_paciente.sql
-- ============================================================
-- Relaciona paciente con el catalogo tipo_seguro.
-- Mantiene compatibilidad: paciente.tipo_seguro (VARCHAR legado)
-- sigue existiendo y se sincroniza con id_tipo_seguro via trigger.
--   - Si asignas id_tipo_seguro -> se escribe tipo_seguro = nombre.
--   - Si escribes tipo_seguro (texto) -> se resuelve id_tipo_seguro.
-- ============================================================

-- 1. Nueva columna de relacion
ALTER TABLE paciente
  ADD COLUMN IF NOT EXISTS id_tipo_seguro INTEGER;

-- 2. Poblar id_tipo_seguro con los tipos de seguro ya usados (por nombre)
UPDATE paciente p
SET id_tipo_seguro = ts.id_tipo_seguro
FROM tipo_seguro ts
WHERE p.id_tipo_seguro IS NULL
  AND p.tipo_seguro IS NOT NULL
  AND TRIM(p.tipo_seguro) <> ''
  AND ts.nombre = p.tipo_seguro;

-- 3. FK hacia el catalogo
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_paciente_tipo_seguro'
      AND table_name = 'paciente'
  ) THEN
    ALTER TABLE paciente
      ADD CONSTRAINT fk_paciente_tipo_seguro
      FOREIGN KEY (id_tipo_seguro) REFERENCES tipo_seguro(id_tipo_seguro)
      ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
END;
$$;

-- 4. Trigger de sincronizacion bidireccional (id <-> texto)
CREATE OR REPLACE FUNCTION fn_sincronizar_tipo_seguro_paciente()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Se asigno el ID -> completar el texto
  IF NEW.id_tipo_seguro IS NOT NULL AND (NEW.tipo_seguro IS NULL OR TRIM(NEW.tipo_seguro) = '') THEN
    SELECT ts.nombre INTO NEW.tipo_seguro
    FROM tipo_seguro ts
    WHERE ts.id_tipo_seguro = NEW.id_tipo_seguro;
  END IF;

  -- Se escribio el texto -> resolver el ID (si existe en el catalogo)
  IF NEW.tipo_seguro IS NOT NULL AND TRIM(NEW.tipo_seguro) <> '' AND NEW.id_tipo_seguro IS NULL THEN
    SELECT ts.id_tipo_seguro INTO NEW.id_tipo_seguro
    FROM tipo_seguro ts
    WHERE ts.nombre = NEW.tipo_seguro;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sincronizar_tipo_seguro_paciente ON paciente;

CREATE TRIGGER trg_sincronizar_tipo_seguro_paciente
BEFORE INSERT OR UPDATE ON paciente
FOR EACH ROW
EXECUTE FUNCTION fn_sincronizar_tipo_seguro_paciente();

-- 5. (Opcional) Asegurar que el catalogo tenga los valores ya usados en paciente
INSERT INTO tipo_seguro (nombre, descripcion, estado)
SELECT DISTINCT p.tipo_seguro,
       'Tipo de seguro: ' || p.tipo_seguro,
       'activo'
FROM paciente p
WHERE p.tipo_seguro IS NOT NULL
  AND TRIM(p.tipo_seguro) <> ''
  AND NOT EXISTS (SELECT 1 FROM tipo_seguro ts WHERE ts.nombre = p.tipo_seguro)
ON CONFLICT (nombre) DO NOTHING;

-- ============================================================
-- VERIFICACION:
-- SELECT id_paciente, tipo_seguro, id_tipo_seguro FROM paciente LIMIT 10;
-- ============================================================
