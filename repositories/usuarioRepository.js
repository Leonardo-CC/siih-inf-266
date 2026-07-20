// repositories/usuarioRepository.js
// ============================================================
// CAPA DE DATOS - Gestion de usuarios del sistema.
// Crea y mantiene persona/usuario y la tabla especifica del rol.
// ============================================================
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

const ROLES_CON_DOCUMENTO_UNIVERSITARIO = ['paciente', 'medico', 'enfermero', 'farmaceutico', 'administrativo', 'tecnico_laboratorio'];
const ROLES_ESPECIALIZADOS = ['paciente', 'medico', 'enfermero', 'farmaceutico', 'administrativo', 'tecnico_laboratorio'];

async function selectConFallback(tabla, selectCompleto, selectBase, personaIds) {
  if (!personaIds.length) return [];

  let { data, error } = await supabaseAdmin
    .from(tabla)
    .select(selectCompleto)
    .in('persona_id', personaIds);

  if (error && error.code === 'PGRST204') {
    ({ data, error } = await supabaseAdmin
      .from(tabla)
      .select(selectBase)
      .in('persona_id', personaIds));
  }

  if (error) throw new Error(`Error al listar ${tabla}: ${error.message}`);
  return data || [];
}

export async function listarUsuarios() {
  const selectCompleto = `
      id_usuario,
      persona_id,
      ci,
      correo,
      rol,
      estado,
      id_area,
      codigo_universitario,
      documento_validacion_tipo,
      documento_validacion_url,
      documento_validacion_estado,
      persona:persona_id (
        nombre,
        apellido,
        telefono,
        fecha_nac,
        sexo
      )
    `;
  const selectBase = `
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
    `;

  let { data, error } = await supabaseAdmin
    .from('usuario')
    .select(selectCompleto)
    .order('id_usuario', { ascending: false })
    .limit(200);

  if (error && error.code === 'PGRST204') {
    ({ data, error } = await supabaseAdmin
      .from('usuario')
      .select(selectBase)
      .order('id_usuario', { ascending: false })
      .limit(200));
  }

  if (error) throw new Error(`Error al listar usuarios: ${error.message}`);

  const usuarios = data || [];
  const personaIds = usuarios.map((u) => u.persona_id).filter(Boolean);
  const areaIds = [...new Set(usuarios.map((u) => u.id_area).filter(Boolean))];

  const [medicos, enfermeros, farmaceuticos, administrativos, tecnicos, pacientes] = await Promise.all([
    selectConFallback('medico', 'persona_id, nro_licencia, id_especialidad', 'persona_id, nro_licencia, id_especialidad', personaIds),
    selectConFallback('enfermero', 'persona_id, area_servicio', 'persona_id', personaIds),
    selectConFallback('farmaceutico', 'persona_id, nro_licencia', 'persona_id, nro_licencia', personaIds),
    selectConFallback('administrativo', 'persona_id, cargo', 'persona_id', personaIds),
    selectConFallback('tecnico_laboratorio', 'persona_id, numero_licencia, especialidad_laboratorio', 'persona_id, numero_licencia, especialidad_laboratorio', personaIds),
    selectConFallback('paciente', 'persona_id, matricula_numero, matricula_foto_url', 'persona_id', personaIds),
  ]);

  const porPersona = (filas) => Object.fromEntries((filas || []).map((fila) => [fila.persona_id, fila]));
  const medicosPorPersona = porPersona(medicos);
  const enfermerosPorPersona = porPersona(enfermeros);
  const farmaceuticosPorPersona = porPersona(farmaceuticos);
  const administrativosPorPersona = porPersona(administrativos);
  const tecnicosPorPersona = porPersona(tecnicos);
  const pacientesPorPersona = porPersona(pacientes);
  let areasPorId = {};
  if (areaIds.length > 0) {
    const { data: areas } = await supabaseAdmin
      .from('area_facultad')
      .select('id_area, nombre_area')
      .in('id_area', areaIds);
    areasPorId = Object.fromEntries((areas || []).map((area) => [area.id_area, area]));
  }

  return usuarios.map((u) => {
    const medico = medicosPorPersona[u.persona_id];
    const enfermero = enfermerosPorPersona[u.persona_id];
    const farmaceutico = farmaceuticosPorPersona[u.persona_id];
    const administrativo = administrativosPorPersona[u.persona_id];
    const tecnico = tecnicosPorPersona[u.persona_id];
    const paciente = pacientesPorPersona[u.persona_id];

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
      id_area: u.id_area || '',
      facultad: areasPorId[u.id_area]?.nombre_area || '',
      codigo_universitario: u.codigo_universitario || '',
      documento_validacion_tipo: u.documento_validacion_tipo || '',
      documento_validacion_url: u.documento_validacion_url || '',
      documento_validacion_estado: u.documento_validacion_estado || '',
      nro_licencia: medico?.nro_licencia || farmaceutico?.nro_licencia || '',
      id_especialidad: medico?.id_especialidad || '',
      numero_licencia: tecnico?.numero_licencia || '',
      especialidad_laboratorio: tecnico?.especialidad_laboratorio || '',
      area_servicio: enfermero?.area_servicio || '',
      cargo: administrativo?.cargo || '',
      matricula_numero: paciente?.matricula_numero || '',
      matricula_foto_url: paciente?.matricula_foto_url || '',
    };
  });
}

