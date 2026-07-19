// api/citas/eliminar.js
import { adminEliminarCita } from '../../services/citaService.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ ok: false, mensaje: 'Método no permitido.' });
  }

  try {
    const { id_cita } = req.body;
    if (!id_cita) {
      return res.status(400).json({ ok: false, mensaje: 'ID de cita requerido.' });
    }

    const resultado = await adminEliminarCita(id_cita);
    return res.status(resultado.status).json(resultado);
  } catch (err) {
    console.error('Error en /api/citas/eliminar:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
}
