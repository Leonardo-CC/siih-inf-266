import { supabaseAdmin } from '../lib/supabaseAdmin.js';

function inicioFin(dias = 30) {
  const fin = new Date();
  const inicio = new Date();
  inicio.setDate(fin.getDate() - Number(dias || 30));
  return { inicio: inicio.toISOString(), fin: fin.toISOString() };
}

function monto(valor) {
  return Number(valor || 0);
}

export async function obtenerResumenFinanciero({ dias = 30 } = {}) {
  const { inicio, fin } = inicioFin(dias);

  const [{ data: facturas, error: errFacturas }, { data: movimientos, error: errMovimientos }, { data: lotes }] =
    await Promise.all([
      supabaseAdmin
        .from('factura')
        .select(`
          id_factura,
          id_pago,
          numero_factura,
          concepto,
          subtotal,
          iva,
          total,
          estado,
          fecha_emision,
          pago:id_pago (
            metodo_pago,
            id_receta,
            id_inscripcion,
            id_consulta
          )
        `)
        .gte('fecha_emision', inicio)
        .lte('fecha_emision', fin)
        .order('fecha_emision', { ascending: false }),
      supabaseAdmin
        .from('movimiento_financiero')
        .select('*')
        .gte('fecha_movimiento', inicio)
        .lte('fecha_movimiento', fin)
        .order('fecha_movimiento', { ascending: false }),
      supabaseAdmin
        .from('lote_medicamento')
        .select('id_lote, cantidad_inicial, fecha_ingreso, medicamento:id_medicamento(nombre, precio)')
        .gte('fecha_ingreso', inicio)
        .lte('fecha_ingreso', fin),
    ]);

  if (errFacturas) throw new Error(`Error obteniendo facturas: ${errFacturas.message}`);
  if (errMovimientos) throw new Error(`Error obteniendo movimientos financieros: ${errMovimientos.message}`);

  const ingresosFactura = (facturas || [])
    .filter((f) => f.estado !== 'anulada')
    .reduce((sum, f) => sum + monto(f.total), 0);

  const ingresosManual = (movimientos || [])
    .filter((m) => m.tipo === 'ingreso')
    .reduce((sum, m) => sum + monto(m.monto), 0);

  const egresosManual = (movimientos || [])
    .filter((m) => m.tipo === 'egreso')
    .reduce((sum, m) => sum + monto(m.monto), 0);

  const egresosInventarioEstimado = (lotes || []).reduce(
    (sum, l) => sum + monto(l.cantidad_inicial) * monto(l.medicamento?.precio),
    0
  );

  const porMetodo = {};
  const porCategoria = {};

  (facturas || []).forEach((f) => {
    if (f.estado === 'anulada') return;
    const metodo = f.pago?.metodo_pago || 'sin_metodo';
    const categoria = f.pago?.id_receta
      ? 'Farmacia'
      : f.pago?.id_inscripcion
      ? 'Inscripciones'
      : 'Consultas';
    porMetodo[metodo] = (porMetodo[metodo] || 0) + monto(f.total);
    porCategoria[categoria] = (porCategoria[categoria] || 0) + monto(f.total);
  });

  (movimientos || []).forEach((m) => {
    const categoria = m.categoria || (m.tipo === 'ingreso' ? 'Ingreso manual' : 'Egreso manual');
    porCategoria[categoria] = (porCategoria[categoria] || 0) + (m.tipo === 'ingreso' ? monto(m.monto) : -monto(m.monto));
  });

  const timeline = [
    ...(facturas || []).map((f) => ({
      id: `factura-${f.id_factura}`,
      fecha: f.fecha_emision,
      tipo: 'ingreso',
      categoria: f.pago?.id_receta ? 'Farmacia' : f.pago?.id_inscripcion ? 'Inscripciones' : 'Consultas',
      concepto: f.concepto || `Factura ${f.numero_factura}`,
      metodo_pago: f.pago?.metodo_pago || '-',
      monto: monto(f.total),
      estado: f.estado,
      id_pago: f.id_pago,
      numero_factura: f.numero_factura,
    })),
    ...(movimientos || []).map((m) => ({
      id: `mov-${m.id_movimiento}`,
      fecha: m.fecha_movimiento,
      tipo: m.tipo,
      categoria: m.categoria,
      concepto: m.concepto,
      metodo_pago: m.metodo_pago || '-',
      monto: monto(m.monto),
      estado: 'registrado',
      id_pago: null,
      numero_factura: null,
    })),
    ...(lotes || []).map((l) => ({
      id: `lote-${l.id_lote}`,
      fecha: l.fecha_ingreso,
      tipo: 'egreso_estimado',
      categoria: 'Inventario',
      concepto: `Compra/entrada estimada: ${l.medicamento?.nombre || 'Medicamento'}`,
      metodo_pago: '-',
      monto: monto(l.cantidad_inicial) * monto(l.medicamento?.precio),
      estado: 'estimado',
      id_pago: null,
      numero_factura: null,
    })),
  ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  return {
    resumen: {
      ingresos: ingresosFactura + ingresosManual,
      egresos: egresosManual + egresosInventarioEstimado,
      utilidad: ingresosFactura + ingresosManual - egresosManual - egresosInventarioEstimado,
      iva_debito: (facturas || []).filter((f) => f.estado !== 'anulada').reduce((sum, f) => sum + monto(f.iva), 0),
      facturas_emitidas: (facturas || []).filter((f) => f.estado !== 'anulada').length,
      egresos_inventario_estimado: egresosInventarioEstimado,
    },
    porMetodo: Object.entries(porMetodo).map(([nombre, total]) => ({ nombre, total })),
    porCategoria: Object.entries(porCategoria).map(([nombre, total]) => ({ nombre, total })),
    movimientos: timeline,
  };
}

export async function registrarMovimientoFinanciero(datos) {
  const { data, error } = await supabaseAdmin
    .from('movimiento_financiero')
    .insert([datos])
    .select('*')
    .single();

  if (error) throw new Error(`Error registrando movimiento financiero: ${error.message}`);
  return data;
}
