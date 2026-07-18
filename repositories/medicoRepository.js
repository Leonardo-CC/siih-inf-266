// repositories/medicoRepository.js
// ============================================================
// CAPA DE DATOS - Vista del medico.
// El medico trabaja sobre la tabla `consulta` (sus atenciones).
// El diagnostico/tratamiento/estado de atencion se guardan como
// metadatos en observaciones (bloque [[MED]]), sin pisar el bloque
// de enfermeria [[ADM]].
// ============================================================
import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import {
  leerMetaAdmision,
  leerMetaMedico,
  textoLibre,
  componerObservaciones,
} from './consultaMeta.js';

// -------- Mapear persona_id -> id_medico --------
export async function obtenerIdMedicoPorPersona(persona_id) {
  const { data } = await supabaseAdmin
    .from('medico')
    .select('id_medico')
    .eq('persona_id', persona_id)
    .maybeSingle();
  return data?.id_medico ?? null;
}

// -------- Enriquecer nombres de pacientes --------
async function mapaPacientes(ids) {
  const unicos = [...new Set(ids.filter(Boolean))];
  if (!unicos.length) return new Map();
  const { data } = await supabaseAdmin
    .from('paciente')
    .select('id_paciente, persona:persona_id (nombre, apellido)')
    .in('id_paciente', unicos);
  return new Map(
    (data || []).map((p) => [
      p.id_paciente,
      { nombre: p.persona?.nombre || '', apellido: p.persona?.apellido || '' },
    ])
  );
}

// -------- Listar consultas/atenciones del medico --------
export async function obtenerConsultasMedico(id_medico, { limite = 200 } = {}) {
  const { data, error } = await supabaseAdmin
    .from('consulta')
    .select('id_consulta, id_cita, id_paciente, id_medico, fecha_consulta, motivo_consulta, observaciones')
    .eq('id_medico', id_medico)
    .order('fecha_consulta', { ascending: false })
    .limit(limite);

  if (error) throw new Error(`Error al obtener consultas del medico: ${error.message}`);

  const rows = data || [];
  const pacientes = await mapaPacientes(rows.map((r) => r.id_paciente));

  return rows.map((c) => {
    const adm = leerMetaAdmision(c.observaciones);
    const med = leerMetaMedico(c.observaciones);
    const pac = pacientes.get(c.id_paciente) || { nombre: '', apellido: '' };
    return {
      id_consulta: c.id_consulta,
      id_cita: c.id_cita,
      id_paciente: c.id_paciente,
      id_medico: c.id_medico,
      fecha_consulta: c.fecha_consulta,
      motivo_consulta: c.motivo_consulta,
      tipo_admision: adm.tipo_admision,
      sala_asignada: adm.sala_asignada,
      estado_atencion: med.estado_atencion,
      diagnostico: med.diagnostico,
      tratamiento: med.tratamiento,
      receta: med.receta,
      proxima_cita: med.proxima_cita,
      observaciones: textoLibre(c.observaciones) || null,
      paciente_nombre: pac.nombre || `Paciente #${c.id_paciente}`,
      paciente_apellido: pac.apellido,
    };
  });
}

// -------- Actualizar la atencion (diagnostico, tratamiento, estado) --------
export async function actualizarAtencionMedico(id_consulta, id_medico, payload) {
  const { data: actual, error: errLeer } = await supabaseAdmin
    .from('consulta')
    .select('id_consulta, id_medico, observaciones, motivo_consulta')
    .eq('id_consulta', id_consulta)
    .single();

  if (errLeer || !actual) {
    throw new Error('No se encontró la consulta indicada.');
  }

  if (id_medico && actual.id_medico !== id_medico) {
    throw new Error('No puedes modificar una consulta que no te corresponde.');
  }

  const admActual = leerMetaAdmision(actual.observaciones);
  const medActual = leerMetaMedico(actual.observaciones);
  const libreActual = textoLibre(actual.observaciones);

  const medNuevo = {
    estado_atencion: payload.estado_atencion !== undefined ? payload.estado_atencion : medActual.estado_atencion,
    diagnostico: payload.diagnostico !== undefined ? (payload.diagnostico?.trim() || null) : medActual.diagnostico,
    tratamiento: payload.tratamiento !== undefined ? (payload.tratamiento?.trim() || null) : medActual.tratamiento,
    receta: payload.receta !== undefined ? (payload.receta?.trim() || null) : medActual.receta,
    proxima_cita: payload.proxima_cita !== undefined ? (payload.proxima_cita || null) : medActual.proxima_cita,
  };

  const updates = {
    observaciones: componerObservaciones({
      adm: admActual,
      med: medNuevo,
      libre: payload.observaciones !== undefined ? payload.observaciones : libreActual,
    }),
  };

  if (payload.motivo_consulta !== undefined && payload.motivo_consulta.trim()) {
    updates.motivo_consulta = payload.motivo_consulta.trim();
  }

  const { data, error } = await supabaseAdmin
    .from('consulta')
    .update(updates)
    .eq('id_consulta', id_consulta)
    .select('id_consulta, observaciones, motivo_consulta')
    .single();

  if (error) throw new Error(`Error actualizando la atención: ${error.message}`);
  return data;
}

// -------- Signos vitales de los pacientes del medico --------
export async function obtenerSignosDelMedico(id_medico, { limite = 100 } = {}) {
  // Consultas del medico -> sus id_consulta -> signos de esas consultas.
  const { data: consultas, error: errC } = await supabaseAdmin
    .from('consulta')
    .select('id_consulta')
    .eq('id_medico', id_medico)
    .limit(500);

  if (errC) throw new Error(`Error al obtener consultas: ${errC.message}`);

  const ids = (consultas || []).map((c) => c.id_consulta);
  if (!ids.length) return [];

  const { data, error } = await supabaseAdmin
    .from('vw_signos_vitales')
    .select('*')
    .in('id_consulta', ids)
    .order('fecha_hora', { ascending: false })
    .limit(limite);

  if (error) throw new Error(`Error al obtener signos vitales: ${error.message}`);
  return data || [];
}

// -------- Citas proximas del medico --------
export async function obtenerCitasMedico(id_medico) {
  const { data, error } = await supabaseAdmin
    .from('cita')
    .select('id_cita, id_paciente, fecha_hora, motivo, estado')
    .eq('id_medico', id_medico)
    .order('fecha_hora', { ascending: true })
    .limit(200);

  if (error) throw new Error(`Error al obtener citas del medico: ${error.message}`);

  const rows = data || [];
  const pacientes = await mapaPacientes(rows.map((r) => r.id_paciente));

  return rows.map((c) => {
    const pac = pacientes.get(c.id_paciente) || { nombre: '', apellido: '' };
    return {
      ...c,
      paciente_nombre: `${pac.nombre} ${pac.apellido}`.trim() || `Paciente #${c.id_paciente}`,
    };
  });
}

// -------- Perfil del medico (para encabezado/dashboard) --------
export async function obtenerPerfilMedico(id_medico) {
  const { data } = await supabaseAdmin
    .from('medico')
    .select('id_medico, nro_licencia, especialidad_antigua, persona:persona_id (nombre, apellido), especialidad:id_especialidad (nombre)')
    .eq('id_medico', id_medico)
    .maybeSingle();

  if (!data) return null;
  return {
    id_medico: data.id_medico,
    nro_licencia: data.nro_licencia,
    especialidad: data.especialidad?.nombre || data.especialidad_antigua || 'General',
    nombre_completo: data.persona ? `${data.persona.nombre} ${data.persona.apellido}` : `Médico #${data.id_medico}`,
  };
}
