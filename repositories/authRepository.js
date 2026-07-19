// repositories/authRepository.js
// ============================================================
// CAPA DE DATOS - Autenticacion por usuario.correo.
// ============================================================
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

function normalizarUsuario(data) {
  if (!data) return null;
  return {
    id_usuario: data.id_usuario,
    persona_id: data.persona_id,
    correo: data.correo,
    contrasena_hash: data.contrasena || data['contraseña'] || data['contraseÃ±a'],
    rol: data.rol,
    estado: data.estado,
    nombre: data.persona?.nombre || '',
    apellido: data.persona?.apellido || '',
  };
}

export async function buscarUsuarioLogin(correo) {
  const baseSelect = 'id_usuario, persona_id, correo, rol, estado, persona:persona_id (nombre, apellido)';

  const intentos = [
    `${baseSelect}, contrasena`,
    `${baseSelect}, contraseña`,
    `${baseSelect}, contraseÃ±a`,
  ];

  let ultimoError = null;

  for (const select of intentos) {
    const { data, error } = await supabaseAdmin
      .from('usuario')
      .select(select)
      .eq('correo', correo)
      .maybeSingle();

    if (!error) return normalizarUsuario(data);
    ultimoError = error;
  }

  throw new Error(`Error al buscar usuario: ${ultimoError?.message || 'columna de contraseña no encontrada'}`);
}

// Variantes de encoding de la columna de contraseña (problemas de ñ en el schema cache).
export const COLUMNAS_CONTRASENA = ['contrasena', 'contraseña', 'contraseÃ±a'];

// Intenta leer la contraseña de un registro de usuario probando las 3 variantes.
export async function leerContrasenaPorPersona(persona_id) {
  const { supabaseAdmin } = await import('../lib/supabaseAdmin.js');
  let ultimoError = null;
  for (const col of COLUMNAS_CONTRASENA) {
    const { data, error } = await supabaseAdmin
      .from('usuario')
      .select(col)
      .eq('persona_id', persona_id)
      .maybeSingle();
    if (!error && data) {
      return { hash: data[col] || data['contrasena'] || data['contraseña'] || data['contraseÃ±a'], error: null };
    }
    if (error) ultimoError = error;
  }
  return { hash: null, error: ultimoError };
}

// Intenta actualizar la contraseña de un usuario probando las 3 variantes de columna.
export async function actualizarContrasenaPorPersona(persona_id, hash) {
  const { supabaseAdmin } = await import('../lib/supabaseAdmin.js');
  let ultimoError = null;
  for (const col of COLUMNAS_CONTRASENA) {
    const { error } = await supabaseAdmin
      .from('usuario')
      .update({ [col]: hash })
      .eq('persona_id', persona_id);
    if (!error) return { error: null };
    ultimoError = error;
  }
  return { error: ultimoError };
}

// Resuelve el id_enfermero a partir del persona_id (null si no es enfermero).
export async function obtenerIdEnfermeroPorPersona(persona_id) {
  const { data } = await supabaseAdmin
    .from('enfermero')
    .select('id_enfermero')
    .eq('persona_id', persona_id)
    .maybeSingle();
  return data?.id_enfermero ?? null;
}

// Resuelve el id_medico a partir del persona_id (null si no es medico).
export async function obtenerIdMedicoPorPersona(persona_id) {
  const { data } = await supabaseAdmin
    .from('medico')
    .select('id_medico')
    .eq('persona_id', persona_id)
    .maybeSingle();
  return data?.id_medico ?? null;
}

// Resuelve el id_tecnico_laboratorio a partir del persona_id (null si no es tecnico de laboratorio).
export async function obtenerIdTecnicoLaboratorioPorPersona(persona_id) {
  const { data } = await supabaseAdmin
    .from('tecnico_laboratorio')
    .select('id_tecnico_laboratorio')
    .eq('persona_id', persona_id)
    .maybeSingle();
  return data?.id_tecnico_laboratorio ?? null;
}
