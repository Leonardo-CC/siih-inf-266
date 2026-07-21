// repositories/admisionRepository.js
// ============================================================
// CAPA DE DATOS - HU-11 / RF11: Gestion de admision
//
// La tabla dedicada `admision` (sql/005) no esta desplegada en la BD,
// por lo que la admision se persiste sobre la tabla `consulta`.
// Para no perder tipo/estado/sala/enfermero/verificado, se guardan
// como un bloque de metadatos estructurado dentro de `observaciones`:
//
//   [[ADM]]{"tipo":"emergencia","estado":"asignada",...}[[/ADM]] Texto libre
//
// De esta forma el CRUD es totalmente funcional y persistente.
// ============================================================
import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import {
  leerMetaAdmision,
  leerMetaMedico,
  textoLibre,
  componerObservaciones,
} from './consultaMeta.js';

const TIPOS_ADMISION_VALIDOS = ['consulta_externa', 'emergencia'];
const ESTADOS_ADMISION_VALIDOS = ['registrada', 'en_triage', 'asignada', 'atendida', 'cancelada'];

// ------------------------------------------------------------
// Helpers de metadatos embebidos en observaciones (compatibilidad)
// ------------------------------------------------------------

export function parsearObservaciones(observaciones) {
  const adm = leerMetaAdmision(observaciones);
  return {
    tipo_admision: adm.tipo_admision,
    estado: adm.estado,
    sala_asignada: adm.sala_asignada,
    id_enfermero: adm.id_enfermero,
    datos_verificados: adm.datos_verificados,
    observaciones: textoLibre(observaciones) || null,
  };
}

export function construirObservaciones({
  tipo_admision,
  estado,
  sala_asignada,
  id_enfermero,
  datos_verificados,
  observaciones,
  medExistente = null,
}) {
  return componerObservaciones({
    adm: { tipo_admision, estado, sala_asignada, id_enfermero, datos_verificados },
    med: medExistente,
    libre: observaciones,
  });
}

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

  // El estado inicial depende de si el enfermero verificó los datos.
  const estadoInicial = payload.datos_verificados ? 'asignada' : 'registrada';

  const observaciones = construirObservaciones({
    tipo_admision: payload.tipo_admision,
    estado: estadoInicial,
    sala_asignada: payload.sala_asignada,
    id_enfermero: payload.id_enfermero,
    datos_verificados: payload.datos_verificados,
    observaciones: payload.observaciones,
  });

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
    }
  } catch (subError) {
    await supabaseAdmin.from('consulta').delete().eq('id_consulta', idConsulta);
    throw new Error(`Error registrando el tipo de admisión: ${subError.message}`);
  }

  return consulta;
}

