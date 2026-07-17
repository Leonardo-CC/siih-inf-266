-- sql/004_crear_funcion_pago.sql
-- Crea una función RPC para insertar pagos que maneja el enum

CREATE OR REPLACE FUNCTION registrar_pago(
  p_id_consulta INT,
  p_monto DECIMAL,
  p_metodo_pago VARCHAR,
  p_comprobante VARCHAR
)
RETURNS TABLE(id_pago INT, exitoso BOOLEAN, razon VARCHAR) AS $$
DECLARE
  v_id_pago INT;
  v_metodo_estandarizado VARCHAR;
BEGIN
  -- Estandarizar el método de pago a los valores del enum
  v_metodo_estandarizado := LOWER(p_metodo_pago);
  
  -- Intentar insertar con el valor normalizado
  BEGIN
    INSERT INTO pago (id_consulta, monto, metodo_pago, comprobante, fecha_pago)
    VALUES (p_id_consulta, p_monto, v_metodo_estandarizado::metodo_pago_enum, p_comprobante, NOW())
    RETURNING pago.id_pago INTO v_id_pago;
    
    RETURN QUERY SELECT v_id_pago, TRUE::BOOLEAN, 'Pago registrado exitosamente'::VARCHAR;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT NULL::INT, FALSE::BOOLEAN, SQLERRM::VARCHAR;
  END;
END;
$$ LANGUAGE plpgsql;
