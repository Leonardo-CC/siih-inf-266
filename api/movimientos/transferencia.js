// api/movimientos/transferencia.js
// POST /api/movimientos/transferencia
// Registra transferencia entre insumos y refleja el cambio en el inventario.
import { registrarTransferencia } from '../../services/movimientosService.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ ok: false, mensaje: 'Metodo no permitido.' });
  }
  try {
    const resultado = await registrarTransferencia(req.body || {});
    return res.status(resultado.status).json({
      ok: resultado.ok,
      mensaje: resultado.mensaje,
      ...resultado,
    });
  } catch (err) {
    console.error('Error en /api/movimientos/transferencia:', err);
    const mensaje = err?.message || 'Error interno al registrar la transferencia.';
    return res.status(500).json({ ok: false, mensaje, detalle: err?.message });
  }
}