async function insertarConFallback(tabla, payloadCompleto, payloadBase) {
  const { error } = await supabaseAdmin.from(tabla).insert([payloadCompleto]);
  if (!error) return;

  if (error.code === 'PGRST204') {
    const { error: errorBase } = await supabaseAdmin.from(tabla).insert([payloadBase]);
    if (!errorBase) return;
    if (errorBase.code === '23505') {
      throw new Error(tabla === 'tecnico_laboratorio' ? 'DUPLICADO_NUMERO_LICENCIA' : 'DUPLICADO_NRO_LICENCIA');
    }
    throw new Error(`Error al crear ${tabla}: ${errorBase.message}`);
  }

  if (error.code === '23505') {
    throw new Error(tabla === 'tecnico_laboratorio' ? 'DUPLICADO_NUMERO_LICENCIA' : 'DUPLICADO_NRO_LICENCIA');
  }
  throw new Error(`Error al crear ${tabla}: ${error.message}`);
}

async function crearEspecializacionRol(persona_id, rol, datos = {}) {
  if (rol === 'paciente') {
    await insertarConFallback(
      'paciente',
      {
        persona_id,
        matricula_numero: datos.codigo_universitario || null,
        matricula_foto_url: datos.documento_validacion_url || null,
      },
      { persona_id }
    );
  } else if (rol === 'medico') {
    await insertarConFallback(
      'medico',
      { persona_id, nro_licencia: datos.nro_licencia || null, id_especialidad: datos.id_especialidad || null },
      { persona_id, nro_licencia: datos.nro_licencia || null, id_especialidad: datos.id_especialidad || null }
    );
  } else if (rol === 'enfermero') {
    await insertarConFallback(
      'enfermero',
      { persona_id, area_servicio: datos.area_servicio || null },
      { persona_id }
    );
  } else if (rol === 'farmaceutico') {
    await insertarConFallback(
      'farmaceutico',
      { persona_id, nro_licencia: datos.nro_licencia || null },
      { persona_id, nro_licencia: datos.nro_licencia || null }
    );
  } else if (rol === 'administrativo') {
    await insertarConFallback(
      'administrativo',
      { persona_id, cargo: datos.cargo || null },
      { persona_id }
    );
  } else if (rol === 'tecnico_laboratorio') {
    await insertarConFallback(
      'tecnico_laboratorio',
      {
        persona_id,
        numero_licencia: datos.numero_licencia || null,
        especialidad_laboratorio: datos.especialidad_laboratorio || null,
      },
      {
        persona_id,
        numero_licencia: datos.numero_licencia || null,
        especialidad_laboratorio: datos.especialidad_laboratorio || null,
      }
    );
  }
}

