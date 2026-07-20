// api/movimientos/historial.js
// ============================================================
// HU-19: Historial informativo de existencias y despachos.
// Usa tablas existentes: lote_medicamento, medicamento, proveedor.
// ============================================================
import { obtenerExistencias } from '../../repositories/movimientosRepository.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, mensaje: 'Metodo no permitido.' });
  }

  try {
    const { tipo, id_medicamento } = req.query;

    const filtros = {};
    if (id_medicamento) filtros.id_medicamento = id_medicamento;

    const existencias = await obtenerExistencias(filtros);

    let movimientos = existencias.map(e => ({
      id: e.id,
      tipo: 'entrada',
      cantidad: e.entrada,
      salida: e.salida,
      medicamento: e.medicamento,
      lote: e.lote,
      proveedor: e.proveedor,
      fecha_ingreso: e.fecha_ingreso,
      fecha_vencimiento: e.fecha_vencimiento,
      stock_actual: e.stock_actual,
    }));

    if (tipo === 'salida') {
      movimientos = movimientos.filter(m => m.salida > 0);
    } else if (tipo === 'entrada') {
      movimientos = movimientos.filter(m => m.cantidad > 0);
    }

    return res.status(200).json({ ok: true, movimientos });
  } catch (error) {
    console.error('[movimientos/historial] Error:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al obtener historial.' });
  }
}
