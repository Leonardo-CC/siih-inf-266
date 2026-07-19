// repositories/catalogoRepository.js
// ============================================================
// CAPA DE DATOS - Catálogo administrable por el rol administrador.
//   - especialidad
//   - medico / enfermero / farmaceutico / tecnico_laboratorio
//   - tipo_seguro
//   - stock (min/max) del medicamento
// Todas las personas del personal se apoyan en persona + usuario.
// ============================================================
import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { traducirError } from '../lib/errorMessages.js';

function mapPersona(row) {
  const p = row?.persona || row?.persona_id || {};
  return {
    nombre: p?.nombre || '',
    apellido: p?.apellido || '',
    nombre_completo: `${p?.nombre || ''} ${p?.apellido || ''}`.trim(),
    telefono: p?.telefono || '',
    fecha_nac: p?.fecha_nac || '',
    sexo: p?.sexo || '',
  };
}

// Los roles del personal se relacionan con `usuario` a través de persona_id
// (la FK está definida en usuario, no en la tabla del rol). Por eso no se
// puede hacer un join directo "usuario:id_usuario" y se consulta en lote.
async function mapaUsuariosPorPersona(personaIds) {
  const unicos = [...new Set(personaIds.filter(Boolean))];
  if (!unicos.length) return new Map();
  const { data } = await supabaseAdmin
    .from('usuario')
    .select('persona_id, ci, correo, estado, rol')
    .in('persona_id', unicos);
  return new Map((data || []).map((u) => [u.persona_id, u]));
}

function conUsuario(fila, usuarios) {
  const u = usuarios.get(fila.persona_id) || {};
  return {
    ...mapPersona(fila),
    ci: u.ci || '',
    correo: u.correo || '',
    estado: u.estado || 'activo',
    rol: u.rol || '',
  };
}

// ---------------------------------------------------------------------------
// ESPECIALIDAD
// ---------------------------------------------------------------------------
export async function listarEspecialidadesCatalogo() {
  const { data, error } = await supabaseAdmin
    .from('especialidad')
    .select('*')
    .order('nombre');
  if (error) throw new Error(error.message);
  return data || [];
}

export async function crearEspecialidad({ nombre, tarifa, descripcion, estado }) {
  const { data, error } = await supabaseAdmin
    .from('especialidad')
    .insert([{ nombre, tarifa: tarifa ?? 0, descripcion: descripcion || null, estado: estado || 'activo' }])
    .select()
    .single();
  if (error) throw new Error(traducirError(error));
  return data;
}

export async function actualizarEspecialidad(id, { nombre, tarifa, descripcion, estado }) {
  const updates = {};
  if (nombre !== undefined) updates.nombre = nombre;
  if (tarifa !== undefined) updates.tarifa = tarifa;
  if (descripcion !== undefined) updates.descripcion = descripcion || null;
  if (estado !== undefined) updates.estado = estado;
  const { data, error } = await supabaseAdmin
    .from('especialidad')
    .update(updates)
    .eq('id_especialidad', id)
    .select()
    .single();
  if (error) throw new Error(traducirError(error));
  return data;
}

export async function eliminarEspecialidad(id) {
  const { error } = await supabaseAdmin.from('especialidad').delete().eq('id_especialidad', id);
  if (error) throw new Error(traducirError(error));
  return { ok: true };
}

// ---------------------------------------------------------------------------
// PERSONAL GENÉRICO (crea persona + usuario + registro del rol)
// ---------------------------------------------------------------------------
async function crearPersonaYUsuario({ nombre, apellido, fecha_nac, sexo, telefono, ci, correo, contrasenaHash, rol, estado = 'activo' }) {
  const { data: persona, error: errorPersona } = await supabaseAdmin
    .from('persona')
    .insert([{ nombre, apellido, fecha_nac: fecha_nac || null, sexo, telefono }])
    .select('persona_id')
    .single();
  if (errorPersona) throw new Error(`Error al crear persona: ${traducirError(errorPersona)}`);

  const { data: usuario, error: errorUsuario } = await supabaseAdmin
    .from('usuario')
    .insert([{ persona_id: persona.persona_id, ci, correo, contrasena: contrasenaHash, rol, estado }])
    .select('id_usuario')
    .single();
  if (errorUsuario) {
    await supabaseAdmin.from('persona').delete().eq('persona_id', persona.persona_id);
    throw new Error(`Error al crear usuario: ${traducirError(errorUsuario)}`);
  }
  return { persona_id: persona.persona_id, id_usuario: usuario.id_usuario };
}

