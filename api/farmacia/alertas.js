// api/farmacia/alertas.js
// Consulta para obtener medicamentos con problemas
const obtenerAlertas = async () => {
  // 1. Buscar Bajo Stock
  const { data: bajoStock, error: errStock } = await supabaseAdmin
    .from('medicamento')
    .select('nombre, stock_actual, stock_minimo')
    .lt('stock_actual', 'stock_minimo'); // Filtra donde stock_actual < stock_minimo

  // 2. Buscar Lotes por Vencer (ejemplo: en los próximos 30 días)
  // Usamos una fecha calculada en JavaScript para pasarla a la BD
  const fechaLimite = new Date();
  fechaLimite.setDate(fechaLimite.getDate() + 30);
  const fechaFormateada = fechaLimite.toISOString().split('T')[0];

  const { data: porVencer, error: errVencer } = await supabaseAdmin
    .from('lote_medicamento')
    .select('numero_lote, fecha_vencimiento, medicamento(nombre)')
    .lte('fecha_vencimiento', fechaFormateada) // Filtra fechas menores a 30 días
    .gt('cantidad_actual', 0); // Solo lotes que aún tengan pastillas

  return {
    bajoStock: bajoStock || [],
    porVencer: porVencer || []
  };
};