// api/farmacia/stock.js
// ============================================================
// Actualiza el stock mínimo y máximo de un medicamento.
// Roles permitidos: farmaceutico y administrativo (validado en el front).
//   GET  /api/farmacia/stock            -> lista medicamentos con stock
//   PUT  /api/farmacia/stock?id=...     -> actualiza stock_minimo / stock_maximo
// ============================================================
import * as svc from '../../services/catalogoService.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const resultado = await svc.obtenerMedicamentosStock();
      return res.status(200).json(resultado);
    }

    if (req.method === 'PUT') {
      const id = Number(req.query?.id ?? req.body?.id);
      if (!id) return res.status(400).json({ ok: false, mensaje: 'ID de medicamento requerido.' });
      const resultado = await svc.editarStockMedicamento(id, req.body || {});
      return res.status(resultado.status || 400).json(resultado);
    }

    res.setHeader('Allow', ['GET', 'PUT']);
    return res.status(405).json({ ok: false, mensaje: 'Método no permitido.' });
  } catch (err) {
    console.error('Error en /api/farmacia/stock:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
}
