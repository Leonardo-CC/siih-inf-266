// api/citas/horarios.js
// Uso: GET /api/citas/horarios?id_medico=3&fecha=2026-07-20
import { listarHorariosDisponibles } from '../../services/citaService.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ ok: false, mensaje: 'Método no permitido.' });
  }

  try {
    const { id_medico, fecha } = req.query;
    const resultado = await listarHorariosDisponibles({ id_medico, fecha });
    return res.status(resultado.status).json(resultado);
  } catch (err) {
    console.error('Error en /api/citas/horarios:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
}