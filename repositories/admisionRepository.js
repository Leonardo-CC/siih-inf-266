// repositories/admisionRepository.js
// ============================================================
// CAPA DE DATOS - HU-11 / RF11: Gestion de admision
// Acceso directo a cita, enfermero, medico y vista vw_admisiones.
// ============================================================
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

export async function obtenerCitasParaAdmision() {
  const { data, error } = await supabaseAdmin
    .from('cita')
    .select(`
      id_cita,
      id_paciente,
      id_medico,
      fecha_hora,
      motivo,
      estado,
      paciente:id_paciente (
        id_paciente,
        persona:persona_id (nombre, apellido)
      ),
      medico:id_medico (
        id_medico,
        persona:persona_id (nombre, apellido)
      )
    `)
    .in('estado', ['pendiente', 'confirmada'])
    .order('fecha_hora', { ascending: true });

  if (error) throw new Error(`Error al obtener citas para admision: ${error.message}`);

  return (data || []).map((c) => ({
    id_cita: c.id_cita,
    id_paciente: c.id_paciente,
    id_medico: c.id_medico,
    fecha_hora: c.fecha_hora,
    motivo: c.motivo,
    estado: c.estado,
    paciente_nombre: c.paciente?.persona
      ? `${c.paciente.persona.nombre} ${c.paciente.persona.apellido}`
      : `Paciente #${c.id_paciente}`,
    medico_nombre: c.medico?.persona
      ? `Dr(a). ${c.medico.persona.nombre} ${c.medico.persona.apellido}`
      : `Medico #${c.id_medico}`,
  }));
}

export async function obtenerEnfermeros() {
  const { data, error } = await supabaseAdmin
    .from('enfermero')
    .select('id_enfermero, persona:persona_id (nombre, apellido)')
    .order('id_enfermero', { ascending: true });

  if (error) throw new Error(`Error al obtener enfermeros: ${error.message}`);

  return (data || []).map((e) => ({
    id_enfermero: e.id_enfermero,
    nombre_completo: e.persona
      ? `${e.persona.nombre} ${e.persona.apellido}`
      : `Enfermero(a) #${e.id_enfermero}`,
  }));
}

export async function obtenerMedicos() {
  const { data, error } = await supabaseAdmin
    .from('medico')
    .select('id_medico, nro_licencia, persona:persona_id (nombre, apellido)')
    .order('id_medico', { ascending: true });

  if (error) throw new Error(`Error al obtener medicos: ${error.message}`);

  return (data || []).map((m) => ({
    id_medico: m.id_medico,
    nro_licencia: m.nro_licencia,
    nombre_completo: m.persona
      ? `Dr(a). ${m.persona.nombre} ${m.persona.apellido}`
      : `Medico #${m.id_medico}`,
  }));
}

export async function obtenerPacientes() {
  const { data, error } = await supabaseAdmin
    .from('paciente')
    .select('id_paciente, persona:persona_id (nombre, apellido)')
    .order('id_paciente', { ascending: true });

  if (error) throw new Error(`Error al obtener pacientes: ${error.message}`);

  return (data || []).map((p) => ({
    id_paciente: p.id_paciente,
    nombre_completo: p.persona
      ? `${p.persona.nombre} ${p.persona.apellido}`
      : `Paciente #${p.id_paciente}`,
  }));
}

