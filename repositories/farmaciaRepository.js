// repositories/farmaciaRepository.js
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

export async function obtenerEstadisticasDashboard() {
  const hoy = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // 1. Usamos la vista que creamos para traer el catálogo y calcular alertas
  const { data: inventario, error: errInv } = await supabaseAdmin
    .from('vw_inventario')
    .select('stock_actual, stock_minimo');

  if (errInv) throw new Error(errInv.message);

  const totalMedicamentos = inventario ? inventario.length : 0;
  // Comparamos stock actual contra el mínimo para las alertas
  const alertasStock = inventario ? inventario.filter(m => m.stock_actual <= m.stock_minimo).length : 0;

  // 2. Contar lotes ingresados hoy
  const { count: ingresosHoy } = await supabaseAdmin
    .from('lote_medicamento')
    .select('*', { count: 'exact', head: true })
    .gte('fecha_ingreso', `${hoy}T00:00:00`)
    .lte('fecha_ingreso', `${hoy}T23:59:59`);

  // 3. Contar recetas emitidas hoy
  const { count: recetasDespachadas } = await supabaseAdmin
    .from('receta')
    .select('*', { count: 'exact', head: true })
    .gte('fecha_emision', `${hoy}T00:00:00`)
    .lte('fecha_emision', `${hoy}T23:59:59`);

  return {
    medicamentosVigentes: totalMedicamentos,
    stockBajo: alertasStock,
    ingresosHoy: ingresosHoy || 0,
    recetasDespachadas: recetasDespachadas || 0
  };
}