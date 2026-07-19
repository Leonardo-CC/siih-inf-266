// lib/errorMessages.js
// ============================================================
// Traduce errores tecnicos de Postgres/Supabase a mensajes
// amigables para el usuario final.
// ============================================================

const ETIQUETAS_COLUMNA = {
  ci: 'el CI',
  correo: 'el correo',
  email: 'el correo',
  numero_seguro: 'el numero de seguro',
  nombre: 'el nombre',
  id_cita: 'la cita',
  id_consulta: 'la consulta',
};

function extraerColumna(mensaje) {
  // Ej: duplicate key value violates unique constraint "usuario_ci_key"
  const match = mensaje.match(/unique constraint "([^"]+)"/i);
  if (match) {
    const partes = match[1].split('_');
    // usuario_ci_key -> ci ; uq_admision_cita -> cita
    const candidatos = partes.filter((p) => p !== 'key' && p !== 'uq' && p !== 'unique');
    for (const c of candidatos) {
      if (ETIQUETAS_COLUMNA[c]) return ETIQUETAS_COLUMNA[c];
    }
    const ultimo = candidatos[candidatos.length - 1];
    return ultimo ? `el campo "${ultimo}"` : 'un campo';
  }
  return null;
}

export function traducirError(error) {
  const mensaje = (error?.message || String(error || '')).trim();
  if (!mensaje) return 'Ocurrio un error inesperado. Intenta nuevamente.';

  const lower = mensaje.toLowerCase();

  if (lower.includes('duplicate key') || lower.includes('unique constraint')) {
    const columna = extraerColumna(mensaje);
    if (columna) {
      return `Ya existe un registro con ${columna} igual. Verifica que ${columna} no este repetido.`;
    }
    return 'Ya existe un registro con esos datos. Verifica la informacion e intenta de nuevo.';
  }

  if (lower.includes('foreign key') || lower.includes('violates foreign key')) {
    return 'El dato seleccionado no existe o no es valido. Revisa las opciones del formulario.';
  }

  if (lower.includes('null value') && lower.includes('violates not-null')) {
    const colMatch = mensaje.match(/column "([^"]+)"/i);
    const col = colMatch ? colMatch[1] : 'un campo';
    return `Falta completar ${ETIQUETAS_COLUMNA[col] || `el campo "${col}"`}.`;
  }

  if (lower.includes('check constraint')) {
    return 'Uno de los valores ingresados no cumple las reglas del sistema.';
  }

  if (lower.includes('value too long')) {
    return 'Uno de los campos supera el largo maximo permitido.';
  }

  if (lower.includes('connection') || lower.includes('fetch failed') || lower.includes('network')) {
    return 'No se pudo conectar con el servidor. Verifica tu conexion.';
  }

  if (lower.includes('timeout')) {
    return 'La operacion tardo demasiado. Intenta nuevamente.';
  }

  // Si es un mensaje ya legible en espanol corto, devolverlo.
  if (mensaje.length <= 120 && /[áéíóúñ¿]/i.test(mensaje)) {
    return mensaje;
  }

  return 'No se pudo completar la operacion. Intenta nuevamente.';
}