export async function ejecutarRegistroAdmision(payload) {
  const observacionesExtras = [];

  if (payload.tipo_admision) observacionesExtras.push(`Tipo: ${payload.tipo_admision}`);
  if (payload.sala_asignada) observacionesExtras.push(`Sala: ${payload.sala_asignada}`);
  if (payload.id_enfermero) observacionesExtras.push(`Enfermero: ${payload.id_enfermero}`);
  if (payload.datos_verificados !== undefined) {
    observacionesExtras.push(`Verificado: ${payload.datos_verificados ? 'Sí' : 'No'}`);
  }
  if (payload.observaciones) observacionesExtras.push(payload.observaciones);

  const observaciones = observacionesExtras.length ? observacionesExtras.join(' | ') : null;
  const idCita = payload.id_cita ? Number(payload.id_cita) : null;
  let idPaciente = payload.id_paciente ? Number(payload.id_paciente) : null;
  let idMedico = payload.id_medico ? Number(payload.id_medico) : null;

  if (idCita) {
    const { data: cita, error: errorCita } = await supabaseAdmin
      .from('cita')
      .select('id_paciente, id_medico, estado')
      .eq('id_cita', idCita)
      .single();

    if (errorCita || !cita) {
      throw new Error(`No se encontró la cita ${idCita}.`);
    }

    if (cita.estado === 'cancelada') {
      throw new Error('No se puede admitir una cita cancelada.');
    }

    idPaciente = idPaciente || cita.id_paciente;
    idMedico = idMedico || cita.id_medico;

    await supabaseAdmin
      .from('cita')
      .update({ estado: 'confirmada' })
      .eq('id_cita', idCita);
  }

  if (!idPaciente) {
    throw new Error('NO_ID_PACIENTE');
  }

  if (!idMedico) {
    throw new Error('Debes asignar un médico para registrar la admisión.');
  }

  // Verificar si ya existe una admisión reciente para este paciente (últimas 24 horas)
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: admisionesRecientes, error: errCheck } = await supabaseAdmin
    .from('consulta')
    .select('id_consulta, fecha_consulta, id_medico, id_cita')
    .eq('id_paciente', idPaciente)
    .gte('fecha_consulta', cutoff)
    .limit(1);

  if (errCheck) throw new Error(`Error verificando admisiones previas: ${errCheck.message}`);
  if (admisionesRecientes && admisionesRecientes.length > 0) {
    throw new Error('PACIENTE_YA_ADMITIDO');
  }

  const registro = {
    id_cita: idCita,
    id_paciente: idPaciente,
    id_medico: idMedico,
    motivo_consulta: payload.motivo_consulta,
    fecha_consulta: new Date().toISOString(),
    observaciones,
  };

  const { data: consulta, error } = await supabaseAdmin
    .from('consulta')
    .insert([registro])
    .select('id_consulta, id_paciente, id_medico')
    .single();

  if (error) throw new Error(`Error registrando admision: ${error.message}`);

  const idConsulta = consulta.id_consulta;

  try {
    if (payload.tipo_admision === 'consulta_externa') {
      const { error: errorExterna } = await supabaseAdmin
        .from('consulta_externa')
        .insert([{ id_consulta: idConsulta, nro_consultorio: payload.sala_asignada || null }]);
      if (errorExterna) throw errorExterna;
    } else if (payload.tipo_admision === 'emergencia') {
      const { error: errorEmergencia } = await supabaseAdmin
        .from('emergencia')
        .insert([{ id_consulta: idConsulta }]);
      if (errorEmergencia) throw errorEmergencia;
    } else if (payload.tipo_admision === 'hospitalizacion') {
      const { error: errorHospitalizacion } = await supabaseAdmin
        .from('hospitalizacion')
        .insert([
          {
            id_consulta: idConsulta,
            id_paciente: idPaciente,
            id_medico: idMedico,
            motivo_ingreso: payload.motivo_consulta,
            estado: 'activa',
          },
        ]);
      if (errorHospitalizacion) throw errorHospitalizacion;
    }
  } catch (subError) {
    await supabaseAdmin.from('consulta').delete().eq('id_consulta', idConsulta);
    throw new Error(`Error registrando el tipo de admisión: ${subError.message}`);
  }

  return consulta;
}

export async function obtenerAdmisiones() {
  const { data, error } = await supabaseAdmin
    .from('consulta')
    .select(`
      id_consulta,
      id_cita,
      id_paciente,
      id_medico,
      fecha_consulta,
      motivo_consulta,
      observaciones,
      cita:id_cita (estado),
      paciente:id_paciente (persona:persona_id (nombre, apellido)),
      medico:id_medico (persona:persona_id (nombre, apellido)),
      consulta_externa:id_consulta (nro_consultorio),
      emergencia:id_consulta (id_consulta),
      hospitalizacion:id_consulta (estado)
    `)
    .order('fecha_consulta', { ascending: false })
    .limit(20);

  if (error) throw new Error(`Error al obtener admisiones: ${error.message}`);

  return (data || []).map((consulta) => {
    const tipoAdmision = consulta.consulta_externa
      ? 'consulta_externa'
      : consulta.emergencia
      ? 'emergencia'
      : consulta.hospitalizacion
      ? 'hospitalizacion'
      : 'consulta_externa';

    return {
      id_admision: consulta.id_consulta,
      id_cita: consulta.id_cita,
      id_paciente: consulta.id_paciente,
      id_medico: consulta.id_medico,
      fecha_admision: consulta.fecha_consulta,
      tipo_admision: tipoAdmision,
      estado: consulta.hospitalizacion?.estado || consulta.cita?.estado || 'registrada',
      motivo_consulta: consulta.motivo_consulta,
      sala_asignada: consulta.consulta_externa?.nro_consultorio || consulta.observaciones || null,
      observaciones: consulta.observaciones,
      paciente_nombre: consulta.paciente?.persona?.nombre || `Paciente #${consulta.id_paciente}`,
      paciente_apellido: consulta.paciente?.persona?.apellido || '',
      medico_nombre: consulta.medico?.persona?.nombre || null,
      medico_apellido: consulta.medico?.persona?.apellido || '',
    };
  });
}