async function actualizarPersonaYUsuario(id_usuario, { nombre, apellido, fecha_nac, sexo, telefono, ci, correo, rol, estado }) {
  const { data: usuario } = await supabaseAdmin.from('usuario').select('persona_id').eq('id_usuario', id_usuario).single();
  if (!usuario) throw new Error('Usuario no encontrado');
  const updatesPersona = {};
  if (nombre !== undefined) updatesPersona.nombre = nombre;
  if (apellido !== undefined) updatesPersona.apellido = apellido;
  if (telefono !== undefined) updatesPersona.telefono = telefono || null;
  if (fecha_nac !== undefined) updatesPersona.fecha_nac = fecha_nac || null;
  if (sexo !== undefined) updatesPersona.sexo = sexo;
  if (Object.keys(updatesPersona).length) {
    const { error } = await supabaseAdmin.from('persona').update(updatesPersona).eq('persona_id', usuario.persona_id);
    if (error) throw new Error(traducirError(error));
  }
  const updatesUsuario = {};
  if (ci !== undefined && ci !== '') updatesUsuario.ci = ci;
  if (correo !== undefined && correo !== '') updatesUsuario.correo = correo;
  if (rol !== undefined) updatesUsuario.rol = rol;
  if (estado !== undefined) updatesUsuario.estado = estado;
  if (Object.keys(updatesUsuario).length) {
    const { error } = await supabaseAdmin.from('usuario').update(updatesUsuario).eq('id_usuario', id_usuario);
    if (error) throw new Error(traducirError(error));
  }
  return usuario.persona_id;
}

async function eliminarPersonaYUsuario(id_usuario) {
  const { data: usuario } = await supabaseAdmin.from('usuario').select('persona_id').eq('id_usuario', id_usuario).single();
  if (!usuario) throw new Error('Usuario no encontrado');
  const { error: errorUsuario } = await supabaseAdmin.from('usuario').delete().eq('id_usuario', id_usuario);
  if (errorUsuario) throw new Error(traducirError(errorUsuario));
  const { error: errorPersona } = await supabaseAdmin.from('persona').delete().eq('persona_id', usuario.persona_id);
  if (errorPersona) throw new Error(traducirError(errorPersona));
  return { ok: true };
}

// ---------------------------------------------------------------------------
// MEDICO
// ---------------------------------------------------------------------------
export async function listarMedicosCatalogo() {
  const { data, error } = await supabaseAdmin
    .from('medico')
    .select(`
      id_medico,
      nro_licencia,
      id_especialidad,
      especialidad:id_especialidad (nombre),
      persona_id,
      persona:persona_id (nombre, apellido, telefono, fecha_nac, sexo)
    `)
    .order('id_medico');
  if (error) throw new Error(error.message);
  const usuarios = await mapaUsuariosPorPersona((data || []).map((m) => m.persona_id));
  return (data || []).map((m) => ({
    id_medico: m.id_medico,
    nro_licencia: m.nro_licencia || '',
    id_especialidad: m.id_especialidad || '',
    especialidad: m.especialidad?.nombre || '',
    ...conUsuario(m, usuarios),
  }));
}

export async function crearMedico(payload) {
  const { persona_id, id_usuario } = await crearPersonaYUsuario({ ...payload, rol: 'medico' });
  const { data, error } = await supabaseAdmin
    .from('medico')
    .insert([{ persona_id, nro_licencia: payload.nro_licencia || null, id_especialidad: payload.id_especialidad || null }])
    .select()
    .single();
  if (error) {
    await supabaseAdmin.from('usuario').delete().eq('id_usuario', id_usuario);
    await supabaseAdmin.from('persona').delete().eq('persona_id', persona_id);
    throw new Error(traducirError(error));
  }
  return data;
}

