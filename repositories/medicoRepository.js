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
export async function obtenerConsultasMedico(id_medico, { limite = 200, fecha } = {}) {
  // 1. Obtenemos el texto YYYY-MM-DD. Si no envían fecha, calculamos la de hoy local.
  let fechaFiltro = fecha;
  if (!fechaFiltro) {
    const hoy = new Date();
    fechaFiltro = hoy.getFullYear() + '-' + 
                  String(hoy.getMonth() + 1).padStart(2, '0') + '-' + 
                  String(hoy.getDate()).padStart(2, '0');
  }

  // 2. Armamos el inicio y fin como TEXTO LITERAL, para que JavaScript no nos cambie la zona horaria
  const inicioFiltro = `${fechaFiltro}T00:00:00`;
  const finFiltro = `${fechaFiltro}T23:59:59`;

  const { data, error } = await supabaseAdmin
    .from('consulta')
    .select('id_consulta, id_cita, id_paciente, id_medico, fecha_consulta, motivo_consulta, observaciones')
    .eq('id_medico', id_medico)
    .gte('fecha_consulta', inicioFiltro) // Ejemplo: "2026-07-18T00:00:00"
    .lte('fecha_consulta', finFiltro)    // Ejemplo: "2026-07-18T23:59:59"
    .order('fecha_consulta', { ascending: false })
    .limit(limite);

  if (error) throw new Error(`Error al obtener consultas del medico: ${error.message}`);

  const rows = data || [];
  const pacientes = await mapaPacientes(rows.map((r) => r.id_paciente));

  const recetasPorConsulta = new Map();
  if (rows.length) {
    const idsConsulta = rows.map((r) => r.id_consulta);
    const { data: historiales } = await supabaseAdmin
      .from('historial_clinico')
      .select('id_consulta, id_historial, diagnostico, observaciones, receta ( id_receta )')
      .in('id_consulta', idsConsulta);

    (historiales || []).forEach((h) => {
      const receta = Array.isArray(h.receta) ? h.receta[0] : h.receta;
      if (receta?.id_receta) {
        recetasPorConsulta.set(h.id_consulta, {
          id_receta: receta.id_receta,
          diagnostico: h.diagnostico,
          observaciones: h.observaciones,
        });
      }
    });
  }

  return rows.map((c) => {
    const adm = leerMetaAdmision(c.observaciones);
    const med = leerMetaMedico(c.observaciones);
    const pac = pacientes.get(c.id_paciente) || { nombre: '', apellido: '' };
    const historial = recetasPorConsulta.get(c.id_consulta) || null;
    const idReceta = historial?.id_receta || null;
    return {
      id_consulta: c.id_consulta,
      id_cita: c.id_cita,
      id_paciente: c.id_paciente,
      id_medico: c.id_medico,
      fecha_consulta: c.fecha_consulta,
      motivo_consulta: c.motivo_consulta,
      tipo_admision: adm.tipo_admision,
      sala_asignada: adm.sala_asignada,
      estado_atencion: med.estado_atencion || 'pendiente',
      diagnostico: med.diagnostico || historial?.diagnostico || null,
      tratamiento: med.tratamiento,
      receta: med.receta,
      proxima_cita: med.proxima_cita,
      observaciones: textoLibre(c.observaciones) || historial?.observaciones || null,
      paciente_nombre: pac.nombre || `Paciente #${c.id_paciente}`,
      paciente_apellido: pac.apellido,
      tiene_receta: Boolean(idReceta),
      id_receta: idReceta,
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

// -------- Consulta individual para el reporte PDF (HU-09) --------
export async function obtenerConsultaParaReporte(id_consulta, id_medico) {
  const { data: c, error } = await supabaseAdmin
    .from('consulta')
    .select('id_consulta, id_cita, id_paciente, id_medico, fecha_consulta, motivo_consulta, observaciones')
    .eq('id_consulta', id_consulta)
    .maybeSingle();

  if (error) throw new Error(`Error al obtener la consulta: ${error.message}`);
  if (!c) return null;
  if (id_medico && c.id_medico !== id_medico) return 'forbidden';

  const med = leerMetaMedico(c.observaciones);
  const libre = textoLibre(c.observaciones);
  const { data: historial, error: errHistorial } = await supabaseAdmin
    .from('historial_clinico')
    .select(`
      id_historial,
      diagnostico,
      observaciones
    `)
    .eq('id_consulta', id_consulta)
    .maybeSingle();

  if (errHistorial) throw new Error(`Error al obtener el historial clinico: ${errHistorial.message}`);

  let receta = null;
  let detallesReceta = [];
  if (historial?.id_historial) {
    const { data: recetaData, error: errReceta } = await supabaseAdmin
      .from('receta')
      .select('id_receta, observaciones, estado')
      .eq('id_historial', historial.id_historial)
      .order('fecha_emision', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (errReceta) throw new Error(`Error al obtener la receta: ${errReceta.message}`);
    receta = recetaData || null;

    if (receta?.id_receta) {
      const { data: detalles, error: errDetalles } = await supabaseAdmin
        .from('detalle_receta')
        .select('cantidad, dosis, frecuencia, duracion, medicamento ( nombre )')
        .eq('id_receta', receta.id_receta)
        .order('id_detalle', { ascending: true });

      if (errDetalles) throw new Error(`Error al obtener detalle de receta: ${errDetalles.message}`);
      detallesReceta = detalles || [];
    }
  }

  const resumenReceta = detallesReceta
    .map((d) => {
      const medicamento = d.medicamento?.nombre || 'Medicamento';
      const partes = [
        `${d.cantidad || 1}x ${medicamento}`,
        d.dosis,
        d.frecuencia,
        d.duracion,
      ].filter(Boolean);
      return partes.join(' - ');
    })
    .join('\n');

  return {
    id_consulta: c.id_consulta,
    id_paciente: c.id_paciente,
    id_medico: c.id_medico,
    fecha_consulta: c.fecha_consulta,
    motivo_consulta: c.motivo_consulta,
    estado_atencion: med.estado_atencion,
    diagnostico: med.diagnostico || historial?.diagnostico || null,
    tratamiento: med.tratamiento || historial?.observaciones || null,
    receta: med.receta || receta?.observaciones || resumenReceta || null,
    proxima_cita: med.proxima_cita,
    observaciones_libres: libre || historial?.observaciones || null,
  };
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

// -------- Prescripción de medicamentos (HU-08) --------
export async function obtenerMedicamentosCatalogo() {
  let { data, error } = await supabaseAdmin
    .from('medicamento')
    .select('id_medicamento, nombre, descripcion, stock_actual, stock_minimo')
    .order('nombre');

  if (error && /estado/.test(error.message)) {
    ({ data, error } = await supabaseAdmin
      .from('medicamento')
      .select('id_medicamento, nombre, descripcion, stock_actual, stock_minimo')
      .order('nombre'));
  }

  if (error) throw new Error(error.message);
  return data || [];
}

export async function obtenerHistorialClinicoPorConsulta(id_consulta) {
  const { data, error } = await supabaseAdmin
    .from('historial_clinico')
    .select('id_historial, diagnostico, observaciones, alergias')
    .eq('id_consulta', id_consulta)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data || null;
}

export async function crearHistorialClinico(id_consulta, { diagnostico, observaciones, alergias }) {
  const { data, error } = await supabaseAdmin
    .from('historial_clinico')
    .insert({
      id_consulta,
      diagnostico: diagnostico?.trim() || null,
      observaciones: observaciones?.trim() || null,
      alergias: alergias?.trim() || null,
    })
    .select('id_historial')
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function actualizarHistorialClinico(id_historial, { diagnostico, observaciones, alergias }) {
  const updates = {};
  if (diagnostico !== undefined) updates.diagnostico = diagnostico?.trim() || null;
  if (observaciones !== undefined) updates.observaciones = observaciones?.trim() || null;
  if (alergias !== undefined) updates.alergias = alergias?.trim() || null;

  const { data, error } = await supabaseAdmin
    .from('historial_clinico')
    .update(updates)
    .eq('id_historial', id_historial)
    .select('id_historial')
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function crearReceta(id_historial, observaciones) {
  const { data, error } = await supabaseAdmin
    .from('receta')
    .insert({
      id_historial,
      observaciones: observaciones?.trim() || null,
    })
    .select('id_receta')
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function crearDetallesReceta(id_receta, items) {
  const detalles = items.map((item) => ({
    id_receta,
    id_medicamento: item.id_medicamento,
    cantidad: item.cantidad,
    dosis: item.dosis.trim(),
    frecuencia: item.frecuencia.trim(),
    duracion: item.duracion.trim(),
  }));

  const { data, error } = await supabaseAdmin
    .from('detalle_receta')
    .insert(detalles)
    .select('id_detalle, id_medicamento, cantidad, dosis, frecuencia, duracion');

  if (error) throw new Error(error.message);
  return data || [];
}

export async function obtenerRecetasMedico(id_medico) {
  const { data, error } = await supabaseAdmin
    .from('receta')
    .select(`
      id_receta,
      fecha_emision,
      estado,
      observaciones,
      id_historial,
      historial_clinico (
        id_consulta,
        diagnostico,
        consulta (
          id_paciente,
          motivo_consulta,
          fecha_consulta,
          paciente (
            persona ( nombre, apellido )
          )
        )
      )
    `)
    .order('fecha_emision', { ascending: false });

  if (error) throw new Error(error.message);
  const recetas = (data || []).filter((r) => r.historial_clinico?.consulta?.id_paciente != null);

  if (!recetas.length) return [];

  const idsReceta = recetas.map((r) => r.id_receta);
  const { data: detalles, error: errDetalles } = await supabaseAdmin
    .from('detalle_receta')
    .select('id_receta, cantidad, dosis, frecuencia, duracion, medicamento ( nombre )')
    .in('id_receta', idsReceta);

  if (errDetalles) throw new Error(errDetalles.message);

  const detallesPorReceta = new Map();
  (detalles || []).forEach((d) => {
    if (!detallesPorReceta.has(d.id_receta)) detallesPorReceta.set(d.id_receta, []);
    detallesPorReceta.get(d.id_receta).push(d);
  });

  return recetas.map((r) => ({
    ...r,
    detalle_receta: detallesPorReceta.get(r.id_receta) || [],
  }));
}

export async function obtenerRecetaPorConsulta(id_consulta) {
  const { data: historial, error: errHist } = await supabaseAdmin
    .from('historial_clinico')
    .select('id_historial, diagnostico, observaciones, receta ( id_receta, fecha_emision, estado, observaciones )')
    .eq('id_consulta', id_consulta)
    .maybeSingle();

  if (errHist) throw new Error(errHist.message);
  if (!historial?.receta || !Array.isArray(historial.receta) || !historial.receta.length) return null;

  const recetaBase = historial.receta[0];
  const id_receta = recetaBase.id_receta;
  const { data: detalles, error: errDet } = await supabaseAdmin
    .from('detalle_receta')
    .select('id_detalle, id_medicamento, cantidad, dosis, frecuencia, duracion, medicamento ( nombre )')
    .eq('id_receta', id_receta);

  if (errDet) throw new Error(errDet.message);

  return {
    id_receta,
    id_historial: historial.id_historial,
    diagnostico: historial.diagnostico,
    observaciones: historial.observaciones,
    fecha_emision: recetaBase.fecha_emision,
    estado: recetaBase.estado,
    observaciones_receta: recetaBase.observaciones,
    detalles: detalles || [],
  };
}

export async function actualizarRecetaCompleta(id_receta, id_historial, { diagnostico, observaciones, items }) {
  await actualizarHistorialClinico(id_historial, { diagnostico, observaciones });

  const idsDetalles = (items || []).filter((it) => it.id_detalle).map((it) => it.id_detalle);
  if (idsDetalles.length) {
    await supabaseAdmin.from('detalle_receta').delete().eq('id_receta', id_receta).not('id_detalle', 'in', `(${idsDetalles.join(',')})`);
  } else {
    await supabaseAdmin.from('detalle_receta').delete().eq('id_receta', id_receta);
  }

  for (const item of items || []) {
    if (item.id_detalle) {
      await supabaseAdmin
        .from('detalle_receta')
        .update({
          id_medicamento: item.id_medicamento,
          cantidad: item.cantidad,
          dosis: item.dosis.trim(),
          frecuencia: item.frecuencia.trim(),
          duracion: item.duracion.trim(),
        })
        .eq('id_detalle', item.id_detalle);
    } else {
      await supabaseAdmin.from('detalle_receta').insert({
        id_receta,
        id_medicamento: item.id_medicamento,
        cantidad: item.cantidad,
        dosis: item.dosis.trim(),
        frecuencia: item.frecuencia.trim(),
        duracion: item.duracion.trim(),
      });
    }
  }

  const { data, error } = await supabaseAdmin
    .from('receta')
    .update({ estado: 'pendiente' })
    .eq('id_receta', id_receta)
    .select('id_receta')
    .single();

  if (error) throw new Error(error.message);
  return data;
}