export async function buscarPacientesPorNombre(texto) {
  const textoNormalizado = (texto || '').trim();
  if (!textoNormalizado) return [];

  const parts = textoNormalizado.split(' ').filter(Boolean);
  const termino = `%${textoNormalizado}%`;

  if (parts.length === 1) {
    const [byNombre, byApellido] = await Promise.all([
      supabaseAdmin
        .from('persona')
        .select('persona_id, nombre, apellido, paciente:paciente (id_paciente)')
        .ilike('nombre', termino)
        .limit(10),
      supabaseAdmin
        .from('persona')
        .select('persona_id, nombre, apellido, paciente:paciente (id_paciente)')
        .ilike('apellido', termino)
        .limit(10),
    ]);

    if (byNombre.error) {
      throw new Error(`Error buscando pacientes: ${byNombre.error.message}`);
    }
    if (byApellido.error) {
      throw new Error(`Error buscando pacientes: ${byApellido.error.message}`);
    }

    const combined = [...(byNombre.data || []), ...(byApellido.data || [])];
    const unique = new Map();
    combined.forEach((p) => {
      const paciente = Array.isArray(p.paciente) ? p.paciente[0] : p.paciente;
      const idPaciente = paciente?.id_paciente;
      if (idPaciente && !unique.has(idPaciente)) {
        unique.set(idPaciente, p);
      }
    });

    return Array.from(unique.values()).slice(0, 10).map((p) => {
      const paciente = Array.isArray(p.paciente) ? p.paciente[0] : p.paciente;
      return {
        id_paciente: paciente?.id_paciente,
        nombre: p.nombre,
        apellido: p.apellido,
        nombre_completo: `${p.nombre || ''} ${p.apellido || ''}`.trim(),
      };
    });
  }

  const nombre = parts.slice(0, -1).join(' ');
  const apellido = parts.slice(-1).join(' ');

  const { data, error } = await supabaseAdmin
    .from('persona')
    .select('persona_id, nombre, apellido, paciente:paciente (id_paciente)')
    .ilike('nombre', `%${nombre}%`)
    .ilike('apellido', `%${apellido}%`)
    .limit(10);

  if (error) throw new Error(`Error buscando pacientes: ${error.message}`);

  return (data || [])
    .filter((p) => p.paciente && p.paciente[0]?.id_paciente)
    .map((p) => ({
      id_paciente: p.paciente[0].id_paciente,
      nombre: p.nombre,
      apellido: p.apellido,
      nombre_completo: `${p.nombre || ''} ${p.apellido || ''}`.trim(),
    }));
}

export async function crearPersonaYPaciente(nombreCompleto) {
  const parts = (nombreCompleto || '').split(' ').filter(Boolean);
  const nombre = parts.slice(0, -1).join(' ') || parts[0] || nombreCompleto;
  const apellido = parts.length > 1 ? parts.slice(-1).join(' ') : null;

  const { data: personaData, error: errPersona } = await supabaseAdmin
    .from('persona')
    .insert([{ nombre, apellido }])
    .select('persona_id')
    .single();

  if (errPersona) throw new Error(`Error creando persona: ${errPersona.message}`);

  const { data: pacienteData, error: errPaciente } = await supabaseAdmin
    .from('paciente')
    .insert([{ persona_id: personaData.persona_id }])
    .select('id_paciente')
    .single();

  if (errPaciente) throw new Error(`Error creando paciente: ${errPaciente.message}`);

  return { id_paciente: pacienteData.id_paciente, persona_id: personaData.persona_id };
}