async function eliminarEspecializacionesNoActuales(persona_id, rolActual) {
  const operaciones = ROLES_ESPECIALIZADOS
    .filter((rol) => rol !== rolActual)
    .map((rol) => {
      const tabla = rol === 'tecnico_laboratorio' ? 'tecnico_laboratorio' : rol;
      return supabaseAdmin.from(tabla).delete().eq('persona_id', persona_id);
    });
  await Promise.all(operaciones);
}

async function asegurarEspecializacionRol(persona_id, rol, datos = {}) {
  if (!ROLES_ESPECIALIZADOS.includes(rol)) return;

  const tabla = rol === 'tecnico_laboratorio' ? 'tecnico_laboratorio' : rol;
  const { data: existente } = await supabaseAdmin
    .from(tabla)
    .select('persona_id')
    .eq('persona_id', persona_id)
    .maybeSingle();

  if (!existente) {
    await crearEspecializacionRol(persona_id, rol, datos);
    return;
  }

  let updates = {};
  if (rol === 'paciente') updates = { matricula_numero: datos.codigo_universitario || null, matricula_foto_url: datos.documento_validacion_url || null };
  if (rol === 'medico') updates = { nro_licencia: datos.nro_licencia || null, id_especialidad: datos.id_especialidad || null };
  if (rol === 'enfermero') updates = { area_servicio: datos.area_servicio || null };
  if (rol === 'farmaceutico') updates = { nro_licencia: datos.nro_licencia || null };
  if (rol === 'administrativo') updates = { cargo: datos.cargo || null };
  if (rol === 'tecnico_laboratorio') {
    updates = {
      numero_licencia: datos.numero_licencia || null,
      especialidad_laboratorio: datos.especialidad_laboratorio || null,
    };
  }

  let { error } = await supabaseAdmin.from(tabla).update(updates).eq('persona_id', persona_id);
  if (error && error.code === 'PGRST204') {
    updates = rol === 'enfermero' ? {} : Object.fromEntries(Object.entries(updates).filter(([, value]) => value !== undefined));
    if (Object.keys(updates).length === 0) return;
    ({ error } = await supabaseAdmin.from(tabla).update(updates).eq('persona_id', persona_id));
  }

  if (error) {
    if (error.code === '23505') throw new Error(rol === 'tecnico_laboratorio' ? 'DUPLICADO_NUMERO_LICENCIA' : 'DUPLICADO_NRO_LICENCIA');
    throw new Error(`Error actualizando ${tabla}: ${error.message}`);
  }
}

