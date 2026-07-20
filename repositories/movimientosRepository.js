// repositories/movimientosRepository.js
// ============================================================
// CAPA DE DATOS - Movimientos de insumos.
// Reutiliza tablas existentes: medicamento, lote_medicamento, proveedor.
// No crea tablas nuevas.
// ============================================================
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

// Obtener medicamento por id
export async function obtenerMedicamento(id_medicamento) {
  const { data, error } = await supabaseAdmin
    .from('medicamento')
    .select('id_medicamento, nombre, stock_actual, stock_minimo, stock_maximo')
    .eq('id_medicamento', id_medicamento)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data || null;
}

// Obtener lote por id
export async function obtenerLote(id_lote) {
  const { data, error } = await supabaseAdmin
    .from('lote_medicamento')
    .select('*')
    .eq('id_lote', id_lote)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data || null;
}

// Buscar lotes disponibles (cantidad_actual > 0) por medicamento, ordenados por vencimiento (FEFO)
export async function buscarLotesDisponibles(id_medicamento) {
  const { data, error } = await supabaseAdmin
    .from('lote_medicamento')
    .select('id_lote, cantidad_actual, cantidad_inicial, fecha_vencimiento')
    .eq('id_medicamento', id_medicamento)
    .gt('cantidad_actual', 0)
    .order('fecha_vencimiento', { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

// Actualizar stock global de medicamento (solo suma o resta, no reemplaza)
export async function ajustarStockMedicamento(id_medicamento, delta) {
  const { data: med, error: errMed } = await supabaseAdmin
    .from('medicamento')
    .select('stock_actual')
    .eq('id_medicamento', id_medicamento)
    .maybeSingle();
  if (errMed) throw new Error(errMed.message);
  if (!med) throw new Error('Medicamento no encontrado');

  const nuevoStock = Math.max(0, (med.stock_actual || 0) + delta);
  const { error: errUpdate } = await supabaseAdmin
    .from('medicamento')
    .update({ stock_actual: nuevoStock })
    .eq('id_medicamento', id_medicamento);
  if (errUpdate) throw new Error(errUpdate.message);
  return nuevoStock;
}

// Actualizar cantidad_actual de un lote especifico
export async function ajustarCantidadLote(id_lote, delta) {
  const { data: lote, error: errLote } = await supabaseAdmin
    .from('lote_medicamento')
    .select('cantidad_actual')
    .eq('id_lote', id_lote)
    .maybeSingle();
  if (errLote) throw new Error(errLote.message);
  if (!lote) throw new Error('Lote no encontrado');

  const nuevaCantidad = Math.max(0, (lote.cantidad_actual || 0) + delta);
  const { error: errUpdate } = await supabaseAdmin
    .from('lote_medicamento')
    .update({ cantidad_actual: nuevaCantidad })
    .eq('id_lote', id_lote);
  if (errUpdate) throw new Error(errUpdate.message);
  return nuevaCantidad;
}

// Insertar nuevo lote
export async function insertarLote({
  id_medicamento,
  id_proveedor,
  numero_lote,
  cantidad,
  fecha_vencimiento,
}) {
  const { data, error } = await supabaseAdmin
    .from('lote_medicamento')
    .insert([{
      id_medicamento,
      id_proveedor,
      numero_lote,
      cantidad_inicial: cantidad,
      cantidad_actual: cantidad,
      fecha_vencimiento,
    }])
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

// Obtener proveedor por id
export async function obtenerProveedor(id_proveedor) {
  const { data, error } = await supabaseAdmin
    .from('proveedor')
    .select('*')
    .eq('id_proveedor', id_proveedor)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data || null;
}

// Listar proveedores
export async function listarProveedores() {
  const { data, error } = await supabaseAdmin
    .from('proveedor')
    .select('id_proveedor, nombre')
    .order('nombre');
  if (error) throw new Error(error.message);
  return data || [];
}

// Listar medicamentos
export async function listarMedicamentos() {
  const { data, error } = await supabaseAdmin
    .from('medicamento')
    .select('id_medicamento, nombre, stock_actual, stock_minimo, stock_maximo')
    .order('nombre');
  if (error) throw new Error(error.message);
  return data || [];
}

// Listar lotes por medicamento (para selects/combos)
export async function listarLotesPorMedicamento(id_medicamento) {
  const { data, error } = await supabaseAdmin
    .from('lote_medicamento')
    .select('id_lote, numero_lote, cantidad_actual, cantidad_inicial, fecha_vencimiento')
    .eq('id_medicamento', id_medicamento)
    .order('fecha_vencimiento', { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

// Obtener historial de existencias desde tablas existentes
// Cada lote representa una entrada; la diferencia entre cantidad_inicial y cantidad_actual son las salidas/despachos
export async function obtenerExistencias(filtros = {}) {
  let query = supabaseAdmin
    .from('lote_medicamento')
    .select(`
      id_lote,
      numero_lote,
      cantidad_inicial,
      cantidad_actual,
      fecha_vencimiento,
      created_at,
      id_medicamento,
      id_proveedor,
      medicamento:medicamento_id_medicamento_fkey(nombre),
      proveedor:proveedor_id_proveedor_fkey(nombre)
    `)
    .order('created_at', { ascending: false })
    .limit(filtros.limit || 200);

  if (filtros.id_medicamento) {
    query = query.eq('id_medicamento', Number(filtros.id_medicamento));
  }
  if (filtros.id_proveedor) {
    query = query.eq('id_proveedor', Number(filtros.id_proveedor));
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data || []).map(l => ({
    id: l.id_lote,
    lote: l.numero_lote,
    medicamento: l.medicamento?.nombre || 'Desconocido',
    proveedor: l.proveedor?.nombre || '-',
    entrada: l.cantidad_inicial,
    salida: Math.max(0, (l.cantidad_inicial || 0) - (l.cantidad_actual || 0)),
    stock_actual: l.cantidad_actual || 0,
    fecha_vencimiento: l.fecha_vencimiento,
    fecha_ingreso: l.created_at,
  }));
}
