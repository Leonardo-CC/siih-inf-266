// api/citas/medicos.js
// Uso: GET /api/citas/medicos?especialidad=Cardiología
import { listarMedicos } from '../../services/citaService.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ ok: false, mensaje: 'Método no permitido.' });
  }

  try {
    const { especialidad } = req.query;
    const resultado = await listarMedicos(especialidad);
    return res.status(resultado.status).json(resultado);
  } catch (err) {
    console.error('Error en /api/citas/medicos:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
}