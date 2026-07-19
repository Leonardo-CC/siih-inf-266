// api/medico/prescripcion.js
import { registrarPrescripcionMedico } from '../../services/medicoService.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ ok: false, mensaje: 'Metodo no permitido.' });
  }

  try {
    const { id_consulta, id_medico } = req.body || {};
    const resultado = await registrarPrescripcionMedico(Number(id_consulta) || null, Number(id_medico) || null, req.body);
    return res.status(resultado.status).json(resultado);
  } catch (err) {
    console.error('Error en /api/medico/prescripcion:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
}
