// repositories/tecnicoLaboratorioRepository.js
// ============================================================
// CAPA DE DATOS - Modulo de Laboratorio
// ============================================================
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

export async function obtenerIdTecnicoLaboratorioPorPersona(persona_id) {
  const { data } = await supabaseAdmin
    .from('tecnico_laboratorio')
    .select('id_tecnico_laboratorio')
    .eq('persona_id', persona_id)
    .maybeSingle();
  return data?.id_tecnico_laboratorio ?? null;
}

export async function obtenerTecnicoLaboratorioPorId(id_tecnico_laboratorio) {
  const { data, error } = await supabaseAdmin
    .from('tecnico_laboratorio')
    .select(`
      id_tecnico_laboratorio,
      persona_id,
      numero_licencia,
      especialidad_laboratorio,
      persona:persona_id (
        persona_id,
        nombre,
        apellido,
        telefono,
        fecha_nac,
        sexo
      )
    `)
    .eq('id_tecnico_laboratorio', id_tecnico_laboratorio)
    .single();

  if (error) throw new Error(`Error al obtener técnico: ${error.message}`);
  if (!data) return null;

  const { data: usuario, error: errU } = await supabaseAdmin
    .from('usuario')
    .select('ci, correo, estado, rol')
    .eq('persona_id', data.persona_id)
    .maybeSingle();

  if (errU) throw new Error(`Error al obtener usuario: ${errU.message}`);

  return {
    id_tecnico_laboratorio: data.id_tecnico_laboratorio,
    persona_id: data.persona_id,
    numero_licencia: data.numero_licencia || '',
    especialidad_laboratorio: data.especialidad_laboratorio || '',
    nombre: data.persona?.nombre || '',
    apellido: data.persona?.apellido || '',
    telefono: data.persona?.telefono || '',
    fecha_nac: data.persona?.fecha_nac || '',
    sexo: data.persona?.sexo || '',
    ci: usuario?.ci || '',
    correo: usuario?.correo || '',
    rol: usuario?.rol || '',
    estado: usuario?.estado || '',
  };
}

export async function listarTecnicosLaboratorio() {
  const { data, error } = await supabaseAdmin
    .from('tecnico_laboratorio')
    .select(`
      id_tecnico_laboratorio,
      persona_id,
      numero_licencia,
      especialidad_laboratorio,
      persona:persona_id (
        nombre,
        apellido,
        telefono,
        fecha_nac,
        sexo
      )
    `)
    .order('id_tecnico_laboratorio', { ascending: false })
    .limit(200);

  if (error) throw new Error(`Error al listar técnicos: ${error.message}`);

  return (data || []).map((t) => ({
    id_tecnico_laboratorio: t.id_tecnico_laboratorio,
    persona_id: t.persona_id,
    nombre: t.persona?.nombre || '',
    apellido: t.persona?.apellido || '',
    nombre_completo: t.persona ? `${t.persona.nombre} ${t.persona.apellido}` : `Técnico #${t.id_tecnico_laboratorio}`,
    telefono: t.persona?.telefono || '',
    fecha_nac: t.persona?.fecha_nac || '',
    sexo: t.persona?.sexo || '',
    numero_licencia: t.numero_licencia || '',
    especialidad_laboratorio: t.especialidad_laboratorio || '',
  }));
}

export async function listarAnalisisLaboratorio(filtro = {}) {
  const { data, error } = await supabaseAdmin
    .from('analisis_laboratorio')
    .select(`
      id_analisis,
      id_paciente,
      id_tecnico_laboratorio,
      tipo_analisis,
      fecha_solicitud,
      fecha_resultado,
      estado,
      resultado,
      observaciones,
      paciente:id_paciente (
        id_paciente,
        persona:persona_id (nombre, apellido)
      ),
      tecnico:id_tecnico_laboratorio (
        id_tecnico_laboratorio,
        persona:persona_id (nombre, apellido)
      )
    `)
    .order('fecha_solicitud', { ascending: false })
    .limit(300);

  if (error) throw new Error(`Error al listar análisis: ${error.message}`);

  let rows = (data || []).map((a) => ({
    id_analisis: a.id_analisis,
    id_paciente: a.id_paciente,
    id_tecnico_laboratorio: a.id_tecnico_laboratorio,
    tipo_analisis: a.tipo_analisis,
    fecha_solicitud: a.fecha_solicitud,
    fecha_resultado: a.fecha_resultado,
    estado: a.estado,
    resultado: a.resultado || '',
    observaciones: a.observaciones || '',
    paciente_nombre: a.paciente?.persona
      ? `${a.paciente.persona.nombre} ${a.paciente.persona.apellido}`
      : `Paciente #${a.id_paciente}`,
    tecnico_nombre: a.tecnico?.persona
      ? `${a.tecnico.persona.nombre} ${a.tecnico.persona.apellido}`
      : `Técnico #${a.id_tecnico_laboratorio}`,
  }));

  if (filtro.id_tecnico_laboratorio) {
    rows = rows.filter((a) => a.id_tecnico_laboratorio === Number(filtro.id_tecnico_laboratorio));
  }
  if (filtro.id_paciente) {
    rows = rows.filter((a) => a.id_paciente === Number(filtro.id_paciente));
  }
  if (filtro.estado) {
    rows = rows.filter((a) => a.estado === filtro.estado);
  }
  if (filtro.tipo_analisis) {
    rows = rows.filter((a) => a.tipo_analisis === filtro.tipo_analisis);
  }

  return rows;
}

