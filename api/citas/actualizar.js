// api/citas/actualizar.js
import { adminActualizarCita } from '../../services/citaService.js';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
    return res.status(405).json({ ok: false, mensaje: 'Método no permitido.' });
  }

  try {
    const { id_cita, ...rest } = req.body;
    const resultado = await adminActualizarCita(id_cita, rest);
    return res.status(resultado.status).json(resultado);
  } catch (err) {
    console.error('Error en /api/citas/actualizar:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
}
