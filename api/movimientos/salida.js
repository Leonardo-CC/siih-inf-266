// api/movimientos/salida.js
// POST /api/movimientos/salida
// Registra salida/egreso de insumos y refleja el cambio en el inventario.
import { registrarSalida } from '../../services/movimientosService.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ ok: false, mensaje: 'Metodo no permitido.' });
  }
  try {
    const resultado = await registrarSalida(req.body || {});
    return res.status(resultado.status).json({
      ok: resultado.ok,
      mensaje: resultado.mensaje,
      ...resultado,
    });
  } catch (err) {
    console.error('Error en /api/movimientos/salida:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error interno al registrar la salida.' });
  }
}
