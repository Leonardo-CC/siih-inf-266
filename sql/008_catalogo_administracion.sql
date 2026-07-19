-- sql/008_catalogo_administracion.sql
-- ============================================================
-- Catálogo administrable por el rol administrador:
--   - stock_maximo en medicamento (para control de stock)
--   - tabla tipo_seguro (catálogo de tipos de seguro)
--   - sincroniza paciente.tipo_seguro con el catálogo
-- ============================================================

-- 1. stock_maximo en medicamento (el mínimo ya existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'medicamento'
      AND column_name = 'stock_maximo'
  ) THEN
    ALTER TABLE medicamento
      ADD COLUMN stock_maximo INTEGER;
    ALTER TABLE medicamento
      ADD CONSTRAINT chk_medicamento_stock_max
        CHECK (stock_maximo IS NULL OR stock_maximo >= 0);
  END IF;
END;
$$;

-- 2. Tabla catálogo de tipos de seguro
CREATE TABLE IF NOT EXISTS tipo_seguro
(
  id_tipo_seguro   SERIAL PRIMARY KEY,
  nombre           VARCHAR(100) NOT NULL UNIQUE,
  descripcion      VARCHAR(255),
  estado           VARCHAR(10) NOT NULL DEFAULT 'activo'
                     CHECK (estado IN ('activo', 'inactivo')),
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tipo_seguro_estado
  ON tipo_seguro(estado);

-- 3. Poblar el catálogo con los tipos de seguro ya usados en paciente
INSERT INTO tipo_seguro (nombre, descripcion, estado)
SELECT DISTINCT p.tipo_seguro,
       'Tipo de seguro: ' || p.tipo_seguro,
       'activo'
FROM paciente p
WHERE p.tipo_seguro IS NOT NULL
  AND TRIM(p.tipo_seguro) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM tipo_seguro ts WHERE ts.nombre = p.tipo_seguro
  )
ON CONFLICT (nombre) DO NOTHING;

-- 4. Si no había ninguno, crear al menos uno por defecto
INSERT INTO tipo_seguro (nombre, descripcion, estado)
VALUES ('Universitario', 'Seguro universitario', 'activo')
ON CONFLICT (nombre) DO NOTHING;
