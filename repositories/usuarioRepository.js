// repositories/usuarioRepository.js
// ============================================================
// CAPA DE DATOS - Gestion de usuarios del sistema.
// ============================================================
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

export async function listarUsuarios() {
  const { data, error } = await supabaseAdmin
    .from('usuario')
    .select(`
      id_usuario,
      persona_id,
      ci,
      correo,
      rol,
      estado,
      persona:persona_id (
        nombre,
        apellido,
        telefono,
        fecha_nac,
        sexo
      )
    `)
    .order('id_usuario', { ascending: false })
    .limit(200);

  if (error) throw new Error(`Error al listar usuarios: ${error.message}`);

  return (data || []).map((u) => ({
    id_usuario: u.id_usuario,
    persona_id: u.persona_id,
    nombre: u.persona?.nombre || '',
    apellido: u.persona?.apellido || '',
    nombre_completo: u.persona ? `${u.persona.nombre} ${u.persona.apellido}` : `Usuario #${u.id_usuario}`,
    telefono: u.persona?.telefono || '',
    fecha_nac: u.persona?.fecha_nac || '',
    sexo: u.persona?.sexo || '',
    ci: u.ci || '',
    correo: u.correo || '',
    rol: u.rol || '',
    estado: u.estado || '',
  }));
}

export async function crearPersonaYUsuario({ nombre, apellido, fecha_nac, sexo, telefono, ci, correo, contrasenaHash, rol, estado = 'activo' }) {
  const { data: persona, error: errorPersona } = await supabaseAdmin
    .from('persona')
    .insert([{ nombre, apellido, fecha_nac: fecha_nac || null, sexo, telefono }])
    .select('persona_id')
    .single();

  if (errorPersona) throw new Error(`Error al crear persona: ${errorPersona.message}`);

  const { data: usuario, error: errorUsuario } = await supabaseAdmin
    .from('usuario')
    .insert([
      {
        persona_id: persona.persona_id,
        ci,
        correo,
        contrasena: contrasenaHash,
        rol,
        estado,
      },
    ])
    .select('id_usuario')
    .single();

  if (errorUsuario) {
    await supabaseAdmin.from('persona').delete().eq('persona_id', persona.persona_id);
    throw new Error(`Error al crear usuario: ${errorUsuario.message}`);
  }

  return { id_usuario: usuario.id_usuario, persona_id: persona.persona_id };
}

export async function actualizarUsuario(id_usuario, datos) {
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
  if (datos.fecha_nac !== undefined) updatesPersona.fecha_nac = datos.fecha_nac || null;
  if (datos.sexo !== undefined) updatesPersona.sexo = datos.sexo;

  if (Object.keys(updatesPersona).length > 0) {
    const { error } = await supabaseAdmin
      .from('persona')
      .update(updatesPersona)
      .eq('persona_id', usuario.persona_id);

    if (error) throw new Error(`Error actualizando persona: ${error.message}`);
  }

  const updatesUsuario = {};
  if (datos.ci !== undefined && datos.ci !== '') updatesUsuario.ci = datos.ci;
  if (datos.correo !== undefined && datos.correo !== '') updatesUsuario.correo = datos.correo;
  if (datos.rol !== undefined) updatesUsuario.rol = datos.rol;
  if (datos.estado !== undefined) updatesUsuario.estado = datos.estado;

  if (Object.keys(updatesUsuario).length > 0) {
    const { error } = await supabaseAdmin
      .from('usuario')
      .update(updatesUsuario)
      .eq('id_usuario', id_usuario);

    if (error) throw new Error(error.message);
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

export async function eliminarUsuario(id_usuario) {
  const { data: usuario } = await supabaseAdmin
    .from('usuario')
    .select('persona_id')
    .eq('id_usuario', id_usuario)
    .single();

  if (!usuario) throw new Error('Usuario no encontrado');

  const { error: errorUsuario } = await supabaseAdmin
    .from('usuario')
    .delete()
    .eq('id_usuario', id_usuario);

  if (errorUsuario) throw new Error(`Error al eliminar usuario: ${errorUsuario.message}`);

  const { error: errorPersona } = await supabaseAdmin
    .from('persona')
    .delete()
    .eq('persona_id', usuario.persona_id);

  if (errorPersona) throw new Error(`Error al eliminar persona: ${errorPersona.message}`);

  return { ok: true };
}