export async function actualizarMedico(id_medico, payload) {
  const { data: medico, error: errMed } = await supabaseAdmin.from('medico').select('persona_id').eq('id_medico', id_medico).single();
  if (errMed || !medico) throw new Error('Médico no encontrado');
  const { data: usuario } = await supabaseAdmin.from('usuario').select('id_usuario').eq('persona_id', medico.persona_id).single();
  if (usuario) await actualizarPersonaYUsuario(usuario.id_usuario, payload);
  const updates = {};
  if (payload.nro_licencia !== undefined) updates.nro_licencia = payload.nro_licencia || null;
  if (payload.id_especialidad !== undefined) updates.id_especialidad = payload.id_especialidad || null;
  if (Object.keys(updates).length) {
    const { error } = await supabaseAdmin.from('medico').update(updates).eq('id_medico', id_medico);
    if (error) throw new Error(traducirError(error));
  }
  return { ok: true };
}

export async function eliminarMedico(id_medico) {
  const { data: medico } = await supabaseAdmin.from('medico').select('persona_id').eq('id_medico', id_medico).single();
  if (!medico) throw new Error('Médico no encontrado');
  await supabaseAdmin.from('medico').delete().eq('id_medico', id_medico);
  const { data: usuario } = await supabaseAdmin.from('usuario').select('id_usuario').eq('persona_id', medico.persona_id).single();
  if (usuario) await eliminarPersonaYUsuario(usuario.id_usuario);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// ENFERMERO
// ---------------------------------------------------------------------------
export async function listarEnfermerosCatalogo() {
  const { data, error } = await supabaseAdmin
    .from('enfermero')
    .select(`
      id_enfermero,
      persona_id,
      persona:persona_id (nombre, apellido, telefono, fecha_nac, sexo)
    `)
    .order('id_enfermero');
  if (error) throw new Error(error.message);
  const usuarios = await mapaUsuariosPorPersona((data || []).map((e) => e.persona_id));
  return (data || []).map((e) => ({ id_enfermero: e.id_enfermero, ...conUsuario(e, usuarios) }));
}

export async function crearEnfermero(payload) {
  const { persona_id, id_usuario } = await crearPersonaYUsuario({ ...payload, rol: 'enfermero' });
  const { data, error } = await supabaseAdmin.from('enfermero').insert([{ persona_id }]).select().single();
  if (error) {
    await supabaseAdmin.from('usuario').delete().eq('id_usuario', id_usuario);
    await supabaseAdmin.from('persona').delete().eq('persona_id', persona_id);
    throw new Error(traducirError(error));
  }
  return data;
}

export async function actualizarEnfermero(id_enfermero, payload) {
  const { data: enfermero } = await supabaseAdmin.from('enfermero').select('persona_id').eq('id_enfermero', id_enfermero).single();
  if (!enfermero) throw new Error('Enfermero no encontrado');
  const { data: usuario } = await supabaseAdmin.from('usuario').select('id_usuario').eq('persona_id', enfermero.persona_id).single();
  if (usuario) await actualizarPersonaYUsuario(usuario.id_usuario, payload);
  return { ok: true };
}

export async function eliminarEnfermero(id_enfermero) {
  const { data: enfermero } = await supabaseAdmin.from('enfermero').select('persona_id').eq('id_enfermero', id_enfermero).single();
  if (!enfermero) throw new Error('Enfermero no encontrado');
  await supabaseAdmin.from('enfermero').delete().eq('id_enfermero', id_enfermero);
  const { data: usuario } = await supabaseAdmin.from('usuario').select('id_usuario').eq('persona_id', enfermero.persona_id).single();
  if (usuario) await eliminarPersonaYUsuario(usuario.id_usuario);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// FARMACEUTICO
// ---------------------------------------------------------------------------
export async function listarFarmaceuticosCatalogo() {
  const { data, error } = await supabaseAdmin
    .from('farmaceutico')
    .select(`
      id_farmaceutico,
      nro_licencia,
      persona_id,
      persona:persona_id (nombre, apellido, telefono, fecha_nac, sexo)
    `)
    .order('id_farmaceutico');
  if (error) throw new Error(error.message);
  const usuarios = await mapaUsuariosPorPersona((data || []).map((f) => f.persona_id));
  return (data || []).map((f) => ({ id_farmaceutico: f.id_farmaceutico, nro_licencia: f.nro_licencia || '', ...conUsuario(f, usuarios) }));
}

export async function crearFarmaceutico(payload) {
  const { persona_id, id_usuario } = await crearPersonaYUsuario({ ...payload, rol: 'farmaceutico' });
  const { data, error } = await supabaseAdmin.from('farmaceutico').insert([{ persona_id, nro_licencia: payload.nro_licencia || null }]).select().single();
  if (error) {
    await supabaseAdmin.from('usuario').delete().eq('id_usuario', id_usuario);
    await supabaseAdmin.from('persona').delete().eq('persona_id', persona_id);
    throw new Error(traducirError(error));
  }
  return data;
}

export async function actualizarFarmaceutico(id_farmaceutico, payload) {
  const { data: farm } = await supabaseAdmin.from('farmaceutico').select('persona_id, nro_licencia').eq('id_farmaceutico', id_farmaceutico).single();
  if (!farm) throw new Error('Farmacéutico no encontrado');
  const { data: usuario } = await supabaseAdmin.from('usuario').select('id_usuario').eq('persona_id', farm.persona_id).single();
  if (usuario) await actualizarPersonaYUsuario(usuario.id_usuario, payload);
  if (payload.nro_licencia !== undefined) {
    const { error } = await supabaseAdmin.from('farmaceutico').update({ nro_licencia: payload.nro_licencia || null }).eq('id_farmaceutico', id_farmaceutico);
    if (error) throw new Error(traducirError(error));
  }
  return { ok: true };
}

export async function eliminarFarmaceutico(id_farmaceutico) {
  const { data: farm } = await supabaseAdmin.from('farmaceutico').select('persona_id').eq('id_farmaceutico', id_farmaceutico).single();
  if (!farm) throw new Error('Farmacéutico no encontrado');
  await supabaseAdmin.from('farmaceutico').delete().eq('id_farmaceutico', id_farmaceutico);
  const { data: usuario } = await supabaseAdmin.from('usuario').select('id_usuario').eq('persona_id', farm.persona_id).single();
  if (usuario) await eliminarPersonaYUsuario(usuario.id_usuario);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// TECNICO DE LABORATORIO
// ---------------------------------------------------------------------------
export async function listarTecnicosCatalogo() {
  const { data, error } = await supabaseAdmin
    .from('tecnico_laboratorio')
    .select(`
      id_tecnico_laboratorio,
      numero_licencia,
      especialidad_laboratorio,
      persona_id,
      persona:persona_id (nombre, apellido, telefono, fecha_nac, sexo)
    `)
    .order('id_tecnico_laboratorio');
  if (error) throw new Error(error.message);
  const usuarios = await mapaUsuariosPorPersona((data || []).map((t) => t.persona_id));
  return (data || []).map((t) => ({
    id_tecnico_laboratorio: t.id_tecnico_laboratorio,
    numero_licencia: t.numero_licencia || '',
    especialidad_laboratorio: t.especialidad_laboratorio || '',
    ...conUsuario(t, usuarios),
  }));
}

export async function crearTecnico(payload) {
  const { persona_id, id_usuario } = await crearPersonaYUsuario({ ...payload, rol: 'tecnico_laboratorio' });
  const { data, error } = await supabaseAdmin
    .from('tecnico_laboratorio')
    .insert([{ persona_id, numero_licencia: payload.numero_licencia || null, especialidad_laboratorio: payload.especialidad_laboratorio || null }])
    .select()
    .single();
  if (error) {
    await supabaseAdmin.from('usuario').delete().eq('id_usuario', id_usuario);
    await supabaseAdmin.from('persona').delete().eq('persona_id', persona_id);
    throw new Error(traducirError(error));
  }
  return data;
}

export async function actualizarTecnico(id_tecnico_laboratorio, payload) {
  const { data: tec } = await supabaseAdmin.from('tecnico_laboratorio').select('persona_id').eq('id_tecnico_laboratorio', id_tecnico_laboratorio).single();
  if (!tec) throw new Error('Técnico no encontrado');
  const { data: usuario } = await supabaseAdmin.from('usuario').select('id_usuario').eq('persona_id', tec.persona_id).single();
  if (usuario) await actualizarPersonaYUsuario(usuario.id_usuario, payload);
  const updates = {};
  if (payload.numero_licencia !== undefined) updates.numero_licencia = payload.numero_licencia || null;
  if (payload.especialidad_laboratorio !== undefined) updates.especialidad_laboratorio = payload.especialidad_laboratorio || null;
  if (Object.keys(updates).length) {
    const { error } = await supabaseAdmin.from('tecnico_laboratorio').update(updates).eq('id_tecnico_laboratorio', id_tecnico_laboratorio);
    if (error) throw new Error(traducirError(error));
  }
  return { ok: true };
}

export async function eliminarTecnico(id_tecnico_laboratorio) {
  const { data: tec } = await supabaseAdmin.from('tecnico_laboratorio').select('persona_id').eq('id_tecnico_laboratorio', id_tecnico_laboratorio).single();
  if (!tec) throw new Error('Técnico no encontrado');
  await supabaseAdmin.from('tecnico_laboratorio').delete().eq('id_tecnico_laboratorio', id_tecnico_laboratorio);
  const { data: usuario } = await supabaseAdmin.from('usuario').select('id_usuario').eq('persona_id', tec.persona_id).single();
  if (usuario) await eliminarPersonaYUsuario(usuario.id_usuario);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// TIPO DE SEGURO (catálogo)
// ---------------------------------------------------------------------------
export async function listarTiposSeguro() {
  const { data, error } = await supabaseAdmin.from('tipo_seguro').select('*').order('nombre');
  if (error) throw new Error(error.message);
  return data || [];
}

export async function crearTipoSeguro({ nombre, descripcion, estado }) {
  const { data, error } = await supabaseAdmin
    .from('tipo_seguro')
    .insert([{ nombre, descripcion: descripcion || null, estado: estado || 'activo' }])
    .select()
    .single();
  if (error) throw new Error(traducirError(error));
  return data;
}

export async function actualizarTipoSeguro(id, { nombre, descripcion, estado }) {
  const updates = {};
  if (nombre !== undefined) updates.nombre = nombre;
  if (descripcion !== undefined) updates.descripcion = descripcion || null;
  if (estado !== undefined) updates.estado = estado;
  const { data, error } = await supabaseAdmin.from('tipo_seguro').update(updates).eq('id_tipo_seguro', id).select().single();
  if (error) throw new Error(traducirError(error));
  return data;
}

export async function eliminarTipoSeguro(id) {
  const { error } = await supabaseAdmin.from('tipo_seguro').delete().eq('id_tipo_seguro', id);
  if (error) throw new Error(traducirError(error));
  return { ok: true };
}

// ---------------------------------------------------------------------------
// STOCK (mínimo / máximo) del medicamento  -> roles farmacia y admin
// ---------------------------------------------------------------------------
export async function listarMedicamentosStock() {
  const columnas = 'id_medicamento, nombre, descripcion, stock_actual, stock_minimo, stock_maximo';
  let { data, error } = await supabaseAdmin
    .from('medicamento')
    .select(columnas)
    .order('nombre');
  // Si aún no se aplicó la migración de stock_maximo, reintenta sin esa columna.
  if (error && /stock_maximo/.test(error.message)) {
    ({ data, error } = await supabaseAdmin
      .from('medicamento')
      .select('id_medicamento, nombre, descripcion, stock_actual, stock_minimo')
      .order('nombre'));
  }
  if (error) throw new Error(error.message);
  return (data || []).map((m) => ({ ...m, stock_maximo: m.stock_maximo ?? null }));
}

export async function actualizarStockMedicamento(id, { stock_minimo, stock_maximo }) {
  const updates = {};
  if (stock_minimo !== undefined) updates.stock_minimo = stock_minimo;
  if (stock_maximo !== undefined) updates.stock_maximo = stock_maximo;
  let { data, error } = await supabaseAdmin.from('medicamento').update(updates).eq('id_medicamento', id).select().single();
  // Si aún no se aplicó la migración de stock_maximo, reintenta solo con stock_minimo.
  if (error && /stock_maximo/.test(error.message) && stock_maximo !== undefined) {
    delete updates.stock_maximo;
    ({ data, error } = await supabaseAdmin.from('medicamento').update(updates).eq('id_medicamento', id).select().single());
  }
  if (error) throw new Error(traducirError(error));
  return data;
}
