// api/dashboard/stats.js
import { obtenerEstadisticas } from '../../services/dashboardService.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ ok: false, mensaje: 'Metodo no permitido.' });
  }

  try {
    const usuario = req.body?.usuario;
    if (!usuario) {
      return res.status(401).json({ ok: false, mensaje: 'No autorizado.' });
    }

    const stats = await obtenerEstadisticas(usuario.rol, usuario);
    return res.status(200).json({ ok: true, stats });
  } catch (err) {
    console.error('Error en /api/dashboard/stats:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
}
