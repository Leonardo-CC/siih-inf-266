// api/paciente/dashboard.js
import { obtenerDashboardPaciente } from '../../services/pacienteDashboardService.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ ok: false, mensaje: 'Metodo no permitido.' });
  }

  try {
    const id_paciente = Number(req.query?.id_paciente);
    if (!id_paciente) {
      return res.status(400).json({ ok: false, mensaje: 'Falta el identificador del paciente.' });
    }
    const resultado = await obtenerDashboardPaciente(id_paciente);
    return res.status(resultado.status).json(resultado);
  } catch (err) {
    console.error('Error en /api/paciente/dashboard:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
}
