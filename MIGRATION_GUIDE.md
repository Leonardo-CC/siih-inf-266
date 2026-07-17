# Solución del Error de metodo_pago enum

## El Problema
Tu base de datos Supabase tiene la columna `metodo_pago` como tipo ENUM, pero con valores diferentes a los esperados ('efectivo', 'transferencia', 'tarjeta').

## Diagnosticar Primero (RÁPIDO)

Antes de hacer cambios, descubre qué valores son válidos:

1. Ve a tu navegador
2. Abre: `http://localhost:5173/api/pagos/diagnostico-pago`
3. Busca los valores marcados con `VÁLIDO ✓`
4. Copia esos valores y comparte conmigo

Esto te dirá exactamente qué valores acepta tu enum.

1. Ve a tu Supabase project: https://supabase.com
2. Abre el **SQL Editor**
3. Crea una nueva consulta
4. Copia y ejecuta el siguiente SQL:

```sql
-- Paso 1: Crear columna temporal VARCHAR
ALTER TABLE pago 
ADD COLUMN metodo_pago_temp VARCHAR(20);

-- Paso 2: Copiar datos (convertir enum a texto)
UPDATE pago 
SET metodo_pago_temp = metodo_pago::text;

-- Paso 3: Eliminar columna enum antigua
ALTER TABLE pago 
DROP COLUMN metodo_pago;

-- Paso 4: Renombrar columna temporal
ALTER TABLE pago 
RENAME COLUMN metodo_pago_temp TO metodo_pago;

-- Paso 5: Agregar constraint para validar valores
ALTER TABLE pago
ADD CONSTRAINT check_metodo_pago_values 
CHECK (metodo_pago IN ('efectivo', 'transferencia', 'tarjeta'));

-- Paso 6: Establecer valor por defecto
ALTER TABLE pago
ALTER COLUMN metodo_pago SET DEFAULT 'efectivo';
```

### Opción 2: Ver Qué Valores Tiene el Enum Actual

Si necesitas saber qué valores tiene el enum actualmente:

```sql
SELECT enum_range(NULL::metodo_pago_enum)::text[];
```

O para tablas:

```sql
SELECT column_default, data_type
FROM information_schema.columns
WHERE table_name = 'pago' AND column_name = 'metodo_pago';
```

## ¿Qué Hace el Código?

Los archivos actualizados ahora:
- Aceptan: `'efectivo'`, `'transferencia'`, `'tarjeta'`
- **Efectivo y Transferencia**: Quedan en estado `pendiente_validacion` (espera validación manual)
- **Tarjeta**: Se valida automáticamente (80% éxito)

## Después de Ejecutar la Migración

1. Reinicia tu servidor de desarrollo
2. Intenta crear un pago nuevamente
3. Debería funcionar correctamente

## Si Aún Así Tienes Problemas

Proporciona el error completo incluyendo: 
- El valor exacto que da el error
- La estructura de la tabla `pago` (puedes ejecutar `\d pago` en Supabase SQL Editor)
