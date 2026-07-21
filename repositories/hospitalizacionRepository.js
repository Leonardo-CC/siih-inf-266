import { supabaseAdmin } from '../lib/supabaseAdmin.js';

export async function obtenerConsultaParaHospitalizacion(id_consulta) {
  if (!id_consulta) return null;

  const { data, error } = await supabaseAdmin
    .from('consulta')
    .select('id_consulta, id_cita, id_paciente, id_medico, motivo_consulta')
    .eq('id_consulta', id_consulta)
    .maybeSingle();

  if (error) throw new Error(`Error al obtener la consulta: ${error.message}`);
  return data || null;
}

export async function obtenerCitaParaHospitalizacion(id_cita) {
  if (!id_cita) return null;

  const { data, error } = await supabaseAdmin
    .from('cita')
    .select('id_cita, id_paciente, id_medico, motivo')
    .eq('id_cita', id_cita)
    .maybeSingle();

  if (error) throw new Error(`Error al obtener la cita: ${error.message}`);
  return data || null;
}

export async function crearHospitalizacionClinica(payload) {
  const payloadCompleto = Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
  const payloadBasico = {
    id_consulta: payload.id_consulta,
    id_paciente: payload.id_paciente,
    id_medico: payload.id_medico,
    motivo_ingreso: payload.motivo_ingreso,
    estado: payload.estado || 'activa',
  };

  const existente = payload.id_consulta
    ? await obtenerHospitalizacionPorConsulta(payload.id_consulta)
    : null;

  if (existente?.id_hospitalizacion) {
    return actualizarHospitalizacion(existente.id_hospitalizacion, payloadCompleto);
  }

  let { data, error } = await supabaseAdmin
    .from('hospitalizacion')
    .insert([payloadCompleto])
    .select('id_hospitalizacion, id_consulta, id_paciente, id_medico, motivo_ingreso, fecha_ingreso, estado')
    .single();

  if (error && /schema cache|column|tiempo|sala|cama|fecha_estimada|fecha_alta|motivo_alta|indicaciones/i.test(error.message || '')) {
    ({ data, error } = await supabaseAdmin
      .from('hospitalizacion')
      .insert([payloadBasico])
      .select('id_hospitalizacion, id_consulta, id_paciente, id_medico, motivo_ingreso, fecha_ingreso, estado')
      .single());
  }

  if (error) throw new Error(`Error registrando hospitalizacion: ${error.message}`);
  return data;
}

export async function obtenerHospitalizacionPorConsulta(id_consulta) {
  if (!id_consulta) return null;
  const { data, error } = await supabaseAdmin
    .from('hospitalizacion')
    .select('id_hospitalizacion, id_consulta, id_paciente, id_medico, motivo_ingreso, fecha_ingreso, estado')
    .eq('id_consulta', id_consulta)
    .maybeSingle();

  if (error) throw new Error(`Error verificando hospitalizacion existente: ${error.message}`);
  return data || null;
}

export async function actualizarHospitalizacion(id_hospitalizacion, payload) {
  const limpio = Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
  delete limpio.id_hospitalizacion;
  delete limpio.id_consulta;

  let { data, error } = await supabaseAdmin
    .from('hospitalizacion')
    .update(limpio)
    .eq('id_hospitalizacion', id_hospitalizacion)
    .select('id_hospitalizacion, id_consulta, id_paciente, id_medico, motivo_ingreso, fecha_ingreso, estado')
    .single();

  if (error && /schema cache|column|tiempo|sala|cama|fecha_estimada|fecha_alta|motivo_alta|indicaciones/i.test(error.message || '')) {
    const basico = {
      id_paciente: payload.id_paciente,
      id_medico: payload.id_medico,
      motivo_ingreso: payload.motivo_ingreso,
      estado: payload.estado,
    };
    const basicoLimpio = Object.fromEntries(Object.entries(basico).filter(([, value]) => value !== undefined));
    ({ data, error } = await supabaseAdmin
      .from('hospitalizacion')
      .update(basicoLimpio)
      .eq('id_hospitalizacion', id_hospitalizacion)
      .select('id_hospitalizacion, id_consulta, id_paciente, id_medico, motivo_ingreso, fecha_ingreso, estado')
      .single());
  }

  if (error) throw new Error(`Error actualizando hospitalizacion: ${error.message}`);
  return data;
}

export async function listarHospitalizaciones() {
  let { data, error } = await supabaseAdmin
    .from('hospitalizacion')
    .select(`
      id_hospitalizacion,
      id_consulta,
      id_paciente,
      id_medico,
      motivo_ingreso,
      fecha_ingreso,
      fecha_estimada_alta,
      fecha_alta,
      motivo_alta,
      indicaciones_alta,
      tiempo_internacion_dias,
      sala,
      cama,
      estado,
      paciente:id_paciente ( persona:persona_id ( nombre, apellido ) ),
      medico:id_medico ( persona:persona_id ( nombre, apellido ) )
    `)
    .order('fecha_ingreso', { ascending: false });

  if (error && /schema cache|column|relationship|fecha_estimada|motivo_alta|indicaciones|tiempo|sala|cama/i.test(error.message || '')) {
    ({ data, error } = await supabaseAdmin
      .from('hospitalizacion')
      .select(`
        id_hospitalizacion,
        id_consulta,
        id_paciente,
        id_medico,
        motivo_ingreso,
        fecha_ingreso,
        estado,
        paciente:id_paciente ( persona:persona_id ( nombre, apellido ) ),
        medico:id_medico ( persona:persona_id ( nombre, apellido ) )
      `)
      .order('fecha_ingreso', { ascending: false }));
  }

  if (error) throw new Error(`Error listando hospitalizaciones: ${error.message}`);
  return (data || []).map((h) => ({
    ...h,
    paciente_nombre: h.paciente?.persona ? `${h.paciente.persona.nombre || ''} ${h.paciente.persona.apellido || ''}`.trim() : `Paciente #${h.id_paciente}`,
    medico_nombre: h.medico?.persona ? `${h.medico.persona.nombre || ''} ${h.medico.persona.apellido || ''}`.trim() : `Medico #${h.id_medico}`,
  }));
}
