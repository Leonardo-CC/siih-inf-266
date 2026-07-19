-- sql/010_eliminar_tipo_seguro_texto.sql
-- ============================================================
-- Paciente ahora usa SOLO id_tipo_seguro (FK a tipo_seguro).
-- Se elimina la columna legada tipo_seguro (VARCHAR) y el
-- trigger de sincronizacion creado en el script 009.
-- ============================================================

-- 1. Quitar el trigger de sincronizacion (ya no aplica)
DROP TRIGGER IF EXISTS trg_sincronizar_tipo_seguro_paciente ON paciente;
DROP FUNCTION IF EXISTS fn_sincronizar_tipo_seguro_paciente();

-- 2. Asegurar que todo paciente con tipo_seguro (texto) tenga su id antes de borrar
--    (por si el script 009 no se ejecuto o quedo a medias)
UPDATE paciente p
SET id_tipo_seguro = ts.id_tipo_seguro
FROM tipo_seguro ts
WHERE p.id_tipo_seguro IS NULL
  AND p.tipo_seguro IS NOT NULL
  AND TRIM(p.tipo_seguro) <> ''
  AND ts.nombre = p.tipo_seguro;

-- 3. Eliminar la columna de texto legada
ALTER TABLE paciente DROP COLUMN IF EXISTS tipo_seguro;

-- 4. Migrar validacion_seguro: de tipo_seguro (VARCHAR) a id_tipo_seguro (FK)
--    Resolver el id a partir del nombre legado antes de borrar la columna.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'validacion_seguro'
      AND column_name = 'id_tipo_seguro'
  ) THEN
    ALTER TABLE validacion_seguro
      ADD COLUMN id_tipo_seguro INTEGER;
    ALTER TABLE validacion_seguro
      ADD CONSTRAINT fk_validacion_seguro_tipo_seguro
        FOREIGN KEY (id_tipo_seguro) REFERENCES tipo_seguro(id_tipo_seguro);
  END IF;
END;
$$;

UPDATE validacion_seguro v
SET id_tipo_seguro = ts.id_tipo_seguro
FROM tipo_seguro ts
WHERE v.id_tipo_seguro IS NULL
  AND v.tipo_seguro IS NOT NULL
  AND TRIM(v.tipo_seguro) <> ''
  AND ts.nombre = v.tipo_seguro;

ALTER TABLE validacion_seguro DROP COLUMN IF EXISTS tipo_seguro;

-- ============================================================
-- VERIFICACION:
-- SELECT id_paciente, id_tipo_seguro FROM paciente LIMIT 10;
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name='paciente' AND column_name='tipo_seguro'; -- debe estar vacio
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name='validacion_seguro' AND column_name='tipo_seguro'; -- debe estar vacio
-- ============================================================
