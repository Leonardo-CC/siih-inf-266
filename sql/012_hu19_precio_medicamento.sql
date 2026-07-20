-- sql/012_hu19_precio_medicamento.sql
-- ============================================================
-- HU-19: Agrega columna precio a medicamento.
-- ============================================================
ALTER TABLE medicamento
  ADD COLUMN IF NOT EXISTS precio DECIMAL(10,2) NOT NULL DEFAULT 0.00;

ALTER TABLE medicamento
  DROP CONSTRAINT IF EXISTS chk_medicamento_precio;

ALTER TABLE medicamento
  ADD CONSTRAINT chk_medicamento_precio CHECK (precio >= 0);