export async function crearPersonaYUsuario({
  nombre,
  apellido,
  fecha_nac,
  sexo,
  telefono,
  ci,
  correo,
  contrasenaHash,
  rol,
  estado = 'activo',
  id_area,
  nro_licencia,
  numero_licencia,
  id_especialidad,
  especialidad_laboratorio,
  area_servicio,
  cargo,
  codigo_universitario,
  documento_validacion_tipo,
  documento_validacion_url,
}) {
  const { data: persona, error: errorPersona } = await supabaseAdmin
    .from('persona')
    .insert([{ nombre, apellido, fecha_nac: fecha_nac || null, sexo, telefono }])
    .select('persona_id')
    .single();

  if (errorPersona) throw new Error(`Error al crear persona: ${errorPersona.message}`);

  const requiereDocumento = ROLES_CON_DOCUMENTO_UNIVERSITARIO.includes(rol);
  const nuevoUsuario = {
    persona_id: persona.persona_id,
    ci,
    correo,
    contrasena: contrasenaHash,
    rol,
    estado,
    id_area: id_area || null,
    codigo_universitario: codigo_universitario || null,
    documento_validacion_tipo: documento_validacion_tipo || null,
    documento_validacion_url: documento_validacion_url || null,
    documento_validacion_estado: requiereDocumento ? 'pendiente' : 'no_requerido',
  };

  let { data: usuario, error: errorUsuario } = await supabaseAdmin
    .from('usuario')
    .insert([nuevoUsuario])
    .select('id_usuario')
    .single();

  if (errorUsuario && errorUsuario.code === 'PGRST204') {
    ({ data: usuario, error: errorUsuario } = await supabaseAdmin
      .from('usuario')
      .insert([{ persona_id: persona.persona_id, ci, correo, contrasena: contrasenaHash, rol, estado }])
      .select('id_usuario')
      .single());
  }

  if (errorUsuario) {
    await supabaseAdmin.from('persona').delete().eq('persona_id', persona.persona_id);
    throw new Error(`Error al crear usuario: ${errorUsuario.message}`);
  }

  try {
    await crearEspecializacionRol(persona.persona_id, rol, {
      nro_licencia,
      numero_licencia,
      id_especialidad,
      especialidad_laboratorio,
      area_servicio,
      cargo,
      codigo_universitario,
      documento_validacion_url,
    });
  } catch (errorEspecializacion) {
    await supabaseAdmin.from('usuario').delete().eq('id_usuario', usuario.id_usuario);
    await supabaseAdmin.from('persona').delete().eq('persona_id', persona.persona_id);
    throw errorEspecializacion;
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

  const rolFinal = datos.rol !== undefined ? datos.rol : usuario.rol;
  const requiereDocumento = ROLES_CON_DOCUMENTO_UNIVERSITARIO.includes(rolFinal);
  const updatesUsuario = {};
  if (datos.ci !== undefined && datos.ci !== '') updatesUsuario.ci = datos.ci;
  if (datos.correo !== undefined && datos.correo !== '') updatesUsuario.correo = datos.correo;
  if (datos.rol !== undefined) updatesUsuario.rol = datos.rol;
  if (datos.estado !== undefined) updatesUsuario.estado = datos.estado;
  if (datos.id_area !== undefined) updatesUsuario.id_area = datos.id_area || null;
  if (datos.codigo_universitario !== undefined) updatesUsuario.codigo_universitario = datos.codigo_universitario || null;
  if (datos.documento_validacion_tipo !== undefined) updatesUsuario.documento_validacion_tipo = datos.documento_validacion_tipo || null;
  if (datos.documento_validacion_url !== undefined) updatesUsuario.documento_validacion_url = datos.documento_validacion_url || null;
  if (datos.documento_validacion_estado !== undefined) {
    updatesUsuario.documento_validacion_estado = datos.documento_validacion_estado || (requiereDocumento ? 'pendiente' : 'no_requerido');
  } else if (datos.rol !== undefined) {
    updatesUsuario.documento_validacion_estado = requiereDocumento ? 'pendiente' : 'no_requerido';
  }

  if (Object.keys(updatesUsuario).length > 0) {
    let { error } = await supabaseAdmin.from('usuario').update(updatesUsuario).eq('id_usuario', id_usuario);
    if (error && error.code === 'PGRST204') {
      delete updatesUsuario.codigo_universitario;
      delete updatesUsuario.id_area;
      delete updatesUsuario.documento_validacion_tipo;
      delete updatesUsuario.documento_validacion_url;
      delete updatesUsuario.documento_validacion_estado;
      if (Object.keys(updatesUsuario).length > 0) {
        ({ error } = await supabaseAdmin.from('usuario').update(updatesUsuario).eq('id_usuario', id_usuario));
      } else {
        error = null;
      }
    }
    if (error) throw new Error(error.message);
  }

  if (datos.contrasenaHash !== undefined) {
    const { error } = await supabaseAdmin.from('usuario').update({ contrasena: datos.contrasenaHash }).eq('id_usuario', id_usuario);
    if (error) throw new Error(`Error actualizando contrasena: ${error.message}`);
  }

  await eliminarEspecializacionesNoActuales(usuario.persona_id, rolFinal);
  await asegurarEspecializacionRol(usuario.persona_id, rolFinal, datos);

  return { ok: true };
}

export async function eliminarUsuario(id_usuario) {
  const { data: usuario } = await supabaseAdmin
    .from('usuario')
    .select('persona_id, rol')
    .eq('id_usuario', id_usuario)
    .single();

  if (!usuario) throw new Error('Usuario no encontrado');

  await eliminarEspecializacionesNoActuales(usuario.persona_id, '');

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
