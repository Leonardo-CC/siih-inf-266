// repositories/signosVitalesRepository.js
// ============================================================
// CAPA DE DATOS - HU-10 / RF10: Registro de signos vitales
// Acceso a consultas pendientes de signos, enfermeros y tabla
// signos_vitales (depende de la consulta creada por HU-11).
// ============================================================
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

export async function obtenerConsultasParaSignos() {
  const { data, error } = await supabaseAdmin
    .from('consulta')
    .select(`
      id_consulta,
      id_paciente,
      id_medico,
      fecha_consulta,
      motivo_consulta,
      paciente:id_paciente (
        id_paciente,
        persona:persona_id (nombre, apellido)
      )
    `)
    .order('fecha_consulta', { ascending: false })
    .limit(50);

  if (error) throw new Error(`Error al obtener consultas: ${error.message}`);

  return (data || []).map((c) => ({
    id_consulta: c.id_consulta,
    id_paciente: c.id_paciente,
    id_medico: c.id_medico,
    fecha_consulta: c.fecha_consulta,
    motivo_consulta: c.motivo_consulta,
    paciente_nombre: c.paciente?.persona
      ? `${c.paciente.persona.nombre} ${c.paciente.persona.apellido}`
      : `Paciente #${c.id_paciente}`,
  }));
}

export async function obtenerEnfermeros() {
  const { data, error } = await supabaseAdmin
    .from('enfermero')
    .select('id_enfermero, persona_id, persona:persona_id (nombre, apellido)')
    .order('id_enfermero', { ascending: true });

  if (error) throw new Error(`Error al obtener enfermeros: ${error.message}`);

  return (data || []).map((e) => ({
    id_enfermero: e.id_enfermero,
    persona_id: e.persona_id,
    nombre_completo: e.persona
      ? `${e.persona.nombre} ${e.persona.apellido}`
      : `Enfermero(a) #${e.id_enfermero}`,
  }));
}

export async function verificarConsultaExiste(idConsulta) {
  const { data, error } = await supabaseAdmin
    .from('consulta')
    .select('id_consulta')
    .eq('id_consulta', idConsulta)
    .single();

  if (error) return false;
  return Boolean(data);
}

export async function obtenerEstadoConsulta(idConsulta) {
  const { data: consulta, error: errorConsulta } = await supabaseAdmin
    .from('consulta')
    .select('id_consulta, id_cita')
    .eq('id_consulta', idConsulta)
    .single();

  if (errorConsulta || !consulta) return null;

  if (!consulta.id_cita) return 'confirmada';

  const { data: cita, error: errorCita } = await supabaseAdmin
    .from('cita')
    .select('estado')
    .eq('id_cita', consulta.id_cita)
    .single();

  if (errorCita || !cita) return null;
  return cita.estado;
}

export async function obtenerRolEnfermero(idEnfermero) {
  const { data: enf, error: errEnf } = await supabaseAdmin
    .from('enfermero')
    .select('persona_id')
    .eq('id_enfermero', idEnfermero)
    .single();

  if (errEnf || !enf) return null;

  const { data: usu, error: errUsu } = await supabaseAdmin
    .from('usuario')
    .select('rol')
    .eq('persona_id', enf.persona_id)
    .single();

  if (errUsu || !usu) return null;
  return usu.rol;
}

export async function registrarSignosVitales(payload) {
  const registro = {
    id_consulta: payload.id_consulta,
    presion_arterial: payload.presion_arterial || null,
    temperatura: payload.temperatura != null ? Number(payload.temperatura) : null,
    frecuencia_cardiaca:
      payload.frecuencia_cardiaca != null ? Number(payload.frecuencia_cardiaca) : null,
    observaciones: payload.observaciones || null,
    id_enfermero: payload.id_enfermero,
  };

  const { data, error } = await supabaseAdmin
    .from('signos_vitales')
    .insert([registro])
    .select(
      'id_signos, id_consulta, presion_arterial, temperatura, frecuencia_cardiaca, observaciones, fecha_hora'
    )
    .single();

  if (error) throw new Error(`Error registrando signos vitales: ${error.message}`);

  return data;
}

export async function actualizarSignosVitales(id_signos, payload) {
  const registro = {
    id_consulta: payload.id_consulta,
    presion_arterial: payload.presion_arterial || null,
    temperatura: payload.temperatura != null ? Number(payload.temperatura) : null,
    frecuencia_cardiaca:
      payload.frecuencia_cardiaca != null ? Number(payload.frecuencia_cardiaca) : null,
    observaciones: payload.observaciones || null,
    id_enfermero: payload.id_enfermero,
  };

  const { data, error } = await supabaseAdmin
    .from('signos_vitales')
    .update(registro)
    .eq('id_signos', id_signos)
    .select(
      'id_signos, id_consulta, presion_arterial, temperatura, frecuencia_cardiaca, observaciones, fecha_hora'
    )
    .single();

  if (error) throw new Error(`Error actualizando signos vitales: ${error.message}`);

  return data;
}

export async function eliminarSignosVitales(id_signos) {
  const { error } = await supabaseAdmin
    .from('signos_vitales')
    .delete()
    .eq('id_signos', id_signos);

  if (error) throw new Error(`Error eliminando signos vitales: ${error.message}`);
}

export async function obtenerSignosVitales(filtro = {}) {
  let query = supabaseAdmin
    .from('vw_signos_vitales')
    .select('*')
    .order('fecha_hora', { ascending: false })
    .limit(100);

  if (filtro.id_enfermero) {
    query = query.eq('id_enfermero', filtro.id_enfermero);
  }

  const { data, error } = await query;

  if (error) throw new Error(`Error al obtener signos vitales: ${error.message}`);

  return data || [];
}

