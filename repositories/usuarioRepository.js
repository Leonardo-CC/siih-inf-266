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

  const usuarios = data || [];
  const personaIdsMedicos = usuarios.filter((u) => u.rol === 'medico').map((u) => u.persona_id);

  let medicosPorPersona = {};
  if (personaIdsMedicos.length > 0) {
    const { data: medicos, error: errorMedicos } = await supabaseAdmin
      .from('medico')
      .select('persona_id, nro_licencia, id_especialidad')
      .in('persona_id', personaIdsMedicos);

    if (errorMedicos) throw new Error(`Error al listar médicos: ${errorMedicos.message}`);
    medicosPorPersona = Object.fromEntries((medicos || []).map((m) => [m.persona_id, m]));
  }

  return usuarios.map((u) => {
    const medico = medicosPorPersona[u.persona_id];
    return {
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
      nro_licencia: medico?.nro_licencia || '',
      id_especialidad: medico?.id_especialidad || '',
    };
  });
}

export async function crearPersonaYUsuario({ nombre, apellido, fecha_nac, sexo, telefono, ci, correo, contrasenaHash, rol, estado = 'activo', nro_licencia, id_especialidad }) {
  const { data: persona, error: errorPersona } = await supabaseAdmin
    .from('persona')
    .insert([{ nombre, apellido, fecha_nac: fecha_nac || null, sexo, telefono }])
    .select('persona_id')
    .single();

  if (errorPersona) throw new Error(`Error al crear persona: ${errorPersona.message}`);

  const { data: usuario, error: errorUsuario } = await supabaseAdmin
    .from('usuario')
    .insert([{ persona_id: persona.persona_id, ci, correo, contrasena: contrasenaHash, rol, estado }])
    .select('id_usuario')
    .single();

  if (errorUsuario) {
    await supabaseAdmin.from('persona').delete().eq('persona_id', persona.persona_id);
    throw new Error(`Error al crear usuario: ${errorUsuario.message}`);
  }

  if (rol === 'medico') {
    const { error: errorMedico } = await supabaseAdmin
      .from('medico')
      .insert([{ persona_id: persona.persona_id, nro_licencia, id_especialidad }]);

    if (errorMedico) {
      // Revertimos todo: no queremos un usuario "medico" sin fila en medico
      await supabaseAdmin.from('usuario').delete().eq('id_usuario', usuario.id_usuario);
      await supabaseAdmin.from('persona').delete().eq('persona_id', persona.persona_id);

      if (errorMedico.code === '23505') throw new Error('DUPLICADO_NRO_LICENCIA');
      throw new Error(`Error al crear médico: ${errorMedico.message}`);
    }
  }

  return { id_usuario: usuario.id_usuario, persona_id: persona.persona_id };
}

export async function actualizarUsuario(id_usuario, datos) {
  const { data: usuario } = await supabaseAdmin
    .from('usuario')
    .select('persona_id, rol')
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
    const { error } = await supabaseAdmin.from('persona').update(updatesPersona).eq('persona_id', usuario.persona_id);
    if (error) throw new Error(`Error actualizando persona: ${error.message}`);
  }

  const updatesUsuario = {};
  if (datos.ci !== undefined && datos.ci !== '') updatesUsuario.ci = datos.ci;
  if (datos.correo !== undefined && datos.correo !== '') updatesUsuario.correo = datos.correo;
  if (datos.rol !== undefined) updatesUsuario.rol = datos.rol;
  if (datos.estado !== undefined) updatesUsuario.estado = datos.estado;

  if (Object.keys(updatesUsuario).length > 0) {
    const { error } = await supabaseAdmin.from('usuario').update(updatesUsuario).eq('id_usuario', id_usuario);
    if (error) throw new Error(error.message);
  }

  if (datos.contrasenaHash !== undefined) {
    const { error } = await supabaseAdmin.from('usuario').update({ contrasena: datos.contrasenaHash }).eq('id_usuario', id_usuario);
    if (error) throw new Error(`Error actualizando contraseña: ${error.message}`);
  }

  const rolFinal = datos.rol !== undefined ? datos.rol : usuario.rol;
  if (rolFinal === 'medico' && (datos.nro_licencia !== undefined || datos.id_especialidad !== undefined)) {
    const { data: medicoExistente } = await supabaseAdmin
      .from('medico')
      .select('id_medico')
      .eq('persona_id', usuario.persona_id)
      .maybeSingle();

    const datosMedico = {};
    if (datos.nro_licencia !== undefined) datosMedico.nro_licencia = datos.nro_licencia;
    if (datos.id_especialidad !== undefined) datosMedico.id_especialidad = datos.id_especialidad;

    const { error: errorMedico } = medicoExistente
      ? await supabaseAdmin.from('medico').update(datosMedico).eq('persona_id', usuario.persona_id)
      : await supabaseAdmin.from('medico').insert([{ persona_id: usuario.persona_id, ...datosMedico }]);

    if (errorMedico) {
      if (errorMedico.code === '23505') throw new Error('DUPLICADO_NRO_LICENCIA');
      throw new Error(`Error actualizando médico: ${errorMedico.message}`);
    }
  }

  return { ok: true };
}

export async function eliminarUsuario(id_usuario) {
  const { data: usuario } = await supabaseAdmin
    .from('usuario')
    .select('persona_id, rol')
    .eq('id_usuario', id_usuario)
    .single();

  if (!usuario) throw new Error('Usuario no encontrado');

  if (usuario.rol === 'medico') {
    const { error: errorMedico } = await supabaseAdmin.from('medico').delete().eq('persona_id', usuario.persona_id);
    if (errorMedico) throw new Error(`Error al eliminar médico: ${errorMedico.message}`);
  }

  const { error: errorUsuario } = await supabaseAdmin.from('usuario').delete().eq('id_usuario', id_usuario);
  if (errorUsuario) throw new Error(`Error al eliminar usuario: ${errorUsuario.message}`);

  const { error: errorPersona } = await supabaseAdmin.from('persona').delete().eq('persona_id', usuario.persona_id);
  if (errorPersona) throw new Error(`Error al eliminar persona: ${errorPersona.message}`);

  return { ok: true };
}

export async function listarEspecialidadesActivas() {
  const { data, error } = await supabaseAdmin
    .from('especialidad')
    .select('id_especialidad, nombre')
    .eq('estado', 'activo')
    .order('nombre', { ascending: true });

  if (error) throw new Error(`Error al listar especialidades: ${error.message}`);
  return data || [];
}