export async function obtenerAdmisiones(filtro = {}) {
  const { data, error } = await supabaseAdmin
    .from('consulta')
    .select(`
      id_consulta,
      id_cita,
      id_paciente,
      id_medico,
      fecha_consulta,
      motivo_consulta,
      observaciones
    `)
    .order('fecha_consulta', { ascending: false })
    .limit(300);

  if (error) throw new Error(`Error al obtener admisiones: ${error.message}`);

  let rows = data || [];

  // Filtro por enfermero (el id vive en la metadata embebida).
  if (filtro.id_enfermero) {
    rows = rows.filter(
      (c) => parsearObservaciones(c.observaciones).id_enfermero === Number(filtro.id_enfermero)
    );
  }

  // Filtro por medico (columna real).
  if (filtro.id_medico) {
    rows = rows.filter((c) => c.id_medico === Number(filtro.id_medico));
  }
  const pacienteIds = [...new Set(rows.map((c) => c.id_paciente))];
  const medicoIds = [...new Set(rows.map((c) => c.id_medico).filter(Boolean))];

  // Recolectar los id_enfermero embebidos en la metadata para resolver su nombre.
  const enfermeroIds = [
    ...new Set(
      rows
        .map((c) => parsearObservaciones(c.observaciones).id_enfermero)
        .filter(Boolean)
    ),
  ];

  const [pacientesMap, medicosMap, enfermerosMap] = await Promise.all([
    pacienteIds.length
      ? supabaseAdmin.from('paciente').select('id_paciente, persona:persona_id (nombre, apellido)').in('id_paciente', pacienteIds).then(({ data }) => {
          const map = new Map();
          (data || []).forEach((p) => {
            map.set(p.id_paciente, {
              nombre: p.persona?.nombre || '',
              apellido: p.persona?.apellido || '',
            });
          });
          return map;
        })
      : Promise.resolve(new Map()),
    medicoIds.length
      ? supabaseAdmin.from('medico').select('id_medico, persona:persona_id (nombre, apellido)').in('id_medico', medicoIds).then(({ data }) => {
          const map = new Map();
          (data || []).forEach((m) => {
            map.set(m.id_medico, {
              nombre: m.persona?.nombre || '',
              apellido: m.persona?.apellido || '',
            });
          });
          return map;
        })
      : Promise.resolve(new Map()),
    enfermeroIds.length
      ? supabaseAdmin.from('enfermero').select('id_enfermero, persona:persona_id (nombre, apellido)').in('id_enfermero', enfermeroIds).then(({ data }) => {
          const map = new Map();
          (data || []).forEach((e) => {
            map.set(e.id_enfermero, {
              nombre: e.persona?.nombre || '',
              apellido: e.persona?.apellido || '',
            });
          });
          return map;
        })
      : Promise.resolve(new Map()),
  ]);

  return rows.map((consulta) => {
    const meta = parsearObservaciones(consulta.observaciones);
    const paciente = pacientesMap.get(consulta.id_paciente) || { nombre: '', apellido: '' };
    const medico = consulta.id_medico ? medicosMap.get(consulta.id_medico) : null;
    const enfermero = meta.id_enfermero ? enfermerosMap.get(meta.id_enfermero) : null;

    return {
      id_admision: consulta.id_consulta,
      id_cita: consulta.id_cita,
      id_paciente: consulta.id_paciente,
      id_medico: consulta.id_medico,
      id_enfermero: meta.id_enfermero,
      fecha_admision: consulta.fecha_consulta,
      tipo_admision: meta.tipo_admision,
      estado: meta.estado,
      datos_verificados: meta.datos_verificados,
      motivo_consulta: consulta.motivo_consulta,
      sala_asignada: meta.sala_asignada,
      observaciones: meta.observaciones,
      paciente_nombre: paciente.nombre || `Paciente #${consulta.id_paciente}`,
      paciente_apellido: paciente.apellido,
      medico_nombre: medico ? medico.nombre : null,
      medico_apellido: medico ? medico.apellido : '',
      enfermero_nombre: enfermero ? enfermero.nombre : null,
      enfermero_apellido: enfermero ? enfermero.apellido : '',
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

export async function actualizarAdmision(id_consulta, payload) {
  // Leer estado actual para hacer merge de la metadata embebida.
  const { data: actual, error: errLeer } = await supabaseAdmin
    .from('consulta')
    .select('id_consulta, observaciones, motivo_consulta')
    .eq('id_consulta', id_consulta)
    .single();

  if (errLeer || !actual) {
    throw new Error('No se encontró la admisión indicada.');
  }

  const metaActual = parsearObservaciones(actual.observaciones);
  const medExistente = leerMetaMedico(actual.observaciones);

  const merge = {
    tipo_admision: payload.tipo_admision !== undefined ? payload.tipo_admision : metaActual.tipo_admision,
    estado: payload.estado !== undefined ? payload.estado : metaActual.estado,
    sala_asignada: payload.sala_asignada !== undefined ? (payload.sala_asignada?.trim() || null) : metaActual.sala_asignada,
    id_enfermero: payload.id_enfermero !== undefined && payload.id_enfermero !== ''
      ? Number(payload.id_enfermero)
      : metaActual.id_enfermero,
    datos_verificados: payload.datos_verificados !== undefined ? Boolean(payload.datos_verificados) : metaActual.datos_verificados,
    observaciones: payload.observaciones !== undefined ? payload.observaciones : metaActual.observaciones,
    medExistente,
  };

  const updates = {
    observaciones: construirObservaciones(merge),
  };

  if (payload.motivo_consulta !== undefined) {
    updates.motivo_consulta = payload.motivo_consulta?.trim() || actual.motivo_consulta;
  }

  // Permitir reasignar el médico de la admisión.
  if (payload.id_medico !== undefined && payload.id_medico !== '' && payload.id_medico !== null) {
    const idMedico = Number(payload.id_medico);
    if (Number.isInteger(idMedico) && idMedico > 0) {
      updates.id_medico = idMedico;
    }
  }

  const { data, error } = await supabaseAdmin
    .from('consulta')
    .update(updates)
    .eq('id_consulta', id_consulta)
    .select('id_consulta, id_paciente, id_medico, fecha_consulta, motivo_consulta, observaciones')
    .single();

  if (error) throw new Error(`Error actualizando admision: ${error.message}`);

  return data;
}

export async function borrarAdmision(id_consulta) {
  // Eliminar dependencias antes de borrar la consulta para evitar
  // fallos por llaves foraneas (signos, recetas, pagos y subtipos).
  const { data: historiales } = await supabaseAdmin
    .from('historial_clinico')
    .select('id_historial, receta ( id_receta )')
    .eq('id_consulta', id_consulta);

  const idsHistorial = (historiales || []).map((h) => h.id_historial).filter(Boolean);
  const idsReceta = (historiales || [])
    .flatMap((h) => Array.isArray(h.receta) ? h.receta : [h.receta])
    .map((r) => r?.id_receta)
    .filter(Boolean);

  if (idsReceta.length) {
    await supabaseAdmin.from('detalle_receta').delete().in('id_receta', idsReceta);
    await supabaseAdmin.from('receta').delete().in('id_receta', idsReceta);
  }
  if (idsHistorial.length) {
    await supabaseAdmin.from('historial_clinico').delete().in('id_historial', idsHistorial);
  }

  await supabaseAdmin.from('analisis_laboratorio').delete().eq('id_consulta', id_consulta);
  await supabaseAdmin.from('pago').update({ id_consulta: null }).eq('id_consulta', id_consulta);
  await supabaseAdmin.from('signos_vitales').delete().eq('id_consulta', id_consulta);
  await supabaseAdmin.from('consulta_externa').delete().eq('id_consulta', id_consulta);
  await supabaseAdmin.from('emergencia').delete().eq('id_consulta', id_consulta);
  await supabaseAdmin.from('hospitalizacion').delete().eq('id_consulta', id_consulta);

  const { error } = await supabaseAdmin
    .from('consulta')
    .delete()
    .eq('id_consulta', id_consulta);

  if (error) throw new Error(`Error eliminando admision: ${error.message}`);
}
