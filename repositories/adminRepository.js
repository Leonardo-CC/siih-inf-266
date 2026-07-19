// repositories/adminRepository.js
// ============================================================
// CAPA DE DATOS - Perfil del usuario administrativo.
// ============================================================
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

export async function obtenerPerfilAdmin(id_usuario) {
  const { data, error } = await supabaseAdmin
    .from('usuario')
    .select(`
      id_usuario,
      persona_id,
      ci,
      correo,
      rol,
      estado,
      contrasena,
      persona:persona_id (
        nombre,
        apellido,
        telefono,
        fecha_nac,
        sexo
      )
    `)
    .eq('id_usuario', id_usuario)
    .single();

  if (error) throw new Error(`Error al obtener perfil: ${error.message}`);

  return {
    id_usuario: data.id_usuario,
    persona_id: data.persona_id,
    nombre: data.persona?.nombre || '',
    apellido: data.persona?.apellido || '',
    telefono: data.persona?.telefono || '',
    fecha_nac: data.persona?.fecha_nac || '',
    sexo: data.persona?.sexo || '',
    ci: data.ci || '',
    correo: data.correo || '',
    rol: data.rol || '',
    estado: data.estado || '',
    contrasena_hash: data.contrasena || data['contraseña'] || data['contraseÃ±a'] || '',
  };
}

export async function actualizarPerfilAdmin(id_usuario, datos) {
  const { data: usuario } = await supabaseAdmin
    .from('usuario')
    .select('persona_id')
    .eq('id_usuario', id_usuario)
    .single();

  if (!usuario) throw new Error('Usuario no encontrado');

  const updatesPersona = {};
  if (datos.nombre !== undefined) updatesPersona.nombre = datos.nombre;
  if (datos.apellido !== undefined) updatesPersona.apellido = datos.apellido;
  if (datos.telefono !== undefined) updatesPersona.telefono = datos.telefono || null;

  if (Object.keys(updatesPersona).length > 0) {
    const { error } = await supabaseAdmin
      .from('persona')
      .update(updatesPersona)
      .eq('persona_id', usuario.persona_id);

    if (error) throw new Error(`Error actualizando persona: ${error.message}`);
  }

  const updatesUsuario = {};
  if (datos.correo !== undefined && datos.correo !== '') updatesUsuario.correo = datos.correo;

  if (Object.keys(updatesUsuario).length > 0) {
    const { error } = await supabaseAdmin
      .from('usuario')
      .update(updatesUsuario)
      .eq('id_usuario', id_usuario);

    if (error) throw new Error(`Error actualizando correo: ${error.message}`);
  }

  if (datos.contrasenaHash !== undefined) {
    const { error } = await supabaseAdmin
      .from('usuario')
      .update({ contrasena: datos.contrasenaHash })
      .eq('id_usuario', id_usuario);

    if (error) throw new Error(`Error actualizando contraseña: ${error.message}`);
  }

  return { ok: true };
}
