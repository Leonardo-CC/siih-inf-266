-- sql/011_hu08_prescripcion_medicamentos.sql
-- ============================================================
-- HU-08: Prescripción de medicamentos
-- Como médico, quiero recetar medicamentos de forma electrónica
-- y que farmacia los vea de inmediato.
-- Dependencia: HU-06 (historia clínica/consulta); habilita HU-13 (dispensación).
-- ============================================================

-- ------------------------------------------------------------
-- HISTORIAL_CLINICO (si no existe)
-- Vincula la consulta con el registro clínico formal.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS historial_clinico (
  id_historial    SERIAL PRIMARY KEY,
  id_consulta     INT UNIQUE REFERENCES consulta(id_consulta) ON DELETE CASCADE,
  diagnostico     TEXT,
  observaciones   TEXT,
  alergias        TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_historial_clinico_consulta
  ON historial_clinico(id_consulta);

-- ------------------------------------------------------------
-- RECETA (si no existe)
-- Cabecera de la prescripción electrónica.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS receta (
  id_receta              SERIAL PRIMARY KEY,
  id_historial_clinico   INT NOT NULL REFERENCES historial_clinico(id_historial) ON DELETE CASCADE,
  fecha_emision          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  estado                 VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                           CHECK (estado IN ('pendiente', 'despachada', 'entregada', 'cancelada')),
  observaciones          TEXT,
  created_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_receta_historial
  ON receta(id_historial_clinico);

CREATE INDEX IF NOT EXISTS idx_receta_estado
  ON receta(estado);

-- ------------------------------------------------------------
-- DETALLE_RECETA (si no existe)
-- Cada medicamento prescrito con dosis, frecuencia y duración.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS detalle_receta (
  id_detalle_receta  SERIAL PRIMARY KEY,
  id_receta          INT NOT NULL REFERENCES receta(id_receta) ON DELETE CASCADE,
  id_medicamento     INT NOT NULL REFERENCES medicamento(id_medicamento),
  cantidad           INT NOT NULL CHECK (cantidad > 0),
  dosis              VARCHAR(100) NOT NULL,
  frecuencia         VARCHAR(100) NOT NULL,
  duracion           VARCHAR(100) NOT NULL,
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_detalle_receta_receta
  ON detalle_receta(id_receta);

CREATE INDEX IF NOT EXISTS idx_detalle_receta_medicamento
  ON detalle_receta(id_medicamento);

-- ------------------------------------------------------------
-- MEDICAMENTO (si no existe)
-- Catálogo de medicamentos disponibles.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS medicamento (
  id_medicamento   SERIAL PRIMARY KEY,
  nombre           VARCHAR(200) NOT NULL,
  descripcion      TEXT,
  stock_actual     INT NOT NULL DEFAULT 0 CHECK (stock_actual >= 0),
  stock_minimo     INT NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0),
  stock_maximo     INT CHECK (stock_maximo >= 0),
  estado           VARCHAR(10) NOT NULL DEFAULT 'activo'
                     CHECK (estado IN ('activo', 'inactivo')),
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_medicamento_estado
  ON medicamento(estado);

-- Seed mínimo de medicamentos para demo (solo si no hay datos)
INSERT INTO medicamento (nombre, descripcion, stock_actual, stock_minimo)
SELECT 'Paracetamol 500mg', 'Analgésico y antipirético', 100, 20
WHERE NOT EXISTS (SELECT 1 FROM medicamento WHERE nombre = 'Paracetamol 500mg');

INSERT INTO medicamento (nombre, descripcion, stock_actual, stock_minimo)
SELECT 'Ibuprofeno 400mg', 'Antiinflamatorio no esteroideo', 80, 15
WHERE NOT EXISTS (SELECT 1 FROM medicamento WHERE nombre = 'Ibuprofeno 400mg');

INSERT INTO medicamento (nombre, descripcion, stock_actual, stock_minimo)
SELECT 'Amoxicilina 500mg', 'Antibiótico', 60, 10
WHERE NOT EXISTS (SELECT 1 FROM medicamento WHERE nombre = 'Amoxicilina 500mg');

INSERT INTO medicamento (nombre, descripcion, stock_actual, stock_minimo)
SELECT 'Omeprazol 20mg', 'Inhibidor de bomba de protones', 90, 20
WHERE NOT EXISTS (SELECT 1 FROM medicamento WHERE nombre = 'Omeprazol 20mg');

INSERT INTO medicamento (nombre, descripcion, stock_actual, stock_minimo)
SELECT 'Loratadina 10mg', 'Antihistamínico', 70, 15
WHERE NOT EXISTS (SELECT 1 FROM medicamento WHERE nombre = 'Loratadina 10mg');