export async function obtenerAnalisisLaboratorioPorId(id_analisis) {
  const { data, error } = await supabaseAdmin
    .from('analisis_laboratorio')
    .select(`
      id_analisis,
      id_paciente,
      id_tecnico_laboratorio,
      tipo_analisis,
      fecha_solicitud,
      fecha_resultado,
      estado,
      resultado,
      observaciones,
      paciente:id_paciente (
        id_paciente,
        persona:persona_id (nombre, apellido)
      ),
      tecnico:id_tecnico_laboratorio (
        id_tecnico_laboratorio,
        persona:persona_id (nombre, apellido)
      )
    `)
    .eq('id_analisis', id_analisis)
    .single();

  if (error) throw new Error(`Error al obtener análisis: ${error.message}`);
  if (!data) return null;

  return {
    id_analisis: data.id_analisis,
    id_paciente: data.id_paciente,
    id_tecnico_laboratorio: data.id_tecnico_laboratorio,
    tipo_analisis: data.tipo_analisis,
    fecha_solicitud: data.fecha_solicitud,
    fecha_resultado: data.fecha_resultado,
    estado: data.estado,
    resultado: data.resultado || '',
    observaciones: data.observaciones || '',
    paciente_nombre: data.paciente?.persona
      ? `${data.paciente.persona.nombre} ${data.paciente.persona.apellido}`
      : `Paciente #${data.id_paciente}`,
    tecnico_nombre: data.tecnico?.persona
      ? `${data.tecnico.persona.nombre} ${data.tecnico.persona.apellido}`
      : `Técnico #${data.id_tecnico_laboratorio}`,
  };
}

export async function crearAnalisisLaboratorio(payload) {
  const { data, error } = await supabaseAdmin
    .from('analisis_laboratorio')
    .insert([{
      id_paciente: payload.id_paciente,
      id_tecnico_laboratorio: payload.id_tecnico_laboratorio,
      tipo_analisis: payload.tipo_analisis,
      fecha_solicitud: payload.fecha_solicitud || new Date().toISOString(),
      fecha_resultado: payload.fecha_resultado || null,
      estado: payload.estado || 'pendiente',
      resultado: payload.resultado || null,
      observaciones: payload.observaciones || null,
    }])
    .select('id_analisis')
    .single();

  if (error) throw new Error(`Error al crear análisis: ${error.message}`);
  return data;
}

export async function actualizarAnalisisLaboratorio(id_analisis, payload) {
  const updates = {};
  if (payload.tipo_analisis !== undefined) updates.tipo_analisis = payload.tipo_analisis;
  if (payload.fecha_solicitud !== undefined) updates.fecha_solicitud = payload.fecha_solicitud;
  if (payload.fecha_resultado !== undefined) updates.fecha_resultado = payload.fecha_resultado;
  if (payload.estado !== undefined) updates.estado = payload.estado;
  if (payload.resultado !== undefined) updates.resultado = payload.resultado;
  if (payload.observaciones !== undefined) updates.observaciones = payload.observaciones;
  if (payload.id_paciente !== undefined) updates.id_paciente = payload.id_paciente;
  if (payload.id_tecnico_laboratorio !== undefined) updates.id_tecnico_laboratorio = payload.id_tecnico_laboratorio;

  const { data, error } = await supabaseAdmin
    .from('analisis_laboratorio')
    .update(updates)
    .eq('id_analisis', id_analisis)
    .select('id_analisis')
    .single();

  if (error) throw new Error(`Error al actualizar análisis: ${error.message}`);
  return data;
}

export async function eliminarAnalisisLaboratorio(id_analisis) {
  const { error } = await supabaseAdmin
    .from('analisis_laboratorio')
    .delete()
    .eq('id_analisis', id_analisis);

  if (error) throw new Error(`Error al eliminar análisis: ${error.message}`);
  return { ok: true };
}

export async function listarPacientesLaboratorio() {
  const { data, error } = await supabaseAdmin
    .from('paciente')
    .select(`
      id_paciente,
      persona_id,
      id_tipo_seguro,
      tipo_seguro:id_tipo_seguro (nombre),
      numero_seguro,
      persona:persona_id (
        nombre,
        apellido,
        telefono,
        sexo,
        fecha_nac
      )
    `)
    .order('id_paciente', { ascending: false })
    .limit(200);

  if (error) throw new Error(`Error al listar pacientes: ${error.message}`);

  const pacientes = (data || []).map((p) => ({
    id_paciente: p.id_paciente,
    persona_id: p.persona_id,
    nombre: p.persona?.nombre || '',
    apellido: p.persona?.apellido || '',
    nombre_completo: p.persona ? `${p.persona.nombre} ${p.persona.apellido}` : `Paciente #${p.id_paciente}`,
    telefono: p.persona?.telefono || '',
    sexo: p.persona?.sexo || '',
    fecha_nac: p.persona?.fecha_nac || '',
    id_tipo_seguro: p.id_tipo_seguro || null,
    tipo_seguro: p.tipo_seguro?.nombre || '',
    numero_seguro: p.numero_seguro || '',
  }));

  if (pacientes.length === 0) {
    return pacientes;
  }

  const personaIds = pacientes.map((p) => p.persona_id);
  const { data: usuarios, error: errorUsuarios } = await supabaseAdmin
    .from('usuario')
    .select('persona_id, ci, correo')
    .in('persona_id', personaIds);

  if (errorUsuarios) throw new Error(`Error al listar usuarios: ${errorUsuarios.message}`);

  const usuarioMap = new Map((usuarios || []).map((u) => [u.persona_id, u]));

  return pacientes.map((p) => {
    const usuario = usuarioMap.get(p.persona_id);
    return {
      ...p,
      correo: usuario?.correo || '',
      ci: usuario?.ci || '',
    };
  });
}
