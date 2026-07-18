// api/paciente/citas/cancelar.js
import { cancelarCita } from '../../../services/pacienteCitasService.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ ok: false, mensaje: 'Metodo no permitido.' });
  }

  try {
    const { id_paciente, id_cita } = req.body || {};
    const resultado = await cancelarCita(id_paciente, id_cita);
    return res.status(resultado.status).json(resultado);
  } catch (err) {
    console.error('Error en /api/paciente/citas/cancelar:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
}
