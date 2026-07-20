// api/movimientos/entrada.js
// POST /api/movimientos/entrada
// Registra ingreso de insumos y refleja el cambio en el inventario.
import { registrarEntrada } from '../../services/movimientosService.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ ok: false, mensaje: 'Metodo no permitido.' });
  }
  try {
    const resultado = await registrarEntrada(req.body || {});
    return res.status(resultado.status).json({
      ok: resultado.ok,
      mensaje: resultado.mensaje,
      ...resultado,
    });
  } catch (err) {
    console.error('Error en /api/movimientos/entrada:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error interno al registrar la entrada.' });
  }
}
