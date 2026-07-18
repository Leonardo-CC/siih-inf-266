-- sql/006_hu10_registro_signos_vitales.sql
-- ============================================================
-- HU-10 / RF10: Registro de signos vitales
-- Como enfermero(a), registra presion arterial, temperatura y
-- frecuencia cardiaca previo a la atencion medica.
-- Dependencia: HU-11 (gestion de admision) -> consulta.
-- La tabla signos_vitales ya existe en el esquema base; aqui se
-- agrega la columna frecuencia_cardiaca, la validacion de rango
-- y la vista de consulta. Script idempotente (ejecutable varias
-- veces sin error).
-- ============================================================

-- ------------------------------------------------------------
-- COLUMNA frecuencia_cardiaca EN signos_vitales
-- (la tabla base la omite; la HU-10 la requiere)
-- ------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'signos_vitales'
      AND column_name = 'frecuencia_cardiaca'
  ) THEN
    ALTER TABLE signos_vitales ADD COLUMN frecuencia_cardiaca INTEGER;

    ALTER TABLE signos_vitales ADD CONSTRAINT chk_frecuencia_cardiaca
      CHECK (frecuencia_cardiaca IS NULL OR frecuencia_cardiaca BETWEEN 30 AND 220);
  END IF;
END;
$$;

-- ------------------------------------------------------------
-- AJUSTE DE RANGO DE TEMPERATURA SEGUN RF10 (34-42 °C)
-- ------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage ccu
    JOIN information_schema.check_constraints cc
      ON cc.constraint_name = ccu.constraint_name
    WHERE ccu.table_name = 'signos_vitales'
      AND ccu.column_name = 'temperatura'
      AND cc.check_clause ILIKE '%30%'
  ) THEN
    ALTER TABLE signos_vitales DROP CONSTRAINT IF EXISTS chk_temperatura;

    ALTER TABLE signos_vitales ADD CONSTRAINT chk_temperatura
      CHECK (temperatura IS NULL OR temperatura BETWEEN 34 AND 42);
  END IF;
END;
$$;

-- ------------------------------------------------------------
-- VALIDACION DE RANGO Y TRAZABILIDAD DE SIGNOS VITALES
-- Presion: formato sistolica/diastolica (mmHg).
-- Temperatura: 34..42 °C (RF10).
-- Frecuencia cardiaca: 30..220 lpm.
-- Trazabilidad HU-10 -> HU-11: la consulta debe existir y estar
-- en estado 'pendiente' o 'confirmada' (no atendida/cancelada).
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_validar_signos_vitales()
RETURNS TRIGGER
LANGUAGE plpgsql
AS
$$
DECLARE
  v_sistolica INTEGER;
  v_diastolica INTEGER;
  v_partes TEXT[];
  v_estado TEXT;
BEGIN
  IF NEW.presion_arterial IS NOT NULL THEN
    IF NEW.presion_arterial !~ '^\d{2,3}\s*/\s*\d{2,3}$' THEN
      RAISE EXCEPTION
        'La presion arterial debe tener el formato sistolica/diastolica (ej. 120/80).';
    END IF;

    v_partes := string_to_array(regexp_replace(NEW.presion_arterial, '\s+', '', 'g'), '/');
    v_sistolica := v_partes[1]::INTEGER;
    v_diastolica := v_partes[2]::INTEGER;

    IF v_sistolica < 60 OR v_sistolica > 260 THEN
      RAISE EXCEPTION 'La presion sistolica debe estar entre 60 y 260 mmHg.';
    END IF;

    IF v_diastolica < 30 OR v_diastolica > 160 THEN
      RAISE EXCEPTION 'La presion diastolica debe estar entre 30 y 160 mmHg.';
    END IF;

    IF v_diastolica >= v_sistolica THEN
      RAISE EXCEPTION 'La presion diastolica debe ser menor a la sistolica.';
    END IF;
  END IF;

  IF NEW.temperatura IS NOT NULL THEN
    IF NEW.temperatura < 34 OR NEW.temperatura > 42 THEN
      RAISE EXCEPTION 'La temperatura debe estar entre 34 y 42 °C.';
    END IF;
  END IF;

  IF NEW.frecuencia_cardiaca IS NOT NULL THEN
    IF NEW.frecuencia_cardiaca < 30 OR NEW.frecuencia_cardiaca > 220 THEN
      RAISE EXCEPTION 'La frecuencia cardiaca debe estar entre 30 y 220 lpm.';
    END IF;
  END IF;

  IF NEW.id_consulta IS NOT NULL THEN
    SELECT c.estado::TEXT
    INTO v_estado
    FROM consulta c
    WHERE c.id_consulta = NEW.id_consulta;

    IF v_estado IS NULL THEN
      RAISE EXCEPTION 'La consulta % no existe.', NEW.id_consulta;
    END IF;

    IF v_estado NOT IN ('pendiente', 'confirmada') THEN
      RAISE EXCEPTION
        'No se pueden registrar signos vitales: la consulta % esta en estado % (debe ser pendiente o confirmada).',
        NEW.id_consulta, v_estado;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validar_signos_vitales ON signos_vitales;

CREATE TRIGGER trg_validar_signos_vitales
BEFORE INSERT OR UPDATE
ON signos_vitales
FOR EACH ROW
EXECUTE FUNCTION fn_validar_signos_vitales();

-- ------------------------------------------------------------
-- INDICES DE APOYO
-- ------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_signos_enfermero
ON signos_vitales(id_enfermero);

CREATE INDEX IF NOT EXISTS idx_signos_fecha
ON signos_vitales(fecha_hora);

-- ------------------------------------------------------------
-- VISTA: SIGNOS VITALES POR CONSULTA
-- ------------------------------------------------------------

CREATE OR REPLACE VIEW vw_signos_vitales AS
SELECT
  sv.id_signos,
  sv.id_consulta,
  sv.fecha_hora,
  sv.presion_arterial,
  sv.temperatura,
  sv.frecuencia_cardiaca,
  sv.observaciones,
  sv.id_enfermero,
  per_e.nombre   AS enfermero_nombre,
  per_e.apellido AS enfermero_apellido,
  c.id_paciente,
  per_p.nombre   AS paciente_nombre,
  per_p.apellido AS paciente_apellido
FROM signos_vitales sv
INNER JOIN consulta c
  ON c.id_consulta = sv.id_consulta
INNER JOIN enfermero e
  ON e.id_enfermero = sv.id_enfermero
INNER JOIN persona per_e
  ON per_e.persona_id = e.persona_id
INNER JOIN paciente p
  ON p.id_paciente = c.id_paciente
INNER JOIN persona per_p
  ON per_p.persona_id = p.persona_id;

COMMENT ON TABLE signos_vitales IS
'Registro de signos vitales (presion, temperatura, frecuencia cardiaca) realizado por enfermeria previo a la atencion medica.';

-- ============================================================
-- PRUEBA MANUAL
-- Cambia los IDs por registros existentes antes de ejecutar.
-- ============================================================
--
-- INSERT INTO signos_vitales
--   (id_consulta, presion_arterial, temperatura, frecuencia_cardiaca, id_enfermero)
-- VALUES
--   (1, '120/80', 36.8, 80, 1);
--
-- SELECT * FROM vw_signos_vitales;
