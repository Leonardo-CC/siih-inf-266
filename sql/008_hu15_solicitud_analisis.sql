-- 008_hu15_solicitud_analisis.sql
-- ============================================================
-- HU-15: Solicitud de análisis de laboratorio
-- Vincula la solicitud de analisis a la consulta que la origina
-- (dependencia HU-06). La columna id_consulta es OPCIONAL porque
-- un analisis tambien puede solicitarse directamente desde laboratorio.
-- ============================================================

ALTER TABLE analisis_laboratorio
  ADD COLUMN IF NOT EXISTS id_consulta INTEGER
    REFERENCES consulta(id_consulta) ON UPDATE CASCADE ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_analisis_laboratorio_consulta
  ON analisis_laboratorio(id_consulta);
