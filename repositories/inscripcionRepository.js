// repositories/inscripcionRepository.js
// ============================================================
// CAPA DE DATOS
// - CRUD de area_facultad (catálogo de facultades/áreas, RF20).
// - Alta y consulta de inscripcion (RF17), incluida la validación
//   de duplicados (una inscripción activa por paciente+facultad).
// ============================================================
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

// -------- Facultades / Áreas (catálogo) --------

export async function listarFacultades() {
  const { data, error } = await supabaseAdmin
    .from('area_facultad')
    .select('id_area, nombre_area, tipo_area, descripcion')
    .order('nombre_area', { ascending: true });

  if (error) throw new Error(`Error al listar facultades: ${error.message}`);
  return data || [];
}

export async function crearFacultad({ nombre_area, tipo_area, descripcion }) {
  const { data, error } = await supabaseAdmin
    .from('area_facultad')
    .insert([{ nombre_area, tipo_area: tipo_area || null, descripcion: descripcion || null }])
    .select('id_area, nombre_area, tipo_area, descripcion')
    .single();

  if (error) throw new Error(`Error al crear la facultad: ${error.message}`);
  return data;
}

export async function actualizarFacultad(id_area, { nombre_area, tipo_area, descripcion }) {
  const updates = {};
  if (nombre_area !== undefined) updates.nombre_area = nombre_area;
  if (tipo_area !== undefined) updates.tipo_area = tipo_area || null;
  if (descripcion !== undefined) updates.descripcion = descripcion || null;

  const { data, error } = await supabaseAdmin
    .from('area_facultad')
    .update(updates)
    .eq('id_area', id_area)
    .select('id_area, nombre_area, tipo_area, descripcion')
    .single();

  if (error) throw new Error(`Error al actualizar la facultad: ${error.message}`);
  return data;
}

export async function eliminarFacultad(id_area) {
  const { error } = await supabaseAdmin.from('area_facultad').delete().eq('id_area', id_area);
  // Postgres FK violation (hay inscripciones que usan esta facultad) -> código 23503
  if (error) {
    if (error.code === '23503') {
      throw new Error('No se puede eliminar: hay inscripciones registradas en esta facultad.');
    }
    throw new Error(`Error al eliminar la facultad: ${error.message}`);
  }
  return { ok: true };
}

// -------- Inscripciones --------

// Busca una inscripción ACTIVA del mismo paciente en la misma facultad
// (esto es lo que evita el duplicado pedido en el criterio de aceptación).
export async function buscarInscripcionActiva(id_paciente, id_area) {
  const { data, error } = await supabaseAdmin
    .from('inscripcion')
    .select('id_inscripcion, estado')
    .eq('id_paciente', id_paciente)
    .eq('id_area', id_area)
    .eq('estado', 'activa')
    .maybeSingle();

  if (error) throw new Error(`Error al verificar inscripción existente: ${error.message}`);
  return data;
}

export async function crearInscripcion({ id_paciente, id_area, fecha_inscripcion }) {
  const { data, error } = await supabaseAdmin
    .from('inscripcion')
    .insert([{ id_paciente, id_area, fecha_inscripcion, estado: 'activa' }])
    .select('id_inscripcion, id_paciente, id_area, fecha_inscripcion, estado')
    .single();

  if (error) throw new Error(`Error al registrar la inscripción: ${error.message}`);
  return data;
}

// Lista de inscripciones para la tabla del administrativo (con nombres, no solo IDs).
export async function listarInscripciones({ limite = 200 } = {}) {
  const { data, error } = await supabaseAdmin
    .from('inscripcion')
    .select(`
      id_inscripcion,
      fecha_inscripcion,
      estado,
      id_paciente,
      id_area,
      area:id_area ( nombre_area, tipo_area ),
      paciente:id_paciente (
        persona:persona_id ( nombre, apellido )
      )
    `)
    .order('id_inscripcion', { ascending: false })
    .limit(limite);

  if (error) throw new Error(`Error al listar inscripciones: ${error.message}`);

  const filas = (data || []).map((i) => ({
    id_inscripcion: i.id_inscripcion,
    fecha_inscripcion: i.fecha_inscripcion,
    estado: i.estado,
    id_paciente: i.id_paciente,
    id_area: i.id_area,
    facultad: i.area?.nombre_area || `Área #${i.id_area}`,
    paciente_nombre_completo: i.paciente?.persona
      ? `${i.paciente.persona.nombre} ${i.paciente.persona.apellido}`
      : `Paciente #${i.id_paciente}`,
  }));

  if (filas.length === 0) return filas;

  const ids = filas.map((i) => i.id_inscripcion);
  const { data: pagos } = await supabaseAdmin
    .from('pago')
    .select('id_pago, id_inscripcion, monto, metodo_pago, comprobante, fecha_pago')
    .in('id_inscripcion', ids)
    .order('fecha_pago', { ascending: false });

  const pagoMap = new Map();
  for (const pago of pagos || []) {
    if (!pagoMap.has(pago.id_inscripcion)) pagoMap.set(pago.id_inscripcion, pago);
  }

  return filas.map((fila) => {
    const pago = pagoMap.get(fila.id_inscripcion) || null;
    return { ...fila, pago, id_pago: pago?.id_pago || null };
  });
}

// Detalle completo de una inscripción, para armar el comprobante en PDF.
export async function obtenerInscripcionParaComprobante(id_inscripcion) {
  const { data, error } = await supabaseAdmin
    .from('inscripcion')
    .select(`
      id_inscripcion,
      fecha_inscripcion,
      estado,
      id_paciente,
      id_area,
      area:id_area ( nombre_area, tipo_area ),
      paciente:id_paciente (
        persona:persona_id ( nombre, apellido, fecha_nac )
      )
    `)
    .eq('id_inscripcion', id_inscripcion)
    .maybeSingle();

  if (error) throw new Error(`Error al obtener la inscripción: ${error.message}`);
  if (!data) return null;

  // El CI vive en usuario, no en persona: lo resolvemos aparte.
  const { data: paciente } = await supabaseAdmin
    .from('paciente')
    .select('persona_id')
    .eq('id_paciente', data.id_paciente)
    .maybeSingle();

  let ci = '';
  if (paciente) {
    const { data: usuario } = await supabaseAdmin
      .from('usuario')
      .select('ci')
      .eq('persona_id', paciente.persona_id)
      .maybeSingle();
    ci = usuario?.ci || '';
  }

  return {
    id_inscripcion: data.id_inscripcion,
    fecha_inscripcion: data.fecha_inscripcion,
    estado: data.estado,
    facultad: data.area?.nombre_area || `Área #${data.id_area}`,
    tipo_area: data.area?.tipo_area || '',
    paciente_nombre_completo: data.paciente?.persona
      ? `${data.paciente.persona.nombre} ${data.paciente.persona.apellido}`
      : `Paciente #${data.id_paciente}`,
    ci,
  };
}
