// repositories/pacienteRepository.js
// ============================================================
// CAPA DE DATOS
// Acceso directo a las tablas persona / usuario / paciente
// (según el Diccionario de Datos, Sección 4.3.1 del documento).
// Este archivo NO contiene reglas de negocio, solo queries.
// ============================================================
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

// Busca si ya existe un usuario con ese CI o ese correo (para validar duplicados).
export async function buscarUsuarioPorCiOCorreo(ci, correo) {
  const { data, error } = await supabaseAdmin
    .from('usuario')
    .select('id_usuario, ci, correo')
    .or(`ci.eq.${ci},correo.eq.${correo}`);

  if (error) throw new Error(`Error al verificar duplicados: ${error.message}`);
  return data;
}

// Inserta en la tabla base "persona" y devuelve su persona_id.
export async function crearPersona({ nombre, apellido, fecha_nac, sexo, telefono }) {
  const { data, error } = await supabaseAdmin
    .from('persona')
    .insert([{ nombre, apellido, fecha_nac: fecha_nac || null, sexo, telefono }])
    .select('persona_id')
    .single();

  if (error) throw new Error(`Error al crear persona: ${error.message}`);
  return data.persona_id;
}

// Inserta en "usuario" con rol fijo 'paciente' y estado 'activo'.
export async function crearUsuario({ persona_id, ci, correo, contrasenaHash }) {
  const { data, error } = await supabaseAdmin
    .from('usuario')
    .insert([
      {
        persona_id,
        ci,
        correo,
        'contraseña': contrasenaHash,
        rol: 'paciente',
        estado: 'activo',
      },
    ])
    .select('id_usuario')
    .single();

  if (error) throw new Error(`Error al crear usuario: ${error.message}`);
  return data.id_usuario;
}

// Inserta la especialización "paciente" ligada a la misma persona_id.
export async function crearPaciente({ persona_id, tipo_seguro, numero_seguro }) {
  const { data, error } = await supabaseAdmin
    .from('paciente')
    .insert([{ persona_id, tipo_seguro: tipo_seguro || null, numero_seguro: numero_seguro || null }])
    .select('id_paciente')
    .single();

  if (error) throw new Error(`Error al crear paciente: ${error.message}`);
  return data.id_paciente;
}

// Rollback manual: Supabase (vía API REST/JS) no soporta transacciones
// multi-tabla nativas, así que si falla un paso posterior a "persona",
// eliminamos la persona creada para no dejar registros huérfanos.
export async function eliminarPersona(persona_id) {
  await supabaseAdmin.from('persona').delete().eq('persona_id', persona_id);
}
