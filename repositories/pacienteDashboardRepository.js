// repositories/pacienteDashboardRepository.js
// ============================================================
// CAPA DE DATOS - Vista del paciente.
// Consulta citas, consultas (atenciones) y signos vitales
// filtrando SIEMPRE por el id_paciente del propio paciente,
// para que un paciente solo vea su propia informacion.
// ============================================================
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

// -------- Mapa id_paciente -> nombre completo --------
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
      `${p.persona?.nombre || ''} ${p.persona?.apellido || ''}`.trim(),
    ])
  );
}

// -------- Citas del paciente --------
export async function obtenerCitasPaciente(id_paciente, { limite = 200 } = {}) {
  const { data, error } = await supabaseAdmin
    .from('cita')
    .select('id_cita, id_paciente, id_medico, fecha_hora, motivo, estado')
    .eq('id_paciente', id_paciente)
    .order('fecha_hora', { ascending: false })
    .limit(limite);

  if (error) throw new Error(`Error al obtener citas del paciente: ${error.message}`);

  const rows = data || [];
  const medicos = await mapaMedicos(rows.map((r) => r.id_medico));

  return rows.map((c) => {
    const med = medicos.get(c.id_medico) || { nombre: '', apellido: '' };
    return {
      ...c,
      medico_nombre: `${med.nombre} ${med.apellido}`.trim() || `Médico #${c.id_medico}`,
    };
  });
}

// -------- Mapa id_medico -> nombre completo --------
async function mapaMedicos(ids) {
  const unicos = [...new Set(ids.filter(Boolean))];
  if (!unicos.length) return new Map();
  const { data } = await supabaseAdmin
    .from('medico')
    .select('id_medico, persona:persona_id (nombre, apellido)')
    .in('id_medico', unicos);
  return new Map(
    (data || []).map((m) => [
      m.id_medico,
      { nombre: m.persona?.nombre || '', apellido: m.persona?.apellido || '' },
    ])
  );
}

// -------- Consultas/atenciones del paciente --------
export async function obtenerConsultasPaciente(id_paciente, { limite = 200 } = {}) {
  const { data, error } = await supabaseAdmin
    .from('consulta')
    .select('id_consulta, id_cita, id_paciente, id_medico, fecha_consulta, motivo_consulta, observaciones')
    .eq('id_paciente', id_paciente)
    .order('fecha_consulta', { ascending: false })
    .limit(limite);

  if (error) throw new Error(`Error al obtener consultas del paciente: ${error.message}`);

  const rows = data || [];
  const { leerMetaMedico, leerMetaAdmision, textoLibre } = await import('./consultaMeta.js');
  const medicos = await mapaMedicos(rows.map((r) => r.id_medico));

  return rows.map((c) => {
    const med = medicos.get(c.id_medico) || { nombre: '', apellido: '' };
    const metaMed = leerMetaMedico(c.observaciones);
    const metaAdm = leerMetaAdmision(c.observaciones);
    return {
      id_consulta: c.id_consulta,
      id_cita: c.id_cita,
      id_paciente: c.id_paciente,
      id_medico: c.id_medico,
      fecha_consulta: c.fecha_consulta,
      motivo_consulta: c.motivo_consulta,
      tipo_admision: metaAdm.tipo_admision,
      sala_asignada: metaAdm.sala_asignada,
      estado_atencion: metaMed.estado_atencion,
      diagnostico: metaMed.diagnostico,
      tratamiento: metaMed.tratamiento,
      receta: metaMed.receta,
      proxima_cita: metaMed.proxima_cita,
      observaciones: textoLibre(c.observaciones) || null,
      medico_nombre: `${med.nombre} ${med.apellido}`.trim() || `Médico #${c.id_medico}`,
    };
  });
}

// -------- Signos vitales del paciente (via vw_signos_vitales) --------
export async function obtenerSignosPaciente(id_paciente, { limite = 100 } = {}) {
  // Sus signos viven en consultas propias -> id_consulta -> signos de esas consultas.
  const { data: consultas, error: errC } = await supabaseAdmin
    .from('consulta')
    .select('id_consulta')
    .eq('id_paciente', id_paciente)
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

// -------- Cancelar cita propia (solo si aun no fue atendida) --------
export async function cancelarCitaPaciente(id_paciente, id_cita) {
  const { data: cita, error: errC } = await supabaseAdmin
    .from('cita')
    .select('id_cita, id_paciente, estado')
    .eq('id_cita', id_cita)
    .maybeSingle();

  if (errC) throw new Error(`Error al buscar la cita: ${errC.message}`);
  if (!cita) throw new Error('La cita no existe.');
  if (cita.id_paciente !== id_paciente) {
    throw new Error('No tienes permiso para cancelar esta cita.');
  }
  if (cita.estado === 'atendida') {
    throw new Error('No se puede cancelar una cita ya atendida.');
  }
  if (cita.estado === 'cancelada') {
    throw new Error('Esta cita ya fue cancelada.');
  }

  const { error } = await supabaseAdmin
    .from('cita')
    .update({ estado: 'cancelada' })
    .eq('id_cita', id_cita);

  if (error) throw new Error(`Error al cancelar la cita: ${error.message}`);
  return { ok: true };
}

// -------- Perfil del paciente (datos personales + usuario + seguro) --------
export async function obtenerPerfilPaciente(id_paciente) {
  const { data, error } = await supabaseAdmin
    .from('paciente')
    .select(`
      id_paciente,
      tipo_seguro,
      numero_seguro,
      persona:persona_id (
        persona_id,
        nombre,
        apellido,
        fecha_nac,
        sexo,
        telefono
      )
    `)
    .eq('id_paciente', id_paciente)
    .maybeSingle();

  if (error) throw new Error(`Error al obtener perfil: ${error.message}`);
  if (!data) return null;

  const { data: usuario, error: errU } = await supabaseAdmin
    .from('usuario')
    .select('ci, correo, estado, rol')
    .eq('persona_id', data.persona?.persona_id)
    .maybeSingle();

  if (errU) throw new Error(`Error al obtener usuario: ${errU.message}`);

  return {
    id_paciente: data.id_paciente,
    persona_id: data.persona?.persona_id,
    nombre: data.persona?.nombre || '',
    apellido: data.persona?.apellido || '',
    fecha_nac: data.persona?.fecha_nac || '',
    sexo: data.persona?.sexo || '',
    telefono: data.persona?.telefono || '',
    ci: usuario?.ci || '',
    correo: usuario?.correo || '',
    rol: usuario?.rol || 'paciente',
    estado: usuario?.estado || 'activo',
    tipo_seguro: data.tipo_seguro || '',
    numero_seguro: data.numero_seguro || '',
  };
}
